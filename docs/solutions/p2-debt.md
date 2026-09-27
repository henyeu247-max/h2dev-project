# P2 — Trả nợ TOKEN + SKELETON + ARIA-BUSY + BOTTOM-SHEET

> Ngày: 2026-09-27 · Phạm vi: **P2 (A→I)** — sau P1 (`faec14d`)
> Nguyên tắc: **bằng chứng TẤT ĐỊNH ở DOM/khai báo + đo runtime**, pixel chỉ phụ trợ (SCAR-027).
> Mọi con số dưới đây **đo được**, không suy đoán. Cách đo ghi ngay cạnh con số.

---

## 1. Nguyên nhân gốc rễ (7 nhóm nợ)

| Nhóm | Nợ | Bản chất |
|---|---|---|
| **F1** | `#raw-channel-modal` | CSS **chết**: 0 DOM, 0 JS tạo. Tồn tại từ trước, chỉ tốn dung lượng + gây nhiễu |
| **F2** | `#raw-image-modal` | Thiếu selector **panel con** (`> div`) trong rule bottom-sheet mobile |
| **F3** | `docModal` (player) | Bị **bỏ sót** hoàn toàn khỏi bottom-sheet mobile |
| **G** | Breakpoint | `index.html` chỉ có `@media (max-width:640px)` — **thiếu** mốc tablet 1024 + desktop 1280 |
| **H1** | `aria-busy` | **Cả 3 trang** đều thiếu (tài liệu matrix ghi SAI là "index đã có") |
| **H2** | Skeleton | **Toàn dự án 0 chỗ** — không có phản hồi khi đang tải |
| **I** | Token | `learn.css` tự khai **15 token trùng chức năng** + **2 token VÒNG LẶP** (`--bg`, `--font-mono`) → resolve **RỖNG** |
| **I4/I4b** | Token chết | `viddar.css:96-104` có 9 "alias tương thích" + `h2dev-tokens.css` có 3 alias — **đều 0 người dùng** |

### 1.1 Nợ NẶNG NHẤT: token vòng lặp resolve thành RỖNG (không phải fallback)
```css
/* learn.css TRƯỚC (dòng 11, 20) */
--bg: var(--bg, #050505);
--font-mono: var(--font-mono, "JetBrains Mono", monospace);
```
CSS custom property **tự tham chiếu chính nó** → giá trị là **invalid**, **KHÔNG** rơi về `#050505`.

**Hệ quả đo được (runtime, git HEAD):**

| Đối tượng | HEAD (lỗi) | Sau P2 | |
|---|---|---|---|
| `--bg` resolve | `(RỖNG)` | `#050505` | |
| `--font-mono` resolve | `(RỖNG)` | `"JetBrains Mono", …` | |
| `body background-color` | `rgba(0,0,0,0)` **MẤT NỀN** | `rgb(5,5,5)` | ✅ |
| `.sec-stats font` | `Inter` (sai) | `JetBrains Mono` | ✅ |
| badge `.ltag` font-size | **14px** (sai) | **11px** | ✅ |
| badge `.ltag` font-family | `Inter` (sai) | **JetBrains Mono** | ✅ |
| badge `.ltag` height | **27px** | **21px** | ✅ |
| `--font-heading` | `"Inter"` (sai) | (đã gỡ, dùng `--font-display`) | ✅ |

Cơ chế nhân quả của dòng `body { font: 14px/1.5 var(--font-body) }`:
`--font-body` = `var(--font-sans, …)` cũng RỖNG → **cả khai báo `font:` shorthand bị hủy** →
`body` mất `font-size:14px` → các con không tự khai (`.ltag`, `.row-seq`, `.row-time`)
rơi về UA default → **badge phình 27px thay vì 21px**. Trên `learn.html` mobile:
**140 row × 6px = +840px? Không** — đo thật: `docH` HEAD `28547` → P2 `28305`, **Δ = −242px**
(phần lớn row 196px không đổi; nhóm row ngắn mới bị ảnh hưởng + header).

---

