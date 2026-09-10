# -*- coding: utf-8 -*-
"""
update_batch_3_insights.py
Cập nhật phân tích chuyên sâu thủ công, chuẩn xác 100% từ lời thoại thực tế cho Batch 3 (Videos 09 - 12):
- VIDEO-e90874: Tặng Prompt Master Tự Nhân Bản Sang Mọi Thị Trường
- VIDEO-c5837a: Bán Content Tâm Linh Saito Hitori & Kỹ Thuật Tìm Nguồn Reup Bilibili
- VIDEO-348217: Nhân Bản US sang Việt & Ngách Sức Khỏe Thực Phẩm Hàn / Saito Hitori Nhật
- VIDEO-f74bb1: Ngách Cực Nhỏ Sức Khỏe Rau Củ Dưa Chuột Hàn Quốc & Kỹ Thuật Nhân Bản Chéo Việt-Hàn
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
DATA_TABS_DIR = os.path.join(ROOT, 'data-tabs')

BATCH_3 = {
    "VIDEO-e90874": {
        "sku": "VIDEO-e90874",
        "title": "Tặng Prompt Master Tự Nhân Bản Sang Mọi Thị Trường (bất kỳ mong muốn) | Hướng Dẫn Thực Chiến",
        "actual_topic": "Hướng Dẫn Dùng Prompt Master Nhân Bản Kịch Bản Đa Thị Trường (US, JP, KR, VN)",
        "category_group": "kich_ban",
        "niche_primary": "Prompt AI & Nhân Bản Kịch Bản",
        "niche_id": "prompt-master-nhan-ban",
        "target_market": "Toàn Cầu / Việt Nam",
        "market_code": "GLOBAL",
        "key_takeaways": [
            "Share bộ Prompt Master (Form Master) đóng gói trên Claude để nhân bản kịch bản từ bất kỳ thị trường gốc nào (US, Nhật, Hàn) sang thị trường đích mong muốn.",
            "Quy trình train AI 2 giai đoạn: Giai đoạn 1 (Nạp 2 kịch bản cao view nhất + ảnh chụp màn hình kênh đối thủ để AI học cấu trúc); Giai đoạn 2 (Cấu hình thị trường đích, độ tuổi khán giả, giọng điệu vùng miền như 'dưa chuột' vs 'dưa leo', định dạng số đọc cho voice AI).",
            "Tư duy bản địa hóa (Localization): Không dịch thô cứng máy móc, mà chuyển thể văn phong, bối cảnh văn hóa, cách xưng hô và nhịp điệu của người bản xứ thị trường đích.",
            "Kỹ thuật xuất kịch bản chất lượng: Chia nhỏ từng phần (Part 1, Part 2...) và bấm 'tiếp tục' để AI đào sâu chi tiết, tránh để AI viết 1 lần bị nông cạn.",
            "Show kết quả thực tế: 2 kênh sức khỏe nổ view tại Việt Nam (kênh 9 video đạt >2 triệu view dùng HeyGen) và kênh sức khỏe huyết áp Nhật Bản."
        ],
        "edit_sop": {
            "primary": "Nạp 2 kịch bản cao view đối thủ vào Prompt Master Claude -> Cấu hình thị trường đích -> Xuất kịch bản từng phần -> Lồng tiếng AI (ElevenLabs/Vbee) + Ghép B-roll thật",
            "additional": [
                "Yêu cầu AI xuất kèm tiêu đề viral 3 dòng cho thumbnail và prompt tạo ảnh chi tiết.",
                "Chọn phương án xưng hô và thuật ngữ vùng miền chuẩn với tệp khán giả mục tiêu."
            ]
        },
        "avoid_flags": [
            "Tuyệt đối không dịch thô cứng bằng Google Translate mà không qua chuẩn hóa ngữ cảnh văn hóa bản địa.",
            "Tránh yêu cầu AI viết toàn bộ kịch bản trong 1 lần vì sẽ bị thiếu chi tiết và hạn chế số lượng token."
        ],
        "tools_mentioned": ["Claude", "ChatGPT", "HeyGen", "ElevenLabs", "Vbee", "CapCut"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Giới thiệu Prompt Master nhân bản kịch bản sang mọi thị trường"},
            {"time": "01:30", "seconds": 90, "label": "Show kênh Sức khỏe Việt Nam 9 video đạt >2 triệu view"},
            {"time": "03:45", "seconds": 225, "label": "Quy trình Giai đoạn 1: Nạp 2 kịch bản đối thủ vào Claude"},
            {"time": "07:15", "seconds": 435, "label": "Quy trình Giai đoạn 2: Cấu hình thị trường đích & giọng điệu"},
            {"time": "11:20", "seconds": 680, "label": "Xuất kịch bản theo từng phần sâu sắc & Prompt Thumbnail"}
        ]
    },
    "VIDEO-c5837a": {
        "sku": "VIDEO-c5837a",
        "title": "Update share các ngách Bán content và Reup mới nhất - tất cả thị trường Nhật - Hàn - Việt",
        "actual_topic": "Bán Content Tâm Linh Saito Hitori Nhật Bản & Hướng Dẫn Tìm Nguồn Reup Bilibili",
        "category_group": "ngach_xanh",
        "niche_primary": "Tâm Linh & Triết Lý Saito Hitori",
        "niche_id": "tam-linh-saito-hitori-nhat",
        "target_market": "Nhật Bản & Việt Nam",
        "market_code": "JP",
        "key_takeaways": [
            "Show kết quả học viên Pro: Kênh mới lập 1 tuần (7 video) đạt hơn 200k view (video đầu tiên >100k view) ngách Tâm linh / Triết lý may mắn gắn với tỷ phú Nhật Saito Hitori (斎藤一人).",
            "Khám kênh dính lỗi Spam: Kênh mới 1 tuần mà đăng dồn dập >20 video (3-4 video/ngày) khiến YouTube bóp tương tác (SOP chuẩn: 4-5 video đầu đăng cách ngày, sau 5 video mới đăng 1 video/ngày).",
            "Lấy nguồn Content Sức Khỏe US: Kênh US triệu view về ông tiến sĩ -> Chỉ lấy kịch bản về dịch xào nấu sang Việt/Nhật/Hàn (Tuyệt đối không cạnh tranh trực tiếp ở thị trường US vì cạnh tranh quá khốc liệt).",
            "Kỹ thuật tìm nguồn Reup Bilibili: Dịch tiêu đề sang tiếng Trung -> Search Bilibili -> Chọn tập phim dài >1 tiếng hoặc đề xuất bên phải -> Tải về edit.",
            "Share ngách Phật Pháp Nhật Bản: Kênh 7 ngày trước nổ view cao để anh em làm theo."
        ],
        "edit_sop": {
            "primary": "Dịch tiêu đề sang tiếng Trung -> Search Bilibili -> Tải bản Full HD -> Giảm tốc độ, che logo và xóa nhạc gốc -> Lồng tiếng AI",
            "additional": [
                "Lên lịch đăng bài cách ngày cho 5 video đầu tiên để tránh bị thuật toán đánh giá spam.",
                "Ghép nhân vật Saito Hitori hoặc hình tượng may mắn vào thumbnail."
            ]
        },
        "avoid_flags": [
            "Tuyệt đối không spam 3-4 video/ngày trên kênh mới lập vì sẽ bị YouTube đánh giá spam và bóp tương tác.",
            "Không nên làm kênh trực tiếp tại thị trường US vì mức độ cạnh tranh toàn cầu và pháp sư Ấn Độ cực kỳ cao."
        ],
        "tools_mentioned": ["Bilibili", "Google Translate", "AI Voice", "CapCut"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Khám kênh học viên ngách Saito Hitori 7 video nổ 200k view"},
            {"time": "02:10", "seconds": 130, "label": "Cảnh báo lỗi spam 3-4 video/ngày làm nát kênh & Nhịp độ đăng chuẩn"},
            {"time": "04:30", "seconds": 270, "label": "Nguồn kịch bản Sức khỏe US: Tư duy lấy về nhân bản sang Việt/Nhật"},
            {"time": "06:15", "seconds": 375, "label": "Hướng dẫn thực chiến cách tìm nguồn phim dài trên Bilibili"},
            {"time": "08:40", "seconds": 520, "label": "Share thêm ngách Phật Pháp Nhật Bản nổ view ổn định"}
        ]
    },
    "VIDEO-348217": {
        "sku": "VIDEO-348217",
        "title": "Update thêm 2 ngách mới nhất cực trend thị trường Hàn và Nhật",
        "actual_topic": "Tư Duy Nhân Bản Kịch Bản US Sang Việt + 2 Ngách Thực Chiến: Sức Khỏe KR & Tâm Linh Saito Hitori JP",
        "category_group": "ngach_xanh",
        "niche_primary": "Nhân Bản Thị Trường (Hàn - Nhật)",
        "niche_id": "nhan-ban-thi-truong-han-nhat",
        "target_market": "Hàn Quốc & Nhật Bản",
        "market_code": "KR",
        "key_takeaways": [
            "Case Study thực tế: Kênh học viên Pro nhân bản kịch bản từ US về làm tại Việt Nam, bật kiếm tiền thành công và tăng trưởng view đều đặn.",
            "Quy tắc bản quyền khi nhân bản: Chỉ lấy phần ý tưởng/kịch bản gốc về dịch và xào nấu; TOÀN BỘ hình ảnh và video B-roll bắt buộc phải tự quay hoặc gen AI mới 100% (tuyệt đối không tải video đối thủ về dùng lại).",
            "Ngách 1 (Hàn Quốc) - Sức khỏe & Rau củ thực phẩm: Kênh mới giữa tháng 6 nổ view từ khóa củ khoai tây, bảo quản thực phẩm và dinh dưỡng người già.",
            "Ngách 2 (Nhật Bản) - Tâm linh & May mắn Saito Hitori: Kênh mới 11 ngày đăng video đầu nổ view ngay lập tức (format tương tự Nikola Tesla nhưng gắn đúng nhân vật Saito Hitori).",
            "Bản địa hóa kịch bản: Yêu cầu AI dịch theo giọng điệu, cách xưng hô và văn hóa kể chuyện của người bản xứ từng quốc gia."
        ],
        "edit_sop": {
            "primary": "Lấy kịch bản viral (US/Hàn) -> Dịch bản địa hóa theo văn hóa quốc gia đích -> Tự gen 100% hình ảnh/B-roll mới -> Lồng tiếng AI",
            "additional": [
                "Giữ nguyên cấu trúc kịch bản nổ view, chỉ thay đổi nhân vật đại diện phù hợp từng thị trường (VD: Saito Hitori tại Nhật, Nikola Tesla tại US).",
                "Tối ưu ảnh thumbnail rõ nét với 3 dòng chữ ngắn gọn."
            ]
        },
        "avoid_flags": [
            "Tuyệt đối không lấy video hoặc hình ảnh của kênh đối thủ đem về dùng lại (phải tạo mới 100% để tránh lỗi Reused Content).",
            "Không dịch thô cứng bằng Google Dịch khiến câu chuyện mất đi cảm xúc tự nhiên của người bản địa."
        ],
        "tools_mentioned": ["AI Voice", "ChatGPT", "Claude", "CapCut"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Case Study kênh nhân bản US sang Việt Nam bật kiếm tiền thành công"},
            {"time": "01:30", "seconds": 90, "label": "Nguyên tắc nhân bản an toàn: Chỉ lấy kịch bản, tự gen B-roll mới 100%"},
            {"time": "03:15", "seconds": 195, "label": "Ngách 1: Sức khỏe rau củ củ khoai tây thị trường Hàn Quốc nổ view"},
            {"time": "05:00", "seconds": 300, "label": "Ngách 2: May mắn tâm linh Saito Hitori Nhật Bản (kênh mới 11 ngày)"},
            {"time": "06:45", "seconds": 405, "label": "Tư duy dịch chuẩn giọng điệu và văn hóa thị trường đích"}
        ]
    },
    "VIDEO-f74bb1": {
        "sku": "VIDEO-f74bb1",
        "title": "Update ngách cực nhỏ thị trường Hàn Quốc mới nhất",
        "actual_topic": "Ngách Cực Nhỏ Sức Khỏe Dưa Chuột (Dưa Leo) Hàn Quốc & Kỹ Thuật Nhân Bản Chéo Việt-Hàn",
        "category_group": "ngach_xanh",
        "niche_primary": "Sức Khỏe & Rau Củ Dưa Chuột",
        "niche_id": "suc-khoe-dua-chuot-han",
        "target_market": "Hàn Quốc",
        "market_code": "KR",
        "key_takeaways": [
            "Bóc tách ngách siêu nhỏ Sức khỏe rau củ Hàn Quốc: 3 kênh đối thủ mới lập (cuối tháng 5 - tháng 6) nổ view rất đều đặn (50k - 100k view).",
            "Từ khóa mấu chốt nổ view cao nhất: Quả Dưa Chuột (Dưa Leo) kết hợp kiểm soát đường huyết và huyết áp cao.",
            "Quy trình Edit & Chống quét AI: Mỗi phân cảnh chèn vài giây video ông bác sĩ HeyGen ngồi nói -> đan xen video B-roll/hình ảnh dưa chuột thực tế để tránh quét inauthentic.",
            "Kỹ thuật nhân bản chéo 2 chiều (Việt <-> Hàn): Search tiêu đề tiếng Hàn dịch sang tiếng Việt để xem kênh VN đã làm chưa; nếu kênh VN đã làm trước thì lấy kịch bản nhân sang Hàn, nếu Hàn làm trước thì nhân về Việt Nam.",
            "Khai thác từ khóa SEO & Chapters: Copy các mốc thời gian phân đoạn trong mô tả để YouTube tự tạo Chapters và copy từ khóa thẻ tag gắn vào kênh."
        ],
        "edit_sop": {
            "primary": "Chèn vài giây nhân vật bác sĩ HeyGen nói mở đầu phân cảnh + Đan xen video B-roll dưa chuột/thực tế minh họa + Sub Hàn",
            "additional": [
                "Phân chia Chapters trong mô tả để tăng trải nghiệm người xem và điểm SEO.",
                "Gắn các từ khóa ngách nhỏ về dưa chuột vào phần tags của video."
            ]
        },
        "avoid_flags": [
            "Tránh làm lan man đa chủ đề, hãy tập trung vào 1 ngách nhỏ (như dưa chuột/rau củ) cho đến khi kênh cắn đề xuất mạnh.",
            "Không lạm dụng 100% video AI tĩnh mà thiếu các cảnh quay minh họa thực tế."
        ],
        "tools_mentioned": ["HeyGen", "Google Translate", "CapCut", "AI Voice"],
        "channels_mentioned": [],
        "key_timestamps": [
            {"time": "00:00", "seconds": 0, "label": "Hướng dẫn cài đặt tắt chuông thông báo & xem full màn hình trên web"},
            {"time": "01:20", "seconds": 80, "label": "Show 3 kênh Sức khỏe rau củ Hàn Quốc nổ 50k - 100k view đều đặn"},
            {"time": "03:10", "seconds": 190, "label": "Bóc tách từ khóa mấu chốt: Quả Dưa Chuột kiểm soát đường huyết"},
            {"time": "05:00", "seconds": 300, "label": "Kỹ thuật Edit: Bác sĩ HeyGen vài giây xen kẽ B-roll thực tế"},
            {"time": "07:30", "seconds": 450, "label": "Quy trình nhân bản chéo 2 chiều giữa thị trường Việt Nam & Hàn Quốc"}
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
    for sku, data in BATCH_3.items():
        insights[sku] = data
    with open(insights_path, 'w', encoding='utf-8') as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)

    # 2. Update catalog_full.json
    with open(cat_full_path, 'r', encoding='utf-8') as f:
        cat_full = json.load(f)
    for item in cat_full:
        sku = item.get('sku')
        if sku in BATCH_3:
            ins = BATCH_3[sku]
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
        if sku in BATCH_3:
            ins = BATCH_3[sku]
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
        if sku in BATCH_3:
            ins = BATCH_3[sku]
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
                item['market'] = ["🇺🇸 Mỹ"]
            else:
                item['market'] = ["🌐 Ngoại"]
    with open(videos_tab_path, 'w', encoding='utf-8') as f:
        json.dump(tab_videos, f, ensure_ascii=False, indent=2)

    print("✅ Đã cập nhật thành công 100% dữ liệu chi tiết thủ công cho BATCH 3 (Videos 09-12)!")

if __name__ == '__main__':
    main()
