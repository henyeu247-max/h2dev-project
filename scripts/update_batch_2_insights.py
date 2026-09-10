# -*- coding: utf-8 -*-
"""
update_batch_2_insights.py
Cập nhật phân tích chuyên sâu chuẩn xác 100% từ lời thoại thực tế cho Batch 2 (Videos 05 - 08):
- VIDEO-4b3c09: Update 4 ngách nhỏ làm bán content thị trường Hàn Quốc
- VIDEO-28e1cc: Show kênh mới vừa bật kiếm tiền & Hướng dẫn full quy trình Reup hoạt hình Bilibili
- VIDEO-d2cd90: Update 5 ngách nhỏ bán content ngoại mới nhất (Inamori Kazuo, Thiền, Trẻ hóa 20 tuổi JP)
- VIDEO-9aff6d: 4 video nổ 300k view - Xe điện JP, Mẹo vặt JP & Kỹ thuật tạo khung phông xanh ChatGPT
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
DATA_TABS_DIR = os.path.join(ROOT, 'data-tabs')

BATCH_2 = {
    "VIDEO-4b3c09": {
        "sku": "VIDEO-4b3c09",
        "title": "Update 4 ngách nhỏ làm bán content thị trường Hàn Quốc",
        "actual_topic": "Update 4 Ngách Nhỏ Bán Content Hàn Quốc & Sai Lầm Làm Nát Kênh Vừa Short Vừa Dài",
        "category_group": "ngach_xanh",
        "niche_primary": "Ẩm Thực & Mẹo Vặt Hàn Quốc",
        "niche_id": "am-thuc-meo-vat-han",
        "target_market": "Hàn Quốc",
        "market_code": "KR",
        "key_takeaways": [
            "Ngách 1 - Chế biến mẹo vặt ẩm thực Hàn Quốc: Kênh 14 video nổ >200k view từ khóa 'hành tây + tương ớt' và 'mẹo bảo quản chuối' (chiến lược bán content lấy 70% bám sát video mẹo bảo quản chuối).",
            "Ngách 2 - Sức khỏe & Thói quen ẩm thực nam giới: Đánh vào tâm lý thói quen ăn uống giúp đàn ông sống thọ qua 80 tuổi.",
            "Ngách 3 - Mẹo vặt Lò vi sóng Hàn Quốc (Microwave Hacks): Chế biến khoai lang, bột ớt, khoai tây bằng lò vi sóng trong 3-5 phút (Lưu ý: Không lạm dụng 100% ảnh AI tĩnh, phải đan xen video B-roll minh họa để tránh bị reset kiếm tiền).",
            "Ngách 4 - Triết lý sống Hàn Quốc: Focus vào 2 nhân vật tóc ngắn và tóc xù ('khi gặp gỡ đừng vội khen ngợi').",
            "Cảnh báo nát kênh: Tuyệt đối không vừa làm Short vừa làm Dài trên cùng một kênh, và không đổi ngách lung tung trên kênh cũ (sẽ bị flop nặng, khuyên nên tạo kênh mới)."
        ],
        "edit_sop": {
            "primary": "Lồng tiếng AI tiếng Hàn + B-roll chế biến thực tế/thiên nhiên (hạn chế lạm dụng ảnh AI tĩnh 100%)",
            "additional": [
                "Đồng bộ bộ nhận diện thumbnail theo đúng 1 style nhân vật hoặc màu sắc ngách.",
                "Chọn kịch bản từ video có chỉ số WPH cao nhất của đối thủ để làm lại."
            ]
        },
        "avoid_flags": [
            "Tuyệt đối không vừa đăng video ngắn (Shorts) vừa đăng video dài trên cùng một kênh vì bóp tương tác video dài.",
            "Không chuyển đổi chủ đề/ngách liên tục trên kênh cũ khiến thuật toán không phân phối được tệp khán giả.",
            "Tránh dùng kịch bản giật tít sai sự thật khiến kênh bị YouTube quét xóa kênh (đai kênh)."
        ],
        "tools_mentioned": ["AI Voice", "CapCut", "Google Translate", "Claude"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Phân tích ngách Chế biến ẩm thực & Mẹo bảo quản chuối nổ 200k view"},
            {"time": "02:15", "seconds": 135, "label": "Ngách Sức khỏe & Thói quen sống thọ đàn ông 80 tuổi"},
            {"time": "03:40", "seconds": 220, "label": "Ngách Mẹo vặt Lò vi sóng 3-5 phút & Cảnh báo lạm dụng ảnh AI"},
            {"time": "06:10", "seconds": 370, "label": "Ngách Triết lý sống Hàn Quốc tập trung 2 nhân vật"},
            {"time": "08:30", "seconds": 510, "label": "Cảnh báo làm nát kênh khi vừa làm Short vừa làm Dài & Lỗi die kênh"}
        ]
    },
    "VIDEO-28e1cc": {
        "sku": "VIDEO-28e1cc",
        "title": "Show kênh mới vừa bật kiếm tiền Và Hướng dẫn thực chiến full quy trình làm Reup ngách nhỏ hoạt hình từ bilibili",
        "actual_topic": "Show Kênh Reup Bilibili Bật Kiếm Tiền & Hướng Dẫn Full Quy Trình Edit CapCut + Thumb ChatGPT",
        "category_group": "nguon_reup",
        "niche_primary": "Reup Hoạt Hình Bilibili",
        "niche_id": "reup-bilibili-hoat-hinh",
        "target_market": "Việt Nam (Nguồn Trung Quốc)",
        "market_code": "VN",
        "key_takeaways": [
            "Show kết quả thực tế: Kênh học viên Pro Reup phim hoạt hình/Đam mỹ Bilibili bật kiếm tiền ngày 09/07, add tài khoản Google AdSense (GA) thành công.",
            "Nguồn tải video sạch: Dùng trình duyệt Cốc Cốc tải trực tiếp video Full HD từ Bilibili không cần tool (chỉ tải video free không có icon sấm sét hồng).",
            "Quy trình xử lý âm thanh: Giảm tốc độ video gốc về 0.8x -> Trích xuất phụ đề tiếng Trung -> Dịch sang tiếng Việt -> Tạo giọng đọc AI Ngọc Huyền (tốc độ 1.5x - 1.6x) -> XÓA HẲN âm thanh gốc để tránh dính bản quyền nhạc nền.",
            "Kỹ thuật tạo Preset (Kiểu cài sẵn): Tạo khung chữ chạy, logo xoay rồi bấm 'Lưu kiểu cài sẵn' trên CapCut để áp dụng tự động cho các tập phim sau.",
            "Tư duy làm Thumbnail bằng ChatGPT: Dịch tiêu đề tập phim -> Upload ảnh cap màn hình cảnh đẹp -> Prompt ChatGPT tạo thumbnail Anime 3D đồng bộ."
        ],
        "edit_sop": {
            "primary": "Tải video Bilibili bằng Cốc Cốc -> Giảm tốc 0.8x -> Dịch sub -> Lồng tiếng AI Ngọc Huyền 1.6x -> Xóa nhạc gốc -> Che logo/sub Trung bằng Blur -> Tăng tốc độ tổng 1.3x",
            "additional": [
                "Lưu kiểu cài sẵn (Preset) cho khung text chạy và logo góc để tiết kiệm 80% thời gian edit.",
                "Tạo thumbnail Anime 3D bằng ChatGPT dựa trên kịch bản tập phim."
            ]
        },
        "avoid_flags": [
            "Tuyệt đối không giữ lại âm thanh gốc của video Bilibili vì 90% chứa nhạc nền dính bản quyền Content ID.",
            "Không để lộ chữ Bilibili và phụ đề tiếng Trung trên màn hình (phải làm mờ Blur hoặc che logo).",
            "Tránh tải các video có icon sấm sét màu hồng (video trả phí VIP của Bilibili bị giới hạn chất lượng)."
        ],
        "tools_mentioned": ["Cốc Cốc", "CapCut", "Tool Dịch", "ChatGPT", "Vbee"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Show kênh học viên bật kiếm tiền ngày 09/07 & Kết nối GA"},
            {"time": "01:30", "seconds": 90, "label": "Cách tải video Full HD Bilibili miễn phí bằng Cốc Cốc"},
            {"time": "03:10", "seconds": 190, "label": "Quy trình trích xuất sub Trung, dịch thuật & tạo voice AI"},
            {"time": "05:45", "seconds": 345, "label": "Kỹ thuật che logo Bilibili, xóa nhạc dính bản quyền & tăng tốc 1.3x"},
            {"time": "08:15", "seconds": 495, "label": "Cách tạo Preset cài sẵn trên CapCut & Prompt Thumbnail ChatGPT"}
        ]
    },
    "VIDEO-d2cd90": {
        "sku": "VIDEO-d2cd90",
        "title": "Update 5 ngách nhỏ bán content ngoại mới nhất",
        "actual_topic": "Update 5 Ngách Bán Content Ngoại: Triết Lý Inamori Kazuo, Thiền Định, Trẻ Hóa 20 Tuổi JP",
        "category_group": "ngach_xanh",
        "niche_primary": "Triết Lý & Trẻ Hóa Nhật Bản",
        "niche_id": "triet-ly-tre-hoa-nhat",
        "target_market": "Nhật Bản & Hàn Quốc",
        "market_code": "JP",
        "key_takeaways": [
            "Ngách 1 - Triết lý Kazuo Inamori (Nhật Bản): Kênh 16 video trên nền kênh cổ 2020 nổ 64k - 66k view (Copy từ khóa tiếng Nhật '稲盛和夫' để tìm kênh đối thủ).",
            "Ngách 2 - Ngồi thiền & Tịnh tâm Nhật Bản (Zen & Meditation): Kênh mới 1 tháng, nổ 70k view sau 4 ngày.",
            "Ngách 3 - Sức khỏe & Mẹo chế biến món ăn Hàn Quốc: Kênh 10 video mới lập 2 tuần, nổ liên tiếp 149k view & 142k view.",
            "Ngách 4 - Trẻ hóa ngược / Bí quyết trẻ mãi như tuổi 20 Nhật Bản: Kênh 18 video nổ >200k view (Đánh trúng tâm lý dân số già Nhật Bản muốn người 50-60 tuổi trẻ đẹp như 20 tuổi).",
            "Ngách 5 - Triết lý đối thoại 2 nhân vật (Dual-Character Philosophy): Kênh 25 video nổ 400k view sau 9 ngày nhờ tư duy kết hợp 2 danh nhân/triết gia đàm đạo."
        ],
        "edit_sop": {
            "primary": "Ghép video B-roll thiên nhiên/phong cảnh mờ phía sau + Nhân vật triết gia nổi bật phía trước + Sub Nhật/Hàn to rõ",
            "additional": [
                "Đánh trúng từ khóa trong ngoặc vuông: 'Trẻ hóa 20 tuổi' hoặc tên nhân vật cụ thể.",
                "Tạo kịch bản chất lượng cao bằng Claude/ChatGPT từ các đầu sách triết học kinh điển."
            ]
        },
        "avoid_flags": [
            "Không làm ngách triết lý chung chung vô định không có điểm nhấn nhân vật cụ thể.",
            "Tránh giật tít y tế sai sự thật khi làm ngách trẻ hóa (hướng về lối sống, thói quen ăn uống tự nhiên)."
        ],
        "tools_mentioned": ["AI Voice", "CapCut", "Claude", "Google Translate"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Ngách 1: Triết lý kinh doanh & cuộc đời Kazuo Inamori Nhật Bản"},
            {"time": "02:00", "seconds": 120, "label": "Ngách 2: Ngồi thiền & Tịnh tâm Nhật Bản nổ 70k view"},
            {"time": "03:15", "seconds": 195, "label": "Ngách 3: Mẹo chế biến ẩm thực sống khỏe Hàn Quốc 149k view"},
            {"time": "04:40", "seconds": 280, "label": "Ngách 4: Bí quyết trẻ hóa tuổi 20 đánh trúng tệp già Nhật Bản 200k view"},
            {"time": "07:10", "seconds": 430, "label": "Ngách 5: Triết lý kết hợp 2 nhân vật đối thoại nổ 400k view"}
        ]
    },
    "VIDEO-9aff6d": {
        "sku": "VIDEO-9aff6d",
        "title": "4 video nổ hơn 300k view - Update 2 ngách mới cực kỳ trends và hướng dẫn edit tạo khung cho ngách nhỏ...",
        "actual_topic": "Xe Điện & Mẹo Vặt Nhật Bản 300k View + Hướng Dẫn Tạo Khung Phông Xanh ChatGPT",
        "category_group": "ngach_xanh",
        "niche_primary": "Công Nghệ & Mẹo Vặt Cuộc Sống Nhật",
        "niche_id": "cong-nghe-meo-vat-nhat",
        "target_market": "Nhật Bản",
        "market_code": "JP",
        "key_takeaways": [
            "Ngách 1 - Phân tích biến động Xe điện / Ô tô Nhật Bản: Kênh cổ 2011 spam 2 video/ngày nổ view ngay lập tức với từ khóa đuôi 'Giải thích chi tiết' (phân tích biến động Hyundai, Toyota).",
            "Ngách 2 - Mẹo vặt cuộc sống Nhật Bản (Life Hacks JP): Kênh 4 video ra đều 3 ngày/video nổ >200k view từ khóa mẹo diệt muỗi và lọc sạch nước từ 2 thanh kim loại (khuyên đan xen video B-roll thật).",
            "Khám kênh Sức Khỏe: Kênh 15 video nổ >20k view từ khóa 'Tai biến' & 'Ung thư vòm họng' (Bài học: Bám sát từ khóa cắn đề xuất, tránh làm từ khóa nguội như bài thuốc thấp khớp chỉ có vài view).",
            "Nguồn kịch bản US: Chỉ lấy kịch bản từ các kênh US về nhân bản/dịch sang tiếng Nhật/Hàn/Việt, không cạnh tranh trực tiếp tại thị trường US.",
            "Kỹ thuật tạo khung Phông xanh ChatGPT: Chụp ảnh khung kênh đối thủ -> Nhập prompt yêu cầu ChatGPT tạo khung 2 ô (1 ô chữ nhật cho B-roll thật, 1 ô dọc phông xanh cho nhân vật bác sĩ)."
        ],
        "edit_sop": {
            "primary": "Tạo khung Layout 2 ô bằng ChatGPT (ô B-roll + ô nhân vật phông xanh) + Đổi màu nhận diện thương hiệu",
            "additional": [
                "Đan xen video B-roll thiên nhiên/khoa học thật với hình ảnh AI để tránh quét inauthentic.",
                "Gắn từ khóa 'Giải thích chi tiết' ở cuối tiêu đề theo format kênh Nhật."
            ]
        },
        "avoid_flags": [
            "Không tự ý nhảy sang làm các từ khóa nguội không ai tìm kiếm (như bài thuốc thấp khớp) khi kênh đang cắn đề xuất.",
            "Không nên trực tiếp làm kênh thị trường Mỹ (US) vì độ cạnh tranh quá khốc liệt, hãy lấy kịch bản nhân bản sang Nhật/Hàn."
        ],
        "tools_mentioned": ["ChatGPT", "AI Voice", "CapCut", "Google Translate"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Ngách 1: Phân tích biến động Xe điện / Ô tô Nhật Bản nổ view"},
            {"time": "02:10", "seconds": 130, "label": "Ngách 2: Mẹo vặt cuộc sống Nhật Bản 4 video nổ 200k view"},
            {"time": "04:30", "seconds": 270, "label": "Khám kênh Sức Khỏe: Bài học bám sát từ khóa 'Tai biến' nổ 20k view"},
            {"time": "06:40", "seconds": 400, "label": "Tư duy lấy kịch bản kênh US nhân bản sang Nhật/Hàn/Việt"},
            {"time": "08:15", "seconds": 495, "label": "Hướng dẫn thực chiến dùng ChatGPT tạo khung phông xanh 2 ô"}
        ]
    }
}

def main():
    insights_path = os.path.join(DATA_DIR, 'video_insights.json')
    cat_full_path = os.path.join(DATA_DIR, 'catalog_full.json')
    cat_path = os.path.join(DATA_DIR, 'catalog.json')
    videos_tab_path = os.path.join(DATA_TABS_DIR, 'videos.json')

    # 1. Update video_insights.json
    with open(insights_path, 'r', encoding='utf-8') as f:
        insights = json.load(f)
    for sku, data in BATCH_2.items():
        insights[sku] = data
    with open(insights_path, 'w', encoding='utf-8') as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)

    # 2. Update catalog_full.json
    with open(cat_full_path, 'r', encoding='utf-8') as f:
        cat_full = json.load(f)
    for item in cat_full:
        sku = item.get('sku')
        if sku in BATCH_2:
            ins = BATCH_2[sku]
            item['actual_topic'] = ins['actual_topic']
            item['niche_primary'] = ins['niche_primary']
            item['target_market'] = ins['target_market']
            item['market_code'] = ins['market_code']
    with open(cat_full_path, 'w', encoding='utf-8') as f:
        json.dump(cat_full, f, ensure_ascii=False, indent=2)

    # 3. Update catalog.json
    with open(cat_path, 'r', encoding='utf-8') as f:
        cat = json.load(f)
    for item in cat:
        sku = item.get('sku')
        if sku in BATCH_2:
            ins = BATCH_2[sku]
            item['actual_topic'] = ins['actual_topic']
            item['niche_primary'] = ins['niche_primary']
            item['target_market'] = ins['target_market']
            item['market_code'] = ins['market_code']
    with open(cat_path, 'w', encoding='utf-8') as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)

    # 4. Update data-tabs/videos.json
    with open(videos_tab_path, 'r', encoding='utf-8') as f:
        tab_videos = json.load(f)
    for item in tab_videos:
        sku = item.get('sku')
        if sku in BATCH_2:
            ins = BATCH_2[sku]
            item['contentNiche'] = ins['niche_primary']
            item['niche'] = ins['niche_primary']
            m_code = ins['market_code']
            if m_code == 'JP':
                item['market'] = ["🇯🇵 Nhật"]
            elif m_code == 'KR':
                item['market'] = ["🇰🇷 Hàn"]
            elif m_code == 'VN':
                item['market'] = ["🇻🇳 Việt"]
            elif m_code == 'CN':
                item['market'] = ["🇨🇳 Trung"]
            elif m_code == 'US':
                item['market'] = ["🇺🇸 Mỹ / Ngoại"]
            else:
                item['market'] = ["🌐 Ngoại"]
    with open(videos_tab_path, 'w', encoding='utf-8') as f:
        json.dump(tab_videos, f, ensure_ascii=False, indent=2)

    print("✅ Đã cập nhật thành công 100% dữ liệu chi tiết cho BATCH 2 (Videos 05-08)!")

if __name__ == '__main__':
    main()
