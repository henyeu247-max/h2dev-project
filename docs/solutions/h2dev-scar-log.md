# H2DEV — Nhật ký bài học (SCAR) của dự án

> Chuyển từ `D:\YTB\AGENTS.md` ngày 2026-10-14 (chuẩn: `AGENTS.md` < 200 dòng, bài học dài đặt ở `docs/solutions/`).
> **Đổi mã:** `SCAR-006…028` → `H2DEV-SCAR-006…028` (cùng số) để không trùng SCAR toàn cục `SCAR-001…018`. Mã `SCAR-0NN` (006–028) còn nằm trong comment của gate/script, báo cáo cũ và `.agents/` được giữ nguyên làm lịch sử; đọc chúng như `H2DEV-SCAR-0NN`. `SCAR-002` trong văn bản dưới đây là luật toàn cục (PowerShell và inline quote).

---

### [H2DEV-SCAR-006] Bẫy "Đổi Dữ Liệu Mà Không Đổi Hàm Render" — Icon Biến Thành Chữ
- **Nguyên nhân:** Khi refactor (đổi emoji → tên icon), dữ liệu đổi (`icon: 'video'`) nhưng hàm render (`statCard()`) vẫn chỉ nhận `<svg>`/HTML → rơi vào nhánh `else` → bọc `<span class="stat-glyph">video</span>` → **in chữ "video" ra màn hình**. Lỗi hở cả desktop lẫn mobile, tồn tại qua nhiều vòng check-pass vì test cũ chỉ đếm "icon > 0" chứ không kiểm **nội dung text**.
- **Dấu hiệu nhận biết:** Thẻ KPI hiện chữ tiếng Anh (`vid eo`, `file -text`, `tv`) đè lên số; hoặc icon biến mất hoàn toàn.
- **Guardrail:**
  1. Đổi kiểu dữ liệu (emoji → tên icon) thì **BẮT BUỘC rà lại MỌI hàm tiêu thụ** dữ liệu đó.
  2. Test phải kiểm **NỘI DUNG**, không chỉ kiểm "phần tử tồn tại". Cấm kết luận PASS chỉ vì `getBoundingClientRect().width > 0`.
  3. Gate tự động `scripts/gate-icons.js` mục **[6]** (key `ICONS.<x>` phải có khai báo) + **[7]** (`stat-glyph` không được chứa tên icon).

### [H2DEV-SCAR-007] Bẫy CSS Selector Chỉ Phủ `<svg>` — Hệ Icon Mới dùng `<span class="h2-icon">`
- **Nguyên nhân:** CSS cũ viết `.stat-icon svg { width:16px }`. Hệ icon mới dùng `<span class="h2-icon">` (**không chứa `<svg>`**) → selector không khớp → span dãn hết cỡ container → **icon đè lên chữ** (lỗi thật ở 390px: `vid eo`/`140`).
- **Đã gặp 12 chỗ** ở `viddar.css`, `h2dev-shell.css`, `h2dev-primitives.css`.
- **Guardrail:** Khi gặp selector dạng `<cha> svg { ... }`, **LUÔN kiểm tra xem hệ icon mới có dùng chung selector đó không**. Cách an toàn: khai báo kép `<cha> svg, <cha> .h2-icon { ... }` và thêm `display:inline-block; min-width/min-height` cho `.h2-icon` (vì nó dùng `mask`, không dùng `width/height`).

### [H2DEV-SCAR-008] Bẫy Auto-detect File Trong Gate — Nhận Diện Thiếu Nguồn Dữ Liệu
- **Nguyên nhân:** Gate lọc file cần kiểm bằng regex chuỗi (`/H2Icons\.NAMES/`) → **chỉ khớp `main.js`**, bỏ sót `content.js` (nó nhận `ICONS` qua `deps.ICONS` từ `main.js` truyền sang). Hậu quả: xóa khai báo icon trong `icons.js` thì **gate VẪN BÁO PASS** — gate hỏng mà không ai biết.
- **Phát hiện được nhờ:** **PROBE gate** (tiêm lỗi giả → xác nhận gate phải FAIL). Nếu không probe, lỗi này vô hình.
- **Guardrail:**
  1. Gate lọc file theo "dấu hiệu chuỗi" phải **đối chiếu kết quả lọc với thực tế** (in ra danh sách file đã lọc để mắt người kiểm).
  2. Ưu tiên **liệt kê tường minh** danh sách file thay vì auto-detect mờ ảo — "fail loud" tốt hơn "pass im lặng".
  3. **MỌI gate mới BẮT BUỘC phải PROBE**: (a) tiêm lỗi → gate FAIL đúng dòng; (b) phục hồi → ALL PASS + file y nguyên. Gate chưa probe = gate không đáng tin.

### [H2DEV-SCAR-009] Bẫy Đo Bằng `curl` Cho Nội Dung Do JS Sinh
- **Nguyên nhân:** `curl` HTML tĩnh chỉ thấy 1 `data-h2i` trên `index.html` (vì đó là **shell rỗng**, 15 tab icon + hàng trăm icon do JS render **sau** khi load). Suýt kết luận sai là "icon không render".
- **Guardrail:** Nội dung do JavaScript sinh **BẮT BUỘC đo bằng browser** (Playwright), không đo bằng `curl`/`Invoke-WebRequest`. Chỉ dùng HTTP client để kiểm **status code / header**, không dùng để kiểm **nội dung render**.
- **Hệ quả phụ đã gặp:** "5 thẻ icon không hiện" thực chất là `#bottom-nav` (`display:none` ở desktop) và `.app-sidebar` (`display:none` ở mobile) — **đúng thiết kế**, không phải lỗi. Phải phân biệt "ẩn theo breakpoint" vs "lỗi thật" trước khi báo.

