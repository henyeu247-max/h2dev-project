# -*- coding: utf-8 -*-
"""Xác minh với cửa sổ DÀI (20s trước) — ngữ cảnh tối đa để quyết định."""
import json
import subprocess
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")

spec = importlib.util.spec_from_file_location(
    "batch", ROOT / "scripts" / "batch_restore_all_videos.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)
batch.KEYS = batch.load_valid_keys()

work = ROOT / "_tmp_audio" / "verify3.mp3"
out = []

CASES = [
    ("VIDEO-2277b3", 66, 20.0, 4.0),
    ("VIDEO-2ba0d1", 80, 20.0, 4.0),
    ("VIDEO-83a28e", 40, 20.0, 4.0),
]

for sku, sid, back, fwd in CASES:
    d = json.load(open(ROOT / "video" / sku / "transcript.json", encoding="utf-8"))
    seg = [s for s in d["segments"] if s["id"] == sid][0]
    s_from = max(0.0, float(seg["start"]) - back)
    s_to = float(seg["end"]) + fwd
    subprocess.run([FFMPEG, "-y", "-ss", str(round(s_from, 3)), "-t", str(round(s_to - s_from, 3)),
                    "-i", str(ROOT / "video" / sku / f"{sku}.mp4"),
                    "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", "-f", "mp3", str(work)],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    res = batch.whisper(work)
    out.append({
        "sku": sku, "id": sid,
        "window": f"{s_from:.1f}..{s_to:.1f}",
        "current": seg["text"],
        "relisten": (res.get("text") or "").strip(),
    })

with open(ROOT / "_tmp_audio" / "verify3.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

lines = []
for x in out:
    lines.append("SKU " + x["sku"] + " SEG " + str(x["id"]) + " WIN " + x["window"])
    lines.append("CURRENT: " + x["current"])
    lines.append("RELISTEN: " + x["relisten"])
    lines.append("")
open(ROOT / "scripts" / "_verify3.md", "w", encoding="utf-8").write("\n".join(lines))
print("WROTE")
