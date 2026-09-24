---
name: "H2DEV"
---

# H2DEV

H2DEV là design library **Dark-mode only** cho web tĩnh kho video faceless YouTube (tiếng Việt). Đây là bộ tài liệu chuẩn thiết kế: mọi thay đổi UI về sau phải đối chiếu với `SKILL.md` và `consistency-matrix.md` trước khi commit.

Version hiện tại là **v0.1.0 (audit baseline)**. Bộ tài liệu mô tả **hiện trạng đã kiểm kê** và **chuẩn bắt buộc**, không phải mô tả một hệ thống đã hoàn thiện. H2DEV hiện **chưa đạt** chuẩn thống nhất: giao diện đang rời rạc trên 3 trang shell (`index.html`, `learn.html`, `player.html`) và 10 tab dữ liệu.

Tham chiếu kiến trúc: bộ tài liệu này mượn **kiến trúc tổ chức & chuẩn viết** của TraeWork Design Library (README / SKILL / consumption contract / ui kit plan), nhưng **toàn bộ giá trị token là Dark-mode + brand đỏ `#E2023A` của H2DEV**. Không mang token Light-mode, không mang brand `#4B3FE3` của TraeWork vào dự án này.

## Open the Showcases

H2DEV không có thư mục `ui_kits/` độc lập. Showcase chính là các trang và tab thật của sản phẩm, phục vụ trực tiếp ở local `http://127.0.0.1:8899` và production `https://h2dev-learn.tonymmo.com`.

| Showcase | Path |
|---|---|
| Shell - Index (10 tab, sidebar + bottom-nav) | `index.html` |
| Shell - Learn (Lộ trình học) | `learn.html` |
| Shell - Player (trình phát bài học) | `player.html` |
| Tab - Tổng quan | `assets/app/tabs/content.js` · slot `tongquan` |
| Tab - Video (140 bài) | `data-tabs/videos.json` · slot `video` |
| Tab - Ngách xanh | `data-tabs/ngach-xanh.json` · slot `ngachxanh` |
| Tab - Tài liệu | `data-tabs/tai-lieu-full.json` · slot `tailieu` |
| Tab - Nguồn reup | `data-tabs/nguon-reup.json` · slot `nguonreup` |
| Tab - Kênh mẫu | `data-tabs/kenh-mau.json` · slot `kenhmau` |
| Tab - Raw kênh | `data-tabs/raw-kenh-mau.json` · slot `rawkenh` |
| Tab - Chiến lược | `data-tabs/chien-luoc.json` · slot `chienluoc` |
| Tab - Lộ trình | `data-tabs/kich-ban.json` · slot `lotrinh` |
| Modal - Nhạc nền | `assets/music_player_modal.js` |

## Consumption Contract

| Layer | Files | Use |
|---|---|---|
| Tokens | `design-system/tokens.json`, `assets/viddar.css` (`:root`) | Ngôn ngữ thiết kế Dark-mode, brand `#E2023A`, radius, type, z-index ladder, breakpoint |
| Rules | `design-system/SKILL.md` | Luật thi công bắt buộc cho mọi lần sửa UI |
| Audit | `design-system/consistency-matrix.md` | Đối soát hiện trạng → mục tiêu theo từng trang/tab, kèm Top 20 việc phải sửa |
| Shell | `index.html`, `learn.html`, `player.html` | Chuẩn header / footer / back-to-top / skip-link / điều hướng |
| Component markup | `assets/viddar.css`, `assets/learn.css`, `assets/player.css`, `assets/tailwind.css`, `assets/g3-inline.css` | Atom dùng chung: `.card`, `.badge-*`, `.page-h2`, `.stat-icon`, `.empty-state` |
| Icon | `assets/app/main.js` (`ICONS` object) | **Hệ icon chuẩn duy nhất** — 10 SVG stroke, `class="w-4 h-4"`, `stroke="currentColor"` |
| Data | `data-tabs/*.json`, `data/*.json` | Nguồn dữ liệu SSoT; cấm hardcode số đếm trên UI |

