# H2DEV — Evidence-based design upgrade plan

> **Current review: 2026-09-28 · NEEDS WORK.** The earlier five-pillar direction was approved by the owner, but individual defect claims and proposed remedies are not accepted without evidence. The current findings and acceptance contract in section 7 take precedence over the historical progress table below.
> **This session:** read-only source and local browser audit; correction of this design plan; review deliverable. No production UI code fixes, database synchronization, asset deletion, service restart, commit, or deployment were performed.
> **Execution boundary:** UI/UX assessment and design specification are covered here. Frontend implementation, service-worker changes, backend/database work and production rollout require an engineering execution session. This document does not certify those tasks as complete.
> **Review scope:** 3 principal shells; 10 distinct index destinations; 4 learning views; 3 player views; 6 content dialogs plus 1 More drawer. Browser geometry covered 12 entry URLs at 8 widths, not every possible application state.

## Historical plan — retain for provenance, not current certification

> **Trạng thái lịch sử:** `approved` — chủ dự án đã duyệt ngày 2026-09-23.
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

## 6. Historical progress claims — not a current acceptance decision

The following entries record earlier reports. Current browser evidence in section 7 contradicts the blanket completion claim for phases 4 and 5; existing gates cover a limited set of invariants, not the full UI/UX contract.

| Phase | Tên | Trạng thái lịch sử | Ngày báo cáo |
|---|---|---|---|
| 0 | Nền tảng & Hạ tầng CSS | ✅ **HOÀN THÀNH** (check-pass 3 vòng) | 2026-09-23 |
| 1 | Chuẩn hoá URL & Routing | ✅ **HOÀN THÀNH** (45/46 test PASS) | 2026-09-23 |
| 2 | Shell đồng nhất 3 trang | ✅ **HOÀN THÀNH** (39/39 test PASS) | 2026-09-23 |
| 3 | Icon + Typography | ✅ **HOÀN THÀNH** (gate-icons + gate-typography PASS) | 2026-09-24 |
| 4 | Layout tab + Surface + Modal | **REOPENED** — URL/history, modal entry focus and conditional layout coverage remain incomplete; see section 7 | 2026-09-28 review |
| 5 | Thông báo, Responsive, Nghiệm thu | **REOPENED** — notification ownership/layering, actual touch targets and offline scope remain incomplete; see section 7 | 2026-09-28 review |

### Nhật ký thi công

**Phase 0 (2026-09-23)** — Tạo 3 file CSS nền tảng; sửa biến chết `--brand-ink-ink`; gỡ ép màu `!important` `.stat-icon`; nạp vào 3 trang; đồng bộ cache-busting `?v=20260923-p0`.
Verify: HTTP 200 100% · 0 JS error · UI không hồi quy · 3 script validate PASS.

**Phase 1 (2026-09-23)** — BE: whitelist thêm `/tatca /nhac /tai-lieu /kenh-mau`; 301 redirect `/tongquan→/`, `/kichban→/tai-lieu`, `/kenh→/kenh-mau`, `/raw→/rawkenh` (giữ query param); validate SKU `/lotrinh/<sku>` → 404 nếu rác (đọc `data/catalog.json`).
FE: gom `readStateFromURL()` dùng chung cho `init()` + `popstate` (khôi phục đủ 9 param, trước mất 6); `TABS` 10 tab slug khớp URL; `document.title` động theo route; `?sub=` cho Chiến lược.
Verify: 45/46 test PASS (1 FAIL là lỗi selector test, không phải lỗi code) · 3 script validate PASS.

**Phát hiện mới ghi backlog:**
- `learn.css:10` — `--bg` render rỗng do token vòng lặp → xử lý Phase 5 (mục 5.7).
- `viddar.css` còn 3 nơi ép màu/shadows cứng (`progress-track`) → xử lý Phase 4.

---

## 7. Current evidence and repair contract — 2026-09-28

### 7.1 Baseline, evidence levels and limits

