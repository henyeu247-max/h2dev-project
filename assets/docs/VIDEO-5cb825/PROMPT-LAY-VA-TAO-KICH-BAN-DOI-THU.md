# Bộ Prompt Chuẩn: Trích Xuất & Tái Cấu Trúc Kịch Bản Kênh Đối Thủ (Reverse Engineering)

> **Mã bài học:** `VIDEO-5cb825`  
> **Chủ đề:** Hướng dẫn lấy kịch bản video đối thủ và dùng prompt ChatGPT tạo kịch bản mới  
> **Áp dụng:** Ngách triết lý khắc kỷ thị trường ngoại

---

## 1. TỔNG QUAN NGÁCH VÀ KÊNH ĐỐI THỦ
- Tác giả show doanh thu 7 ngày quy ra tiền Việt Nam Đồng trên app điện thoại theo yêu cầu bình luận của người xem, rồi hướng dẫn làm ngách triết lý khắc kỷ.
- Tác giả show khoảng 6 đến 7 kênh đối thủ. Dạng này view rất cao và RPM cũng rất cao. Video không dài, tùy kênh và kịch bản, khoảng 2 mấy đến 30 phút là ổn.
- Một kênh đối thủ có video 1 triệu view cách đây 3 tuần, view đều và ổn định. Kênh khác đo được gần 3.000 đô.
- Một kênh khác có 42 video, hơn 13.000 đô, mới lập từ tháng 3 (khoảng 3 tháng trước), RPM gần 6 (5.9), khán giả chủ yếu là nam.
- Ngách triết lý có rất nhiều ngách nhỏ; tác giả nhắc lại video tư duy tìm key để hiểu cách tìm ngách nhỏ, quan trọng là ngách cực nhỏ.

---

## 2. QUY TRÌNH THEO LỜI TÁC GIẢ

### Bước 1: Lấy kịch bản của video đối thủ
- Vào kênh đối thủ, chọn video phổ biến nhất (ví dụ video 1 triệu view), sao chép link video.
- Dán link vào một tool free chuyên lấy kịch bản (link tool để ở phần mô tả); tool lấy toàn bộ lời thoại trong video đó.
- Copy kịch bản vừa lấy rồi dán vào ChatGPT.

### Bước 2: Dùng prompt của tác giả để viết kịch bản mới
- Prompt của tác giả (để ở phần mô tả) gồm bản tiếng Việt chỉ để người xem hiểu prompt viết về gì, và bản tiếng Anh; nên dùng bản tiếng Anh để dán vào ChatGPT cho đúng hơn.
- Prompt yêu cầu viết kịch bản chia thành 3 phần vì AI không viết dài được một lần. Có thể chỉnh số phần theo yêu cầu; viết xong phần 1 thì bấm Continue để AI viết tiếp phần tiếp theo cho đến khi đủ.
- Prompt cũng có phần viết lại tiêu đề video, mô tả và phần tạo hình ảnh. Phần tiêu đề và mô tả có thể tự làm, hoặc bám theo đối thủ mà không cần nhờ ChatGPT.

### Bước 3: Gom kịch bản và tạo giọng đọc
- Copy từng phần kịch bản dán nối nhau vào Notepad++ (hoặc Word, hoặc ứng dụng nào cũng được).
- Dùng ElevenLabs tạo giọng đọc: dán kịch bản vào hoặc tải file kịch bản lên. Có nhiều công cụ AI chuyển văn bản thành giọng, nhưng theo tác giả làm view ngoại thì ElevenLabs tốt nhất.

### Bước 4: Tạo hình ảnh
- Nhờ ChatGPT tạo các prompt hình ảnh xuyên suốt phù hợp kịch bản; yêu cầu mẫu của tác giả là tạo 30 prompt ảnh.
- Copy từng prompt sang công cụ AI tạo ảnh (tác giả làm mẫu bằng bản free của Leonardo; có thể dùng công cụ khác tùy nhu cầu).

### Bước 5: Dựng video
- Tải ảnh về, đưa ảnh và âm thanh kịch bản vào phần mềm dựng, thêm hiệu ứng phim cho đẹp.
- Làm phụ đề, chuyển sang tiếng Anh.
- Âm thanh nền: lấy trong thư viện nhạc free không bản quyền, giảm âm lượng nền xuống một chút.
- Tác giả chỉ dựng demo khoảng 30 giây trong video hướng dẫn.
