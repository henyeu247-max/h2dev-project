# BÁO CÁO AUDIT TOÀN DIỆN — UI · LOGIC · DỮ LIỆU · E2E
**Ngày kiểm:** 22/09/2026 · **Phạm vi:** `D:\YTB` (H2DEV-Project + root index) · **Chế độ:** READ-ONLY (chưa sửa gì)

**Điểm tổng hợp**

| Mảng | Điểm | Trạng thái |
|---|---|---|
| UI — `H2DEV-Project/` | 7.5/10 | a11y đã gia cố tốt, còn 1 lỗi chức năng P0 |
| UI — `D:\YTB\index.html` (root) | 4/10 | bản sao cũ, HTML hỏng + số viết cứng |
| Logic (server + JS) | 7/10 | kỷ luật khá, còn 6 bug thực chiến |
| Dữ liệu | 92/100 | 32/32 chỉ tiêu manifest khớp, lệch ở văn bản mô tả |
| E2E Local + VPS | 20/20 endpoint 200–206 | đạt, còn 5 mục lỏng để lên 100% |

---

## 1. LỖI ƯU TIÊN CAO (P0) — CHẮC CHẮN GÂY HỎNG

### P0-1. `player.html` hỏng hàm render markdown (lỗi chức năng thật)
- Vùng `D:\YTB\H2DEV-Project\player.html` dòng ~972–1062: thẻ `<script>` đóng ở dòng 972 nhưng hàm `renderMarkdownDoc()` bị viết **ngoài** script, kèm `</script>` mồ côi dòng 1062.
- Hệ quả: mở tài liệu `.md` (gọi `renderMarkdownDoc(text)` ở dòng 878) → `ReferenceError` → modal báo **"Lỗi tải tài liệu"**.
- Nguyên nhân nghi do thao tác tách script ở giai đoạn "restructure".
- **Sửa:** đưa hàm vào lại trong thẻ `<script>`, xóa `</script>` thừa.

### P0-2. `player.html` thiếu cache-busting đúng case Cloudflare 404 (4h)
- Dòng 460: `pv.src = playbackSource` (stream video) — không `?v=`.
- Dòng 481: link `⬇ Tải MP4/WEBM` — không `?v=`.
- Dòng 606–607: `btnDownloadSrt/Txt.href = 'video/<sku>/transcript.srt|.txt'` — không `?v=`.
- Dòng 395, 603–605, 633: fetch catalog/transcript không `?v=` lẫn `cache:'no-store'`.
- **Sửa:** thêm `?v=YYYYMMDD-vXX` (đúng cảnh báo xương máu AGENTS.md).

### P0-3. Root `D:\YTB\index.html` — bản sao cũ, nhiều lỗi nặng
- Dòng 260: `title="Mở trạm phát nhạc nền **49 tracks**"` — số viết cứng (vi phạm Zero Hardcoded Counts).
- Dòng 1744: `🎧 Mở Trạm Nhạc Nền **(49 Tracks)**` — số viết cứng trong CTA.
- Dòng 222: `</head` **thiếu `>`** → parser HTML hỏng.
- Dòng 224: CDN Phosphor **không pin version**.
- 7 chỗ còn `onclick` inline: 1248, 1249, 1255, 2932, 3622, 3623, 3871 (bản H2DEV đã chuyển hết sang `data-action`).
- Có Escape nhưng **không có `trapFocus`/`focusModal`** → Tab thoát ra ngoài modal.
- **Sửa:** quyết định số phận file (nếu không được serve thì loại bỏ/đánh dấu backup; nếu serve thì port `loadMusicStats()` + sửa `</head>` + port onclick sang data-action + pin CDN).

### P0-4. `music_player_modal.js` fetch URL tương đối → 404 theo route
- Dòng 10: `fetch('data/music_catalog.json...')` (thiếu `/` đầu). Khi trang mở qua route `/lotrinh/` (server.js 338–345) → resolve thành `/lotrinh/data/...` → **404 → alert "Không thể tải kho nhạc nền"**.
- **Sửa:** đổi thành `/data/music_catalog.json`.

