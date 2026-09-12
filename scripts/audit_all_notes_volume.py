# -*- coding: utf-8 -*-
"""
RÀ TOÀN BỘ 160 segment đã bị thay chú thích.
Đo mức âm lượng thực tế để phân loại:
  - IM LẶNG (mean < -45 dB)  -> chú thích "khoảng lặng" là ĐÚNG
  - CÓ TIẾNG (mean >= -45)   -> chú thích SAI, cần khôi phục
Xuất JSON đầy đủ + md tóm tắt.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")
BK = ROOT / "_backup" / "20260912-pre-full-fix" / "transcripts"


def measure(video, start, dur):
    cmd = [FFMPEG, "-hide_banner", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-af", "volumedetect", "-f", "null", "-"]
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    txt = r.stderr.decode("utf-8", "ignore")
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", txt)
    x = re.search(r"max_volume:\s*(-?[\d.]+) dB", txt)
    return (float(m.group(1)) if m else None, float(x.group(1)) if x else None)


rows = []
for sku_dir in sorted(BK.iterdir()):
    if not sku_dir.is_dir():
        continue
    sku = sku_dir.name
    cur_p = ROOT / "video" / sku / "transcript.json"
    bk_p = sku_dir / "transcript.json"
    if not cur_p.exists() or not bk_p.exists():
        continue
    cur = json.load(open(cur_p, encoding="utf-8")).get("segments", [])
    bk = {s["id"]: s.get("text", "") for s in
          json.load(open(bk_p, encoding="utf-8")).get("segments", [])}
    video = ROOT / "video" / sku / f"{sku}.mp4"
    if not video.exists():
        for ext in (".webm",):
            if (ROOT / "video" / sku / f"{sku}{ext}").exists():
                video = ROOT / "video" / sku / f"{sku}{ext}"
                break
    for s in cur:
        t = s.get("text", "")
        if not (t.startswith("[Khoảng lặng") or t.startswith("[Đoạn nói nhanh")):
            continue
        orig = bk.get(s["id"], "?")
        mean, mx = measure(video, float(s["start"]), max(1.0, float(s["end"]) - float(s["start"])))
        rows.append({"sku": sku, "id": s["id"], "start_time": s.get("start_time"),
                     "dur": round(float(s["end"]) - float(s["start"]), 1),
                     "mean": mean, "max": mx, "note": t[:30], "orig": orig})

json.dump(rows, open(ROOT / "_tmp_audio" / "notes_vol.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

silent = [r for r in rows if r["mean"] is not None and r["mean"] < -45]
speech = [r for r in rows if r["mean"] is not None and r["mean"] >= -45]
lines = [f"TONG {len(rows)} | IM LANG {len(silent)} | CO TIENG {len(speech)}", ""]
lines.append("### CO TIENG (chu thich SAI - can khoi phuc):")
for r in sorted(speech, key=lambda x: x["mean"], reverse=True):
    lines.append(f"{r['sku']} #{r['id']} @ {r['start_time']} dur={r['dur']}s mean={r['mean']} | GOC: {r['orig'][:90]}")
open(ROOT / "scripts" / "_notes_vol.md", "w", encoding="utf-8").write("\n".join(lines))
print(f"TONG {len(rows)} | IM LANG {len(silent)} | CO TIENG {len(speech)}")
