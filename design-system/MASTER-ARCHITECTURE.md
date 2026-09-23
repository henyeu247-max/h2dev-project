# H2DEV — MASTER ARCHITECTURE (Kiến trúc chuẩn toàn dự án)

> **Trạng thái:** `approved` — chuẩn kiến trúc SSoT của dự án H2DEV.
> **Phạm vi:** TOÀN BỘ dự án (FE · BE · Data · Script · Asset · Docs).
> **Căn cứ:** Kiểm kê thực đo ngày 2026-09-23 (24 file JSON · 67 script · 14 file FE JS · 3 trang HTML).
> **Nguyên tắc:** tài liệu này là **hợp đồng kỹ thuật**. Mọi thay đổi kiến trúc phải cập nhật tài liệu này TRƯỚC khi thi công.

---

## 0. ĐỌC TRƯỚC KHI LÀM BẤT CỨ GÌ

1. Đọc `MASTER-ARCHITECTURE.md` (file này) → hiểu tầng nào được sửa gì.
2. Đọc `CONVENTIONS.md` → biết quy ước đặt tên/ngôn ngữ/cấu trúc.
3. Đọc `CHECK-PASS-PROTOCOL.md` → biết quy trình kiểm định bắt buộc.
4. Đọc `SKILL.md` → biết luật thi công UI.
5. Đọc `URL-ROUTING-SPEC.md` → biết chuẩn URL.

> **Cấm** viết code trước khi đọc hết 5 tài liệu trên.

---

## 1. NĂM TẦNG KIẾN TRÚC

Dự án chia thành **5 tầng** với ranh giới rõ ràng. **Cấm xuyên tầng** (ví dụ: tầng Docs không được định nghĩa dữ liệu runtime).

```
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 5 — DOCS          Tài liệu, hợp đồng kỹ thuật               │
│  design-system/ · docs/ · *.md (root)                            │
│  Được: viết/sửa tự do.  KHÔNG: chứa dữ liệu runtime.             │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 4 — ASSET         Media & file tĩnh (KHÔNG version hoá)     │
│  video/ · assets/nhac-nen/ · assets/thumbs/ · assets/avatars/    │
│  Được: thêm/sửa media.  KHÔNG: hard-code số liệu vào UI.         │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 3 — RUNTIME       Trạng thái sống (gitignored)              │
│  data/h2dev_master.db · data/admin-state.json · logs/ · .cache/  │
│  Được: đọc/ghi lúc chạy.  KHÔNG: commit lên git.                 │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 2 — DATA          SSoT dữ liệu (version hoá)                │
│  data/*.json · data-tabs/*.json                                  │
│  Được: sửa qua SCRIPT, có backup + validate.                      │
│  KHÔNG: sửa tay không qua script.                                 │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  TẦNG 1 — SOURCE        Mã nguồn (version hoá, sửa tự do)         │
│  server.js · *.html · assets/app/** · assets/*.css · assets/*.js │
│  css/input.css · scripts/** · sw.js · tailwind.config.js         │
│  Được: sửa thoải mái, có lint + validate.                         │
└──────────────────────────────────────────────────────────────────┘
```

### 1.1. Bảng quy tắc xuyên tầng

| Từ tầng | Được đọc | Được ghi | Cấm |
|---|---|---|---|
| **1 Source** | 2 Data, 3 Runtime, 4 Asset, 5 Docs | 2 Data (qua script), 3 Runtime | Sửa media tay; hard-code số liệu |
| **2 Data** | 4 Asset (tham chiếu path) | — (chỉ script tầng 1 ghi) | Chứa nội dung docs |
| **3 Runtime** | 2 Data | — | Commit lên git |
| **4 Asset** | — | — | Bị source sửa đè |
| **5 Docs** | 1, 2, 3 | — | Định nghĩa dữ liệu runtime |

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN

### 2.1. Cây chuẩn (đích đến)

