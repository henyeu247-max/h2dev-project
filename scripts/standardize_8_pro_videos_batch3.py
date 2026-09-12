# -*- coding: utf-8 -*-
"""
ĐỒNG BỘ TOÀN DIỆN 8 VIDEO PRO ĐỢT 3
===================================
- Gắn file SOP chuyên sâu mới vào docs (giữ nguyên các link Bilibili/prompt cũ nếu có).
- Đồng bộ channels & channels_mentioned.
- Nâng cấp key_takeaways (5 điểm sâu sắc / video).
- Cập nhật đủ 5 file: catalog.json, catalog_full.json, modules.json, data-tabs/videos.json, video_insights.json.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NEW_SOPS = {
    "VIDEO-28e1cc": {
        "name": "SOP Quy Trình Reup Hoạt Hình 2D Bilibili Bật Kiếm Tiền & Case Study Kênh 'Mộng Đam Mỹ'",
        "link": "assets/docs/VIDEO-28e1cc/SOP-QUY-TRINH-REUP-HOAT-HINH-BILIBILI-BAT-KIEM-TIEN.md",
        "file": "assets/docs/VIDEO-28e1cc/SOP-QUY-TRINH-REUP-HOAT-HINH-BILIBILI-BAT-KIEM-TIEN.md"
    },
    "VIDEO-d2cd90": {
        "name": "SOP 5 Ngách Nhỏ Bán Content Thị Trường Nhật Bản & Hàn Quốc (Triết Lý Inamori Kazuo, Trẻ Hóa & Dưỡng Sinh)",
        "link": "assets/docs/VIDEO-d2cd90/SOP-5-NGACH-NHO-BAN-CONTENT-TRIET-LY-TRE-HOA-NHAT-BAN.md",
        "file": "assets/docs/VIDEO-d2cd90/SOP-5-NGACH-NHO-BAN-CONTENT-TRIET-LY-TRE-HOA-NHAT-BAN.md"
    },
    "VIDEO-9aff6d": {
        "name": "SOP Kỹ Thuật Edit Tạo Khung Viền CapCut & 2 Ngách Đột Phá Xe Hơi, Bác Sĩ Cắn Hơn 300K Views",
        "link": "assets/docs/VIDEO-9aff6d/SOP-EDIT-TAO-KHUNG-VA-2-NGACH-XE-HOI-BAC-SI-NHAT.md",
        "file": "assets/docs/VIDEO-9aff6d/SOP-EDIT-TAO-KHUNG-VA-2-NGACH-XE-HOI-BAC-SI-NHAT.md"
    },
    "VIDEO-e90874": {
        "name": "SOP Hướng Dẫn Sử Dụng Bộ Prompt Master Tự Động Nhân Bản Kịch Bản Sang Mọi Thị Trường",
        "link": "assets/docs/VIDEO-e90874/SOP-HUONG-DAN-SU-DUNG-PROMPT-MASTER-NHAN-BAN-MOI-THI-TRUONG.md",
        "file": "assets/docs/VIDEO-e90874/SOP-HUONG-DAN-SU-DUNG-PROMPT-MASTER-NHAN-BAN-MOI-THI-TRUONG.md"
    },
    "VIDEO-c5837a": {
        "name": "SOP Bán Content Ngách Tâm Linh Saito Hitori & Khai Thác Reup Đa Thị Trường Nhật - Hàn - Việt",
        "link": "assets/docs/VIDEO-c5837a/SOP-BAN-CONTENT-TAM-LINH-SAITO-HITORI-VA-REUP-HOAT-HINH.md",
        "file": "assets/docs/VIDEO-c5837a/SOP-BAN-CONTENT-TAM-LINH-SAITO-HITORI-VA-REUP-HOAT-HINH.md"
    },
    "VIDEO-348217": {
        "name": "SOP Khai Thác 2 Ngách Đột Phá Bài Thuốc Bàn Ăn & Năng Lượng Lời Nói Kim Vận (Hàn - Nhật) & Case Study Kênh Việt",
        "link": "assets/docs/VIDEO-348217/SOP-2-NGACH-BAI-THUOC-BAN-AN-VA-NANG-LUONG-LOI-NOI-HAN-NHAT.md",
        "file": "assets/docs/VIDEO-348217/SOP-2-NGACH-BAI-THUOC-BAN-AN-VA-NANG-LUONG-LOI-NOI-HAN-NHAT.md"
    },
    "VIDEO-f74bb1": {
        "name": "SOP Khai Thác Ngách Cực Nhỏ Rau Củ Dưa Chuột Trường Thọ & Bữa Ăn Dưỡng Lão Hàn Quốc",
        "link": "assets/docs/VIDEO-f74bb1/SOP-NGACH-CUC-NHO-RAU-CU-DUA-CHUOT-VA-DUONG-LAO-HAN-QUOC.md",
        "file": "assets/docs/VIDEO-f74bb1/SOP-NGACH-CUC-NHO-RAU-CU-DUA-CHUOT-VA-DUONG-LAO-HAN-QUOC.md"
    },
    "VIDEO-1aaf46": {
        "name": "SOP Khai Thác Kho Hoạt Hình Bilibili & Kỹ Thuật Reup Bán Content An Toàn Không Bản Quyền",
        "link": "assets/docs/VIDEO-1aaf46/SOP-CHIEN-LUOC-KHAI-THAC-REUP-HOAT-HINH-BILIBILI-AN-TOAN.md",
        "file": "assets/docs/VIDEO-1aaf46/SOP-CHIEN-LUOC-KHAI-THAC-REUP-HOAT-HINH-BILIBILI-AN-TOAN.md"
    }
}

CHANNELS_UPDATE = {
    "VIDEO-28e1cc": ["@MộngĐamMỹ"],
    "VIDEO-348217": ["@식탁보약·백세비결", "@金運と言葉の力", "@ĐờiVĩ-u6x"],
    "VIDEO-f74bb1": ["@노후건강한끼", "@건강백단", "@장수채소습관", "@fuetunojin"]
}

INSIGHTS_PATCH = {
    "VIDEO-28e1cc": {
        "actual_topic": "Case study kênh 'Mộng Đam Mỹ' vừa bật kiếm tiền YPP & Full quy trình reup hoạt hình 2D Bilibili an toàn bản quyền",
        "channels_mentioned": ["@MộngĐamMỹ"],
        "tools_mentioned": ["Bilibili", "CapCut", "Tool Dịch Phụ Đề SRT"],
        "key_takeaways": [
            "Bằng chứng bật kiếm tiền thực tế: Kênh 'Mộng Đam Mỹ' (Channel ID: UCPhw3R6ly3mnGRqA_TazlUw) được YouTube duyệt YPP thành công, toàn bộ video hiển thị biểu tượng kiếm tiền xanh, video nổ 3.700 view và tạo doanh thu ngay lập tức.",
            "Khai thác 2 kho hoạt hình Bilibili dồi dào: Chia sẻ trực tiếp 2 kênh Bilibili nguồn chứa kho hoạt họa 2D cổ trang ngắn, nét căng, không dính logo đài truyền hình lớn.",
            "Quy trình dịch thuật và biên kịch Việt hóa: Bóc tách phụ đề tiếng Trung qua Whisper, dùng AI chuyển ngữ mượt mà theo văn phong ngôn tình/cổ trang lôi cuốn, xưng hô thân mật.",
            "Kỹ thuật lách quét AI trong CapCut: Cắt bỏ 3-5s intro/outro gốc, lật ngang khung hình, đổi tốc độ 1.05x, chèn hiệu ứng cánh hoa rơi/ánh sáng mờ tạo mã hash video mới.",
            "Lồng tiếng AI truyền cảm: Thay thế 100% âm thanh thoại tiếng Trung bằng giọng đọc AI tiếng Việt (Ngọc Huyền/Minh Quang), giảm âm thanh gốc xuống 10% làm tiếng động nền SFX."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-d2cd90": {
        "actual_topic": "Tổng hợp 5 ngách nhỏ bán content ngoại cực tiềm năng tại Nhật Bản & Hàn Quốc (Triết lý Inamori Kazuo, Sổ tay nội trợ, Dưỡng lão)",
        "channels_mentioned": [
            "@quietstrength88", "@アマテラス巫女あまね", "@시니어살림노트",
            "@みんなの若返りアカデミア", "@スピリチュアルの泉-l4z"
        ],
        "tools_mentioned": ["YouTube Search", "CapCut", "Google Translate"],
        "key_takeaways": [
            "Ngách 1 — Triết lý Inamori Kazuo (@quietstrength88): Kênh Nhật Bản chuyên video 20-23 phút về triết lý sống và phương trình thành công của Cố chủ tịch Kyocera Inamori Kazuo, view đạt 13.000 view sau 7 ngày.",
            "Ngách 2 — Sổ tay nội trợ Hàn Quốc (@시니어살림노트): 11.5K sub chỉ sau 10 video, chuyên mẹo bảo quản dưa chuột đông lạnh, rong biển khô chan nước sôi và hành tây xào tương ớt.",
            "Ngách 3 & 4 — Tâm linh Thần đạo & Học viện trẻ hóa: Khai thác lời chúc phúc Amaterasu Miko (@アマテラス巫女あまね) và mẹo trẻ hóa mạch máu tuổi già (@みんなの若返りアカデミア).",
            "Ngách 5 — Suối nguồn tâm linh (@スピリチュアルの泉-l4z): Kết hợp nhạc thiền và thông điệp xoa dịu tổn thương tâm hồn cho người cao tuổi.",
            "Bí quyết sản xuất video triết lý 20 phút: Chia bố cục 3 phần rõ ràng (Vấn đề bế tắc 0-3p $\rightarrow$ Lời giải triết lý 3-15p $\rightarrow$ 3 Hành động thực tế 15-20p), thumbnail chữ trắng-đỏ nền tối."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-9aff6d": {
        "actual_topic": "2 Ngách đột phá cắn hơn 300K view (Xe hơi Nhật & Bác sĩ tư vấn sức khỏe) & Kỹ thuật edit tạo khung viền CapCut né quét AI",
        "channels_mentioned": ["@kurumanozokitai", "@昔の人の知恵", "@EricBennettMD"],
        "tools_mentioned": ["CapCut", "YouTube Search", "Canva"],
        "key_takeaways": [
            "Ngách 1 — Tin tức công nghệ ô tô Nhật Bản (@kurumanozokitai): Phân tích cuộc đối đầu xe điện Toyota vs Hyundai/BYD, video đạt 14.000 - 22.000 view sau 7-21 giờ (tốc độ 1.4K VPH > 100x).",
            "Ngách 2 — Bác sĩ tư vấn sức khỏe tuổi 50: Kênh Việt Nam dùng nhân vật AI Bác sĩ nữ áo blouse xanh tư vấn thói quen buổi sáng, nước uống, bệnh gan/thấp khớp cắn hàng chục nghìn view.",
            "Kỹ thuật tạo khung viền (Border Frame) trên CapCut: Thu nhỏ kích thước video xuống 90-92%, đặt trên nền Canvas màu navy/đỏ mận, tạo viền đôi màu vàng kim để tạo mã hash mới tinh né quét AI.",
            "Tối ưu nhận diện thương hiệu: Khung viền phía trên đặt tên chuyên mục cố định, khung viền dưới đặt logo và nút chuông đăng ký kênh.",
            "Bố cục thumbnail tương phản cao: Ảnh xe hơi/bác sĩ bên phải, dòng chữ giật tít cảnh báo in hoa nổi bật bên trái kích thích CTR > 10%."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-e90874": {
        "actual_topic": "Hướng dẫn thực chiến sử dụng bộ Prompt Master tự động nhân bản kịch bản sang mọi thị trường không bị dịch máy sượng gạo",
        "channels_mentioned": [],
        "tools_mentioned": ["ChatGPT", "Claude", "youtube-transcript.io", "Whisper"],
        "key_takeaways": [
            "Nguyên lý hoạt động của Prompt Master: Đóng vai trò như một Biên kịch gia bản địa kỳ cựu (Native Scriptwriter), giữ nguyên 70% cấu trúc logic và viết lại 100% câu từ mượt mà theo văn hóa thị trường đích.",
            "Khắc phục nỗi đau dịch máy Google Translate: Loại bỏ hoàn toàn các câu từ thô cứng, ngô nghê khiến khán giả thoát video sớm (tụt AVD), thay bằng lối kể chuyện truyền cảm (Storytelling).",
            "Quy trình 3 bước nhân bản kịch bản: (1) Lấy transcript qua youtube-transcript.io $\rightarrow$ (2) Nạp Master Prompt vào AI $\rightarrow$ (3) Kiểm tra nhịp điệu đọc và lồng tiếng qua ElevenLabs/Vrew.",
            "Kỹ thuật tạo Hook 15 giây đầu tiên: Prompt tự động sinh ra mở đầu kịch tính, đặt câu hỏi nghịch lý hoặc biến cố lớn nhất để níu chân người nghe ngay lập tức.",
            "Checklist tránh lỗi phổ biến: Phải đổi tên địa danh cho khớp văn hóa Việt/Nhật, loại bỏ các từ sáo rỗng ('Hơn nữa', 'Tóm lại') và kiểm soát thời lượng đạt chuẩn 15-20 phút."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-c5837a": {
        "actual_topic": "Bán content ngách tâm linh Saito Hitori Nhật Bản & Khai thác reup hoạt hình đa thị trường Nhật - Hàn - Việt",
        "channels_mentioned": [
            "@斎藤一人の福の言霊", "@oijfwaoldsfae", "@fansdrWilliamLI",
            "@NắngNhỏToonReview", "@幻界と神域の扉", "@다시이팔청춘-k5d", "@양자과학이야기"
        ],
        "tools_mentioned": ["Bilibili", "CapCut", "YouTube Studio"],
        "key_takeaways": [
            "Hiện tượng kênh Saito Hitori (@斎藤一人の福の言霊): Kênh Nhật Bản khai thác triết lý doanh nhân giàu nhất Nhật Bản Saito Hitori, video 20-30 phút đạt tốc độ xem cực cao (27K view/1 ngày, 44K view/2 ngày).",
            "Bí quyết thumbnail Saito Hitori: Hình ảnh người đàn ông đội mũ phớt quay lưng bí ẩn, phối màu kích thích thị giác chữ trắng - đỏ nổi bật trên nền đen tuyền.",
            "Công thức tiêu đề 'Vị trí tài lộc': 'Chỉ cần làm điều này trong phòng ngủ kim vận bùng nổ', 'Đặt cây trầu bà ở đây thành đại phú', 'Xả thứ này vào bồn cầu tiền bạc kéo đến'...",
            "Kênh mẫu Việt Nam @NắngNhỏToonReview: Reup hoạt hình 2D cổ trang Trung Quốc lồng tiếng cảm xúc thu hút hàng trăm nghìn view từ giới trẻ.",
            "Tư duy nhân bản liên thị trường: Lấy kịch bản lời dạy Saito Hitori chuyển ngữ sang tiếng Hàn và tiếng Việt, giữ thời lượng 25-35 phút tối ưu quảng cáo Mid-roll."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-348217": {
        "actual_topic": "2 Ngách đột phá Bài thuốc bàn ăn Hàn Quốc & Năng lượng lời nói kim vận Nhật Bản; Case study kênh Việt nổ 265K view sau 5 video",
        "channels_mentioned": ["@식탁보약·백세비결", "@金運と言葉の力", "@ĐờiVĩ-u6x"],
        "tools_mentioned": ["CapCut", "YouTube Search", "vidIQ"],
        "key_takeaways": [
            "Ngách 1 — Bài thuốc bàn ăn (@식탁보약·백세비결): Kênh Hàn Quốc chuyên mẹo kết hợp tỏi, hành tây, gừng, giấm táo trên mâm cơm hàng ngày để trị bệnh, thu hút hàng trăm nghìn view từ phụ nữ nội trợ.",
            "Ngách 2 — Năng lượng lời nói kim vận (@金運と言葉の力): Kênh Nhật Bản chia sẻ triết lý nói những câu tích cực vào buổi sáng để thu hút tài vận, kết hợp nhạc thiền và chuông ngân thanh tịnh.",
            "Bằng chứng kênh Việt Nam thực chiến @ĐờiVĩ-u6x: Chỉ mới đăng 5 video đã đạt 1.650 subs và 265.700 views, video thú dữ cắn đề xuất mạnh với đồ thị dốc đứng chỉ sau 2 ngày.",
            "Chiến lược 1 loại thực phẩm duy nhất / video: Tập trung sâu vào 1 nguyên liệu quen thuộc (Tỏi, Bắp cải, Gừng) và nêu bật công thức kết hợp thần dược ngừa bệnh.",
            "Thumbnail cận cảnh nguyên liệu: Chụp cận cảnh đĩa thức ăn/nguyên liệu tươi ngon, có mũi tên chỉ vào điểm mấu chốt kích thích click."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-f74bb1": {
        "actual_topic": "Khai thác ngách cực nhỏ Rau củ dưa chuột & Bữa ăn dưỡng lão Hàn Quốc; Kỹ thuật train Claude bám theo 70% kịch bản đối thủ",
        "channels_mentioned": ["@노후건강한끼", "@건강백단", "@장수채소습관", "@fuetunojin"],
        "tools_mentioned": ["Claude", "CapCut", "YouTube Search"],
        "key_takeaways": [
            "Ngách cực nhỏ Dưa chuột trường thọ (@장수채소습관): Chuyên làm video về quả dưa chuột (ngâm giấm, ăn trước bữa cơm, nước ép giải độc), nguyên liệu rẻ tiền có sẵn trong mọi gia đình nên view cực kỳ cao.",
            "Ngách bữa ăn dưỡng lão 1 bát (@노후건강한끼): Bữa ăn đơn giản cơm gạo lứt + rau luộc + súp miso cho người già sống một mình tại Hàn Quốc.",
            "Case study kênh Nhật Bản bất diệt @fuetunojin: 210K sub / 127 video về nhân vật vĩ đại và triết lý sống trường tồn.",
            "Kỹ thuật train Claude bám theo 70% kịch bản đối thủ: Giữ nguyên 70% cấu trúc luận điểm khoa học, sáng tạo lại 30% phần mở đầu Hook và lời văn gần gũi.",
            "Thumbnail dưa chuột xanh mướt: Hình ảnh quả dưa chuột cắt lát đọng giọt nước + dòng chữ 'MỖI NGÀY 1 QUẢ DƯA CHUỘT' $\rightarrow$ 'ĐƯỜNG HUYẾT VỀ ỔN ĐỊNH'."
        ],
        "accuracy_status": "verified_expert_summary"
    },
    "VIDEO-1aaf46": {
        "actual_topic": "Chiến lược khai thác 6 kho hoạt hình Bilibili chuyên biệt & Bộ quy tắc reup lách bản quyền video ngắn/dài an toàn",
        "channels_mentioned": [],
        "tools_mentioned": ["Bilibili", "CapCut", "Tool Dịch Phụ Đề"],
        "key_takeaways": [
            "Khai thác 6 kho tài nguyên Space Bilibili: Chia sẻ trực tiếp 6 kho chuyên biệt gồm hoạt họa gia đình hài hước, truyện tranh kiếm hiệp tiên hiệp, hoạt họa tổng tài đô thị, truyện 2D cổ trang và hoạt họa đạo lý nhân sinh.",
            "Nguyên tắc Biến đổi sáng tạo (Transformative Use): Không bao giờ bê nguyên si âm thanh gốc, bắt buộc thay thế 100% lời thoại tiếng Trung bằng giọng đọc lồng tiếng mới.",
            "Loại bỏ triệt để phụ đề gốc tiếng Trung: Dùng tính năng Crop hoặc thanh Overlay bar / phụ đề tiếng Việt đè lên vị trí phụ đề cũ.",
            "Thêm giá trị bình luận / diễn biến tâm lý: Thêm lời dẫn truyện và câu cảm thán hài hước để biến video thành một tác phẩm Review phim hoạt hình hợp pháp.",
            "Cắt dựng nhịp phim mới: Đảo vị trí một số phân cảnh, tăng tốc độ 1.05x, chèn hiệu ứng âm thanh SFX tạo sự hấp dẫn cho người xem."
        ],
        "accuracy_status": "verified_expert_summary"
    }
}


def update_docs(doc_list, sku):
    if sku not in NEW_SOPS:
        return doc_list
    sop = NEW_SOPS[sku]
    current = list(doc_list or [])
    # kiểm tra xem đã có sop này chưa
    if not any(d.get("name") == sop["name"] or d.get("link") == sop["link"] for d in current):
        current.insert(0, sop)
    return current


def main():
    skus = list(NEW_SOPS.keys())

    # 1. Cập nhật catalog.json
    cat_path = ROOT / "data" / "catalog.json"
    cat = json.load(open(cat_path, encoding="utf-8"))
    for c in cat:
        sku = c.get("sku")
        if sku in skus:
            c["docs"] = update_docs(c.get("docs"), sku)
    json.dump(cat, open(cat_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/catalog.json")

    # 2. Cập nhật catalog_full.json
    cat_full_path = ROOT / "data" / "catalog_full.json"
    cat_full = json.load(open(cat_full_path, encoding="utf-8"))
    for c in cat_full:
        sku = c.get("sku")
        if sku in skus:
            c["docs"] = update_docs(c.get("docs"), sku)
    json.dump(cat_full, open(cat_full_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/catalog_full.json")

    # 3. Cập nhật modules.json
    mod_path = ROOT / "data" / "modules.json"
    mod = json.load(open(mod_path, encoding="utf-8"))
    for m in mod.get("modules", []):
        for it in m.get("items", []):
            sku = it.get("sku")
            if sku in skus:
                it["docs"] = update_docs(it.get("docs"), sku)
    json.dump(mod, open(mod_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Updated data/modules.json")

    # 4. Cập nhật data-tabs/videos.json
    vj_path = ROOT / "data-tabs" / "videos.json"
    vj = json.load(open(vj_path, encoding="utf-8"))
    for v in vj:
        sku = v.get("sku") or v.get("id")
        if sku in skus:
            v["docs"] = update_docs(v.get("docs"), sku)
        if sku in CHANNELS_UPDATE:
            v["channels"] = CHANNELS_UPDATE[sku]
            print(f"Updated channels for {sku}: {v['channels']}")
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
