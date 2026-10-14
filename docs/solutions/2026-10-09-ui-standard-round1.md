# Sự cố và bài học — UI-standard đợt 1 (2026-10-09)

> **Commit:** `c22844d` (đợt sửa), `f21837e` (ba hunk text-2xs còn sót), `c984695` (tài liệu) trên nhánh `ui/ui-standard-2026-10-09` (chưa push).
> **Phạm vi:** /tatca, /video, /rawkenh, /ngachxanh, /tai-lieu, /kenh-mau, /nguonreup, /lotrinh, /learn.html, trang bài học `/lotrinh/<SKU>`.
> **Phiên bản tài nguyên:** `uifix67` (index 21 chỗ, learn 10, player 10, `sw.js` CACHE).
>
> Mỗi mục: triệu chứng · nguyên nhân đã xác minh · cách sửa · guardrail. Mã bài học dùng tiền tố `H2DEV-UI-`. Mục còn mở nằm trong `docs/plans/ui-standard-round2.md`.

---

## H2DEV-UI-001 — Cùng khối điều khiển, PC thấp hơn iPad

- **Triệu chứng:** trên PC (1440 px) "Đang dở", ô ghi chú và "Bỏ tiến độ" cao 32–34 px; trên iPad (820 px) cùng khối cao 44 px. Anh so sánh hai ảnh và thấy khác nhau.
- **Nguyên nhân (đo bằng `getBoundingClientRect`):** `assets/h2dev-shell.css` mục 10b đặt `min-height: 44px` cho nút trong `#playerMain`, nhưng nằm trong `@media (max-width: 1024px)`. Trên màn hình rộng quy tắc không áp dụng.
- **Cách sửa:** `assets/player.css`, khối cuối (`@media (min-width: 641px)`) đặt `min-height: 44px` cho `#btnWatched`, `#btnResume`, `#btnClearProgress`, `#noteInput`.
- **Guardrail:** khi hai cỡ màn hình khác nhau, liệt kê mọi quy tắc có mốc `max-width`/`min-width` nằm giữa hai cỡ (ở đây là 640 và 1023/1024) trước khi kết luận. So chiều cao từng phần tử theo cùng trạng thái, không so bằng mắt.

## H2DEV-UI-002 — Trạng thái "đang xem dở" làm khối điều khiển nhảy hàng

- **Triệu chứng:** khi có tiến độ, "Đang dở" và "Xem tiếp" xuống hàng thứ hai, căn phải, lệch với hàng điều hướng. Đo ở 1440 px: "Đang dở" nằm ở y=860, hàng điều hướng ở y=808.
- **Nguyên nhân:** `#pstate` là một khối flex nằm trong hàng `flex-wrap`. Khi có thêm "Xem tiếp", phần tử cuối tràn sang dòng mới.
- **Cách sửa:** trên màn hình rộng, `#pstate` dùng `display: contents`; hàng 1 là lưới hai cột (điều hướng bên trái, trạng thái cột 2 căn phải); "Xem tiếp" dùng `grid-column: 1 / -1` ở hàng 2.
- **Đã kiểm:** `assets/app/player-main.js` chỉ gọi `stateEl.classList.remove('hidden')`, không bao giờ thêm `hidden` vào `#pstate`. Vì vậy `display: contents` không làm lộ phần tử đang bị ẩn.
- **Guardrail:** đo đủ ba trạng thái (chưa xem, đang dở, đã xem) ở 642, 700, 820, 1024, 1280, 1366, 1440 px. Trước khi dùng `display: contents`, kiểm tra xem mã JS có thêm class `hidden` vào container đó không.

## H2DEV-UI-003 — Sửa một trạng thái làm lệch trạng thái đã được duyệt

- **Triệu chứng:** bản sửa đầu đổi cả trạng thái "chưa xem" (nút 32 → 44 px) trong khi anh đã chấp nhận trạng thái đó.
- **Cách xử lý:** bản sửa đầu giữ nguyên chiều cao trạng thái "chưa xem" (so ảnh: 0,00% điểm ảnh khác ở 1024, 1280, 1366, 1440 px). Sau đó anh yêu cầu đồng nhất chiều cao với "Bài trước/Bài tiếp theo" ở mọi trạng thái, nên áp 44 px cho cả ba trạng thái. Khi đó ảnh so với bản trước khác 1,7–3,0% ở 1440 px (đổi nhẹ, đã giải thích).
- **Guardrail:** trước mỗi lần đổi, chụp ảnh baseline của mọi trạng thái. Ghi rõ trạng thái nào đổi có chủ đích và trạng thái nào phải giữ nguyên.