## 2. Can thiệp kỹ thuật

| File | Thay đổi |
|---|---|
| `index.html` | Xoá **block CSS chết** `#raw-channel-modal` (dòng 24-52); **gỡ** khỏi 2 rule bottom-sheet; **thêm** `#raw-image-modal > div` vào rule 2; thêm `aria-busy="false"` cho `#content`; thêm `@media` tablet 641-1023 + desktop ≥1280 |
| `learn.html` | thêm `aria-busy="false"` cho `#panelRoot` |
| `player.html` | thêm `aria-busy="false"` cho `#playerMain`; 2 khối skeleton tĩnh dùng `.h2-skeleton-item`; `#docModal` blur/overlay → **token** |
| `assets/player.css` | thêm `@media (max-width:640px)` **bottom-sheet cho `#docModal`** |
| `assets/learn.css` | **Xoá toàn bộ block `:root` alias (~26 dòng)**; thay **25 chỗ** alias → token chuẩn |
| `assets/h2dev-components-lesson-row.css` | thay **12 chỗ** alias → token chuẩn |
| `assets/h2dev-primitives.css` | thêm **mục 9 SKELETON**: `.h2-skeleton`, `--title/--text/--thumb/--pill`, `.h2-skeleton-card`, `.h2-skeleton-list` (grid 1/2/3 cột), `.h2-skeleton-item`, `@keyframes h2-skeleton-shimmer`, guard `prefers-reduced-motion` |
| `assets/h2dev-core.js` | thêm `skeletonCard(opts)` + `skeletonList(n,opts)` — **chỉ dùng primitive `.h2-skeleton-*`**, CẤM Tailwind (SCAR-023) |
| `assets/learn.js` | `aria-busy=true` lúc boot trước `loadJSON`; `renderTab()` true→false; `.catch` false; skeleton hiện trước fetch |
| `assets/app/main.js` | `render()` hiện `H2Core.skeletonList(6,{thumb:true,lines:2})` khi `el.children.length===0`; 4 modal `rgba(0,0,0,0.92)`+`blur(10px)` → **token** |
| `assets/app/player-main.js` | `#playerMain` aria-busy true đầu, false khi thành công + `.catch` |
| `assets/viddar.css` | **Xoá 9 token CHẾT** (dòng 96-104); 3 chỗ `blur(10px)` → token |
| `assets/h2dev-shell.css` `assets/player.css` `assets/learn.css` `assets/music_player_modal.js` | `blur(10px)` → `var(--h2-backdrop-blur)` |
| `assets/h2dev-tokens.css` | **Xoá 3 token CHẾT** `--h2-panel-bg/--h2-panel-border/--h2-panel-radius` |
| `scripts/gate-p2.js` | **MỚI** — 7 luật + PROBE 11 injection |
| `scripts/gate-p1.js` | thêm luật **[3b]** cấm blur **viết thô** (kèm PROBE) |
| `AGENTS.md` | thêm **SCAR-029 … SCAR-033** (12 bẫy) |

### 2.1 Bảng ánh xạ token (learn.css → chuẩn)
`--pri`→`--brand` · `--pri-light`→`--brand-hover` · `--pri-dark`→`--red-700` · `--pri-subtle`→`--red-50`
`--sec`/`--panel`→`--surface` · `--panel2`→`--surface-2` · `--war`→`--warning` · `--ok`→`--success`
`--line`→`--border` · `--line-hover`→`--border-strong` · `--txt`→`--fg` · `--mut`→`--fg-muted`
`--font-heading`→`--font-display` · `--font-body`→`--font-sans`

---

## 3. Bằng chứng nghiệm thu (TẤT ĐỊNH)

