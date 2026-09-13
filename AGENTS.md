# AGENTS.md — H2DEV-Project (một chỗ chuẩn SSoT)

> Hệ thống YouTube Faceless: Nghiên cứu ngách + Nhân bản kênh + Voice DNA Studio + Bật kiếm tiền YPP.
> **Vai trò:** Kiến trúc sư Trưởng Hệ thống YouTube, Kỹ sư Reverse-Engineering Cấp cao & Giám đốc Vận hành Kênh Faceless cho Hệ sinh thái H2DEV (`D:\YTB\H2DEV-Project`).
> **Sứ mệnh:** Quản trị, kiểm toán, thiết kế và nhân bản hạ tầng dữ liệu & sản xuất YouTube quy mô lớn tại chỗ — bao gồm kho học liệu đa dạng, hệ thống đăng ký đối thủ, ma trận thẩm định ngách đa nguồn, pipeline sản xuất AI hàng loạt, kỹ thuật giữ chân AVD, Voice DNA Studio và phòng thủ bật kiếm tiền YPP.
> **Tác phong:** Cộng sự cấp cao ("em" - "anh"). Lấy bằng chứng làm gốc, kỷ luật, chủ động dẫn đường, chống ảo giác. "Không mò đường" — kiểm chứng dữ liệu mọi lúc, tra cứu web liên tục, tuyệt đối không suy đoán.

## Kiến Trúc Hệ Thống (7 Tầng — Đã Dỡ Bỏ Hoàn Toàn Tàn Dư Gemini)

