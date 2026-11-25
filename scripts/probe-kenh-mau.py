# -*- coding: utf-8 -*-
"""Do thuc te kenh YouTube — CHI DO, KHONG SUA DATA.

Moi kenh ghi 1 dong JSONL (bang chung tho) vao _audit/<ngay>-kenh-mau-probe.jsonl:
  http   : GET trang kenh (status, URL cuoi, externalId, title, vanityUrl, ogImage, subsText, videoCountText, alerts, consent)
  dossier: youtube_intelligence.channel_dossier qua MCP Pool :3988 (optional/fallback khi --fast)
  rss    : feeds/videos.xml?channel_id=UC... (so entry + ngay dang moi nhat) — tin hieu doc lap
  ytdlp  : chi chay khi can xac nhan DEAD/EMPTY (bo qua neu --no-ytdlp)

Resumable: handle da co trong file JSONL se bi bo qua (tru khi --force). Co throttle + backoff 429.
Ho tro --handles @a,@b hoac --handles-file PATH (cho phep do ca handle chua co trong kenh-mau.json).

Chay:
  py -3 scripts/probe-kenh-mau.py [--limit N] [--handles @a,@b] [--handles-file PATH]
                                  [--out PATH] [--timeout 7] [--throttle 0.3] [--workers 4] [--fast]
"""
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KM_PATH = os.path.join(ROOT, "data-tabs", "kenh-mau.json")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
HDR = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9",
       "Cookie": "CONSENT=YES+1; SOCS=CAI"}
WRITE_LOCK = threading.Lock()


def mcp_key():
    k = os.environ.get("MCP_POOL_API_KEY", "")
    if k:
        return k
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("MCP_POOL_API_KEY="):
                return line.split("=", 1)[1].strip().strip("\"'")
    return ""


KEY = mcp_key()


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def quote(url):
    return urllib.parse.quote(url, safe=":/@?=&%")


def fetch(url, timeout=8, tries=2):
    """Tra ve (status, final_url, body_text|None, err|None). Backoff 429/5xx."""
    last_err = None
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(quote(url), headers=HDR), timeout=timeout)
            return r.status, r.geturl(), r.read().decode("utf-8", "ignore"), None
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and i < tries - 1:
                time.sleep(3 * (i + 1) * (2 if e.code == 429 else 1))
                continue
            return e.code, url, None, None
        except Exception as e:  # mang/timeout
            last_err = type(e).__name__ + ": " + str(e)[:120]
            if i < tries - 1:
                time.sleep(1.5 * (i + 1))
    return None, url, None, last_err


def parse_initial_data(html):
    m = re.search(r"(?:var\s+ytInitialData|window\[['\"]ytInitialData['\"]\])\s*=\s*(\{)", html)
    if not m:
        return None
    try:
        obj, _ = json.JSONDecoder().raw_decode(html, m.start(1))
        return obj
    except Exception:
        return None


def extract_header_stats(data):
    subs_text = None
    video_text = None
    if not isinstance(data, dict):
        return subs_text, video_text
    hdr = data.get("header") or {}
    ph = (hdr.get("pageHeaderRenderer") or {}).get("content", {}).get("pageHeaderViewModel", {})
    rows = ((ph.get("metadata") or {}).get("contentMetadataViewModel") or {}).get("metadataRows") or []
    parts = [p.get("text", {}).get("content") for row in rows for p in (row.get("metadataParts") or [])]
    for part in parts:
        if not part:
            continue
        low = str(part).lower()
        if "subscriber" in low and not subs_text:
            subs_text = str(part).strip()
        elif "video" in low and not video_text:
            video_text = str(part).strip()
    if not subs_text:
        c4 = hdr.get("c4TabbedHeaderRenderer") or {}
        st = (c4.get("subscriberCountText") or {}).get("simpleText")
        if st:
            subs_text = st
        vt = (c4.get("videosCountText") or {}).get("runs") or []
        if vt and not video_text:
            video_text = "".join(x.get("text", "") for x in vt).strip()
    return subs_text, video_text


def http_probe(url, timeout=8, tries=2):
    st, final, body, err = fetch(url, timeout=timeout, tries=tries)
    out = {"url": url, "status": st, "finalUrl": final, "err": err, "bytes": len(body) if body else 0}
    if body is None:
        return out
    out["consent"] = "consent.youtube.com" in (final or "") or "consent.google" in (final or "")
    og = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', body, re.I)
    if og:
        out["ogImage"] = og.group(1)
    data = parse_initial_data(body)
    out["hasInitialData"] = data is not None
    if data:
        md = (data.get("metadata") or {}).get("channelMetadataRenderer") or {}
        out["externalId"] = md.get("externalId")
        out["title"] = md.get("title")
        out["vanityUrl"] = md.get("vanityChannelUrl")
        subs_text, video_text = extract_header_stats(data)
        if subs_text:
            out["subsText"] = subs_text
        if video_text:
            out["videoCountText"] = video_text
        alerts = []
        for a in data.get("alerts") or []:
            r = a.get("alertRenderer") or {}
            txt = (r.get("text") or {}).get("simpleText") or "".join(
                x.get("text", "") for x in (r.get("text") or {}).get("runs", []))
            alerts.append({"type": r.get("type"), "text": txt[:200]})
        out["alerts"] = alerts
    m = re.search(r'<link rel="canonical" href="([^"]+)"', body)
    out["canonical"] = m.group(1) if m else None
    if not out.get("externalId") and out.get("canonical"):
        cm = re.search(r"/channel/(UC[\w-]{20,})", out["canonical"])
        if cm:
            out["externalId"] = cm.group(1)
    return out