### 3.1 Vòng 1 — Token runtime (3 trang, `_tmp-p2-tokens.js`)
```
=== /            === [1] 16/16 PASS | [2] token RỖNG/VÒNG LẶP 0 | [3] alias còn sống 0 | body bg=rgb(5,5,5) | --font-mono JetBrains OK | console err 0
=== /learn.html  === [1] 16/16 PASS | [2] 0 | [3] 0 | body bg=rgb(5,5,5) | --font-mono JetBrains OK | console err 0
=== /player.html === [1] 16/16 PASS | [2] 0 | [3] 0 | body bg=rgb(5,5,5) | --font-mono JetBrains OK | console err 0
TOKEN RUNTIME: ALL PASS 3/3 trang
```
**Cách đo [3]:** đọc **khai báo thật trong `:root`** qua `document.styleSheets` (không dùng `getPropertyValue` — nó trả `''` cho cả token không tồn tại **lẫn** token rỗng → **không phân biệt được**, đây là bẫy đã gặp và sửa).

### 3.2 Vòng 1 — Token CHẾT: chứng minh 0 người dùng
`_tmp-p2-alias-usage.js` quét **812 file** (loại `_backup/`, `_archive/`, `.git/`, `_tmp-proof/`, `node_modules/`, `data/`, **file build `tailwind.css`**):
```
--txt 0 | --txt-2 0 | --mut 0 | --line 0 | --line-strong 0
--accent 0 | --accent-2 0 | --bg-card 0 | --bg-hover 0     → 9/9 TOKEN CHẾT
```
Đối chứng grep toàn dự án: **chỉ khớp DUY NHẤT dòng khai báo**. Không JS/HTML nào `setProperty('--txt'…)`.

**Chứng minh xoá là AN TOÀN (đo runtime, không suy đoán):**
```
PROOF OK: xoa token chet KHONG doi bat ky thuoc tinh computed nao
  /               | element 185 | khac 0        /               | element 220 | khac 0
  /learn.html     | element 2926| khac 0        /learn.html     | element 2945| khac 0
  /player.html    | element   63| khac 0        /player.html    | element   61| khac 0
```
→ **0 / 6.400 element** đổi `backgroundColor`+`color`+`borderColor`+`fontFamily`+`fontSize`+`backgroundImage`.

### 3.3 Vòng 1 — Blur hội tụ về token: 0 thay đổi giá trị tính toán
```
PROOF OK: blur hoi tu ve token KHONG doi gia tri tinh toan
  /            mobile 139 khac 0 | desktop 169 khac 0
  /learn.html  mobile 2232 khac 0| desktop 2251 khac 0
  /player.html mobile  41 khac 0 | desktop  43 khac 0
```
**Cách đo:** so `getComputedStyle(el).backdropFilter` + `backgroundColor` **trước/sau**, trên **mọi phần tử có blur hoặc overlay**. Bản "TRƯỚC" lấy từ **`git stash` (bản HEAD thật)**, KHÔNG dùng file backup tự tạo (SCAR-031 bẫy 6, SCAR-032).

### 3.4 Vòng 1 — 6 gate + check-ui-classes
```
gate-p1              EXIT=0  GATE P1: ALL PASS
gate-p2              EXIT=0  GATE P2: ALL PASS
gate-typography      EXIT=0  GATE TYPOGRAPHY: ALL PASS
gate-shell           EXIT=0  GATE SHELL & A11Y: ALL PASS 6/6
gate-icons           EXIT=0  GATE ICONS: ALL PASS
check-ui-classes     EXIT=0  OK — mọi class utility dùng trong HTML đều tồn tại trong CSS thật
```
**PROBE:**
```
gate-p2 --probe → 11/11 luot BAT DUOC | Phuc hoi byte-identical: OK
gate-p1 --probe →  9/9  luot BAT DUOC | Phuc hoi byte-identical: OK
```
Luật mới `gate-p1 [3b]` **lập tức bắt 1 lỗi THẬT**: `player.html:215` `#docModal` dùng `blur(10px)` thô — mọi vòng kiểm trước bỏ sót.

