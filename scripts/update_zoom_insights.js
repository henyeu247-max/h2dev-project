const fs = require('fs');
const path = require('path');

const p = path.resolve(__dirname, '..', 'data', 'video_insights.json');
const data = JSON.parse(fs.readFileSync(p, 'utf8'));

const zoomInsights = {
  'ZOOM-01-Nen-tang-moi-truong': {
    sku: 'ZOOM-01-Nen-tang-moi-truong',
    title: 'Zoom 01 — Nền tảng & Môi trường: Proxy, Gmail, Tạo kênh, Ngâm kênh',
    actual_topic: 'Chiến Lược Môi Trường Cô Lập: Proxy IPv4 Datacenter, Nuôi & Bảo Mật Gmail Cổ, Quy Trình Ngâm Kênh 3-4 Ngày Song Song Sản Xuất',
    category_group: 'chien_luoc',
    niche_primary: 'Hạ Tầng Kỹ Thuật & Môi Trường YouTube Faceless',
    niche_id: 'faceless-infrastructure',
    target_market: 'Toàn cầu / Ngoại (Mỹ, Singapore, Nhật Bản)',
    market_code: 'GLOBAL',
    key_takeaways: [
      'Môi trường cô lập (Isolated Environment): Không bao giờ dùng IP mạng nhà để quản lý nhiều kênh. Khi làm trên 2-3 kênh bắt buộc phải dùng Proxy IPv4 Datacenter (Singapore hoặc US) tích hợp trên trình duyệt riêng (MKT Browser / GPM) để tránh bị liên đới toàn dàn kênh khi có kênh bị quét.',
      'Chiến lược tài khoản Gmail: Ưu tiên Gmail người thân có độ trust tự nhiên cao. Nếu mua Gmail ngoài, chỉ mua thử 1-2 cái test trước. Tuyệt đối không đổi mật khẩu ngay khi vừa mua mà chỉ thêm SĐT và email khôi phục; sau đúng 7 ngày mới đổi mật khẩu để tránh checkpoint.',
      'Ngâm Gmail & Tạo tương tác người dùng thật: Gmail mới mua phải ngâm 1-2 ngày với hành vi tự nhiên (search Google, xem YouTube, tương tác Maps). Mỗi Gmail chỉ nên gắn 3-4 kênh; khi có kênh bùng nổ view thì tách kênh sang Gmail độc lập.',
      'Quy trình ngâm kênh song song sản xuất: Sau khi tạo kênh, để ngâm 2-3 ngày (subscribe và xem vài kênh cùng chủ đề). Không ngồi chờ thụ động mà tận dụng thời gian này sản xuất sẵn 20-30 video kịch bản đầu tiên để sẵn sàng đăng hàng loạt.',
      'Chiến lược lách thị trường địa lý: Nghiên cứu đối thủ mạnh ở các thị trường lớn (Mỹ, Nhật, Hàn), không đánh trực diện tại cùng quốc gia mà nhân bản kịch bản sang ngôn ngữ / quốc gia khác để giảm áp lực cạnh tranh.'
    ],
    edit_sop: {
      primary: 'Thiết lập môi trường phần cứng và tài khoản sạch trước khi sản xuất video',
      additional: [
        'Cấu hình proxy IPv4 trên profile trình duyệt chống phát hiện riêng biệt (MKT/GPM)',
        'Bật bảo mật 2 lớp 2FA bằng Google Authenticator, không dùng chung 1 email khôi phục cho nhiều mail',
        'Xác minh kênh YouTube cấp nâng cao bằng tính năng quét khuôn mặt (video verification) thay vì chờ đợi'
      ]
    },
    avoid_flags: [
      'Tuyệt đối không dùng Proxy IPv6 cho YouTube (IPv6 chỉ dùng cho Facebook/Gmail cơ bản, YouTube quét rớt view hoặc 0 view)',
      'Không đổi mật khẩu Gmail ngay khi vừa mua từ bên thứ ba (dễ bị khóa checkpoint do hành vi bất thường)',
      'Không dùng chung 1 email khôi phục cho toàn bộ dàn Gmail phụ (nguy cơ chết chùm khi 1 kênh bị phạt)',
      'Không đăng video ngay khi vừa tạo kênh; bắt buộc phải ngâm kênh 2-3 ngày để hình thành profile người dùng thật'
    ],
    tools_mentioned: ['Proxy MKT', 'GPM Browser', 'Google Authenticator', 'VOTP', 'Gemini Ultra', 'ChatGPT'],
    channels_mentioned: [],
    key_timestamps: [
      { time: '00:00', seconds: 0, label: 'Bối cảnh thị trường AI và 7 năm kinh nghiệm thực chiến' },
      { time: '07:12', seconds: 432, label: 'Tỷ lệ kháng lỗi và tư duy xây dựng hệ thống kênh' },
      { time: '19:16', seconds: 1156, label: 'Quy trình ngâm Gmail và chuẩn bị môi trường' },
      { time: '31:00', seconds: 1860, label: 'Bản chất Proxy và lý do bắt buộc phải dùng Proxy IPv4' },
      { time: '38:04', seconds: 2284, label: 'Phân biệt IPv4 vs IPv6 và cảnh báo lỗi 0 view YouTube' },
      { time: '45:10', seconds: 2710, label: 'Chiến thuật bảo mật Gmail và tách kênh theo doanh thu' }
    ],
    analysis_method: 'expert_grounded_audit',
    accuracy_status: 'verified_expert_summary',
    visual_audio_checked: true,
    claims_require_external_verification: false,
    source_transcript: 'video/ZOOM-01-Nen-tang-moi-truong/transcript.json'
  },
  'ZOOM-02-Chien-luoc-kenh-san-xuat': {
    sku: 'ZOOM-02-Chien-luoc-kenh-san-xuat',
    title: 'Zoom 02 — Chiến lược tách kênh & Sản xuất hàng loạt',
    actual_topic: 'Chiến Lược Tách Kênh Chống Quét Chéo, Lựa Chọn Ngách Phim Tài Liệu Giá Trị & Quy Chuẩn Prompt Hình Ảnh Camera 50mm Né Quét AI',
    category_group: 'chien_luoc',
    niche_primary: 'Chiến Lược Nội Dung & Prompt Kỹ Thuật Né Quét AI',
    niche_id: 'documentary-prompt-craft',
    target_market: 'Toàn cầu / Ngoại & Việt Nam',
    market_code: 'GLOBAL',
    key_takeaways: [
      'Phong cách nội dung quyết định sống còn: 300 người dùng tool nhưng chỉ 1/4 có kênh lên vì phần lớn chọn sai phong cách (làm theo sở thích: anime, xuyên không, drama hoạt hình kém chất lượng). Hướng đi bền vững và an toàn nhất là Phim tài liệu (Documentary), Lịch sử, Khảo cổ, Động vật, Triết lý, Sức khỏe có giá trị tri thức cao.',
      'Nguyên tắc tách kênh & Quản lý rủi ro: Giữ nguyên chất lượng video ở mọi kênh. Chỉ tách kênh sang Gmail độc lập khi kênh đã bùng nổ và đủ điều kiện bật kiếm tiền. Với 3 kênh trên 1 Gmail: nếu chỉ 1 kênh lên thì xóa 2 kênh chết; nếu 2 kênh lên thì chuyển quyền sở hữu sang Gmail khác và xóa kênh thứ 3.',
      'Quy trình sản xuất hàng loạt theo công đoạn: Không làm hoàn chỉnh từng video từ A-Z mà làm hàng loạt theo công đoạn (chuẩn bị 20-30 đề tài trên Google Sheets -> xuất kịch bản hàng loạt -> tạo voice hàng loạt -> tạo video hàng loạt).',
      'Thiết lập thông số kênh chuẩn SEO: Tên kênh, logo, banner, bộ từ khóa do AI tạo. Xác minh SĐT qua dịch vụ OTP (chỉ dùng xác minh kênh YouTube, không gán vào Gmail chính). Bật xác minh 3 bước bằng quét khuôn mặt để mở khóa toàn bộ tính năng nâng cao.',
      'Kỹ thuật tải video bảo vệ luồng: Video sau khi render xong tải lên ở chế độ "Không công khai" (Unlisted) để hệ thống YouTube xử lý phân giải cao (HD/4K) và chạy bot quét bản quyền trước ít nhất 2 giờ; tuyệt đối không để chế độ "Riêng tư" (Private).'
    ],
    edit_sop: {
      primary: 'Quy chuẩn kịch bản phim tài liệu và prompt hình ảnh máy quay chân thực',
      additional: [
        'Thiết lập prompt hình ảnh theo thông số máy quay thực tế: ống kính 50mm, quay cầm tay (handheld), ánh sáng hơi mờ/thiếu sáng (dim lighting), có rung tay nhẹ và zoom cận cảnh',
        'Thêm bộ Negative Prompt triệt để: không lóe sáng (no lens flare), không ánh sáng huyền ảo (no fantasy glow), không hiệu ứng CGI/3D, không đồ vật/xe cộ hiện đại, không cử động môi nói chuyện',
        'Biến tấu bối cảnh lịch sử theo văn hóa bản địa (nhân vật, trang phục, vật dụng làng quê Việt Nam xưa)',
        'Đưa toàn bộ kịch bản và prompt vào tool Vio3 Pro chạy chế độ Video 3 tiết kiệm credit trên 5-8 luồng song song'
      ]
    },
    avoid_flags: [
      'Tránh tuyệt đối phong cách realistic AI bóng bẩy, siêu thực, chuyển động phi vật lý (rất dễ bị khán giả ghét và YouTube quét lỗi nội dung không thỏa mãn)',
      'Không copy y nguyên prompt mẫu của người khác mà phải biến tấu theo từng chủ đề cụ thể',
      'Không để video chế độ "Riêng tư" (Private) vì bot YouTube sẽ không quét kiểm tra trước, khi công khai đột ngột dễ bị gậy bản quyền hoặc bóp tương tác',
      'Không thay đổi địa điểm kênh đang chạy tốt để nghiên cứu thị trường khác (nguy cơ lệch luồng đề xuất)'
    ],
    tools_mentioned: ['ChatGPT', 'Gemini Ultra', 'Vio3 Pro', 'Chatbot Lịch Sử 6', 'VOTP', 'CapCut'],
    channels_mentioned: [],
    key_timestamps: [
      { time: '00:35', seconds: 35, label: 'Nguyên tắc tách kênh và điều kiện chuyển quyền sở hữu' },
      { time: '06:29', seconds: 389, label: 'Phân tích thực trạng 300 học viên và nguyên nhân kênh không lên' },
      { time: '08:06', seconds: 486, label: 'Tại sao phải chọn phong cách Phim tài liệu chân thực' },
      { time: '10:09', seconds: 609, label: 'Ngách động vật và cơ hội thị trường Nhật Bản' },
      { time: '31:20', seconds: 1880, label: 'Thiết lập kênh, xác minh quét khuôn mặt và chế độ Không công khai' },
      { time: '01:12:16', seconds: 4336, label: 'Công thức vàng câu lệnh Prompt: Ống kính 50mm, quay cầm tay, thiếu sáng' },
      { time: '01:13:47', seconds: 4427, label: 'Bộ lọc Negative Prompt loại bỏ CGI và ánh sáng huyền ảo' }
    ],
    analysis_method: 'expert_grounded_audit',
    accuracy_status: 'verified_expert_summary',
    visual_audio_checked: true,
    claims_require_external_verification: false,
    source_transcript: 'video/ZOOM-02-Chien-luoc-kenh-san-xuat/transcript.json'
  },
  'ZOOM-03-Quy-trinh-tool-toi-uu': {
    sku: 'ZOOM-03-Quy-trinh-tool-toi-uu',
    title: 'Zoom 03 — Quy trình Tool & Tối ưu: AVD, SEO, Seeding, Quảng cáo',
    actual_topic: 'Kỹ Thuật X3 Cơ Hội Bằng 3 Kênh Test, Đột Phá Giữ Chân AVD Bằng Ghép Đuôi Video, Hack Đề Xuất Playlist Đối Thủ & Tối Ưu Midroll Ads',
    category_group: 'chien_luoc',
    niche_primary: 'Tối Ưu Giữ Chân Khán Giả, Hack Đề Xuất & Doanh Thu RPM',
    niche_id: 'retention-rpm-optimization',
    target_market: 'Toàn cầu / Ngoại & Việt Nam',
    market_code: 'GLOBAL',
    key_takeaways: [
      'Chiến thuật 3 kênh test nhân ba cơ hội: Chuẩn bị 30 video cùng một ngách chia đều cho 3 kênh độc lập (mỗi kênh 10 video). Đăng đều đặn trong 10 ngày để đo lường phản hồi thuật toán; dồn toàn lực vào kênh có chỉ số chuyển đổi cao nhất và loại bỏ 2 kênh kém hiệu quả.',
      'Bí quyết đột phá thời lượng xem trung bình (AVD): Không cố viết kịch bản dài dòng gây buồn ngủ. Áp dụng công thức "ghép đuôi video": Video 3 ghép nối Video 1 vào phần kết thúc; Video 4 ghép Video 2; Video 5 ghép Video 3. Thời lượng video tăng gấp đôi từ 30p lên 60p, kéo AVD từ 10p lên 20p, đẩy mạnh RPM doanh thu.',
      'Vòng đời 3 lần xuất hiện hợp lệ của một video: Một video độc bản có thể xuất hiện 3 lần trên kênh mà hoàn toàn không vi phạm bản quyền hoặc Reused Content: Lần 1 (video gốc độc lập) -> Lần 2 (ghép vào đuôi video mới sau 2-3 tập) -> Lần 3 (dùng làm nguồn phát lại Livestream 24/7).',
      'Hack đề xuất bằng danh sách phát (Playlist SEO Trick): Đặt tên Danh sách phát trùng khớp 100% với TÊN KÊNH CỦA ĐỐI THỦ LỚN. Khi người dùng tìm kiếm tên đối thủ hoặc đang xem video đối thủ, danh sách phát của mình sẽ được thuật toán gợi ý ở cột bên phải. Tuyệt đối KHÔNG nhét video của đối thủ vào danh sách phát của mình.',
      'Quy trình Seeding kích hoạt thuật toán: Đăng ban đầu chỉ tải lên 5 video ở chế độ Không công khai. Mở 5 tab unlisted xem liên tục 1 tiếng, giảm âm lượng, thu nhỏ tab. Video 1 ghim comment chào mừng; Video 2 ghim comment chứa tiêu đề và link của video 1. Hẹn giờ công khai sau ít nhất 2 giờ để ăn trọn điểm giữ chân ban đầu.',
      'Tối ưu hóa doanh thu quảng cáo (Midroll Placement): Sử dụng tiện ích LickLed YouTube tự động rải quảng cáo midroll mỗi 2 phút một lần trên các video dài. Tỷ lệ lấp đầy quảng cáo thực tế tăng gấp rưỡi giúp doanh thu nhảy vọt dù lượng view bằng nhau.'
    ],
    edit_sop: {
      primary: 'Quy trình lắp ráp video 150 cảnh, xử lý lỗi cảnh vi phạm và hậu kỳ CapCut',
      additional: [
        'Cấu trúc video 20 phút chuẩn gồm 10 phân đoạn x 15 cảnh = 150 cảnh, chạy tool Vio3 V3 (không tốn credit)',
        'Xử lý lỗi cảnh vi phạm chính sách bằng cách nhân bản một cảnh sạch khác trong thư mục đè vào cảnh lỗi, không dùng công cụ rà soát gây mất thời gian',
        'Hậu kỳ bắt buộc qua CapCut: cắt gọt cảnh thừa, thêm nhạc nền nhẹ và hiệu ứng riêng trước khi xuất bản',
        'Ghép đuôi video cũ vào video mới để nhân đôi thời lượng xem trung bình'
      ]
    },
    avoid_flags: [
      'Bỏ ngay tư duy SEO từ khóa nhồi nhét thô thiển của 4-5 năm trước (thuật toán YouTube hiện tại quét nội dung bằng giọng nói và b-roll hình ảnh)',
      'Không thêm video của kênh đối thủ vào danh sách phát của mình (sẽ điều hướng người xem sang kênh họ thay vì giữ chân trên kênh mình)',
      'Không dùng ảnh thumbnail do chatbot AI tự render vì chất lượng thấp và thiếu cảm xúc giật gân',
      'Không đăng video ngay lập tức mà không có giai đoạn unlisted và seeding ban đầu'
    ],
    tools_mentioned: ['Gemini Ultra', 'ChatGPT', 'Vio3 (Model V3)', 'CapCut', 'LickLed YouTube'],
    channels_mentioned: [],
    key_timestamps: [
      { time: '00:01', seconds: 1, label: 'Cấu trúc video 150 cảnh cho thời lượng 20 phút' },
      { time: '03:28', seconds: 208, label: 'Chiến thuật 3 kênh test và phân tích đối thủ cạnh tranh' },
      { time: '10:00', seconds: 600, label: 'Quy trình chạy tool Vio3 V3 đa luồng không tốn credit' },
      { time: '23:12', seconds: 1392, label: 'Vấn đề cốt tử của AVD (Thời lượng xem trung bình) và RPM' },
      { time: '30:00', seconds: 1800, label: 'Công thức độc quyền: Ghép đuôi video nhân đôi AVD và 3 vòng đời video' },
      { time: '57:36', seconds: 3456, label: 'Mẹo SEO danh sách phát đặt tên theo kênh đối thủ' },
      { time: '01:10:00', seconds: 4200, label: 'Kỹ thuật seeding 5 tab và tự động rải quảng cáo mỗi 2 phút bằng LickLed' }
    ],
    analysis_method: 'expert_grounded_audit',
    accuracy_status: 'verified_expert_summary',
    visual_audio_checked: true,
    claims_require_external_verification: false,
    source_transcript: 'video/ZOOM-03-Quy-trinh-tool-toi-uu/transcript.json'
  },
  'ZOOM-04-Adsense-khang-loi': {
    sku: 'ZOOM-04-Adsense-khang-loi',
    title: 'Zoom 04 — Google AdSense & Kháng lỗi: Bảo vệ kênh',
    actual_topic: 'Bảo Vệ Hạ Tầng Dòng Tiền: Chu Kỳ Thanh Toán Google AdSense ("Gà"), Kỹ Thuật Nối Gà An Toàn, Quy Chuẩn Đóng Thuế & Chiến Lược Kháng Lỗi YouTube YPP',
    category_group: 'chien_luoc',
    niche_primary: 'Quản Trị Doanh Thu, Google AdSense & Pháp Lý Kháng Nghị YPP',
    niche_id: 'adsense-revenue-defense',
    target_market: 'Toàn cầu / Ngoại & Việt Nam',
    market_code: 'GLOBAL',
    key_takeaways: [
      'Bản chất dòng tiền Google AdSense ("Gà"): Doanh thu YouTube không về ngân hàng trực tiếp mà chuyển vào AdSense vào ngày 10 hàng tháng và thanh toán về tài khoản ngân hàng từ ngày 22-23. Số tiền hiển thị trước ngày 23 chỉ là "tiền màn hình" (có thể bị trừ do click ảo, trừ thuế hoặc quét bản quyền).',
      'Quy tắc tạo và liên kết gà an toàn: Nên tạo AdSense TRƯỚC khi kênh đủ điều kiện bật kiếm tiền. Mỗi cá nhân chỉ sở hữu 1 gà duy nhất với thông tin CCCD chính chủ. Khi nối gà vào kênh (bước 2 YPP), bắt buộc dùng tab ẩn danh hoặc mạng 4G sạch để tránh bị dính blacklist thiết bị.',
      'Chiến lược tách gà phân tán rủi ro: Có thể liên kết tối đa 3 kênh vào 1 gà đối với các kênh nhỏ, nhưng với kênh có doanh thu lớn bắt buộc phải tách sang gà riêng (sử dụng thông tin người thân có CCCD và ngân hàng sạch) để ngăn chặn rủi ro chết chùm khi 1 kênh bị quét.',
      'Nghĩa vụ thuế quốc tế & trong nước: Khai báo thuế Hoa Kỳ (W-8BEN) đầy đủ (view Mỹ chịu thuế 20-30%, view Hàn/Nhật thuế thấp). Với doanh thu lớn tại Việt Nam, chủ động kê khai và nộp thuế thu nhập cá nhân (~7%) để đảm bảo tài sản hợp pháp dài hạn.',
      'Thực tế kháng nghị YouTube YPP: Tỷ lệ kháng nghị thành công chỉ đạt 20-30%. Nếu bị quét lỗi nội dung không trung thực / sử dụng lại, chỉ kháng khi có video quay lại màn hình quy trình sản xuất (project timeline, kịch bản gốc, b-roll tự dựng). Phòng thủ bằng ngách phim tài liệu có voice người đọc/voice bản quyền và phụ đề sáng tạo là cách an toàn nhất (tỷ lệ quét chỉ ~1/50 kênh).',
      'Nguyên tắc vận hành "Đúng - Đủ - Đều": Giữ vững kỷ luật làm việc, lên kế hoạch hàng ngày, kiểm soát cảm xúc không làm theo hứng; đăng video đều đặn đúng khung giờ và tái đầu tư lợi nhuận vào công cụ sản xuất.'
    ],
    edit_sop: {
      primary: 'Quy chuẩn sản xuất video giải trình kháng nghị bật kiếm tiền',
      additional: [
        'Quay video màn hình thể hiện quy trình sản xuất gốc: kịch bản trên Docs, file dự án CapCut/Premiere có nhiều layer, timeline hình ảnh và âm thanh tách biệt',
        'Xuất hiện người nói hoặc giọng đọc giải trình rõ ràng bằng tiếng Anh về giá trị gia tăng và tính giáo dục/thông tin của kênh',
        'Kiểm tra tính đồng nhất của siêu dữ liệu (metadata, thumbnail, tiêu đề) trước khi nộp đơn kháng nghị'
      ]
    },
    avoid_flags: [
      'Tuyệt đối không mua tài khoản AdSense trôi nổi trên mạng (nguy cơ cao bị quét thông tin ảo, giữ tiền hoặc bị lừa đảo)',
      'Không đăng ký nhiều tài khoản AdSense trên cùng một danh tính cá nhân (vi phạm điều khoản sở hữu duy nhất của Google AdSense dẫn đến khóa vĩnh viễn)',
      'Tránh các ngách AI sinh tồn, spam hoạt hình hoặc tóm tắt phim auto lặp đi lặp lại vì đây là tâm điểm các đợt càn quét Inauthentic Content',
      'Không bỏ việc chính khi mới bắt đầu làm YouTube; chỉ toàn thời gian khi dòng tiền đã ổn định và nhân bản được hệ thống'
    ],
    tools_mentioned: ['Google AdSense', 'LickLed', 'Video Editor (Kháng nghị)', 'Trình duyệt ẩn danh'],
    channels_mentioned: [],
    key_timestamps: [
      { time: '00:00', seconds: 0, label: 'Khái niệm Google AdSense ("Gà") và chu kỳ tiền về (ngày 10 đến ngày 22-23)' },
      { time: '06:15', seconds: 375, label: 'Quy tắc đăng ký gà, xác minh CCCD và kỹ thuật nối gà bằng tab ẩn danh/4G' },
      { time: '14:20', seconds: 860, label: 'Các ngưỡng thanh toán, ngân hàng nhận tiền và phí rút' },
      { time: '20:05', seconds: 1205, label: 'Nghĩa vụ thuế Hoa Kỳ (W-8BEN) và thuế thu nhập cá nhân tại Việt Nam' },
      { time: '26:40', seconds: 1600, label: 'Chiến lược tách gà bảo vệ kênh doanh thu cao' },
      { time: '30:15', seconds: 1815, label: 'Phân tích nguyên nhân quét tắt kiếm tiền và cách làm video kháng nghị' },
      { time: '34:00', seconds: 2040, label: 'Triết lý làm kênh "Đúng - Đủ - Đều", bán kênh và kinh nghiệm tránh bẫy khóa học' }
    ],
    analysis_method: 'expert_grounded_audit',
    accuracy_status: 'verified_expert_summary',
    visual_audio_checked: true,
    claims_require_external_verification: false,
    source_transcript: 'video/ZOOM-04-Adsense-khang-loi/transcript.json'
  }
};

Object.assign(data, zoomInsights);
fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Successfully updated video_insights.json! Total keys now:', Object.keys(data).length);
