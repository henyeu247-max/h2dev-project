---
name: "H2DEV Design System"
---

# H2DEV Design System

Đây là **luật thi công**. Mọi lần sửa UI trong dự án H2DEV — dù chỉ đổi 1 nút hay thêm 1 tab — **bắt buộc** tuân theo file này. Khi có xung đột giữa sở thích cá nhân, thói quen cũ trong code, và file này: **file này thắng**.

Phạm vi: Dark-mode only · brand `#E2023A` · tiếng Việt · web tĩnh.

## Library Layout

```
H2DEV-Project/
├── design-system/
│   ├── README.md               # Phạm vi gói, known limitations, authoring rules
│   ├── SKILL.md                # LUẬT THI CÔNG (file này)
│   ├── consistency-matrix.md   # Đối soát hiện trạng → mục tiêu + Top 20 việc phải sửa
│   ├── tokens.json             # Token projection (canonical + proposed)
│   └── uikit-plan.json         # Blueprint chuẩn hóa theo page/tab
├── index.html                  # Shell 1: sidebar + bottom-nav + 10 tab
├── learn.html                  # Shell 2: Lộ trình học
├── player.html                 # Shell 3: trình phát bài học
├── assets/
│   ├── viddar.css              # Token nguồn (:root) + app chrome
│   ├── learn.css               # CSS riêng learn (đang trùng token — sẽ gỡ dần)
│   ├── player.css              # CSS riêng player
│   ├── tailwind.css            # Utility build sẵn (kèm override !important)
│   ├── g3-inline.css           # CSS inline phụ trợ (không có @media)
│   ├── h2dev-core.js           # Core dùng chung learn + player (còn 2 emoji icon)
│   ├── music_player_modal.js   # Modal nhạc nền
│   └── app/
│       ├── main.js             # ICONS object — HỆ ICON CHUẨN
│       ├── player-main.js
│       └── tabs/
│           ├── content.js      # Render 10 tab
│           └── nav.js          # Điều hướng, moreMenuSheet
├── data-tabs/*.json            # Dữ liệu SSoT 10 tab
└── data/*.json                 # Catalog, counts-manifest, music_catalog
```

## Source Boundary

Skill này vận hành trên các file thực tế của `D:\YTB\H2DEV-Project`. Bộ tài liệu `design-system/` là **hợp đồng quy chuẩn**, không phải bằng chứng thiết kế gốc. Không giả định có Figma, design source, hay tài liệu upstream nào khác.

Phân biệt rõ 2 loại dữ kiện:

- **`status: "canonical"`** — đã xác minh runtime trong code (ví dụ token trong `assets/viddar.css:51-80`). Đây là **bất biến**, không được sửa giá trị.
- **`status: "proposed"`** — chuẩn hóa đề xuất, **chưa tồn tại** trong code (spacing scale, z-index ladder, breakpoint set, motion). Phải triển khai theo lộ trình rồi mới chuyển thành canonical.

`consistency-matrix.md` ghi **hiện trạng** (trạng thái xấu) và **chuẩn bắt buộc** (trạng thái đích). Không đọc nhầm hiện trạng thành thiết kế mong muốn.

## Required Consumption Order

1. Đọc `README.md` để nắm phạm vi, known limitations, và authoring rules.
2. Đọc `SKILL.md` (file này) để nắm **luật thi công**. Không được viết UI trước khi đọc.
3. Đọc `tokens.json` để lấy giá trị token. Chỉ dùng token có trong file, không tự chế.
4. Đọc `consistency-matrix.md` để biết hạng mục mình sắp sửa đang ở mức ưu tiên nào và chuẩn bắt buộc là gì.
5. Đọc `uikit-plan.json` để biết page/tab đó cần đủ những component nào.
6. Đọc `assets/viddar.css` (`:root` + các class `.card`, `.badge-*`, `.page-h2`, `.stat-icon`) để lấy markup atom có sẵn.
7. Chỉ đọc `assets/app/tabs/content.js` + `assets/app/main.js` khi cần biết chi tiết hiện thực.

## Design Principles

- **Dark-mode only, không thương lượng.** Không thêm Light-mode, không theme toggle, không `prefers-color-scheme` để đổi theme. Dark là bản sắc, không phải một biến thể.
- **Token-first.** Mọi quyết định về màu, radius, khoảng cách, typography **phải** resolve về token có tên. Cấm hex thô, cấm `rgba()` thô, cấm số ma thuật.
- **Một việc — một hệ.** Nếu đã có hệ cho việc gì (icon, nút, badge, toast, modal) thì **cấm tạo hệ thứ hai**. Đây là luật gốc chống rời rạc.
- **Im lặng mặc định.** Bề mặt trung tính, viền tiết chế, typography gánh phân cấp. Brand đỏ chỉ dùng khi hành động hoặc trạng thái **thực sự** cần.
- **Typography-first, trang trí sau cùng.** Giải bài toán phân cấp bằng nội dung, bố cục, cỡ chữ, độ đậm, khoảng cách — **trước khi** thêm icon hay minh họa.
- **Đối xứng có chủ đích.** "Chỗ này có thì chỗ khác cũng phải có." Mọi tab cùng cấp phải có cùng cấu trúc mở đầu. Không có tab đặc quyền, không có tab bị bỏ rơi.

