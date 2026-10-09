# UI-standard đợt 2: sự cố và bài học (H2DEV-UI-013 đến H2DEV-UI-020)

> Ngày: 2026-10-09. Nhánh: `ui/ui-standard-2026-10-09`. Đợt 2 đã nằm trong commit `800caa4` (commit của việc khác); vòng 3 (H2DEV-UI-021 đến 025) nằm trong `13c40f5`; `server.js` của D-05 đã nằm trong `551be56`.
> Bài học đợt 1: `docs/solutions/2026-10-09-ui-standard-round1.md` (H2DEV-UI-001 đến 012).

## H2DEV-UI-013: gate thang chữ không báo khi thang còn bậc 11 px

- **Triệu chứng:** sau khi bỏ bậc 2xs khỏi cấu hình và token, `gate-typography` báo 5 vi phạm: `.badge`, `.doc-path`, `.watched-badge` và hai dòng `font-size: 11px !important` trong `index.html`.
- **Nguyên nhân (đã xác minh):** gate đối chiếu với thang còn bậc 11 px nên không báo. Khi bỏ bậc khỏi thang, năm khai báo thành vi phạm thật.
- **Cách sửa:** đổi sang 12 px ở `css/input.css`, `assets/tailwind.css`, `index.html`, `assets/h2dev-components-lesson-row.css`. Trong `assets/tailwind.css` xóa đúng một luật `.text-2xs`. Không dựng lại Tailwind.
- **Guardrail:** trước khi bỏ một bậc khỏi thang, quét giá trị đó trong mã nguồn và CSS đã biên dịch, sửa hết rồi mới đổi thang.
- **Rủi ro còn mở:** `assets/tailwind.css` lệch 38 class so với cấu hình. Một lần dựng từ cấu hình cho 29.760 byte; file đã commit 32.907 byte. Không dựng lại cho đến khi xác định 38 class đó.

## H2DEV-UI-014: ảnh toàn trang desktop chỉ cao bằng khung nhìn

- **Triệu chứng:** mọi ảnh 1440 px cao đúng 900 px, nên so sánh "0,00 %" không có giá trị.
- **Nguyên nhân (đã xác minh):** desktop cuộn trong khung bên trong, không cuộn cả trang.
- **Cách sửa:** đặt chiều cao khung nhìn theo nội dung cuộn của khung trước khi chụp.
- **Guardrail:** trước khi kết luận "không đổi", kiểm chiều cao ảnh so với nội dung.

## H2DEV-UI-015: luật hai cột KPI bị luật bốn cột có chủ đích đè

- **Triệu chứng:** thêm luật hai cột ở ≤640 px nhưng giá trị tính toán vẫn là bốn cột (83,5 px mỗi cột) ở 390 px.
- **Nguyên nhân (đã xác minh):** `assets/viddar.css` có quyết định D1 từ trước: "4 thẻ KPI thành một dải ngang trên điện thoại", `repeat(4, …) !important`, đặt sau và thắng luật mới.
- **Cách xử lý:** gỡ luật của mình; giữ D1. Nhãn "Ngách có data" xuống hai dòng ở 390 px (cao 32 px; các nhãn khác 16 px) là hệ quả của D1; chờ chủ dự án chọn (D-07).
- **Guardrail:** trước khi kết luận đã sửa, đọc giá trị tính toán và tìm mọi luật `!important` cùng thuộc tính.

## H2DEV-UI-016: công cụ đo bỏ sót cặp nút trong thẻ

- **Nguyên nhân (đã xác minh bằng cách đọc mã đo):** luật mồ côi chỉ xét khối có ít nhất ba phần tử, và tất cả phải là nút hoặc liên kết có `href`. Thẻ tài liệu có hai nút (hoặc `a` không có `href`) nên không bao giờ bị báo.
- **Cách đo đúng:** đếm số dòng của từng thẻ (từng khối cha), rồi xem ảnh.
- **Kết quả đã xác minh:** VIDEO-043d15 có 6 thẻ, mỗi thẻ hai nút; ở 1440 px có 6 nút lẻ. Sau khi chia hai cột, không còn dòng lẻ ở 390, 820, 1024 và 1440 px.

## H2DEV-UI-017: chip không giãn nên chip lẻ cuối hàng nằm một mình