### P0-5. Endpoint nguy hiểm nhất server: `/api/intelligence/spider`
- `server.js` 278–294: GET không auth, không timeout, trigger crawl mạng (`spider.executeSpiderGraphTraversal`) → bất kỳ ai trong LAN mở URL là treo request vô thời hạn (DoS đồng thời socket).
- Kết hợp `HOST` mặc định `0.0.0.0` (dòng 15) + `Access-Control-Allow-Origin: *` mọi response → API mở với cả LAN.
- **Sửa:** `AbortSignal.timeout(15000)`, cache theo seed, đổi default `HOST=127.0.0.1`.

### P0-6. Nút tắt modal nhạc ghi "Đóng [Esc]" nhưng Esc không hoạt động
- `music_player_modal.js` dòng 170: label hứa Esc, nhưng **file không có bất kỳ `keydown` handler nào**.
- **Sửa:** thêm `keydown Escape` đóng modal.

---

## 2. UI — NHẬN ĐỊNH CHI TIẾT

### Đạt (bản H2DEV)
- Semantic đủ `aside/header/main/footer`, `role=tablist`, skip-link, focus-ring, `prefers-reduced-motion`, safe-area mobile.
- Trap focus + Escape cho 5 modal (`trapFocus` 588–601, wire 4661–4704); `aria-pressed` động cho filter chips; arrow-key điều hướng tab.
- **Search index 100% có định danh** (sku/id): video 1149–1161 có `v.sku`, ngách 1387, tài liệu 1668, reup 1836, raw 2132 `r.id`, music modal dòng 131–142 `t.id` đứng đầu → **đạt chuẩn Universal Search Index**.
- Đếm động toàn bộ: `loadMusicStats()` 330–346, chips `(N)` tính từ `.filter/.reduce` → **Zero Hardcoded Counts cơ bản đạt**.
- **Không có link nội bộ hỏng, không duplicate ID tĩnh, không `onclick=` trong bản H2DEV.**

### Còn thiếu — P1
1. **`switchRawTab` bị gọi ngoài closure** (H2DEV index ~3645): nút "🎙️ Khai thác Voice DNA / 📺 Xem Top 7-10" qua `data-action="raw-tab"` gọi hàm local bên trong `openRawDeepModal` → **ReferenceError**. Cần `window.switchRawTab`.
2. **Số KPI viết cứng:** index dòng 1418 `'Kênh mẫu sạch: 70 / 70'`, 1419 `'RPM Benchmark: $10.22'` → tính động từ `kenh-mau.json` hoặc ghi rõ fallback có kiểm chứng.
3. **Version cache-busting lệch 3 nhánh cho cùng `viddar.css`:** index `20260922-g2` / learn+player `20260918media1` / root `20260921-quick-access-v1` → cache coordination混乱. Cần 1 version duy nhất.

### Còn thiếu — P2 (a11y & form)
- `statCard` (770) có `role=button tabindex=0` nhưng **không handler Enter/Space**; `market-row`/`niche-row` (864, 883) click được nhưng không role/tabindex → chuột-only.
- `#moreMenuSheet` (734–765): **không Escape, không trap, không trả focus** — lỗ hổng duy nhất còn lại của wave esc-a11y.
- `player.html` 48–58: tab thiếu `aria-controls`/`tabpanel`/arrow-key (index làm đủ — không nhất quán); dòng 19 `href="javascript:void(0)"` → dùng `<button>`.
- `learn.html` 35–40: tab thiếu `role=tab`/`aria-selected`; không có skip-link.
- `#mobile-tabs` render rỗng mọi lần (729–731) → nav "Điều hướng tab" (261) là đồ trang trí chết.
- Badge font `0.6rem ≈ 9.6px` (viddar 467) + chip `text-[9.5px]` → dưới ngưỡng đọc 11–12px; `.stat-sub` bị ẩn trên mobile (948).
- Badge mã định danh: đã có mono nhưng **thiếu format `[SKU]` thống nhất** (videoCard 929, tài liệu 1757, reup 1899, music 39).
- 5 chỗ `onerror` inline (917, 1308, 2263, 2336, 3200) → không CSP-friendly.

---

## 3. LOGIC — NHẬN ĐỊNH CHI TIẾT

