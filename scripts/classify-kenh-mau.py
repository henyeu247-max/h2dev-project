# -*- coding: utf-8 -*-
"""Phan loai LIVE / DEAD / EMPTY / UNRESOLVED tu bang chung JSONL cua probe-kenh-mau.py.

CHI DOC: _audit/<ngay>-kenh-mau-probe.jsonl + data-tabs/kenh-mau.json
Ghi: _audit/<ngay>-kenh-mau-classify.json (state tung kenh, ly do, so sanh voi trang thai dang luu)

Nguyen tac (khong doan):
  LIVE : trang kenh 200 + ytInitialData.externalId khop channel_dossier.channelId + co video (RSS>0 hoac yt-dlp tra ra id)
         hoac (handle luu la @UC...) truy cap theo /channel/UC... 200 + RSS>0 + yt-dlp tra video
  DEAD : trang kenh 404 VA channel_dossier 404 VA yt-dlp khong tra video (it nhat 2 nguon doc lap + yt-dlp khong phan bac)
  EMPTY: kenh ton tai (http+dossier khop id) nhung RSS 0 entry, yt-dlp khong co video, videoCount 0/Unknown
  UNRESOLVED: moi truong hop con lai (mau thuan, loi mang, consent, alert...) -> KHONG doi du lieu

Chay: py -3 scripts/classify-kenh-mau.py [--in PATH] [--out PATH]
"""
import json
import os
import re
import sys
import unicodedata
from collections import Counter
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TODAY = datetime.now().strftime("%Y%m%d")


def norm_handle(h):
    return unicodedata.normalize("NFC", (h or "").lstrip("@")).lower()


def http_live(x):
    return bool(x and x.get("status") == 200 and x.get("hasInitialData") and x.get("externalId")
                and not x.get("consent"))


def video_count(txt):
    """'82 video' -> 82; 'Unknown'/None -> None (khong biet); '1 video' -> 1."""
    if not txt:
        return None
    m = re.match(r"\s*([\d.,]+)\s*(video|videos)?", str(txt))
    if not m or not re.search(r"\d", m.group(1)):
        return None
    return int(re.sub(r"[.,\s]", "", m.group(1)))


def ytdlp_state(y):
    if not y:
        return None
    if y.get("err"):
        return "error"
    rc = y.get("returncode")
    err = (y.get("stderrLast") or "").lower()
    if rc == 0 and y.get("firstVideo"):
        return "video"
    if rc == 0:
        return "empty"
    if "does not have a videos tab" in err or "this channel has no videos" in err:
        return "empty"
    if "404" in err or "not found" in err or "does not exist" in err:
        return "404"
    return "error"


def classify(row):
    h, d, y, r, bi = row["http"], row["dossier"], row.get("ytdlp"), row.get("rss"), row.get("httpById")
    why = []
    flags = []
    live_h = http_live(h)
    live_bi = http_live(bi)
    dead_h = h.get("status") == 404 and (bi is None or bi.get("status") == 404)
    live_d = bool(d.get("channelId")) and not d.get("isError")
    dead_d = bool(d.get("isError")) and d.get("httpCode") == 404
    ys = ytdlp_state(y)
    rss_n = (r or {}).get("entries")
    vc = video_count(d.get("videoCount"))
    if h.get("alerts"):
        flags.append("alert:" + "|".join(a.get("text", "")[:60] for a in h["alerts"]))
    if h.get("consent"):
        flags.append("consent_page")

    if live_h and live_d:
        if h["externalId"] != d["channelId"]:
            return "UNRESOLVED", ["externalId != dossier.channelId"], flags
        if (rss_n or 0) > 0 or ys == "video":
            why.append(f"http200+dossier khop id; rss={rss_n}; ytdlp={ys}")
            return "LIVE", why, flags
        if rss_n == 0 and ys in (None, "empty") and (vc in (None, 0)):
            return "EMPTY", [f"http200+dossier khop id; rss=0; ytdlp={ys}; videoCount={d.get('videoCount')}"], flags
        return "UNRESOLVED", [f"ton tai nhung khong ro co video: rss={rss_n} ytdlp={ys} videoCount={d.get('videoCount')}"], flags
    if live_h and not live_d and not dead_d and (rss_n or 0) > 0 and ys == "video":
        flags.append("dossier_tool_error:" + (d.get("errText") or "")[:60].replace("\n", " "))
        return "LIVE", [f"http200 externalId={h['externalId']}; rss={rss_n}; ytdlp=video; dossier loi tool (khong phai 404)"], flags
    if live_bi and not live_h and (rss_n or 0) > 0 and ys == "video":
        flags.append("stored_handle_is_channel_id")
        return "LIVE", [f"theo ID /channel/{bi['externalId']}: http200; rss={rss_n}; ytdlp=video; handle luu @UC... khong hop le"], flags
    if dead_h and dead_d and ys in ("404", "error", None, "empty") and not (rss_n or 0):
        if ys == "404":
            return "DEAD", ["http404 + dossier404 + ytdlp404"], flags
        return "UNRESOLVED", [f"http404+dossier404 nhung ytdlp={ys} (thieu xac nhan thu 3)"], flags
    if dead_h and dead_d and (rss_n or 0) > 0:
        return "UNRESOLVED", ["http404+dossier404 nhung RSS co entry — mau thuan"], flags
    return "UNRESOLVED", [f"tin hieu khong thong nhat: http={h.get('status')} hasData={h.get('hasInitialData')} "
                         f"dossierErr={d.get('isError')}/{d.get('httpCode')} rss={rss_n} ytdlp={ys} "
                         f"err={h.get('err') or d.get('transportErr')}"], flags