## Brand Essentials

| Hạng mục | Token / Giá trị | Ghi chú |
|---|---|---|
| Theme scope | Dark only | `html { color-scheme: dark }` |
| Brand accent | `--brand` = `#E2023A` | Bất biến |
| Brand hover | `--brand-hover` = `#ff1a4d` | Chỉ dùng cho hover/active của brand |
| Brand ink (chữ trên brand) | `--brand-ink` = `#ff8095` | Dùng cho text/icon trên nền brand |
| Brand tint (nền nhạt) | `--brand-tint` = `#2a0a12` | Nền badge/tag brand |
| Page surface | `--bg` = `#050505` | Nền trang |
| Card / panel surface | `--surface` = `#0f0f0f` | Nền card mặc định |
| Nested surface | `--surface-2` = `#1a1a1a` | Nền phần tử lồng trong card |
| Border | `--border` = `#222` | Viền mặc định |
| Body baseline | `14px / 1.5` / `--font-sans` | Inter |
| Display | `--font-display` = `"Space Grotesk"` | **Chỉ** logo/title shell |
| Mono | `--font-mono` = `"JetBrains Mono"` | **Chỉ** số/SKU/code |
| Radius | `--r-md` = `--r-lg` = `4px` | H2DEV là hệ radius góc cạnh |
| Topbar | `--topbar-bg` = `rgba(5,5,5,0.92)` | Nền header chuẩn |
| Focus ring | `--focus-ring` | `0 0 0 2px var(--bg), 0 0 0 4px rgba(226,2,58,.6)` |

## Token And Color Discipline

- Cấm hardcode palette mới, status hue mới, hay overlay alpha tùy hứng. Dùng token.
- Cấm bịa biến không tồn tại. **Case thật đã xảy ra:** `viddar.css:428` dùng `var(--brand-ink-ink)` — biến này **không tồn tại** trong `:root`. Mọi biến dùng trong code phải grep được trong `:root` trước khi commit.
- **Cấm ép màu icon đồng loạt.** **Case thật đã xảy ra:** `viddar.css:1292` ép `color: var(--brand-ink) !important` cho **mọi** `.stat-icon` → toàn bộ KPI card cùng một màu hồng, mất phân biệt trạng thái. Cấm pattern `!important` áp màu brand lên cả nhóm icon.
- Brand đỏ là tài nguyên khan hiếm. Chỉ dùng cho: CTA brand chính, khoảnh khắc nhận diện thương hiệu, và accent trạng thái nhỏ có nghĩa. **Cấm** dùng brand cho hover row, viền inactive, gạch chân tab, hay fill trang trí.
- Trạng thái tương tác trung tính đi theo bậc bề mặt: `--bg` → `--surface` → `--surface-2`. Không nhảy sang màu brand để biểu thị "đang chọn".
- Khi token đã chứa alpha (ví dụ `--topbar-bg`), **không** chồng thêm `opacity`.
- **Cấm chồng `background-image` lên nút.** **Case thật đã xảy ra:** `content.js:1640` dùng `bg-gradient-to-r from-blue-900/60 to-indigo-900/60` nhưng `viddar.css:574` ép `background-image:none !important` → gradient chết, nút thành phẳng. Vì `tailwind.css` + `viddar.css` có override `!important`, **cấm** dùng class gradient cho nút; gradient phải khai báo trong CSS chuẩn của nút.

## Layout And Surface Discipline

- Nền trang = `--bg`. Card/panel = `--surface`. Phần tử lồng trong card = `--surface-2`. Field/inline control = `--surface-2` + `border: 1px solid var(--border)`.
- Sâu bề mặt từng cấp một. **Cấm** đặt panel `--bg` lồng trong container `--surface` vì nó cắt xuyên bề mặt.
- Padding trang: `28px` desktop (theo `#content{max-width:min(1120px,100%);padding:28px}`), giảm về `16px` mobile.
- **Chốt 1 hệ spacing duy nhất (đề xuất).** Thang chuẩn: **4 / 8 / 12 / 16 / 24 / 32px**. Mapping bắt buộc với Tailwind hiện dùng:
  - `4px` = `gap-1`/`p-1` — chỉ cho cặp icon-label, inline control.
  - `8px` = `gap-2`/`p-2` — trong cùng một hàng.
  - `12px` = `gap-3`/`p-3` — giữa card liên quan.
  - `16px` = `gap-4`/`p-4` — giữa nhóm card khác loại.
  - `24px` = `gap-6` — giữa section trong tab.
  - `32px` = `p-8`/`gap-8` — giữa vùng lớn / padding trang.
