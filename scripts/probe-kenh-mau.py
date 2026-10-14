# -*- coding: utf-8 -*-
"""Do thuc te N/N kenh trong data-tabs/kenh-mau.json — CHI DO, KHONG SUA DATA.

Moi kenh ghi 1 dong JSONL (bang chung tho) vao _audit/<ngay>-kenh-mau-probe.jsonl:
  http   : GET trang kenh (status, URL cuoi, externalId, title, canonical handle, alerts, consent)
  dossier: youtube_intelligence.channel_dossier qua MCP Pool :3988 (subs/videoCount dang chu goc)
  rss    : feeds/videos.xml?channel_id=UC... (so entry + ngay dang moi nhat) — tin hieu doc lap thu 3
  ytdlp  : chi chay khi http + dossier KHONG cung khang dinh LIVE (xac nhan DEAD / giai mau thuan)

Resumable: handle da co trong file JSONL se bi bo qua. Co throttle + backoff 429.
Phan loai (LIVE/DEAD/EMPTY/UNRESOLVED) lam o buoc rieng tu JSONL, khong nam o day.

Chay: py -3 scripts/probe-kenh-mau.py [--limit N] [--handles @a,@b] [--out PATH]
"""
import json
import os
import re
import subprocess
import sys
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
THROTTLE = 1.2


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


def fetch(url, timeout=25, tries=3):
    """Tra ve (status, final_url, body_text|None, err|None). Backoff 429/5xx."""
    last_err = None
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(quote(url), headers=HDR), timeout=timeout)
            return r.status, r.geturl(), r.read().decode("utf-8", "ignore"), None
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and i < tries - 1:
                time.sleep(5 * (i + 1) * (3 if e.code == 429 else 1))
                continue
            return e.code, url, None, None
        except Exception as e:  # mang/timeout
            last_err = type(e).__name__ + ": " + str(e)[:120]
            time.sleep(2 * (i + 1))
    return None, url, None, last_err


def parse_initial_data(html):
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def http_probe(url):
    st, final, body, err = fetch(url)
    out = {"url": url, "status": st, "finalUrl": final, "err": err, "bytes": len(body) if body else 0}
    if body is None:
        return out
    out["consent"] = "consent.youtube.com" in (final or "") or "consent.google" in (final or "")
    data = parse_initial_data(body)
    out["hasInitialData"] = data is not None
    if data:
        md = (data.get("metadata") or {}).get("channelMetadataRenderer") or {}
        out["externalId"] = md.get("externalId")
        out["title"] = md.get("title")
        out["vanityUrl"] = md.get("vanityChannelUrl")
        alerts = []
        for a in data.get("alerts") or []:
            r = a.get("alertRenderer") or {}
            txt = (r.get("text") or {}).get("simpleText") or "".join(
                x.get("text", "") for x in (r.get("text") or {}).get("runs", []))
            alerts.append({"type": r.get("type"), "text": txt[:200]})
        out["alerts"] = alerts
    m = re.search(r'<link rel="canonical" href="([^"]+)"', body)
    out["canonical"] = m.group(1) if m else None
    return out


def mcp_call(tool, args, timeout=60):
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


def dossier_probe(handle):
    r = mcp_call("youtube_intelligence__channel_dossier", {"channel": handle})
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


def rss_probe(channel_id):
    st, final, body, err = fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel_id, tries=2)
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


def ytdlp_probe(url):
    try:
        r = subprocess.run(
            [sys.executable, "-m", "yt_dlp", "--flat-playlist", "--playlist-items", "1",
             "--socket-timeout", "15", "--retries", "1", "--print", "%(id)s", quote(url) + "/videos"],
            capture_output=True, text=True, timeout=120, cwd=ROOT)
    except Exception as e:
        return {"err": type(e).__name__ + ": " + str(e)[:100]}
    err = (r.stderr or "").strip().splitlines()
    return {"returncode": r.returncode, "firstVideo": (r.stdout or "").strip().splitlines()[:1],
            "stderrLast": err[-1][:200] if err else ""}


def probe(rec):
    handle = rec["handle"]
    url = rec["url"]
    row = {"handle": handle, "storedUrl": url, "ts": now()}
    row["http"] = http_probe(url)
    row["dossier"] = dossier_probe(handle)
    # Handle dang @UCxxxx: thu them /channel/UCxxxx (truy cap bang ID that)
    bare = handle.lstrip("@")
    if re.fullmatch(r"UC[\w-]{22}", bare):
        row["httpById"] = http_probe("https://www.youtube.com/channel/" + bare)
    cid = (row["dossier"].get("channelId") or row["http"].get("externalId")
           or (row.get("httpById") or {}).get("externalId"))
    row["channelId"] = cid
    if cid:
        row["rss"] = rss_probe(cid)
    h_live = row["http"].get("status") == 200 and row["http"].get("hasInitialData") and row["http"].get("externalId")
    d_live = bool(row["dossier"].get("channelId")) and not row["dossier"].get("isError")
    rss_n = (row.get("rss") or {}).get("entries")
    # yt-dlp khi: khong cung khang dinh LIVE, HOAC feed RSS rong/loi (kenh rong hay chi la feed khong tra)
    if not (h_live and d_live) or not rss_n:
        row["ytdlp"] = ytdlp_probe(url if not row.get("httpById") else "https://www.youtube.com/channel/" + bare)
    return row


def done_handles(path):
    s = set()
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            try:
                s.add(json.loads(line)["handle"])
            except Exception:
                pass
    return s


def main():
    args = sys.argv[1:]
    out = os.path.join(ROOT, "_audit", datetime.now().strftime("%Y%m%d") + "-kenh-mau-probe.jsonl")
    limit = None
    only = None
    if "--out" in args:
        out = args[args.index("--out") + 1]
    if "--limit" in args:
        limit = int(args[args.index("--limit") + 1])
    if "--handles" in args:
        only = set(args[args.index("--handles") + 1].split(","))
    if not KEY:
        print("[LOI] khong co MCP_POOL_API_KEY"); sys.exit(2)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    km = json.load(open(KM_PATH, encoding="utf-8"))
    todo = [c for c in km if (only is None or c["handle"] in only)]
    skip = set() if "--force" in args else done_handles(out)
    todo = [c for c in todo if c["handle"] not in skip]
    if limit:
        todo = todo[:limit]
    print(f"[probe] tong={len(km)} da_co={len(skip)} se_do={len(todo)} -> {out}", flush=True)
    for i, rec in enumerate(todo, 1):
        row = probe(rec)
        with open(out, "a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        h = row["http"]
        print(f"[{i}/{len(todo)}] {rec['handle']} http={h.get('status')} id={'Y' if h.get('externalId') else '-'} "
              f"dossier={'ERR' if row['dossier'].get('isError') else 'OK'} "
              f"rss={(row.get('rss') or {}).get('status')} ytdlp={'Y' if 'ytdlp' in row else '-'}", flush=True)
        time.sleep(THROTTLE)
    print("[probe] XONG", flush=True)


if __name__ == "__main__":
    main()