### 3.5 Vòng 2 — Visual: 11 màn × 2 viewport (LOCAL)
```
v mobile  01_tongquan … 11_player   text=138 sizeLe=0 tran=0 zero=0 err=0
v desktop 01_tongquan … 11_player   text=162 sizeLe=0 tran=0 zero=0 err=0
VONG 2 [LOCAL]: ALL PASS 22/22
```
Mỗi lượt đo: `font-size` ngoài thang **=0**, tràn ngang **=0**, phần tử bất thường **=0**, console error **=0**, `aria-busy` **hiện diện**. 22 ảnh PNG lưu `_tmp-proof/shots-p2/`.

**PROD (đo trước deploy):** chỉ khác **`aria-busy MISSING on #playerMain`** — xác minh bằng HTTP: PROD `playerMain` tag = `id="playerMain" tabindex="-1"` (**không có** `aria-busy`), LOCAL = `… aria-busy="false"`. → Đây là **khoảng cách phiên bản (chưa deploy)**, KHÔNG phải lỗi.

### 3.6 Vòng 3 — So ảnh trước/sau + truy gốc 242px
```
desktop_01_index 0.01% | 03_video 0.02% | 09_chienluoc 0.01% | 10_lotrinh 0.26% | 11_player 0.00%
mobile_01_index 0.00% | 03_video 0.00% | 09_chienluoc 0.00% | 10_lotrinh 1.60% | 11_player 0.02%
desktop_12_learn 21.90% | mobile_12_learn 38.72%      ← 2 ảnh DUY NHẤT lệch
```
**Chứng minh KHÔNG phải hồi quy:**
1. Chụp **CÙNG bản code 2 lần** (S1 vs S2) → `learn` = **0.00%**; `03_video` = 0.02%. → phép đo **ổn định**.
2. `learn.html` lệch **lặp lại đúng con số** → có **nguyên nhân xác định**. Đo chiều cao:
```
HEAD: docH(mobile)=28547  rows=140  row cao 196px x126, 120px x12, 118px x1, 103px x1  | TONG row 26357
P2  : docH(mobile)=28305  rows=140  row cao 196px x125, 114px x13, 112px x1,  96px x1  | TONG row 26190
                    Δ = −242px                                      Δ = −167px
```
3. Đo sâu **từng con của row** → tìm ra **CHÍNH XÁC** phần tử lệch:

| Phần tử | HEAD | P2 | Đúng? |
|---|---|---|---|
| `.ltag` badge **height** | **27px** | **21px** | P2 ✅ |
| `.ltag` font-size | **14px** | **11px** | P2 ✅ |
| `.ltag` font-family | `Inter` | **`JetBrains Mono`** | P2 ✅ |
| `.row-seq`/`.row-time` font-size | 14px | **11px** | P2 ✅ |

→ **P2 SỬA BUG THẬT** (badge sai cả font lẫn cỡ chữ do `--font-mono` vòng lặp). Đã xác nhận bằng **ảnh cận cảnh** `CLOSEUP_HEAD_row.png` (badge 14px Inter bè) vs `CLOSEUP_P2_row.png` (badge 11px JetBrains Mono gọn). **CẢI THIỆN, không hồi quy.**

### 3.7 Vòng 3 — gate-p2 luật [7] từ "đỏ giả" về "đúng"
```
Bản đầu : FAIL 17 vi phạm  (12 GIẢ: bậc thang thiết kế --h2-font-3xl/--h2-lh-*/--h2-ls-*/--h2-fw-*/--red-3~500/--h2-motion-slow)
Sau thu hẹp: FAIL  5 vi phạm → cả 5 là NỢ THẬT (--h2-backdrop-blur/--h2-overlay-alpha 0 người dùng)
Sau khi sửa: PASS  0 vi phạm
```

---

## 4. Bảo vệ chống tái phát