- **Chốt 1 giá trị section gap.** Dùng **`mb-6` (24px)** cho khối mở đầu của **mọi** tab. **Cấm** `mb-4` / `mb-5` / `mb-6` lẫn lộn như hiện trạng (Tổng quan/Ngách xanh `mb-6` vs Tài liệu/Nguồn reup/Kênh mẫu/Raw kênh `mb-5` vs Chiến lược/Video filter `mb-4`).
- **Chốt 1 hệ padding card.** Dùng **`p-4 sm:p-5`** cho mọi card nội dung. **Cấm** 5 hệ hiện trạng (`p-3.5` / `p-4` / `p-4 sm:p-5` / `p-5` / `p-5 sm:p-6`).
- **Chốt 1 grid gap.** Dùng **`gap-4`** cho mọi lưới card. Kênh mẫu đang dùng `gap-3` trong khi Tài liệu/Nguồn reup cùng template dùng `gap-4` — phải đưa về `gap-4`.
- Tránh container lồng nhau có viền hoặc có nền. **Cấm** đặt `.card` trong `.card`; dùng 1 bề mặt với divider bên trong.
- **Chốt 1 system panel nền.** **Cấm** 4 mã nền panel rời rạc hiện có: `#0b0f19` / `#0f172a` / `#111827` / `#070a12`. Panel modal chỉ dùng `--surface` hoặc `--surface-2`.
- **Chốt 1 backdrop blur + 1 alpha overlay cho modal.** Dùng `backdrop-filter: blur(10px)` và overlay `rgba(0,0,0,0.92)`. **Cấm** 4 mức blur (8/10/12px) và 3 mức alpha (0.85/0.88/0.92) như hiện trạng.

### Z-index Ladder (đề xuất — bắt buộc dùng từ nay)

Hiện trạng có **15 giá trị z-index** khác nhau, nhiều chỗ sai thứ tự gây che khuất. **Chốt thang duy nhất:**

| Bậc | Giá trị | Dùng cho |
|---|---|---|
| `--z-base` | `1` | Nội dung nổi nhẹ trong card (rank badge, duration chip) |
| `--z-sticky` | `20` | Header sticky desktop (`.vd-topbar`, `.app-top`) |
| `--z-fixed` | `40` | Header fixed (`.learn-header`) |
| `--z-drawer` | `60` | Sidebar, more-menu sheet |
| `--z-topbar-mobile` | `100` | Header fixed mobile, bottom-nav |
| `--z-toast` | `300` | Toast, `#toast-box`, `#a11y-status` |
| `--z-modal` | `1000` | Nền modal + panel modal |
| `--z-modal-top` | `1010` | Modal lồng trong modal |

**Sửa 3 lỗi thứ tự bắt buộc:**

1. `.toast-msg` hiện `= 100` → **dưới** modal. Đổi sang `--z-toast: 300` để toast không bị che khi copy trong `docModal`.
2. `.more-menu-sheet` hiện `= 60` → dưới bottom-nav `100`. Đưa về `--z-drawer: 60` nhưng **phải** đảm bảo bottom-nav không phủ; nếu phủ, nâng sheet lên `--z-topbar-mobile: 100`.
3. `docModal` (player) hiện `= 9999` trong khi modal khác `99999`-`100005`. Đưa **tất cả** modal về `--z-modal: 1000`. Cấm giá trị `9999`/`99999`/`100000`/`100001`/`100005` rải rác.

## Typography And Data

- **Chốt thang font-size chuẩn (9 bậc):** `11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 32px`.
  - `11px` — micro label, badge, meta phụ.
  - `12px` — caption, helper text.
  - `13px` — control, table cell, list row dày.
  - `14px` — **body baseline**.
  - `16px` — `.page-h2` (tiêu đề mục), heading card.
  - `18px` — heading lớn trong tab.
  - `20px` — KPI value, heading section.
  - `24px` — heading trang.
  - `32px` — display / hero số lớn.
- **Cấm bậc lẻ.** Danh sách **11 bậc cấm** dùng tiếp: `9`, `9.5`, `10`, `10.5`, `11.5`, `12.5`, `13.5`, `14.5`, `15`, `17`, `22`, `26px`.
- **Cấm arbitrary mới.** Cấm thêm `text-[Npx]` mới. Hiện có ~112 lần arbitrary so với ~152 lần class chuẩn (**~42% tùy ý**); `text-[11px]` một mình dùng **70 lần** → phải chuyển thành class chuẩn `text-[11px]` → `text-xs` hoặc class `.t-micro` định nghĩa 1 lần.
- **Chốt 4 mức font-weight: `400 / 500 / 600 / 700`.** Lý do: `@font-face` trong `viddar.css:5,13,21,29,37,45` chỉ khai báo `"Inter" 400 700`, `"JetBrains Mono" 500 700`, `"Space Grotesk" 500 700`. **Cấm** `font-weight:650`, `font-extrabold`(800), `font-black`(900) — trình duyệt sẽ synthetic-bold, chữ bị giả.
- **Line-height chuẩn hóa.** Chốt **6 giá trị**: `1` (icon-only), `1.2` (heading lớn), `1.35` (heading vừa), `1.5` (body — mặc định), `1.6` (đoạn văn dài đọc), và dạng px là `20px` cho `14px` body. **Cấm** 17 giá trị hiện trạng (`1.1`, `1.15`, `1.25`, `1.28`, `1.3`, `1.4`, `1.45`, `1.55`, `1.625`...).
- **Letter-spacing chuẩn hóa — 1 cách viết duy nhất.** Chốt 4 giá trị: `0` (mặc định), `-0.02em` (heading), `0.02em` (label uppercase), `0.04em` (micro uppercase). **Cấm** 3 kiểu viết cùng giá trị (`0.04em` / `.04em` / `0.04em !important`). **Bắt buộc viết đủ `0.`**, cấm `.04em`. **Cấm `!important`** cho letter-spacing.
- **Mono CHỈ cho số/SKU/code. CẤM cho text tiếng Việt.** **Case thật đã xảy ra:** `viddar.css:466` (`.badge`), `learn.css` badge `FREE/PRO` (`.ltag`), `content.js:99,115` ("Tiến độ học"). Đây là lạm dụng sai mục đích — JetBrains Mono không tối ưu cho dấu tiếng Việt.
  - **Được dùng mono:** mã `VIDEO-00136f`, `MUSIC-041`, `RAW-021`, view count, duration `mm:ss`, %, số liệu KPI dạng bảng, code snippet.
  - **Cấm dùng mono:** tiêu đề, mô tả, nhãn UI (`FREE`/`PRO` phải là font sans weight 600), text trạng thái, nhãn tab.