### [H2DEV-SCAR-010] Bẫy Cloudflare Tự Chèn `beacon.min.js` Phá CSP
- **Nguyên nhân:** Cloudflare bật Web Analytics (RUM) **tự chèn** `<script src=".../beacon.min.js">` vào HTML ở edge. CSP của dự án `script-src 'self'` → chặn → sinh **console error giả** → probe `deep-ui-acceptance.js` báo `10/11` trên PROD nhưng `11/11` trên LOCAL.
- **Guardrail:**
  1. Gặp FAIL chỉ có trên PROD mà LOCAL sạch → **nghi ngay hạ tầng ngoài** (CDN/WAF), nhưng **KHÔNG được bỏ qua**: phải tìm và sửa nếu sửa được.
  2. Tắt bằng API: `PATCH /client/v4/zones/{zone_id}/settings/rum  {"value":"off"}` (token cần `#zone_settings:edit`; **không cần Account ID**).
  3. **PATCH trả `200 success=true` nhưng HTML vẫn còn beacon ~30 giây** (độ trễ lan truyền edge). Phải đợi ~30s rồi **đo lại ít nhất 2 lần** — đừng kết luận API vô dụng.
  4. **Không tin API, phải đo output**: `GET .../settings/rum` báo `off` KHÔNG đồng nghĩa HTML đã sạch.
  5. Các feature Cloudflare khác có thể chèn JS/sửa HTML: `rocket_loader`, `email_obfuscation`, `speed_brain`, `fonts`, `mirage`, `nel`, `zaraz`. Kiểm bằng `GET /zones/{id}/settings/{key}`.

### [H2DEV-SCAR-011] Lỗi 404 Do nginx `location ~ \.*\.(js|css)?$` Nuốt URI Ngoài `/assets/`
- **Nguyên nhân:** `.` trong regex không được escape + `?` khiến `(js|css)?` thành **tuỳ chọn** → regex khớp **mọi URI kết thúc bằng `.js`/`.css`**, kể cả `/scripts/*.js`. `location` này **không có `proxy_pass`** → nginx phục vụ trực tiếp từ disk theo `root`, mà file thật nằm ở `/app/scripts/` → **404** (dù đã push thành công). `/assets/...` thoát nạn nhờ có `location ^~ /assets/` (prefix `^~` thắng regex); `/scripts/` không có nên dẫm bẫy.
- **Dấu hiệu:** "Đã push mà vẫn 404" — tưởng deploy hỏng, thật ra là lỗi routing.
- **Guardrail:**
  1. Khi 1 URL trả 404, phải phân biệt **404 do routing** vs **404 do thiếu file**: `curl` 3 tầng (Node → nginx → Cloudflare) + `ls` file trên disk. Đừng kết luận vội.
  2. Chặn 2 lớp phòng thủ: **Node** (`server.js`, biến `firstSeg === 'scripts'` → 404) **+** nginx (`location ^~ /scripts/ { return 404; }` đặt **trước** location regex).
  3. Bất kỳ endpoint nội bộ nào không phục vụ web đều phải **chặn ở cả 2 tầng**; và phải **verify URL không bị chặn nhầm** (`/design-system/` phải trả 200).

### [H2DEV-SCAR-012] Bẫy Số Liệu Viết Tay Trôi Theo Thời Gian
- **Nguyên nhân:** `docs/WORKING_STATE.md` ghi cứng `153 tài liệu` / `2.003 FTS5` / `38 tracks`, nhưng runtime thật là `157` / `2.014` / `49`. Số viết tay không sinh tự động → trôi khi dữ liệu tăng.
- **Guardrail:** Số liệu trong tài liệu **BẮT BUỘC** lấy từ `data/counts-manifest.json` (sinh bởi `node scripts/sync-counts.js`) và phải ghi **nguồn chứng thực** ngay cạnh con số. Trước khi push, chạy `node scripts/sync-counts.js --check`. Cấm viết số tay không kèm nguồn.

### [H2DEV-SCAR-013] Bẫy Ước Tính Khối Lượng Bằng `grep` Thô (Không Strip Comment)
- **Nguyên nhân:** Báo cáo "còn 26 emoji ở `player.html`, 18 ở `learn.js`…" là **SAI NẶNG**: grep thô tính cả emoji **trong comment** (được phép giữ). Đo lại có strip comment: thực tế chỉ còn **5 emoji ở 3 file**, 12/15 file đã sạch từ trước.
- **Hậu quả:** Thổi phồng khối lượng → dẫn tới quyết định sai (làm thừa, hoặc tưởng dự án bẩn hơn thực tế).
- **Guardrail:** Mọi phép đếm phải **nói rõ đã strip comment chưa**. Dùng công cụ chuẩn có xử lý ngoại lệ (`scripts/gate-icons.js` đã strip comment + có `ALLOWED[]` kèm lý do), cấm tự viết regex đếm mới rồi báo số.

### [H2DEV-SCAR-014] Bẫy Copy Rule `<svg>` Sang `.h2-icon` — Icon Bị Bóp Cứng Size (15px/18px)
- **Nguyên nhân:** Rule CSS viết cho thẻ `<svg>` dùng `width/height: 15px` hoặc `18px`. Với `<svg>` thì vô hại (SVG co giãn được, `stroke` tự scale). Nhưng khi thêm vế `.h2-icon` vào cùng selector, giá trị đó trở thành **BÓP CỨNG**: `.h2-icon` dùng `mask-image` + `background-color:currentColor` + `min-width/min-height`, nên `min-width:15px` **khoá cứng** icon ở 15px.
- **Đã gặp 4 chỗ** ở `assets/viddar.css`: `.bento-card .stat-icon .h2-icon` (15px → 9 icon mỗi tab), `.vd-bottom-nav .tab-btn .h2-icon` (18px → icon `home`), `#moreMenuSheet .h2-icon` (18px `!important`), `.more-menu-sheet .h2-icon` (18px `!important`).
- **Vì sao gate cũ bỏ lọt:** Gate `[5]` chỉ kiểm **size class** (`h2-icon--NN`) trong JS/HTML, **không** kiểm selector CSS. Nên lỗi "icon lệch 1–2px" sống sót qua nhiều vòng check-pass.
- **Bẫy phụ khi ĐO:** `getBoundingClientRect()` trả về **sau transform của cha** → nếu cha có `transform: scale()` thì số đo bị lệch (18px = 16px × 1.125) gây báo động giả. Nhưng **`getComputedStyle().width` KHÔNG bị transform ảnh hưởng** — dùng nó để phân biệt "bị scale" vs "khai báo sai". Trong ca này computed = 15px/18px ⇒ **khai báo sai thật**, không phải scale.
- **Guardrail:**
  1. Khi thêm vế `.h2-icon` vào selector vốn chỉ có `svg`, **TUYỆT ĐỐI KHÔNG copy nguyên giá trị px**; phải đưa về bậc chuẩn **14/16/20/24** (khớp token `--h2-icon-NN`). Chỉ giữ `<svg>` ở giá trị cũ nếu cần.
  2. Gate `scripts/gate-icons.js` mục **[5b]** (thêm 2026-09-24) quét **mọi file CSS**, strip comment, bắt selector chứa `.h2-icon` đặt `width/height/min-*/max-*` bằng px ngoài 14/16/20/24.
  3. **Mọi gate mới BẮT BUỘC PROBE** (đã làm): tiêm `width:17px` → gate FAIL đúng dòng; phục hồi → ALL PASS + file byte-identical + khớp `git show HEAD`.
  4. Khi đo size icon: dùng `getComputedStyle().width/height`, **cấm** dùng `getBoundingClientRect()` làm kết luận duy nhất; nếu 2 số lệch nhau → phải truy `transform` của chuỗi cha trước khi kết luận.

