---
name: "H2DEV Consistency Matrix"
---

# Ma trận Đối soát Nhất quán H2DEV

Tài liệu này đối chiếu **hiện trạng đã kiểm kê** với **chuẩn bắt buộc** trong `SKILL.md`, theo từng trang và từng tab. Mọi số liệu ở đây **khớp** với `README.md` (mục Known Limitations), `SKILL.md` và `tokens.json`.

**Quy ước mức ưu tiên:**

| Mức | Ý nghĩa |
|---|---|
| **P0** | Chặn phát hành — lỗi thị giác/a11y nghiêm trọng hoặc mất dữ liệu hiển thị |
| **P1** | Sai lệch cấu trúc rõ rệt — người dùng nhận ra sự bất nhất |
| **P2** | Nợ kỹ thuật — cần gộp hệ, không gây lỗi trực tiếp |
| **P3** | Dọn dẹp — code smell, gộp giá trị trùng |

---

## A. Shell (khung trang)

| Hạng mục | index.html | learn.html | player.html | Tabs khác | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|---|---|---|---|
| Header class | `.vd-topbar` | `.learn-header` | `.app-top` | — | 3 class, 3 hệ CSS | 1 class shell chuẩn dùng chung | P1 |
| Chiều cao header | 56px | 56px | **52px** | — | Lệch 4px giữa player và 2 trang kia | **56px** đồng nhất | P1 |
| Định vị header | sticky → fixed mobile | fixed | sticky | — | 2 cơ chế khác nhau | sticky desktop / fixed mobile | P1 |
| z-index header | 20 / 100 | 40 / 50 | 20 | — | 3 giá trị khác nhau | `--z-sticky:20` / `--z-fixed:40` / `--z-topbar-mobile:100` | P1 |
| Logo brand | SVG radar động + wordmark `h2dev` | ô `.brand-mark` chữ "H2" | ô `.brand-mark` chữ "H2" | — | learn + player lệch brand | **1 dạng duy nhất**: SVG radar + wordmark `h2dev` | P0 |
| Title font | Space Grotesk (`--font-display`) | Inter (`--font-heading` tự định nghĩa ở `learn.css:17`) | Space Grotesk (`--font-display`) | — | learn tự chế token font riêng | `--font-display` cho title shell; gỡ `--font-heading` khỏi `learn.css` | P1 |
| Sidebar | `.app-sidebar` | KHÔNG | KHÔNG | — | Chỉ index có | Chấp nhận khác biệt (sidebar là đặc thù index), nhưng bottom-nav phải có chuẩn riêng | P3 |
| Footer | `.app-footer`, có `border-top` | `.learn-footer`, **KHÔNG** `border-top` | **KHÔNG CÓ FOOTER** | — | 3 trạng thái: đủ / thiếu border / thiếu hẳn | Cùng cấu trúc + **bắt buộc** `border-top` + cùng text | P0 |
| Footer text | "H2DEV · kho faceless YouTube · không cần đăng nhập" | "Không cần đăng nhập" (chữ **K** hoa) | — | — | Lệch chữ hoa/thường + thiếu nội dung | Cùng 1 chuỗi chuẩn | P2 |
| Bottom-nav | `#bottom-nav` | KHÔNG | KHÔNG | — | Chỉ index có | Chấp nhận (đặc thù index) | P3 |
| Back-to-top element | CÓ | CÓ | **KHÔNG CÓ** | — | player thiếu hoàn toàn | **Bắt buộc** mọi trang | P0 |
| Back-to-top JS bind | `main.js:754-772` | `learn.js:434-449` | **KHÔNG CÓ** | — | player thiếu hoàn toàn | **Bắt buộc** mọi trang | P0 |
| Back-to-top size | 38px | 38px | — | — | Dưới 44px | **≥ 44px** | P1 |
| Vị trí DOM back-to-top | sau `<script>` cuối | trước `</body>` | — | — | 2 vị trí khác nhau | Thống nhất: ngay trước `</body>` | P3 |
| Skip-link | CÓ | **KHÔNG** | **KHÔNG** | — | 1/3 trang có | **Bắt buộc** mọi trang | P0 |
| Floating back btn riêng | — | — | có `.floating-back-btn` | — | player tự chế nút riêng | Gộp vào chuẩn back-to-top | P3 |

