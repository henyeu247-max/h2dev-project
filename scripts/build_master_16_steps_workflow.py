import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r'D:\YTB\H2DEV-Project'
VIDEOS_JSON = os.path.join(BASE_DIR, 'data-tabs', 'videos.json')
INSIGHTS_JSON = os.path.join(BASE_DIR, 'data', 'video_insights.json')
TAI_LIEU_JSON = os.path.join(BASE_DIR, 'data-tabs', 'tai-lieu-full.json')
RAW_KENH_JSON = os.path.join(BASE_DIR, 'data-tabs', 'raw-kenh-mau.json')
KENH_MAU_JSON = os.path.join(BASE_DIR, 'data-tabs', 'kenh-mau.json')
CHIENLUOC_JSON = os.path.join(BASE_DIR, 'data-tabs', 'chien-luoc.json')

with open(VIDEOS_JSON, 'r', encoding='utf-8') as f:
    videos = json.load(f)

with open(INSIGHTS_JSON, 'r', encoding='utf-8') as f:
    insights = json.load(f)
    if isinstance(insights, list):
        ins_map = {x['sku']: x for x in insights}
    else:
        ins_map = insights

with open(TAI_LIEU_JSON, 'r', encoding='utf-8') as f:
    docs = json.load(f)

with open(CHIENLUOC_JSON, 'r', encoding='utf-8') as f:
    chien_luoc = json.load(f)