- **RUNTIME CONFIRMED:** directly reproduced in a disposable local Chromium context at `http://127.0.0.1:8899`. Browser storage was isolated from the owner's normal profile.
- **SOURCE CONFIRMED:** a concrete code path was read, but its entire runtime population was not tested.
- **NOT VERIFIED:** measurement, environment access or complete state coverage is absent. These items cannot be reported as fixed or production-ready.
- **CONTRADICTED:** prior claim was not supported by the full implementation or current measurement.
- Priority reflects observed user impact, not a fabricated performance estimate. P1 means the next repair batch; P2 requires measurement or design consolidation. No speculative item is promoted to P0 solely because a pattern looks undesirable.

Current inventory: 3 principal shells; 10 index destinations (`tatca`, `video`, `ngachxanh`, `tai-lieu`, `nhac`, `nguonreup`, `kenh-mau`, `rawkenh`, `chienluoc`, `lotrinh`); 16 rendered index navigation controls = 10 sidebar + 5 repeated bottom controls + More; 4 learning views; 3 player views; 6 content dialogs + More drawer. Across the 3 shells, source inspection found 10 distinct externally declared CSS files and 15 distinct externally declared JS files. Do not confuse controls, destinations, pages, records and unique channels.

**Measured local baseline:**

| Check | Result | Scope caveat |
|---|---|---|
| 12 entry URLs × 8 widths (`375/640/641/768/1023/1024/1280/1920`) | 96/96 without horizontal root overflow | Includes both `/lotrinh` and `/learn.html`, plus one player SKU; not 96 independent product states or visual approval |
| Concrete paths listed in route manifest | 24 tested: 17 HTTP 200, 4 HTTP 301, 3 HTTP 404 | The 3 `/modal/*` entries are still marked proposed; not automatically defects |
| Lesson route availability | 140/140 HTTP 200 | HEAD only; browser playback is not certified for every lesson |
| Video thumbnails | 140/140 HTTP 200 | URL availability, not image-content comparison |
| Media one-byte range | 140/140 HTTP 206 | Not a full ffprobe/packet/audio integrity audit |
| Local document entries | 142/142 HTTP 200 | 15 catalog entries have no local file; they are not 15 missing files |
| Paged item identity coverage | 140/140 videos, 156/156 raw records, 152/152 visible channels, no duplicates in these lists | 13 dead channels are intentionally hidden out of 165 |
| Simple-background `.text-gray-500` contrast | 82 evaluated elements, no below-threshold cases in this limited set | One complex-background case excluded; not a complete contrast audit |
| Existing non-mutating checks | Validator, counts `--check`, icons, typography, P1, P2 PASS; shell 6/6 PASS | Static gates do not prove behavior, full accessibility, visual quality or production parity |

The two legacy E2E suites were not rerun this turn because they write screenshot artifacts. Their previous 23/23 and 11/11 results are historical, not fresh evidence. No screenshot-based visual approval was completed. No production parity, Firefox/WebKit/mobile OS run, screen-reader run, all-dialog matrix, field Web Vitals, full subtitle/media audit or AI pipeline audit was completed. The whole-project upgrade remains open.

### 7.2 Findings with evidence and repair criteria