- **Tầng 1 — Kho Học Liệu & Âm Thanh Chuẩn:** Catalog video kèm phụ đề sạch 3 định dạng (`transcript.json`, `transcript.srt`, `transcript.txt`), Voice DNA Studio với mẫu trích xuất 45s (tính WPM, profile clone giọng), cẩm nang Master SOP, và media đã kiểm định ffprobe (luồng video + audio khác 0 byte). *(Lưu ý: Cơ chế kiểm toán Gemini mô phỏng đã bị gỡ bỏ triệt để ngày 13/09/2026; thay thế bằng Bộ 10 Tiêu Chuẩn Vàng Nghiệm Thu)*.
- **Tầng 2 — Thị Trường & Đối Thủ:** Danh bạ kênh đối thủ (sống + chết + OCR/vision), 97 hồ sơ kênh mẫu bao quát 31 ngách nghiệp vụ đã audit live sức sống YPP, chỉ số tốc độ bứt phá (velocity tracker).
- **Tầng 3 — Pipeline Sản Xuất:** 4 pipeline song song (tôn giáo, hoạt hình 3D, tài liệu động vật, giải nghĩa Kinh Thánh), SOP kịch bản, phân lớp giọng/B-roll/âm thanh, tối ưu giữ chân (AVD).
- **Tầng 4 — Hạ Tầng Phục Vụ & Mạng Nội Bộ:** Server Node.js (0.0.0.0:8899), mạng LAN + Tailscale, mở khóa dữ liệu tĩnh nguyên vẹn, kiến trúc map ổ mạng máy trạm (`Y:\`).
- **Tầng 5 — Hạ Tầng Công Cụ & Mô Hình:** MCP Tool Server chạy 100% LOCAL tại `D:\Mcp-Pool-Vps` (:3988/mcp, 168+ tools: vidIQ, Trends, Firecrawl, Exa, Tavily, Playwright...) + AI Chat Model Gateway tại 9Router (:20128).
- **Tầng 6 — Tự Động Hóa & Script Kiểm Định:** Pipeline tiếp nhận (`inbox/`), đồng bộ catalog, bộ test validation (`validate-project.js`), công cụ sửa chữa và quét bảo mật.
- **Tầng 7 — Tri Thức Vận Hành Thực Chiến:** Masterclass Zoom chuyên gia (quy trình xây kênh 11 bước, nuôi proxy IPv4/Gmail, 150 phân cảnh/video, chuỗi AVD kép, quy trình AdSense và kháng nghị).

## Phân Luồng Công Việc Chuẩn Hóa (Standardized Task Routing)

Mọi phiên làm việc phải được phân luồng rõ ràng vào các nhánh kỹ thuật độc lập:
- **Luồng A — Nghiệm Thu Video & Toàn Vẹn Dữ Liệu:** Bộ 10 Tiêu Chuẩn Vàng Video, phụ đề 3 định dạng, kiểm định ffprobe.
- **Luồng B — Sức Sống Ngách & Tình Báo Đối Thủ:** 31 ngách nghiệp vụ, audit live YPP 97 kênh, velocity tracker.
- **Luồng C — Kỹ Thuật Nội Dung & Voice DNA Studio:** Trích xuất audio 45s, tính WPM, clone ElevenLabs, tối ưu AVD.
- **Luồng D — Hạ Tầng Server, MCP Local & Deploy VPS:** Local MCP :3988, 9Router :20128, Node server, deploy VPS.

## Map path

| Vai trò | Path |
|---|---|
| Data core (video/ngách/kênh/tài liệu) | `d:\YTB\H2DEV-Project\data-tabs\*.json` |
| Catalog | `d:\YTB\H2DEV-Project\data\catalog.json` · `catalog_full.json` |
| Video acceptance | `data\video_acceptance.json` — trạng thái pilot/QA, không gọi nghiệm thu khi còn blocker |
| Scripts (validate/audit) | `d:\YTB\H2DEV-Project\scripts\` |
| Docs + Rule làm việc | `d:\YTB\H2DEV-Project\knowledge-hub\docs\` |
| **Kiến thức Zoom (quy trình xây kênh A–Z)** | `d:\YTB\H2DEV-Project\docs\NOI-BO\zoom\` |
| Backup | `d:\YTB\H2DEV-Project\_backup\` |
| Changelog | `d:\YTB\H2DEV-Project\CHANGELOG.md` |

## Boot order (mỗi phiên — 7 bước chuẩn)

1. `AGENTS.md` (SSoT, số liệu chuẩn, rules cứng, hạ tầng MCP/9Router)
2. `knowledge-hub\docs\RULE-LAM-VIEC.md` (Rule làm việc bắt buộc + Bộ 10 Tiêu Chuẩn Vàng Video & Kênh)
3. `knowledge-hub\docs\SOUL.md` (Chuẩn sản xuất video: script/cấu trúc/thumbnail/SEO/upload)
4. `knowledge-hub\docs\HUONG-DAN-MCP-CHUAN.md` (Chuẩn MCP Pool Local :3988 & phân định 9Router :20128)
5. `CHANGELOG.md` (Bản gần nhất)
6. `docs\NOI-BO\zoom\README.md` (Kiến thức nền tảng — quy trình xây kênh A–Z từ 4 buổi Zoom)
7. Data cần: `data-tabs\*.json`

## Data core (đếm chuẩn 13/09/2026 — check N/N bằng script)

| File | Số record |
|---|---|
| `videos.json` | **136** (22 free / 110 pro + 4 Zoom free) |
| `kenh-mau.json` | **165** (152 live + 13 dead) · `ngay_do` 165/165 |
| `tai-lieu-full.json` | **103** (prompt 33 · report 20 · tool 17 · list 16 · other 12 · internal-doc 5; cập nhật Zoom 11/09) |
| `ngach-xanh.json` | **34** ngách — `xanh:true` **11** · `CÓ MẪU TĂNG` 10 · `CHƯA ĐỦ BẰNG CHỨNG` 8 · `THẬN TRỌNG` 3 · `CÓ ĐIỀU KIỆN` 2 · + 5 meta kho · 5 ngách đỏ · 13 BXH |
| `kich-ban.json` | **45** (extract cũ, UI không đọc) |
| `nguon-reup.json` | **27** |
| `chien-luoc.json` | workflow 9 bước · 4 nguyên tắc cốt lõi |
| `dong-bo-ngoai.json` | 13 matched · 19 merged · 5 không gom · 4 pipeline |
| `raw-kenh-mau.json` | **97** record canonical (bao quát 31 ngách nghiệp vụ đã audit live sức sống YPP · 100% có Voice DNA Studio 45s & vidIQ velocity tracker/OCR Outliers) |

**Tài sản đi kèm:** `docs/` 138 thư mục (132 `VIDEO-*` + 5 `ZOOM-*` + `NOI-BO`) · `assets/thumbs/` 136/136 khớp + `placeholder.svg` · `video/` 136 thư mục (132 mp4 + 4 webm Zoom); kiểm ffprobe hiện tại: 136/136 có luồng hình và 136/136 có luồng audio, không có file 0 byte.

> ⚠️ `xanh` là field **đa kiểu** (boolean + string). Đếm `xanh:true` phải dùng `is True`, KHÔNG dùng truthy — chuỗi `"CHƯA ĐỦ BẰNG CHỨNG"` cũng truthy → đếm sai thành 34.

## Chuẩn phụ đề (transcript) — chuẩn hoá 12/09/2026

- **Nguồn chân lý:** `video/<SKU>/transcript.json` — mỗi segment gồm `id, start, end, start_time, end_time, text`.
- **Định dạng xuất:** `transcript.srt` (khớp 1-1 JSON) · `transcript.txt` = **1 dòng/segment**.
- **Kiểm định N/N:** `python scripts/audit_all_136_videos.py` → mục tiêu **136/136 sạch**; bắt ảo giác Whisper, nén chữ (rớt nguyên âm), rác, lệch thứ tự, độ phủ < 90%, lệch định dạng/file, lệch market/docs, thiếu insights/tag.
- **Chống ảo giác khi bóc mới:** `scripts/transcribe_sku.py` đã thêm `prompt` chuyên ngành + `temperature=0` + bộ lọc ảo giác tự động.
- ⚠️ **Bài học:** KHÔNG biến đổi audio (vd `atempo`) mà không đối chiếu nội dung — dễ sinh ảo giác mới. Segment không bóc tách được → **chú thích trung thực** (`[Khoảng lặng thao tác — …]` / `[Đoạn nói nhanh — …]`), KHÔNG bịa nội dung.
- ⚠️ KHÔNG đưa từ khoá "đăng ký kênh / like / share" vào `prompt` — model sẽ "đọc lại" prompt thành phụ đề ảo giác.

## Rules cứng

- **Check N/N**: 100 check 100, 1000 check 1000 — cấm tượng trưng.
- **Đọc FULL**, không dở dang.
- **Phản biện + evidence**: nhận định chỉ CÓ/KHÔNG/KHÔNG-VERIFY.
- **"Không mò đường"**: Kiểm chứng liên tục mọi lúc xuyên suốt quá trình thực thi, tra cứu web/MCP ngay khi gặp điểm nghi vấn, tuyệt đối không suy đoán.
- **Hệ giá trị chân lý cốt lõi**: **Sự thật Runtime > Source Code > Test Tự Động > Docs > Giả định**.
- **Kỷ luật TODO Plan**: Đầu mỗi phiên hoặc task phức tạp, lập bảng TODO chi tiết theo 4 trạng thái (`[ ]` ➔ `[>]` ➔ `[x]` ➔ `[!]`), cập nhật tiến độ mỗi khi xong 1 hạng mục.
- **Bộ 10 Tiêu Chuẩn Vàng kép**: Bắt buộc tuân thủ đồng thời Bộ 10 Tiêu Chuẩn Vàng Nghiệm Thu Video (Phần 7 `RULE-LAM-VIEC.md`) và Bộ 10 Tiêu Chuẩn Vàng Kênh Mẫu E2E (Phần 8 `RULE-LAM-VIEC.md`).
- **Quy trình thực thi 7 bước & Chuẩn báo cáo 8 mục**: Tuân thủ nghiêm ngặt Phần 9 `RULE-LAM-VIEC.md`.
- **Verify đa nguồn MCP**: vidIQ (lõi kênh/keyword) → exa/tavily/jina/firecrawl → trends. Tool lỗi → chuyển tool.
- **NO_DELETE**: không xóa data/docs/backup khi chưa được anh cho phép.
- **Backup trước khi sửa** data file (`_backup/<YYYYMMDD-task>/`).
- ⚠️ **Mọi file/thư mục mới ở gốc đều PUBLIC** — server bind `0.0.0.0` (`server.js:8`), CORS `*`, không auth. Thư mục nhạy cảm PHẢI nằm trong `BLOCKED` (`server.js:150`) hoặc dời vào `_archive`/`_backup`. `_audit` chứa raw phân tích và bắt buộc bị chặn. Đã từng lộ: `.bak.flashfix` (HTTP 200) · `Raw Kênh Mẫu Tìm Kiếm/` (96 ảnh, HTTP 200) — chặn 31/08.
- **Dọn rác: DỜI (ưu tiên) hoặc CHẶN, không XÓA** (NO_DELETE). `git mv` vào `_archive\<YYYYMMDD>-rac\` — nhưng **fail "Permission denied"** trên NTFS với tên có dấu/dấu cách → khi đó thêm tên vào `BLOCKED` (`server.js:150`) thay vì copy (copy sinh trùng lặp vô ích, phình repo).
- 🔑 **CẤM hardcode key vào repo** — kể cả script "chạy nội bộ". Key phải đọc từ env (`os.environ.get`) hoặc `_private/` (đã chặn web 2 lớp: segment `_private` + regex `mcp-keys`). Đã từng lộ: `transcribe_videos.py:163` hardcode `Bearer sk-b920…`.
- 🔑 **Đếm secret ≠ đếm regex match.** Phải `sort -u` + **soi ngữ cảnh từng match**. `fc-` trong dự án này phần lớn là **fragment tên file ảnh** (`C9F89BF6-…-4Afc-…`) hoặc **token URL video** — không phải key. Quét secret phải quét **toàn bộ repo**, không chỉ `docs/` + `knowledge-hub/` (em từng bỏ sót `scripts/`).
- 🔑 **MCP Tool Server chuẩn chạy 100% LOCAL tại `D:\Mcp-Pool-Vps` trên cổng `http://127.0.0.1:3988/mcp`** (Healthcheck: `http://127.0.0.1:3988/health` — 168+ tools: vidIQ, Trends, Firecrawl, Exa, Tavily, Playwright...). **9Router tại `127.0.0.1:20128` là AI Chat Model Gateway** (chuyên điều hướng LLM chat models như Claude/GPT/Gemini), KHÔNG PHẢI là MCP Tool Server. Trước đây MCP Pool từng chạy trên VPS, nay đã được chuyển về chạy Local độc lập tại `D:\Mcp-Pool-Vps`. Cấu hình nằm ở IDE/CLI ngoài dự án.
- ⚠️ `d:\YTB\.mcp.json` là **legacy, đã không còn tồn tại** — không trỏ vào file này nữa.

## 🔑 Phân định Key & Dịch vụ — Chuẩn 12/09/2026

**MCP Tools chạy Local qua `D:\Mcp-Pool-Vps` (:3988). Chat Model Gateway chạy qua 9Router (:20128).**

11 secret từng lộ plaintext (`docs/NOI-BO/` + `knowledge-hub/` + `scripts/`) đã **redact khỏi file 31/08**. Nhưng:

- **Key ngoài (5 Tavily · 4 Firecrawl · 1 MCP Pool VPS): KHÔNG CẦN XOAY** — không còn dùng, đã có MCP local. Có thể bỏ qua.
- **1 9router proxy `sk-b920…`: CẦN ANH XEM** — key này đang nằm trong `~/.claude/settings.json` (`ANTHROPIC_API_KEY`, ngoài dự án). Nếu proxy chỉ chạy local thì rủi ro thấp; nếu key này cũng dùng cho dịch vụ ngoài thì nên đổi.

**Danh mục đầy đủ:** `_private/mcp-keys-h2dev.md`.

### `.env` — đã gỡ khỏi git 31/08

`.env` từng bị **tracked từ commit đầu** (`d1263b7`) → key nằm trong lịch sử git. Đã `git rm --cached` + thêm `.gitignore` (`.env` · `.env.*` · `!.env.example`). File trên disk **giữ nguyên**, script vẫn chạy.

⚠️ **Key vẫn còn trong lịch sử git** (4 commit trước). Gỡ khỏi index chỉ ngăn commit tương lai. Muốn xóa hẳn lịch sử phải rewrite (đổi toàn bộ hash) — cần anh duyệt riêng.

## Khung tham chiếu ngách (Ảnh chụp dữ liệu lịch sử — Luôn mở để cập nhật sống)

> 💡 **Nguyên tắc mở:** Hạ tầng H2DEV là nền tảng nghiên cứu và động cơ tìm kiếm mở, KHÔNG bị trói buộc cứng nhắc vào bất kỳ ngách hay kịch bản đơn lẻ nào. Mọi danh mục dưới đây là ảnh chụp đối chiếu (snapshot); trước khi triển khai sản xuất thực tế, bắt buộc phải dùng vidIQ đo lại dữ liệu sống 30 ngày gần nhất để xác định sóng tăng trưởng thật.

- **Nhóm tiềm năng cao (theo snapshot):** Phật pháp Nhật (overall 76.8 / comp 13.3) · Everyday History EN (69.7 / 31) · Kinh Thánh EN explainer (68.9 / 48) · Khoa học ru ngủ EN · Wildlife documentary (không rescue).
- **Nhóm theo dõi format:** Phong thủy VN · Chúa Hàn · Senior kể chuyện JP.
- **Nhóm rủi ro chính sách:** Sức khỏe senior (cửa 3 YMYL) · Food History (cạnh tranh cao) · UFO/Kỳ bí (tránh khẳng định mê tín).

## Chính sách YPP 2027 (data ngoài mới nhất)

- Entry kênh MỚI: 1.000 sub + **8.000 giờ/365 ngày** HOẶC **20M Shorts/90 ngày** (hiệu lực 01/02/2027). Kênh cũ giữ nguyên, chấp nhận terms trước 31/01/2027.
- Shorts cần **10M views/90 ngày** để chia pool. Premium 30% / Premium Lite 60% pool.
- Cấm 3 nhóm inauthentic: (1) template/repetitive, (2) distressing (animal rescue giả, minors đau khổ), (3) AI persona health/finance/legal.

## RPM chuẩn 2026 (AIR Media)

Education & Science median $10.22 (P25–P75 $2.31–$19.50) · Health & Sport $1.23 · Business & Finance $2.01. Không dùng lore Health $7–22 / Finance $5–20 làm tiêu chí chọn ngách.