```
H2DEV-Project/
├── server.js                    # BE entry (CommonJS)
├── index.html · learn.html · player.html
├── package.json · tailwind.config.js · sw.js · manifest.json
├── AGENTS.md · 00_README.md · CHANGELOG.md · TREE.md · CHAY-LAN.md
│
├── design-system/               # TẦNG 5 — hợp đồng kỹ thuật
│   ├── SKILL.md                 # luật thi công UI
│   ├── MASTER-ARCHITECTURE.md   # file này
│   ├── CONVENTIONS.md
│   ├── CHECK-PASS-PROTOCOL.md
│   ├── URL-ROUTING-SPEC.md
│   ├── BUILD-PLAN.md
│   ├── consistency-matrix.md
│   ├── tokens.json · route-manifest.json · uikit-plan.json
│
├── css/                         # TẦNG 1 — SOURCE Tailwind
│   └── input.css
│
├── assets/                      # TẦNG 1 + 4
│   ├── app/                     # JS module FE (TẦNG 1)
│   │   ├── main.js · ui-core.js · taxonomy.js · search-core.js · search.js
│   │   ├── player-main.js · learn-main.js
│   │   ├── tabs/ nav.js · content.js
│   │   ├── modals/ raw-deep.js
│   │   └── sw.js · sw-register.js
│   ├── icons/                   # (mới) 213 SVG Lucide + LICENSE
│   ├── h2dev-tokens.css         # token canonical
│   ├── h2dev-primitives.css     # class component
│   ├── h2dev-shell.css          # khung trang
│   ├── viddar.css · learn.css · player.css · g3-inline.css
│   ├── learn.js · h2dev-core.js · music_player_modal.js
│   ├── tailwind.css             # BUILD OUTPUT (từ css/input.css)
│   └── nhac-nen/ thumbs/ avatars/   # TẦNG 4 — media
│
├── data/                        # TẦNG 2 — SSoT
│   ├── catalog.json · catalog_full.json
│   ├── video_insights.json · music_catalog.json · modules.json
│   ├── counts-manifest.json · media_integrity.json
│   ├── raw-channels-deep/       # dossier kênh (data, không phải docs)
│   └── registry/schemas/        # 19 schema — ĐÃ ARCHIVE
│
├── data-tabs/                   # TẦNG 2 — SSoT cho UI
│   ├── videos.json · kenh-mau.json · tai-lieu-full.json
│   ├── kich-ban.json · nguon-reup.json · ngach-xanh.json
│   ├── chien-luoc.json · raw-kenh-mau.json · dong-bo-ngoai.json
│
├── scripts/                     # TẦNG 1 — chia 6 nhóm theo vai trò
│   ├── ci/         validate-project.js · sync-counts.js
│   │               guard-no-inline-onclick.js · check-ui-classes.js
│   ├── build/      build_master_db.js · ai_video_deep_analyzer.js
│   ├── sync/       sync-ngoai-vao-h2dev.js · sync-missing-avatars.cjs
│   ├── oneshot/    fix_*.py · normalize-*.py · add_market_tags.py
│   ├── audit/      audit_*.py · deep-audit.js · find-404.js
│   ├── pipeline/   transcribe_*.py · h2dev_master_producer.py
│   ├── lib/        counts.js · master_dal.js
│   ├── windows/    *.ps1 · *.cmd · *.vbs
│   └── deploy/     post-receive
│
├── video/                       # TẦNG 4 — 140 folder SKU
├── docs/                        # TẦNG 5
└── _backup/ _archive/ _audit/   # KHÔNG version hoá
```

### 2.2. Phân biệt SOURCE vs GENERATED

| File | Loại | Quy tắc |
|---|---|---|
| `css/input.css` | **SOURCE** | Sửa trực tiếp |
| `assets/tailwind.css` | **GENERATED** | Cấm sửa tay — chạy `npm run build:css` |
| `data/registry/schemas/*.v1.json` | **ARCHIVED** | Đã archive 2026-09-23, không dùng |
| `data/counts-manifest.json` | **GENERATED** | Sinh từ `sync-counts.js` |
| `data/*.json` (khác) | **SSoT** | Sửa qua script |
| `data-tabs/*.json` | **SSoT cho UI** | Sửa qua script |
| `data/h2dev_master.db` | **RUNTIME** | Sinh từ `build_master_db.js` |

---

## 3. LUỒNG DỮ LIỆU TOÀN DỰ ÁN

### 3.1. Sơ đồ tổng

