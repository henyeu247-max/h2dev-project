# MEMORY.md — H2DEV-Project (rules bền + shortcuts)

> Chỉ chứa rules + shortcuts bền. Chi tiết workflow → đọc file liên quan khi cần (không nhét dài vào đây).
> Cập nhật: 12/09/2026.

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
5. Backup trước khi sửa data. NO_DELETE khi chưa được phép.

## Shortcuts hữu ích

- Chạy validation: `cd d:\YTB\H2DEV-Project; node scripts/validate-project.js`
- Chạy audit 100%: `node scripts/deep-audit.js`
- Verify kênh YouTube: `vidIQ.channel_stats` → failback `vidiq_channel_search` (fuzzy)
- Verify ngách/cạnh tranh: `vidIQ.keyword_research` (mode=research, dùng `overall score`, chuẩn hóa keyword + country)
- Kiểm tra "kênh con mọc": `vidIQ.outliers` (kênh nhỏ có video breakout)
- Tin tức/trend thị trường: `trends.get_top_trends` → jina/firecrawl đọc Google News RSS
- RPM chuẩn: AIR Media (Education $10.22 median), KHÔNG Dynamoi

## Current live baseline (12/09/2026)

- 136 learning records (132 video + 4 Zoom) · 109 tài liệu · 165 kênh (152 live · 13 dead) · 34 ngách · 45 kịch bản · 27 nguồn reup.
- Raw channel: 95 source snapshots, trong đó 83 record canonical và 12 duplicate; UI dùng `data-tabs/raw-kenh-mau.json` (83 record).

## Historical verified snapshot (21/08/2026)

- 129 video · 161 kênh (148 live · 13 dead) · 96 tài liệu · 34 ngách (11 `xanh:true`) · 45 kịch bản · 27 nguồn reup.
- Ngách vàng đo lại 21/08 (vidIQ): Phật pháp Nhật 仏教の教え overall 76.8 / comp 13.3 · Everyday History EN history of everyday objects 69.7 / 31 · Kinh Thánh EN bible explained 68.9 / 48 · Wildlife documentary (dinosaur wedge 71.1 / 35.3; **cấm rescue**).
- Chính sách YPP 2027: kênh MỚI 1.000 sub + 8.000 giờ/365 ngày HOẶC 20M Shorts/90 ngày (01/02/2027). Shorts pool 10M/90 ngày. Premium 30% / Premium Lite 60%. Help 12843009.
- Cấm 3 nhóm inauthentic (Help 1311392): template/repetitive · off-putting (animal peril/rescue, minors distress) · AI persona health/finance/legal.
- RPM AIR 2026 (300 kênh): Education & Science median **$10.22** · Health & Sport **$1.23** · Business & Finance **$2.01**. Không dùng lore Health $7–22 / Finance $5–20 để chọn ngách.
- MCP đã gỡ google-news-trends (timeout); github cần token thật.
- 4 pipeline: ton-giao · hoat-hinh-ai · wildlife · bible-explainer.