- **Nguyên nhân (đã xác minh):** chip giữ chiều rộng theo nội dung (không có `flex-grow`). Luật D2 của đợt này (`assets/viddar.css`) cho hàng chip xuống dòng thay vì cuộn ngang, nên chip cuối hàng có thể nằm một mình.
- **Cách sửa:** `flex: 1 1 auto` cho chip trong `#content`, trừ `#video-filter-watch` và `#video-chip-cloud`; thêm luật 641–820 px cho nhóm Ngách (`.nx-filter-chips`) và nút "Đi nhanh" (`.quick-access__list`, trừ topbar). Lưới thẻ kênh (Kênh mẫu) chuyển sang flex-wrap, thẻ lẻ cuối hàng chiếm cả hàng.
- **Đánh đổi (đã xem ảnh so sánh):** các hàng chip giãn cho đầy hàng. Ở hàng lọc trạng thái của Kênh mẫu 1440 px, ba nút có độ rộng khác nhau rõ rệt. Đây là thay đổi thị giác; chờ chủ dự án xác nhận (D-06).

## H2DEV-UI-018: "trước" lấy từ bản commit, chặn ở trình duyệt

- **Cách làm:** `git show HEAD:<file>` cho năm file CSS đã đổi. Trình duyệt chặn yêu cầu tới các file đó và trả về nội dung của HEAD; service worker bị chặn; HTML trả về có dòng 12 px được đổi lại 11 px. Không đổi file trên máy chủ.
- **Kiểm chứng:** ở trang học 390 px, khác biệt 0,03 % nằm trong khung tab (tab bar ở y = 76–168 px; vùng khác biệt ở y = 92–153 px).

## H2DEV-UI-019: nút thứ ba của thẻ ba tài liệu chiếm cả hàng

- **Triệu chứng:** VIDEO-2aa1f7 (thẻ có ba tài liệu) có nút thứ ba lẻ ở hàng hai.
- **Cách sửa:** `assets/player.css`: `#pdocslist > article div:has(> a:nth-child(2)) > a:last-child:nth-child(odd):nth-child(n+3) { grid-column: 1 / -1; }`.
- **Kiểm:** ảnh thẻ ở 390 và 1440 px: nút thứ ba chiếm cả hàng. Công cụ đếm theo hàng vẫn báo [2,1], vì phần tử chiếm cả hàng vẫn là "một mình trong hàng". Theo quy tắc G-3 của skill, phần tử chiếm cả hàng là hợp lệ; ghi là ngoại lệ có lý do (D-08).
- **Ghi chú:** ở 1440 px nhãn "Đọc trực tiếp" ngắt thành "Đọc trực / tiếp" (ngắt chữ trong nút, không phải lỗi hàng nút). Chưa sửa.

## H2DEV-UI-020: nút "Đi nhanh" trên điện thoại là lưới, luật flex không có tác dụng

- **Triệu chứng:** /tai-lieu 360 và 390 px: nút "Reup / Hoạt hình" nằm một mình ở hàng hai của "Đi nhanh".
- **Nguyên nhân (đã xác minh bằng trình duyệt):** ở 390 px `.quick-access__list` là `display: grid` với ba cột (`repeat(auto-fit, minmax(92px, 1fr))`); `flex-grow` không tác dụng trên lưới. Ở 820 px nó là flex, và luật giãn đã đưa mồ côi về 0.
- **Trạng thái:** chưa sửa. Phương án: (a) đổi thanh "Đi nhanh" trên điện thoại sang hai cột, phần tử lẻ cuối chiếm cả hàng (cùng mẫu với tab học; đổi bố cục mọi thanh "Đi nhanh" trên điện thoại); (b) chấp nhận. Chờ chủ dự án chọn (D-09).

## Ghi chú về công cụ đo (không thuộc repo)

- Dòng tóm tắt của bộ đo tự viết trong phiên in số khóa của đối tượng (`Object.keys(v).length`), nên `orphanRows=2` lúc đầu thực ra là `{count, samples}`. Đọc số từ trường `count` trong JSON, không từ dòng tóm tắt.


## H2DEV-UI-021: chia đều chip trên điện thoại làm chữ xuống 3 đến 4 dòng