| Gate | Luật mới | Bắt được gì |
|---|---|---|
| `scripts/gate-p2.js` **[7]** | Token CHẾT: định nghĩa trong file canonical nhưng **0 lần dùng** (đếm `var(--x` trên mọi file nguồn; có `TOKENS_ALLOWED_SELF_USE` kèm lý do cho bậc thang) | 9 + 3 token chết quay lại |
| `scripts/gate-p1.js` **[3b]** | Cấm blur **viết thô** `10px`/`4px` — phải dùng `var(--h2-backdrop-blur)`/`var(--h2-badge-blur)` | 2 nguồn sự thật cho blur (bắt ngay `player.html:215`) |
| `scripts/gate-p2.js` **[1]** | Token VÒNG LẶP `--x: var(--x,…)` | body mất nền trở lại |
| `scripts/gate-p2.js` **[2]** | Alias trùng chức năng ngoài file canonical | learn.css alias tái sinh |
| `scripts/gate-p2.js` **[3]** | Skeleton thiếu thành phần (regex **có ranh giới**, không `includes`) + **cấm class Tailwind** trong `skeletonCard`/`skeletonList` | skeleton vỡ trên `learn.html` (không nạp tailwind.css) |
| `scripts/gate-p2.js` **[4]** | `aria-busy` trên `#content`/`#panelRoot`/`#playerMain` | mất trạng thái busy |
| `scripts/gate-p2.js` **[5]** | 4 modal phải có bottom-sheet ở **CẢ 2 rule** trong `index.html` | sót `#raw-image-modal` |
| `scripts/gate-p2.js` **[6]** | CSS chết `#raw-channel-modal` | block chết quay lại |
| `scripts/gate-p2.js` **[7] — NÂNG PHẠM VI** | Token chết quét **MỌI file .css sống** (trước chỉ file canonical) | token chết khai ở `learn.css`/`player.css`/`app.css`… |
| `scripts/gate-p2.js` **[8]** | Touch target < 44px (WCAG 2.5.5/2.5.8): **[8a]** `width`+`height/min-height` ≥ 44 · **[8b]** hình nhỏ hơn thì phải có **rule `::after` RIÊNG** ≥ 44×44 · **[8c]** selector phải được **render thật** trong HTML/JS (chống CSS chết) | `.sec-toggle` 30→44 · `.row-fav` vùng chạm 44 · `.search-clear` 24→44 · modal quick-video |
| `scripts/sync-tokens.js --check` + `validate-project.js` | Tài liệu token phải **SINH TỪ CSS** và **khớp 100%**; lệch ⇒ build FAIL | `tokens.json` viết tay trôi 70 token + 4 giá trị sai |

### 4.1 Ba lỗi NGHIÊM TRỌNG của chính GATE, lộ ra nhờ `--probe` (đã vá)
Đây là phần đáng chú ý nhất: **gate báo PASS nhưng KHÔNG hề kiểm gì**. Nếu không chạy PROBE thì **không ai biết**.

| # | Lỗi trong gate | Bằng chứng đo | Hậu quả trước khi vá |
|---|---|---|---|
| **B1** | `stripComments` áp luật comment `//` cho **cả file CSS** | Tỷ lệ ký tự còn lại: `h2dev-tokens.css` **26.3%**, `h2dev-components-lesson-row.css` **63.8%**, `learn.css` 72.5% | Rules [1][2][7] đọc **file bị cắt nát** ⇒ mọi kết luận **vô nghĩa** |
| **B2** | Điều kiện tự-vô-hiệu `tok === ln.trim().split(':')[0].trim()` | `tok` **chính là** kết quả parse của `ln` ⇒ điều kiện **luôn đúng** | **MỌI token bị bỏ qua** ⇒ rule [7] **PASS RỖNG** suốt nhiều vòng |
| **B3** | `extractBlock` + lookbehind sai, và tìm `::after` **trong thân rule gốc** | Block `.row-fav` dài 1002 ký tự, `::after` **không nằm trong đó** (là rule riêng) | Báo "thiếu vùng chạm" **SAI** (dương tính giả); số đo `0×0` |

**Chứng nhận sau khi vá:** `node scripts/gate-p2.js --probe` → **PROBE OK, 16/16 lượt bắt được lỗi tiêm vào**, phục hồi **byte-identical**.

---

## 5. Bài học (SCAR mới)

