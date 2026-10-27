# BỘ MASTER PROMPT CODE TOOL TỰ ĐỘNG TẠO ẢNH & VIDEO NHẤT QUÁN NHÂN VẬT TRÊN GOOGLE FLOW (`VIDEO-17e135`)

> **Bài giảng:** Bài 35 — *Update Quy Trình Sản Xuất tool Tự Động Và Nhất Quán Nhân Vật* (`DGMD-M10`)  
> **Giảng viên:** Đại Gia Mang Dép (Hiếu Mang Dép)  
> **Tài liệu Google Docs gốc:** [BÀI 1 CODE TOOL TẠO ẢNH VÀ VIDEO NHẤT QUÁN NHÂN VẬT FLOW](https://docs.google.com/document/d/1dOgdumKy_kHHgbdMaTuQNhPEGIF1nj9tweodivyS7HE/edit?usp=sharing)  
> **Công cụ cốt lõi:** `Google Flow` (`labs.google/fx/vi/tools/flow` — gói `Veo 3 Ultra`), `ChatGPT`, `Pinterest`

---

## 1. CÂU PROMPT YÊU CẦU CHATGPT SINH MASTER PROMPT CODE TOOL GOOGLE FLOW (NGUYÊN BẢN TỪ TÀI LIỆU GỐC)

Copy nguyên văn đoạn lệnh dưới đây gửi vào **ChatGPT** để yêu cầu AI đóng vai chuyên gia lập trình công cụ và sinh ra bản đặc tả **Master Prompt** chi tiết dùng cho mục **Công cụ -> + Tạo mới** trong **Google Flow**:

```text
Hãy tạo cho tôi 1 master prompt  , nhưng đầu tiên bạn hãy đóng vai thành 1 nhà chuyên gia về code tool , hãy tạo cho tôi 1 master prompt để gửi trực tiếp vào google flow để tạo 1 tool tự động tạo ảnh  , trong tool có nút thêm hình ảnh tham chiếu có thể thêm nhiều hình ảnh để ghi nhớ , có các kích thước tạo ảnh 16.9 , 4.3 , 1.1 , 3.4 , 9.16 , có thể lựa chọn số ảnh cho từng prompt 1 ảnh , 2 ảnh , 3 ảnh , hoặc 4 ảnh , tool tự động gửi ảnh tham chiếu nhân vật nếu có hình ảnh nhân vật tham chiếu , và có các rất nhiều dòng có thể tự động khi tôi vất 1 danh sách prompt vào , tool sẽ tự động lấy từng prompt 1 để tạo ảnh , yêu cầu tạo 5 prompt 1 lúc , và tạo liên tục , tốc độ tạo ảnh nhanh , tool có tên là đại gia mang dép , tool có nút yêu cầu tải về file về thư mục để mình lựa chọn các thư mục bất kỳ , khi tải ảnh về tool sẽ tự động nhớ từng hình ảnh 1 để đánh dấu khi tải vào file , tool tạo ảnh nào sẽ tự động tải ảnh đó về , tool có giao diện đẹp , giao diện bắt mắt , yêu cầu tạo cho tôi 1 master prompt chi tiết để gửi cho google flow
```

---

## 2. CẤU TRÚC BẢN ĐẶC TẢ MASTER PROMPT DO CHATGPT SINH RA ĐỂ DÁN VÀO GOOGLE FLOW (`05:40` – `07:50`)

Khi gửi câu lệnh số 1 vào **ChatGPT**, hệ thống sẽ đóng gói một bản **Master Prompt** hơn 13 hạng mục kỹ thuật để gửi vào **Trình tạo công cụ** của **Google Flow** (`Hãy bắt đầu xây dựng Tool **ĐẠI GIA MANG DÉP – AI IMAGE AUTOMATION** ngay bây giờ`):

1. **Tên công cụ & Giao diện:** `ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION` (`PHIÊN BẢN V1.0.1`), bố cục Dashboard hiện đại gồm 4 tab điều khiển: `Nhập File`, `Tiến trình`, `Tham chiếu`, `Thư viện`.
2. **Module Ảnh Tham Chiếu Nhân Vật (`Character Reference Memory`):**
   - Nút **Thêm ảnh tham chiếu** cho phép tải lên 1 hoặc nhiều hình ảnh nhân vật (ví dụ: 5 nhân vật xuyên suốt bộ phim hoặc nhân vật `Rumi`).
   - Nút bật/tắt **Khóa định dạng đồng nhất nhân vật**: Tự động đính kèm ảnh tham chiếu nhân vật vào mọi request sinh ảnh trong hàng đợi.
3. **Cấu hình Thông số Khung hình & Số lượng:**
   - **Tỷ lệ khung hình (`Aspect Ratio`):** `16:9` (Video ngang YouTube), `4:3`, `1:1`, `3:4`, `9:16` (Shorts/TikTok/Reels).
   - **Số lượng ảnh mỗi Prompt:** Tuỳ chọn `1 ảnh`, `2 ảnh`, `3 ảnh`, hoặc `4 ảnh` trên 1 prompt.
4. **Hàng đợi Đa luồng (`Batch Queue 5 Concurrent Workers`):**
   - Ô nhập liệu đa dòng cho phép dán danh sách 100–1.000 prompt cùng lúc và nhấn **Phân tích**.
   - Cơ chế chạy song song **5 prompt cùng lúc** (`#0001` đến `#0005` ở trạng thái `ĐANG CHẠY`, các prompt tiếp theo ở trạng thái `CHỜ`), hoàn tất lô 5 ảnh tự động cuốn chiếu sang 5 prompt kế tiếp.
5. **Tự động Tải xuống & Chống trùng lặp (`Auto-Download & Deduplication`):**
   - Nút chọn thư mục lưu trữ bất kỳ trên máy tính.
   - Cơ chế ghi nhớ từng ảnh đã tải bằng ID/hash của tệp ảnh, gắn nhãn trạng thái rõ ràng: `Chưa tải`, `Đang tải`, `Đã tải`, `Tải thất bại`, `Trùng file`. Ảnh nào render xong tự động tải ngay về thư mục đích.

---

## 3. CÂU PROMPT THAM CHIẾU NHÂN VẬT SINH 100 PROMPT ĐỒNG NHẤT (NGUYÊN BẢN TỪ TÀI LIỆU GỐC)

Sau khi tải hình ảnh nhân vật mẫu từ **Pinterest** (ví dụ: nhân vật `Rumi` hoặc `Stickman`), đính kèm ảnh đó vào **ChatGPT** cùng câu lệnh nguyên văn dưới đây:

```text
yêu cầu tạo cho tôi 1 master prompt tạo cho tôi 100 prompt , khi dùng hình ảnh này tạo lên flow làm nhân vật tham chiếu , thay đổi cử chỉ hành động cho từng prompt , sáng tạo các bối cảnh cùng 1 phong cách với nhân vật , các prompt tạo hình ảnh kích thước 16.9 , sáng tạo 1 master prompt trả 100 prompt chi tiết đầy đủ , không cần đánh dấu prompt
```

### Quy tắc Khóa Nhân Vật & Lệnh Gọi 100 Prompt (`11:08` – `13:13`)
- **Bước A (Khởi tạo Master Prompt khóa nhân vật):** ChatGPT phân tích ảnh nhân vật đính kèm và sinh ra khung **Master Prompt** khóa chặt nhận diện khuôn mặt, kiểu tóc, màu tóc, trang phục kèm điều kiện ràng buộc âm (`No character redesign, no different face, no different hairstyle, no different hair color, no short hair`) và quy tắc tự kiểm tra độ dài đồng đều cho mọi câu lệnh.
- **Bước B (Kích hoạt xuất 100 Prompt):** Gõ tiếp câu lệnh ngắn:
  ```text
  tạo 100 prompt cho tôi
  ```
- **Kết quả đầu ra:** ChatGPT trả về 100 đoạn prompt chi tiết có độ dài tương đương nhau, **không đánh số thứ tự đầu dòng**, mỗi dòng là một phân cảnh hoàn chỉnh (thay đổi tư thế, biểu cảm, hành động và bối cảnh đồng nhất phong cách) sẵn sàng copy dán thẳng vào ô nhận diện hàng loạt của tool **Đại Gia Mang Dép** trên **Google Flow**.