- **Triệu chứng:** đặt `flex: 1 1 0` cho mọi chip ở mọi cỡ màn hình. Ở 390 px, hàng "Tình trạng sống:" chỉ còn chip rộng 56 px và chữ xuống 3 đến 4 dòng. Hàng chỉ có chip (`/tai-lieu` 390 px) dồn 8 chip vào một dòng, mỗi chip 33 px.
- **Nguyên nhân (đã đo):** trên điện thoại chip có `white-space: normal` (luật D2). Với `flex-basis: 0`, kích thước tối thiểu của chip chỉ bằng từ dài nhất, nên trình duyệt nhét nhiều chip vào một dòng rồi chia đều phần còn lại, làm chip bị bóp.
- **Cách xử lý:** chia đều chỉ áp dụng từ 641 px cho hàng có nhãn đi kèm và tối đa 4 chip. Trên điện thoại giữ `flex: 1 1 auto` như trước vòng này. Bên đọc độc lập đo được ở 641–659 px chip "Đã dừng / DIE · 68" xuống 2 dòng (cao 46 px); đã thêm `min-width: max-content` để chip không bao giờ hẹp hơn chữ (sau sửa: ba chip cùng 44 px cao ở 641, 650, 660, 700, 820, 1024, 1440 px).
- **Guardrail:** trước khi đặt `flex-basis: 0` cho một hàng, đo chiều rộng tối thiểu của phần tử và kiểm xem có chữ nào xuống quá 2 dòng không. Hàng có chữ dài trong khung hẹp không được chia đều.
- **Rủi ro còn mở:** trên điện thoại, G-2 chưa đạt ở hàng có nhãn và hàng chip thuần (lệch 30 đến 40 px). Đây là quyết định của chủ dự án (xem báo cáo).

## H2DEV-UI-022: nhãn KPI "Ngách có data" bị chữ lẻ

- **Triệu chứng:** nhãn ngắt thành "Ngách có" và "data" (chữ lẻ, vi phạm T-8).
- **Cách sửa:** `text-wrap: balance` cho `.bento-card .stat-label` trong khối tới 640 px (D1). Kết quả: "Ngách" và "có data". Số liệu: nhãn vẫn cao 32 px (hai dòng), các giá trị số vẫn thẳng hàng (`valueTop` = 9 px ở cả bốn thẻ).
- **Chưa làm:** rút ngắn chữ. Việc này cần chủ dự án chọn chữ.

## H2DEV-UI-023: route `/api/intelligence/spider` gọi mạng và ghi DB khi GET (D-05)

- **Triệu chứng:** GET tới route chạy crawl YouTube và ghi `data/intelligence.db`. Không có caller nào trong giao diện (đã grep toàn repo; chỉ có tài liệu và bản sao lưu).
- **Đã làm (`server.js`):** route chỉ nhận POST kèm header `X-H2DEV-Action: spider`. GET trả 405, POST không có header trả 403. Preflight không cho phép header này (`Access-Control-Allow-Headers: Content-Type, Range`), nên trang từ origin khác bị trình duyệt chặn trước khi gửi POST. Đo: trang `localhost:8898` gọi POST tới `127.0.0.1:8898` nhận `Failed to fetch`, không có request nào rời trình duyệt, `intelligence.db` không đổi.
- **Giới hạn:** đây là chặn từ trình duyệt (CSRF), không phải xác thực. Máy trong LAN hoặc tailnet vẫn gọi được nếu biết header (tên header nằm trong mã nguồn, không phải bí mật). Server không kiểm `Host`, nên DNS rebinding về lý thuyết có thể biến request thành cùng nguồn và tự gửi header (suy luận, chưa dựng thử). Hướng tăng cường: kiểm `Host` theo danh sách cho phép, hoặc khóa bằng token bí mật. Bên đọc độc lập thử GET, HEAD, PUT, POST không header, header sai, method-override và chín biến thể đường dẫn (`//`, `%73pider`, `;x`, `/./`...): không tìm thấy lối vòng.
- **Tường lửa:** quy tắc `H2DEV-8899` (tạo bởi `scripts/windows/H2DEV-OneClick.cmd` dòng 44, với `profile=any`) cho phép cổng 8899 trên Public. Quy tắc `Node.js JavaScript Runtime` cũng cho `node.exe` qua mọi cổng trên Public. Chỉ đổi H2DEV-8899 sang Private là chưa đủ; cần luật CHẶN TCP 8899 cho Public, vì luật chặn thắng luật cho phép. Luật chặn `H2DEV-8899 chan Public` đã tạo (xem báo cáo, mục 3).
- **Vận hành:** dịch vụ `H2DEV_Service` được khởi động lại lúc 09:00:13 bởi tiến trình không thuộc phiên này. Code mới đã được nạp (POST không có header trả 403, DB không đổi).
- **Guardrail:** trước khi đổi hành vi một route GET, tìm mọi caller (kể cả tài liệu và bản sao lưu), và kiểm DB không đổi khi thử.