- Heading mục: **chốt 1 hệ duy nhất `.page-h2` (16px)**. **Cấm** 3 hệ hiện trạng (`.page-h2` 16px / `text-base font-bold` / `text-sm font-bold`).
- Căn chỉnh: **chốt theo loại card.** Card nội dung dạng "đọc" (tài liệu, mô tả) căn trái. Card số liệu dạng "KPI" căn giữa. Cấm cùng loại card chỗ khai báo chỗ không (`text-center` 16 lần vs `text-left` 10 lần).

## Components

Atom chuẩn hiện có — dùng trước khi viết mới:

| Nhóm | Class | Ghi chú |
|---|---|---|
| Surface | `.card` | Nền `--surface`, viền `--border`, radius `--r-lg` |
| Heading mục | `.page-h2` | 16px, weight 600 |
| Badge | `.badge`, `.badge-brand`, `.badge-free`, `.badge-pro` | `.badge-brand` **có tồn tại** trong `assets/tailwind.css` |
| KPI | `.stat-icon`, `.bento-card`, `.bento-grid` | ⚠️ `.stat-icon` đang bị ép màu `!important` — phải sửa |
| Empty state | `.empty-state` | Phải bọc trong `.card`, 4 biến thể hiện tại phải gộp còn 1 |
| Nút | `.btn`, `.btn-primary`, `.btn-ghost` | Xem luật nút bên dưới |
| Modal | `.modal-backdrop` + `.modal-panel` | Xem luật surface |
| Toast | `#toast-box` | Xem luật thông báo |

**Chốt bộ class nút chuẩn — cấm tổ hợp Tailwind tự chế.** 5 tổ hợp hiện tại cho cùng 1 hành động phải gộp về:

```css
/* Nút chuẩn H2DEV — dùng ĐÚNG các class này, không chế biến thêm */
.btn               /* base: inline-flex, gap 8px, min-height 44px, radius --r-md, padding 12px 16px, transition 120ms */
.btn-primary       /* CTA brand: background --brand, color #fff */
.btn-secondary     /* hành động phụ: background --surface-2, border --border, color --fg */
.btn-ghost         /* hành động nhẹ: transparent, border --border, color --fg-muted */
.btn-danger        /* hành động phá hủy: background --surface-2, border --border, color --brand-ink */
.btn-icon          /* nút chỉ icon: 44x44px, cấm dùng cho nút có chữ */
```

**Luật nút bắt buộc:**

1. **Cấm tổ hợp tự chế** kiểu `bg-gradient-to-r from-blue-900/60 to-indigo-900/60` hay `bg-purple-600` — cả 2 đã bị override `!important` làm mất hiệu ứng, và phá nhận diện brand.
2. **Cấm 2 CTA brand trong 1 view.** Nếu 2 hành động ngang cấp, hạ **cả hai** xuống `btn-secondary`.
3. **Cấm 4 màu nút trong cùng 1 card** (lỗi hiện có ở tab Raw kênh).
4. **Cấm 2 nút trùng chức năng** (lỗi hiện có ở tab Tài liệu: 2 nút tím `bg-purple-600`).
5. Nút có chữ **bắt buộc** `min-height: 44px`. Nút chỉ icon **bắt buộc** `44x44px` + có `aria-label`.

## Iconography

Kích thước icon là **kích thước render thực tế** (width × height), không phải `viewBox`.

