# -*- coding: utf-8 -*-
"""
ĐO KHÁCH QUAN: với mỗi segment bị thay chú thích, đo mức âm lượng trung bình
(mean_volume) và đỉnh (max_volume) trong đúng khoảng thời gian.
- Nếu gần như im lặng (mean < -50 dB)  -> đúng là KHOẢNG LẶNG -> chú thích hợp lệ
- Nếu có tiếng nói rõ (mean > -35 dB)  -> là CÂU THẬT -> chú thích SAI, phải khôi phục
Xuất JSON + md.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")

CASES = [
    ("VIDEO-3df94e", 59), ("VIDEO-5d54d0", 1285), ("VIDEO-5d54d0", 495),
    ("VIDEO-199f44", 6), ("VIDEO-199f44", 15), ("VIDEO-199f44", 32),
    ("VIDEO-2de9e4", 89), ("VIDEO-9f9fbc", 407),
    ("VIDEO-bdfa54", 416), ("VIDEO-bdfa54", 454),
    ("VIDEO-c1bd51", 116), ("VIDEO-3ae732", 67),
]


def measure(video, start, dur):
    cmd = [FFMPEG, "-hide_banner", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-af", "volumedetect", "-f", "null", "-"]
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    txt = r.stderr.decode("utf-8", "ignore")
    mean = re.search(r"mean_volume:\s*(-?[\d.]+) dB", txt)
    mx = re.search(r"max_volume:\s*(-?[\d.]+) dB", txt)
    return (float(mean.group(1)) if mean else None,
            float(mx.group(1)) if mx else None)


rows = []
for sku, sid in CASES:
    d = json.load(open(ROOT / "video" / sku / "transcript.json", encoding="utf-8"))
    seg = [s for s in d["segments"] if s["id"] == sid][0]
    video = ROOT / "video" / sku / f"{sku}.mp4"
    start = float(seg["start"])
    dur = max(1.0, float(seg["end"]) - start)
    mean, mx = measure(video, start, dur)
    rows.append({"sku": sku, "id": sid, "start": seg["start_time"],
                 "dur": round(dur, 1), "mean": mean, "max": mx,
                 "text": seg["text"][:60]})

json.dump(rows, open(ROOT / "_tmp_audio" / "vol.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

lines = []
for r in rows:
    verdict = "?"
    if r["mean"] is not None:
        verdict = "KHOANG LANG (chu thich dung)" if r["mean"] < -50 else \
                  ("CO TIENG (chu thich SAI?)" if r["mean"] > -35 else "mo ho")
    lines.append(f"{r['sku']} #{r['id']} @ {r['start']} dur={r['dur']}s  "
                 f"mean={r['mean']} dB  max={r['max']} dB  -> {verdict}")
open(ROOT / "scripts" / "_vol.md", "w", encoding="utf-8").write("\n".join(lines))
print("WROTE", len(rows))
