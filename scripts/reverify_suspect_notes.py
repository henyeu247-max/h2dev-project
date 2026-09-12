# -*- coding: utf-8 -*-
"""
TÁI BÓC TÁCH 15 SEGMENT NGHI NGỜ (có tiếng nói) để phân định THẬT / ẢO GIÁC.
Với mỗi segment: cắt audio đúng khoảng (tối đa 25s) + whisper prompt + temp=0.
Xuất JSON so sánh: text gốc (backup) vs text bóc lại.
"""
import json
import subprocess
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")
BK = ROOT / "_backup" / "20260912-pre-full-fix" / "transcripts"

spec = importlib.util.spec_from_file_location(
    "batch", ROOT / "scripts" / "batch_restore_all_videos.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)
batch.KEYS = batch.load_valid_keys()
work = ROOT / "_tmp_audio" / "reverify.mp3"

rows = json.load(open(ROOT / "_tmp_audio" / "notes_classified.json", encoding="utf-8"))
SUSPECT = [r for r in rows if r["group"] == "CAU_THAT"]
# them 5 doan Ghiền Mì Gõ co tieng
for r in rows:
    if r["group"] == "AO_GIAC_CHANNEL" and r["mean"] is not None and r["mean"] > -50:
        SUSPECT.append(r)

out = []
for r in SUSPECT:
    sku, sid = r["sku"], r["id"]
    cur = json.load(open(ROOT / "video" / sku / "transcript.json", encoding="utf-8"))
    seg = [s for s in cur["segments"] if s["id"] == sid][0]
    start = float(seg["start"])
    dur = min(25.0, float(seg["end"]) - start)
    vpath = None
    for ext in (".mp4", ".webm", ".mkv"):
        if (ROOT / "video" / sku / f"{sku}{ext}").exists():
            vpath = ROOT / "video" / sku / f"{sku}{ext}"
            break
    if vpath is None:
        print("SKIP (no video)", sku, flush=True)
        continue
    subprocess.run([FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
                    "-i", str(vpath),
                    "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", "-f", "mp3", str(work)],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    res = batch.whisper(work)
    out.append({"sku": sku, "id": sid, "start_time": r["start_time"],
                "dur": r["dur"], "mean": r["mean"],
                "orig": r["orig"], "relisten": (res.get("text") or "").strip()})

json.dump(out, open(ROOT / "_tmp_audio" / "reverify.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
lines = []
for x in out:
    lines.append(f"{x['sku']} #{x['id']} @ {x['start_time']} dur={x['dur']} mean={x['mean']}")
    lines.append(f"  GOC    : {x['orig']}")
    lines.append(f"  BOCLAI : {x['relisten']}")
    lines.append("")
open(ROOT / "scripts" / "_reverify.md", "w", encoding="utf-8").write("\n".join(lines))
print("WROTE", len(out))