## B. Hệ điều hướng (3 hệ khác nhau 100%)

| Hạng mục | index.html | learn.html | player.html | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|---|---|---|
| Container | sidebar `#tabs` | `.tabbar .tab-btn` | `#playerTabSelector` | 3 hệ độc lập | 1 chuẩn ARIA chung | P1 |
| `role="tablist"` | CÓ | **KHÔNG** | CÓ | 2/3 có | Bắt buộc | P0 |
| `role="tab"` | CÓ | **KHÔNG** | CÓ | 2/3 có | Bắt buộc | P0 |
| `aria-selected` | CÓ | CÓ | CÓ | 3/3 có | Bắt buộc | ✅ |
| `aria-controls` | CÓ | **KHÔNG** | **KHÔNG** | 1/3 có | Bắt buộc | P0 |
| Roving tabindex | CÓ | **KHÔNG** | **KHÔNG** | 1/3 có | Bắt buộc | P0 |
| Arrow-key nav | CÓ | **KHÔNG** | **KHÔNG** | 1/3 có | Bắt buộc | P0 |
| `aria-label` | CÓ | CÓ | CÓ | 3/3 có | Bắt buộc | ✅ |
| Khuôn mẫu để noi theo | **`#tabs` (đủ chuẩn)** | — | — | — | Dùng `#tabs` làm reference | — |

## C. Icon — 4 hệ song song

| Hạng mục | Hệ 1 | Hệ 2 | Hệ 3 | Hệ 4 | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|---|---|---|---|
| Vị trí | `assets/app/main.js:46-57` | `assets/h2dev-core.js:15-26` | SVG inline ad-hoc | Emoji/Unicode | **4 hệ song song** | **1 hệ duy nhất** = `main.js` `ICONS` | P0 |
| Số lượng | 10 SVG | 9 SVG + **2 emoji** | `content.js:836-841` (5 icon 10×10), `nav.js:46`, `player.html:26,168`, `index.html:231,282` | **78 code point, ~338 lần** | Hệ 4 lớn nhất & mất nhất quán | Chỉ SVG từ `ICONS` | P0 |
| Size | `w-4 h-4` (16px) | 12px / 18px / 16px **lẫn lộn** | 10×10 | đa dạng | **12 mức**: 10, 11, 12, 15, 16, 17, 18, 20, 24, 25.6, 28, 30px | Thang cố định **14 / 16 / 20 / 24px** | P0 |
| Màu | `stroke="currentColor"` ✅ | `fill="currentColor"` ✅ | ad-hoc | emoji đa màu | ≥10 hex hardcode, >25 mã màu | `currentColor` bắt buộc cho mono | P0 |
| Emoji trong code | — | `check:'✓'`, `eye:'👁'` | — | 78 code point | Emoji lẫn vào object icon | Thay bằng SVG chuẩn | P0 |
| Trùng nghĩa | — | — | — | `✓`(9) vs `✅`(15); `🔍` vs `🔎`; `🔴` vs `🟠` | 3 cặp trùng nghĩa | Gộp mỗi cặp còn 1 | P1 |
| Đa nghĩa | — | — | — | `📋` (25 lần) mang **2 nghĩa** | 1 icon 2 nghĩa | Tách thành 2 icon có tên rõ | P1 |
| Token chết | — | — | — | — | `viddar.css:428` dùng `var(--brand-ink-ink)` — **không tồn tại** | Grep `:root` trước khi dùng biến | P0 |
| Ép màu đồng loạt | — | — | — | — | `viddar.css:1292` ép `color: var(--brand-ink) !important` cho **mọi** `.stat-icon` → mọi KPI cùng màu hồng | Cấm `!important` áp màu brand lên cả nhóm icon | P0 |

## D. Typography

