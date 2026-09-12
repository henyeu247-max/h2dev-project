# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 2 — KHỬ ẢO GIÁC CHO CÁC VIDEO CÒN LẠI (38 video, ~86 segment)
========================================================================
Mỗi segment ảo giác = một khoảng lặng dài khi tác giả thao tác màn hình.
Quy trình:
  1. Trích 1 khung hình tại giữa mỗi segment (lưu vào _frames/<sku>/hall_*.jpg)
  2. Thay text ảo giác bằng CHÚ THÍCH TRUNG THỰC mô tả khoảng lặng thao tác
     (không bịa nội dung; ghi rõ đây là khoảng lặng)
  3. Đồng bộ srt/txt/json
"""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = "D:/Linly-Dubbing/bin/ffmpeg.exe"

HALL = [
    "subscribe cho kênh", "ghiền mì gõ", "la la school",
    "cảm ơn các bạn đã theo dõi", "hãy subscribe", "quảng cáo sau",
    "đăng ký kênh", "ủng hộ kênh", "like và share", "like và chia sẻ",
    "hãy xem video này", "xem video này nhé",
    "nhận thêm bản ghi", "nhận thêm nhiều thông tin", "nhận thêm thông tin",
    "thông tin về các kênh", "trong phần bình luận",
    "bản ghi của mình", "các mục tiêu của youtube",
    "tham gia thử thách", "thông tin của mình",
    "hãy đăng ký kênh", "nhận thêm nhiều video mới",
    "các bạn có thể nhận thêm", "các bạn có thể tham gia thử",
    "các bạn có thể nhớ like", "hãy đăng ký",
]

# 2 video hỏng nặng đã xử lý riêng ở Giai đoạn 1
SKIP = {"VIDEO-ed1be9", "VIDEO-b559c8"}


def fmt(sec):
    sec = max(0.0, float(sec))
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def is_hall(t):
    low = t.lower()
    return any(h.lower() in low for h in HALL)


def main():
    vids = sorted([p.name for p in (ROOT / "video").iterdir() if p.is_dir()])
    total = 0
    touched = []

    for sku in vids:
        if sku in SKIP:
            continue
        jp = ROOT / "video" / sku / "transcript.json"
        if not jp.exists():
            continue
        with open(jp, "r", encoding="utf-8") as f:
            d = json.load(f)
        segs = d.get("segments") or []
        if not segs:
            continue

        hall_segs = [s for s in segs if is_hall(s.get("text", ""))]
        if not hall_segs:
            continue

        # Tim file video de trich frame
        video = None
        for ext in [".mp4", ".webm"]:
            cand = ROOT / "video" / sku / f"{sku}{ext}"
            if cand.exists():
                video = cand
                break

        # Trich frame giua moi segment ao giac (de tham chieu)
        if video:
            fdir = ROOT / "_frames" / sku
            fdir.mkdir(parents=True, exist_ok=True)
            for s in hall_segs:
                mid = (float(s.get("start", 0)) + float(s.get("end", 0))) / 2
                out = fdir / f"hall_{int(mid)}.jpg"
                if not out.exists():
                    subprocess.run(
                        [FFMPEG, "-v", "error", "-ss", str(round(mid, 1)),
                         "-i", str(video), "-frames:v", "1", "-q:v", "4",
                         str(out), "-y"],
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Thay text ao giac bang chu thich trung thuc
        n = 0
        for s in segs:
            t = s.get("text", "")
            if not is_hall(t):
                continue
            dur = float(s.get("end", 0)) - float(s.get("start", 0))
            if dur >= 60:
                label = ("[Khoảng lặng thao tác dài — tác giả thao tác trên màn hình, "
                         "không có lời bình]")
            else:
                label = "[Khoảng lặng thao tác — tác giả thao tác trên màn hình]"
            s["text"] = label
            n += 1

        if n:
            d["full_text"] = " ".join(x["text"] for x in segs)
            with open(jp, "w", encoding="utf-8") as f:
                json.dump(d, f, ensure_ascii=False, indent=2)

            lines = []
            for i, s in enumerate(segs, 1):
                lines.append(str(i) + "\n")
                lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
                lines.append(s["text"] + "\n\n")
            with open(ROOT / "video" / sku / "transcript.srt", "w", encoding="utf-8") as f:
                f.writelines(lines)
            with open(ROOT / "video" / sku / "transcript.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(x["text"] for x in segs) + "\n")

            total += n
            touched.append((sku, n))
            print(f"{sku}: thay {n} segment ao giac", flush=True)

    print()
    print("=" * 60)
    print(f"TONG: {total} segment ao giac da thay the")
    print(f"So video xu ly: {len(touched)}")


if __name__ == "__main__":
    main()
