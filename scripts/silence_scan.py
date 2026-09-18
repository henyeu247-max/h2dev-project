# -*- coding: utf-8 -*-
"""
silence_scan.py — Quet khoang lang toan bo video bang ffmpeg silencedetect.

Muc dich: cung cap bang chung "khoang trong phu de la IM LANG THAT hay la MAT NOI DUNG".
Day la lop kiem tra con thieu cua audit cu (xem CHANGELOG 2026-09-18).

Chay: py scripts/silence_scan.py                 (toan bo 136)
      py scripts/silence_scan.py VIDEO-f59aa7    (1 SKU)
Output: _audit/20260918-full-136-audit/silence.json
"""
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = r"D:\Linly-Dubbing\bin\ffmpeg.exe"
VIDEO_DIR = os.path.join(ROOT, "video")
OUT_DIR = os.path.join(ROOT, "_audit", "20260918-full-136-audit")
OUT_PATH = os.path.join(OUT_DIR, "silence.json")

NOISE_DB = -35      # nguong coi la "khong co tieng dong"
MIN_D = 2.5         # khoang lang >= 2.5s moi ghi nhan
WORKERS = 6


def media_path(sku):
    for ext in (".mp4", ".webm"):
        p = os.path.join(VIDEO_DIR, sku, sku + ext)
        if os.path.exists(p):
            return p
    return None


def scan_one(sku):
    path = media_path(sku)
    if not path:
        return sku, {"error": "missing media"}
    try:
        proc = subprocess.run(
            [FFMPEG, "-hide_banner", "-i", path,
             "-af", "silencedetect=noise=%ddB:d=%s" % (NOISE_DB, MIN_D),
             "-f", "null", "-"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1800)
        text = proc.stderr.decode("utf-8", "ignore")
    except subprocess.TimeoutExpired:
        return sku, {"error": "timeout"}
    except Exception as exc:  # noqa: BLE001
        return sku, {"error": str(exc)[:120]}

    starts = []
    durs = []
    for line in text.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].strip().split()[0]))
        elif "silence_duration:" in line:
            durs.append(float(line.split("silence_duration:")[1].strip().split()[0]))

    regions = []
    for i, start in enumerate(starts):
        dur = durs[i] if i < len(durs) else None
        regions.append({
            "start": round(start, 2),
            "duration": round(dur, 2) if dur is not None else None,
            "end": round(start + dur, 2) if dur is not None else None,
        })
    total = round(sum(r["duration"] or 0 for r in regions), 2)
    return sku, {
        "noise_db": NOISE_DB,
        "min_duration": MIN_D,
        "silence_regions": regions,
        "silence_count": len(regions),
        "silence_total_sec": total,
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    if only:
        skus = only
    else:
        skus = sorted(d for d in os.listdir(VIDEO_DIR)
                      if os.path.isdir(os.path.join(VIDEO_DIR, d)))

    existing = {}
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, "r", encoding="utf-8") as fh:
                existing = json.load(fh).get("videos", {})
        except Exception:  # noqa: BLE001
            existing = {}

    todo = [s for s in skus if s not in existing or "error" in existing.get(s, {})]
    print("silence_scan: %d SKU can quet (tong %d, da co %d)"
          % (len(todo), len(skus), len(existing)), flush=True)

    def flush():
        tmp = OUT_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump({
                "schema": "h2dev.silence-scan.v1",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "noise_db": NOISE_DB,
                "min_duration": MIN_D,
                "workers": WORKERS,
                "total": len(existing),
                "videos": existing,
            }, fh, ensure_ascii=False, indent=1)
        os.replace(tmp, OUT_PATH)

    t0 = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for sku, data in pool.map(scan_one, todo):
            existing[sku] = data
            done += 1
            flag = data.get("error") or ("%d khoang lang / %.0fs"
                                         % (data.get("silence_count", 0),
                                            data.get("silence_total_sec", 0)))
            print("  [%3d/%3d] %-40s %s" % (done, len(todo), sku, flag), flush=True)
            if done % 10 == 0:      # checkpoint: khong mat ket qua neu bi ngat
                flush()
    flush()
    print("Xong %d SKU trong %.1fs -> %s" % (done, time.time() - t0, OUT_PATH))


if __name__ == "__main__":
    main()