- **Chỉ dùng 1 hệ SVG thống nhất: `ICONS` object trong `assets/app/main.js:46-57`.** Hiện có 10 icon chuẩn, `class="w-4 h-4"`, `stroke="currentColor"`, render 16px.
- **Cấm thêm emoji/Unicode icon mới.** Hiện trạng có **78 code point, ~338 lần xuất hiện** — đây là nợ lớn nhất về icon. Đặc biệt các cặp trùng nghĩa phải gộp: `✓`(9 lần) trùng nghĩa `✅`(15 lần) → chọn 1; `🔍` vs `🔎` → chọn 1; `🔴` vs `🟠` → chọn 1; `📋`(25 lần) đang mang **2 nghĩa khác nhau** → tách thành 2 icon riêng biệt có tên rõ ràng.
- **Cấm icon font, cấm CDN icon pack, cấm runtime-generated icon.**
- **Thang size icon cố định: `14 / 16 / 20 / 24px`.**
  - `14px` — dày đặc: control nhỏ, menu item, adornment trong input, tag.
  - `16px` — **mặc định**, dùng cho phần lớn trường hợp cùng text.
  - `20px` — icon đứng một mình trong nút icon hoặc row header.
  - `24px` — icon neo thị giác trên card/empty-state.
  - **Cấm** 8 mức size còn lại đang tồn tại: `10`, `11`, `12`, `15`, `17`, `18`, `25.6`, `28`, `30px`.
- **Icon mono phải dùng `currentColor`.** Cấm hardcode `fill="#xxx"` / `stroke="#xxx"` cho icon mono.
- **Cấm hardcode màu icon.** Hiện có ≥10 mã hex hardcode và >25 mã màu khác nhau gán cho icon. Màu icon **phải** kế thừa từ token của control cha (qua `currentColor`).
- **Cấm gỡ icon khỏi Hệ 2 bằng cách thay emoji khác.** `h2dev-core.js:15-26` đang có `check:'✓'` và `eye:'👁'` — **bắt buộc** thay bằng SVG từ `ICONS` chuẩn.
- **Cấm trộn nhiều nguồn icon trong 1 view.** Một tab chỉ dùng 1 nguồn icon.
- Mọi icon trang trí phải có `aria-hidden="true"`. Icon đứng một mình (không có text đi kèm) phải có `aria-label`.
- Mọi placeholder icon phải **reserve sẵn** width/height cuối cùng trước khi asset load, tránh layout shift.

## Component Usage Rules

- Ghép UI mới từ atom chuẩn trước khi viết style cục bộ cho trang.
- **Chốt 1 hệ thông báo toàn dự án:** dùng `#toast-box` + hàm `showToast()` (đang có ở `player.html` / `player-main.js`) làm chuẩn chung, thống nhất API ra toàn dự án.
- **Chốt 1 vùng `aria-live` chung:** mỗi trang phải có **đúng 1** vùng `aria-live` cấp trang (dùng `#a11y-status` làm chuẩn) **và** hệ toast. Hiện trạng: `player.html` có `showToast` nhưng thiếu `aria-live` cấp trang; `index.html` có `#a11y-status` nhưng lẫn `alert()` native; `learn.html` chỉ có `aria-live` trên panel — **không trang nào có đủ cả hai**.
- **Cấm `alert()` native.** Thay bằng toast hoặc `#a11y-status`.
- **Chốt 1 hệ loading:** dùng spinner chuẩn (tham chiếu `player-main.js:788`). **Cấm** 11 kiểu loading hiện trạng. Bổ sung **skeleton** cho danh sách card (hiện **không có skeleton ở đâu**).
- Card dùng bề mặt + viền để tạo độ nổi. **Cấm** thêm box-shadow (đã bị override `box-shadow:none !important` ở `viddar.css:575`).
- Row/menu item/tab/pagination khi được chọn dùng bề mặt trung tính `--surface-2`, **không** dùng fill brand.
- Bảng dùng divider hàng + tag trạng thái inline. **Cấm** tô màu cả hàng để biểu thị trạng thái.
- **Pagination bắt buộc cho mọi danh sách dài.** Chuẩn: `PAGE_SIZE = 24` (đang dùng ở Raw kênh) áp dụng cho **tất cả** danh sách lớn: Video (140 bài), Nguồn reup, Kênh mẫu. **Cấm** render 100% như hiện trạng.
- **Empty state bắt buộc cho mọi tab.** Chuẩn duy nhất: bọc trong `.card`, padding `24px`, căn giữa, 1 câu mô tả + 1 hành động gợi ý. Cấm 3 biến thể padding/bọc và 4 biến thể giọng văn như hiện trạng. `Raw kênh`, `Tổng quan`, `Chiến lược` đang **thiếu hoàn toàn** empty state.
- **Search index bắt buộc** với mọi danh sách: chuỗi tìm kiếm phải bao gồm `t.id` (xem `AGENTS.md` mục 4.3).
- **Cấm hardcode số đếm.** Mọi badge/header đếm phải tính động từ mảng dữ liệu thực.

## Visual Composition

