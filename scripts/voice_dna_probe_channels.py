# -*- coding: utf-8 -*-
"""Probe N/N tat ca kenh chua co voice sample — xac dinh dead/live bang channel listing.
Xuat: data/voice-dna-probe-final.json
"""
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import sqlite3

db = sqlite3.connect(ROOT / "data" / "h2dev_master.db")
rows = db.execute(
    "SELECT COALESCE(raw_id, channel_id) AS slot, handle FROM competitor_channels WHERE has_voice_sample = 0"
).fetchall()
db.close()

YT = sys.executable
results = []
for slot, handle in rows:
    handle = (handle or "").strip()
    if not handle:
        results.append({"slot": slot, "handle": handle, "state": "NO_HANDLE"})
        continue
    url = f"https://www.youtube.com/@{handle}/videos"
    r = subprocess.run(
        [YT, "-m", "yt_dlp", "--flat-playlist", "--playlist-items", "1",
         "--socket-timeout", "15", "--retries", "1", "--print", "%(id)s", url],
        capture_output=True, text=True, timeout=120)
    out = (r.stdout or "").strip()
    err = (r.stderr or "")
    if r.returncode == 0 and out:
        # Lay video dau tien co duration de dam bao la video thuong
        results.append({"slot": slot, "handle": handle, "state": "LIVE",
                        "firstVideo": out.splitlines()[0]})
    elif "Requested entity was not found" in err or "404" in err:
        results.append({"slot": slot, "handle": handle, "state": "CHANNEL_DELETED_404"})
    else:
        results.append({"slot": slot, "handle": handle, "state": "OTHER_ERROR",
                        "err": err.strip().splitlines()[-1][:120] if err else "?"})
    print(f"{slot} {handle} -> {results[-1]['state']}", flush=True)

out_path = ROOT / "data" / "voice-dna-probe-final.json"
out_path.write_text(json.dumps({
    "date": "2026-09-29",
    "method": "yt-dlp flat-playlist playlist-items 1 (channel listing probe)",
    "results": results,
    "summary": {
        k: sum(1 for r in results if r["state"] == k)
        for k in {r["state"] for r in results}
    },
}, ensure_ascii=False, indent=1), encoding="utf-8")
print("PROBE-DONE:", out_path)