### [H2DEV-SCAR-015] Bẫy "Đo Bằng 1 Đơn Vị / 1 Nguồn" — Typography Ẩn Nấp Ở 5 Nơi Khác Nhau
- **Nguyên nhân:** Khi chuẩn hoá `font-size`, em quét **chỉ file CSS** và **chỉ đơn vị `px`** → tưởng chỉ có 43 vi phạm. Thực tế **tổng cộng 254 vi phạm** nằm rải ở 5 nguồn khác nhau:
  1. **CSS với `px`** — 43 chỗ (bắt được ngay)
  2. **Tailwind arbitrary `text-[Npx]` sinh trong JS** — 48 chỗ (file `.js`, không phải `.css`!)
  3. **Inline style `font-size: Nrem` trong JS/HTML** — 133 chỗ (đơn vị `rem`, không phải `px`)
  4. **`clamp(19px, 2.1vw, 26px)`** — số nằm trong hàm, không phải khai báo `font-size: Npx` đơn giản
  5. **`font-size: 0.6rem`** trong CSS — 9.6px, vừa ngoài thang vừa **ghi đè** class Tailwind do specificity
- **Hậu quả:** Báo cáo "đã xong P3.7" khi mới làm 43/254 = **17%**. Nguy hiểm hơn: tưởng sạch mà runtime vẫn hiện 9.6px / 15.2px / 21.6px / 26.4px.
- **Bằng chứng đo được:** sau khi sửa hết, visual test browser thật 44 lượt (2 môi trường × 2 viewport × 11 màn hình) → `size lạ = 0`.
- **Guardrail:**
  1. **Đo bằng RUNTIME, không đo bằng grep.** Duyệt DOM thật, đọc `getComputedStyle(el).fontSize`, gom **tập giá trị khác nhau** rồi so với thang chuẩn. Cách này bắt được **mọi** nguồn (CSS/JS/rem/clamp/inline/UA-style) mà không cần biết trước chúng nằm ở đâu.
  2. Gate phải phủ **nhiều đơn vị + nhiều loại file**: `px`, `rem`, `clamp()` × (`.css`, `.js`, `.html`, `server.js`). Gate `scripts/gate-typography.js` đã có 4 luật tương ứng.
  3. **Cấm kết luận "xong" khi mới sửa 1 loại file / 1 đơn vị.** Phải chạy lại phép ĐO RUNTIME và xác nhận tập giá trị = tập chuẩn.
  4. Nhớ bẫy **UA stylesheet**: `<h3>` không có rule nào vẫn có thể lệch (thừa hưởng + UA scale) — phải truy chuỗi cha trước khi kết luận "không có rule nào set".

### [H2DEV-SCAR-016] Bẫy `npm run build:css` Purge Mất Class (Glob `content` Sai Đường Dẫn)
- **Nguyên nhân:** `tailwind.config.js` khai `content: ['./assets/*.js']` — glob này **CHỈ khớp file trực tiếp trong `assets/`**, KHÔNG khớp `assets/app/*.js` hay `assets/app/tabs/*.js`. Mà class Tailwind thật nằm ở `assets/app/tabs/content.js` (sinh động trong template string). Khi chạy `npx tailwindcss --minify`, Tailwind quét không thấy class → **PURGE SẠCH** → `tailwind.css` từ **33,499 → 14,770 bytes, mất 253 class** → vỡ UI toàn bộ.
- **Phát hiện nhờ:** chạy `check-ui-classes.js` ngay sau build → báo `THẤT BẠI — 253 class utility thiếu CSS`.
- **Guardrail:**
  1. **TRƯỚC khi chạy `npm run build:css`, BẮT BUỘC** kiểm glob `content` có khớp hết file chứa class không (đếm số file glob quét được vs số file thật).
  2. **SAU khi build, BẮT BUỘC** chạy `node scripts/check-ui-classes.js`. Nếu FAIL → **khôi phục ngay từ backup**, không được commit.
  3. Với dự án dùng class sinh động (JS render HTML), nên khai **`safelist`** cho các class quan trọng để chúng không bao giờ bị purge.
  4. Luôn backup `tailwind.css` trước khi rebuild (đã làm: `_backup/20260924-p37-*/`).

### [H2DEV-SCAR-017] Bẫy Viết `*/` Trong Block Comment JS Làm Vỡ Syntax
- **Nguyên nhân:** Trong block comment `/* ... */`, viết glob `./assets/**/*.js` → chuỗi `*/` xuất hiện giữa `**` và `.js` → **đóng comment sớm** → `SyntaxError: Unexpected token '*'`.
- **Đã gặp 2 lần** (một lần ở `gate-icons.js` với `min-*/max-*`, một lần ở `gate-typography.js` với `**/*.js`).
- **Guardrail:** Trong comment JS **CẤM viết `*/`** dưới mọi hình thức (kể cả glob `**/*.js`, wildcard `min-*/max-*`). Viết tách ra: "moi file .js trong assets" hoặc "min / max". Sau khi sửa **BẮT BUỘC chạy `node --check <file>`**.