```
Nguồn thô                    Xử lý                       Data SSoT              UI
─────────                    ─────                       ─────────              ──
MCP Pool 186 tools ──┐
                     ├──> free_yt_engine.py ──┐
h2dev.vn crawl ──────┘                         │
                                               ▼
video/ (140 SKU) ──> transcribe_*.py ──> transcript.json
                          │
                          ▼
                    ai_video_deep_analyzer.js ──┬──> data/video_insights.json
                                                ├──> data/catalog.json
                                                ├──> data/catalog_full.json
                                                └──> data-tabs/videos.json
                                                          │
                    music_catalog.json ───────────────────┤
                    kenh-mau.json ────────────────────────┤
                    tai-lieu-full.json ───────────────────┤
                    ngach-xanh.json ──────────────────────┤
                    raw-kenh-mau.json ────────────────────┤
                                                          ▼
                                              build_master_db.js
                                                          │
                                                          ▼
                                              data/h2dev_master.db (SQLite+FTS5)
                                                          │
                                              master_dal.js (DAL)
                                                          │
                                                          ▼
                                              server.js (/api/search, 5 endpoint)
                                                          │
                                                          ▼
                            index.html · learn.html · player.html
                                    (main.js · content.js · player-main.js)
```

### 3.2. QUY TẮC SINGLE-WRITER (bắt buộc)

> **Nguyên tắc:** mỗi file data chỉ có **1 script chính (single-writer)** được ghi. Các script khác chỉ ĐỌC.

**Hiện trạng vi phạm (ghi nhận để sửa dần):**

| File data | Số writer hiện tại | Mức | Writer chính đề xuất |
|---|---|---|---|
| `data-tabs/videos.json` | **6** 🔴 | CAO | `ai_video_deep_analyzer.js` |
| `data/catalog.json` | **5** 🔴 | CAO | `sync_insights_to_catalog.py` |
| `data/catalog_full.json` | **5** 🔴 | CAO | `sync_insights_to_catalog.py` |
| `data-tabs/raw-kenh-mau.json` | **4** 🟠 | TB | `update-raw-records.py` |
| `data-tabs/tai-lieu-full.json` | 3 | TB | `sync-ngoai-vao-h2dev.js` |
| `data/video_insights.json` | 2 | TB | `ai_video_deep_analyzer.js` |
| Các file còn lại | 1 | OK | (giữ nguyên) |
| `kich-ban.json`, `video_acceptance.json`, `outlier-channels-2026.json`, `phan-he-status.json`, `media-review-queue.json`, `h2dev-current-root.json`, `h2dev-raw.json`, `all_129_*.json`, `raw-channels-audit-report.json` | 0 | OK (thủ công) | — |

### 3.3. Mô hình ghi "read-modify-write" — CẢNH BÁO

Tất cả writer hiện dùng mô hình **đọc toàn bộ JSON → sửa vài field → ghi toàn bộ file**.

**Hệ quả:** nếu 1 writer còn dùng tên field CŨ sau khi đổi tên, nó sẽ ghi `null`/`undefined` **đè lên** dữ liệu mới → **mất dữ liệu âm thầm, không báo lỗi**.

**Quy tắc bắt buộc khi đổi tên field:**
1. Sửa **đồng thời** TẤT CẢ writer (atomic), không sửa từng bước.
2. Dừng `H2DEV_Service` trong lúc migrate.
3. Backup `data/` + `data-tabs/` + `master.db`.
4. Validate chéo sau khi migrate.

---

## 4. BẢNG SSoT vs DERIVED

| File | Vai trò | Sinh từ | Ai đọc |
|---|---|---|---|
| `data/catalog.json` | **SSoT media layer** | `ai_video_deep_analyzer.js` | `content.js:51` |
| `data/catalog_full.json` | Derived (player projection) | `sync_insights_to_catalog.py` | `player-main.js:266` |
| `data-tabs/videos.json` | **SSoT UI layer** | `master_dal.js` + analyzer | 6 site trong `content.js` |
| `data/video_insights.json` | **SSoT insight layer** | `ai_video_deep_analyzer.js` | `content.js:419`, `player-main.js:397` |
| `data/modules.json` | SSoT (thủ công) | ⚠️ không còn script build | `main.js:64`, `learn.js:13` |
| `data/music_catalog.json` | SSoT | thủ công + audit Gemini | `music_player_modal.js:10` |
| `data-tabs/ngach-xanh.json` | **SSoT** | `sync-ngoai-vao-h2dev.js` | `content.js:52`, `server.js:439` |
| `data-tabs/raw-kenh-mau.json` | **SSoT canonical raw** | `update-raw-records.py` | `content.js:1392` |
| `data/counts-manifest.json` | **Derived** | `sync-counts.js` | build-time |
| `data/media_integrity.json` | Derived | `mark_media_integrity.py` | `server.js` |
| `h2dev_master.db` | Runtime (build từ 4 nguồn) | `build_master_db.js` | `master_dal.js` |

