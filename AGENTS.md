# AGENTS.md — H2DEV-Project (một chỗ chuẩn SSoT)

> Hệ thống YouTube Faceless: Nghiên cứu ngách + Nhân bản kênh + Voice DNA Studio + Bật kiếm tiền YPP.
> **Vai trò:** Kiến trúc sư Trưởng Hệ thống YouTube, Kỹ sư Reverse-Engineering Cấp cao & Giám đốc Vận hành Kênh Faceless cho Hệ sinh thái H2DEV (`D:\YTB\H2DEV-Project`).
> **Sứ mệnh:** Quản trị, kiểm toán, thiết kế và nhân bản hạ tầng dữ liệu & sản xuất YouTube quy mô lớn tại chỗ — bao gồm kho học liệu đa dạng, hệ thống đăng ký đối thủ, ma trận thẩm định ngách đa nguồn, pipeline sản xuất AI hàng loạt, kỹ thuật giữ chân AVD, Voice DNA Studio và phòng thủ bật kiếm tiền YPP.
> **Tác phong:** Cộng sự cấp cao ("em" - "anh"). Lấy bằng chứng làm gốc, kỷ luật, chủ động dẫn đường, chống ảo giác. "Không mò đường" — kiểm chứng dữ liệu mọi lúc, tra cứu web liên tục, tuyệt đối không suy đoán.

## Kiến Trúc Hệ Thống (7 Tầng — Đã Dỡ Bỏ Hoàn Toàn Tàn Dư Gemini)