- Ưu tiên ghép component tinh tế hơn minh họa trang trí. Card lớn được lắp từ `.card`, `.badge-*`, `.page-h2`, text style, và đường kẻ 1px.
- **Cấm** nền SVG trang trí, gradient blob, cụm icon làm trang trí, linh vật, hiệu ứng glow, biểu đồ giả, hình khối trừu tượng tùy hứng.
- Nếu buộc phải có minh họa: giữ phẳng, dựa trên token, tiết chế — `currentColor` + tối đa 1 accent brand.
- Biểu đồ/số liệu phải dùng token cho series, trục, nhãn, legend, tooltip, nền. **Cấm** palette biểu đồ tùy hứng.
- **Chốt 1 container ngoài.** Hiện có 3 hệ: `#content{max-width:min(1120px,100%);padding:28px}`, tab Lộ trình reset về 0, player dùng `max-w-5xl px-4` (Tailwind). **Chốt:** `max-width: min(1120px, 100%)` + `padding: 28px` desktop / `16px` mobile cho **mọi** trang. Tab Lộ trình **cấm** reset về 0. Player **cấm** dùng hệ Tailwind riêng.
- **Chốt 1 cấu trúc mở đầu cho mọi tab** (thứ tự bắt buộc):
  1. `pageBanner` (banner tab)
  2. Stat card — **số lượng thống nhất: 4** (đa số). Kênh mẫu đang 5 và Raw kênh đang 7 → phải đưa về 4, hoặc nếu giữ nhiều hơn thì **cấm** để `pageBanner` cắt mất chỉ số trên mobile (**lỗi hiện có: Raw kênh mất 3 chỉ số**).
  3. Search box
  4. Filter
  5. `.page-h2` (tiêu đề mục)
  6. Danh sách / grid card (`gap-4`, `p-4 sm:p-5`)
  7. Empty state (bọc `.card`)
  8. Pagination (`PAGE_SIZE=24`)
- **Cấm tab đặc quyền.** `Tổng quan` (tự viết `.tq-head`, thiếu banner/search/filter/empty-state) và `Chiến lược` (thiếu banner/search/filter) **bắt buộc** bổ sung đủ để đồng cấu trúc.

## Motion And Interaction

- Motion phải ngắn và có chức năng: `120ms` cho hover/focus, `200ms` cho đổi trạng thái component, tối đa `300ms` cho reveal bố cục.
- Ưu tiên `opacity` và dịch chuyển nhỏ. Dịch chuyển ≤ `4px`. **Cấm** `scale` > `1.05`.
- Đổi trạng thái **không** được làm xê dịch hình học. Hover/active/selected/disabled phải giữ nguyên kích thước component.
- Tôn trọng `prefers-reduced-motion`: tắt transition và dịch chuyển không thiết yếu.

## Accessibility

- Duy trì tương phản đọc được: `4.5:1` cho body text, tối thiểu `3:1` cho icon và chữ lớn.
- **Focus phải luôn nhìn thấy.** Dùng `--focus-ring`. **Cấm** xóa focus ring mà không có thay thế tương đương.
- Phần tử tương tác phải reachable bằng bàn phím theo đúng thứ tự thị giác.
- Nút chỉ có icon **bắt buộc** `aria-label`.
- **Touch target tối thiểu `44px` trên mobile.** Hiện trạng vi phạm ở nhiều chỗ và đặc biệt nghiêm trọng ở `learn.html` vì **co nhỏ trên mobile**: `.lesson-watch` `36→30px`, `.tabbar .tab-btn` `36→34px`. Các chỗ khác: `.search-clear` 24px, `.sec-toggle` 30px, `.row-fav` 32px, `#btn-back-to-top` 38px, nút X modal ~30px.
- **Chuẩn modal bắt buộc cho MỌI modal:**
  1. `role="dialog"` (hoặc `alertdialog` cho modal cảnh báo).
  2. `aria-modal="true"`.
  3. `aria-label` (hoặc `aria-labelledby` trỏ tới heading trong modal).
  4. **Focus trap** trong lúc mở.
  5. **`ESC` đóng được.**
  6. **Khôi phục focus** về phần tử đã kích hoạt modal khi đóng. Hiện **cả 6 modal đều không làm** → **vi phạm WCAG 2.4.3**.
  7. Bottom-sheet trên mobile phải áp cho **tất cả** modal. Hiện chỉ áp cho 5 ID, **bỏ sót `#quick-video-modal`**; `#raw-image-modal` **thiếu selector panel con**; `docModal` **không có** vì player không nạp CSS index.
  8. **Cấm modal CSS dead.** `#raw-channel-modal` có CSS ở `index.html:19-47` nhưng **không có JS/DOM** tạo → phải xóa CSS.
- **`moreMenuSheet` (`nav.js:73-95`) bắt buộc sửa:** hiện **thiếu toàn bộ** `role`, `aria-modal`, `aria-label`, focus trap, `ESC`.
- **Shell bắt buộc cho MỌI trang** — mỗi trang phải có đủ **6 thành phần**:

