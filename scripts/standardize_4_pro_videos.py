# -*- coding: utf-8 -*-
"""
CHUẨN HOÁ TOÀN DIỆN 4 VIDEO PRO
================================
- Cập nhật trường docs (gắn file SOP chuyên sâu) trong 4 file data:
  catalog.json, catalog_full.json, modules.json, data-tabs/videos.json
- Bổ sung channels cho VIDEO-3a38f9: ['@오늘의삶의지혜', '@Haythauhieuchuyendoi']
- Đồng bộ video_insights.json: channels_mentioned, key_takeaways (5 điểm sâu sắc), accuracy_status
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DOCS_MAP = {
    "VIDEO-73d98a": [
        {
            "name": "SOP Khai Thác Ngách Cực Nhỏ: Drama Cảm Động Nhân Văn & Sức Khỏe Dưỡng Lão (Nhật - Hàn)",
            "link": "assets/docs/VIDEO-73d98a/SOP-NGACH-CUC-NHO-DRAMA-CAM-DONG-VA-DUONG-LAO.md",
            "file": "assets/docs/VIDEO-73d98a/SOP-NGACH-CUC-NHO-DRAMA-CAM-DONG-VA-DUONG-LAO.md"
        }
    ],
    "VIDEO-3a38f9": [
        {
            "name": "SOP Nhân Bản Ngách Triết Lý Dưỡng Sinh & Tâm Sự Tuổi Già Từ Hàn Quốc Về Việt Nam",
            "link": "assets/docs/VIDEO-3a38f9/SOP-NHAN-BAN-NGACH-TRIET-LY-DUONG-SINH-HAN-VIET.md",
            "file": "assets/docs/VIDEO-3a38f9/SOP-NHAN-BAN-NGACH-TRIET-LY-DUONG-SINH-HAN-VIET.md"
        }
    ],
    "VIDEO-61ad94": [
        {
            "name": "SOP Sản Xuất Bán Content Video Dài (> 1 Tiếng) Ngách Drama Gia Đình & Lời Khuyên Tuổi Già (Nhật - Hàn)",
            "link": "assets/docs/VIDEO-61ad94/SOP-BAN-CONTENT-DRAMA-GIA-DINH-NHAT-HAN.md",
            "file": "assets/docs/VIDEO-61ad94/SOP-BAN-CONTENT-DRAMA-GIA-DINH-NHAT-HAN.md"
        }
    ],
    "VIDEO-DD983D": [
        {
            "name": "SOP Kỹ Thuật Edit B-Roll Thật & Bí Quyết Né Quét Bản Quyền / Trùng Lặp AI 2026",
            "link": "assets/docs/VIDEO-DD983D/SOP-KY-THUAT-EDIT-BROLL-THAT-NE-QUET-AI.md",
            "file": "assets/docs/VIDEO-DD983D/SOP-KY-THUAT-EDIT-BROLL-THAT-NE-QUET-AI.md"
        }
    ]
}

CHANNELS_PATCH = {
    "VIDEO-3a38f9": ["@오늘의삶의지혜", "@Haythauhieuchuyendoi"]
}

INSIGHTS_PATCH = {
    "VIDEO-73d98a": {
        "actual_topic": "Chiến lược khai thác ngách cực nhỏ (Micro-niche): Drama cảm động nhân văn & Sức khỏe dưỡng lão Nhật-Hàn",
        "channels_mentioned": ["@涙のひと駅", "@사연만남1짱", "@simbot2", "@元気な老後-t5d"],
        "key_takeaways": [
            "Chuyển dịch từ Drama hận thù sang Drama cảm động nhân văn: Thay vì làm kịch bản đấu đá tiêu cực dễ gây mệt mỏi, chuyển sang ngách câu chuyện cảm động (như chuyện chia ly, tình nghĩa gia đình tại sân ga) tiếp cận tệp khán giả trung niên và cao tuổi (45-75 tuổi) có thời gian xem thụ động rất cao.",
            "Phân tích kênh Nhật Bản @涙のひと駅: Đăng video drama cảm động dài từ 1-2 tiếng, video mới nhất đăng chỉ 22 giờ đã đạt 168.000 lượt xem, tốc độ cắn đề xuất thần tốc nhờ giữ chân người xem bằng cốt truyện nhân văn.",
            "Phân tích kênh Hàn Quốc @사연만남1짱 & @simbot2: Kênh tâm sự đời sống và tiếng lòng tuổi già (Simbot2 chỉ 20 video đạt 4.5M view và 27.4K sub), khai thác nỗi lòng người già, bài học hối hận và đạo lý nhân quả.",
            "Phân tích ngách Sức khỏe dưỡng lão @元気な老後-t5d: Kênh mới 19 video đạt video 81.000 view sau 11 ngày, tập trung vào mẹo sức khỏe tuổi xế chiều (bài tập trí não 1 phút, thực phẩm hại khớp, phục hồi thận).",
            "Kỹ thuật dựng Minimalist: Sử dụng ảnh AI nhân vật biểu cảm cảm động kết hợp hiệu ứng tuyết rơi/hạt bụi nhẹ nhàng và sóng âm audio (như kênh @simbot2), vừa tối ưu chi phí vừa chống quét ảnh tĩnh."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-3a38f9": {
        "actual_topic": "Quy trình cắn đề xuất thần tốc của kênh mới 10 ngày & Công thức nhân bản kịch bản dưỡng sinh, tâm sự tuổi già từ Hàn Quốc về Việt Nam",
        "channels_mentioned": ["@오늘의삶의지혜", "@Haythauhieuchuyendoi"],
        "key_takeaways": [
            "Phân tích kênh Hàn Quốc @오늘의삶의지혜: Kênh lập ngày 17/08/2026, chỉ sau 10 ngày đăng 10 video đã đạt 5.240 subs, các video đầu tiên đều cắn đề xuất 3.000 - 5.000 views sau 1-2 ngày đăng tải.",
            "Phân tích kênh Việt Nam @Haythauhieuchuyendoi: Kênh 'Thấu Hiểu Chuyện Đời' tham gia 14/08/2026, áp dụng chuẩn chỉ công thức từ Hàn Quốc đã nổ video 69.000 view sau 3 ngày (tốc độ 285 VPH > 100x), tổng kênh hơn 200.000 view sau 22 video.",
            "Công thức tiêu đề 3 yếu tố 'bắt mắt': (1) Neo tuổi tác cụ thể (62, 71, 77, 103 tuổi...) + (2) Nút thắt nghịch lý gia đình (xoá số con cái, âm thầm mua đất an táng, bị mắng ăn bám) + (3) Cái kết hả lòng/thức tỉnh.",
            "Cấu trúc kịch bản giữ chân AVD: Hook cao trào 0-30s đặt ngay biến cố lớn nhất, 3-5 phút đầu tích tụ mâu thuẫn, đỉnh điểm biến cố và kết thúc bằng bài học nhân tình thế thái sâu sắc.",
            "Quy trình Việt hoá kịch bản: Bóc tách transcript video triệu view của kênh Hàn Quốc, prompt AI viết lại theo văn phong truyền cảm, xưng hô gần gũi của người Việt, dùng giọng đọc AI trầm ấm tốc độ 0.92x."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-61ad94": {
        "actual_topic": "Sản xuất bán content video dài (> 1 tiếng) ngách Drama gia đình & Lời khuyên tuổi già; Phân tích 8 kênh đối thủ cắn đề xuất Nhật-Hàn",
        "channels_mentioned": [
            "@시어머니와며느리", "@마음을안아주는이야", "@新しい私の毎日",
            "@부를부르는말씀", "@시니어살림노트", "@feelrelaxedtv",
            "@JaebeolNunmul16", "@노을빛사연-l2m"
        ],
        "key_takeaways": [
            "Lợi thế vượt trội của video dài (> 1 tiếng): Khán giả cao tuổi tại Nhật Bản và Hàn Quốc có thói quen nghe thụ động khi làm việc nhà hoặc trước khi đi ngủ, giúp đẩy AVD lên 30-50 phút và cho phép chèn 8-12 điểm quảng cáo Mid-roll, tối ưu RPM đạt $5.00 - $15.00 USD.",
            "Phân tích 8 kênh đối thủ phân hóa theo ngách: Kênh drama mẹ chồng nàng dâu (@시어머니와며느리), kênh câu chuyện ôm ấp tâm hồn (@마음을안아주는이야 - 1.2M view/84 video), kênh cổ 2010 (@新しい私の毎日), kênh lời dạy tài lộc (@부를부르는말씀)...",
            "Kỹ thuật dựng Minimalist Editing: Sử dụng 1 ảnh AI tĩnh chất lượng 4K thể hiện bối cảnh xúc động, thêm sóng âm audio (Waveform) và lớp phủ hiệu ứng hạt (tuyết rơi/mưa bay/bụi nắng loop) tạo chuyển động liên tục.",
            "Phương pháp ghép tuyển tập (Anthology): Thay vì viết 1 kịch bản dài 20.000 từ, hãy ghép 3 đến 5 mẩu chuyện ngắn độc lập (15-20 phút/chuyện) thành một video dài 1-2 tiếng.",
            "Bảo vệ kênh và bản quyền âm thanh: Tuyệt đối chỉ dùng nhạc nền miễn phí bản quyền thương mại từ YouTube Audio Library hoặc Artlist/Epidemic Sound, tránh dính khiếu nại Content ID làm mất doanh thu video dài."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-DD983D": {
        "actual_topic": "Kỹ thuật tự quay B-roll đời thật làm nền video Drama Nhật Bản & Bí quyết né quét bản quyền, trùng lặp AI 2026",
        "channels_mentioned": ["@ธรรมสุข-2275", "@新しい私の毎日", "@心に残る話-y10k"],
        "key_takeaways": [
            "Vấn nạn quét trùng lặp AI năm 2026: Dùng video stock Pexels/Pixabay miễn phí hoặc video AI chuyển động sơ sài sẽ bị YouTube quét lỗi Sử dụng lại nội dung (Reused Content) hoặc Nội dung thiếu tính xác thực (Inauthentic Content).",
            "Giải pháp tự quay B-roll đời thật (Original B-roll): Tự dùng điện thoại quay bể cá cảnh bơi lội, bàn tay gõ phím máy tính, cảnh pha trà... làm nền mờ (Background B-roll) để tạo ra mã hash video hoàn toàn mới 100%.",
            "Giải mã kênh cổ Thái Lan làm content Nhật @ธรรมสุข-2275: Tên hiển thị 'スカッと感動物語', tận dụng kênh cổ Thái Lan (handle @ธรรมสุข-2275) để đăng nội dung Nhật Bản đạt 7.66K sub và hơn 3.4M view mà không bị Sandbox.",
            "Quy trình xử lý hình ảnh & độ tương phản: Hạ độ sáng video nền xuống -10% đến -15%, tăng độ mờ viền (Vignette) và đặt chữ phụ đề tiếng Nhật to rõ màu xanh viền trắng ở giữa để tăng khả năng đọc lướt.",
            "Chiến lược tận dụng Kênh Cổ (Aged Channel): Ưu tiên các kênh tạo từ 2010 - 2018 có độ trust cao, kết hợp giữ lại file project dựng video làm bằng chứng nếu cần thực hiện video kháng nghị (Appeal Video)."
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
        if sku in CHANNELS_PATCH:
            v["channels"] = CHANNELS_PATCH[sku]
            print(f"Patched channels for {sku}: {v['channels']}")
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
