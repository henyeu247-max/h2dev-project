# -*- coding: utf-8 -*-
"""
BÓC TÁCH PHẦN PHỤ ĐỀ CÒN THIẾU (đuôi video)
============================================
Với mỗi video, xác định khoảng thời gian chưa có phụ đề (từ last_end -> hết),
cắt audio thành từng đoạn 5 phút, bóc bằng whisper-large-v3 (verbose_json),
ghép segment (đã cộng offset), lọc ảo giác, rồi ghi vào transcript.{json,srt,txt}.
"""
import re
import json
import subprocess
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")
FFPROBE = "D:/Linly-Dubbing/bin/ffprobe.exe"

spec = importlib.util.spec_from_file_location(
    "batch", ROOT / "scripts" / "batch_restore_all_videos.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩị"
             "oòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")


def is_hall(t):
    low = t.lower()
    return any(h in low for h in [
        "la la school", "ghiền mì gõ", "subscribe cho kênh",
        "nhận thêm bản ghi", "bản ghi của mình trong phần bình luận",
        "các mục tiêu của youtube", "nhớ like, share và đăng ký kênh",
    ])


def is_compressed(t):
    toks = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(toks) < 6:
        return False
    s = sum(1 for x in toks if len(x) <= 2) / len(toks)
    nv = sum(1 for x in toks if not any(c in VOWELS for c in x.lower())) / len(toks)
    return s >= 0.75 and nv >= 0.40


def fmt(sec):
    sec = max(0.0, float(sec))
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def probe(v):
    return float(subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(v)]).decode().strip())


def write_out(sku, segs):
    vp = ROOT / "video" / sku
    d = json.load(open(vp / "transcript.json", encoding="utf-8"))
    for i, s in enumerate(segs, 1):
        s["id"] = i
    d["segments"] = segs
    d["full_text"] = " ".join(s["text"] for s in segs)
    json.dump(d, open(vp / "transcript.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    lines = []
    for i, s in enumerate(segs, 1):
        lines.append(str(i) + "\n")
        lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
        lines.append(s["text"] + "\n\n")
    open(vp / "transcript.srt", "w", encoding="utf-8").writelines(lines)
    open(vp / "transcript.txt", "w", encoding="utf-8").write(
        "\n".join(s["text"] for s in segs) + "\n")


def main():
    batch.KEYS = batch.load_valid_keys()
    work = ROOT / "_tmp_audio" / "tail.mp3"
    CHUNK = 300.0

    targets = ["VIDEO-c1bd51", "VIDEO-f59aa7"]
    for sku in targets:
        vp = ROOT / "video" / sku
        v = None
        for e in (".mp4", ".webm"):
            if (vp / f"{sku}{e}").exists():
                v = vp / f"{sku}{e}"
                break
        dur = probe(v)
        d = json.load(open(vp / "transcript.json", encoding="utf-8"))
        segs = d["segments"]
        last = max(float(s.get("end", 0)) for s in segs)
        start = last
        print(f"\n=== {sku} | real={dur:.0f}s | last_sub={last:.0f}s | can boc {dur-last:.0f}s")
        new_segs = []
        t = start
        while t < dur - 1:
            length = min(CHUNK, dur - t)
            subprocess.run([FFMPEG, "-y", "-ss", str(round(t, 2)), "-t", str(round(length, 2)),
                            "-i", str(v), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
                            "-f", "mp3", str(work)],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            res = batch.whisper(work)
            got = 0
            for sg in res.get("segments", []):
                txt = re.sub(r"\s{2,}", " ", (sg.get("text") or "").strip())
                if not txt or is_hall(txt) or is_compressed(txt):
                    continue
                st = t + float(sg.get("start", 0))
                en = t + float(sg.get("end", 0))
                new_segs.append({"start": round(st, 2), "end": round(en, 2),
                                 "start_time": fmt(st), "end_time": fmt(en), "text": txt})
                got += 1
            print(f"   [{t:.0f}s +{length:.0f}s] -> {got} segment")
            t += CHUNK

        if new_segs:
            allsegs = segs + new_segs
            allsegs.sort(key=lambda x: float(x["start"]))
            write_out(sku, allsegs)
            print(f"   => da them {len(new_segs)} segment, tong {len(allsegs)}")
        else:
            print("   => khong boc duoc segment moi")


if __name__ == "__main__":
    main()