| ID | Priority / status | Confirmed finding and evidence | Minimum repair acceptance |
|---|---|---|---|
| UI-01 | P1 / runtime | Search tokenizer strips non-ASCII letters: `assets/app/search-core.js:6-32`; fallback repeats it in `content.js:4-12`. After waiting for the actual debounced render: `Phật pháp` yields 139/140 videos, `phat phap` 0/140, Japanese `仏教` 140/140. The Japanese query becomes zero tokens and matches everything. | One documented normalization contract for index, suggestions and filtering. Vietnamese with/without marks must agree where intended; Japanese/Thai/Cyrillic must retain their letters; punctuation-only queries must be explicitly defined. Test IDs, names, combined terms and existing sort/filter interactions. Do not copy the previously suggested mixed-token regex unchanged. |
| UI-02 | P1 / runtime | A delayed Raw Channels load overwrites a later Video render: after release, `state.tab=video`, URL `/video`, title Video, but 24 raw cards and no video cards. `assets/app/main.js:637-756` commits asynchronous results without a generation check. | Commit only the latest render generation; discard stale results/errors/busy changes. Test delayed success and failure for every data-driven destination, plus rapid search and tab changes. |
| UI-03 | P1 / runtime | Mobile More → Strategy leaves URL `/video` and focus on BODY. `nav.js:95-100` sets state directly instead of using the normal navigation path. Mobile ArrowRight on `m-tab-video` is a no-op because `nav.js:25-31` searches only `#tabs`. | Main and overflow navigation must share one transition contract. Content, title, selected tab and URL agree; keyboard navigation operates in the active nav group; stable focus survives re-render; Back/Forward restores the destination. More is an expander, not a misleading content tab. |
| UI-04 | P1 / runtime | Video page 2 → reload resets to page 1; the URL remains `/video`. Channel page 2 also has no page query and focus becomes BODY. `main.js:777-778` reads `vp/kp`, but navigation/pager updates do not consistently serialize them. | Pagination, queries, filters, resets and strategy sub-view changes must round-trip on reload/share/Back/Forward. Every dataset page is traversed with an identity union proving no omissions/duplicates; moving pages must retain sensible focus and announce page/results. |
| UI-05 | P1 / runtime | `/nhac` returns document content (`157/157`, document search), not the studio; no dialog is opened. `main.js:668-669` renders `renderKichBan()` for both documents and music. The topbar music button still works. | Implement the already approved music destination contract without duplicating the catalog UI: direct link, navigation click, close, Back and filter/track state must agree. Closing a routed dialog restores the defined previous destination. |
| UI-06 | P1 / runtime | Fresh browser registration has scope `/assets/app/` and no controller on `/`; offline reload fails with disconnected navigation. `assets/app/sw-register.js:4` registers the nested worker. Root and nested worker files share old cache code, with runtime caching as well as incomplete precache. | One authoritative worker, intended root scope, safe versioned cache policy and declared offline boundary. Verify first visit/update, controlled root and deep routes, cached vs uncached assets, offline reload and recovery. Audio/video excluded from offline must be labeled honestly. Never claim missing precache alone proves universal failure. |
| UI-07 | P1 / runtime + source | Raw detail captures/restores focus in the tested flow. Music and document dialogs restore on close but opening leaves focus outside. `music_player_modal.js:294`; `player-main.js:902`. Transcript open at `main.js:2131-2132` does not capture the trigger; close attempts restoration. All 7 dialogs were not runtime tested. | Test all 6 dialogs and the drawer: initial focus, Tab/Shift+Tab, Escape, backdrop/close, asynchronous content replacement, connected trigger restoration, stacking, media stop and body scroll locking. Only the top dialog handles keyboard events. |
| UI-08 | P1 / runtime + source | Notifications are still split: shared `H2Core.showToast`, player local `showToast`, music local `showToast`. Shared toast z-index 300 is below music modal 1010; music overrides 100010 via JS. `h2dev-core.js:363-381`, `player-main.js:773`, `music_player_modal.js:39-51`. | One notification owner with an explicit modal-compatible layer and live announcement contract. Check copy/error/success inside every dialog; no duplicate live announcements, unbounded timers or raw z-index overrides. Do not infer that merely defining a shared function removes local implementations. |
| UI-09 | P1 / runtime | Multiple mobile controls are below the project's 44px contract: reset 40px; raw demo 32px; raw detail/prompts 38px; player previous/next/watched 32px; copy/read 27px. A 32px favorite visual has a 44px pseudo-element, but a tested example's actual hit bound is about 43px with clipping. `h2dev-components-lesson-row.css:50,65-74`; `gate-p2.js:114-120` covers only 3 selectors. | Inventory interactive buttons, links and custom targets by state. Verify actual pointer hit geometry, overlap, clipping and focus rings—not only `getBoundingClientRect` or CSS declarations. Apply project 44px policy with explicit exemptions. Do not label every 32px visual box a failure if an effective hit area exists. |
| UI-10 | P1 / runtime | Mobile player tab ArrowRight changes selected tab and seeks video from 30s to 35s. Existing tab handler and global shortcuts both run. `player-main.js:238-254,733-770`. | Respect consumed/defaultPrevented events and input/control contexts. Tab, transcript and dialog keys must not seek/play the video; documented video shortcuts still work when appropriate. |
| UI-11 | P1 / runtime | Aborting `ngach-xanh.json` makes the overview expose `Cannot read properties of undefined (reading 'slice')` despite a Retry button. Restoring the request then Retry produces four KPI cards but retains the old error banner. `content.js:55-70`; `main.js:94-124,755`. | Partial failures cannot crash unrelated content or leak implementation errors. Use safe empty/error schemas; path-scoped errors clear on recovery; user sees plain-language cause and usable retry while data integrity is preserved. Existing Retry must be improved, not falsely described as absent. |
| UI-12 | P1 / runtime | Raw pager visibly contains `Trang 1/7 ? 156 h? s?` and `Sau ?`. `content.js:1585`. | Restore UTF-8 labels without changing data IDs. Compare all pager directions, counts, headings and status copy; zero corrupted display labels across the UI inventory. |
| UI-13 | P2 / source + limited runtime | Design ownership is inconsistent: live raw modal border resolves to `rgb(30,41,59)` outside the neutral surface contract; inline templates retain palette/radius overrides. Old blueprint has 9 outdated tab names; route manifest still reports now-live destinations as proposed/404. Main `pageBanner` ignores its title argument and still cuts exactly 5 cards below 768px. | Consolidate specification by component role and loaded cascade. Neutral surface/border/radius/motion use resolved tokens, retaining semantic status colors and data flags. Define headings and KPI visibility explicitly. Split overview/list/strategy/music/player blueprints rather than forcing nonfunctional search/pagers into all views. Extract inline CSS only after before/after behavior and cascade equivalence tests. |
| UI-14 | P2 / source, measurement open | Player has synchronized transcript and existing shortcuts but no native caption track; transcript timeupdate toggles many DOM classes; media retry lacks a bounded state. `player-main.js:435-440,535-595`. | Define caption behavior for normal/fullscreen playback, retry limit/manual retry, and transcript update budget. Measure representative and longest lessons before optimization; do not assert a fixed event frequency, 2000 operations/s, battery impact or a 15KB payload target without evidence. |

