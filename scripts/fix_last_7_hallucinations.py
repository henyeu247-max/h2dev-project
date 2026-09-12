# -*- coding: utf-8 -*-
"""
XỬ LÝ 7 SEGMENT ẢO GIÁC CÒN LẠI (có tiếng nói thật bên dưới)
=============================================================
Mẫu: "Các bạn có thể xem video này (trên kênh ...)"
Quy trình: tái bóc tách -> nếu ra câu thật thì dùng; nếu không thì cắt cụm ảo giác
giữ phần nội dung thật; cuối cùng mới thay chú thích.
"""
import re
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

PREFIX = re.compile(
    r"^\s*Các bạn có thể xem video này(?:\s+trên kênh (?:YouTube|Youtube|của mình))?[\s,.]+",
    re.IGNORECASE)

NOTE_SILENT = "[Khoảng lặng thao tác — tác giả thao tác trên màn hình]"

HALL_TEMPLATES = [
    "la la school", "ghiền mì gõ", "subscribe cho kênh",
    "các bạn có thể xem video này", "các bạn có thể nhận thêm",
    "nhận thêm bản ghi", "nhận thêm nhiều thông tin",
    "bản ghi của mình trong phần bình luận", "các mục tiêu của youtube",
    "hãy xem video này", "nhớ like, share và đăng ký kênh",
]


def is_hall(t):
    low = t.lower()
    return any(h in low for h in HALL_TEMPLATES)


def short_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def coherent(t):
    return bool(t) and len(t) >= 8 and short_ratio(t) < 0.55


TARGETS = {
    "VIDEO-21956b": [176], "VIDEO-5785a5": [46], "VIDEO-70f1f1": [43],
    "VIDEO-DD983D": [214], "VIDEO-2277b3": [66], "VIDEO-2ba0d1": [80],
    "VIDEO-83a28e": [40],
}


def main():
    batch.KEYS = batch.load_valid_keys()
    work = ROOT / "_tmp_audio" / "fix7.mp3"

    for sku, ids in TARGETS.items():
        vp = ROOT / "video" / sku
        d = json.load(open(vp / "transcript.json", encoding="utf-8"))
        segs = d["segments"]
        changed = False
        for s in segs:
            if s["id"] not in ids:
                continue
            orig = s["text"]
            start = float(s["start"])
            dur = min(25.0, float(s["end"]) - start)
            vpath = None
            for ext in (".mp4", ".webm"):
                if (vp / f"{sku}{ext}").exists():
                    vpath = vp / f"{sku}{ext}"
                    break
            new = ""
            if vpath:
                subprocess.run([FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
                                "-i", str(vpath), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
                                "-f", "mp3", str(work)],
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                res = batch.whisper(work)
                new = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())

            stripped = PREFIX.sub("", orig).strip()
            if stripped:
                stripped = stripped[0].upper() + stripped[1:]

            if coherent(new) and not is_hall(new):
                final, how = new, "BOC_LAI"
            elif coherent(stripped) and not is_hall(stripped):
                final, how = stripped, "CAT_CUM_AO_GIAC"
            else:
                final, how = NOTE_SILENT, "CHU_THICH"
            s["text"] = final
            changed = True
            print(f"{sku} #{s['id']}: [{how}]")
            print(f"    GOC  : {orig}")
            print(f"    BOC  : {new[:140]}")
            print(f"    =>   : {final[:140]}")
            print()

        if changed:
            d["full_text"] = " ".join(x.get("text", "") for x in segs)
            json.dump(d, open(vp / "transcript.json", "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
            lines = []
            for i, x in enumerate(segs, 1):
                lines.append(str(i) + "\n")
                lines.append(x["start_time"] + " --> " + x["end_time"] + "\n")
                lines.append(x.get("text", "") + "\n\n")
            open(vp / "transcript.srt", "w", encoding="utf-8").writelines(lines)
            open(vp / "transcript.txt", "w", encoding="utf-8").write(
                "\n".join(x.get("text", "") for x in segs) + "\n")


if __name__ == "__main__":
    main()