> **CẬP NHẬT 2026-09-24 (P3.7 HOÀN TẤT):** các dòng dưới đây đã được **sửa xong và kiểm chứng**.
> Bằng chứng: gate `scripts/gate-typography.js` **ALL PASS** 4 luật (có PROBE 16/16) +
> visual test browser thật **44/44 lượt** (2 môi trường × 2 viewport × 11 màn hình)
> → `size lạ = 0`, `tràn ngang = 0`, `console error = 0`. Deploy bản `?v=20260924-p40`.
>
> **Tổng vi phạm đã sửa: 254 chỗ** (không phải 43 như ước tính ban đầu — xem `AGENTS.md` SCAR-015):
> 43 (CSS `px`) + 48 (`text-[Npx]` trong JS) + 133 (`font-size: Nrem` inline) + 30 (`font-weight:800`).

| Hạng mục | index | learn | player | Tabs khác | Hiện trạng (SAU P3.7) | Chuẩn bắt buộc | Trạng thái |
|---|---|---|---|---|---|---|---|
| Bậc font-size dùng được | ✓ | ✓ | ✓ | ✓ | **8 bậc đang dùng**: 11, 12, 13, 14, 16, 18, 20, 24px | Thang chuẩn **9 bậc**: 11/12/13/14/16/18/20/24/32px | ✅ **XONG** |
| Bậc lẻ tùy tiện | ✓ | ✓ | ✓ | ✓ | **0** — đã xoá hết 12 bậc lẻ (9, 9.5, 10, 10.5, 11.5, 12.5, 13.5, 14.5, 15, 17, 22, 26px) | Cấm toàn bộ | ✅ **XONG** |
| Tailwind arbitrary | ✓ | ✓ | ✓ | ✓ | **0 `text-[Npx]`** — đã chuyển 115 class sang tên chuẩn (`text-2xs/xs/sm/base/md/lg/xl/2xl/3xl`) + khai `safelist` + `fontSize` scale | Dùng class chuẩn, cấm arbitrary | ✅ **XONG** |
| font-weight | ✓ | ✓ | ✓ | ✓ | **0 vi phạm** — đã xoá `650`(4), `800`(7 CSS + 30 inline), `900`(1), `font-extrabold`, `font-black` | Chốt **400/500/600/700** | ✅ **XONG** |
| line-height | ✓ | ✓ | ✓ | ✓ | **21 giá trị**: 1, 1.1, 1.15, 1.2, 1.25, 1.28, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.625, 1.65, 1.75, 1.375, 2, 2.25, 20px | Chốt 6: `1` / `1.2` / `1.35` / `1.5` / `1.6` / `20px` | ⬜ **CÒN NỢ** |
| letter-spacing | ✓ | ✓ | ✓ | ✓ | **20 giá trị**, cùng giá trị viết nhiều kiểu (`0.08em`/`.08em`, `-0.02em`/`-.02em`) | Chốt 4: `0` / `-0.02em` / `0.02em` / `0.04em`; viết đủ `0.`; **cấm `!important`** | ⬜ **CÒN NỢ** |
| Mono cho tiếng Việt | — | — | — | — | Mono chỉ còn ở `.badge` (mã định danh) | Mono **chỉ** cho số/SKU/code | ✅ **XONG** |
| Heading mục | ✓ | ✓ | ✓ | ✓ | 3 hệ: `.page-h2` 16px / `text-base font-bold` / `text-sm font-bold` | Chốt **`.page-h2` 16px** | ⬜ **CÒN NỢ** |
| Căn chỉnh | ✓ | ✓ | ✓ | ✓ | `text-center` 16 lần vs `text-left` 10 lần, cùng loại card chỗ khai báo chỗ không | Chốt theo loại card: nội dung trái, KPI giữa | ⬜ **CÒN NỢ** |
| Empty state typography | ✓ | ✓ | — | ✓ | 4 empty-state có **3 biến thể** padding/bọc khác nhau | Chốt 1 biến thể duy nhất | ⬜ **CÒN NỢ** |

## E. Layout / Spacing theo tab