# Define 16 Comprehensive Master Steps for YouTube Faceless / AI / Semi-Reup A-Z
steps_blueprint = [
    {
        "n": 1,
        "phase": "Giai đoạn I: Hạ Tầng Sạch & Định Danh Kênh",
        "title": "Môi Trường Trình Duyệt Sạch, Proxy IPv4 & Ngâm Tài Khoản Chống Quét Liên Đới",
        "detail": "Thiết lập profile trình duyệt Antidetect (Gologin, MKT, GPM) trên hạ tầng máy trạm độc lập. Gán mỗi kênh 1 Proxy IPv4 Datacenter 2 tĩnh (Singapore/Mỹ) để cô lập hoàn toàn môi trường mạng nhà. Ngâm tài khoản Gmail sạch 24–48 tiếng, bật xác minh 2 bước qua Authenticator (tuyệt đối không dùng SMS OTP lộ vùng địa lý).",
        "tab": "video",
        "tabLabel": "Module Môi Trường",
        "docPath": "docs/NOI-BO/zoom/ZOOM-01-Nen-tang-moi-truong.md",
        "docTitle": "SOP Nền Tảng & Môi Trường Sạch (Zoom 01)",
        "sampleCompetitor": "@BeyondTheBlue (US Faceless)",
        "keywords": ["môi trường", "proxy", "gologin", "vps", "ngâm kênh", "setup cài đặt", "cổ 2010", "chống quét", "liên đới"]
    },
    {
        "n": 2,
        "phase": "Giai đoạn I: Hạ Tầng Sạch & Định Danh Kênh",
        "title": "Khởi Tạo Kênh Chuẩn, SEO Mặc Định & Xác Minh Tính Năng Nâng Cao (OTP + Video)",
        "detail": "Cài đặt thông số kênh theo chuẩn quốc gia mục tiêu (Hoa Kỳ / Nhật Bản / Hàn Quốc). Thiết lập từ khóa mặc định (Channel Tags), mô tả nhận diện thương hiệu, liên kết mạng xã hội. Kích hoạt tính năng nâng cao (Advanced Features) bằng video quét khuôn mặt hoặc giấy tờ tùy thân CCCD để mở khóa quyền đăng video >15 phút, livestream và ghim bình luận.",
        "tab": "video",
        "tabLabel": "Cài Đặt Kênh Chuẩn",
        "docPath": "docs/NOI-BO/zoom/QUY-TRINH-XAY-KENH-A-Z.md",
        "docTitle": "SOP Khởi Tạo & Quản Trị Hệ Thống Kênh A-Z",
        "sampleCompetitor": "@PeekabooSongs (Kids Cartoon)",
        "keywords": ["tạo kênh", "lập kênh", "setting", "xác minh", "tính năng nâng cao", "seo kênh", "quốc gia cư trú"]
    },
    {
        "n": 3,
        "phase": "Giai đoạn II: Tình Báo Thị Trường & Lựa Chọn Ngách Xanh",
        "title": "Tình Báo Đối Thủ, Khai Thác 156 Raw Kênh & Thẩm Định Micro-Niche Bằng vidIQ",
        "detail": "Khai thác cơ sở dữ liệu 156 hồ sơ Raw kênh và 256 đối thủ live. Đo lường chỉ số vidIQ: Search Volume (>65) và Competition Score (<50). Lùng sục các Micro-Niche (ngách cực nhỏ) ít đối thủ cạnh tranh: Thói quen ăn rau sống, bài thuốc bàn ăn, xe cộ xưa, triết lý Saitou Hitori, câu chuyện Sukatto, vật lý lượng tử dễ hiểu.",
        "tab": "rawkenh",
        "tabLabel": "Kho 156 Raw Kênh",
        "docPath": "docs/NOI-BO/zoom/ZOOM-02-Chien-luoc-kenh-san-xuat.md",
        "docTitle": "SOP Chiến Lược Kênh & Bóc Tách Đối Thủ (Zoom 02)",
        "sampleCompetitor": "@kurumanozokitai (Xe cộ Nhật)",
        "keywords": ["ngách", "micro-niche", "đối thủ", "khám kênh", "vidiq", "trend", "rau sống", "dưa chuột", "bàn ăn", "xe cộ"]
    },
    {
        "n": 4,
        "phase": "Giai đoạn II: Tình Báo Thị Trường & Lựa Chọn Ngách Xanh",
        "title": "Giải Mã 68 Kênh Chết (Case Study DIE 404) & Thiết Lập Rào Chắn YMYL",
        "detail": "Học từ thất bại: mổ xẻ 68 kênh đối thủ bị YouTube trảm để không dẫm vào vết xe đổ. 41% chết do Reused Douyin không lồng tiếng, 29% chết do Inauthentic slide ảnh AI lặp lại, 18% chết do YMYL chẩn đoán y tế bừa bãi. Thiết lập rào chắn: Không xưng danh bác sĩ, không kê đơn thuốc, luôn có disclaimer y khoa trong 5 giây đầu.",
        "tab": "kenh-mau",
        "tabLabel": "Case Study Kênh Chết",
        "docPath": "knowledge-hub/docs/RULE-LAM-VIEC.md",
        "docTitle": "Khung Quy Chuẩn An Toàn & Phòng Thủ Chính Sách",
        "sampleCompetitor": "@gyakkyoyori_risukatsu (Đã bị gỡ 404)",
        "keywords": ["ymyl", "bác sĩ", "chết", "die", "gỡ", "404", "trảm", "bệnh", "dưỡng lão", "sức khỏe người già"]
    },
    {
        "n": 5,
        "phase": "Giai đoạn III: Kịch Bản Giữ Chân & Thiết Kế Voice DNA",
        "title": "Thiết Kế Kịch Bản Đa Hồi, Hook 15s Nghịch Lý & Attention Reset Giữ AVD > 50%",
        "detail": "Xây dựng kịch bản chuẩn cấu trúc kịch tính: 3 Hồi (Everyday History), 4 Hồi (Tội phạm kinh tế / Địa chính trị) hoặc 5 Hồi (Phim điện ảnh AI). Mở đầu 0–15s bằng Hook nghịch lý phá vỡ trực giác (không chào hỏi dông dài). Cài đặt cơ chế Reset chú ý (Attention Reset) mỗi 60–90 giây bằng hiệu ứng âm thanh, câu hỏi mở hoặc bẻ cua tình tiết bảo đảm AVD >= 50%.",
        "tab": "tai-lieu",
        "tabLabel": "Chuẩn Kịch Bản & SOUL",
        "docPath": "knowledge-hub/docs/SOUL.md",
        "docTitle": "SOUL.md - Triết Lý Nội Dung & Kịch Bản Giữ Chân",
        "sampleCompetitor": "@こころの道しるべ (Triết lý Nhật)",
        "keywords": ["kịch bản", "hook", "avd", "cấu trúc", "3 hồi", "4 hồi", "5 hồi", "reset chú ý", "giữ chân", "đối thủ 70%"]
    },
    {
        "n": 6,
        "phase": "Giai đoạn III: Kịch Bản Giữ Chân & Thiết Kế Voice DNA",
        "title": "Thiết Lập Voice DNA (WPM Chuẩn, Clone Giọng) & Hòa Âm BGM Tần Số 432Hz",
        "detail": "Định vị giọng đọc thương hiệu: Tốc độ đọc chuẩn theo ngách (105 WPM thư giãn cho Senior/Tâm linh, 135 WPM đanh thép cho Quân sự/Tin tức, 145 WPM cho Tội phạm kinh tế). Ứng dụng ElevenLabs / Minimax clone giọng bản xứ chuẩn ngữ điệu. Thiết lập 3 tầng âm thanh: Voice (-16 LUFS) + SFX (-24 dB) + Nhạc nền BGM chữa lành tần số 432Hz (-28 dB).",
        "tab": "nhac",
        "tabLabel": "Kho Nhạc & Tần Số 432Hz",
        "docPath": "assets/docs/SOP-AUDIO-VOICE-DNA-STANDARD.md",
        "docTitle": "SOP Thiết Lập Voice DNA & Master Âm Thanh",
        "sampleCompetitor": "@장수채소습관 (Hàn Quốc - 105 WPM)",
        "keywords": ["voice", "giọng đọc", "elevenlabs", "minimax", "ngọc huyền", "432hz", "wpm", "âm thanh", "nhạc nền", "clone"]
    },
    {
        "n": 7,
        "phase": "Giai đoạn IV: Sản Xuất Visual AI & Khóa Nhân Vật",
        "title": "Đạo Diễn Visual 5P Camera & Khóa Nhân Vật Turnaround 3 Góc (Midjourney / Flux)",
        "detail": "Khai thác Prompt Master: áp dụng ngôn ngữ vận kính điện ảnh 5P (Pan, Tilt, Zoom, Tracking, Crane). Kỹ thuật Turnaround khóa khuôn mặt và phục trang nhân vật qua 3 góc nhìn (chính diện, nghiêng 45 độ, góc nghiêng 90 độ) bằng Midjourney v6 hoặc Flux. Phong cách visual: Ống kính 50mm chân thực, ánh sáng tự nhiên (Chiaroscuro), cấm hoàn toàn ảnh nhựa CGI hoạt hình vô hồn.",
        "tab": "tai-lieu",
        "tabLabel": "Master Prompt & Đạo Diễn",
        "docPath": "docs/NOI-BO/prompt/master-film-director.md",
        "docTitle": "Master Prompt Đạo Diễn Phân Cảnh & 5P Camera",
        "sampleCompetitor": "@TheDarkLedger (Crime Documentary)",
        "keywords": ["prompt master", "turnaround", "khóa nhân vật", "5p", "camera", "midjourney", "flux", "visual", "tạo ảnh", "đạo diễn"]
    },
    {
        "n": 8,
        "phase": "Giai đoạn IV: Sản Xuất Visual AI & Khóa Nhân Vật",
        "title": "Khai Thác 6 Kho Hoạt Hình Bilibili / Douyin Chuẩn Bán Content & Dịch SRT",
        "detail": "Chiến lược khai thác nguồn tư liệu ngoại không bị đánh bản quyền: Truy cập 6 kho hoạt hình Bilibili, Douyin chuyên biệt. Sử dụng tool tự động bóc tách phụ đề gốc, trích xuất file SRT, đẩy qua AI dịch thuật và hiệu đính văn phong bản địa. Cắt bỏ hoàn toàn 3 giây đầu và 3 giây cuối của clip gốc để phá vỡ chữ ký nhận dạng của thuật toán kiểm duyệt.",
        "tab": "nguonreup",
        "tabLabel": "Kho 27 Nguồn Reup",
        "docPath": "docs/NOI-BO/zoom/ZOOM-03-Quy-trinh-tool-toi-uu.md",
        "docTitle": "SOP Khai Thác Bilibili & Tool Dịch Tự Động (Zoom 03)",
        "sampleCompetitor": "@AnimeRecapHub (Bilibili Toon)",
        "keywords": ["bilibili", "douyin", "reup", "hoạt hình", "toon review", "srt", "dịch phụ đề", "tool dịch"]
    },
    {
        "n": 9,
        "phase": "Giai đoạn V: Hậu Kỳ 5 Lớp Né Quét AI & Đóng Gói",
        "title": "Quy Trình Hậu Kỳ Đa Lớp Né Quét Thuật Toán 2026 (Frame Overlay, Waveform, Speed)",
        "detail": "Thực hiện quy trình hậu kỳ 5 lớp bất tử trên CapCut / Premiere: (1) Scale khung hình 104–106% + lật ngang (Flip Horizontal); (2) Đổi tốc độ phát 1.05x; (3) Phủ khung viền mờ Frame Overlay 8% hoặc viền màu đồng bộ; (4) Phủ lớp hạt Noise/Film Grain 3% làm lệch mã băm hình ảnh; (5) Chèn sóng âm Audio Waveform 4K dưới chân video để triệt tiêu mã vân tay âm thanh.",
        "tab": "tai-lieu",
        "tabLabel": "SOP Hậu Kỳ Chống Quét",
        "docPath": "assets/docs/VIDEO-484f9e/SOP-EDIT-BAN-CONTENT-NE-QUET-AI-2026.md",
        "docTitle": "SOP Edit Bán Content & Né Quét Thuật Toán 2026",
        "sampleCompetitor": "@sukatto_japan (Drama Nhật)",
        "keywords": ["edit", "né quét", "bán content", "tạo khung", "frame overlay", "hạn chế lỗi quét", "waveform", "speed", "capcut"]
    },
    {
        "n": 10,
        "phase": "Giai đoạn V: Hậu Kỳ 5 Lớp Né Quét AI & Đóng Gói",
        "title": "Tự Quay B-Roll Đời Thật Làm Nền Video Drama / Lịch Sử Chống Trùng Lặp 100%",
        "detail": "Kỹ thuật tối thượng chống lỗi Inauthentic Content và Reused Content: Dùng điện thoại tự quay các đoạn tư liệu B-roll đời thường (cảnh đi bộ trên vỉa hè, pha trà, lật trang sách, ánh đèn đường phố ban đêm, bàn làm việc). Đưa B-roll gốc này làm Video Track 1 (lớp nền), chèn hình ảnh minh họa AI hoặc phụ đề kịch tính lên Video Track 2. Thuật toán quét video sẽ nhận diện 100% là cảnh quay gốc của creator.",
        "tab": "video",
        "tabLabel": "Kỹ Thuật B-Roll Thực Tế",
        "docPath": "assets/docs/VIDEO-DD983D/SOP-TU-QUAY-B-ROLL-NEN-DRAMA-NHAT.md",
        "docTitle": "SOP Tự Quay B-Roll Đời Thật Làm Nền Video Drama",
        "sampleCompetitor": "@昔の人の知恵 (Trí tuệ người xưa)",
        "keywords": ["b-roll", "tự quay", "đời thật", "nền video", "không trung thực", "lỗi do ai", "trùng lặp nội dung"]
    },
    {
        "n": 11,
        "phase": "Giai đoạn V: Hậu Kỳ 5 Lớp Né Quét AI & Đóng Gói",
        "title": "Đóng Gói Bao Bì Tỷ Lệ Nhấp Cao: Thumbnail 1 Chủ Thể Chiếm 70% & Tiêu Đề CTR > 8%",
        "detail": "Thiết kế Thumbnail chuẩn tương phản cao: 1 chủ thể chính chiếm 60–70% khung hình, bố cục quy tắc 1/3, chữ <= 4 từ ngắn gọn với màu vàng neon hoặc trắng viền đen đậm. Tiêu đề áp dụng công thức 2 vế: [Hook Gợi Tò Mò] + [Từ Khóa Tìm Kiếm Ngách]. Viết mô tả 200–400 từ kèm 3–5 hashtag chuẩn ngách để tối ưu SEO đề xuất tự nhiên.",
        "tab": "tai-lieu",
        "tabLabel": "Prompt Thumbnail & SEO",
        "docPath": "docs/NOI-BO/prompt/thumb-seo-hashtag.md",
        "docTitle": "Prompt Tạo Thumbnail Tỷ Lệ Nhấp Cao & SEO Đề Xuất",
        "sampleCompetitor": "@복이오는길 (Phong thủy Hàn Quốc)",
        "keywords": ["thumbnail", "thumb", "tiêu đề", "ctr", "tỷ lệ nhấp", "bao bì", "seo hashtag"]
    },
    {
        "n": 12,
        "phase": "Giai đoạn VI: Xuất Bản, Kích Hoạt Thuật Toán & Xử Lý Kênh 0 View",
        "title": "Upload Kín (Unlisted >= 2h), Hẹn Giờ Khung Vàng & Seeding Tương Tác Tự Nhiên",
        "detail": "Quy trình đăng tải an toàn: Tải video lên ở chế độ Không công khai (Unlisted) ít nhất 2 tiếng để YouTube xử lý bản HD/4K và chạy xong bộ quét bản quyền ngầm. Thêm video vào Playlist có tên chứa từ khóa của kênh lớn đối thủ. Đặt lịch công khai vào khung giờ vàng của thị trường (18h–21h tối tại Nhật/Hàn/US). Seeding tự nhiên: Xem trọn vẹn từ 3–5 thiết bị sạch, để lại comment ghim kích hoạt thảo luận.",
        "tab": "video",
        "tabLabel": "Quy Trình Upload & Seeding",
        "docPath": "assets/docs/VIDEO-aacc70/SOP-BAM-KEY-DOI-THU-CHONG-0-VIEW.md",
        "docTitle": "SOP Bám Key Đối Thủ & Đăng Tải Chống 0 View",
        "sampleCompetitor": "@みんなの若返りアカデミア (Tuổi thọ Nhật)",
        "keywords": ["upload", "đăng video", "unlisted", "seeding", "khung giờ vàng", "hẹn giờ", "playlist"]
    },
    {
        "n": 13,
        "phase": "Giai đoạn VI: Xuất Bản, Kích Hoạt Thuật Toán & Xử Lý Kênh 0 View",
        "title": "Khám Kênh Thực Chiến, Trị Dứt Điểm Kênh 0 View, Lẹt Đẹt & Hồi Sinh Đề Xuất",
        "detail": "Bắt bệnh và trị dứt điểm khi kênh bị 0 view hoặc dừng đề xuất sau 3–5 video đầu: Kiểm tra tỷ lệ CTR (<4% là do Thumbnail xấu, cần đổi ngay trong 24h); Kiểm tra AVD (<30% là do Hook mở đầu tệ, cần cắt bỏ phần thừa trên YouTube Studio Editor). Nếu kênh bị bóp reach do dính cờ ngầm, áp dụng kỹ thuật 'Chuyển ngách sạch': Ẩn các video cũ vi phạm, đổi bộ nhận diện và đăng liền 3 video ngách xanh mới.",
        "tab": "video",
        "tabLabel": "Khám Kênh & Hồi Sinh",
        "docPath": "assets/docs/VIDEO-a7bfd0/SOP-KHAM-KENH-TRI-DUT-DIEM-0-VIEW.md",
        "docTitle": "SOP Khám Kênh & Trị Dứt Điểm Lỗi 0 View, Lẹt Đẹt",
        "sampleCompetitor": "@은밀한응답 (Hàn Quốc - Thoát 0 view)",
        "keywords": ["khám kênh", "0 view", "lẹt đẹt", "không lên được", "hồi sinh", "chuyển ngách", "sửa lỗi", "bắt bệnh"]
    },
    {
        "n": 14,
        "phase": "Giai đoạn VII: Bật Kiếm Tiền, Quản Trị AdSense & Bảo Vệ Kênh",
        "title": "Duyệt Bật Kiếm Tiền (YPP) Kênh Mới Trong 6 Tiếng & Pre-Audit Rà Soát Sạch",
        "detail": "Quy trình duyệt BKT siêu tốc: Khi kênh đạt ngưỡng 1.000 sub + 4.000 giờ xem, tiến hành Pre-Audit rà soát 100% video trên kênh. Tạm ẩn hoặc xóa các video có nguy cơ dính nhạc bản quyền hoặc hình ảnh lặp lại. Giữ lại tối thiểu 5–7 video chuẩn chỉ nhất. Nộp đơn vào khung giờ làm việc của đội ngũ kiểm duyệt thủ công Google Châu Á - Thái Bình Dương (8h–11h sáng thứ Hai đến thứ Tư) để được duyệt trong 6–12 tiếng.",
        "tab": "ngachxanh",
        "tabLabel": "Duyệt YPP & Pre-Audit",
        "docPath": "assets/docs/VIDEO-84a039/SOP-DUYET-BAT-KIEM-TIEN-YPP-6-TIENG.md",
        "docTitle": "SOP Duyệt Bật Kiếm Tiền (YPP) Kênh Mới Trong 6 Tiếng",
        "sampleCompetitor": "@ChillDudeStories (BKT 6 ngày)",
        "keywords": ["bật kiếm tiền", "ypp", "6 tiếng", "đủ điều kiện", "6 ngày", "7 video", "học viên pro", "bkt"]
    },
    {
        "n": 15,
        "phase": "Giai đoạn VII: Bật Kiếm Tiền, Quản Trị AdSense & Bảo Vệ Kênh",
        "title": "Hạ Tầng Google AdSense Bất Tử, Phân Quyền Admin 3 Tầng & Kê Khai Thuế",
        "detail": "Xây dựng hệ thống AdSense chống chết chùm: Mỗi tài khoản GA được nuôi trên IP và máy trạm sạch, thông tin CCCD + ngân hàng trùng khớp 100%. Phân quyền kênh YouTube theo mô hình 3 tầng: Owner (Email gốc ngâm kín) -> Manager (Email biên tập hàng ngày) -> Financial (Email liên kết GA độc lập). Kê khai chuẩn biểu mẫu thuế W-8BEN (thuế bản quyền Hoa Kỳ) và thuế thu nhập cá nhân VN 7% để tránh bị treo thanh toán.",
        "tab": "video",
        "tabLabel": "Quản Trị AdSense & Thuế",
        "docPath": "docs/NOI-BO/zoom/ZOOM-04-Adsense-khang-loi.md",
        "docTitle": "SOP Quản Trị Google AdSense & Kê Khai Thuế (Zoom 04)",
        "sampleCompetitor": "@US_EverydayHistory (GA US trâu)",
        "keywords": ["adsense", "ga", "tài khoản", "thuế", "w-8ben", "kháng lỗi", "tạo tài khoản", "an toàn", "trâu nhất"]
    },
    {
        "n": 16,
        "phase": "Giai đoạn VIII: Tối Ưu Doanh Thu & Nhân Bản Quy Mô Toàn Cầu",
        "title": "Tối Ưu Mid-Roll Ads Tăng RPM $4–$18 & Nhân Bản Kịch Bản Đa Quốc Gia (Scale Hệ Thống)",
        "detail": "Khai thác tối đa doanh thu video dài (>8 phút): Đặt thủ công các điểm quảng cáo Mid-roll ở phút thứ 2:00, 4:30, 7:00 và đuôi video. Triển khai chiến lược nhân bản kịch bản thắng lớn (Winning Content): Lấy kịch bản đã nổ view ở thị trường US/Nhật, dịch và địa phương hóa văn phong sang tiếng Hàn, Đức, Việt bằng Claude. Nhân bản mô hình 1 kịch bản ra 4 kênh đa ngôn ngữ giúp nhân gấp 4 lần doanh thu với cùng chi phí sản xuất.",
        "tab": "tatca",
        "tabLabel": "Nhân Bản & Scale Doanh Thu",
        "docPath": "assets/docs/VIDEO-e90874/PROMPT-MASTER-NHAN-BAN-XUYEN-QUOC-GIA.md",
        "docTitle": "Prompt Master Nhân Bản Kịch Bản Xuyên Quốc Gia",
        "sampleCompetitor": "@SaitouHitori_Wisdom (Nhật -> Hàn -> VN)",
        "keywords": ["nhân bản", "doanh thu", "16 triệu", "33 triệu", "rpm", "mid-roll", "xuyên quốc gia", "thị trường nhật", "thị trường hàn", "thị trường việt", "thị trường us"]
    }
]