### 7.3 Corrections to prior assertions — mandatory before implementation

1. **Unlimited content width is contradicted.** At 1920px, index and learn content measured 1120px, player main 1024px. Existing `viddar.css:#content`, `learn.css:.learn-content` and player `.wrap` constrain width. Absence of the helper class is not absence of a width limit. Do not narrow the video/theater layout globally.
2. **Missing keyboard shortcuts is contradicted.** They exist; the confirmed issue is overlapping event ownership, not absence.
3. **No Retry button is contradicted.** A retry exists; failure schema and stale error recovery are defective.
4. **All gray text has about 3.5:1 contrast is unverified.** The limited 82-element simple-background check found no failure. Measure full composited foreground/background, opacity, gradients and states before altering tokens.
5. **Missing image attributes proves CLS is invalid.** Video thumbs already declare 320×180; CSS fixes dimensions/aspect ratio elsewhere. Layout-shift observation and actual affected nodes are prerequisites.
6. **Eight stylesheets prove FOUC is invalid.** Request count is an observation; FCP/FOUC impact requires a waterfall and visual timing comparison. Bundling is not an automatic fix.
7. **Database counts must match JSON 1:1 is invalid.** The builder reads both raw channels and benchmark channels (`build_master_db.js:429-430,468,565`); different populations can legitimately have different counts. Reconcile identity/provenance/schema before proposing migration. Never overwrite a richer dataset to satisfy equal numbers.
8. **Singleton WAL is not a connection pool or an automatic performance cure.** Backend load, statement ownership, worker model and read/write requirements need engineering evidence. No rate-limit/SQLite/async-IO prescription is certified by this design review.
9. **Voice samples: 156 records are not 156 unique channels.** Manifest has 149 unique raw channels. Compare sample-to-channel mappings and intended scope before calculating gaps. No blanket '133 missing voices' claim is accepted.
10. **Asset existence is not integrity.** One-byte HTTP 206 and HEAD 200 do not prove complete audio/video, LUFS, transcript alignment or original-preservation. No asset deletion is authorized by these checks.
11. **Standards:** the project adopts 44px targets. WCAG 2.2 SC 2.5.8 is AA 24×24 CSS px with exceptions; SC 2.5.5 is AAA 44×44 CSS px with exceptions. Do not call every sub-44 target an AA violation. Sources: <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html> and <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html>.

