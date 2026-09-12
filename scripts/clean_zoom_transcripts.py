# -*- coding: utf-8 -*-
"""
CHUẨN HÓA PHỤ ĐỀ 4 BUỔI ZOOM (ZOOM-01 → ZOOM-04)
=================================================
Script hợp nhất gồm 3 nhóm xử lý:

  A. PURGE ẢO GIÁC WHISPER
     - Phát hiện các mẫu ảo giác vòng lặp (subscribe / Ghiền Mì Gõ / La La School /
       "Cảm ơn các bạn đã theo dõi" / "đăng ký kênh để ủng hộ" / "quảng cáo sau").
     - Thay bằng CHÚ THÍCH TRUNG THỰC mô tả nội dung màn hình (đã đối chiếu frame).

  B. CẮT NHIỄU NGẬP NGỪNG
     - Cắt đuôi "à à à à..." và gộp chuỗi "à à à" giữa câu thành dấu phẩy.

  C. KIỂM ĐỊNH
     - Phát hiện segment bị "nén chữ" (Whisper rớt nguyên âm) để đưa sang
       script `restore_zoom_compressed_segments.py` bóc lại bằng prompt chuyên ngành.

Xuất đồng bộ: transcript.srt / transcript.txt / transcript.json
"""

import re
import json
from pathlib import Path

PROJECT = Path("H2DEV-Project")

ZOOMS = [
    "ZOOM-01-Nen-tang-moi-truong",
    "ZOOM-02-Chien-luoc-kenh-san-xuat",
    "ZOOM-03-Quy-trinh-tool-toi-uu",
    "ZOOM-04-Adsense-khang-loi",
]

# Mẫu ảo giác Whisper khi gặp khoảng lặng (cần thay bằng chú thích trung thực)
HALLUCINATION_MARKERS = [
    "subscribe cho kênh",
    "Ghiền Mì Gõ",
    "La La School",
    "Cảm ơn các bạn đã theo dõi",
    "Hãy subscribe",
    "quảng cáo sau",
    "đăng ký kênh để ủng hộ",
    "nhớ đăng ký kênh",
]

# Chú thích trung thực cho từng segment ảo giác (đã kiểm chứng bằng frame extraction)
ANNOTATIONS = {
    ("ZOOM-01-Nen-tang-moi-truong", 185): (
        "[Khoảng lặng thao tác — Trên màn hình đang xem kết quả tìm kiếm YouTube "
        "các ngách đối thủ (Hàn Quốc, lịch sử)]"
    ),
    ("ZOOM-02-Chien-luoc-kenh-san-xuat", 803): (
        "[Khoảng lặng thao tác — Trên màn hình đang mở bảng Google Sheet \"DINA\" "
        "theo dõi danh sách kênh đối thủ, ngách và thời gian bật kiếm tiền]"
    ),
    ("ZOOM-03-Quy-trinh-tool-toi-uu", 119): (
        "[Tạm nghỉ giải lao giữa buổi — Học viên nghỉ, trên màn hình đang mở "
        "giao diện tool Nhật Ký, tab Ghép video]"
    ),
    ("ZOOM-03-Quy-trinh-tool-toi-uu", 195): (
        "[Khoảng lặng thao tác — Trên màn hình đang mở CapCut Desktop, "
        "dựng timeline video với footage Cửa hàng thiên niên kỷ]"
    ),
    ("ZOOM-03-Quy-trinh-tool-toi-uu", 332): (
        "[Khoảng lặng thao tác — Trên màn hình đang mở CapCut, "
        "xem trước footage tượng cổ và bảng hiệu ứng]"
    ),
    ("ZOOM-04-Adsense-khang-loi", 405): (
        "[Khoảng lặng thao tác — Trên màn hình đang mở YouTube Studio, "
        "danh sách video mục Content của kênh]"
    ),
    ("ZOOM-04-Adsense-khang-loi", 527): (
        "[Khoảng lặng thao tác — Trên màn hình đang xem kênh đối thủ Hàn Quốc "
        "\"DNA의 비밀\" (Bí mật DNA)]"
    ),
}

TRAIL_A = re.compile(r"\s*(?:à\s*){4,}$", re.IGNORECASE)
MID_A = re.compile(r"\s*(?:à\s*){3,}\s*", re.IGNORECASE)


def is_hallucination(text):
    low = text.lower()
    return any(h.lower() in low for h in HALLUCINATION_MARKERS)


def clean_hesitation(text):
    if MID_A.search(text):
        c = MID_A.sub(", ", text)
        c = re.sub(r",\s*,", ",", c)
        c = re.sub(r"\s{2,}", " ", c).strip()
        c = re.sub(r"^,\s*", "", c)
        return c
    return text


def short_token_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def process(sku):
    jp = PROJECT / "video" / sku / "transcript.json"
    with open(jp, "r", encoding="utf-8") as f:
        d = json.load(f)

    segs = d["segments"]
    purged = 0
    trimmed = 0
    compressed = []

    for s in segs:
        t = s["text"]

        # A. Thay ảo giác bằng chú thích trung thực
        if is_hallucination(t):
            key = (sku, s["id"])
            s["text"] = ANNOTATIONS.get(
                key, "[Khoảng lặng thao tác — màn hình đang trình diễn thao tác]")
            purged += 1
            t = s["text"]

        # B. Cắt nhiễu ngập ngừng
        new_t = clean_hesitation(TRAIL_A.sub("", t).strip())
        if new_t and new_t != t:
            s["text"] = new_t
            trimmed += 1

        # C. Ghi nhận segment nghi nén chữ
        if short_token_ratio(s["text"]) >= 0.75:
            compressed.append(s["id"])

    d["full_text"] = " ".join(x["text"] for x in segs)
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

    lines = []
    for i, s in enumerate(segs, 1):
        lines.append(str(i) + "\n")
        lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
        lines.append(s["text"] + "\n\n")
    with open(PROJECT / "video" / sku / "transcript.srt", "w", encoding="utf-8") as f:
        f.writelines(lines)
    with open(PROJECT / "video" / sku / "transcript.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(x["text"] for x in segs) + "\n")

    return purged, trimmed, compressed


def main():
    print("=" * 66)
    print("CHUẨN HÓA PHỤ ĐỀ 4 BUỔI ZOOM")
    print("=" * 66)
    for sku in ZOOMS:
        purged, trimmed, compressed = process(sku)
        print(f"\n[{sku}]")
        print(f"   Ảo giác đã thay bằng chú thích : {purged}")
        print(f"   Nhiễu ngập ngừng đã cắt       : {trimmed}")
        print(f"   Segment nghi nén chữ còn lại  : {len(compressed)}")
        if compressed:
            print(f"      -> Chạy restore_zoom_compressed_segments.py cho các id: {compressed[:15]}")


if __name__ == "__main__":
    main()
