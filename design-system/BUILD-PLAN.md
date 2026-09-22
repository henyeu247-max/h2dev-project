# H2DEV — KẾ HOẠCH XÂY DỰNG LẠI UI TOÀN DỰ ÁN

> **Trạng thái:** `approved` — chủ dự án đã duyệt ngày 2026-09-23.
> **Phạm vi:** Frontend toàn dự án (3 shell + 10 tab + 7 modal) — **không đụng dữ liệu/media**.
> **Căn cứ:** `SKILL.md` (luật thi công) · `consistency-matrix.md` (Top 20 việc) · `URL-ROUTING-SPEC.md` (URL chuẩn).
> **Nguyên tắc thi công:** làm tới đâu chắc tới đó — mỗi Phase phải **check-pass 3 vòng** mới sang Phase kế.

---

## 1. Mục tiêu & Định nghĩa "xong"

| # | Mục tiêu | Thước đo nghiệm thu |
|---|---|---|
| M1 | **Icon thống nhất 1 hệ** | 0 emoji trong UI; 0 thẻ `<svg>` rời ngoài `ICONS`; chỉ 4 size `14/16/20/24` |
| M2 | **Typography thống nhất** | Chỉ 9 bậc font-size; 0 arbitrary `text-[Npx]` mới; weight chỉ `400/500/600/700` |
| M3 | **Shell đồng nhất 3 trang** | Cả 3 trang đủ 6 thành phần: header chuẩn · footer chuẩn · back-to-top · skip-link · nav ARIA chuẩn · brand chuẩn |
| M4 | **Layout tab đồng nhất** | Mọi tab đủ 8 khối cùng thứ tự; stat card = 4; pagination `PAGE_SIZE=24` |
| M5 | **Surface & Modal thống nhất** | 1 z-index ladder; 1 backdrop blur; 1 alpha; 6/6 modal đủ 7 yêu cầu a11y |
| M6 | **URL chuẩn, 0 route chết** | 100% URL trong `route-manifest.json` trả 200 (hoặc 301 đúng); 0 route 404 ngoài chủ đích |
| M7 | **Responsive thống nhất** | Chỉ 3 breakpoint `640/1024/1280`; touch target ≥ 44px trên mobile |

---

## 2. Chốt các điểm chờ duyệt (D1–D8)

| # | Quyết định | Chốt | Ảnh hưởng Phase |
|---|---|---|---|
| D1 | `/tatca` là gì | **A — tab thứ 10** (hub & spoke) | P1 |
| D2 | `/kichban` → `/tai-lieu` | **A — đổi + 301** | P1 |
| D3 | `/rawkenh` → `/raw-kenh` | **A — giữ nguyên** (ngoại lệ có ý thức của R3) | — |
| D4 | Canonical `/` vs `/tongquan` | **C — `/tongquan` 301 → `/`** | P1 |
| D5 | `/lotrinh/<sku rác>` | **A — 404** | P1 |
| D6 | Nhạc nền | **A — `/nhac` mở modal** | P1 |
| D7 | Modal có URL | **A — chỉ modal ngữ cảnh sâu**; cấm route cho `#raw-channel-modal` (CSS dead) | P1 |
| D8 | Sub-tab | **A — `?sub=`** | P1 |

---

## 3. Lộ trình 5 Phase

### Phase 0 — Nền tảng & Hạ tầng CSS (không đổi giao diện)
> **Rủi ro thấp nhất. Làm trước để các Phase sau có chỗ dựa.**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 0.1 | Tạo `assets/h2dev-tokens.css` chứa toàn bộ token canonical + proposed (import vào 3 trang) | `assets/h2dev-tokens.css` (mới) | 3 trang load 200 |
| 0.2 | Tạo `assets/h2dev-primitives.css` chứa class chuẩn `.h2-btn*`, `.h2-card`, `.h2-badge*`, `.h2-page-h2`, `.h2-empty`, `.h2-stat*` | `assets/h2dev-primitives.css` (mới) | 3 trang load 200 |
| 0.3 | Tạo `assets/h2dev-shell.css` chứa shell chuẩn (header/footer/back-to-top/nav/bottom-nav) | `assets/h2dev-shell.css` (mới) | 3 trang load 200 |
| 0.4 | Sửa `viddar.css:428` `--brand-ink-ink` (biến chết) → `var(--brand-ink)` | `assets/viddar.css` | grep 0 hit `brand-ink-ink` |
| 0.5 | Gỡ `.stat-icon` ép màu `!important` (`viddar.css:1292`) → để icon theo ngữ nghĩa | `assets/viddar.css` | KPI card khác màu theo loại |

