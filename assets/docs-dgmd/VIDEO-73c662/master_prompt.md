# TÀI LIỆU HƯỚNG DẪN & BỘ CÂU LỆNH GỐC (MASTER PROMPT)
**Bài 19 (DGMD-M06):** Quy Trình Sản Xuất Video PODCAST Sức Khỏe (AI Doctor Podcast Nhất Quán Nhân Vật & Giọng Nói)
**Mã bài học:** `VIDEO-73c662`
**Giảng viên:** Đại Gia Mang Dép (DGMD Academy)
**Tài liệu Google Docs đính kèm:** `1zbyKlWjmIK4bj9B_xyMcZX04yh7JWCLxyVcCRohaolY` (Bản gốc đầy đủ lưu tại [`assets/docs-dgmd/VIDEO-73c662/doc_1.txt`](./doc_1.txt))

---

## 1. BỘ 4 PROMPT KỸ THUẬT TẠO KHUNG NỀN, NHÂN VẬT BÁC SĨ, VIDEO VEO 3 & THUMBNAIL

### 1.1. Prompt 1 — Tạo Khung hình nền Overlay 2 cửa sổ phông xanh (Dùng trên ChatGPT Plus/Pro)
*(Đính kèm ảnh chụp màn hình bố cục video của kênh đối thủ `@PodcastTimMạch` rồi dán câu lệnh sau — lưu ý thêm cụm từ `xóa bỏ dòng chữ ở phía dưới` nếu ảnh chụp dính phụ đề)*

```text
ảnh nền : xóa bỏ cho tôi 2 chi tiết trong 2 khung hình bên phải và bên trái , giữ nguyên các khung , thay đổi các khung sang màu đỏ , thay đổi dòng chữ podcast tim mạch , sang dòng chữ podcast sức khỏe chủ động , còn lại giữ nguyên chi tiết , đổi 2 nền trong 2 khung hình sang màu xanh lá cây hình ảnh sắc nét, kích thước hình ảnh 16.9 , xóa bỏ dòng chữ ở phía dưới
```

---

### 1.2. Prompt 2 — Trích xuất Prompt & Tạo ảnh Nhân vật Bác sĩ Việt Nam độc bản (Tỷ lệ 9:16)
*(Bước A: Đính kèm ảnh chụp bác sĩ mẫu vào ChatGPT và dán câu lệnh dưới đây để lấy 1 đoạn Prompt mô tả chi tiết)*
*(Bước B: Mở một đoạn chat mới trên ChatGPT, bật công cụ **Tạo ảnh**, dán đoạn Prompt vừa sinh ra để tạo hình ảnh Bác sĩ AI `9:16` dùng cố định xuyên suốt toàn kênh)*

```text
ảnh nhân vật : hãy tạo cho tôi 1 prompt để tạo lại hình ảnh này , sáng tạo 1 prompt tạo ảnh bác sĩ , 1 nhân vật bác sĩ nam người việt nam , mặc bộ trang phục quần áo bác sĩ , có đeo kính , nhìn tri thức , bối cảnh phía sau là nơi làm việc trong bệnh viện , hình ảnh 9.16 , hình ảnh sắc nét , yêu cầu chi tiết nhân vật tư thế như hình ảnh gốc mà tôi gửi .
```

---

### 1.3. Prompt 3 — Tạo Video Bác sĩ nói Podcast khớp khẩu hình Tiếng Việt trên Google Flow (Veo 3)
*(Trên Google Flow `labs.google/fx/vi/tools/flow`, bấm dấu `+` tải **Ảnh Bác sĩ 9:16** lên làm Thành phần tham chiếu + bấm dấu `+ -> Giọng nói` chọn cố định **1 giọng nam**, chế độ **Video | 9:16 | 1x**, rồi dán câu lệnh sau — thay phần `"câu thoại"` bằng từng câu ngắn khoảng 8 giây trong kịch bản)*