> **Tam giác vàng:** `catalog.json` + `catalog_full.json` + `videos.json` là **3 sibling projection cùng cấp** (KHÔNG có cha-con). Ràng buộc nhất quán chỉ được ép bởi `validate-project.js:86-87`. Đây là **rủi ro kiến trúc số 1** của dự án.

---

## 5. ENTRY POINTS & PHỤ THUỘC

### 5.1. Backend — `server.js` (CommonJS)
- HTTP server port `8899` (local) / Nginx proxy (VPS)
- 5 API: `/api/search`, `/api/admin-state`, `/api/niche-radar`, `/api/stats`, `/api/health`
- Whitelist 13 slug route + 4 alias 301
- Đọc `data/h2dev_master.db` qua `master_dal.js`

### 5.2. Frontend — 3 trang

> **Đo lại 2026-09-23 (Phase 3):** bảng dưới là **thực tế runtime**, không phải thiết kế mong muốn.
> Điểm lệch đã xác nhận: **`h2dev-core.js` CHỈ được load ở `learn.html`** — `index.html` và
> `player.html` KHÔNG load, nên `window.H2Core` không tồn tại ở 2 trang đó (xem nợ #11).

| Trang | CSS (thứ tự load) | JS (thứ tự load) |
|---|---|---|
| `index.html` | tailwind → viddar → g3-inline → h2dev-tokens → h2dev-primitives → h2dev-icons → h2dev-shell | taxonomy → ui-core → search-core → tabs/nav → tabs/content → modals/raw-deep → search → main → music_player_modal → sw-register |
| `learn.html` | viddar → learn → h2dev-tokens → h2dev-primitives → h2dev-icons → h2dev-shell | learn-main → h2dev-core → learn |
| `player.html` | tailwind → viddar → player → h2dev-tokens → h2dev-primitives → h2dev-icons → h2dev-shell | player-main |

**Quy tắc load order:** `h2dev-tokens.css` PHẢI load sau các CSS page (để override), TRƯỚC
`h2dev-primitives.css` → `h2dev-icons.css` → `h2dev-shell.css`.

**Cache-busting:** mọi `<link>` và `<script>` phải gắn `?v=YYYYMMDD-<phase>`; hiện tại `?v=20260923-p3a`.
Khi sửa CSS/JS **BẮT BUỘC** bump version — nếu không, Cloudflare cache 4h sẽ giữ bản cũ.

### 5.3. Sơ đồ phụ thuộc JS

```
h2dev-core.js  ──> (window.H2Core: esc, pad2, normalize, ico, stripDecorEmoji,
                    durToSecs, fmtTotalDur, fmtBytes, storage, videoProgress, render*)
                   ⚠️ CHỈ load ở learn.html
ui-core.js     ──> (H2UICore: safeArray, nicheKeyFor, statCard, pageBanner...)
taxonomy.js    ──> (window.H2Taxonomy)
search-core.js ──> (window.H2SearchCore)
main.js        ──> H2Taxonomy, H2UICore, H2SearchCore, ICONS + deps{ico, stripDecorEmoji}
tabs/content.js ──> deps từ main.js (gồm ico, stripDecorEmoji) — KHÔNG tự dùng window.H2Core
tabs/nav.js    ──> ICONS
player-main.js ──> độc lập; tự định nghĩa ico()/stripLeadEmoji()/stripDecorEmoji()
learn.js       ──> H2Core (độc lập, ES5)
```

---

## 6. MA TRẬN TAB ↔ DATA

| Tab (route) | Hàm render | File JSON đọc | Số item |
|---|---|---|---|
| Tất cả (`/tatca`) | `renderTongQuan` | videos, kenh-mau, tai-lieu-full, catalog, ngach-xanh, modules (**6 file**) | 4 stat + 6 market + 6 niche |
| Video (`/video`) | `renderVideo` | videos, ngach-xanh, video_insights | 140 |
| Ngách xanh (`/ngachxanh`) | `renderNgachXanh` | ngach-xanh, videos, /api/niche-radar | ~34 |
| Tài liệu (`/tai-lieu`) | `renderKichBan` | tai-lieu-full, videos, modules | 157 |
| Nhạc nền (`/nhac`) | ⚠️ **dùng lại `renderKichBan`** | tai-lieu-full, music_catalog | 157 + badge 49 |
| Nguồn reup (`/nguonreup`) | `renderNguonReup` | nguon-reup, videos | 27 |
| Kênh mẫu (`/kenh-mau`) | `renderKenh` | kenh-mau | 152 |
| Raw kênh (`/rawkenh`) | `renderRawKenh` | raw-kenh-mau | 156 |
| Chiến lược (`/chienluoc`) | `renderChienLuoc` | chien-luoc + 5 file (**6 file**) | 4 stat |
| Lộ trình (`/lotrinh`) | iframe `/learn.html` | modules | 12 module / 140 item |

> **Nợ kiến trúc ghi nhận:** tab `/nhac` không có hàm render riêng, dùng lại `renderKichBan()` → 2 route render y hệt nội dung. Cần tách hàm riêng ở Phase 4.

---

## 7. CHUẨN HOÁ NAMING (lộ trình 3 giai đoạn)

### 7.1. Hiện trạng đo được

| Hạng mục | Số đo |
|---|---|
| Tên trường JSON unique | **675** |
| — camelCase | 255 ✅ |
| — snake_case | **102** ⚠️ |
| — SCREAMING_SNAKE (key) | 6 🔴 |
| — key động (SKU, emoji) | 163 🔴 |
| Trường snake **được code đọc** | **37** (tâm chấn) |
| Trường snake **zero-reference** | **71** (an toàn) |
| File `scripts/` kebab vs snake | **34 vs 32** ⚠️ |
| Comment tiếng Việt có dấu vs không | 253 vs 530 ⚠️ |

### 7.2. Ba vùng cấm (bất khả xâm phạm)

| Vùng cấm | File | Lý do |
|---|---|---|
| 144 key SKU `VIDEO-*`/`ZOOM-*` | `video_insights.json` | Key động = SKU lookup |
| 7 constant `UU_TIEN_SAN_XUAT`… | `ngach-xanh.json` | Vừa key vừa value (`content.js:650-828`) |
| Cột SQLite | `build_master_db.js` (DDL) | Phá DB 2.4MB đang sống |

### 7.3. Lộ trình 3 giai đoạn

| Giai đoạn | Phạm vi | Rủi ro | Trạng thái |
|---|---|---|---|
| **GĐ 1** | 71 trường zero-ref + 9 file 0-writer + đồng bộ music_catalog | 🟢 Thấp | ⏳ Chờ thi công |
| **GĐ 2** | 37 trường tâm chấn (atomic: JSON + 22 file code + DB) | 🟠 TB | ⏳ |
| **GĐ 3** | catalog/videos/raw-kenh-mau (5-6 writer) | 🔴 CAO | ⏳ |

> **Chốt:** chỉ chuẩn hoá **kiểu dấu** (`size_mb` → `sizeMb`), **GIỮ** ~40 trường camelCase tiếng Việt (`lyDo`, `ngachXanh`, `mauSach`).

---

## 8. NỢ KỸ THUẬT ĐÃ GHI NHẬN

| # | Nợ | Số đo | Ưu tiên |
|---|---|---|---|
| 1 | Multi-writer 3 catalog | 5-6 writer/file | 🔴 CAO |
| 2 | 19 schema "chuẩn chết" | 0% khớp data | 🟠 TB (đã archive) |
| 3 | 4 hàm UI khổng lồ | 290/266/246/220 dòng | 🟠 TB |
| 4 | 20 `window.X =` global | 12 biến state ngầm | 🟠 TB |
| 5 | 61 `innerHTML =` | XSS surface | 🟠 TB |
| 6 | 4 `alert()` blocking | UX | 🟢 Thấp |
| 7 | 154 `var` (2 file legacy) | learn.js 100, h2dev-core 38 | 🟢 Thấp |
| 8 | Tab `/nhac` dùng lại `renderKichBan` | 2 route 1 nội dung | 🟠 TB |
| 9 | Artifact stale `all_129_*.json` | 129 ≠ 140 | 🟢 Thấp |
| 10 | `learn.js` + `h2dev-core.js` ES5 | 0 backtick, 100% `function` | 🟢 Thấp |
| 11 | ~~**`h2dev-core.js` chỉ load ở `learn.html`**~~ → **ĐÃ SỬA (N11)** | `index.html` + `player.html` nay nạp `h2dev-core.js` TRƯỚC mọi module; `H2UICore`/`player-main.js` uỷ quyền cho `window.H2Core` (giữ fallback) | ✅ Đã xử lý |
| 12 | `h2dev-icons.css` phải load sau primitives | 3/3 trang đã đúng | ✅ Đã xử lý |
| 13 | **`.row-*` + `.watched-badge` chỉ có CSS trong `learn.css`** | `renderLessonRow()` trong `h2dev-core.js` sinh 9 class `.row-*` mà CHỈ `learn.css` định nghĩa. Hiện **0 caller** ở `index.html`/`player.html` (đo được **0 phần tử** `.lesson-row`) → chưa phải lỗi. Là **bẫy tương lai**: trang nào gọi mà không nạp `learn.css` sẽ vỡ layout, KHÔNG có lỗi JS. | 🟡 TB (đã ghi cảnh báo) |
| 14 | **`h2-icon--` token giả trong `check-ui-classes.js`** | Bộ tách class cắt ngang `${size}` sinh token `h2-icon--`, không tồn tại trong CSS → cổng `validate-project.js` đỏ vĩnh viễn (chặn push). **ĐÃ SỬA:** thêm `isDynamicSuffixToken()` — chỉ bỏ qua token kết thúc `--` KHI có họ class thật tiền tố đó trong CSS nạp. | ✅ Đã xử lý |
| 15 | **`proxy_cache cache_one` toàn cục giữ entry JS/CSS cũ** | `/www/server/nginx/conf/proxy.conf` (include ở block `http`) bật `proxy_cache` cho MỌI vhost ⇒ entry `.js` cũ (`max-age=86400`) sống 1 ngày (`inactive=1d`) và **Cloudflare purge KHÔNG đụng tới**. Triệu chứng: HTML mới + JS cũ. **ĐÃ KHOÁ:** thêm `proxy_cache off;` vào **6/6 location** của `extension/h2dev-learn.tonymmo.com/proxy.conf`; đo lại **12/12 PASS** cả 2 nhánh `Accept-Encoding`. Tài liệu: `design-system/DEPLOY-CACHE.md`. | ✅ Đã xử lý |
| 16 | **`browser_cache_ttl = 14400` trên Cloudflare** (zone `tonymmo.com`) | Cloudflare ép `max-age=14400` lên `.js/.css` bất chấp origin trả `no-cache` (đo 1:1 cùng ETag). **ĐÃ SỬA:** set `browser_cache_ttl = 0` (Respect Existing Headers) qua API + purge zone. | ✅ Đã xử lý |

---

## 9. LỊCH SỬ THAY ĐỔI

| Ngày | Thay đổi | Người |
|---|---|---|
| 2026-09-23 | Khởi tạo từ kiểm kê thực đo (24 JSON · 67 script · 14 FE JS). Định nghĩa 5 tầng, quy tắc single-writer, lộ trình naming 3 giai đoạn. | Em (Kiến trúc sư hệ thống) |
| 2026-09-23 | **N11 đóng:** nạp `h2dev-core.js` ở cả 3 trang; bỏ bản sao helper; `fmtBytes` chốt **decimal** làm chuẩn (đo 140/140 giá trị khớp, 0 lệch). Thêm nợ #13 (bẫy `.row-*`/`learn.css`) + #14 (token giả `h2-icon--` đã sửa). | Em (Kiến trúc sư hệ thống) |
| 2026-09-23 | **Đóng nợ #15 + #16 (sự cố cache 3 tầng):** truy vết bằng 6 giả thuyết test cô lập (bác bỏ 5). Gốc thật = `proxy_cache` toàn cục giữ entry cũ + Cloudflare `browser_cache_ttl=14400`. Đã khoá `proxy_cache off` 6/6 location, set `browser_cache_ttl=0`, purge zone. Đo lại **12/12 PASS** (cả nhánh có/không `Accept-Encoding`), ETag→304. Viết `design-system/DEPLOY-CACHE.md` làm SSoT cache. | Em (Kiến trúc sư hệ thống) |
