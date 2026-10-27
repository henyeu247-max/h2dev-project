# Cẩm Nang Thực Chiến & Master Prompt Tạo Tool Tự Động Hóa Sinh Ảnh Nhân Vật Nhất Quán (VIDEO-27e4e0)

> **Mã học phần:** `VIDEO-27e4e0` (Bài 45 - Module `DGMD-M10`: Tooling & Tự Động Hóa YouTube)
> **Giảng viên:** Đại Gia Mang Dép (DGMD Academy)
> **Nền tảng thực thi trên màn hình:** Google Flow (`labs.google/fx/vi/tools/flow` — tính năng `Công cụ` / `Trình tạo công cụ`, model `Nano Banana Pro` / `Nano Banana 2`), ChatGPT (`chatgpt.com`), Google Docs (`Tạo ra tool veo3`)

---

## 1. KIẾN TRÚC TOOL TỰ ĐỘNG HÓA TRÊN GOOGLE FLOW (`TRÌNH TẠO CÔNG CỤ`)

| Thành phần giao diện | Thông số / Tính năng hiển thị trên màn hình (`02:55` & `05:10`) | Cơ chế vận hành tự động |
| :--- | :--- | :--- |
| **Tên công cụ** | **ĐẠI GIA MANG DÉP** `PRO AUTOMATION` — *Hệ thống tạo ảnh AI hàng loạt tối ưu* (`VERSION 1.0.4`) | Có thể đổi tên thương hiệu cá nhân ngay trong câu lệnh Master Prompt trước khi tạo tool |
| **Ảnh tham chiếu (`ẢNH THAM CHIẾU`)** | Nút `+ Thêm mới`, hiển thị thumbnail ảnh nhân vật người que (`Stickman`) kèm nhãn tích xanh `NHÂN VẬT ✓` | Tự động ghi nhớ và đính kèm ảnh nhân vật gốc vào mọi câu lệnh trong hàng đợi để khóa chặt nhận diện 100% |
| **Cấu hình tạo ảnh (`CẤU HÌNH TẠO ẢNH`)** | - **Tỷ lệ khung hình:** `16:9` (hỗ trợ `16:9`, `4:3`, `1:1`, `3:4`, `9:16`)<br>- **Ảnh / Prompt:** `1 ảnh`, `2 ảnh`, `3 ảnh`, `4 ảnh`<br>- **Chạy song song:** `5 prompt` (hoặc `8 prompt` cùng lúc) | Xử lý đa luồng 5 câu lệnh đồng thời; khi 5 lệnh đầu hoàn tất sẽ tự động cuốn chiếu sang 5 lệnh tiếp theo |
| **Danh sách Prompt (`DANH SÁCH PROMPT`)** | Ô văn bản nhiều dòng + nút `Cập nhật danh sách` | Tự động tách từng dòng thành 1 Prompt riêng biệt, bỏ qua dòng trống và đẩy sang cột `HÀNG ĐỢI THỰC THI` đánh số từ `01` đến `20` |
| **Bộ đếm & Điều khiển** | Bộ đếm `TỔNG: 20` · `ĐANG CHẠY: 0` · `HOÀN THÀNH: 0` · `LỖI: 0` + nút `▶ Bắt đầu chạy` | Tự động thử lại tối đa 3 lần nếu lỗi và tự động tải ảnh về máy theo định dạng `prompt_001_image_01.png` |

---

## 2. NGUYÊN VĂN BẢN MASTER PROMPT TẠO TOOL TRÊN GOOGLE FLOW (TỪ TÀI LIỆU `Tạo ra tool veo3`)

> **Cách sử dụng:** Mở `labs.google/fx/vi/tools/flow` -> bấm **Dự án mới** -> chọn mục **Công cụ** ở thanh bên trái -> bấm **Tạo công cụ** -> dán toàn bộ câu lệnh dưới đây vào khung **Trình tạo công cụ** để AI tự động viết code và dựng giao diện trong 5–10 phút:

