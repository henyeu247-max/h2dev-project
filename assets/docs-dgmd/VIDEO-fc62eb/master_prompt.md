# Cẩm Nang Thực Chiến & Master Prompt: Tư Duy Tạo Master Prompt Sản Xuất Hàng Loạt Video AI (VIDEO-fc62eb)

> **Mã học phần:** `VIDEO-fc62eb` (Bài 44 - Module `DGMD-M10`: Prompt Engineering & Nhân Vật Nhất Quán)
> **Giảng viên:** Đại Gia Mang Dép (DGMD Academy)
> **Công cụ thực chiến trên màn hình:** ChatGPT (`chatgpt.com`), Google Flow (`labs.google/fx/vi/tools/flow` — model `Nano Banana 2 x2`)

---

## 1. BẢNG SO SÁNH TƯ DUY PROMPT THỦ CÔNG VS. TƯ DUY MASTER PROMPT

| Tiêu chí đối chiếu | Cách làm thủ công (Single Prompt) | Tư duy chuyên nghiệp (Master Prompt System) |
| :--- | :--- | :--- |
| **Cách thức nhập lệnh** | Gõ tay từng câu lệnh ngắn trên Google Flow cho mỗi cảnh đơn lẻ | Dùng ChatGPT tạo 1 **Master Prompt**, sau đó thả ảnh gốc + Master Prompt để AI tự sinh 30–300 Prompt chi tiết |
| **Ví dụ thực tế trên màn hình** | `hãy tạo cho tôi , nhân vật này đang ôm 1 bao gạo , còn lại giữ nguyên chi tiết` | ChatGPT tự phân tích ngoại hình Stickman và xuất 30 Prompt tiếng Anh chuẩn điện ảnh theo 30 hoạt động đời thường |
| **Tốc độ sản xuất** | Rất chậm (1 lệnh = 1 cảnh), gây ức chế khi làm video dài dạng Storytelling | Nhanh gấp 10–30 lần (1 lệnh mẹ = 30–300 phân cảnh nối tiếp) |
| **Độ nhất quán nhân vật** | Dễ lệch tỷ lệ cơ thể, trang phục và góc máy giữa các cảnh | Khóa chặt nhận diện gốc (`consistent reference character design`) xuyên suốt 30 bối cảnh |

---

## 2. CÂU LỆNH GỐC TRÊN MÀN HÌNH ĐỂ YÊU CẦU CHATGPT ĐÚC MASTER PROMPT

### 2.1. Câu lệnh Prompt đơn lẻ thử nghiệm trên Google Flow (`00:36 - 00:48`)
```text
hãy tạo cho tôi , nhân vật này đang ôm 1 bao gạo , còn lại giữ nguyên chi tiết
```

### 2.2. Câu lệnh yêu cầu ChatGPT viết Master Prompt (`02:26 - 03:56`)
*(Giảng viên tải ảnh nhân vật gốc Stickman 2D lên ChatGPT và nhập nguyên văn câu lệnh)*:
```text
hãy tạo cho tôi 1 master prompt , khi tôi gửi ảnh nhân vật này lên flow , bạn hãy tạo cho tôi 30 prompt , để khi tôi gửi hình ảnh này lại chatgpt , bạn hãy dựa vào 30 bối cảnh hàng ngày của 1 con người , tạo cho tôi 30 prompt , yêu cầu các prompt thay đổi bối cảnh , hành động , sự vật , sự việc sảy ra , các góc quay phù hợp cho các prompt , cảm xúc của nhân vật , bây giờ hãy tạo cho tôi 1 master prompt , để tôi gửi lại cho chatgpt tạo ra 30 prompt chi tiết và đầy đủ
```

---

## 3. BỘ MASTER PROMPT HOÀN CHỈNH DO CHATGPT SINH RA TRÊN MÀN HÌNH (`04:12 - 04:30` & `09:20`)

Khi bắt đầu một dự án hoặc câu chuyện mới, mở đoạn chat mới trên ChatGPT, tải ảnh nhân vật gốc lên và dán nguyên văn khối **MASTER PROMPT** sau:

```text
TỪ BÂY GIỜ, MỖI KHI TÔI TẢI LÊN MỘT HÌNH ẢNH NHÂN VẬT HOẠT HÌNH BẤT KỲ, HÃY ĐÓNG VAI:

- Chuyên gia thiết kế nhân vật hoạt hình 20 năm kinh nghiệm.
- Chuyên gia Storytelling Visual.
- Chuyên gia đạo diễn hoạt hình.
- Chuyên gia thiết kế Prompt AI hình ảnh.
- Chuyên gia xây dựng nội dung viral trên TikTok, YouTube Shorts, Facebook Reels.

NHIỆM VỤ:

1. PHÂN TÍCH NHÂN VẬT
- Mô tả ngoại hình.
- Mô tả phong cách.
- Đặc điểm nhận dạng.
- Tính chất có thể suy ra.
- Cảm xúc tổng thể.

2. TẠO 30 PROMPT HÌNH ẢNH CHI TIẾT (TIẾNG ANH) DỰA TRÊN 30 TÌNH HUỐNG ĐỜI THƯỜNG:
1. Thức dậy buổi sáng.
2. Đánh răng.
3. Ăn sáng.
4. Đi bộ ngoài đường.
5. Chờ xe buýt.
6. Đi học.
7. Trong lớp học.
8. Làm bài kiểm tra.
9. Giờ giải lao.
10. Chơi với bạn bè.
11. Mua đồ trong siêu thị.
12. Đi cà phê.
13. Làm việc với laptop.
14. Chụp ảnh selfie.
15. Tập gym.
16. Chạy bộ công viên.
17. Đạp xe.
18. Xem phim.
19. Chơi game.
20. Nấu ăn.
21. Rửa bát.
22. Dọn phòng.
23. Đi du lịch.
24. Chụp ảnh tại địa danh nổi tiếng.
25. Đi biển.
26. Ngắm hoàng hôn.
27. Đi dưới trời mưa.
28. Đọc sách buổi tối.
29. Suy tư một mình.
30. Đi ngủ.

YÊU CẦU KỸ THUẬT CHO MỖI PROMPT:
- Giữ nguyên 100% đặc điểm nhận dạng, khuôn mặt, kiểu tóc, trang phục của nhân vật gốc (Consistent reference character design).
- Thay đổi đa dạng: Bối cảnh (Environment), Hành động (Action), Sự vật/Đạo cụ (Props), Sự việc xảy ra (Event), Cảm xúc nhân vật (Emotion) và Góc máy điện ảnh phù hợp (Camera Angle).
- Viết bằng tiếng Anh chi tiết, tối ưu hóa cho Google Flow (Nano Banana 2) và các công cụ sinh ảnh AI.
```

---

## 4. MẪU KẾT QUẢ PHÂN TÍCH NHÂN VẬT & PROMPT CON TIẾNG ANH TRÊN MÀN HÌNH (`04:45 - 05:15`)

### 4.1. Khối `[PHÂN TÍCH NHÂN VẬT]` do ChatGPT trích xuất từ ảnh Stickman
- **Ngoại hình:** Nhân vật hoạt hình tối giản với đầu tròn màu trắng; ba sợi tóc đen ngắn trên đỉnh đầu; đôi mắt đen hình oval đơn giản; một chân mày nhướng lên tạo cảm giác tinh nghịch; miệng cười lệch nhẹ; mặc áo thun đen rộng; quần short jean xanh gập gấu; giày sneaker trắng; tay thường bỏ túi tạo cảm giác tự tin.
- **Phong cách:** Minimalist Cartoon, Doodle Character, Simple Line Art, Modern Social Media Mascot, Friendly Storytelling Character.

### 4.2. Mẫu Prompt con tiếng Anh (`[PROMPT 4]` & `[PROMPT 5]`) dùng để dán sang Google Flow
```text
[PROMPT 4 - Đi bộ ngoài đường]
A full-body view of the original reference character walking along a city sidewalk on a beautiful morning. The same face, hairstyle, outfit style and proportions remain unchanged. Shops, bicycles, traffic lights, trees, pedestrians and street signs create an active urban environment. The character walks confidently while observing daily city life. Gentle breeze moves leaves and banners. Dynamic side-angle camera shot following the character's movement. Bright daylight, realistic shadows, cinematic city atmosphere, vibrant colors, highly detailed environment, storytelling composition, depth of field, professional illustration quality, ultra detailed cartoon artwork, social media friendly framing, full-body character, consistent reference character throughout the scene.

[PROMPT 5 - Chờ xe buýt]
A full-body view of the original reference character waiting at a bus stop during a busy weekday morning. Keeping the exact same visual identity from the reference image. Bus stop bench, route map, digital schedule display, commuters, passing cars and nearby buildings fill the environment. The character checks the arrival board while holding a transit card. Expression shows patience mixed with curiosity. Wide-angle cinematic shot capturing the surrounding urban scene, natural daylight, realistic reflections, storytelling atmosphere, highly detailed street environment, depth of field, cinematic lighting, professional composition, ultra detailed cartoon illustration, consistent reference character design.
```