## H2DEV-UI-024: commit của việc khác đã chứa đợt 2; thư mục lưu trữ bị gitignore

- **Triệu chứng:** `git status` sạch trong khi các thay đổi đợt 2 đã vào commit `800caa4` (message "feat(strategy)…", không nhắc UI). Ba script chưa theo dõi được chuyển vào `_archive/2026-10-09-audit-scripts/` lúc 08:44. `.gitignore:10` bỏ qua `_archive/`, nên chúng không hiện trong git status.
- **Đã xác minh:** trong các transcript đã lưu của dự án này không có lệnh chuyển file; phiên hiện tại không có lệnh `mv`/`cp` với thư mục đó. Chủ sở hữu thật vẫn chưa rõ.
- **Guardrail:** trước khi kết luận "chưa commit", đối chiếu `git log -- <file>` và `git check-ignore -v`. Tài liệu trạng thái phải cập nhật khi có commit khác.


## H2DEV-UI-025: thanh nút `/chienluoc` thêm nút thứ 6 làm tràn khung phụ cố định 48 px

- **Triệu chứng:** audit báo mồ côi ở `/chienluoc` 360 và 390 px (nút "Tất cả" đứng một mình), lần đo trước bằng 0.
- **Nguyên nhân (đã xác minh):** commit `800caa4` (công việc chiến lược) thêm nút thứ 6 vào thanh `quick-access--topbar` (`assets/app/main.js:756`). Thanh là lưới 5 cột (`viddar.css`), nên 6 nút thành hai hàng cao 92 px, trong khi `.vd-topbar-subnav` cao cố định 48 px và căn giữa. Nội dung tràn lên 22 px (hàng đầu nằm dưới dòng tiêu đề) và tràn xuống (hàng hai nằm ngoài tiêu đề cao 98 px). Hit-test `elementFromPoint`: với CSS của HEAD, nút thứ 6 bị tiêu đề che.
- **Đã thử và gỡ:** 3 cột × 2 hàng. Audit mồ côi về 0 nhưng hit-test cho thấy 3 nút bị che. Audit mồ côi chỉ nhìn số hàng, không thấy chồng lớp.
- **Cách sửa:** `viddar.css`, trong khối tới 640 px, thanh có đúng 6 nút dùng `repeat(6, minmax(76px, 1fr))`; dải phụ vốn có `overflow-x: auto` nên cuộn ngang. Đo ở 360, 390, 820 và 1440 px: 6/6 nút trong tiêu đề, cao 44 px (36 px ở 1440 px), không bị che, không cắt chữ; hai nút cuối cuộn tới được.
- **Guardrail:** khi thêm một nút vào dải có chiều cao cố định, đo chiều cao nội dung so với chiều cao dải và hit-test từng nút. Kiểm "mồ côi bằng 0" chưa đủ.


## H2DEV-UI-026: nút "Cuộn lên đầu trang" bị thanh điều hướng dưới che ở 640–1024 px

- **Triệu chứng:** kiểm lại `/tatca` ở 820 và 1024 px, sau khi cuộn hết trang, phần tử tương tác thấp nhất (nút `btn-back-to-top`) có đáy ở 828 px trong khung nhìn 844 px, thấp hơn đỉnh thanh điều hướng dưới (788 px). Ảnh chụp: chỉ lộ một vệt nhỏ ở mép phải.
- **Nguyên nhân (đã xác minh):** `assets/h2dev-shell.css` nâng nút lên `bottom: 76px` chỉ ở `max-width: 639px`. Thanh `.vd-bottom-nav` (cao 56 px, z-index 100 so với 60 của nút) hiện từ 1024 px trở xuống. Hai điểm ngắt không khớp nhau.
- **Cách sửa:** `@media (max-width: 1024px) { body:has(.vd-bottom-nav) .h2-shell-backtotop { bottom: 76px; } }`. Sau sửa đáy nút 768 px, cách thanh 20 px, không bị che ở 360, 390, 820, 1024 px; ở 1440 px thanh ẩn nên giữ nguyên.
- **Phạm vi:** nút là thành phần dùng chung. Đã hit-test sau khi cuộn hết ở 12 route × 5 cỡ = 60 tổ hợp: 0 nút bị che.
- **Bẫy khi đo:** hit-test không cuộn báo giả 4 nút ở 820 px và 2 nút ở 1024 px (các hàng sát đáy màn hình đầu tiên nằm dưới thanh cố định). Phải cuộn từng phần tử vào giữa màn hình rồi mới kiểm. Ảnh toàn trang cũng vẽ thanh cố định ở giữa trang (vị trí khung nhìn), không phải lỗi.
- **Guardrail:** điểm ngắt của một thành phần nổi phải khớp điểm ngắt của thanh cố định mà nó phải tránh. Sau khi sửa bố cục, cuộn hết trang rồi hit-test phần tử thấp nhất.