| Hạng mục | Tổng quan | Video | Ngách xanh | Tài liệu | Nguồn reup | Kênh mẫu | Raw kênh | Chiến lược | Lộ trình | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Banner | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | 2 tab thiếu banner | **8/8 tab có banner** | P0 |
| Search | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | 2 tab thiếu search | **8/8 tab có search** | P0 |
| Filter | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | 2 tab thiếu filter | **8/8 tab có filter** | P0 |
| Empty state | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ (mất khung `.card`) | ✗ | ✗ | ✓ | 3 tab thiếu; Kênh mẫu mất khung | **8/8 tab có empty state bọc `.card`** | P0 |
| Stat card (số lượng) | 4 | 4 | 4 | 4 | 4 | **5** | **7** (bị `pageBanner` cắt còn 4 trên mobile → **mất 3 chỉ số**) | 4 | 4 | 3 giá trị: 4/5/7 | **4** cho mọi tab; cấm `pageBanner` cắt chỉ số | P0 |
| Margin-bottom khối đầu | `mb-6` | `mb-4` (filter) | `mb-6` | `mb-5` | `mb-5` | `mb-5` | `mb-5` | `mb-4` | `mb-5` | 3 giá trị lẫn lộn | Chốt **`mb-6` (24px)** | P1 |
| Padding card desktop | `p-3.5`/`p-4`/`p-4 sm:p-5`/`p-5`/`p-5 sm:p-6` | ← | ← | ← | ← | ← | ← | ← | ← | **5 hệ** | Chốt **`p-4 sm:p-5`** | P1 |
| Grid gap | — | — | — | `gap-4` | `gap-4` | **`gap-3`** | — | 6 lưới khác nhau trong 1 tab | — | Kênh mẫu lệch; Chiến lược 6 lưới | Chốt **`gap-4`** mọi lưới | P1 |
| Pagination | ✗ | ✗ (140 bài render 100%) | ✗ | ✗ | ✗ | ✗ (render 100%) | ✓ (`PAGE_SIZE=24`) | ✗ | ✗ | **CHỈ Raw kênh có** | **PAGE_SIZE=24** cho mọi danh sách dài | P0 |
| Cấu trúc mở đầu tự chế | `.tq-head` tự viết | — | — | — | — | — | — | 6 lưới riêng | reset padding về 0 | Tổng quan + Chiến lược + Lộ trình lệch | 8 khối cấu trúc chuẩn | P0 |
| Nút CTA | — | — | — | **2 nút tím `bg-purple-600` trùng chức năng** | — | — | **4 màu nút trong 1 card** | — | — | **5 tổ hợp class** cho cùng hành động | Bộ class `.btn-*` chuẩn; cấm trùng CTA | P1 |
| Container ngoài | `#content{max-width:min(1120px,100%);padding:28px}` | ← | ← | ← | ← | ← | ← | ← | **reset về 0** | 3 hệ: index / Lộ trình reset 0 / player `max-w-5xl px-4` | Chốt `min(1120px,100%)` + `28px`/`16px` | P1 |

## F. Surface, Modal, z-index

| Hạng mục | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|
| Số modal hoạt động | 6 modal + **1 CSS dead** | 6 modal, gỡ CSS dead | P2 |
| `#raw-channel-modal` | CSS ở `index.html:19-47`, **không có JS/DOM** | **Xóa CSS dead** | P2 |
| `moreMenuSheet` (`nav.js:73-95`) | **Thiếu toàn bộ**: `role`, `aria-modal`, `aria-label`, focus trap, `ESC` | Đủ 7 yêu cầu a11y modal | P0 |
| Khôi phục focus khi đóng modal | **CẢ 6 MODAL ĐỀU KHÔNG** | **Bắt buộc** khôi phục focus (**WCAG 2.4.3**) | P0 |
| Số giá trị z-index | **15 giá trị** khác nhau | Z-index ladder 8 bậc | P0 |
| `docModal` (player) | `9999` còn modal khác `99999`-`100005` | `--z-modal:1000` cho mọi modal | P0 |
| `.toast-msg` | `100` → **DƯỚI modal** → toast bị che khi copy trong `docModal` | `--z-toast:300` (trên modal) | P0 |
| `.more-menu-sheet` | `60` → dưới bottom-nav `100` | `--z-drawer:60`, nếu bị phủ thì nâng lên `100` | P1 |
| Backdrop blur | **4 mức**: 8/10/12px | Chốt **`blur(10px)`** | P1 |
| Alpha overlay | **3 mức**: 0.85/0.88/0.92 | Chốt **`0.92`** | P1 |
| Nền panel | **4 mã**: `#0b0f19`/`#0f172a`/`#111827`/`#070a12` | Token `--surface` / `--surface-2` | P1 |
| Bottom-sheet mobile | Chỉ áp **5 ID**; **bỏ sót `#quick-video-modal`** | Áp cho **mọi** modal | P1 |
| `#raw-image-modal` | **Thiếu selector panel con** | Bổ sung selector panel | P2 |
| `docModal` bottom-sheet | **Không có** (player không nạp CSS index) | Bổ sung CSS bottom-sheet cho player | P2 |
| `background-image` trên nút | `content.js:1640` gradient bị `viddar.css:574` ép `none !important` → mất gradient | Cấm class gradient cho nút | P2 |