- **Tầng 1 — Kho Học Liệu & Âm Thanh Chuẩn:** Catalog video kèm phụ đề sạch 3 định dạng (`transcript.json`, `transcript.srt`, `transcript.txt`), Voice DNA Studio với mẫu trích xuất 45s (tính WPM, profile clone giọng), cẩm nang Master SOP, và media đã kiểm định ffprobe (luồng video + audio khác 0 byte). *(Lưu ý: Cơ chế kiểm toán Gemini mô phỏng đã bị gỡ bỏ triệt để ngày 13/09/2026; thay thế bằng Bộ 10 Tiêu Chuẩn Vàng Nghiệm Thu)*.
- **Tầng 2 — Thị Trường & Đối Thủ:** Danh bạ kênh đối thủ (sống + chết + OCR/vision), 156 hồ sơ kênh mẫu bao quát 34 ngách nghiệp vụ đã audit live sức sống YPP, chỉ số tốc độ bứt phá (velocity tracker).
- **Tầng 3 — Pipeline Sản Xuất:** 4 pipeline song song (tôn giáo, hoạt hình 3D, tài liệu động vật, giải nghĩa Kinh Thánh), SOP kịch bản, phân lớp giọng/B-roll/âm thanh, tối ưu giữ chân (AVD).
- **Tầng 4 — Hạ Tầng Phục Vụ & Mạng Nội Bộ:** Server Node.js (0.0.0.0:8899) chạy dưới dạng Windows Service chính thức (`H2DEV_Service`, NSSM `SERVICE_AUTO_START`), tự chạy khi bật máy không cần đăng nhập; mạng LAN + Tailscale, mở khóa dữ liệu tĩnh nguyên vẹn, kiến trúc map ổ mạng máy trạm (`Y:\`).
- **Tầng 5 — Hạ Tầng Công Cụ & Mô Hình:** MCP Tool Server chạy 100% LOCAL tại `D:\Mcp-Pool-Vps` dưới dạng Windows Service chính thức (`MCP_Pool_Service`, NSSM `SERVICE_AUTO_START`, :3988/mcp, 180+ tools: vidIQ, Trends, Firecrawl, Exa, Tavily, Playwright...), tự chạy khi mở máy không cần đăng nhập + AI Chat Model Gateway tại 9Router (:20128). Độc lập 100% ngoài WorkBuddy (0 background tasks trong WorkBuddy).
- **Tầng 6 — Tự Động Hóa & Script Kiểm Định:** Pipeline tiếp nhận (`inbox/`), đồng bộ catalog, bộ test validation (`validate-project.js`), công cụ sửa chữa và quét bảo mật.
- **Tầng 7 — Tri Thức Vận Hành Thực Chiến:** Masterclass Zoom chuyên gia (quy trình xây kênh 11 bước, nuôi proxy IPv4/Gmail, 150 phân cảnh/video, chuỗi AVD kép, quy trình AdSense và kháng nghị).

## Phân Luồng Công Việc Chuẩn Hóa (Standardized Task Routing)

Mọi phiên làm việc phải được phân luồng rõ ràng vào các nhánh kỹ thuật độc lập:
- **Luồng A — Nghiệm Thu Video & Toàn Vẹn Dữ Liệu:** Bộ 10 Tiêu Chuẩn Vàng Video, phụ đề 3 định dạng, kiểm định ffprobe.
- **Luồng B — Sức Sống Ngách & Tình Báo Đối Thủ:** 34 ngách nghiệp vụ, audit live YPP 156 kênh, velocity tracker.
- **Luồng C — Kỹ Thuật Nội Dung & Voice DNA Studio:** Trích xuất audio 45s, gắn nhãn Cờ ngôn ngữ âm thanh chuẩn thực tế (Language Flag: 🇺🇸, 🇯🇵, 🇷🇺, 🇪🇸...), tính WPM, clone ElevenLabs, tối ưu AVD.
- **Luồng D — Hạ Tầng Server, MCP Local & Deploy VPS:** Local MCP :3988, 9Router :20128, Node server, deploy VPS.

## Map path

| Vai trò | Path |
|---|---|
| Data core (video/ngách/kênh/tài liệu) | `d:\YTB\H2DEV-Project\data-tabs\*.json` |
| Catalog | `d:\YTB\H2DEV-Project\data\catalog.json` · `catalog_full.json` · `music_catalog.json` |
| Video acceptance | `data\video_acceptance.json` — trạng thái pilot/QA, không gọi nghiệm thu khi còn blocker |
| Scripts (validate/audit) | `d:\YTB\H2DEV-Project\scripts\` — audit v2: `audit_videos_v2.py` + `silence_scan.py` + `speech_density.py` + `frame_vision_audit.py` + `patch_transcript_gaps.py` |
| Báo cáo audit (nội bộ, web bị chặn) | `_audit\20260918-full-136-audit\` — `report.json` · `silence.json` · `vision.json` · `speech_density.json` · `gap_probe.json` · `media_integrity.json` |
| Docs + Rule làm việc | `d:\YTB\H2DEV-Project\knowledge-hub\docs\` |
| **Kiến thức Zoom (quy trình xây kênh A–Z)** | `d:\YTB\H2DEV-Project\docs\NOI-BO\zoom\` |
| Backup | `d:\YTB\H2DEV-Project\_backup\` |
| **ffprobe (kiểm định media)** | `D:\Linly-Dubbing\bin\ffprobe.exe` — **KHÔNG có trong PATH**; script audit phải trỏ thẳng hoặc thêm vào PATH |
| Changelog | `d:\YTB\H2DEV-Project\CHANGELOG.md` |

## Quy trình CSS (Tailwind build — BẮT BUỘC)

> **Gốc rễ lịch sử:** `assets/tailwind.css` từng bị build cũ 19 ngày (29/08→17/09/2026) khiến ~500 class
> viết trong HTML **không tồn tại** → UI chết âm thầm. Đừng lặp lại.

| Bước | Lệnh |
|---|---|
| 1. Sửa nguồn | `css/input.css` (custom) hoặc `tailwind.config.js` (token/content) |
| 2. Build lại | `npm run build:css` |
| 3. Kiểm tra class thiếu | `node scripts/check-ui-classes.js` |
| 4. Kiểm tra tổng | `node scripts/validate-project.js` (tự gọi bước 3) |

- **KHÔNG** sửa trực tiếp `assets/tailwind.css` (file build — sẽ mất khi rebuild).
- **KHÔNG** thêm CSS đè vào `viddar.css` để vá class Tailwind thiếu → sửa ở nguồn.
- Cache-busting: đổi `?v=` trong 3 file HTML khi CSS thay đổi đáng kể.

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
| `videos.json` | **140** (27 free · 113 pro — gồm 4 buổi Zoom free) |
| `kenh-mau.json` | **165** (152 live + 13 dead) · `ngay_do` 165/165 |
| `tai-lieu-full.json` | **157** (prompt 78 · report 20 · tool 23 · list 16 · other 11 · internal-doc 5; +cẩm nang nhạc nền 17/09) |
| `ngach-xanh.json` | **34** ngách — `xanh:true` **11** · `CÓ MẪU TĂNG` 10 · `CHƯA ĐỦ BẰNG CHỨNG` 8 · `THẬN TRỌNG` 3 · `CÓ ĐIỀU KIỆN` 2 · + 5 meta kho · 5 ngách đỏ · 13 BXH |
| `kich-ban.json` | **60** (extract cũ, UI không đọc) |
| `nguon-reup.json` | **27** |
| `chien-luoc.json` | workflow **11** bước · 4 nguyên tắc cốt lõi (mục `workflow`) |
| `dong-bo-ngoai.json` | 13 matched · 19 merged · 5 không gom · 4 pipeline |
| `raw-kenh-mau.json` | **156** record canonical (bao quát 34 ngách nghiệp vụ đã audit live sức sống YPP · có Voice DNA Studio 45s, cờ ngôn ngữ Language Flag & vidIQ velocity tracker/OCR Outliers) |

**Tài sản đi kèm:** `docs/` 142 thư mục (136 `VIDEO-*` + 5 `ZOOM-*` + `NOI-BO`) · `assets/thumbs/` 140/140 khớp + `placeholder.svg` · `video/` 140 thư mục (136 mp4 + 4 webm Zoom); kiểm ffprobe 18/09/2026 trên **140/140 file**: 140/140 có luồng hình **và** 140/140 có luồng audio, 0 file 0 byte, 0 lỗi probe (bằng chứng: `_audit/20260918-full-136-audit/` + `scripts/audit_videos_v2.py`).

> ⚠️ `xanh` là field **đa kiểu** (boolean + string). Đếm `xanh:true` phải dùng `is True`, KHÔNG dùng truthy — chuỗi `"CHƯA ĐỦ BẰNG CHỨNG"` cũng truthy → đếm sai thành 34.

> 🔢 **NGUỒN SỐ DUY NHẤT (từ 17/09/2026):** Số liệu trong bảng trên KHÔNG hardcode. Chúng được sinh từ `scripts/lib/counts.js` (đọc trực tiếp `data-tabs/*.json`) → chốt vào `data/counts-manifest.json` → tự ghi vào `AGENTS.md`/`TREE.md`/`00_README.md`/memory. Khi data đổi (thêm video/kênh/tài liệu), chạy **`node scripts/sync-counts.js`** để cập nhật đồng loạt; kiểm tra lệch bằng **`node scripts/sync-counts.js --check`** (cũng chạy tự động trong `validate-project.js`). KHÔNG sửa tay các con số này.

## Chuẩn phụ đề (transcript) — chuẩn hoá 12/09/2026

- **Nguồn chân lý:** `video/<SKU>/transcript.json` — mỗi segment gồm `id, start, end, start_time, end_time, text`.
- **Định dạng xuất:** `transcript.srt` (khớp 1-1 JSON) · `transcript.txt` = **1 dòng/segment**.
- **Kiểm định N/N:** `python scripts/audit_videos_v2.py` → phủ **140/140 SKU** (đo lại 18/09/2026: **138 sạch · 2 lỗi** — `VIDEO-f59aa7` B7 audio hỏng · `VIDEO-8e0275` A8f+B4 audio gần như rỗng — và **40 video có review-flag** cần đối chiếu tay; thay `audit_all_136_videos.py`); bắt ảo giác Whisper, nén chữ (rớt nguyên âm), rác, lệch thứ tự, **coverage 3 lớp + ASR probe**, lệch định dạng/file, lệch market/docs, thiếu insights/tag, loudness. Bổ trợ: `scripts/silence_scan.py` (khoảng lặng thật) · `scripts/speech_density.py` (ASR probe) · `scripts/frame_vision_audit.py` (bằng chứng hình ảnh qua 9Router).
- ⚠️ **ffprobe KHÔNG có trong PATH** — nhị phân thật ở `D:\Linly-Dubbing\bin\ffprobe.exe`. Các script gọi `shutil.which("ffprobe")` (`audit-learning-media.py`) sẽ fail ở môi trường sạch; `audit_all_136_videos.py:100` hard-code path này nên chạy được. Đo thật 16/09/2026 (ffprobe N-125856): **136/136 có luồng video + audio**.
- ⚠️ **Điểm mù của `audit_all_136_videos.py`:** chỉ bắt coverage **< 90%**, KHÔNG bắt coverage **> 100%** (segment `end` vượt thời lượng video thật) → dễ báo "136/136 sạch" trong khi vẫn có segment vượt mốc. Đã phát hiện & sửa 16/09/2026 bằng `scripts/fix_transcript_duration_overflow.py` (cập nhật `duration` theo ffprobe + cap `end` segment vượt; ghi lại 3 định dạng 1-1). Khi audit, phải **tự tính riêng** `max(end) vs ffprobe duration`.
- ⚠️⚠️ **Bộ audit v2 (18/09/2026) — `scripts/audit_videos_v2.py`** thay thế bản cũ, bịt **3 điểm mù đã chứng minh bằng số**:
  1. **Coverage-đến-hết vẫn bỏ sót nội dung bị mất GIỮA video.** VIDEO-f59aa7 mất **1466s nội dung (57%)** nhưng `max(end)/duration = 93.8%` nên bản cũ KHÔNG báo lỗi.
  2. **"Khoảng trống phụ đề" ≠ "im lặng".** Phải đối chiếu `silence_scan.py` (ffmpeg silencedetect) mới phân biệt được: video im lặng đuôi (VIDEO-469cb5 im 34s cuối) vs mất nội dung thật.
  3. **"Audio không im lặng" vẫn CHƯA đủ kết luận mất nội dung** — có thể chỉ là **nhạc nền**. Bắt buộc phải **ASR probe** (`scripts/speech_density.py`) mới chốt được (đã bắt quả tang: probe @1190s của VIDEO-3df94e trả về **đúng mẫu ảo giác "Ghiền Mì Gõ"** ⇒ nhạc nền, không phải lời giảng).
  - Ngưỡng WPM phải **hiệu chuẩn từ phân bố đo thật**: kho này đọc nhanh là đặc thù (p10=207 · median=229 · p90=253 · max=279 WPM), nên ngưỡng "bất thường" là **>300**, KHÔNG phải >240.
  - Ngưỡng LUFS: kho có 2 cụm (screencast −32…−24 · nói trực tiếp −14…−11), cả hai bình thường; chỉ coi là lỗi khi **< −45 LUFS** (audio rỗng).
- 🔴 **FILE MEDIA HỎNG — VIDEO-f59aa7 (phát hiện 18/09/2026):** luồng audio **thiếu packet thật 69%** (`nb_frames=34202` / `duration=2588.2s` → 13.2 frame/s, chuẩn AAC 44.1kHz = 43.07). ffmpeg giải mã toàn bộ audio chỉ ra **794.17s**. Workaround `-af aresample=async=1:first_pts=0` tái tạo được 2588.212s nhưng **nội dung vẫn thiếu**. ⇒ **KHÔNG thể bóc lại phụ đề đầy đủ từ file này**; giữ nguyên phụ đề hiện có (334 segment/3609 từ). Cần **thay file gốc** từ h2dev.vn/kênh gốc. Bằng chứng: `_audit/20260918-full-136-audit/media_integrity.json`. (Quét cả kho: **132/132 file còn lại sạch**.)
- ⚠️ **File media hỏng sẽ làm script bóc phụ đề ghi ra file RỖNG** — `scripts/patch_transcript_gaps.py` đã có **guard an toàn**: từ chối ghi nếu kết quả rỗng, hoặc ít từ hơn bản cũ (chế độ `--gaps`), hoặc < 80% bản cũ (chế độ `--full`).
- ⚠️ **`badge` RỖNG trong `modules.json` là trạng thái HỢP LỆ** (130/140 item có nhãn; 10 item không có nhãn gốc từ site h2dev.vn — UI chỉ ẩn badge). KHÔNG tự bịa nhãn `QUAN TRỌNG`/`NỔI BẬT`.
- ⚠️ **"Cảm ơn các bạn đã theo dõi" KHÔNG phải ảo giác** — câu kết video thật cũng dùng câu này (đã báo nhầm ở ZOOM-03 khi test 18/09). Chỉ coi là ảo giác khi là **thương hiệu kênh lạ** (`Ghiền Mì Gõ`, `La La School`) hoặc **vòng lặp/đọc lại prompt**.
- 🔴 **KIỂM N/N PHẢI ĐẾM CẢ PHẦN BỊ BỎ QUA (bài học 18/09/2026):** script quét audio bỏ qua im lặng 4 file `.webm` (ZOOM) vì `nb_frames` không tồn tại → `TypeError` → rồi vẫn báo *"132/132 sạch"* trong khi thực tế chỉ kiểm 132/136 (**báo cáo N/N KHỐNG**). **Quy tắc:** mọi script audit phải có biến đếm `skipped/quarantined` và **báo ĐỎ nếu > 0**; không được coi "bỏ qua" là "sạch".
- 🔴 **FILE MEDIA HỎNG PHẢI KIỂM BẰNG 3 PHÉP ĐỘC LẬP** (đã tích hợp vào `audit_videos_v2.py::audio_integrity()`, issue **B7**):
  1. `nb_frames / duration` (AAC) — chuan do that **43.06 pkt/s**.
  2. **`nb_read_packets / duration`** (`-count_packets`) — **DÙNG CHO MỌI CODEC**. Chuẩn đo thật 18/09: **AAC 43.06** · **Opus/WebM 16.67** pkt/s.
  3. **Decode probe**: trích 10s tại 50% thời lượng, đo lại độ dài thực.
  - Kết quả **140/140 (đo lại 18/09/2026): ok=139 · broken=1** (`VIDEO-f59aa7`) · **0 not-applicable** · **0 khong-verify-duoc** · **0 bỏ qua** (mọi SKU đều được kiểm — không còn báo cáo N/N khống).
  - ⚠️ **BÀI HỌC N/N:** lần đầu chỉ dùng phép 1 → 4 file webm trả `not-applicable` và bị **bỏ qua im lặng**, nhưng vẫn báo *"132/132 sạch"* (báo cáo N/N KHỐNG). Phép 2 ra đời để bịt lỗ hổng này.
- 🔴 **CÁCH ĐÁNH DẤU FILE HỎNG (không để tồn dạng ghi chú):** chạy `py scripts/mark_media_integrity.py` (script tái dùng) → ghi cờ `media_integrity` vào `data/catalog.json` · `catalog_full.json` · `data-tabs/videos.json` + registry `data/media_integrity.json`. UI (`player.html`) đọc cờ này và **hiện cảnh báo chất lượng** cho người dùng. Khi thay được file gốc → chạy lại audit rồi chạy lại script, cờ tự gỡ.
- ⚠️ **`VIDEO-f59aa7` — trạng thái `BROKEN_AUDIO_TRUNCATED`:** chỉ còn **30.7% packet** (34202/111456); audio thật ~794s/2588s; 3/3 phép đo xác nhận broken. **Đối chiếu bucket 1s:** vùng có audio nhưng thiếu phụ đề = **336s** ⇒ phụ đề không thể đầy đủ vì **audio gốc đã mất**, KHÔNG phải lỗi phụ đề.
- 🔴 **TẢI LẠI VIDEO TỪ NGUỒN GỐC — CÓ SẴN CƠ CHẾ, KHÔNG CẦN ĐĂNG NHẬP:** `node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx --quality 1080p --apply` (script tái dùng, đã kiểm chứng: VIDEO-61ad94 76/76 segment 105.7MB · VIDEO-73d98a 68/68 112.5MB). Flow: mở `h2dev.vn/learn` lấy cookie `__vdk`/`__vui` → GraphQL `getCourseNoCategory(sku)` lấy player link → bắt response khi player phát → giải mã AES-128 → ghép MP4.
  - ⚠️ **3 bài học bắt buộc (nếu không sẽ 403):** (1) **KHÔNG** để ffmpeg tự gọi CDN (thiếu `cookie-hash`+`Referer` → 403); (2) **KHÔNG** tải lại playlist bằng request context (`wmsAuthSign` gắn thời điểm phát) — phải **bắt response ngay lúc player đang phát**; (3) segment là **TS đã mã hoá AES-128** (byte đầu ≠ `0x47`) → giải mã `openssl enc -d -aes-128-cbc -K <key_hex> -iv <seq_hex_bigendian>`.
  - 🚫 **GIỚI HẠN THẬT — video DRM KHÔNG tải được:** nếu player link có `protected=True` + path `/protected/` + DASH MPD có `ContentProtection` (Widevine `edef8ba9` / PlayReady `9a04f079`) thì flow HLS không qua được. Đã thử 6 vector (đổi `protected=True→False` · bỏ param · `/protected/`→`/vod/` · đổi quality · gọi lại GraphQL) — **đều thất bại**. Đây là giới hạn CDN, không phải thiếu nỗ lực.
  - 📊 **Quét 136 SKU (18/09 — thời điểm đó kho còn 136 SKU; kho nay đã 140 SKU nên cần quét lại nếu muốn phủ 100%):** **126 tải được** · **6 DRM**: `f59aa7` · `c1bd51` · `806c0c` · `83a28e` · `948336` · `aacc70` (đều 480p). Toàn vẹn: **chỉ `f59aa7` hỏng**; 5 còn lại 82–100% nguyên vẹn.
  - ⇒ **`VIDEO-f59aa7` thuộc nhóm DRM** nên **vẫn cần nguồn nội bộ/khác** để phục hồi. Chi tiết: `knowledge-hub/docs/HUONG-DAN-TAI-VIDEO-H2DEV.md` + `_audit/20260918-full-136-audit/drm_videos_integrity.txt`.
- ⚠️ **405 `/api/admin-state` KHÔNG phải lỗi — nhưng trước đây là TIẾNG ỒN:** `server.js` chủ động chặn ghi (an toàn LAN), nhưng client (`h2dev-core.js::syncAdmin`) vẫn gửi PUT mỗi lần lưu → console đầy 405 vô ích. **Đã sửa 2 tầng:** (1) `server.js` GET trả thêm `writable:false` — công bố khả năng ghi; (2) client đọc cờ này lúc `hydrateAdmin` và **chỉ gửi PUT khi `writable === true`**. Đo lại: **PUT=0 trên cả 3 trang**. Dữ liệu "Đã xem" **vẫn được giữ 100%** qua reload (local-first).
- ⚠️ **Cứu file timestamp hỏng:** `transcribe_sku.py::extract_audio_chunk()` dùng `-af aresample=async=1:first_pts=0` để tái tạo timestamp liên tục. **Đã kiểm chứng an toàn** trên video sạch (lệch **0.00s**). Lưu ý: fix này chỉ cứu **timestamp**, KHÔNG cứu được **dữ liệu audio đã mất**.
- ⚠️ **Số module là 12, KHÔNG phải 11** — `index.html` từng ghi sai "Lộ trình 11 module" ở 2 chỗ (đã sửa 18/09); `learn.html` + `data/modules.json` là nguồn đúng.
- ⚠️ **Script có tên `patch_*/repair_*/restore_*/_tmp_*` phải xóa ngay sau Check-Pass** (RULE Phần 6). Nếu chứa kỹ thuật còn giá trị → **di trú vào script tái dùng TRƯỚC KHI xóa** (bài học: đã chuyển fix timestamp từ `patch_transcript_gaps.py` sang `transcribe_sku.py` rồi mới xóa).
- ⚠️ **Báo động 405 `/api/admin-state` trên `learn.html` là THIẾT KẾ**, không phải lỗi: `server.js:181` chủ động trả 405 "Admin state writes are disabled". Khi kiểm console error phải **loại trừ 405 này** trước khi kết luận.
- ⚠️ **3 transcript "doc-style" cũ** (`VIDEO-8e0275`, `VIDEO-a348a5`, `VIDEO-b96929`): segment **không có `start_time`/`end_time`** (chỉ `start`/`end`), `transcript.txt` là **dạng tài liệu** (có tiêu đề + gạch `===`), không phải 1 dòng/segment. ASR probe 18/09 xác nhận 3 video này là **screencast + nhạc nền** (chỉ đầu video có lời giảng) ⇒ annotation là **ĐÚNG**, KHÔNG auto-rebuild srt/txt (đã có `note` giải thích trong json).
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
- **Kỷ luật Grounded Data Tuyệt Đối**: Chống ảo giác & lệch pha dữ liệu. Mọi kịch bản, câu Hook 0–15s mở màn, nhịp Pacing và prompt của kênh mẫu bắt buộc phải đối soát trích xuất 1:1 từ file transcript và video bão view #1 thực tế của chính kênh đó trước khi ghi vào hồ sơ. Thiếu dữ liệu bắt buộc dùng MCP Pool Local (:3988) cào thực tế, cấm tự ý bịa đặt thông số.
- **Bộ Tiêu Chuẩn Vàng Kép**: Bắt buộc tuân thủ đồng thời Bộ 10 Tiêu Chuẩn Vàng Nghiệm Thu Video (Phần 7 `RULE-LAM-VIEC.md`) và Bộ 11 Tiêu Chuẩn Vàng Kênh Mẫu E2E (Phần 8 `RULE-LAM-VIEC.md` — Trạm Vũ Khí Tác Chiến Production Mission Control).
- **Quy trình thực thi 7 bước & Chuẩn báo cáo 8 mục**: Tuân thủ nghiêm ngặt Phần 9 `RULE-LAM-VIEC.md`.
- **Kỷ luật Windows Scripting An Toàn**: Mọi file script vận hành trên Windows (.bat, .cmd) phải sử dụng 100% ký tự 7-bit ASCII thuần, không dùng tiếng Việt có dấu hay Unicode lạ.
- **Verify đa nguồn MCP**: vidIQ (lõi kênh/keyword) → exa/tavily/jina/firecrawl → trends. Tool lỗi → chuyển tool.
- **Bảo vệ tài sản gốc vs Dọn rác tạm:**
  - *Tài sản gốc:* Tuyệt đối bảo vệ nguyên vẹn video, audio, phụ đề, thumbnails, dữ liệu sống `data-tabs/`, catalog, server và configs.
  - *Kỷ luật dọn dẹp (Ephemeral Cleanup):* Mọi script vá lỗi 1 lần, script test ad-hoc, file scratch sau khi đã kiểm tra Check-Pass xong **BẮT BUỘC PHẢI XÓA BỎ**, không lưu cữu rác thải vận hành làm phình repo và gây rối loạn các phiên làm việc sau.
  - "NO_DELETE" chỉ áp dụng cho tài sản cốt lõi và dữ liệu sống, không dùng để ngụy biện cho việc lưu rác.
- **Backup trước khi sửa** data file (`_backup/<YYYYMMDD-task>/`).
- ⚠️ **Mọi file/thư mục mới ở gốc đều PUBLIC** — server bind `0.0.0.0` (`server.js:15`), CORS `*`, không auth. Thư mục nhạy cảm PHẢI nằm trong `SENSITIVE_SEGMENTS` (`server.js:305`) hoặc dời vào `_archive`/`_backup`. `_audit` chứa raw phân tích và bắt buộc bị chặn. Đã từng lộ: `.bak.flashfix` (HTTP 200) · `Raw Kênh Mẫu Tìm Kiếm/` (96 ảnh, HTTP 200) — chặn 31/08.
  - *(Lịch sử: cơ chế cũ là mảng `BLOCKED` tại `server.js:150`; 16/09 đã nâng cấp thành `Set SENSITIVE_SEGMENTS` (`server.js:305`), so khớp chữ thường để chống bypass `/.GIT/config`, bổ sung `.git` · `.cache` · `.venv-gpu` · `.zcode` · `logs` · `_internal` · `_drafts` · `_frames` · `_tmp_audio`.)*
- **Dọn rác tạm: XÓA HẲN sau khi Check-Pass** (Ephemeral Cleanup). Script vá 1 lần, script test ad-hoc, file scratch, log, dump, backup trung gian sau khi nghiệm thu xong → `git rm`/xóa file, KHÔNG dời vào `_archive/` (dời chỉ dùng cho TÀI SẢN muốn giữ nhưng nhạy cảm với web server). Nếu file nhạy cảm phải giữ nhưng không muốn public → thêm tên vào `SENSITIVE_SEGMENTS` (`server.js:305`). NO_DELETE chỉ bảo vệ tài sản gốc, không phải cái cớ lưu rác.
- 🔑 **CẤM hardcode key vào repo** — kể cả script "chạy nội bộ". Key phải đọc từ env (`os.environ.get`) hoặc `_private/` (đã chặn web 2 lớp: segment `_private` + regex `mcp-keys`). Đã từng lộ: `transcribe_videos.py:163` hardcode `Bearer sk-b920…`.
- 🔑 **Đếm secret ≠ đếm regex match.** Phải `sort -u` + **soi ngữ cảnh từng match**. `fc-` trong dự án này phần lớn là **fragment tên file ảnh** (`C9F89BF6-…-4Afc-…`) hoặc **token URL video** — không phải key. Quét secret phải quét **toàn bộ repo**, không chỉ `docs/` + `knowledge-hub/` (em từng bỏ sót `scripts/`).
- 🔑 **MCP Tool Server chuẩn chạy 100% LOCAL tại `D:\Mcp-Pool-Vps` trên cổng `http://127.0.0.1:3988/mcp`** (Healthcheck: `http://127.0.0.1:3988/health` — 180+ tools: vidIQ, Trends, Firecrawl, Exa, Tavily, Playwright...). **9Router tại `127.0.0.1:20128` là AI Chat Model Gateway** (chuyên điều hướng LLM chat models như Claude/GPT/Gemini), KHÔNG PHẢI là MCP Tool Server. Trước đây MCP Pool từng chạy trên VPS, nay đã được chuyển về chạy Local độc lập tại `D:\Mcp-Pool-Vps`. Cấu hình nằm ở IDE/CLI ngoài dự án.
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