### Server (`server.js`, 449 dòng) — 7/10
**Đạt:** path traversal check đúng thứ tự (decode → resolve/relative → blocklist), chặn `.env`/`.db`/19 segment nhạy cảm trước `fs.stat`, Range request thật (206 + Content-Range) cho `<audio>` seek, gzip cache ≤120 entry invalidate theo mtime, FTS sanitize `[^\p{L}\p{N}\s_]` + bound param, PUT admin bị 405.

**Bug cần sửa (ưu tiên giảm dần):**
1. Dòng 278–294: spider endpoint không auth/timeout (đã nêu P0-5).
2. Dòng 444–448: `uncaughtException` chỉ log rồi **tiếp tục chạy** → process sống sai trạng thái dưới NSSM. Sửa: `process.exit(1)` để service restart sạch.
3. Dòng 269, 288, 305: lộ `err.message` **chứa đường dẫn tuyệt đối máy** ra client. Sửa: generic message, log server-side.
4. Dòng 305: `/api/search` trả **HTTP 200 khi lỗi** → monitoring看不到 lỗi thật. Sửa: 500 + body `{results:[]}`.
5. Dòng 110: `full.includes('data')` là substring toàn path → file có chuỗi "data" bất kỳ đều dính `max-age=120` oan. Sửa: check `relative` bắt đầu `data/` | `data-tabs/`.
6. **`.mp3/.mp4/.wav` không có Cache-Control** (108–117 rơi ngoài mọi nhánh) → heuristic caching → chính môi trường sinh cache 4h Cloudflare. Thêm nhánh media `public, max-age=86400`.
7. Dòng 90–94: Range sai format trả **416** thay vì bỏ qua và trả 200 (RFC 9110 §14.2); dòng 78–89 `bytes=-` thành 206 toàn file sai spec.
8. `sendFile` **thiếu `X-Content-Type-Options: nosniff`** (chỉ có ở 404/415 và JSON API) — đã xác minh qua E2E: header tĩnh không có nosniff/HSTS/X-Frame-Options.
9. Dòng 8: import chết `mutateDatabase/query/queryOne` (hàm ghi DB trong scope request handler — rủi ro về sau).
10. `package.json`: `playwright` + `puppeteer` (~1GB) nằm trong `dependencies` → phình deploy VPS; thiếu `"engines": {"node": ">=22"}` dù dùng `node:sqlite` (VPS Node cũ → crash boot).
11. `master_dal.js:17` `computeCounts()` chạy lúc load module → boot chậm oan bằng readdirSync toàn data.

### Frontend JS
**`learn.js`**
- Nguồn dữ liệu duy nhất `/data/modules.json` (`no-store`), lỗi fetch → render khối `.load-err` cụ thể (không nuốt im lặng) ✅, escape 100% qua `C.esc` ✅, search debounce 200ms + normalize dấu + khớp `sku` ✅.
- Bug UX (405–413): `focus/visibilitychange` re-render **toàn bộ panel** → mất vị trí cuộn, cướp focus khi debounce đang chờ. Sửa: chỉ re-render progress/banner khi tab không đổi.
- Null deref tiềm ẩn: `els.progressText/resumeBanner` (84, 88, 100–121) không guard null (khác `titleEl` dòng 80 có check).

**`music_player_modal.js`**
- Số đếm tính động 145–157 ✅, search có `t.id` ✅, mọi field nội dung `esc()` ✅ (ngoại lệ `${t.sizeMB}` dòng 41 nên `esc()` cho nhất quán).
- Bug UX thực chiến: **re-render `innerHTML` toàn modal mỗi phím gõ, không debounce** (225–230) → gõ 1 phím đốt lại 49 card + **giết `<audio>` đang phát**. Sửa: debounce 200ms + chỉ render grid, giữ `src`/`currentTime`.
- **Bộ keyword niche trùng lặp 2 lần** (filter 120–127 vs count 148–156) → maintenance bug chờ xảy ra; label chip `⏳ 15-25p` nhưng điều kiện `>=600s` (≥10 phút) → **label sai thực chất**.
- Không có exclusive playback → 2 audio mở cùng lúc chồng tiếng.
- `?v=20260922-g2` hardcode 2 chỗ (10, 32) → gộp 1 const `CACHE_V`.

