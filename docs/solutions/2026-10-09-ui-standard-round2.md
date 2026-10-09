# UI-standard đợt 2: sự cố và bài học (H2DEV-UI-013 đến H2DEV-UI-020)

> Ngày: 2026-10-09. Nhánh: `ui/ui-standard-2026-10-09`. Thay đổi nằm trong working tree, chưa commit.
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
