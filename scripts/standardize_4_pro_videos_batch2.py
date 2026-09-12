# -*- coding: utf-8 -*-
"""
CHUẨN HOÁ TOÀN DIỆN 4 VIDEO PRO ĐỢT 2
(VIDEO-484f9e, VIDEO-e24c31, VIDEO-a7bfd0, VIDEO-4b3c09)
======================================================
- Gắn docs (file SOP chuyên sâu) vào 4 file data:
  catalog.json, catalog_full.json, modules.json, data-tabs/videos.json
- Đồng bộ video_insights.json:
  + channels_mentioned: đủ kênh cho a7bfd0 và 4b3c09
  + tools_mentioned: bổ sung công cụ cho 4b3c09
  + key_takeaways: nâng cấp lên 5 điểm thực chiến, sâu sắc
  + accuracy_status: 'verified_expert_summary'
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DOCS_MAP = {
    "VIDEO-484f9e": [
        {
            "name": "SOP Bán Content Ngách Phật Pháp & Đạo Lý Nhân Quả Việt Nam & Kỹ Thuật Edit Né Quét AI 2026",
            "link": "assets/docs/VIDEO-484f9e/SOP-NGACH-PHAT-PHAP-VIET-NAM-VA-KY-THUAT-EDIT-NE-QUET-AI.md",
            "file": "assets/docs/VIDEO-484f9e/SOP-NGACH-PHAT-PHAP-VIET-NAM-VA-KY-THUAT-EDIT-NE-QUET-AI.md"
        }
    ],
    "VIDEO-e24c31": [
        {
            "name": "SOP Khai Thác Ngách Tâm Linh Phong Thủy Thu Hút Tài Lộc Hàn Quốc & Đòn Bẩy Kênh Cổ 2008",
            "link": "assets/docs/VIDEO-e24c31/SOP-NGACH-TAM-LINH-PHONG-THUY-TAI-LOC-KENH-CO.md",
            "file": "assets/docs/VIDEO-e24c31/SOP-NGACH-TAM-LINH-PHONG-THUY-TAI-LOC-KENH-CO.md"
        }
    ],
    "VIDEO-a7bfd0": [
        {
            "name": "SOP Ngách Lời Chúa Cầu Nguyện Hàn Quốc & Quy Trình Xử Lý Triệt Để Lỗi 0 View, Flop Kênh Do Làm Lan Man",
            "link": "assets/docs/VIDEO-a7bfd0/SOP-NGACH-LOI-CHUA-TAM-LINH-VA-FIX-LOI-FLOP-KENH.md",
            "file": "assets/docs/VIDEO-a7bfd0/SOP-NGACH-LOI-CHUA-TAM-LINH-VA-FIX-LOI-FLOP-KENH.md"
        }
    ],
    "VIDEO-4b3c09": [
        {
            "name": "SOP Toàn Diện 4 Ngách Nhỏ Bán Content Ẩm Thực & Mẹo Vặt Nấu Ăn Lò Vi Sóng Hàn Quốc",
            "link": "assets/docs/VIDEO-4b3c09/SOP-4-NGACH-NHO-AM-THUC-MEO-VAT-VI-SONG-HAN-QUOC.md",
            "file": "assets/docs/VIDEO-4b3c09/SOP-4-NGACH-NHO-AM-THUC-MEO-VAT-VI-SONG-HAN-QUOC.md"
        }
    ]
}

INSIGHTS_PATCH = {
    "VIDEO-484f9e": {
        "actual_topic": "Bán content Phật pháp & phong thủy thu hút tài lộc tại Việt Nam (học hỏi từ mô hình Hàn Quốc); kỹ thuật edit video dài (> 1 tiếng) né quét AI",
        "channels_mentioned": ["@MộtĐờiBìnhAn-v6s", "@자비의법음-j5h"],
        "key_takeaways": [
            "Mô hình Phật pháp Việt Nam cắn view khủng: Kênh @MộtĐờiBìnhAn-v6s (Thầy Thích Pháp Hòa) đạt 9.84K sub và hơn 1.3M view, tăng trưởng 7 ngày qua lên tới +375.000 view nhờ khai thác đúng tệp khán giả trung niên khao khát bình an và may mắn.",
            "Nguồn cảm hứng từ kênh đại sư Hàn Quốc: Kênh Việt đã học hỏi trực tiếp cách làm thumbnail tông vàng cam và chủ đề xả xui, hút lộc từ kênh Hàn Quốc @자비의법음-j5h (Đại đức Gwang-woo, Ni sư Pomnyun).",
            "Bố cục khung hình 4 lớp né quét AI: Nền động hoa sen/khói hương/nến lung linh nhẹ nhàng (Loop) + Chân dung cắt nền sắc nét + Sóng âm audio trực quan + Phụ đề chữ to rõ màu vàng kim viền đen.",
            "Công thức tiêu đề 'Hook tài lộc & bình an': 'Đầu giường để 5 vật này...', 'Cắt tiền chỗ này tiền đẻ ra tiền gấp 10 lần...', 'Đặt 3 quả chanh đúng chỗ này...' đánh trúng tâm lý tò mò nhưng vẫn giữ được sự tôn nghiêm.",
            "Chiến lược video dài 60 - 80 phút: Khán giả lớn tuổi bật nghe khi đi ngủ hoặc làm việc nhà, giúp tối ưu AVD vượt trội và chèn 8-10 điểm quảng cáo Mid-roll tăng mạnh doanh thu."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-e24c31": {
        "actual_topic": "Chiến lược khai thác ngách Tâm linh & Phong thủy thu hút tài lộc Hàn Quốc; Đòn bẩy Kênh Cổ 2008 giúp 5 video đầu cắn đề xuất > 40K views",
        "channels_mentioned": ["@복이오는길", "@mokamoka-e9f"],
        "key_takeaways": [
            "Case study kênh mới 5 video cắn đề xuất thần tốc: Kênh @복이오는길 (Con đường đón phúc) chỉ mới đăng 5 video đã đạt 8.050 subs, các video đạt 45.000 view (528 VPH) và 42.000 view (1.1K VPH > 100x).",
            "Đòn bẩy Kênh Cổ (Aged Channel 2008): Kênh lập từ năm 2008 có điểm uy tín (Trust score) cao, giúp video mới bypass qua giai đoạn kiểm duyệt Sandbox khắt khe và được thuật toán phân phối thẳng đến trang chủ.",
            "Tâm lý tìm kiếm may mắn định kỳ: Nhu cầu xem mẹo xả xui, phong thủy nhà ở đầu tháng của người dân Á Đông cực kỳ lớn, mở ra cơ hội khai thác quanh năm không lo cạn ý tưởng.",
            "Công thức tiêu đề đánh trúng nỗi sợ & lòng tham: 'Để muối ở vị trí này tiền bạc đổ về', 'Cắt móng tay ngày này tài lộc 7 năm bay sạch', 'Trong nhà vệ sinh chỉ cần đặt 1 thứ này thôi'...",
            "Quy trình sản xuất Zero-Cost: Dùng ảnh nhà sư/chuyên gia phong thủy hiền hậu, chèn nhạc thiền năng lượng tích cực 432Hz/528Hz và đều đặn xuất bản vào khung giờ sáng sớm hoặc tối muộn."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-a7bfd0": {
        "actual_topic": "Khai thác ngách Lời Chúa & Cầu nguyện tâm linh Hàn Quốc; Quy trình khám kênh và bài học xử lý triệt để lỗi 0 view do làm lan man",
        "channels_mentioned": ["@은밀한응답", "@장수채소습관"],
        "key_takeaways": [
            "Phân tích kênh Lời Chúa @은밀한응답: Kênh mới chỉ 3-4 video đã cắn đề xuất ổn định và bật kiếm tiền thành công; video dài 36-44 phút thuộc thể loại nhạc cầu nguyện và lời tâm sự đức tin bình an.",
            "Nguyên nhân cốt tử gây bẫy 0 view / lẹt đẹt: Hiện tượng 'Gây bối rối cho thuật toán' (Algorithmic Confusion) khi người làm kênh nhảy ngách tùy hứng (hôm nay làm Chúa, ngày mai làm rau củ trường thọ @장수채소습관, ngày mốt làm tin tức).",
            "Quy tắc nhất quán 1 trường từ khóa (Niche Consistency): Bắt buộc phải đăng tối thiểu 15 - 20 video đầu tiên cùng 1 chủ đề xuyên suốt để AI YouTube nhận diện chính xác tệp khán giả mục tiêu.",
            "Quy trình 4 bước khám kênh & hồi sinh kênh flop: (1) Đo nguồn lưu lượng Browse Features $\rightarrow$ (2) Chuyển video lạc đề sang Unlisted (không xoá) $\rightarrow$ (3) Cập nhật lại 10-15 Channel Tags cốt lõi $\rightarrow$ (4) Bơm 5-7 video chuẩn chỉ liên tục trong 10 ngày.",
            "Bố cục hình ảnh thiêng liêng: Dùng hình ảnh người phụ nữ/nữ thánh chắp tay cầu nguyện trong ánh hào quang vàng ấm, kết hợp sóng âm audio trực quan tạo cảm giác trị liệu tâm hồn."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-4b3c09": {
        "actual_topic": "Tổng hợp 4 ngách nhỏ bán content Ẩm thực & Mẹo vặt Hàn Quốc (Mẹo lò vi sóng, Bảo quản thực phẩm trường thọ, Lời khuyên bác sĩ); Chiến lược video 10-15 phút cắn view",
        "channels_mentioned": [
            "@시니어살림노트", "@HealthyToday0", "@desidilse",
            "@RichPatternResearchInstitute", "@의사가숨긴건강법-z9n"
        ],
        "tools_mentioned": ["CapCut", "YouTube Search", "Xiaohongshu", "Douyin"],
        "key_takeaways": [
            "Ngách 1 — Mẹo nấu ăn siêu tốc bằng Lò vi sóng (@HealthyToday0): Khai thác thói quen ngại dọn dẹp dầu mỡ của người già và người sống độc thân tại Hàn Quốc; video khoai lang/ớt chuông/cá hồi/khổ qua quay vi sóng 2-6 phút đạt từ 23.000 đến 399.000 view.",
            "Ngách 2 — Bí quyết chế biến & bảo quản thực phẩm dân dã (@시니어살림노트): Mẹo tỏi rẻ ngâm soju (69K view), rong biển khô chan nước sôi (203K view), hành tây xào tương ớt gochujang (210K view) — view cực khủng vì tính ứng dụng gia đình cao.",
            "Ngách 3 & 4 — Y học thường thức & Quản lý tiền bạc tuổi già: Khai thác mẹo bác sĩ giấu kín (@의사가숨긴건강법-z9n) và lời khuyên giữ tiền tiết kiệm, lập quỹ dưỡng già độc lập (@RichPatternResearchInstitute).",
            "Kỹ thuật dựng video 10-15 phút cuốn hút: Sử dụng footage quay cận cảnh (Close-up) bàn tay sơ chế đồ ăn, lồng âm thanh ASMR chân thực (tiếng dao thái, tiếng sôi, tiếng lò vi sóng) kích thích đa giác quan.",
            "Công thức thumbnail Đỏ - Vàng bắt mắt: Đĩa đồ ăn thực tế hấp dẫn bên phải + 3 dòng chữ giật tít in hoa bên trái ('KHOAI LANG MUA NHIỀU' $\rightarrow$ 'CHO VÀO LÒ VI SÓNG' $\rightarrow$ 'THUỐC BỔ KHÔNG ĐÂU BẰNG!!')."
        ],
        "accuracy_status": "verified_expert_summary"
    }
}


def main():
    # 1. Cập nhật catalog.json
    cat_path = ROOT / "data" / "catalog.json"
    cat = json.load(open(cat_path, encoding="utf-8"))
    for c in cat:
        sku = c.get("sku")
        if sku in DOCS_MAP:
            c["docs"] = DOCS_MAP[sku]
    json.dump(cat, open(cat_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/catalog.json")

    # 2. Cập nhật catalog_full.json
    cat_full_path = ROOT / "data" / "catalog_full.json"
    cat_full = json.load(open(cat_full_path, encoding="utf-8"))
    for c in cat_full:
        sku = c.get("sku")
        if sku in DOCS_MAP:
            c["docs"] = DOCS_MAP[sku]
    json.dump(cat_full, open(cat_full_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/catalog_full.json")

    # 3. Cập nhật modules.json
    mod_path = ROOT / "data" / "modules.json"
    mod = json.load(open(mod_path, encoding="utf-8"))
    for m in mod.get("modules", []):
        for it in m.get("items", []):
            sku = it.get("sku")
            if sku in DOCS_MAP:
                it["docs"] = DOCS_MAP[sku]
    json.dump(mod, open(mod_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/modules.json")

    # 4. Cập nhật data-tabs/videos.json
    vj_path = ROOT / "data-tabs" / "videos.json"
    vj = json.load(open(vj_path, encoding="utf-8"))
    for v in vj:
        sku = v.get("sku") or v.get("id")
        if sku in DOCS_MAP:
            v["docs"] = DOCS_MAP[sku]
    json.dump(vj, open(vj_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data-tabs/videos.json")

    # 5. Cập nhật data/video_insights.json
    ins_path = ROOT / "data" / "video_insights.json"
    ins = json.load(open(ins_path, encoding="utf-8"))
    for sku, patch in INSIGHTS_PATCH.items():
        if sku in ins:
            ins[sku].update(patch)
            print(f"Updated insights for {sku}")
    json.dump(ins, open(ins_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/video_insights.json")


if __name__ == "__main__":
    main()