```text
Sử dụng hình ảnh gốc này , hãy tạo cho tôi 1 video podcast chân thực , giữ nguyên 100% nhân vật nam trong ảnh , khuân mặt , kiểu tóc , kính mắt , trang phục , tư thế ngồi , Camera cố định hoàn toàn ở một góc chính diện trung cảnh, không zoom, không lia máy, không rung máy, không thay đổi bố cục. Nhân vật nam ngồi yên trên ghế, cơ thể gần như không di chuyển, chỉ có chuyển động tự nhiên rất nhẹ ở môi, mắt và nét mặt khi nói. Ánh mắt nhìn thẳng vào camera, biểu cảm nghiêm túc, điềm tĩnh, có chiều sâu như một người nói podcast ,Không thêm nhân vật khác, không thay đổi bối cảnh, không thêm hiệu ứng, không thêm chữ trên màn hình, không thêm nhạc nền, không thêm âm thanh phụ.
Nhân vật nam nói bằng tiếng việt , với giọng rõ ràng, chậm rãi , truyền cảm , phù hợp phong cách kể podcast .
"câu thoại "
Yêu cầu kỹ thuật: không thêm từ hoặc bớt từ vào câu thoại ,video chân thực, phong cách phỏng vấn tài liệu, ánh sáng tự nhiên ấm áp, môi khớp chính xác với lời thoại tiếng Việt, biểu cảm tự nhiên, không cử động tay, không quay đầu, không thay đổi góc máy, giữ nguyên nhân vật và toàn bộ bối cảnh như ảnh gốc.
```

---

### 1.4. Prompt 4 — Tạo Hình ảnh Thumbnail Bác sĩ 16:9 trên Google Flow (Nano Banana Pro)
*(Trên Google Flow, giữ nguyên ảnh Bác sĩ làm tham chiếu, chuyển từ chế độ Video sang **Hình ảnh (Image) | 16:9 | x2 | Nano Banana Pro**, dán câu lệnh sau — có thể thay `bị đau cổ` bằng `đau vai`, `đau ngực`, `chóng mặt`, `cầm máy đo huyết áp` tùy chủ đề video)*

```text
hãy tạo cho tôi 1 hình ảnh , góc nhìn trung cảnh nhân vật bác sĩ này , nhân vật đang có cảm giác bị đau cổ , bối cảnh nơi làm việc trong bệnh viện , chỉ có 1 mình nhân vật bác sĩ không có thêm nhân vật nào khác trong khung hình , nhân vật được đặt vị trí phía bên tay trái sát phía bên trái hình ảnh , hình ảnh 16.9 , hình ảnh sắc nét
```

---

## 2. MASTER PROMPT 7 PHẦN — XÂY DỰNG 100 Ý TƯỞNG & KỊCH BẢN PODCAST SỨC KHỎE 17 MỤC