**`h2dev-core.js`**
- `hydrateAdmin` merge remote↔local kỹ (102–128) ✅, mọi save try/catch ✅.
- Lệch comment/code (79–96): comment tuyên bố "thử PUT lần đầu, 405 thì tự tắt" nhưng code không bao giờ gửi PUT (cờ `null` + `if !== false return`), `.catch` không bắt 405 (fetch không reject) → maintenance hazard. Sửa comment/cờ.

**`taxonomy.js`** — **phân mảnh taxonomy thật:** 2 bộ vocab không giao nhau: `RAW_NICHE_GROUPS` có key `'Kinh doanh / Tài chính'`, `'Drama / Kể chuyện'`, `'Quân sự / Địa chính trị'` nhưng `NICHE_MAP` (22–96) map đến `'Kinh tế / Tài chính'`, `'Drama / Stories'`, `'Lịch sử / Quân sự'`... → consumer group theo 2 hướng khác nhau. Gộp 1 vocabulary.

### Phân mảnh nguồn dữ liệu (4 tầng)
| Nguồn | Ai đọc | Guard drift |
|---|---|---|
| `data-tabs/*.json` | `counts.js` = chân lý | ✅ sync-counts + validate |
| `catalog.json`/`catalog_full.json`/`videos.json` | validate 35–45, 82–88 | ✅ length + unique SKU + subset |
| `counts-manifest.json` | SSoT numbers | ✅ drift 2 chiều |
| **`modules.json`** | `learn.js:13` | ❌ **không cross-check SKU với videos.json** — thêm/bớt bài quên modules → UI lệch nhưng validate vẫn PASS |
| **`music_catalog.json`** | `music_player_modal.js:10` | ❌ **hoàn toàn ngoài vòng validate-project.js** |
| `h2dev_master.db` → `videos.json` | `master_dal.js:179` | ⚠️ `if (lessons.length === C.videos)` mới ghi, **else im lặng skip** không log → drift không dấu hiệu |

---

## 4. DỮ LIỆU — NHẬN ĐỊNH

### Bảng đối chiếu SSoT vs thực tế (runtime đếm đầy đủ, không lấy mẫu)

| Chỉ tiêu | SSoT | Thực tế | Kết luận |
|---|---|---|---|
| Bài học video | 140 (27 free · 113 pro) | videos.json/catalog/catalog_full/modules = 140 · 27/113 | ✅ KHỚP |
| Media > 0B | 100% | 140/140 file tồn tại, 0 file 0B, tổng 23.507.510.459 B = đúng manifest | ✅ KHỚP |
| Kênh đối thủ | 165 (152 sống · 13 dead) | kenh-mau = 165, dead = 13, `ngay_do` 165/165 | ✅ KHỚP |
| Hồ sơ kênh mẫu | 156 (149 unique) | records = 156, unique channelId = 149, duplicateOf = 7 | ✅ KHỚP |
| Kịch bản Master | 60 | 60, file tồn tại 60/60 | ✅ KHỚP |
| Tài liệu tổng | 157 | 157 | ✅ KHỚP |
| — prompt/report/list/other/internal | 78/20/16/11/5 | 78/20/16/11/5 | ✅ KHỚP |
| — **tool** | **23** (AGENTS/00_README) / **22** (TREE.md) | **27** | ❌ **LỆCH** — và 78+20+23+16+11+5 = **153 ≠ 157** (phân bố SSoT tự mâu thuẫn) |
| Tracks nhạc | 49 (36 SAFE · 9 REVIEW · 4 COPYRIGHTED) | 49 · 36/9/4 | ✅ KHỚP |
| Ngách | 34 (11 xanh) | 34 · xanh = 11 (10 có mẫu, 8 thiếu bằng chứng, 3 thận trọng, 2 có điều kiện) | ✅ KHỚP |
| Thumb / Avatar | đủ | thumb 140/140 >0B (141 file = 140 + placeholder); avatar 152/152 live, 13 dead không avatar | ✅ KHỚP |
| counts-manifest | khớp | chạy lại `computeCounts()` → **32/32 key khớp, 0 diff** | ✅ KHỚP |
| JSON parse | hợp lệ | **1.141/1.141 file sạch, 0 file 0 byte** | ✅ KHỚP |
| streamUrl nhạc | tồn tại | 49/49 `assets/nhac-nen/` >0B + 49/49 `localAbsPath` >0B | ✅ KHỚP |
| Docs ref trong videos | tồn tại | 176 ref local → 0 missing (41 URL外部) | ✅ KHỚP |