# Map all 144 videos into the 16 steps
video_step_map = {step['n']: [] for step in steps_blueprint}
assigned_skus = set()

for v in videos:
    sku = v.get('sku')
    title = str(v.get('title', ''))
    ins = ins_map.get(sku, {})
    sop_str = json.dumps(ins.get('edit_sop', ''), ensure_ascii=False) if isinstance(ins.get('edit_sop', ''), (dict, list)) else str(ins.get('edit_sop', ''))
    takeaways_str = " ".join(ins.get('takeaways', []))
    
    full_haystack = (title + " " + sop_str + " " + takeaways_str).lower()
    
    best_step = None
    best_matches = -1
    
    for step in steps_blueprint:
        matches = sum(1 for kw in step['keywords'] if kw in full_haystack)
        if matches > best_matches:
            best_matches = matches
            best_step = step['n']
            
    if best_matches <= 0:
        # Fallback based on category/index
        best_step = 16 if 'nhân bản' in title.lower() or 'thị trường' in title.lower() else 9
        
    video_step_map[best_step].append(sku)
    assigned_skus.add(sku)

print(f"Total videos assigned across 16 steps: {len(assigned_skus)} / {len(videos)}")
for s in steps_blueprint:
    skus_in_step = video_step_map[s['n']]
    s['skus'] = skus_in_step
    print(f"Bước {s['n']:02d}: {s['title'][:40]}... -> {len(skus_in_step)} SKUs")

# Save into chien-luoc.json
chien_luoc['workflow'] = steps_blueprint

with open(CHIENLUOC_JSON, 'w', encoding='utf-8') as f:
    json.dump(chien_luoc, f, ensure_ascii=False, indent=2)

print("Đã cập nhật 16 Bước Quy Trình Xây Kênh A-Z Chuẩn All vào data-tabs/chien-luoc.json!")