## G. Responsive & Touch target

| Hạng mục | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|
| Breakpoint `viddar.css` | **8 mốc**: 640/720/768/900/1024/1100/1200/1280 | **640/1024/1280** | P0 |
| Breakpoint `learn.css` | **CHỈ có 720** | **640/1024/1280** | P0 |
| Breakpoint `player.css` | 640/1023 | **640/1024/1280** | P0 |
| Breakpoint `g3-inline.css` | **KHÔNG có `@media` nào** | Bổ sung theo bộ chuẩn | P1 |
| Breakpoint inline `index.html` | chỉ 640 | Gộp về bộ chuẩn | P2 |
| Lỗi dải 641-720px | `learn` vẫn desktop, `index`/`player` đã mobile | Đồng nhất ở `640px` | P0 |
| Rule tablet 721-1024 của learn | **KHÔNG CÓ** | Bổ sung rule tablet `640-1023px` | P1 |
| `.lesson-watch` | **`36px → 30px`** khi mobile (CO NHỎ) | **≥ 44px**, cấm co nhỏ | P0 |
| `.tabbar .tab-btn` | **`36px → 34px`** khi mobile (CO NHỎ) | **≥ 44px**, cấm co nhỏ | P0 |
| `.search-clear` | 24px | **≥ 44px** | P1 |
| `.sec-toggle` | 30px | **≥ 44px** | P1 |
| `.row-fav` | 32px | **≥ 44px** | P1 |
| `#btn-back-to-top` | 38px | **≥ 44px** | P1 |
| Nút X modal | ~30px | **≥ 44px** | P1 |

## H. Thông báo & Loading

| Hạng mục | index.html | learn.html | player.html | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|---|---|---|
| Toast | **KHÔNG** | **KHÔNG** | có `showToast` + `#toast-box` | **5 hệ thông báo** | **1 hệ toast toàn dự án** (`#toast-box` + `showToast`) | P0 |
| `aria-live` cấp trang | có `#a11y-status` | chỉ trên panel | **KHÔNG** | Không trang nào có **đủ cả hai** | **Đúng 1** `aria-live` cấp trang + hệ toast | P0 |
| `alert()` native | **CÓ dùng** | — | — | Phá vỡ trải nghiệm | **Cấm** | P0 |
| Loading | **11 kiểu khác nhau** | ← | ← | 11 kiểu | 1 spinner chuẩn + skeleton | P1 |
| Spinner thật | — | — | `player-main.js:788` | Chỉ 1 chỗ | Chuẩn hóa toàn dự án | P1 |
| `aria-busy` | CÓ | **KHÔNG** | **KHÔNG** | 1/3 trang | Bổ sung mọi trang | P2 |
| Skeleton | **KHÔNG Ở ĐÂU** | **KHÔNG** | **KHÔNG** | 0 chỗ | Bổ sung cho danh sách card | P2 |

## I. Token & Code Smell

