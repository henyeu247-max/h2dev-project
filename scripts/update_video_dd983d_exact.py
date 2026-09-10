# -*- coding: utf-8 -*-
"""
update_video_dd983d_exact.py
Cập nhật phân tích thủ công 100% từng chi tiết lời thoại cho VIDEO-DD983D:
- 3 kênh Drama đối thủ Nhật Bản (5 ngày 80k view, kênh lớn >100 video >2h bật kiếm tiền, kênh cổ 2009 4k sub).
- SOP tự quay B-roll hồ cá/tay gõ phím thật né Reused Content / AI quét.
- Nguồn kịch bản từ đối thủ Nhật & nhân bản từ Drama Hàn.
- Khám kênh học viên ngách Lời dạy Kukai & Quy tắc kiên trì 10-15 video đầu tiên.
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
DATA_TABS_DIR = os.path.join(ROOT, 'data-tabs')

INSIGHT_DD983D = {
    "sku": "VIDEO-DD983D",
    "title": "Update ngách thị trường Nhật và phân tích + cách edit để không bị quét lỗi do AI và một số lỗi liên quan..",
    "actual_topic": "Ngách Drama Gia Đình Nhật Bản: So Sánh 3 Kênh Mẫu, Kỹ Thuật Edit B-Roll Thật Né Quét AI & Khám Kênh Kukai",
    "category_group": "ngach_xanh",
    "niche_primary": "Drama Gia Đình & Xã Hội Nhật Bản",
    "niche_id": "drama-gia-dinh-nhat",
    "target_market": "Nhật Bản",
    "market_code": "JP",
    "key_takeaways": [
        "Phân tích 3 kênh Drama gia đình Nhật: Kênh 1 (mới 5 ngày 14 video đạt 80k view nhưng chỉ giảm sáng video stock -> dễ bị quét); Kênh 2 (lớn >100 video, video dài >2 tiếng, bật kiếm tiền bền vững nhờ tự quay B-roll hồ cá/phong cảnh thật); Kênh 3 (kênh cổ 2009 4k sub, quay tay gõ phím + stock Pexels/Pixabay -> nguy cơ dính Reused Content).",
        "SOP Edit né quét AI độc bản: Tự quay video B-roll thật (hồ cá sắc nét, phong cảnh đẹp, bàn tay gõ phím) làm nền sạch 100% + lồng tiếng AI truyền cảm + chèn sub to rõ + khai báo có sử dụng AI trong YouTube Studio.",
        "Nguồn kịch bản: Lấy từ các video đối thủ Nhật Bản đang nổ view xào nấu lại, hoặc sang thị trường Drama Hàn Quốc lấy kịch bản về dịch và nhân bản sang tiếng Nhật.",
        "Khám kênh học viên ngách Lời dạy Kukai (Nhật Bản): Bài học kiên trì khi 1 tháng đầu chỉ vài trăm view lẹt đẹt, đến tuần 2-3 mới bắt đầu cắn đề xuất nổ view (quy tắc bắt buộc đăng đều tối thiểu 10-15 video đầu tiên, không bỏ cuộc).",
        "Cảnh báo tool tự động: Tuyệt đối không dùng tool auto hàng loạt sơ sài vì vừa tốn tiền tài nguyên AI vừa dễ bị quét tắt kiếm tiền."
    ],
    "edit_sop": {
        "primary": "Tự quay B-roll thật cảnh hồ cá/phong cảnh nét + quay tay gõ phím làm nền -> Lồng tiếng AI kể chuyện drama -> Ghép phụ đề nổi bật -> Khai báo có sử dụng AI trong YouTube Studio",
        "additional": [
            "Dựng video dài (long-form) từ 1-2 tiếng để tối ưu thời lượng xem trung bình (AVD) và doanh thu quảng cáo.",
            "Lấy kịch bản từ các kênh Drama Hàn Quốc dịch và bản địa hóa sang tiếng Nhật."
        ]
    },
    "avoid_flags": [
        "Tránh tải 100% video stock Pexels/Pixabay về làm nền mà không quay thêm cảnh thật, dễ dính lỗi Sử dụng lại nội dung (Reused Content).",
        "Tránh dùng các tool tự động hóa hàng loạt không có sự can thiệp và sáng tạo thủ công.",
        "Không nản lòng khi 3-5 video đầu chưa có view, bắt buộc phải đăng đều đặn tối thiểu 10-15 video."
    ],
    "tools_mentioned": ["AI Voice", "Pexels", "Pixabay", "CapCut", "YouTube Studio"],
    "channels_mentioned": ["@明日へ歩く日々"],
    "key_timestamps": [
        {"time": "00:00", "seconds": 0, "label": "Giới thiệu ngách Drama Nhật & Kênh mới 5 ngày nổ 80k view"},
        {"time": "01:40", "seconds": 100, "label": "So sánh Kênh 2 (>100 video, >2h, bật kiếm tiền bền vững nhờ B-roll thật)"},
        {"time": "03:15", "seconds": 195, "label": "Kỹ thuật Edit: Tự quay hồ cá/tay gõ phím & Cảnh báo lỗi Reused Content từ Stock"},
        {"time": "05:40", "seconds": 340, "label": "Nguồn kịch bản: Lấy từ đối thủ Nhật hoặc nhân bản từ Drama Hàn Quốc"},
        {"time": "07:30", "seconds": 450, "label": "Khám kênh học viên ngách Lời dạy Kukai & Quy tắc kiên trì 10-15 video"}
    ]
}

def main():
    insights_path = os.path.join(DATA_DIR, 'video_insights.json')
    cat_full_path = os.path.join(DATA_DIR, 'catalog_full.json')
    cat_path = os.path.join(DATA_DIR, 'catalog.json')
    videos_tab_path = os.path.join(DATA_TABS_DIR, 'videos.json')

    # 1. Update video_insights.json
    with open(insights_path, 'r', encoding='utf-8') as f:
        insights = json.load(f)
    insights["VIDEO-DD983D"] = INSIGHT_DD983D
    with open(insights_path, 'w', encoding='utf-8') as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)

    # 2. Update catalog_full.json
    with open(cat_full_path, 'r', encoding='utf-8') as f:
        cat_full = json.load(f)
    for item in cat_full:
        if item.get('sku') == "VIDEO-DD983D":
            item['actual_topic'] = INSIGHT_DD983D['actual_topic']
            item['niche_primary'] = INSIGHT_DD983D['niche_primary']
            item['target_market'] = INSIGHT_DD983D['target_market']
            item['market_code'] = INSIGHT_DD983D['market_code']
            item['channels'] = INSIGHT_DD983D['channels_mentioned']
    with open(cat_full_path, 'w', encoding='utf-8') as f:
        json.dump(cat_full, f, ensure_ascii=False, indent=2)

    # 3. Update catalog.json
    with open(cat_path, 'r', encoding='utf-8') as f:
        cat = json.load(f)
    for item in cat:
        if item.get('sku') == "VIDEO-DD983D":
            item['actual_topic'] = INSIGHT_DD983D['actual_topic']
            item['niche_primary'] = INSIGHT_DD983D['niche_primary']
            item['target_market'] = INSIGHT_DD983D['target_market']
            item['market_code'] = INSIGHT_DD983D['market_code']
    with open(cat_path, 'w', encoding='utf-8') as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)

    # 4. Update data-tabs/videos.json
    with open(videos_tab_path, 'r', encoding='utf-8') as f:
        tab_videos = json.load(f)
    for item in tab_videos:
        if item.get('sku') == "VIDEO-DD983D":
            item['contentNiche'] = INSIGHT_DD983D['niche_primary']
            item['niche'] = INSIGHT_DD983D['niche_primary']
            item['market'] = ["🇯🇵 Nhật"]
            item['channels'] = INSIGHT_DD983D['channels_mentioned']
    with open(videos_tab_path, 'w', encoding='utf-8') as f:
        json.dump(tab_videos, f, ensure_ascii=False, indent=2)

    print("✅ Đã cập nhật thành công 100% dữ liệu chi tiết thủ công cho VIDEO-DD983D!")

if __name__ == '__main__':
    main()