### [H2DEV-SCAR-018] Bẫy Lọc File Trong Script Audit — `_backup/` và File Build Gây Nhiễu Số Liệu
- **Nguyên nhân:** Script khảo sát typography quét cả `_backup/` (kho lưu trữ lịch sử) và `assets/tailwind.css` (file build của thư viện) → báo **155 vi phạm** trong khi thực tế **file sống chỉ 43**. Tương tự, `font-extrabold` bị báo 12 chỗ nhưng 11 chỗ nằm trong `tailwind.css` (định nghĩa sẵn của thư viện, không phải code dự án).
- **Hậu quả:** Thổi phồng khối lượng, dễ dẫn tới sửa vào chỗ không nên sửa.
- **Guardrail:** Mọi script audit **BẮT BUỘC** có danh sách loại trừ tường minh và **IN RA danh sách file đã quét** để mắt người kiểm. Loại trừ chuẩn của dự án: `_backup/`, `_archive/`, `node_modules/`, `.venv-gpu/`, `_tmp-proof/`, và **file build** (`assets/tailwind.css` — nguồn thật là `css/input.css`).

### [H2DEV-SCAR-019] Bẫy Gate "Pass Im Lặng" — Kiểm DOM Runtime Mà Bỏ Lớp SOURCE (Tái Phạm H2DEV-SCAR-008)
- **Nguyên nhân (ĐÃ CHỨNG MINH BẰNG PROBE, không suy đoán):** Gate `scripts/gate-shell.js` ban đầu chỉ đo **DOM runtime** cho `aria-controls`. Nhưng `player.html` **đã có sẵn** `aria-controls` trong HTML tĩnh, nên khi **xóa dòng `setAttribute('aria-controls')` trong `player-main.js`** thì DOM runtime **vẫn đúng** → gate báo **ALL PASS 6/6**. Tức là xóa code thật mà gate không hề hay biết.
- **Vì sao lần sửa thứ 2 vẫn FAIL:** Đổi sang kiểm "chuỗi `aria-controls` có tồn tại trong file không" → **vẫn sai**, vì trong `player-main.js` còn: (a) 1 lần khai báo khác trong `setPlayerTab()`, (b) **1 dòng comment** có chứa chữ `aria-controls`. Đo được: xóa 1 lần khai báo mà `blob` vẫn chứa chuỗi → `has()` vẫn `true`.
- **Bài học cốt lõi:** Kiểm "có xuất hiện chuỗi X" **KHÔNG** đồng nghĩa "có đủ khai báo X". Phải **ĐẾM SỐ LẦN KHAI BÁO** và chốt bằng một **bảng số kỳ vọng tường minh**.
- **Guardrail:**
  1. Gate có phần đọc SOURCE (JS/HTML) phải **ĐẾM SỐ LẦN KHAI BÁO**, không dùng `indexOf(...) >= 0`.
  2. Số kỳ vọng phải nằm trong **bảng `EXPECT_NGUON` tường minh** (do người viết chốt, đã đo thật). Sửa code làm lệch số → gate **FAIL**, buộc phải cập nhật bảng một cách **có ý thức**.
  3. **Comment trong source cũng bị tính** khi đếm chuỗi → nếu kiểm theo số lần, phải biết rõ comment có chứa từ khóa đó.
  4. **MỌI gate mới BẮT BUỘC PROBE 2 LỚP**: (a) tiêm lỗi vào **lớp runtime** (HTML) → gate FAIL ở luật runtime; (b) tiêm lỗi vào **lớp source** (JS) → gate FAIL ở luật đối chiếu nguồn. Chỉ probe 1 lớp = chưa đủ tin. Phục hồi phải **byte-identical**.
  5. Đã xác nhận bằng probe: `node scripts/gate-shell.js --probe` → `PROBE OK: gate BAT DUOC loi tiem vao (2/6 luot FAIL)`.

### [H2DEV-SCAR-020] Bẫy Đếm Nhầm "Lỗi" Do Đo Phần Tử Ẩn / Vùng Cuộn Ngang / Nội Dung Trong Iframe
- **Nguyên nhân:** Khi viết phép đo tự động, 3 dạng báo động giả đã gặp trong cùng 1 vòng kiểm:
  1. **Phần tử ẩn theo breakpoint:** đo "min height của mọi `[role=tab]`" → ở desktop `#playerTabSelector` bị `display:none !important` nên trả **0px** → kết luận sai là "tab quá nhỏ". Thực tế **tab ẩn là đúng thiết kế** (desktop dùng layout 2 cột).
  2. **Vùng cuộn ngang chủ định:** `learn.html` `.tabbar` có `overflow-x:auto`, nội dung 418px trong khung 366px → tự động báo "phần tử tràn phải". Thực tế là **dải tab cuộn ngang theo thiết kế**.
  3. **Nội dung trong iframe:** tab `lotrinh` của index render `<iframe src="/learn.html?embed=1">` → `panel.textContent` **luôn rỗng** (text nằm ở document của iframe) → báo sai "panel RỖNG".
- **Hậu quả:** 3/24 "lỗi" trong vòng kiểm regression là **giả**; nếu báo cáo vội sẽ khiến người dùng tưởng dự án hỏng và đi sửa vào chỗ không có lỗi.
- **Guardrail:**
  1. Trước khi kết luận "phần tử sai kích thước", **BẮT BUỘC lọc phần tử đang thực sự hiển thị** (`getBoundingClientRect().height > 0` + `display !== 'none'`).
  2. Khi kiểm "tràn ngang", phải **truy ngược chuỗi cha**: nếu tồn tại tổ tiên có `overflow-x: auto|scroll` và `scrollWidth > clientWidth` → **bỏ qua** (cuộn có chủ đích).
  3. Khi kiểm nội dung panel, phải chấp nhận **iframe** (`panel.querySelector('iframe')`) là "có nội dung" — hoặc đo trực tiếp trong `frame`.
  4. Phân biệt rõ **"ẩn theo breakpoint"** vs **"lỗi thật"** trước khi báo cáo (kế thừa H2DEV-SCAR-009).