| # | Thành phần | Chuẩn bắt buộc |
|---|---|---|
| 1 | Header | Cao **56px**, `padding: 0 24px`, sticky desktop `--z-sticky:20` / fixed mobile `--z-topbar-mobile:100`, nền `--topbar-bg`, `backdrop-filter: blur(10px)`, `border-bottom: 1px solid var(--border)` |
| 2 | Logo brand | **Cùng 1 dạng**: SVG radar động + wordmark `h2dev` (`--font-display`). **Cấm** ô `.brand-mark` chữ "H2" (đang lệch ở `learn.html` + `player.html`) |
| 3 | Footer | **Cùng cấu trúc** + **bắt buộc `border-top`** + **cùng chuỗi text** ("H2DEV · kho faceless YouTube · không cần đăng nhập"). Sửa 2 lỗi: `learn.html` footer **thiếu `border-top`** và viết "Không cần đăng nhập" chữ K hoa; `player.html` **không có footer** |
| 4 | Back-to-top | **Bắt buộc có element + JS bind** trên mọi trang. `player.html` **thiếu hoàn toàn** (cả element lẫn JS). Kích thước tối thiểu **44px** (đang 38px). Element đặt **cùng vị trí DOM** (ngay trước `</body>`) |
| 5 | Skip-link | **Bắt buộc** trên mọi trang. `learn.html` và `player.html` **thiếu** |
| 6 | Hệ điều hướng | **Cùng chuẩn ARIA**: `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls` + **roving tabindex** + **arrow-key navigation** |

- **Chuẩn ARIA điều hướng — 3 hệ hiện tại phải hội tụ về 1:**
  - `index.html` sidebar `#tabs` — **đủ chuẩn** (dùng làm khuôn mẫu).
  - `learn.html` `.tabbar .tab-btn` — chỉ có `aria-label` + `aria-selected`. **Thiếu** `role=tab`/`tablist`, `aria-controls`, arrow-key.
  - `player.html` `#playerTabSelector` — có `role=tablist` + `role=tab` + `aria-selected`. **Thiếu** `aria-controls` + arrow-key.
- **Chốt 1 hệ title font.** `index.html`/`player.html` dùng `--font-display` (Space Grotesk); `learn.html` dùng `--font-heading` do `learn.css:17` tự định nghĩa (Inter). **Chốt:** title shell dùng `--font-display`. `learn.css` phải gỡ định nghĩa `--font-heading` riêng.

## Breakpoints

**Chốt bộ breakpoint DUY NHẤT cho toàn dự án: `640 / 1024 / 1280px`.**

| Mốc | Ý nghĩa |
|---|---|
| `< 640px` | Mobile |
| `640px – 1023px` | Tablet |
| `1024px – 1279px` | Desktop nhỏ |
| `≥ 1280px` | Desktop lớn |

- **Cấm** dùng 8 mốc hiện có của `viddar.css` (640/720/768/900/1024/1100/1200/1280).
- **Cấm** mốc lẻ `720px` của `learn.css` và `1023px` của `player.css`.
- **Sửa lỗi nghiêm trọng:** dải **641-720px**, `learn.html` vẫn là desktop trong khi `index.html`/`player.html` đã là mobile. Phải đưa `learn.css` về `640px`.
- **Sửa lỗi:** `learn.html` **không có** rule tablet `721-1024` → phải bổ sung rule tablet trong khoảng `640-1023px` mới.
- `g3-inline.css` **không có `@media` nào** → phải bổ sung breakpoint theo bộ chuẩn.
- Inline `@media` trong `index.html` (chỉ 640) phải gộp về bộ breakpoint chuẩn.

## URL And Routing Rules

Bộ luật **bắt buộc** về đường dẫn. Chi tiết đầy đủ + bảng đối soát + checklist check-pass nằm tại `design-system/URL-ROUTING-SPEC.md`; manifest máy đọc tại `design-system/route-manifest.json`. Khi có xung đột giữa thói quen code hiện tại và mục này: **mục này thắng**.