### 7.4 Ordered upgrade batches and release criteria

| Batch | IDs / output | Entry prerequisites | Exit criteria | Current status |
|---|---|---|---|---|
| A — Evidence and ownership | Current review, inventory, corrected claim register | Read current assets and preserve working tree | Clear populations, sourced findings, explicit exclusions; preserve historical plan | [x] Audit and plan correction complete; not code repair |
| B — Correct navigation and discovery | UI-01 to UI-05, UI-11, UI-12 | Engineering execution; test cases that reproduce observed defects | Unicode contract, no stale render, URL/history round-trip, correct music destination, recoverable errors, clean labels; all paginated item identities preserved | [ ] Not implemented |
| C — Interaction and accessibility | UI-07 to UI-10 | Confirm B's stable render/nav ownership; complete dialog/state inventory | 7/7 dialog interactions; all contextual keyboard cases; measured target geometry; one visible/announced toast owner | [ ] Not implemented |
| D — Offline and release consistency | UI-06 | Approved root worker scope/cache update strategy and rollback | Root/deep routes controlled; fresh/update/offline/recovery matrix; versions resolvable; no media/offline overclaim | [ ] Not implemented |
| E — Visual refinement and player UX | UI-13, UI-14 | Screenshot-based visual review; measured CLS/contrast/performance; protect brand and data | Component-role blueprints, neutral surfaces, preserved semantics, reliable player captions/retry/transcript behavior; regression evidence | [ ] Not implemented |
| F — Engineering/data/media handoff | Backend, SQLite, reconciliation, Voice DNA, ArcFace, original assets, rollout | Appropriate engineering/media execution session; identity mapping, measurements, backups and separate destructive confirmation | Per-domain evidence, preservation and rollback; local and production acceptance; user-visible closure of each item | [!] Outside this design session; not executed |

Acceptance is **per item and per stated population**. Passing the current regression gates is necessary but insufficient. Add tests for the confirmed slow-render race, multilingual search, mobile overflow history/focus, pagination reload, all-dialog focus entry, keyboard collision, recovery and service-worker scope. Do not mark a whole phase complete after only generic checks pass.

### 7.5 Safety and next execution boundary

- No deletion of PNG, media, backups, voice samples, data or documentation assets is part of this plan acceptance.
- Database synchronization is not an audit command by default. Inspect each script's side effects first; `build_master_db.js:21-25` removes the existing database and its WAL/SHM files and must not be run as a harmless check.
- Do not deploy, restart live services, publish new routes or change networking solely to make a test pass.
- Preserve existing validated pagination content and canonical tokens. Fix ownership/behavior first, cosmetic consistency second.
- The owner approved the broad direction. Evidence corrections above are prerequisites for executing that direction accurately; they are not claims that repairs have already occurred.
- **Current result: verified design audit and corrected plan delivered; whole-project repair NOT complete.** Engineering work remains to be performed in its appropriate execution session.