Bắt đầu từ `SKILL.md` khi sửa UI. Bắt đầu từ `consistency-matrix.md` khi lập kế hoạch tối ưu. Bắt đầu từ `tokens.json` khi cần giá trị token.

## Machine-readable Data Shape

- `tokens.json` là token projection dạng nhóm (`color`, `font`, `radius`, `spacing`, `size`, `shadow`, `zindex`, `breakpoint`, `motion`). Đây **không phải** map phẳng `--token: value`.
- Mỗi nhóm có khoá `status`: `"canonical"` = giá trị đang tồn tại trong `assets/viddar.css` và **bắt buộc giữ nguyên**; `"proposed"` = giá trị chuẩn hóa đề xuất, chưa tồn tại trong code, phải triển khai theo lộ trình.
- Nhóm `color` là **giá trị đã xác minh runtime** từ `assets/viddar.css:51-80`. Không được bịa thêm hex ngoài danh sách này.
- Thang `spacing`, `zindex`, `breakpoint`, `motion` hiện **chưa có** trong code — toàn bộ là `"proposed"`.
- `uikit-plan.json` là blueprint chuẩn hóa theo từng page/tab: `slot`, `priority`, `reason`, `evidenceFile`, `requiredComponents`. Đây là hợp đồng cho mọi lần refactor UI.

## Token Highlights

| Group | Examples |
|---|---|
| Surface | `--bg:#050505`, `--surface:#0f0f0f`, `--surface-2:#1a1a1a` |
| Border | `--border:#222`, `--border-strong:#333`, `--hairline:#1a1a1a` |
| Text | `--fg:#f0f0f0`, `--fg-muted:#a9a9a9`, `--fg-faint:#9ca3af` |
| Brand | `--brand:#E2023A`, `--brand-hover:#ff1a4d`, `--brand-ink:#ff8095`, `--brand-tint:#2a0a12` |
| Radii | `--r-md:4px`, `--r-lg:4px` (hiện đang trùng giá trị) |
| Type | `--font-sans:"Inter"`, `--font-mono:"JetBrains Mono"`, `--font-display:"Space Grotesk"` |
| Chrome | `--topbar-bg:rgba(5,5,5,0.92)`, `--focus-ring:0 0 0 2px var(--bg), 0 0 0 4px rgba(226,2,58,.6)` |
| Font-weight (thực khai báo) | `"Inter" 400 700`, `"JetBrains Mono" 500 700`, `"Space Grotesk" 500 700` |

## Known Limitations

Ghi nhận trung thực theo kết quả kiểm kê. Đây là danh sách nợ kỹ thuật, không phải danh sách tính năng.