1. **Mọi thứ nhấp được phải có URL.** Tab, sub-tab, filter, phân trang, modal có ngữ cảnh sâu, deep link bài học — **bắt buộc** phản ánh vào `location` qua `history.pushState`. **Cấm** trạng thái "sống" chỉ trong RAM mà URL không biết.
2. **Cấm route chết (404) cho URL đã từng công khai.** Đổi tên route → **bắt buộc** thêm `301`/`302` từ route cũ. Cấm để bookmark cũ rơi vào 404.
3. **Slug phải khớp tên UI, hoặc phải có redirect.** Nhãn tab người dùng nhìn thấy phải suy ra được slug. Vi phạm hiện có: UI "Tài liệu" ↔ `/kichban`, UI "Kênh mẫu" ↔ `/kenh` — phải đổi slug hoặc thêm redirect (xem `URL-ROUTING-SPEC.md` mục 4 và 9.2).
4. **Quy tắc cú pháp URL:** lowercase · không dấu tiếng Việt · từ ghép dùng `-` · **không** trailing slash · **không** viết tắt mơ hồ (`nx`, `qb`, `tl`). Filter/trạng thái lá dùng `?query`, **cấm** dùng `#` cho state chính.
5. **Params phải chuẩn hoá theo `route-manifest.json`.** Cấm tự phát minh param mới ngoài manifest. Tên param lowercase, không dấu. **Giá trị mặc định cấm xuất hiện trên URL.** Mọi giá trị vào query **bắt buộc** qua `encodeURIComponent` (ví dụ `market=🇻🇳 Việt`).
6. **`popstate` phải khôi phục đủ state.** Hiện `main.js:782-792` chỉ khôi phục `tab`/`market`/`niche`, **mất 6** param (`page`, `rn`, `rg`, `rq`, `watch`, `free`) → bug Back/Forward sai trạng thái. **Bắt buộc** viết **1 hàm `readStateFromURL(location)` dùng chung** cho cả lúc init (F5) và `popstate`. Cấm parse 2 nơi khác nhau. Cấm `resetScrollToTop()` vô điều kiện trong `popstate` (phá scroll restore).
7. **`document.title` phải động theo route.** Template: `<Tên mục> — H2DEV` (suffix thống nhất `— H2DEV`). **Bắt buộc** set trong cùng hàm đổi tab (`openTab`). `index.html` hiện **0 chỗ** set title → mọi tab trùng tiêu đề. `player-main.js:258` dùng sai suffix (`H2DEV Project`) → phải đưa về `H2DEV`.
8. **Breadcrumb là dẫn xuất từ URL**, không phải state riêng. Mỗi cấp breadcrumb = 1 URL thật nhấp được (trừ cấp cuối). Cấm breadcrumb trang trí không dẫn đi đâu.
9. **1 URL — 1 trạng thái.** Cấm 2 URL cùng nội dung không có canonical. Trang chủ dùng `/`; `/tongquan` phải có canonical hoặc redirect (xem mục 9.4 spec).
10. **Route detail có ID phải validate.** `/lotrinh/<sku>` với SKU rác **bắt buộc** trả `404` (hoặc `302` về `/lotrinh`), **cấm** trả `200` như hiện trạng. Cấm để BE vứt ID đi rồi FE tự đoán bằng `pathname`.
11. **Đổi route phải cập nhật `route-manifest.json` + `URL-ROUTING-SPEC.md` cùng lượt.** Hai file này phải khớp nhau và khớp `consistency-matrix.md`. Commit đổi route mà không cập nhật 2 file trên = **vi phạm luật thi công**.
12. **Check-pass trước khi ship.** Mọi route phải có dòng trong bảng check-pass (`URL-ROUTING-SPEC.md` mục 8) và PASS `HTTP 200` trên **cả** Local `127.0.0.1:8899` **và** Production `h2dev-learn.tonymmo.com`, kèm verify title/tab active/breadcrumb.

## Authoring Rules

1. Đọc `SKILL.md` trước khi viết UI. Không viết trước, đọc sau.
2. Không hardcode palette mới. Dùng token trong `tokens.json` + `assets/viddar.css` (`:root`).
3. **Không sửa giá trị token hiện có.** `--bg:#050505`, `--brand:#E2023A`, ... là bất biến. Chỉ được **thêm** token mới hoặc gán `deprecated`.
4. Giữ Dark-mode. Không thêm Light-mode, không theme toggle, không `prefers-color-scheme`.
5. Chỉ dùng **1 hệ icon**: `ICONS` object trong `assets/app/main.js`. Thang size `14/16/20/24px`. `currentColor` bắt buộc cho icon mono.
6. Không thêm bậc font-size ngoài thang `11/12/13/14/16/18/20/24/32px`. Weight chỉ `400/500/600/700`.
7. Mono **chỉ** cho số/SKU/code. Cấm mono cho text tiếng Việt.
8. Mọi trang phải có đủ 6 thành phần shell: header, logo, footer, back-to-top, skip-link, hệ điều hướng ARIA chuẩn.
9. Mọi tab phải có đủ 8 khối cấu trúc mở đầu: banner, stat card (4), search, filter, `.page-h2`, grid card, empty state, pagination.
10. Mọi modal phải có đủ 7 yêu cầu a11y: `role`, `aria-modal`, `aria-label`, focus trap, `ESC`, khôi phục focus, bottom-sheet mobile.
11. Touch target tối thiểu `44px` trên mobile. **Cấm** co nhỏ control trên mobile.
12. Dùng z-index ladder đã chốt. Cấm `9999`/`99999`/`100000`/`100001`/`100005`.
13. Dùng bộ breakpoint `640/1024/1280`. Cấm mốc mới.
14. Dùng **1** system panel nền, **1** backdrop blur (`10px`), **1** alpha overlay (`0.92`). Cấm `#0b0f19`/`#0f172a`/`#111827`/`#070a12`.
15. Không `alert()` native. Dùng toast chuẩn + `#a11y-status`.
16. **Không sửa/xóa** file media, `data/`, `data-tabs/`, catalog, server, config.
17. Mọi thay đổi UI phải cập nhật `consistency-matrix.md` cùng lượt. Bốn file `README.md` / `SKILL.md` / `consistency-matrix.md` / `tokens.json` phải **khớp số liệu** với nhau.
18. Không tạo hệ thứ hai cho việc đã có hệ. Nếu thấy mình đang viết cái thứ 3 cho cùng một việc — dừng lại, gộp về hệ đã có.
19. Trước khi ship, kiểm tra **3 vòng**: (1) đĩa & ffprobe, (2) code/schema/frontend search index, (3) dual-environment Local + VPS HTTP 200 & cache-busting.
20. Sau khi hoàn thành, **dọn sạch** script vá 1 lần, script test ad-hoc, file dump trung gian (`*.log`, `*.tmp`).