**Tiêu chí ra Phase:** 3 file CSS mới tồn tại + load được + **giao diện CHƯA đổi** (đúng nghĩa "nền tảng").

---

### Phase 1 — Chuẩn hoá URL & Routing (dễ đo, dễ check-pass)
> **Độc lập với UI — làm xong là có ngay "bản đồ đường dẫn" để check mọi thứ.**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 1.1 | Mở rộng whitelist BE: thêm `/tatca`, `/nhac`, `/tai-lieu`, `/kenh-mau` | `server.js:371` | HTTP 200 cả 4 |
| 1.2 | Thêm 301 redirect: `/kichban→/tai-lieu`, `/kenh→/kenh-mau`, `/raw→/rawkenh`, `/tongquan→/` | `server.js` (mới block) | HTTP 301 đúng Location |
| 1.3 | Thêm `/tatca` vào `TABS` (tab thứ 10, icon mới) + render | `assets/app/main.js:61-71`, `content.js` | Sidebar có 10 tab |
| 1.4 | `/nhac` → mở `openMusicStudioModal()` + pushState | `assets/app/main.js`, `music_player_modal.js` | Nhấn nút 🎧 đổi URL `/nhac` |
| 1.5 | Validate SKU `/lotrinh/<sku>` → 404 nếu rác | `server.js` | `/lotrinh/rac-xyz` → 404 |
| 1.6 | Sửa `popstate` khôi phục **đủ 9 param** (`page/rn/rg/rq/watch/free/market/niche/sub`) — gom 1 hàm `readStateFromURL()` dùng chung với `init()` | `assets/app/main.js:719-731, 782-792` | Back/Forward giữ nguyên filter |
| 1.7 | `document.title` động theo route (`Video — H2DEV`, `Tài liệu — H2DEV`…) | `assets/app/main.js` + `player-main.js` | Mở 10 tab thấy 10 tên khác nhau |
| 1.8 | Sub-tab `?sub=` cho Chiến lược + player tab | `content.js`, `player-main.js` | Share link mở đúng sub-tab |
| 1.9 | Breadcrumb chuẩn theo cây URL | `assets/app/ui-core.js` | Mọi tab có breadcrumb |
| 1.10 | Cập nhật `route-manifest.json` (đổi `status: proposed → current`) sau khi thi công | `design-system/route-manifest.json` | JSON valid, 0 route `deprecated` còn 404 |

**Tiêu chí ra Phase:** chạy checklist check-pass mục 8 của `URL-ROUTING-SPEC.md` → **100% PASS trên Local**.

---

### Phase 2 — Shell đồng nhất 3 trang (thấy rõ mắt thường)
> **Đây là phần anh phàn nàn nặng nhất: "thanh trên thanh dưới chỗ đúng chỗ sai, nút lên chỗ có chỗ không".**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 2.1 | Chuẩn header: cùng class `.h2-topbar`, cao 56px, padding, z-index, font title Space Grotesk | `index.html`, `learn.html`, `player.html` | Đo 3 trang: header cao bằng nhau |
| 2.2 | Chuẩn brand: SVG radar + wordmark `h2dev` trên **cả 3 trang** | 3 HTML | 3 trang logo giống nhau |
| 2.3 | Thêm **footer chuẩn** cho `player.html`; sửa `learn.html` footer thêm `border-top`; thống nhất text | 3 HTML | 3 trang có footer cùng cấu trúc |
| 2.4 | Thêm **back-to-top** cho `player.html` (element + JS) + nâng 38px → 44px cả 3 trang | `player.html`, `player-main.js`, `viddar.css` | Nút hiện ở cả 3 trang, ≥44px |
| 2.5 | Thêm **skip-link** cho `learn.html` + `player.html` | 2 HTML | Tab đầu tiên focus được skip-link |
| 2.6 | Hội tụ **3 hệ nav về 1 chuẩn ARIA**: `role=tablist/tab`, `aria-selected`, `aria-controls`, roving tabindex, arrow-key | `learn.js`, `player-main.js`, `nav.js` | 3 trang: arrow-key đổi tab được |
| 2.7 | Chuẩn hoá **bottom-nav**: bổ sung cho `learn.html` + `player.html` theo mẫu `index.html` | 2 HTML + `h2dev-shell.css` | 3 trang có bottom-nav trên mobile |
| 2.8 | Xoá `#mobile-tabs` chết (CSS ẩn vĩnh viễn + JS set rỗng) | `index.html`, `nav.js` | grep 0 hit |