```text
Bạn là chuyên gia sáng tạo nội dung podcast sức khỏe cho người Việt Nam, bác sĩ tư vấn truyền thông y tế, biên kịch YouTube chuyên nghiệp và chuyên gia xây dựng kênh podcast sức khỏe dành cho người trung niên, người cao tuổi và gia đình Việt Nam.

Từ bây giờ, trong cuộc trò chuyện này, hãy ghi nhớ phong cách sản xuất nội dung sau:
Kênh podcast hướng đến người Việt Nam, đặc biệt là cô chú trên 50 tuổi, 60 tuổi, người đang quan tâm đến tim mạch, huyết áp, tiểu đường, mỡ máu, đột quỵ, trí nhớ, giấc ngủ, gan thận, xương khớp, thuốc men, dinh dưỡng và chăm sóc sức khỏe chủ động.

Phong cách nội dung phải giống một bác sĩ đang trò chuyện chân thành với cô chú:
* Giọng văn gần gũi, chậm rãi, dễ hiểu.
* Mở đầu có lời chào và giới thiệu podcast.
* Có một vấn đề sức khỏe âm thầm nhưng nguy hiểm.
* Có câu cảnh báo khiến người nghe muốn nghe tiếp.
* Có giải thích y khoa bằng ví dụ đời thường.
* Có một câu chuyện bệnh nhân giả định để minh họa.
* Có phần phân tích nguyên nhân, dấu hiệu, hậu quả.
* Có phần hướng dẫn người nghe cần hỏi gì với bác sĩ.
* Có lời kêu gọi bình luận, đăng ký, chia sẻ.
* Có cảnh báo y khoa: không tự ý ngưng thuốc, đổi thuốc, tự điều trị; cần hỏi bác sĩ điều trị trực tiếp.

Nhiệm vụ của bạn:
Hãy tạo cho tôi 100 ý tưởng podcast sức khỏe theo phong cách trên. Mỗi ý tưởng phải có khả năng phát triển thành một kịch bản podcast dài 20–30 phút.

PHẦN 1: Ý TƯỞNG TÔI MUỐN THAY ĐỔI CHO TỪNG KỊCH BẢN
Kịch bản 1: [Tôi có thể nhập ý tưởng riêng tại đây, nếu để trống thì bạn tự tạo]
...

PHẦN 2: YÊU CẦU TẠO 100 Ý TƯỞNG PODCAST (Chia đều vào 10 nhóm, mỗi nhóm 10 chủ đề)
- Nhóm 1: Tim mạch, huyết áp, đột quỵ.
- Nhóm 2: Tiểu đường, đường huyết, biến chứng.
- Nhóm 3: Mỡ máu, gan nhiễm mỡ, béo bụng.
- Nhóm 4: Thận, tiểu đêm, phù chân, suy thận.
- Nhóm 5: Trí nhớ, sa sút trí tuệ, tuần hoàn não.
- Nhóm 6: Giấc ngủ, mất ngủ, ngưng thở khi ngủ.
- Nhóm 7: Xương khớp, té ngã, loãng xương.
- Nhóm 8: Dinh dưỡng cho người trên 50–60 tuổi.
- Nhóm 9: Thuốc men, tác dụng phụ, tương tác thuốc.
- Nhóm 10: Lối sống, vận động, chăm sóc sức khỏe chủ động.
(Mỗi ý tưởng gồm 10 trường: Số thứ tự, Tiêu đề podcast, Hook mở đầu, Vấn đề sức khỏe chính, Đối tượng người nghe, Góc cảnh báo, Câu chuyện bệnh nhân, Kiến thức y khoa, Câu hỏi gợi bình luận, Gợi ý tập tiếp theo).

PHẦN 3: BẢNG CHỌN NHANH ĐỂ SẢN XUẤT KỊCH BẢN (Top 10 chủ đề dễ viral, hợp tuổi 60+, dễ làm series, dễ làm thumbnail, kéo bình luận).

PHẦN 4: KHI TÔI CHỌN MỘT Ý TƯỞNG ("Viết kịch bản số...") -> Viết kịch bản hoàn chỉnh 17 mục:
1. Tiêu đề chính | 2. 5 tiêu đề phụ A/B test | 3. Hook mở đầu 30–60 giây | 4. Lời chào và giới thiệu podcast | 5. Nêu vấn đề sức khỏe | 6. Giải thích vì sao nhiều người hiểu sai | 7. Câu chuyện bệnh nhân giả định | 8. Phân tích cơ chế y khoa dễ hiểu | 9. Các dấu hiệu cần chú ý | 10. Những sai lầm thường gặp | 11. Những câu hỏi cần hỏi bác sĩ | 12. Lời khuyên chăm sóc sức khỏe chủ động | 13. CTA giữa video | 14. Tóm tắt 3–5 ý quan trọng | 15. CTA cuối video | 16. Cảnh báo y khoa | 17. Gợi ý tập tiếp theo.
```