- **Shell lệch trên 3 trang.** Header 3 chiều cao/z-index/định vị khác nhau (`.vd-topbar` 56px sticky→fixed, `.learn-header` 56px fixed, `.app-top` 52px sticky). `player.html` **không có footer**, **không có nút back-to-top** (cả element lẫn JS), **không có skip-link**. `learn.html` có back-to-top nhưng **không có skip-link** và footer **thiếu `border-top`**.
- **3 hệ điều hướng khác nhau 100%.** `index.html` sidebar `#tabs` (đủ ARIA: `role=tablist`, `aria-selected`, `aria-controls`, roving tabindex, arrow-key); `learn.html` `.tabbar .tab-btn` (chỉ `aria-label` + `aria-selected`); `player.html` `#playerTabSelector` (`role=tablist`/`role=tab`, thiếu `aria-controls` + arrow-key).
- **4 hệ icon song song.** Hệ 1 (chuẩn, `main.js:46-57`, 10 SVG, 16px, `currentColor`); Hệ 2 (`h2dev-core.js:15-26`, 9 SVG lẫn size 12/18/16px + 2 emoji `check:'✓'`, `eye:'👁'`); Hệ 3 (SVG inline ad-hoc rải rác); Hệ 4 (**78 code point emoji/Unicode, ~338 lần xuất hiện**). Kích thước icon đang có **12 mức**: 10, 11, 12, 15, 16, 17, 18, 20, 24, 25.6, 28, 30px.
- **Token icon chết và ép màu.** `viddar.css:428` dùng biến **không tồn tại** `var(--brand-ink-ink)` (đã xác minh: `:root` không khai báo biến này). `viddar.css:1292` ép `color: var(--brand-ink) !important` cho **mọi** `.stat-icon` → mọi KPI card cùng một màu hồng, mất khả năng phân biệt trạng thái. Hơn 25 mã màu khác nhau gán cho icon, ≥10 mã hardcode hex.
- ~~**Typography ~20 bậc.**~~ **✅ ĐÃ SỬA XONG 2026-09-24 (P3.7).** Trước đây: 9 bậc dùng được (11/12/13/14/16/18/20/24/30px) + **11 bậc lẻ tùy tiện** (9, 9.5, 10, 10.5, 11.5, 12.5, 13.5, 14.5, 15, 17, 22, 26px); Tailwind arbitrary `text-[Npx]` ~112 lần; `font-weight:650` / `font-extrabold`(800) / `font-black`(900) gây **synthetic-bold**.
  **Nay:** thang duy nhất **9 bậc** (11/12/13/14/16/18/20/24/32px), **0 bậc lẻ**, **0 `text-[Npx]`** (đã chuyển 115 class sang tên chuẩn + khai `safelist` + `fontSize` scale trong `tailwind.config.js`), **0 font-weight ngoài 400/500/600/700**.
  Tổng đã sửa: **254 chỗ** ở 5 nguồn khác nhau (43 CSS `px` · 48 `text-[Npx]` trong JS · 133 `font-size: rem` inline · 30 `font-weight:800`; xem `AGENTS.md` SCAR-015).
  Kiểm chứng: gate `scripts/gate-typography.js` (4 luật, PROBE 16/16) **ALL PASS** + visual test browser thật **44/44 lượt** → `size lạ = 0`, `tràn ngang = 0`, `console error = 0`.
  **Còn nợ (chưa sửa):** `line-height` **21 giá trị** (chuẩn 6) và `letter-spacing` **20 giá trị** (chuẩn 4, cùng giá trị viết nhiều kiểu).