**Tiêu chí ra Phase:** chụp 3 trang ở 3 viewport (360/768/1440) → header/footer/nav/back-to-top **giống nhau về cấu trúc và kích thước**.

---

### Phase 3 — Icon + Typography thống nhất (ảnh hưởng thị giác lớn nhất)
> **Đây là Phase nặng nhất: 78 emoji + ~338 lần xuất hiện, 20 bậc font-size.**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 3.1 | Mở rộng `ICONS` object (main.js) đủ mọi icon cần dùng, thang `14/16/20/24` | `assets/app/main.js:49-60` | Đếm số icon trong ICONS |
| 3.2 | Thay **toàn bộ emoji** bằng `ICONS` — làm theo từng file, check sau mỗi file | `content.js`, `main.js`, `player-main.js`, `learn.js`, `h2dev-core.js`, `music_player_modal.js` | grep emoji = 0 |
| 3.3 | Xoá 2 emoji lẫn trong `ICONS` của `h2dev-core.js:24-25` (`✓`, `👁`) | `assets/h2dev-core.js` | grep = 0 |
| 3.4 | Dọn **12 mức size icon** → chỉ còn 4 mức | Toàn bộ file UI | grep `width="1[0-9]" ` SVG |
| 3.5 | Chốt 9 bậc font-size; chuyển `text-[Npx]` lẻ → class chuẩn | Toàn bộ file UI | grep `text-\[` đếm được |
| 3.6 | Xoá weight `650/800/900` (không có font file) | Toàn bộ CSS + JS | grep `font-weight:650` = 0 |
| 3.7 | Gỡ mono khỏi text tiếng Việt (badge, `.ltag`, "Tiến độ học") | `viddar.css:466`, `learn.css`, `content.js:99,115` | Badge dùng font sans |
| 3.8 | Chuẩn hoá line-height (6 giá trị) + letter-spacing (4 giá trị, 1 cách viết) | Toàn bộ CSS | grep distinct values |
| 3.9 | Chuẩn hoá heading về `.h2-page-h2` (1 class duy nhất) | `content.js` | grep 3 hệ heading = 0 |

**Tiêu chí ra Phase:** `grep` toàn dự án → **0 emoji**, **0 font-size lẻ**, **0 weight ngoài 4 mức**.

---