```text
Bạn hãy đóng vai là một chuyên gia code tool, chuyên gia UI/UX, chuyên gia automation và chuyên gia xây dựng công cụ tạo ảnh AI.
Hãy tạo cho tôi một tool tự động tạo ảnh AI có tên:
“ĐẠI GIA MANG DÉP”
Mục tiêu của tool:
Tạo một công cụ có giao diện đẹp, hiện đại, bắt mắt, dễ dùng, tốc độ nhanh, dùng để tự động tạo ảnh hàng loạt từ danh sách prompt, có thể thêm nhiều hình ảnh tham chiếu, tự động ghi nhớ ảnh tham chiếu, tự động gửi ảnh tham chiếu nhân vật vào từng prompt nếu có, tự động tải ảnh sau khi tạo xong về thư mục người dùng đã chọn.

YÊU CẦU GIAO DIỆN:
Thiết kế giao diện hiện đại, chuyên nghiệp, màu sắc nổi bật, dễ nhìn, phù hợp với một tool AI cao cấp.
Tên tool hiển thị lớn ở đầu trang:
“ĐẠI GIA MANG DÉP”
Giao diện gồm các khu vực chính:
1. Khu vực thêm hình ảnh tham chiếu
* Có nút “Thêm hình ảnh tham chiếu”
* Cho phép thêm nhiều hình ảnh cùng lúc
* Có thể kéo thả ảnh vào tool
* Mỗi ảnh tham chiếu sau khi thêm sẽ hiển thị thumbnail nhỏ
* Cho phép xóa từng ảnh tham chiếu
* Cho phép đánh dấu ảnh nào là “ảnh nhân vật”
* Tool phải tự động ghi nhớ các ảnh tham chiếu đã thêm
* Nếu có ảnh nhân vật tham chiếu, tool tự động gửi ảnh nhân vật đó kèm theo từng prompt khi tạo ảnh

2. Khu vực nhập danh sách prompt
* Có một ô nhập văn bản lớn nhiều dòng
* Tôi có thể dán một danh sách rất nhiều prompt vào
* Mỗi dòng là một prompt riêng biệt
* Tool tự động tách từng dòng thành từng prompt
* Bỏ qua dòng trống
* Có đánh số thứ tự prompt
* Có trạng thái: chưa tạo, đang tạo, đã tạo, lỗi

3. Khu vực chọn kích thước ảnh
Có menu chọn tỷ lệ ảnh gồm:
* 16:9
* 4:3
* 1:1
* 3:4
* 9:16

4. Khu vực chọn số ảnh cho mỗi prompt
Có menu chọn:
* 1 ảnh / prompt
* 2 ảnh / prompt
* 3 ảnh / prompt
* 4 ảnh / prompt

5. Khu vực chạy tự động
* Có nút “Bắt đầu tạo ảnh”
* Có nút “Tạm dừng”
* Có nút “Tiếp tục”
* Có nút “Dừng toàn bộ”
* Tool sẽ tự động lấy từng prompt trong danh sách để tạo ảnh
* Mỗi lần chạy xử lý 5 prompt cùng lúc
* Khi 5 prompt đầu xong thì tự động chạy tiếp 5 prompt tiếp theo
* Tool chạy liên tục cho đến khi hết danh sách prompt
* Ưu tiên tốc độ tạo ảnh nhanh, ổn định, không bị treo

6. Khu vực chọn thư mục tải ảnh
* Có nút “Chọn thư mục tải về”
* Người dùng có thể chọn bất kỳ thư mục nào trên máy
* Khi ảnh được tạo xong, tool tự động tải ảnh đó về thư mục đã chọn
* Không cần bấm tải thủ công từng ảnh
* Mỗi ảnh tải về phải được đặt tên rõ ràng theo số thứ tự prompt
Ví dụ:
prompt_001_image_01.png
prompt_001_image_02.png
prompt_002_image_01.png

7. Tính năng ghi nhớ ảnh đã tải
* Tool phải tự động ghi nhớ ảnh nào đã tạo
* Tool phải tự động đánh dấu ảnh nào đã tải về thành công
* Nếu ảnh đã tải rồi thì hiển thị trạng thái “Đã tải”
* Nếu lỗi tải thì hiển thị “Lỗi tải”
* Có thể tải lại ảnh bị lỗi
* Có thể tránh tải trùng ảnh

8. Khu vực hiển thị kết quả
* Hiển thị ảnh đã tạo theo từng prompt
* Mỗi prompt có nhóm ảnh riêng
* Có preview ảnh
* Có trạng thái tạo ảnh
* Có trạng thái tải về
* Có nút tải lại từng ảnh
* Có nút mở thư mục chứa ảnh

YÊU CẦU LOGIC HOẠT ĐỘNG:
Khi tôi dán danh sách prompt vào:
* Tool tự động đọc từng dòng
* Mỗi dòng là một prompt riêng
* Tool tạo hàng đợi prompt
* Tool chạy 5 prompt cùng lúc
* Mỗi prompt tạo theo số lượng ảnh đã chọn
* Nếu chọn 4 ảnh/prompt thì mỗi prompt tạo 4 ảnh
* Sau khi ảnh tạo xong, tool tự động tải về thư mục đã chọn
* Tool đánh dấu ảnh đã tải
* Tool tiếp tục chạy cho đến khi hết danh sách

YÊU CẦU VỀ ẢNH THAM CHIẾU:
* Tool cho phép thêm nhiều ảnh tham chiếu
* Ảnh tham chiếu có thể là nhân vật, sản phẩm, bối cảnh, phong cách
* Nếu ảnh được đánh dấu là “ảnh nhân vật”, tool phải tự động gửi ảnh đó vào mọi prompt để giữ nhân vật nhất quán
* Nếu có nhiều ảnh nhân vật, tool gửi tất cả ảnh nhân vật vào prompt
* Tool ghi nhớ ảnh tham chiếu trong phiên làm việc
* Có thể bật/tắt sử dụng ảnh tham chiếu

YÊU CẦU VỀ GIAO DIỆN ĐẸP:
Thiết kế giao diện theo phong cách:
* AI dashboard hiện đại
* Màu nền tối sang trọng
* Nút bấm nổi bật
* Bo góc mềm
* Có hiệu ứng hover
* Có thanh tiến trình tổng
* Có tiến trình từng prompt
* Có icon trực quan
* Bố cục rõ ràng, dễ thao tác
* Tối ưu dùng trên máy tính

YÊU CẦU TÍNH NĂNG BỔ SUNG:
* Có bộ đếm tổng số prompt
* Có bộ đếm số prompt đã hoàn thành
* Có bộ đếm số ảnh đã tạo
* Có bộ đếm số ảnh đã tải về
* Có log hoạt động
* Có thông báo khi hoàn thành toàn bộ
* Có thông báo khi gặp lỗi
* Có cơ chế thử lại tự động nếu tạo ảnh lỗi
* Có thể đặt số lần thử lại, mặc định 3 lần
* Không làm mất danh sách prompt khi lỗi
* Có thể tiếp tục từ prompt đang dở

YÊU CẦU ĐẦU RA:
Hãy tạo cho tôi một tool hoàn chỉnh có thể chạy được, giao diện đẹp, code sạch, dễ mở rộng, có đầy đủ các chức năng trên.
Ưu tiên:
* Tốc độ nhanh
* Tự động hóa tối đa
* Giao diện đẹp
* Dễ dùng
* Tạo ảnh hàng loạt ổn định
* Tự động tải ảnh về thư mục đã chọn
* Ghi nhớ và đánh dấu ảnh đã tải
Tên tool bắt buộc:
“ĐẠI GIA MANG DÉP”
Hãy xây dựng tool này như một sản phẩm chuyên nghiệp.
```

