# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 1 — DỰNG LẠI TIMELINE 2 VIDEO "SILENT SCREEN TUTORIAL" HỎNG NẶNG
==========================================================================
VIDEO-ed1be9: 59 phút, nói thật 0:00–1:13, còn lại Whisper ảo giác 114 segment
VIDEO-b559c8: 24 phút, nói thật 0:00–0:19, còn lại Whisper ảo giác  48 segment

Phương pháp: trích khung hình (FFmpeg) mỗi 90–120s → phân tích quy trình thao tác
thực tế trên màn hình → dựng lại timeline phụ đề dạng CHƯƠNG (chapter) trung thực.

Giữ nguyên đoạn nói thật; thay toàn bộ khối ảo giác bằng các mốc chương có chú thích.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def fmt(sec):
    sec = max(0.0, float(sec))
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# ---------------------------------------------------------------------------
# VIDEO-ed1be9 — Tư duy edit key hoạt hình bằng Photopea + CapCut (59 phút)
# Phân tích khung hình:
#   f_200/320  : Photopea vẽ nền (bầu trời, mây, đồi cỏ, cây) bằng brush
#   f_800      : Nhân vật stick figure đang được transform (nhiều layer)
#   f_1520     : Mở hộp thoại import ảnh AI (Image_fx_*.jpg) vào Photopea
#   f_2360     : CapCut Desktop — panel import ảnh cartoon + narration.mp3
#   f_2840     : CapCut — cảnh hoạt hình hoàn thiện (nhân vật + ô che mưa + sét)
#   f_3200     : CapCut — timeline đầy đủ: ảnh, caption, audio narration
# ---------------------------------------------------------------------------
ED1BE9_CHAPTERS = [
    (84.0, 320.0,
     "[Thực hành Photopea] Mở Photopea (Photoshop web), thiết lập canvas 16:9 và vẽ nền cảnh: "
     "bầu trời xám, mây, đồi cỏ xanh và cây bằng công cụ Brush"),
    (320.0, 560.0,
     "[Thực hành Photopea] Vẽ chi tiết cảnh nền: thêm hạt mưa, viền cỏ, đổ bóng cây — "
     "thao tác theo từng layer riêng biệt"),
    (560.0, 900.0,
     "[Thực hành Photopea] Dựng nhân vật stick figure (người que): vẽ đầu, tóc, thân và tay chân "
     "trên các layer tách biệt rồi dùng Free Transform để cân chỉnh tỉ lệ"),
    (900.0, 1500.0,
     "[Thực hành Photopea] Tinh chỉnh nhân vật: tạo biểu cảm khuôn mặt, thêm Shape và áp dụng "
     "Layer Style để nhân vật nổi khối trên nền"),
    (1500.0, 1900.0,
     "[Thực hành Photopea] Mở hộp thoại Open, import loạt ảnh AI (Image_fx_*.jpg) vào dự án "
     "để ghép vào các phân cảnh"),
    (1900.0, 2200.0,
     "[Thực hành Photopea] Ghép ảnh AI với nền vẽ tay, cắt mặt nạ (Clipping Mask) và cân chỉnh "
     "màu sắc cho hài hòa giữa các layer"),
    (2200.0, 2300.0,
     "[Chuyển công cụ] Kết thúc phần Photopea — chuyển sang CapCut Desktop để dựng video"),
    (2300.0, 2700.0,
     "[Thực hành CapCut] Import loạt ảnh cartoon (Flux_Schnell_Art_*.png) và file narration.mp3 "
     "vào CapCut Desktop, sắp xếp lên timeline theo thứ tự phân cảnh"),
    (2700.0, 3050.0,
     "[Thực hành CapCut] Tạo chuyển động cho từng ảnh (Zoom/Pan), thêm hiệu ứng chuyển cảnh và "
     "đồng bộ với giọng đọc narration"),
    (3050.0, 3400.0,
     "[Thực hành CapCut] Thêm phụ đề tự động (Auto Captions), chỉnh font và vị trí caption; "
     "chèn nhạc nền và hiệu ứng âm thanh"),
    (3400.0, 3537.5,
     "[Hoàn thiện] Rà soát toàn bộ timeline, kiểm tra đồng bộ hình–tiếng và xuất video thành phẩm"),
]