def stored_state(c):
    if c.get("dead") is True:
        return "EMPTY" if c.get("deadKind") == "empty" else "DEAD"
    if c.get("dead") is False:
        return "LIVE"
    return "LIVE?"  # chua gan co dead (giao dien coi la song)


def main():
    a = sys.argv[1:]
    src = os.path.join(ROOT, "_audit", TODAY + "-kenh-mau-probe.jsonl")
    out = os.path.join(ROOT, "_audit", TODAY + "-kenh-mau-classify.json")
    if "--in" in a:
        src = a[a.index("--in") + 1]
    if "--out" in a:
        out = a[a.index("--out") + 1]
    km = json.load(open(os.path.join(ROOT, "data-tabs", "kenh-mau.json"), encoding="utf-8"))
    rows = {}
    for line in open(src, encoding="utf-8"):
        try:
            j = json.loads(line)
            rows[j["handle"]] = j
        except Exception:
            pass
    res = []
    for c in km:
        row = rows.get(c["handle"])
        if not row:
            res.append({"handle": c["handle"], "state": "NOT_MEASURED", "stored": stored_state(c)})
            continue
        st, why, flags = classify(row)
        d = row["dossier"]
        item = {"handle": c["handle"], "state": st, "stored": stored_state(c), "why": why, "flags": flags,
                "channelId": row.get("channelId"), "title": row["http"].get("title") or d.get("title"),
                "subsText": d.get("subscribers"), "videoCountText": d.get("videoCount"),
                "rssEntries": (row.get("rss") or {}).get("entries"),
                "lastUpload": (row.get("rss") or {}).get("latestPublished"),
                "signals": [k for k in ("http", "httpById", "dossier", "rss", "ytdlp") if row.get(k)],
                "measuredAt": row["ts"]}
        dh = d.get("handle")
        if dh and norm_handle(dh) != norm_handle(c["handle"]):
            item["flags"].append("handle_changed:" + dh)
        res.append(item)
    cnt = Counter(r["state"] for r in res)
    flips = [r for r in res if r["state"] in ("LIVE", "DEAD", "EMPTY")
             and r["stored"].rstrip("?") != r["state"]]
    summary = {"total": len(res), "byState": dict(cnt),
               "byStored": dict(Counter(r["stored"] for r in res)),
               "flips": len(flips)}
    json.dump({"generatedFrom": os.path.basename(src), "summary": summary, "items": res},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False))
    for r in flips:
        print(f"  FLIP {r['stored']:>5} -> {r['state']:<5} {r['handle']}  {r['why'][0][:110]}")
    for r in res:
        if r["state"] == "UNRESOLVED":
            print(f"  UNRES {r['handle']}  {r['why'][0][:140]}")
        for f in r.get("flags", []):
            if f.startswith(("handle_changed", "alert", "stored_handle", "consent")):
                print(f"  FLAG  {r['handle']}  {f[:120]}")


if __name__ == "__main__":
    main()