### Vấn đề data (ưu tiên giảm dần)
1. **Phân loại `tool` lệch 3 con số** (27 thực tế vs 23 vs 22) + tổng phân bố 153≠157 → sửa `00_README.md` (dòng 45), `TREE.md` (44), `AGENTS.md`.
2. **`media_integrity.json` rỗng hồ sơ**: ghi "140/140 sạch" nhưng `"videos": {}` (0 bản ghi chi tiết) → mất khả năng truy vết "Check N/N". (Kết luận đúng — em verify độc lập 140/140 — nhưng thiếu bằng chứng.)
3. **37 thư mục `docs/VIDEO-*` không có description** (txt 96/136, html 99/136); `TREE.md` dòng 56 ghi "136/136 có description.html" → **sai sự thật**.
4. `TREE.md` dòng 10 stale: "38 TRACKS (265 MB)" trong khi thực tế **49 tracks · 328 MB**.
5. `chien-luoc.json` `nguonDuLieu` stale: "136 bài · 109 tài liệu · 153 hồ sơ (147 unique)" → thực tế 140 · 157 · 156 (149).
6. 4 track lệch `sizeMB` >5%: `MUSIC-018/021/022/038` (45/49 còn lại khớp).
7. **Thuật ngữ `safeForYPP` mâu thuẫn "36 SAFE YPP"**: crosstab `{true|SAFE:36, true|REVIEW:9, false|COPYRIGHTED:4}` → field `safeForYPP=true` ở **45** track; UI dùng field này sẽ render 45 thay 36 → thống nhất thuật ngữ.
8. `tai-lieu-full.json` không có SKU duy nhất: 157 card chỉ 82 unique (NOI-BO ×50, VIDEO-2aa1f7 ×10...); 15 card thiếu `file`, 95 thiếu `link`.
9. `h2dev-raw.json` **double-encoded** (root là string chứa JSON escape) → script expect object sẽ hỏng.
10. `video_insights.json`: `VIDEO-458892` chỉ 17 key (các record khác 19).
11. `outlier-channels-2026.json` chỉ 10 kênh (thư viện outlier) — **không phải** "165 kênh" (nguồn 165 là `kenh-mau.json`) — không quy nhầm khi audit.

---

## 5. E2E HAI ĐẦU — 22/09/2026

### Kết quả: 20/20 endpoint PASS
- `GET /`, `/index.html`, `/learn.html`, `/player.html` → **200 cả 2 đầu**.
- CSS/JS/JSON tĩnh (7 endpoint) → **200 cả 2 đầu**, `cf-cache-status: MISS` (lần đầu fetch là bình thường).
- Media nhạc `MUSIC-001` (21.081.898 B) + `MUSIC-041` (3.000.572 B) → **200 cả 2 đầu, `audio/mpeg`, length khớp tuyệt đối**; bản `?v=20260922-g2` → **HIT** (cache-busting hoạt động).
- Thumb `VIDEO-e91589.jpg` → 200/200, HIT, khớp.
- Video `.mp4` Range `bytes=0-1023` → **206 Partial Content cả 2 đầu**, `Content-Range` total khớp tuyệt đối (xác nhận media đã lên VPS đầy đủ — không dính cảnh báo "git push không đưa media").
- `transcript.txt` → 200/200 khớp.
- `/api/search?q=MUSIC-041` → 200, `total:5` · `/api/admin-state` → 200.

→ **Bằng chứng file media hai đầu đồng bộ 100%, đạt tinh thần bước 5.**