def mcp_call(tool, args, timeout=15):
    if not KEY:
        return {"isError": True, "text": "missing MCP_POOL_API_KEY"}
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": tool, "arguments": args}}).encode()
    req = urllib.request.Request("http://127.0.0.1:3988/mcp", data=body, headers={
        "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "X-API-Key": KEY})
    try:
        res = json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode())
    except Exception as e:
        return {"transportErr": type(e).__name__ + ": " + str(e)[:120]}
    r = res.get("result") or {}
    text = ""
    for c in r.get("content") or []:
        if c.get("type") == "text":
            text += c.get("text", "")
    return {"isError": bool(r.get("isError")) or text.startswith("[MCP Self-Healing Error]"),
            "text": text, "rpcError": res.get("error")}


def dossier_probe(handle, timeout=15):
    r = mcp_call("youtube_intelligence__channel_dossier", {"channel": handle}, timeout=timeout)
    out = {"isError": r.get("isError"), "transportErr": r.get("transportErr")}
    text = r.get("text") or ""
    if r.get("isError") or not text:
        out["errText"] = text[:300]
        m = re.search(r"HTTP (\d{3})", text)
        out["httpCode"] = int(m.group(1)) if m else None
        return out
    try:
        j = json.loads(text)
        for k in ("channelId", "title", "handle", "subscribers", "videoCount"):
            out[k] = j.get(k)
    except Exception:
        out["raw"] = text[:300]
    return out


def rss_probe(channel_id, timeout=7):
    st, final, body, err = fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel_id, timeout=timeout, tries=2)
    out = {"status": st, "err": err}
    if body:
        try:
            ns = {"a": "http://www.w3.org/2005/Atom"}
            root = ET.fromstring(body)
            ents = root.findall("a:entry", ns)
            out["entries"] = len(ents)
            pubs = [e.findtext("a:published", default="", namespaces=ns) for e in ents]
            out["latestPublished"] = max(pubs) if pubs else None
            out["feedTitle"] = root.findtext("a:title", default=None, namespaces=ns)
        except Exception as e:
            out["parseErr"] = str(e)[:80]
    return out


def ytdlp_probe(url, timeout=18):
    try:
        r = subprocess.run(
            [sys.executable, "-m", "yt_dlp", "--flat-playlist", "--playlist-items", "1",
             "--socket-timeout", "8", "--retries", "1", "--print", "%(id)s", "--", quote(url) + "/videos"],
            capture_output=True, text=True, timeout=timeout, cwd=ROOT)
    except Exception as e:
        return {"err": type(e).__name__ + ": " + str(e)[:100]}
    err = (r.stderr or "").strip().splitlines()
    return {"returncode": r.returncode, "firstVideo": (r.stdout or "").strip().splitlines()[:1],
            "stderrLast": err[-1][:200] if err else ""}


def probe(rec, timeout=8, fast=False, no_dossier=False, no_ytdlp=False):
    handle = rec["handle"]
    url = rec.get("url") or f"https://www.youtube.com/{handle}"
    known_cid = rec.get("channelId")
    row = {"handle": handle, "storedUrl": url, "ts": now()}
    h = http_probe(url, timeout=timeout, tries=2)
    row["http"] = h

    h_live = bool(h.get("status") == 200 and h.get("hasInitialData") and h.get("externalId") and not h.get("consent"))

    # Handle dang @UCxxxx hoac da biet channelId ma HTTP @handle tra 404: thu them /channel/UCxxxx
    bare = handle.lstrip("@")
    probe_cid_url = None
    if re.fullmatch(r"UC[\w-]{22}", bare):
        probe_cid_url = "https://www.youtube.com/channel/" + bare
    elif known_cid and re.fullmatch(r"UC[\w-]{20,}", str(known_cid)) and not h_live:
        probe_cid_url = "https://www.youtube.com/channel/" + str(known_cid)
    if probe_cid_url:
        row["httpById"] = http_probe(probe_cid_url, timeout=timeout, tries=2)

    if no_dossier or (fast and h_live and h.get("subsText") is not None):
        row["dossier"] = {"skipped": True}
    else:
        row["dossier"] = dossier_probe(handle, timeout=max(timeout + 6, 12))

    cid = (h.get("externalId")
           or (row["dossier"].get("channelId") if isinstance(row["dossier"], dict) else None)
           or (row.get("httpById") or {}).get("externalId")
           or known_cid)
    row["channelId"] = cid
    if cid:
        row["rss"] = rss_probe(cid, timeout=timeout)

    d_live = bool(row["dossier"].get("channelId")) and not row["dossier"].get("isError")
    rss_n = (row.get("rss") or {}).get("entries")
    if not no_ytdlp:
        need_ytdlp = (not h_live and not d_live) or (h_live and (rss_n is None or rss_n == 0))
        if fast and h_live and (rss_n or 0) > 0:
            need_ytdlp = False
        if fast and h.get("status") == 404 and not row.get("httpById") and not known_cid:
            # 404 direct handle check: only verify with ytdlp if not skipped
            need_ytdlp = True
        if need_ytdlp:
            target_url = "https://www.youtube.com/channel/" + bare if re.fullmatch(r"UC[\w-]{22}", bare) else url
            row["ytdlp"] = ytdlp_probe(target_url, timeout=18)
    return row