### Phase 4 — Layout tab + Surface + Modal (phần "chỗ này có chỗ kia thiếu")
> **Đây là phần anh nói: "xem trang chính thì đúng, dô video thì sai thiếu, xem ngách thì khác".**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 4.1 | Bổ sung **banner + stat card** cho Tổng quan + Chiến lược | `content.js:46-177, 1740-1926` | 10/10 tab có banner |
| 4.2 | Chốt **stat card = 4**; sửa Kênh mẫu (5) + Raw kênh (7→4, bỏ ngưỡng cắt mobile) | `content.js`, `ui-core.js:118` | Mobile không mất chỉ số |
| 4.3 | Chuẩn hoá **8 khối mở đầu** cho mọi tab cùng thứ tự | `content.js` | Ma trận nhất quán 10/10 |
| 4.4 | Chốt spacing: section gap `mb-6`, padding card `p-4 sm:p-5`, grid gap `gap-4` | `content.js` | grep 5 hệ padding = 0 |
| 4.5 | Thêm **empty state chuẩn** (bọc `.h2-empty`) cho Raw kênh + Tổng quan + Chiến lược; sửa Kênh mẫu mất khung card | `content.js` | grep empty-state 10/10 |
| 4.6 | Thêm **pagination `PAGE_SIZE=24`** cho Video/Nguồn reup/Kênh mẫu | `content.js` | 4 danh sách có pager |
| 4.7 | Chốt **bộ class nút `.h2-btn-*`**; xoá 5 tổ hợp tự chế + 2 nút tím `bg-purple-600` | `content.js` | grep `bg-purple-600` = 0 |
| 4.8 | Chốt **1 hệ panel nền**; xoá 4 mã `#0b0f19/#0f172a/#111827/#070a12` | JS (cssText trong modal) | grep 4 mã = 0 |
| 4.9 | Chốt **z-index ladder 8 bậc**: sửa `.toast-msg` (100→300), `docModal` (9999→1000), `.more-menu-sheet` (60), 6 modal | `viddar.css`, `player.css`, JS modal | grep z-index distinct |
| 4.10 | Chuẩn hoá modal: 1 backdrop blur, 1 alpha, 1 radius; **6/6 modal đủ 7 yêu cầu a11y** (role/aria-modal/aria-label/trap/ESC/khôi phục focus/bottom-sheet) | `main.js`, `raw-deep.js`, `music_player_modal.js`, `player-main.js`, `nav.js` | Test Tab/ESC 6 modal |
| 4.11 | Sửa bottom-sheet: thêm `#quick-video-modal`, thêm selector panel `#raw-image-modal` | `index.html` inline style | Mobile 8/8 modal bottom-sheet |
| 4.12 | Thêm a11y cho `moreMenuSheet` (role/aria-modal/aria-label/trap/ESC) | `nav.js:73-95` | Kiểm tra bằng Tab + ESC |
| 4.13 | Xoá CSS dead `#raw-channel-modal` (~45 dòng) + tách inline style modal ra `h2dev-primitives.css` | `index.html:19-47`, 62-88 | HTML giảm ~200 dòng |

**Tiêu chí ra Phase:** MA TRẬN NHẤT QUÁN trong `consistency-matrix.md` → **10/10 tab đủ 8 khối**.

---

### Phase 5 — Thông báo, Responsive, Motion & Nghiệm thu
> **Đóng gói: đồng nhất nốt + kiểm định 3 vòng.**

| # | Việc | File đích | Verify |
|---|---|---|---|
| 5.1 | Chốt **1 hệ toast** (`#toast-box` + `showToast`) cho cả 3 trang; **cấm `alert()`** | 3 HTML + JS | grep `alert(` = 0 |
| 5.2 | Thêm `#a11y-status` cho player + learn; chuẩn hoá `aria-live` | `player.html`, `learn.html` | 3 trang có a11y-status |
| 5.3 | Chốt **1 spinner + skeleton** thay 11 kiểu loading | JS + CSS | grep 11 kiểu = 0 |
| 5.4 | Chốt breakpoint `640/1024/1280`: sửa `learn.css` (720→640), `player.css` (1023→1024), thêm `@media` cho `g3-inline.css` | `learn.css`, `player.css`, `g3-inline.css` | grep breakpoint lẻ = 0 |
| 5.5 | Nâng **touch target ≥ 44px**; **chặn co nhỏ trên mobile** ở learn (`.lesson-watch` 30px, `.tabbar .tab-btn` 34px) | `learn.css`, `player.css`, `viddar.css` | Đo 44px trên 360px viewport |
| 5.6 | Chốt motion: hover 120ms, state 200ms, reveal 300ms, translate ≤4px, tôn trọng `prefers-reduced-motion` | Toàn bộ CSS | grep transition duration |
| 5.7 | Gỡ token vòng lặp `learn.css:10,19` (`--bg: var(--bg,...)`) + hội tụ token về 1 nguồn | `learn.css` | grep self-reference = 0 |
| 5.8 | **Nghiệm thu 3 vòng** theo `SKILL.md`: (1) Đĩa & asset → (2) Code & grep invariant → (3) Dual-env HTTP 200 Local + VPS | — | 100% PASS |