### [H2DEV-SCAR-021] Bẫy "Sửa Theo Matrix" Khi Matrix Ghi Chuẩn Sai Ngữ Cảnh (Backdrop Menu ≠ Modal)
- **Nguyên nhân:** `consistency-matrix.md` ghi *"Chốt 1 backdrop blur (10px) + 1 alpha overlay (0.92) cho **modal**"*. Khi áp máy móc cho `.more-menu-backdrop` (backdrop của **menu điều hướng mobile**, KHÔNG phải modal) → `alpha 0.45 → 0.92` làm **tối đen toàn màn hình**, mất hết nội dung phía sau.
- **Bằng chứng đo được (không đoán):** so pixel ảnh before/after ở 390px:
  - trước khi sửa: **khác 0.055%** pixel (giữ nguyên)
  - sau khi áp 0.92: **khác 59.09%** pixel, độ lệch TB **9.407** → **đọc không được nội dung**
  - sau khi khôi phục 0.45 (giữ blur 10px): **khác 17.87%**, độ lệch TB 3.689 → **đọc được**; phần lệch còn lại là do blur 2px→10px (đúng chuẩn)
- **Bài học cốt lõi:** Token chuẩn phải áp **đúng ngữ cảnh**. Một giá trị "chuẩn cho modal" **không** đương nhiên đúng cho drawer/backdrop menu. **Matrix là tài liệu, không phải chân lý runtime** — phải đọc kỹ đối tượng trước khi áp.
- **Guardrail:**
  1. Trước khi áp 1 token cho nhiều selector, **BẮT BUỘC phân loại ngữ cảnh** từng selector (modal thật / backdrop drawer / texture trang / badge cục bộ).
  2. Với thay đổi thị giác, **BẮT BUỘC chụp ảnh before/after + ĐO % pixel khác biệt**. Ngưỡng đọc được: **< 0.5% = giữ nguyên**, **0.5–5% = đổi nhẹ (chấp nhận)**, **> 5% = phải giải trình**, **> 20% = nghi hồi quy, dừng lại kiểm**.
  3. Khi matrix và runtime mâu thuẫn → **runtime thắng**, và phải **sửa lại matrix** cho khớp thực tế.
  4. Alpha dùng cho backdrop **menu/drawer** nên nhẹ (`≤0.5`) để giữ ngữ cảnh; alpha `0.92` chỉ dành cho **modal chặn tương tác**.