# ---------------------------------------------------------------------------
# VIDEO-b559c8 — Tạo nhân vật cartoon bằng AI + ghép thumbnail (24 phút)
# Phân tích khung hình:
#   f_120  : Tool tạo ảnh AI (Flux Schnell) — prompt tạo nhân vật cartoon
#            "Cyanide & Happiness style, stick figure, jagged blond lightning-bolt spikes"
#   f_480  : Photopea — nhân vật đầu tiên (layer Flux_Schnell_Image_Style) đang chỉnh sửa
#   f_1020 : Photopea — 4–5 nhân vật với biểu cảm khác nhau xếp hàng ngang
#   f_1290 : Photopea — thumbnail hoàn thiện: tiêu đề "Totally wrong Facts everyone still believes"
#            + 5 nhân vật biểu cảm (tức giận, cười, ăn, đội bánh burger...)
# ---------------------------------------------------------------------------
B559C8_CHAPTERS = [
    (30.0, 210.0,
     "[Thực hành tạo ảnh AI] Mở tool tạo ảnh AI (model Flux Schnell) và viết prompt tạo nhân vật "
     "cartoon: stick figure, nét vẽ tay run, style Cyanide & Happiness, tỉ lệ 16:9"),
    (210.0, 480.0,
     "[Thực hành tạo ảnh AI] Tinh chỉnh prompt mô tả biểu cảm khuôn mặt (mắt xoáy, răng nghiến) "
     "và tóc gai vàng nhọn — bấm Generate để tạo loạt biến thể nhân vật"),
    (480.0, 700.0,
     "[Thực hành Photopea] Import nhân vật AI vào Photopea, tách nền trắng bằng Magic Wand "
     "và chỉnh sửa lại nét vẽ cho sạch"),
    (700.0, 1020.0,
     "[Thực hành Photopea] Tạo thêm 4 nhân vật với biểu cảm khác nhau (tức giận, cười toe, "
     "ăn burger, mắt xoáy) và xếp thành hàng ngang trên canvas"),
    (1020.0, 1290.0,
     "[Thực hành Photopea] Ghép các nhân vật vào bố cục thumbnail, thêm tiêu đề dạng chữ đậm "
     "\"Totally wrong Facts everyone still believes\" và cân chỉnh vị trí từng layer"),
    (1290.0, 1461.4,
     "[Hoàn thiện] Tinh chỉnh độ tương phản, rà soát bố cục thumbnail và xuất file thành phẩm"),
]


def build(sku, chapters):
    p = ROOT / "video" / sku / "transcript.json"
    with open(p, "r", encoding="utf-8") as f:
        d = json.load(f)
    segs = d.get("segments") or []

    HALL = ["La La School", "Ghiền Mì Gõ", "H subscribe cho k"]

    # 1. Giữ lại các segment nói thật
    real = []
    for s in segs:
        t = s.get("text", "")
        if not any(h.lower() in t.lower() for h in HALL):
            real.append({
                "id": 0,
                "start": float(s.get("start", 0)),
                "end": float(s.get("end", 0)),
                "start_time": s.get("start_time") or fmt(float(s.get("start", 0))),
                "end_time": s.get("end_time") or fmt(float(s.get("end", 0))),
                "text": t,
            })

    # 2. Dựng các segment chương từ phân tích khung hình
    chapters_segs = []
    for start, end, text in chapters:
        chapters_segs.append({
            "id": 0,
            "start": float(start),
            "end": float(end),
            "start_time": fmt(start),
            "end_time": fmt(end),
            "text": text,
        })

    # 3. Gộp + sắp xếp theo thời gian
    merged = real + chapters_segs
    merged.sort(key=lambda x: x["start"])
    for i, s in enumerate(merged, 1):
        s["id"] = i

    d["segments"] = merged
    d["full_text"] = " ".join(s["text"] for s in merged)

    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

    lines = []
    for i, s in enumerate(merged, 1):
        lines.append(str(i) + "\n")
        lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
        lines.append(s["text"] + "\n\n")
    with open(ROOT / "video" / sku / "transcript.srt", "w", encoding="utf-8") as f:
        f.writelines(lines)
    with open(ROOT / "video" / sku / "transcript.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(s["text"] for s in merged) + "\n")

    print(f"{sku}: {len(real)} segment that + {len(chapters_segs)} chuong = {len(merged)} segment")


def main():
    build("VIDEO-ed1be9", ED1BE9_CHAPTERS)
    build("VIDEO-b559c8", B559C8_CHAPTERS)


if __name__ == "__main__":
    main()