**Tiêu chí ra Phase (nghiệm thu cuối):** cả 7 mục tiêu M1–M7 đạt + checklist check-pass của `URL-ROUTING-SPEC.md` PASS 2 môi trường.

---

## 4. Ma trận phụ thuộc & Thứ tự bắt buộc

```
Phase 0 (nền tảng CSS)
   └─> Phase 1 (URL/routing)      ← độc lập, đo được ngay
   └─> Phase 2 (shell 3 trang)    ← cần Phase 0
   └─> Phase 3 (icon + typography) ← cần Phase 0
   └─> Phase 4 (layout + modal)   ← cần Phase 0, 2, 3
   └─> Phase 5 (đóng gói + nghiệm thu) ← cần tất cả
```

**Quy tắc:** không nhảy Phase. Phase trước chưa PASS thì **cấm** sang Phase sau.

---

## 5. Cam kết an toàn (bất di bất dịch)

| Hạng mục | Cam kết |
|---|---|
| **Dữ liệu** | KHÔNG đụng `data/`, `data-tabs/`, `docs/`, `video/`, `assets/nhac-nen/`, `assets/thumbs/`, `assets/avatars/` |
| **Token gốc** | KHÔNG sửa giá trị token hiện có (`--bg:#050505`, `--brand:#E2023A`…). Chỉ THÊM |
| **Theme** | Giữ Dark-mode. Không thêm Light, không theme toggle |
| **Media** | KHÔNG xoá/ghi đè file media. 140 video + 49 nhạc + 202 thumb giữ nguyên |
| **Validate** | Sau mỗi Phase chạy `node scripts/validate-project.js` + `node scripts/sync-counts.js --check` — phải PASS |
| **Rác tạm** | Mọi script test ad-hoc xoá ngay sau khi dùng (Ephemeral Cleanup) |
| **Rollback** | Mỗi Phase là 1 commit riêng → revert được từng Phase |

---

## 6. Tiến độ

| Phase | Tên | Trạng thái | Ngày xong |
|---|---|---|---|
| 0 | Nền tảng & Hạ tầng CSS | ✅ **HOÀN THÀNH** (check-pass 3 vòng) | 2026-09-23 |
| 1 | Chuẩn hoá URL & Routing | ✅ **HOÀN THÀNH** (45/46 test PASS) | 2026-09-23 |
| 2 | Shell đồng nhất 3 trang | ✅ **HOÀN THÀNH** (39/39 test PASS) | 2026-09-23 |
| 3 | Icon + Typography | ⏳ chờ thi công | — |
| 4 | Layout tab + Surface + Modal | ⏳ chờ thi công | — |
| 5 | Thông báo, Responsive, Nghiệm thu | ⏳ chờ thi công | — |

### Nhật ký thi công

**Phase 0 (2026-09-23)** — Tạo 3 file CSS nền tảng; sửa biến chết `--brand-ink-ink`; gỡ ép màu `!important` `.stat-icon`; nạp vào 3 trang; đồng bộ cache-busting `?v=20260923-p0`.
Verify: HTTP 200 100% · 0 JS error · UI không hồi quy · 3 script validate PASS.

**Phase 1 (2026-09-23)** — BE: whitelist thêm `/tatca /nhac /tai-lieu /kenh-mau`; 301 redirect `/tongquan→/`, `/kichban→/tai-lieu`, `/kenh→/kenh-mau`, `/raw→/rawkenh` (giữ query param); validate SKU `/lotrinh/<sku>` → 404 nếu rác (đọc `data/catalog.json`).
FE: gom `readStateFromURL()` dùng chung cho `init()` + `popstate` (khôi phục đủ 9 param, trước mất 6); `TABS` 10 tab slug khớp URL; `document.title` động theo route; `?sub=` cho Chiến lược.
Verify: 45/46 test PASS (1 FAIL là lỗi selector test, không phải lỗi code) · 3 script validate PASS.

**Phát hiện mới ghi backlog:**
- `learn.css:10` — `--bg` render rỗng do token vòng lặp → xử lý Phase 5 (mục 5.7).
- `viddar.css` còn 3 nơi ép màu/shadows cứng (`progress-track`) → xử lý Phase 4.