### [H2DEV-SCAR-022] Bẫy 3 Tầng Nối Tiếp: Stacking Context — Inline `!important` — Utility `!important` (Dropdown "Lộ" Nội Dung)
- **Hiện tượng:** Dropdown gợi ý tìm kiếm (`#video-search-suggestions`) trông như **trong suốt**: chữ của thẻ card phía sau lộ xuyên qua. Nhìn ảnh ai cũng đoán "sai z-index".
- **Nguyên nhân THẬT gồm 3 tầng NỐI TIẾP NHAU** (phải bóc đủ 3 mới hết bệnh):
  1. **Tầng stacking context:** Thẻ cha `.search-filter-card` có `z-index:60 !important` + `position:relative` → **tự tạo stacking context**. Con `z-index:1010` chỉ thắng **trong nội bộ thẻ cha**; các thẻ `.card` khác (z-index auto, nền đục) vẽ **sau** trong DOM nên **đè lên** dropdown.
  2. **Tầng inline `!important`:** `<div id="video-search-suggestions" style="background-color:var(--surface-2) !important; …">` — inline `!important` **thắng mọi rule stylesheet**, nên sửa trong `viddar.css` **không có tác dụng gì**. Đây là **2 nguồn sự thật** cho cùng 1 giá trị.
  3. **Tầng utility `!important`:** `.bg-ink-deep { background-color: var(--surface-2) !important }` — class này gắn trên **header + từng row** của dropdown, `!important` đè tiếp rule `.js-v-sug-row`.
  → Sau khi gỡ tầng 1, đo lại `elementFromPoint` **7/7 điểm đều trả về dropdown** (đã nằm trên thật) **nhưng mắt vẫn thấy "lộ"** vì nền `--surface-2` (#1a1a1a) chỉ chênh **4%** so với thẻ card (#0f0f0f) → **gần như trùng màu, không phải lỗi chồng lớp nữa**.
- **Vì sao vòng đo ĐẦU bị báo động sai:** Em kết luận "còn lỗi stacking" chỉ từ **ảnh chụp**, suýt đi sửa lại z-index lần 2. Phải **hit-test `elementFromPoint` nhiều điểm** mới phát hiện: DOM đã đúng, vấn đề là **tương phản màu**.
- **Guardrail:**
  1. Gặp hiện tượng "lộ/xuyên thấy" → **BẮT BUỘC phân biệt 2 bệnh**: (a) **chồng lớp sai** — kiểm bằng `elementFromPoint` nhiều điểm + duyệt **chuỗi tổ tiên tìm stacking context**; (b) **tương phản quá thấp** — kiểm bằng so `getComputedStyle().backgroundColor`. **Cấm** kết luận chỉ từ ảnh.
  2. Khi muốn sửa style 1 element: **BẮT BUỘC kiểm 3 nguồn** theo thứ tự ưu tiên: **inline style (thắng)** → **class utility có `!important`** → stylesheet rule. Sửa stylesheet mà bỏ qua 2 nguồn trên = **sửa vô hiệu**.
  3. **Cấm dùng 2 nguồn sự thật cho 1 giá trị.** Nền dropdown chỉ khai **1 nơi** (stylesheet). Đã gỡ hết inline style + thay `.bg-ink-deep` bằng `.bg-bg`/`.bg-surface` (**token, KHÔNG `!important`**).
  4. Đổi màu "lớp nổi" (dropdown/menu/modal) phải **đo độ chênh với nền bên dưới**: nền lớp nổi **phải khác rõ** nền thẻ card. `--surface-2` (#1a1a1a) **KHÔNG dùng làm nền lớp nổi trên `--surface` (#0f0f0f)** — chỉ chênh 4%. Dùng `--bg` (#050505) cho lớp nổi.
  5. Gate P1 phải **bắt được cả 3 tầng**: quét `style="…!important"` inline trùng giá trị với stylesheet; quét utility `!important`; quét `z-index` số trên thẻ cha có `position:relative` không tạo stacking context ngoài ý muốn.
  6. **Bẫy phụ khi đo màu bằng `getComputedStyle().backgroundColor`:** giá trị trả về là **màu đã khai báo**, KHÔNG phải **màu đã vẽ** (nếu có `backdrop-filter`/layer mờ thì màu hiển thị khác). Muốn chốt "mắt thấy gì" phải **so pixel ảnh** (kế thừa H2DEV-SCAR-021).
  7. **Bẫy `node -e` trên PowerShell (tái phạm SCAR-002 toàn cục):** `node -e "…->…"` bị PowerShell nuốt chuỗi `->` → `bad option: ->`. **BẮT BUỘC** viết ra file `.js` tạm rồi `node <file>.js`.
  8. **Bẫy phụ khi đặt tên class Tailwind tuỳ biến:** `bg-bg`/`bg-surface` phải **tự khai trong CSS** (`g3-inline.css`), Tailwind **không sinh sẵn** từ token. Đổi class trong JS mà không khai CSS → mất nền hoàn toàn. Sau khi đổi **BẮT BUỘC grep lại** xem class mới có định nghĩa chưa.

### [H2DEV-SCAR-023] Bẫy Gate "Đỏ Vĩnh Viễn" Che Nợ Thật + Bẫy File CSS Không Được Trang Nạp
- **Nguyên nhân (chuỗi 3 phát hiện nối tiếp):**
  1. `check-ui-classes.js` **luôn đỏ ở HEAD** (`.min-h-[44px]` ở `player.html`) → vì luôn đỏ nên **không ai đọc kết quả**, và **nợ thật bị che**.
  2. Khi em sửa `.z-[1]`, gate **đỏ thêm 1 dòng** (1 → 2). Nhờ vậy mới lộ ra: 2 nút "Xóa tìm kiếm" trong `content.js` gắn class `.z-[1]` **chưa bao giờ có CSS** — `tailwind.css` build thật **chỉ sinh `.z-10`/`.z-50`, KHÔNG sinh arbitrary value dạng `.z-[1]`**.
  3. **Tại sao trước đó gate không báo `.z-[1]`:** cùng thẻ đó còn class `.bg-ink-deep`, mà `viddar.css` **có** rule `.bg-ink-deep` → gate thấy "class này có CSS" nhưng **kiểm theo từng token riêng lẻ**, nên phải báo cả `.z-[1]`… Thực tế nó **không báo** vì `.z-[1]` bị bộ lọc `looksLikeClass()` **loại bỏ** (chứa `[` `]`) — tức gate **có lỗ hổng**: class Tailwind arbitrary value **không bao giờ được kiểm**.
- **Guardrail:**
  1. **Gate đỏ vĩnh viễn = gate vô dụng.** Cấm để gate luôn đỏ; phải sửa cho xanh, hoặc tách nợ ra file allowlist có ngày + lý do.
  2. **CẢNH BÁO: `looksLikeClass()` trong `check-ui-classes.js` loại bỏ token chứa `[` `]`** → mọi class Tailwind **arbitrary value** (`z-[1]`, `min-h-[44px]`, `top-[3px]`…) đều **không được gate kiểm**. Đây là **lỗ hổng thật của gate**, cần vá riêng (thêm luật quét arbitrary value, strip `[` `]`).
  3. **Tailwind arbitrary value KHÔNG đáng tin:** build thật chỉ sinh class có trong `safelist`/quét được. **Cấm dùng `class="z-[N]"`, `min-h-[...]`** cho thuộc tính quan trọng — dùng **token** (`style="z-index:var(--h2-z-base)"`) hoặc class có khai CSS tường minh.
  4. **Bẫy file CSS không được trang nạp:** Khi thêm CSS để vá lỗi thiếu style, **BẮT BUỘC kiểm trang đó có `<link>` file CSS mình vừa sửa không**. Ca thật: sửa `.min-h-[44px]` vào `g3-inline.css` → **vẫn đỏ**, vì `player.html` **không nạp** `g3-inline.css` (chỉ nạp `player.css`). Phải đọc `<link rel="stylesheet">` của chính trang trước khi chọn file để sửa (kế thừa H2DEV-SCAR-008 về "liệt kê tường minh nguồn dữ liệu").
  5. Sau khi vá: `node scripts/check-ui-classes.js` → **ALL OK, 3/3 trang**, tổng thiếu **0** (lần đầu gate này xanh).

### [H2DEV-SCAR-024] Bẫy "Luật Chỉ Định Sẵn" Che Màu Ngoài Danh Sách (Tái Phạm H2DEV-SCAR-015/018)
- **Nguyên nhân:** Khi dọn nền panel, em đọc tài liệu `h2dev-tokens.css` dòng 113-115 ghi rõ **4 mã cấm**: `#0b0f19 · #0f172a · #111827 · #070a12`. Em quét theo **đúng 4 mã đó** → báo "còn 5 chỗ" → yên tâm.
- **Sự thật:** Quét lại **toàn bộ hex nền** (không dùng danh sách định sẵn) → ra **82 khai báo**, trong đó có **4 mã NAVY KHÁC** không nằm trong danh sách cấm nhưng **cùng vai trò nền panel**: `#131d31` (14 chỗ — thẻ KPI), `#182234` (8 — bento sub-panel), `#0b1120` (1), `#090d16` (1). Tức **còn sót 24 chỗ** mà danh sách "chính thức" không nhắc tới.
- **Bài học cốt lõi:** **Danh sách cấm trong tài liệu KHÔNG phải tập đầy đủ.** Nó là dấu vết của người viết trước, không phải kết quả đo. Phải **quét exhaustive theo VAI TRÒ** (mọi `background:` có hex), rồi tự phân loại, chứ không lọc theo danh sách.
- **Guardrail:**
  1. Khi dọn theo "danh sách cấm", **BẮT BUỘC quét lại exhaustive** toàn bộ thuộc tính liên quan (regex `background(-color)?:\s*#hex`) rồi **đối chiếu 2 chiều**: mã trong danh sách ∪ mã thực tế ngoài danh sách.
  2. Kết quả quét **phải in ra bảng đầy đủ** (hex · số chỗ · file) để mắt người kiểm, không chỉ in số tổng.
  3. **Phân loại theo VAI TRÒ trước khi sửa:** `#1e293b`(23)/`#374151`(7)/`#334155`(4) chủ yếu là **border**; `#2563eb`/`#0284c7`/`#10b981` là **màu semantic nút**; `#000`/`#fff` là overlay cố ý → **CẤM đổi**. Chỉ đổi mã có vai trò "nền panel".
  4. **Cấm mở rộng phạm vi tuỳ tiện:** mã không nằm trong chuẩn và không phải nền panel (vd `#1f2937` gray-800 làm badge/header strip) thì **giữ nguyên**, không "tiện tay đổi luôn".
  5. Số liệu vòng 1 báo "5 chỗ" trong khi thực tế **82 khai báo / 28 chỗ cần đổi** → **luôn ghi rõ căn cứ đo** cạnh con số (kế thừa H2DEV-SCAR-012).

### [H2DEV-SCAR-025] Bẫy Gate Quá Rộng — Bắt Bừa Gây "Đỏ Giả" Rồi Bị Vô Hiệu Hoá
- **Nguyên nhân:** Gate P1 mới (`scripts/gate-p1.js`) ban đầu viết 2 luật **quá rộng**:
  1. Cấm **mọi** Tailwind arbitrary value (`min-h-[`, `max-h-[`, `w-[`, `h-[`, `[overflow-wrap:...]`...) → báo **37 vi phạm GIẢ**. Các class này **có tác dụng thật** (gate `check-ui-classes` + runtime đã xác nhận). Chỉ **duy nhất `z-[N]`** mới là lỗi thật (Tailwind build không sinh).
  2. Cấm **mọi** inline `!important` → báo 2 vi phạm GIẢ (`contain:none !important` là **cố ý**, cần để dropdown không bị clip). Chỉ `!important` trên **`background`/`z-index`** mới là "2 nguồn sự thật" gây họa.
- **Hậu quả nếu để nguyên:** Gate đỏ 40 vi phạm, **37 là giả** → giống H2DEV-SCAR-023: gate đỏ vĩnh viễn → người ta bỏ qua → **mất tác dụng bảo vệ**.
- **Giá trị ngược lại (điểm sáng):** Sau khi thu hẹp luật đúng mức, gate **lập tức bắt được 3 LỖI THẬT** mà mọi vòng kiểm trước bỏ sót:
  - `assets/player.css:166-167` — `backdrop-filter: blur(12px)` (ngoài chuẩn 10px)
  - `assets/music_player_modal.js:124` — **`z-index:100005`** (đúng con số mà `h2dev-tokens.css` ghi là CẤM) **+** `blur(12px)`
- **Guardrail:**
  1. **Luật gate phải nhắm ĐÚNG lỗi ĐÃ CHỨNG MINH**, không nhắm "mọi thứ trông giống lỗi". Trước khi viết luật, phải trả lời: *"Nếu tiêm lỗi này, có THẬT SỰ hỏng không?"*
  2. **Bắt buộc phân biệt 3 mức khi viết luật**: (a) **lỗi thật** → FAIL; (b) **hợp lệ nhưng hiếm** → ghi chú, không FAIL; (c) **cố ý** → phải có **allowlist kèm lý do**.
  3. Nhánh (c) phải **hẹp theo thuộc tính**, không theo cả câu: `!important` chỉ FAIL khi gắn trên `background`/`z-index`, không FAIL trên `contain`/`overflow`.
  4. **Gate đỏ phải đọc từng dòng**: nếu > 50% vi phạm là giả → **gate sai thiết kế**, sửa gate TRƯỚC, không sửa code.
  5. Giá trị của gate nằm ở **PROBE + độ chính xác**, không nằm ở số luật. 5 luật đúng > 10 luật bắt bừa.

### [H2DEV-SCAR-026] Danh Sách File Trong Gate Phải Sống (Phát Hiện File Sống Ngoài Danh Sách)
- **Nguyên nhân:** Gate P1 khai `LIVE_FILES` tường minh (đúng nguyên tắc H2DEV-SCAR-008 "liệt kê tường minh, fail loud"). Nhưng khi khai, em **thiếu** `assets/app/tabs/content.js`, `assets/app/tabs/nav.js` → nếu chỉ dựa danh sách cũ thì **2 file này không được kiểm**.
- **Guardrail:**
  1. Danh sách file trong gate **BẮT BUỘC đối chiếu với thực tế** mỗi lần thêm/xoá module (kế thừa H2DEV-SCAR-008).
  2. Khi thấy 1 file **được trang nạp qua `<script src>`/`<link>` mà không có trong `LIVE_FILES`** → phải bổ sung ngay.
  3. `LIVE_FILES` phải in ra số lượng khi chạy (`tren 17 file song`) để mắt người kiểm.

### [H2DEV-SCAR-027] Khế Ước Phục Hồi Dữ Liệu Stream & CENC Media (The Media Stream Recovery Contract)
- **Nguyên nhân:** Khi gặp luồng video/audio bảo vệ bằng DRM phân mảnh (MPEG-DASH / CENC), suy đoán sai rằng "không thể tải tự động" hoặc đề xuất ghi âm thủ công thời gian thực (lãng phí hàng giờ cho video 2-3 tiếng). Thực tế CDN chỉ yêu cầu chữ ký phiên động và thiết bị giải mã CDM hợp lệ.
- **Guardrail:**
  1. Tuyệt đối không võ đoán "không thể tải" hay đề xuất giải pháp ghi âm thủ công kém hiệu năng.
  2. Dùng pipeline tự động (`scripts/download_full_drm_audio.cjs` + `scripts/get_drm_key.py` + `_tools/cdm/device.wvd`):
     - Bước 1: Khởi động trình duyệt Edge/Chromium nạp phiên cấp phép.
     - Bước 2: Bắt toàn bộ các phân đoạn media (`s_0.m4a` init + `s_0_*.m4s` fragments) qua can thiệp mạng Shaka Player / fetch hook.
     - Bước 3: Tạo License Challenge tới License Server hợp lệ để trích xuất khóa giải mã Content Key chuẩn (`KID:KEY`).
     - Bước 4: Dùng FFmpeg `-decryption_key <KEY>` giải mã lossless toàn bộ âm thanh sang M4A sạch và ghép vào luồng video trong 1-2 phút.
     - Bước 5: Chạy `audit_videos_v2.py --sku <SKU>` kiểm định âm lượng, thời lượng và số gói tin đạt 100% trước khi cập nhật kho.


### [H2DEV-SCAR-028] Bẫy Heuristic Bỏ Qua API/Web Gốc Khi Ingest Bài Học Mới — Phỏng Đoán Kênh & Bỏ Sót Tệp Đính Kèm Gốc
- **Nguyên nhân:** Khi ingest các bài học mới (`VIDEO-0be6c9`, `a85eac`, `043d15`, `a59a5e`), em chỉ tải video và transcript rồi **tự phỏng đoán** kênh đối thủ và **tự biên soạn** tài liệu thay thế. Em không hề kiểm tra trang học viên hay gọi trực tiếp API gốc (`saas-api.mona.academy/graphql`), dẫn đến:
  1. Thiếu và sai danh sách kênh đối thủ mà tác giả ghi tường minh trong `description.html`.
  2. Bỏ sót toàn bộ tệp tài liệu thực tế của tác giả đính kèm (Google Sheet danh sách nguồn video stock, Google Drive zip chứa Prompt Skill `kichban-bapsang-kr.zip`, link tool kịch bản).
  3. Báo cáo "ALL PASS" vội vã chỉ dựa trên các gate kiểm tra cấu trúc cục bộ mà không đối soát với Single Source of Truth (SSoT) từ web gốc.
- **Hậu quả:** Giao diện Player hiển thị sai lệch thông tin so với bài học gốc, mất uy tín dữ liệu, khiến người dùng phải nhắc nhở nhiều lần.
- **Guardrail:**
  1. Khi ingest bất kỳ bài học/video nào từ nền tảng Mona Academy (`h2dev.vn`), **BẮT BUỘC** gọi trực tiếp GraphQL API `getCourseNoCategory(sku: $sku)` để lấy trọn vẹn `description.html`, `attachments`, `lesson_files`.
  2. **CẤM phỏng đoán kênh đối thủ từ video/transcript:** Chỉ ghi nhận kênh đối thủ khi có khai báo chính thức trong `description.html` của bài học.
  3. Mọi đường link Google Drive, Google Sheets, tệp zip, CSV trong `description.html` **BẮT BUỘC phải tải về disk** (lưu đồng bộ ở cả `docs/<SKU>/` và `assets/docs/<SKU>/`) để phục vụ mở file local và đọc trực tiếp trên Player.
  4. Luôn sinh cặp `description.html` (mã nguồn gốc) và `description.txt` (bản text sạch) trong thư mục `docs/<SKU>/`.
  5. Cấm kết luận hoàn thành nếu chưa đối chiếu 1-1 giữa nội dung Player Local với trang bài học gốc trên website.


### [H2DEV-SCAR-029] Bẫy Phụ Đề "Có File Nhưng Thủng Lỗ" Và Mốc Thời Gian Bịa — Kiểm Độ Phủ Thật, Không Chỉ Kiểm Có File
- **Triệu chứng (đo 2026-10-14):** `audit_videos_v2.py` báo 17/144 video lỗi: 13 video có `key_timestamps` vượt thời lượng thật (VIDEO-ec9c50 dài 102 s mà có mốc 450 s và 600 s; nhãn mốc không khớp lời nói), 4 video mới nhập thiếu `tags` và phụ đề thủng lỗ (khoảng trống 20–110 s có tiếng nói, phủ 82–87,5% thời lượng, 1–9 segment "nén chữ"), 20 video không có mốc nào.
- **Nguyên nhân đã xác minh:** (1) mốc thời gian được sinh theo mẫu số tròn, không bám transcript; (2) Whisper large-v3 với `VI_PROMPT` bỏ sót đoạn nói trong cửa sổ dài và có lúc rớt nguyên âm (A4) — gọi lại cùng đoạn bằng `whisper-large-v3-turbo` không prompt thì ra đủ chữ; (3) 4 SKU mới chưa có số đo lặng (`silence.json`) nên mọi khoảng trống bị tính là "chưa giải thích"; (4) luật A8c coi đuôi video im lặng thật là thiếu phụ đề.
- **Guardrail:**
  1. Ingest SKU mới xong phải chạy `py -3 scripts/silence_scan.py <SKU>` rồi `py -3 scripts/audit_videos_v2.py`; ba cột D6/A4/A8c phải sạch trước khi báo xong.
  2. Vá phụ đề bằng `py -3 scripts/fill_transcript_gaps.py <SKU>`: chỉ bóc lại đúng cửa sổ thủng (cắt ≤ 35 s), chạy 2 mô hình, chọn bản phủ nhiều giây nói hơn và ít segment nén chữ hơn; bản gốc lưu ở `_backup/<ngày>-fill-gaps/<SKU>/`.
  3. Mốc `key_timestamps` phải lấy từ segment thật của transcript (giây bắt đầu segment) và nhãn tóm đúng lời tại đó; sau khi sửa phải đồng bộ bảng `lesson_timestamps` trong `data/h2dev_master.db` (xoá/chèn đúng SKU, giữ nguyên các cột khác) rồi chạy `node scripts/sync-counts.js`.
  4. `audit_videos_v2.py` tính đuôi im lặng chạm cuối video là đã phủ (`coverage_effective_pct`).
