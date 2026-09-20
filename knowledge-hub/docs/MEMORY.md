# MEMORY.md — H2DEV-Project (rules bền + shortcuts)

> Chỉ chứa rules + shortcuts bền. Chi tiết workflow → đọc file liên quan khi cần (không nhét dài vào đây).
> Cập nhật: 18/09/2026.

## Đường dẫn chuẩn

- Data core: `d:\YTB\H2DEV-Project\data-tabs\` (videos, kenh-mau, tai-lieu-full, ngach-xanh, kich-ban, nguon-reup, chien-luoc, dong-bo-ngoai)
- Catalog: `d:\YTB\H2DEV-Project\data\catalog.json`
- Scripts: `d:\YTB\H2DEV-Project\scripts\` (validate-project.js, deep-audit.js)
- Rule: `knowledge-hub\docs\RULE-LAM-VIEC.md` + `HUONG-DAN-MCP-CHUAN.md`

## Rule bền (nhắc lại mỗi phiên)

1. Check N/N (100 check 100, cấm tượng trưng).
2. Đọc FULL, không dở dang.
3. Phản biện + evidence + CÓ/KHÔNG/KHÔNG-VERIFY.
4. Verify đa nguồn MCP, tool lỗi → chuyển tool.
5. Backup trước khi sửa data. NO_DELETE chỉ cho TÀI SẢN GỐC (video/audio/phụ đề/data/cấu hình) — rác tạm sau Check-Pass bắt buộc XÓA (Ephemeral Cleanup).

## Shortcuts hữu ích

- Chạy validation: `cd d:\YTB\H2DEV-Project; node scripts/validate-project.js`
- Chạy audit 100%: `node scripts/deep-audit.js`
- Verify kênh YouTube: `vidIQ.channel_stats` → failback `vidiq_channel_search` (fuzzy)
- Verify ngách/cạnh tranh: `vidIQ.keyword_research` (mode=research, dùng `overall score`, chuẩn hóa keyword + country)
- Kiểm tra "kênh con mọc": `vidIQ.outliers` (kênh nhỏ có video breakout)
- Tin tức/trend thị trường: `trends.get_top_trends` → jina/firecrawl đọc Google News RSS
- RPM chuẩn: AIR Media (Education $10.22 median), KHÔNG Dynamoi

## Current live baseline (21/09/2026)

- 140 learning records (136 video + 4 Zoom; 27 free · 113 pro) · 153 tài liệu · 165 kênh (152 live · 13 dead) · 34 ngách · 45 kịch bản · 27 nguồn reup.
- Media: 140/140 file ffprobe có hình + audio (0 file 0 byte) · ~23.51 GB (21.89 GiB) · `docs/` 142 thư mục · `assets/thumbs/` 140/140.
- Raw channel: 156 record canonical (149 kênh unique) phân rã thành **12 Nhóm Chủ Đề Lớn + 3 Nhóm Đặc Nhiệm (Tổng 15 Nhóm)**.
- **Hạ tầng 13 Kỹ Năng Tác Chiến Độc Quyền tại `D:\YTB\.agents\skills\` (ĐỦ FILL 100%):**
  1. `h2dev-everyday-history` (Lịch sử đồ vật thường ngày - Ngách Xanh #1 SSoT)
  2. `h2dev-ancient-civilizations` (Lịch sử / Khảo cổ học / Sumer / Anunnaki - 35 kênh)
  3. `h2dev-senior-wisdom` (Sức khỏe lão hóa / Chuyện đời - 42 kênh, 100% Không YMYL y tế, nhịp 105 WPM)
  4. `h2dev-dark-crime` (Tội phạm kinh tế / Dark Ledger - 15 kênh, RPM $18-$38, 145 WPM)
  5. `h2dev-survival-offgrid` (Địa lý sinh tồn / Off-Grid / Nhà đất - 18 kênh, ASMR thiên nhiên)
  6. `h2dev-english-learning` (Học tiếng Anh thụ động / Kể chuyện - 9 kênh, 2 tốc độ 100 & 140 WPM)
  7. `h2dev-geopolitics-military` (Quân sự / Địa chính trị / Bản đồ 3D - 8 kênh, chokepoints)
  8. `h2dev-ai-film-director` (10 thể loại điện ảnh AI: Tiên hiệp, Cổ trang, Xuyên không, Cyberpunk, Quái đàm, 3D...)
  9. `h2dev-wildlife-script` & 10. `h2dev-wildlife-motion` (Tài liệu động vật hoang dã BBC)
  11. `h2dev-ton-giao` & 12. `h2dev-bible` (Tôn giáo học thuật & Kinh Thánh EN V2.1)
  13. `h2dev-hoat-hinh` (Hoạt hình 3D thiếu nhi)
- **Bàn điều khiển trung tâm 1-Click:** `scripts/h2dev_master_producer.py` (điều phối 15 nhóm chủ đề).
- **Kho nghiên cứu Reverse-Engineering tại `D:\YTB\research-repos\`:** BrowserSkill (Tencent), ainovel-cli, drama-skills (linux.do), make-prompt-seedance2, dola-render-gateway, YouTube.js (LuanRT), yt-fts, FckSignups.
- **MCP Pool Local :3988:** 188+ tools, module `youtube_intelligence` sở hữu **26 công cụ chuyên sâu $0.00**.
- **Quy chế Credit:** Đóng băng tool tính phí vidIQ (còn 75 add-on, 0 renewable đến 09/10/2026); khai thác You.com ($199.34 USD khả dụng) và youtube_intelligence.
- **Nhị phân media PC:** FFmpeg N-125856 hỗ trợ Nvidia GPU / AV1 / H.266 / EBU R128; yt-dlp đã nâng cấp lên bản mới nhất `2026.8.19`.

## Historical verified snapshot (21/08/2026)

- 129 video · 161 kênh (148 live · 13 dead) · 96 tài liệu · 34 ngách (11 `xanh:true`) · 45 kịch bản · 27 nguồn reup.
- Ngách vàng đo lại 21/08 (vidIQ): Phật pháp Nhật 仏教の教え overall 76.8 / comp 13.3 · Everyday History EN history of everyday objects 69.7 / 31 · Kinh Thánh EN bible explained 68.9 / 48 · Wildlife documentary (dinosaur wedge 71.1 / 35.3; **cấm rescue**).
- Chính sách YPP 2027: kênh MỚI 1.000 sub + 8.000 giờ/365 ngày HOẶC 20M Shorts/90 ngày (01/02/2027). Shorts pool 10M/90 ngày. Premium 30% / Premium Lite 60%. Help 12843009.
- Cấm 3 nhóm inauthentic (Help 1311392): template/repetitive · off-putting (animal peril/rescue, minors distress) · AI persona health/finance/legal.
- RPM AIR 2026 (300 kênh): Education & Science median **$10.22** · Health & Sport **$1.23** · Business & Finance **$2.01**. Không dùng lore Health $7–22 / Finance $5–20 để chọn ngách.
- MCP đã gỡ google-news-trends (timeout); github cần token thật.
- 4 pipeline: ton-giao · hoat-hinh-ai · wildlife · bible-explainer.