def done_handles(path):
    s = set()
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            try:
                s.add(json.loads(line)["handle"].lower())
            except Exception:
                pass
    return s


def load_targets(only_handles, handles_file):
    km = json.load(open(KM_PATH, encoding="utf-8"))
    by_norm = {c["handle"].lstrip("@").lower(): c for c in km if c.get("handle")}
    targets = []
    if handles_file:
        with open(handles_file, encoding="utf-8") as f:
            for line in f:
                t = line.strip()
                if not t:
                    continue
                if t.startswith("{"):
                    obj = json.loads(t)
                    h = obj["handle"]
                    if not h.startswith("@"):
                        h = "@" + h
                    targets.append({
                        "handle": h,
                        "url": obj.get("url") or f"https://www.youtube.com/{h}",
                        "channelId": obj.get("channelId")
                    })
                else:
                    h = t if t.startswith("@") else "@" + t
                    rec = by_norm.get(h.lstrip("@").lower())
                    targets.append(rec if rec else {"handle": h, "url": f"https://www.youtube.com/{h}"})
    elif only_handles is not None:
        for h_raw in only_handles:
            h = h_raw.strip()
            if not h:
                continue
            if not h.startswith("@"):
                h = "@" + h
            rec = by_norm.get(h.lstrip("@").lower())
            targets.append(rec if rec else {"handle": h, "url": f"https://www.youtube.com/{h}"})
    else:
        targets = km
    return targets


def main():
    args = sys.argv[1:]
    out = os.path.join(ROOT, "_audit", datetime.now().strftime("%Y%m%d") + "-kenh-mau-probe.jsonl")
    limit = None
    only = None
    handles_file = None
    timeout = 8
    fast = "--fast" in args
    no_dossier = "--no-dossier" in args
    no_ytdlp = "--no-ytdlp" in args
    throttle = 0.25 if fast else 1.2
    workers = 1

    def arg_val(flag):
        if flag in args:
            idx = args.index(flag)
            if idx + 1 < len(args):
                return args[idx + 1]
        return None

    if arg_val("--out"):
        out = os.path.abspath(os.path.join(ROOT, arg_val("--out")))
    if arg_val("--limit"):
        limit = int(arg_val("--limit"))
    if arg_val("--handles"):
        only = [x.strip() for x in arg_val("--handles").split(",") if x.strip()]
    if arg_val("--handles-file"):
        handles_file = arg_val("--handles-file")
    if arg_val("--timeout"):
        timeout = int(arg_val("--timeout"))
    if arg_val("--throttle"):
        throttle = float(arg_val("--throttle"))
    if arg_val("--workers"):
        workers = max(1, int(arg_val("--workers")))

    if not KEY and not (fast or no_dossier):
        print("[LOI] khong co MCP_POOL_API_KEY (dung --fast hoac --no-dossier de chay HTTP+RSS)"); sys.exit(2)
    os.makedirs(os.path.dirname(out), exist_ok=True)

    targets = load_targets(only, handles_file)
    skip = set() if "--force" in args else done_handles(out)
    todo = [c for c in targets if c["handle"].lower() not in skip]
    if limit:
        todo = todo[:limit]

    print(f"[probe] targets={len(targets)} da_co={len(skip)} se_do={len(todo)} workers={workers} fast={fast} -> {out}", flush=True)
    if not todo:
        print("[probe] XONG (0 can do)", flush=True)
        return

    counter = {"n": 0}
    total = len(todo)

    def run_one(rec):
        row = probe(rec, timeout=timeout, fast=fast, no_dossier=no_dossier, no_ytdlp=no_ytdlp)
        with WRITE_LOCK:
            counter["n"] += 1
            idx = counter["n"]
            with open(out, "a", encoding="utf-8") as f:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
            if idx % 25 == 0 or idx == total or idx <= 5:
                h = row["http"]
                print(f"[{idx}/{total}] {rec['handle']} http={h.get('status')} id={'Y' if h.get('externalId') else '-'} "
                      f"rss={(row.get('rss') or {}).get('entries')} subs={h.get('subsText') or '-'}", flush=True)
        if throttle > 0:
            time.sleep(throttle)
        return row

    if workers == 1:
        for rec in todo:
            run_one(rec)
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
            list(ex.map(run_one, todo))

    print("[probe] XONG", flush=True)


if __name__ == "__main__":
    main()