| Hạng mục | Hiện trạng | Chuẩn bắt buộc | Ưu tiên |
|---|---|---|---|
| Token vòng lặp | `learn.css:2-20`: `--bg: var(--bg, #050505)`, `--font-mono: var(--font-mono, ...)` | Gỡ self-reference | P2 |
| Token trùng chức năng | `learn.css` tạo `--pri/--sec/--war/--ok/--panel/--line/--txt/--mut/--font-heading/--font-body` trùng `viddar.css` | Hội tụ về 1 nguồn token (`viddar.css`) | P2 |
| Token font lệch | `learn.css:17` `--font-heading` | Gỡ, dùng `--font-display` | P2 |
| Biến chết | `viddar.css:428` `var(--brand-ink-ink)` | Grep `:root` trước khi dùng | P0 |
| Radius trùng giá trị | `--r-md:4px`, `--r-lg:4px` | Giữ nguyên (bất biến) nhưng ghi chú để tránh nhầm là lỗi | P3 |
| `!important` tràn lan | `viddar.css` ép `background-image`, `box-shadow`, `color` bằng `!important` | Cấm `!important` cho letter-spacing; hạn chế tối đa cho color | P2 |

---

## Top 20 việc phải sửa (theo thứ tự ưu tiên)

| # | Việc | Ưu tiên | Lý do |
|---|---|---|---|
| 1 | Gộp **4 hệ icon** về 1 hệ `ICONS` (`main.js`), xóa **78 emoji** và 2 emoji trong `h2dev-core.js`, chốt thang `14/16/20/24px` | **P0** | Icon là thứ xuất hiện nhiều nhất và lộ liễu nhất; **~338 lần** emoji và **12 mức size** là nguồn rời rạc lớn nhất |
| 2 | Sửa `viddar.css:428` (`--brand-ink-ink` không tồn tại) và `viddar.css:1292` (ép màu brand cho mọi `.stat-icon`) | **P0** | Biến chết gây icon mất màu; ép màu làm mọi KPI cùng 1 màu hồng → mất phân biệt trạng thái |
| 3 | Hoàn thiện shell `player.html`: thêm **footer**, **back-to-top (element + JS)**, **skip-link** | **P0** | player đang thiếu 3/6 thành phần shell; trải nghiệm "cụt" so với 2 trang kia |
| 4 | Hoàn thiện shell `learn.html`: thêm **skip-link**, footer thêm **`border-top`** | **P0** | learn thiếu skip-link; footer thiếu border → lệch thị giác với index |
| 5 | Hội tụ **3 hệ điều hướng** về 1 chuẩn ARIA (`role=tablist/tab`, `aria-selected`, `aria-controls`, roving tabindex, arrow-key) | **P0** | learn thiếu 3/6 thuộc tính, player thiếu 2/6; điều hướng là đường vào mọi nội dung |
| 6 | Chốt **z-index ladder 8 bậc**; sửa `.toast-msg` (100→300), `docModal` (9999→1000), `.more-menu-sheet` (60) | **P0** | Toast đang bị modal che → người dùng copy không thấy phản hồi; 15 giá trị rải rác |
| 7 | Thêm **focus trap + ESC + khôi phục focus** cho **cả 6 modal** + `moreMenuSheet` | **P0** | Vi phạm **WCAG 2.4.3**; `moreMenuSheet` thiếu toàn bộ a11y |
| 8 | Chốt **breakpoint 640/1024/1280**; sửa `learn.css` (720→640), `player.css` (1023→1024), bổ sung `@media` cho `g3-inline.css` | **P0** | Dải **641-720px** cho ra 2 giao diện khác nhau trên cùng thiết bị — lỗi nghiêm trọng |
| 9 | Chốt **thang font-size 9 bậc**, xóa **11 bậc lẻ**, cấm arbitrary mới | **P0** | 20 bậc font + 42% arbitrary là nguyên nhân chính gây "chữ chỗ to chỗ nhỏ" |
| 10 | Chốt **font-weight 400/500/600/700**; xóa `650`, `extrabold`(800), `black`(900) | **P0** | `@font-face` chỉ khai báo `400 700` → weight vượt khai báo bị synthetic-bold, chữ giả |
| 11 | Chuẩn hóa **cấu trúc mở đầu 8 khối** cho mọi tab; bổ sung banner/search/filter/empty-state cho **Tổng quan** + **Chiến lược** | **P0** | "Chỗ này có thì chỗ khác cũng có" — 2 tab đang thiếu 4/8 khối |
| 12 | Chốt **stat card = 4** cho mọi tab; sửa **Kênh mẫu (5)** và **Raw kênh (7, mất 3 chỉ số trên mobile)** | **P0** | Raw kênh đang **mất dữ liệu hiển thị** trên mobile do `pageBanner` cắt |
| 13 | Bổ sung **pagination `PAGE_SIZE=24`** cho Video (140 bài)/Nguồn reup/Kênh mẫu | **P0** | Render 100% gây tải nặng và trải nghiệm cuộn vô tận |
| 14 | Chốt **1 hệ thông báo**: `#toast-box` + `showToast` toàn dự án, thêm `#a11y-status` cho player/learn, **cấm `alert()`** | **P0** | 5 hệ thông báo; `alert()` native phá trải nghiệm; không trang nào có đủ toast + aria-live |
| 15 | Nâng **touch target ≥ 44px**, đặc biệt chặn việc **co nhỏ control trên mobile** ở learn (`.lesson-watch` 30px, `.tab-btn` 34px) | **P0** | Learn đang **thu nhỏ** nút trên mobile — ngược hoàn toàn với nguyên tắc; dễ bấm sai |
| 16 | Chốt **bộ class nút `.btn-*`**; xóa 5 tổ hợp tự chế; xóa 2 nút tím `bg-purple-600` (Tài liệu); gộp 4 màu nút (Raw kênh) | **P1** | 5 tổ hợp cho cùng hành động + 2 CTA trùng chức năng phá nguyên tắc "1 CTA brand/view" |
| 17 | Chốt **hệ spacing** (`4/8/12/16/24/32`), **section gap `mb-6`**, **padding card `p-4 sm:p-5`**, **grid gap `gap-4`** | **P1** | 3 giá trị margin-bottom + 5 hệ padding + lưới lệch `gap-3`/`gap-4` |
| 18 | Chốt **1 hệ panel nền**, **1 backdrop blur (10px)**, **1 alpha overlay (0.92)**; xóa 4 mã nền `#0b0f19`/`#0f172a`/`#111827`/`#070a12` | **P1** | 4 mã nền panel + 4 mức blur + 3 mức alpha → mỗi modal một vẻ |
| 19 | Chốt **line-height (6 giá trị)** + **letter-spacing (4 giá trị, 1 cách viết)**; xóa `!important` cho letter-spacing | **P1** | 17 giá trị line-height và 14 giá trị letter-spacing; cùng giá trị viết 3 kiểu |
| 20 | Gỡ **mono khỏi text tiếng Việt** (`viddar.css:466`, `learn.css` `.ltag`, `content.js:99,115`); chốt **heading `.page-h2`**; xóa **CSS dead** `#raw-channel-modal` | **P2** | Mono không tối ưu cho dấu tiếng Việt; 3 hệ heading; CSS dead gây nhầm lẫn |

---

## Trạng thái tổng hợp

| Miền | Số hạng mục không đạt | Ghi chú |
|---|---|---|
| A. Shell | 16 | Nặng nhất: player thiếu footer + back-to-top + skip-link |
| B. Điều hướng | 6 | learn thiếu `aria-controls` + roving tabindex + arrow-key |
| C. Icon | 10 | Nặng nhất toàn hệ thống |
| D. Typography | 11 | 20 bậc font + weight ngoài `@font-face` |
| E. Layout/Spacing | 12 | 2 tab thiếu banner/search/filter/empty-state |
| F. Surface/Modal | 15 | Mọi modal thiếu khôi phục focus |
| G. Responsive/Touch | 14 | Learn co nhỏ control trên mobile |
| H. Thông báo/Loading | 7 | 5 hệ thông báo, 0 skeleton |
| I. Token/Code smell | 6 | Token vòng lặp + biến chết |

**Chỉ được báo cáo hoàn thành khi cả 3 vòng kiểm định (đĩa/ffprobe → code & frontend → dual-environment Local + VPS HTTP 200) đạt 100% Check-Pass.**