- **SCAR-031** — 5 bẫy check-pass: token chết đội lốt alias; token "chốt" mà 0 người dùng; luật gate quá rộng ra "đỏ giả"; đo phần tử size-0 **không truy tổ tiên**; so ảnh lệch vì **state bất đồng bộ**.
- **SCAR-032** — `git stash` khi so trước/sau trên working tree bẩn: **bắt buộc đếm lại file sau mỗi `pop`** (P2 = 17 file + 1 untracked), `stash list` phải RỖNG.
- **SCAR-033** — `core.autocrlf=true` làm git in hàng chục dòng cảnh báo LF/CRLF → **che mất** `Saved`/`Dropped`; phải lọc `Select-String -NotMatch 'warning:|LF will be'`.
- **SCAR-034** — `stripComments` áp luật comment `//` cho **CSS** ⇒ **cắt nát file** (đo được: `h2dev-tokens.css` mất **73.7%**). CSS chỉ có comment block; luật `//` **chỉ dành cho JS**.
- **SCAR-035** — Điều kiện tự-vô-hiệu `tok === <chính tok>` ⇒ rule [7] **PASS RỖNG**. PASS với **0 đối tượng** là **dấu hiệu đỏ**, không phải "sạch".
- **SCAR-036** — Gate đọc số đo `0×0` do **lookbehind ăn vào match** + tìm pseudo-element **trong thân rule gốc** (nó là **rule riêng**). Cấm `while(re.exec)` với mẫu khớp **rỗng** (treo vô tận).
- **SCAR-037** — Tài liệu token viết tay **trôi** khỏi mã nguồn (28 ghi vs **98 thật**, 4 giá trị sai) ⇒ **SINH TỪ CSS** + cổng `--check` + chặn drift trong `validate-project.js`. Phép quét sinh tài liệu phải **HERMETIC** (loại `_tmp-*`), nếu không sẽ báo **DRIFT GIẢ**.

---

## 5.1 Nghiệm thu TOUCH TARGET (task cuối P1-P2) — đo runtime

| Đối tượng | TRƯỚC | SAU | Cách đo |
|---|---|---|---|
| `.sec-toggle` | 30×30 (12 chỗ) | **44×44** | `getBoundingClientRect` DOM runtime |
| `.row-fav` | 32×32 (140 chỗ) | hình **32×32** (giữ nguyên, nằm TRÊN thumbnail) + **vùng chạm `::after` 44×44** | `getComputedStyle(el,'::after')` + **hit-test 4/4 điểm** ở vòng ±20px |
| `.search-clear` | 24×24 | **44×44** (input 40→44px để chứa) | DOM runtime (mở tab Tìm kiếm, gõ từ khoá) |
| `#close-quick-video` | 76×31 | **76×44** | DOM runtime sau khi mở modal |
| `#quick-video-modal a` ("Mở YouTube") | 115×29 | **115×44** | DOM runtime sau khi mở modal |

**Kết quả visual:** `8/8 đạt` trên **mobile 390 + desktop 1440** (`learn.html`), `+2/2` modal quick-video ⇒ **10/10**.
**Ghi chú kỹ thuật:** `.row-fav` **KHÔNG** được phóng to hình vì nằm **đè lên ảnh thumbnail** (SCAR-021 — token phải áp **đúng ngữ cảnh**); thay vào đó mở rộng **vùng chạm vô hình**. Phải dịch nút về **sát góc** (`top:0;left:0`) vì `.row-thumb` có `overflow:hidden` sẽ **cắt cụt** vùng chạm (đo được: chỉ còn 41×42 khi để `top:4px`).


---

## 6. Nguồn dữ liệu (đã dọn script tạm, giữ bằng chứng)
- `_tmp-proof/shots-p2/` — 22 ảnh Vòng 2 LOCAL + report JSON
- `_tmp-proof/cmp-p2/` — ảnh S0/S1/S2 so trước/sau + `CLOSEUP_HEAD_row.png` / `CLOSEUP_P2_row.png`
- `_tmp-proof/p2-alias-dead/` `_tmp-proof/p2-i4-blur/` — snapshot computed-style trước/sau (chứng minh 0 thay đổi)