## H2DEV-UI-027: trang bài học mất vòng focus của bảy loại điều khiển

- **Triệu chứng:** quét focus 12 route bằng bàn phím: 17 phần tử trên `/lotrinh/<SKU>` có `outline: none` và `box-shadow: none` khi focus (Bài trước, Bài tiếp theo, Bài học gốc, Tải MP4, Chưa xem, Bỏ tiến độ, các mốc thời gian).
- **Nguyên nhân (đã xác minh bằng danh sách quy tắc khớp):** `assets/player.css` có `box-shadow: none !important` ở `#psources > a`, `.player-controls #btn…` và `#insightTimeline > button`. Quy tắc `button:focus-visible { box-shadow: var(--focus-ring) }` của `viddar.css` không thắng được `!important`.
- **Cách sửa:** cuối `player.css`, quy tắc `:focus-visible` cho đúng các bộ chọn đó, `box-shadow: var(--focus-ring) !important`. Quét lại 5 loại trang bài học: 243 phần tử, 0 thiếu vòng.
- **Guardrail:** khi một khối đặt `box-shadow: none !important` (hoặc `outline: none`) cho điều khiển, phải đặt kèm quy tắc `:focus-visible` cùng độ ưu tiên ngay sau nó.

## H2DEV-UI-028: ba báo động giả khi đo vòng focus và số thẻ

- **Chuyển tiếp:** đo `box-shadow` ngay sau Tab lúc còn chuyển tiếp 0,2 s cho giá trị trong suốt. Đợi tối thiểu 400 ms rồi mới đo.
- **Vòng mặc định `outline: auto`:** Chrome vẽ vòng hai lớp tối và trắng, thấy được trên nền tối dù màu tính ra là gần đen. Chụp ảnh trước khi kết luận.
- **Đếm thẻ:** đếm liên kết `/lotrinh/VIDEO-…` thiếu buổi Zoom (`/lotrinh/ZOOM-…`). Dùng dòng tổng kết ("45/144") và số trang.
- **Guardrail:** phát hiện từ máy đo phải qua ảnh hoặc cách đo thứ hai trước khi vào danh sách sửa.

## H2DEV-UI-029: đếm "file local" lẫn địa chỉ web

- **Triệu chứng:** thẻ KPI "Kịch bản & Tài liệu" ghi 275 file local, thực tế 269.
- **Nguyên nhân:** sáu mục công cụ có trường `file` là địa chỉ web (`https://coverr.co/`, v.v.) nên điều kiện `x.file` coi là file local. Tab Tài liệu đếm sai theo cùng cách (275 / 25, nay 269 / 31).
- **Cách sửa:** `isLocalDocFile(f)` trong `assets/app/tabs/content.js`: chuỗi không rỗng và không bắt đầu bằng `http(s)://`. Kiểm: 269 file đều có trên đĩa, 0 byte không có, 6 mục địa chỉ web đều có `link` trùng.
- **Guardrail:** con số trên màn hình phải đối chiếu với đĩa, không chỉ với trường dữ liệu.

## H2DEV-UI-030: tên truy cập của logo không chứa chữ hiển thị (WCAG 2.5.3)

- **Triệu chứng:** Lighthouse máy tính: `label-content-name-mismatch` ở `.vd-brand`.
- **Cách sửa:** `assets/app/main.js`: `aria-label` = chữ hiển thị + " — Về trang chủ Tổng quan". Lighthouse máy tính: 54 đạt và 1 lỗi, nay 55 đạt và 0 lỗi.
- **Ghi chú:** thẻ KPI và logo trước đó dùng vòng focus trắng mặc định (nhìn thấy được); đã đồng bộ sang `var(--focus-ring)` của dự án trong `viddar.css`.