## H2DEV-UI-004 — Đổi tên class và token hàng loạt, gate bắt lỗi ở hai chỗ

- **Triệu chứng:** sau khi đổi `text-2xs` sang `text-xs` (khoảng 116 chỗ) và bỏ token `--h2-font-2xs`, `gate-p2` báo token định nghĩa nhưng không dùng; `gate-p1` báo `line-height: 1.25` nằm ngoài thang cho phép.
- **Cách sửa:** bỏ token chết khỏi `assets/h2dev-tokens.css`; đổi line-height về 1.2.
- **Còn mở:** `design-system/tokens.json` vẫn có `font-2xs: 11px` và `tailwind.config.js` vẫn có `'2xs': '11px'` cùng safelist `text-2xs`. Chưa quyết định (xem plan, M6).
- **Guardrail:** sau mỗi đợt đổi tên, chạy `gate-p1`, `gate-p2`, `gate-typography`.

## H2DEV-UI-005 — Chip theo số cột cố định bị mồ côi khi chiều rộng đổi

- **Triệu chứng:** lưới `repeat(auto-fill, minmax(112px, 1fr))` cộng luật "chip cuối full-width" cho ra chip lẻ ở các chiều rộng khác nhau. Luật chung `.flex-wrap:has(> .filter-btn)` còn áp lên nhóm "Watch" và làm nhóm bị lệch 2+1.
- **Cách sửa:** ở màn hình ≤1024 px, nhóm chip dùng `flex-wrap` và `flex: 1 1 112px` (không cố định số cột). Hai nhóm có id riêng (`#video-filter-watch`, `#video-chip-cloud`) giữ lưới riêng. Selector dùng `:where()` và `:not(#id)`.
- **Còn mở:** dòng hỗn hợp (handle kênh, "Xem thêm") vẫn có chip mồ côi (plan, M1).
- **Guardrail:** khi viết quy tắc cho một nhóm bằng selector chung, loại trừ nhóm có layout riêng bằng id và kiểm nhóm đó ở 390, 820, 1024 px.

## H2DEV-UI-006 — Tiêu đề: h2 cỡ 13–14 px vừa nhiễu vừa nhảy cấp

- **Triệu chứng:** nhóm và thẻ dùng `h2` cỡ 13–14 px, cùng cấp với tiêu đề trang. Trang bài học nhảy từ h1 sang h3.
- **Cách sửa:** nhóm và thẻ đổi sang `h3` với một kiểu thống nhất. Hai mục của trang bài học dùng `h2` (`player.html`). h1 giữ ở thanh đầu theo ghi chú quyết định đã có trong `assets/app/ui-core.js`.
- **Đã kiểm trước khi đổi:** tìm selector theo thẻ trong `assets/`, `scripts/`, `e2e/`. Chỉ `scripts/playwright-g2-acceptance.js` dùng `.card h3, .card h2`, và selector này vẫn khớp.
- **Guardrail:** sau khi đổi thẻ, đo `h1Count` và `headingSkips` bằng audit (kết quả đợt này: h1 = 1, không nhảy cấp).

## H2DEV-UI-007 — Chữ bị cắt không có title: làm một lần cho mọi trang

- **Triệu chứng:** chữ kết thúc bằng "…" mà không xem được đầy đủ. Đo được 4 mục trên trang bài học ở 1024 px.
- **Nguyên nhân:** nội dung được render động sau khi tải trang, nên không có title sẵn trong HTML.
- **Cách sửa:**
  - `assets/h2dev-core.js` có một lớp dùng chung: `MutationObserver` theo `childList`, `class`, `hidden`; khử trùng node bằng `Set`; quét lại khi đổi cỡ màn hình và khi tải xong. Không quan sát thuộc tính `style` và không quan sát `html`/`body`.
  - Chip mốc thời gian của bài học có `title` ngay trong template (`player-main.js`).
- **Đo chi phí:** `PerformanceObserver` ghi `longtask` khi cuộn `/rawkenh` (12.000 px) và `/tatca` ở 390 px: không có tác vụ dài nào.
- **Guardrail:** không quan sát `style` trên toàn bộ tài liệu. Khử trùng node trước khi quét. Với nội dung đã biết trước, đặt title trong template và coi lớp chung là phương án dự phòng.

## H2DEV-UI-008 — Số đo sai vì service worker và `?v=` cũ

