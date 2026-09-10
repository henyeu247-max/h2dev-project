# AGENTS.md — H2DEV-Project (một chỗ chuẩn SSoT)

> Dự án YouTube: nghiên cứu ngách + nhân bản kênh + kiếm tiền YPP.

## Map path

| Vai trò | Path |
|---|---|
| Data core (video/ngách/kênh/tài liệu) | `d:\YTB\H2DEV-Project\data-tabs\*.json` |
| Catalog | `d:\YTB\H2DEV-Project\data\catalog.json` · `catalog_full.json` |
| Gemini audit/status | `data\video_analysis_schema.json` · `video_analysis_batches.json` · `video_analysis_manifest.json` · `video_analysis_public.json` |
| Video acceptance | `data\video_acceptance.json` — trạng thái pilot/QA, không gọi nghiệm thu khi còn blocker |
| Scripts (validate/audit) | `d:\YTB\H2DEV-Project\scripts\` |
| Docs + Rule làm việc | `d:\YTB\H2DEV-Project\knowledge-hub\docs\` |
| Backup | `d:\YTB\H2DEV-Project\_backup\` |
| Changelog | `d:\YTB\H2DEV-Project\CHANGELOG.md` |

| Scripts (validate/audit) | `d:\YTB\H2DEV-Project\scripts\` |
| Docs + Rule làm việc | `d:\YTB\H2DEV-Project\knowledge-hub\docs\` |
| Backup | `d:\YTB\H2DEV-Project\_backup\` |
| Changelog | `d:\YTB\H2DEV-Project\CHANGELOG.md` |

## Boot order (mỗi phiên)

1. `AGENTS.md` (file này)
2. `knowledge-hub\docs\RULE-LAM-VIEC.md` (rule làm việc bắt buộc + verify ngách + nguyên tắc linh hoạt)
3. `knowledge-hub\docs\SOUL.md` (chuẩn sản xuất video: script/cấu trúc/thumbnail/SEO/upload)
4. `knowledge-hub\docs\HUONG-DAN-MCP-CHUAN.md` (đội agent MCP local qua 9router)
5. `CHANGELOG.md` (bản gần nhất)
6. Data cần: `data-tabs\*.json`

## Data core (đếm chuẩn 05/09/2026 — check N/N bằng script)

| File | Số record |
|---|---|
| `videos.json` | **132** (22 free / 110 pro) |
| `kenh-mau.json` | **165** (152 live + 13 dead) · `ngay_do` 165/165 |
| `tai-lieu-full.json` | **98** (prompt 33 · report 20 · tool 17 · list 16 · other 12; cập nhật tài liệu 08/09) |
| `ngach-xanh.json` | **34** ngách — `xanh:true` **11** · `CÓ MẪU TĂNG` 10 · `CHƯA ĐỦ BẰNG CHỨNG` 8 · `THẬN TRỌNG` 3 · `CÓ ĐIỀU KIỆN` 1 · `CÓ ĐK` 1 · + 5 meta kho · 5 ngách đỏ · 13 BXH |
| `kich-ban.json` | **45** (extract cũ, UI không đọc) |
| `nguon-reup.json` | **27** |
| `chien-luoc.json` | workflow 9 bước · 4 nguyên tắc cốt lõi |
| `dong-bo-ngoai.json` | 13 matched · 19 merged · 5 không gom · 4 pipeline |
| `raw-kenh-mau.json` | **95** ảnh/record · OCR 95/95 · Vision 31 · verified 2 |

**Tài sản đi kèm:** `docs/` 133 thư mục (132 `VIDEO-*` + `NOI-BO`) · `assets/thumbs/` 132/132 khớp + `placeholder.svg` · `video/` 132 thư mục mp4; kiểm ffprobe hiện tại: 132/132 có luồng hình và 132/132 có luồng audio, không có file 0 byte.

> ⚠️ `xanh` là field **đa kiểu** (boolean + string). Đếm `xanh:true` phải dùng `is True`, KHÔNG dùng truthy — chuỗi `"CHƯA ĐỦ BẰNG CHỨNG"` cũng truthy → đếm sai thành 34.

## Rules cứng

- **Check N/N**: 100 check 100, 1000 check 1000 — cấm tượng trưng.
- **Gemini video audit**: `data/video_analysis_manifest.json` phải có đủ 131 SKU; tình trạng file, độ phủ phân tích và độ đúng nội dung là ba trường độc lập. Chỉ `approved_for_ui` mới được đưa quan sát vào giao diện; raw nằm trong `_audit` và bị chặn web.
- **Đọc FULL**, không dở dang.
- **Phản biện + evidence**: nhận định chỉ CÓ/KHÔNG/KHÔNG-VERIFY.
- **Verify đa nguồn MCP**: vidIQ (lõi kênh/keyword) → exa/tavily/jina/firecrawl → trends. Tool lỗi → chuyển tool.
- **NO_DELETE**: không xóa data/docs/backup khi chưa được anh cho phép.
- **Backup trước khi sửa** data file.
- ⚠️ **Mọi file/thư mục mới ở gốc đều PUBLIC** — server bind `0.0.0.0` (`server.js:8`), CORS `*`, không auth. Thư mục nhạy cảm PHẢI nằm trong `BLOCKED` (`server.js:150`) hoặc dời vào `_archive`/`_backup`. `_audit` chứa raw phân tích và bắt buộc bị chặn. Đã từng lộ: `.bak.flashfix` (HTTP 200) · `Raw Kênh Mẫu Tìm Kiếm/` (96 ảnh, HTTP 200) — chặn 31/08.
- **Dọn rác: DỜI (ưu tiên) hoặc CHẶN, không XÓA** (NO_DELETE). `git mv` vào `_archive\<YYYYMMDD>-rac\` — nhưng **fail "Permission denied"** trên NTFS với tên có dấu/dấu cách → khi đó thêm tên vào `BLOCKED` (`server.js:150`) thay vì copy (copy sinh trùng lặp vô ích, phình repo).
- 🔑 **CẤM hardcode key vào repo** — kể cả script "chạy nội bộ". Key phải đọc từ env (`os.environ.get`) hoặc `_private/` (đã chặn web 2 lớp: segment `_private` + regex `mcp-keys`). Đã từng lộ: `transcribe_videos.py:163` hardcode `Bearer sk-b920…`.
- 🔑 **Đếm secret ≠ đếm regex match.** Phải `sort -u` + **soi ngữ cảnh từng match**. `fc-` trong dự án này phần lớn là **fragment tên file ảnh** (`C9F89BF6-…-4Afc-…`) hoặc **token URL video** — không phải key. Quét secret phải quét **toàn bộ repo**, không chỉ `docs/` + `knowledge-hub/` (em từng bỏ sót `scripts/`).
- 🔑 **MCP chạy LOCAL qua proxy `127.0.0.1:20128` (9router), cấu hình nằm ở omp/CLI — KHÔNG set cứng trong dự án.** Không cần key ngoài (Tavily/Firecrawl/Jina/vidIQ) nữa. `D:\YTB\.agents\mcp_config.json` hiện **rỗng** (`mcpServers: {}`) — không phải nguồn. ⚠️ MCP Pool VPS `mcp-pool.tonymmo.com` (194 tools) đang **chết — HTTP 502** (đo 31/08), đừng trỏ vào đó.
- ⚠️ `d:\YTB\.mcp.json` là **legacy, đã không còn tồn tại** — không trỏ vào file này nữa.

## 🔑 Key / MCP — trạng thái 31/08/2026

**MCP giờ chạy LOCAL qua 9router proxy (`127.0.0.1:20128`) — cấu hình nằm ở omp/CLI, KHÔNG set trong dự án.**

11 secret từng lộ plaintext (`docs/NOI-BO/` + `knowledge-hub/` + `scripts/`) đã **redact khỏi file 31/08**. Nhưng:

- **Key ngoài (5 Tavily · 4 Firecrawl · 1 MCP Pool VPS): KHÔNG CẦN XOAY** — không còn dùng, đã có MCP local. Có thể bỏ qua.
- **1 9router proxy `sk-b920…`: CẦN ANH XEM** — key này đang nằm trong `~/.claude/settings.json` (`ANTHROPIC_API_KEY`, ngoài dự án). Nếu proxy chỉ chạy local thì rủi ro thấp; nếu key này cũng dùng cho dịch vụ ngoài thì nên đổi.

**Danh mục đầy đủ:** `_private/mcp-keys-h2dev.md`.

### `.env` — đã gỡ khỏi git 31/08

`.env` từng bị **tracked từ commit đầu** (`d1263b7`) → key nằm trong lịch sử git. Đã `git rm --cached` + thêm `.gitignore` (`.env` · `.env.*` · `!.env.example`). File trên disk **giữ nguyên**, script vẫn chạy.

⚠️ **Key vẫn còn trong lịch sử git** (4 commit trước). Gỡ khỏi index chỉ ngăn commit tương lai. Muốn xóa hẳn lịch sử phải rewrite (đổi toàn bộ hash) — cần anh duyệt riêng.

## Ngách xanh hiện tại (đo lại 21/08)

- **Ưu tiên cao**: Phật pháp Nhật (overall 76.8 / comp 13.3) · Everyday History EN (69.7 / 31) · Kinh Thánh EN explainer (68.9 / 48) · Wildlife documentary (không rescue).
- **Bền vững nếu đúng format**: Phong thủy VN · Chúa Hàn · Senior kể chuyện JP.
- **Cẩn trọng**: Sức khỏe senior (cửa 3 + AIR Health $1.23) · Food History (comp 56) · UFO case-file.

## Chính sách YPP 2027 (data ngoài mới nhất)

- Entry kênh MỚI: 1.000 sub + **8.000 giờ/365 ngày** HOẶC **20M Shorts/90 ngày** (hiệu lực 01/02/2027). Kênh cũ giữ nguyên, chấp nhận terms trước 31/01/2027.
- Shorts cần **10M views/90 ngày** để chia pool. Premium 30% / Premium Lite 60% pool.
- Cấm 3 nhóm inauthentic: (1) template/repetitive, (2) distressing (animal rescue giả, minors đau khổ), (3) AI persona health/finance/legal.

## RPM chuẩn 2026 (AIR Media)

Education & Science median $10.22 (P25–P75 $2.31–$19.50) · Health & Sport $1.23 · Business & Finance $2.01. Không dùng lore Health $7–22 / Finance $5–20 làm tiêu chí chọn ngách.