---

## 3. CÂU LỆNH TRÊN MÀN HÌNH YÊU CẦU CHATGPT SINH 20 PROMPT LIỀN MẠCH KHÔNG ĐÁNH SỐ (`03:12 - 04:12`)

Để nạp danh sách vào ô **DANH SÁCH PROMPT** của tool mà không bị lẫn dòng tiêu đề, giảng viên tải ảnh nhân vật Stickman lên ChatGPT và nhập câu lệnh:

```text
hãy tạo cho tôi 20 prompt để sử dụng hình ảnh này tạo ra hình ảnh trên flow , sáng tạo 20 prompt thay đổi cuộc sống hàng ngày của nhân vật này , thay đổi các góc quay cho từng prompt , sáng tạo các prompt chi tiết đầy đủ , các prompt liền mạch , không cần đánh dấu các prompt
```

### Mẫu các dòng Prompt tiếng Anh do ChatGPT xuất ra và nạp vào Hàng đợi thực thi (`04:25` & `05:10`):
```text
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, identical to the reference image. Taking photos in a vibrant flower garden using a camera, colorful blossoms everywhere, bright afternoon sun, camera perspective from behind flowers framing the subject, artistic cartoon composition.
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, same original appearance. Studying late at night at a desk filled with notebooks and sticky notes, desk lamp creating dramatic lighting, close-up frontal camera shot, cozy productivity atmosphere, detailed cartoon illustration.
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, unchanged design. Hiking on a mountain trail surrounded by forests and clouds, breathtaking landscape, wide cinematic landscape shot from a distant viewpoint, adventurous cartoon style, highly detailed environment.
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, preserving the exact original look. Visiting an aquarium, standing in front of a giant glass tank filled with sharks and colorful fish, blue underwater glow, camera angle from behind the character looking toward the tank.
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, maintaining original proportions and facial expression. Working remotely on a rooftop terrace overlooking a modern skyline, laptop on a small table, golden hour lighting, side profile medium shot, detailed cartoon illustration.
```