- **Triệu chứng:** kết quả đo không đổi dù đã sửa. Có giai đoạn lớp title trả về rỗng cho đến khi `uifix58`.
- **Nguyên nhân:** service worker vẫn phục vụ CSS/JS cũ; phiên bản `?v=` không đổi nên trình duyệt không tải lại.
- **Quy trình bắt buộc:**
  1. Mỗi lần sửa CSS/JS: tăng `?v=` trong `index.html`, `learn.html`, `player.html` và `CACHE` trong `assets/app/sw.js`.
  2. Trước mỗi lần đo: hủy đăng ký service worker, xóa mọi cache, tải lại trang.
  3. Số đo chỉ có giá trị sau hai bước trên.

## H2DEV-UI-009 — Thay NBSP bằng perl ghi byte không hợp lệ

- **Triệu chứng:** thay khoảng trắng không ngắt dòng bằng perl ghi byte `0xA0` đơn, không phải UTF-8. Ảnh hưởng nhãn "Đã xem / đang dở" trong `assets/app/tabs/content.js`.
- **Cách sửa:** thay có phạm vi dòng: `perl -pi -e 's/\xA0/\xC2\xA0/g if $. == <dòng>'`. Dòng được lấy bằng `grep -n` ngay trước khi sửa.
- **Guardrail:** sau mọi thao tác trên byte: `node --check` cho file JS, và `od -c` ở dòng đã sửa để xác nhận `C2 A0`.

## H2DEV-UI-010 — Commit khi file lẫn việc của người khác

- **Triệu chứng:** 17 file UI có lẫn thay đổi dữ liệu và script của công việc khác. Tại thời điểm commit, working tree có 138 file M và 149 file untracked (sau đó là 122 M và 152 untracked).
- **Cách làm đã dùng:**
  1. Phân loại từng hunk bằng mẫu chuẩn hóa: `text-2xs`→`text-xs`, `11px`→`12px`, `h2/h3`→`hX`, số `uifixN`. Hunk không khớp mẫu được đọc bằng tay.
  2. File mà mọi hunk đều thuộc đợt này được stage nguyên (16 file).
  3. File lẫn việc khác (`player-main.js`) chỉ stage các hunk thuộc đợt này (hunk tiêu đề và ba hunk đổi class), bằng `git diff -U0` rồi `git apply --cached --unidiff-zero`. Bỏ 10 hunk còn lại.
- **Lỗi công cụ đã gặp:** `str.splitlines()` tách thêm ở một số ký tự đặc biệt làm mất một hunk khi phân loại. Dùng `split('\n')`.
- **Lỗi git đã gặp:** `git add -p` cần terminal tương tác nên không dùng được trong môi trường này.
- **Guardrail:** trước khi kết luận, đếm hunk bằng `grep -c '^@@'` và đối chiếu với số hunk bộ phân loại tạo ra.

## H2DEV-UI-011 — Gate chạy trên worktree tạm thiếu `node_modules`

- **Triệu chứng:** `gate-shell.js` thoát mã 1 trên worktree tạm với `Cannot find module 'playwright'`.
- **Nguyên nhân:** `node_modules` không nằm trong git (đúng theo `.gitignore`), nên worktree mới không có. Đây không phải lỗi giao diện.
- **Cách chạy:** `NODE_PATH=<repo>/node_modules node scripts/gate-shell.js`. Kết quả: `ALL PASS 6/6`, mã thoát 0.
- **Guardrail:** khi đọc kết quả gate trên cây khác, đọc cả đầu ra. Thiếu module là lỗi môi trường, không tính là FAIL giao diện.

## H2DEV-UI-012 — Dải tab bài học xuống dòng tạo tab mồ côi

- **Triệu chứng:** `assets/learn.css` đổi `.tabbar` từ cuộn ngang sang xuống dòng, để tab cuối "Tìm kiếm bài học" không bị cắt ở 390 px. Kết quả: tab này nằm một mình ở hàng cuối trên `/lotrinh` và `/learn.html` ở 390 px.
- **Trạng thái:** chưa xử lý. Đây là đánh đổi của đợt sửa, phải giải quyết ở plan M2.
- **Guardrail:** khi đổi từ cuộn sang xuống dòng, kiểm số phần tử lẻ ở mọi cỡ, không chỉ cỡ đang sửa.

---

## Ghi chú

- Các số đo trong tài liệu này lấy từ `scripts/audit-ui.js` (bản trong skill toàn cục `ui-ux-standard`) chạy trên trình duyệt, cùng ngày 2026-10-09. Các số đo cũ hơn được ghi trong báo cáo đợt 1 với cùng nguồn.
- Không có số đếm dữ liệu nào thay đổi trong đợt này, nên không cần cập nhật `docs/WORKING_STATE.md`.
