# -*- coding: utf-8 -*-
"""Tái bóc tách 2 segment lỗi trong phần đuôi mới thêm."""
import re
import json
import subprocess
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = "D:/Linly-Dubbing/bin/ffmpeg.exe"

spec = importlib.util.spec_from_file_location(
    "batch", ROOT / "scripts" / "batch_restore_all_videos.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)
batch.KEYS = batch.load_valid_keys()
work = ROOT / "_tmp_audio" / "tailfix.mp3"

NOTE = "[Đoạn nói nhanh — phụ đề không bóc tách được rõ nghĩa, mời nghe trực tiếp]"
VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩị"
             "oòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")
HALL = ["la la school", "ghiền mì gõ", "subscribe cho kênh", "hãy đăng ký kênh để ủng hộ kênh",
        "để tìm hiểu thêm nhiều thông tin", "các bạn có thể tìm ra",
        "nhận thêm bản ghi", "nhớ like, share và đăng ký kênh"]


def is_hall(t):
    low = t.lower()
    return any(h in low for h in HALL)


def is_compressed(t):
    toks = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(toks) < 6:
        return False
    s = sum(1 for x in toks if len(x) <= 2) / len(toks)
    nv = sum(1 for x in toks if not any(c in VOWELS for c in x.lower())) / len(toks)
    return s >= 0.75 and nv >= 0.40


# (sku, id) -> tìm theo thời gian
TARGETS = {"VIDEO-c1bd51": "00:14:11", "VIDEO-f59aa7": "00:13:39"}

for sku, ts in TARGETS.items():
    vp = ROOT / "video" / sku
    v = None
    for e in (".mp4", ".webm"):
        if (vp / f"{sku}{e}").exists():
            v = vp / f"{sku}{e}"
            break
    d = json.load(open(vp / "transcript.json", encoding="utf-8"))
    segs = d["segments"]
    for s in segs:
        if s["start_time"].startswith(ts):
            start = float(s["start"])
            dur = min(28.0, float(s["end"]) - start)
            subprocess.run([FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
                            "-i", str(v), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
                            "-f", "mp3", str(work)],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            res = batch.whisper(work)
            new = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())
            print(f"{sku} @ {ts}")
            print(f"   GOC  : {s['text']}")
            print(f"   BOC  : {new}")
            if new and not is_hall(new) and not is_compressed(new) and len(new) >= 10:
                s["text"] = new
                print("   => DUNG BAN BOC LAI")
            else:
                s["text"] = NOTE
                print("   => THAY CHU THICH")
            print()
            break
    d["full_text"] = " ".join(x["text"] for x in segs)
    json.dump(d, open(vp / "transcript.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    lines = []
    for i, x in enumerate(segs, 1):
        lines.append(str(i) + "\n")
        lines.append(x["start_time"] + " --> " + x["end_time"] + "\n")
        lines.append(x["text"] + "\n\n")
    open(vp / "transcript.srt", "w", encoding="utf-8").writelines(lines)
    open(vp / "transcript.txt", "w", encoding="utf-8").write(
        "\n".join(x["text"] for x in segs) + "\n")