### Còn 5 mục để lên 100%
1. **Lệch content-length HTML/JS/CSS** L vs P (vd `h2dev-core.js` 15.877 vs 14.202) — nhiều khả năng do Cloudflare nén (gzip/br), **không phải lệch nguồn** (media khớp tuyệt đối). Cần xác nhận header `Content-Encoding` để không false-positive.
2. **`/api/admin-state` lệch body**: local 101 B vs production 205 B → state/version 2 đầu khác nhau.
3. **`/api/search?q=MUSIC-041` trả CHANNEL/VIDEO, không trả track `MUSIC-041`** → FTS index của master DB chưa index `music_catalog` (search bài học đã có sku nhưng search nhạc chưa qua API) — test step 5 chưa đạt đúng nghĩa.
4. **Thiếu security header** trên local/origin: không có `X-Content-Type-Options`, `X-Frame-Options`, `HSTS` (đã xác minh qua E2E mục 9).
5. **404 production trả path `/404.html`** thay vì path gốc và **`cf-cache-status: HIT`** → đúng cảnh báo cache 4h; sau deploy cần purge/re-fetch asset đang MISS để xác nhận chuyển HIT.

---

## 6. KẾ HOẠCH SỬA KHUYẾN NGHỊ (theo thứ tự)

**Wave 1 — Chức năng hỏng (P0):**
1. `player.html`: đưa `renderMarkdownDoc` vào `<script>`, xóa `</script>` thừa (1062).
2. `player.html`: thêm `?v=` cho stream video (460), download MP4/WEBM (481), SRT/TXT (606–607), no-store cho fetch catalog/transcript (395, 603–605, 633).
3. `music_player_modal.js`: `/data/music_catalog.json` absolute (10); thêm handler Escape (170); debounce search + giữ audio đang phát (225–230).
4. H2DEV `index.html`: expose `window.switchRawTab` sửa ReferenceError (~3645).
5. Root `D:\YTB\index.html`: sửa `</head>` (222), bỏ 2 số "49 tracks" cứng (260, 1744), port 7 onclick → data-action, pin CDN Phosphor, thêm trapFocus — hoặc dứt khoát loại bản sao này khỏi luồng deploy.

**Wave 2 — Server & an ninh:**
6. `server.js`: spider endpoint timeout + `HOST` mặc định `127.0.0.1`; `uncaughtException` → `process.exit(1)`; ngừng lộ `err.message`; `/api/search` lỗi trả 500; thêm nosniff + nhánh Cache-Control cho media; sửa cache `includes('data')` và Range 416.
7. `package.json`: playwright/puppeteer → devDependencies + `"engines": {"node": ">=22"}`.
8. `master_dal.js:179`: log warn khi skip projection.

**Wave 3 — Đồng bộ & validate:**
9. `validate-project.js`: thêm 2 guard — `modules.json` SKU ⊆ `videos.json`; kiểm `music_catalog.json` (đếm, streamUrl tồn tại, enum `copyrightRisk`).
10. `taxonomy.js`: gộp 2 bộ vocab thành 1.
11. `music_player_modal.js`: gộp keyword niche trùng thành `NICHE_FILTERS`, sửa label `15-25p`, gộp `CACHE_V`.

**Wave 4 — Data & tài liệu:**
12. Sửa phân bố `tool` 27 + tổng 157 ở `00_README/TREE/AGENTS`; sửa TREE dòng 10 (49 tracks/328MB) và dòng 56 (description 99/136).
13. Regenerate `media_integrity.json` với 140 record chi tiết.
14. Bổ sung description cho 37 `docs/VIDEO-*` thiếu (hoặc sửa TREE cho đúng).
15. Sửa `sizeMB` 4 track; thống nhất `safeForYPP` vs `copyrightRisk`; dọn `chien-luoc.json` stale; sửa `h2dev-raw.json` double-encoded.

**Wave 5 — UI polish (P2):**
16. a11y: Enter/Space cho `statCard`, role/tabindex cho hàng market/niche, Escape+trap `#moreMenuSheet`, aria cho tab player/learn, bỏ `javascript:void(0)`, dọn `#mobile-tabs` chết.
17. Thống nhất 1 version cache-busting cho `viddar.css` cả 3 trang; badge mono format `[SKU]` thống nhất; nâng font badge ≥ 11px.
18. E2E: xác nhận `Content-Encoding`, đồng bộ `admin-state`, index `t.id` track vào `/api/search`, purge cache 404 Cloudflare.