- **Layout mất nhất quán.** Tab Tổng quan thiếu banner/search/filter/empty-state (tự viết `.tq-head`); Chiến lược thiếu banner/search/filter. Stat card: 4 (đa số) · 5 (Kênh mẫu) · 7 (Raw kênh — bị `pageBanner` cắt còn 4 trên mobile, **mất 3 chỉ số**). Margin-bottom khối đầu: `mb-6` / `mb-5` / `mb-4` lẫn lộn. Padding card desktop: **5 hệ** (`p-3.5` / `p-4` / `p-4 sm:p-5` / `p-5` / `p-5 sm:p-6`). Pagination **chỉ có ở Raw kênh** (`PAGE_SIZE=24`); Video (140 bài) / Nguồn reup / Kênh mẫu render 100%. Nút CTA: **5 tổ hợp class** cho cùng hành động; Tài liệu có 2 nút tím `bg-purple-600` trùng chức năng; Raw kênh có 4 màu nút trong cùng 1 card. `content.js:1640` dùng `bg-gradient-to-r from-blue-900/60 to-indigo-900/60` nhưng `viddar.css:574` ép `background-image:none !important` → gradient chết, nút thành phẳng.
- **Surface & modal không đồng bộ.** 6 modal hoạt động + 1 CSS dead (`#raw-channel-modal`, CSS ở `index.html:19-47`, không có JS/DOM). `moreMenuSheet` (`nav.js:73-95`) **thiếu toàn bộ a11y**. Cả 6 modal **không khôi phục focus** khi đóng (vi phạm WCAG 2.4.3). **15 giá trị z-index** khác nhau; `docModal` chỉ `9999` trong khi modal khác `99999`-`100005`; `.toast-msg` = 100 (**dưới modal** → toast bị che khi copy trong `docModal`); `.more-menu-sheet` = 60 (dưới bottom-nav 100). Backdrop blur 4 mức (8/10/12px), alpha overlay 3 mức (0.85/0.88/0.92), nền panel 4 mã (`#0b0f19`/`#0f172a`/`#111827`/`#070a12`) **không dùng token**.
- **Breakpoint lệch.** `viddar.css` dùng 8 mốc (640/720/768/900/1024/1100/1200/1280); `learn.css` **chỉ có 720**; `player.css` có 640/1023; `g3-inline.css` **không có `@media` nào**; inline trong `index.html` chỉ 640. Hệ quả: ở dải **641-720px**, `learn.html` vẫn là desktop trong khi `index.html`/`player.html` đã là mobile; `learn.html` **không có rule tablet 721-1024**.
- **Touch target dưới 44px.** Learn **co nhỏ trên mobile** (`.lesson-watch` 36→30px, `.tabbar .tab-btn` 36→34px); `.search-clear` 24px, `.sec-toggle` 30px, `.row-fav` 32px, `#btn-back-to-top` 38px, nút X modal ~30px.
- **Thông báo & loading phân mảnh.** 5 hệ thông báo: `player.html` có `showToast` + `#toast-box`; `index.html` có `#a11y-status` + `alert()` native; `learn.html` chỉ có `aria-live` trên panel — **không trang nào có đủ cả hai**. 11 kiểu loading khác nhau; chỉ 1 chỗ có spinner thật (`player-main.js:788`); chỉ `index.html` có `aria-busy`; **không có skeleton ở đâu**.
- **Token bị định nghĩa vòng lặp.** `learn.css:2-20` tự khai báo `--bg: var(--bg, #050505)`, `--font-mono: var(--font-mono, ...)` (self-reference) và tạo token riêng `--pri/--sec/--war/--ok/--panel/--line/--txt/--mut/--font-heading/--font-body` trùng chức năng với `viddar.css`.
- **Chưa có component contract JSON.** Bộ tài liệu này có `uikit-plan.json` nhưng **chưa** có `components/{slug}.json`. Vì vậy không có `tokensConsumed` / `domAnatomy` / `provenance` ở cấp component. Khi refactor, coi `viddar.css` + `assets/app/main.js` là hợp đồng thực thi tạm thời.
- **`text-center` (16 lần) vs `text-left` (10 lần)** cùng loại card chỗ khai báo chỗ không; 4 empty-state có 3 biến thể padding/bọc khác nhau.

## Authoring Rules

1. Chỉ dùng token trong `tokens.json` và `assets/viddar.css` (`:root`). Không thêm palette thô, status hue mới, hay overlay alpha tùy hứng.
2. Giữ Dark-mode là mode duy nhất. Không thêm theme toggle, không thêm block Light-mode, không dùng `prefers-color-scheme` để đổi theme.
3. **Cấm sửa giá trị token hiện có** (`--bg:#050505`, `--brand:#E2023A`, ...). Token chỉ được phép thêm mới hoặc gán nhãn `deprecated`.
4. Ưu tiên atom có sẵn (`.card`, `.badge-*`, `.page-h2`, `.stat-icon`, `.empty-state`) trước khi viết style mới. Không tạo hệ thứ 2 cho việc đã có hệ.
5. Chỉ dùng **1 hệ icon duy nhất**: `ICONS` object trong `assets/app/main.js`. Cấm thêm emoji/Unicode icon mới, cấm thêm icon font, cấm CDN icon pack.
6. **Cấm hardcode số đếm trên UI.** Mọi số lượng phải tính động từ `data-tabs/*.json` (xem `AGENTS.md` mục 4).
7. Mọi thay đổi UI phải cập nhật `consistency-matrix.md` cùng lượt; `README.md` / `SKILL.md` / `consistency-matrix.md` / `tokens.json` phải khớp số liệu.
8. Không sửa/xóa file media, `data/`, `data-tabs/`, catalog, server, config. Bộ tài liệu này là **read-only** với các tài sản đó.
9. Giữ tên file và đường dẫn ổn định. Không đổi tên `assets/viddar.css`, `assets/learn.css`, `assets/player.css`.
10. Sau khi sửa UI, kiểm tra theo **3 vòng**: (1) đĩa & ffprobe, (2) code/schema/frontend search index, (3) dual-environment Local + VPS HTTP 200 & cache-busting.
