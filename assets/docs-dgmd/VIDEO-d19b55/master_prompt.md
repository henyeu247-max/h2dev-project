# Bộ Master Prompt Thực Chiến — Quy Trình Sản Xuất Video Sức Khỏe Yoga (`VIDEO-d19b55`)

> **Bài học:** Bài 16 — `Quy Trình Sản Xuất Video Sức Khỏe Yoga` (`DGMD-M05`)  
> **Nguồn bóc tách:** Tài liệu Google Docs gốc của giảng viên trên màn hình (`1_2L1jCi7d_5EhLJ0RTwGR9uC8mZ9iKJaILTlVRwUO18`) & Luồng thực hành trực tiếp trên **Flow AI (Nano Banana 2)**, **Grok Imagine**, **ChatGPT**, **Suno AI**, **CapCut** và **Picsart**.

---

## 1. Câu lệnh tạo Ảnh Nhân Vật Tham Chiếu trên Google Flow (`Nano Banana 2`)

Sử dụng ảnh nhân vật tải từ **Pinterest** (ví dụ: nhân vật hoạt hình 3D *Rumi*, *Spider-Man*, *Elsa*, *Rapunzel*...) tải lên **Google Flow (`labs.google/fx/vi/tools/flow`)** ở chế độ `Nano Banana 2 x2` (tỷ lệ `16:9`, chất lượng tải xuống `1K`):

```text
- Hãy tạo lại hình ảnh này cho tôi , hình ảnh 16.9 , đầy đủ chi tiết nhân vật nữ trong hình ảnh , nhân vật này đang mặc 1 bộ quần áo yoga , nhân vật đi chân đất , nhân vật bé hơn tỉ lệ khung , hình ảnh sắc nét , nhân vật đứng thẳng , không cần phông nền , xóa bỏ tất cả phông nền từ hình ảnh cũ .
```

---

## 2. Bộ 3 Câu lệnh Xử Lý Phông Nền & Thảm Tập Yoga trên Grok (`grok.com/imagine`)

> **Lý do dùng Grok thay vì Flow cho bước tách nền đối thủ:** Nhiều ảnh chụp màn hình từ kênh đối thủ có nhân vật nhỏ tuổi hoặc nhân vật nổi tiếng khiến Flow báo lỗi kiểm duyệt khi upload trực tiếp. Dùng **Grok Imagine** sẽ xử lý mượt mà 100%.

### 2.1. Câu lệnh xóa nhân vật & chữ/logo khỏi ảnh chụp màn hình đối thủ (giữ lại phông nền + thảm yoga)
```text
- xóa bỏ nhân vật “ cô gái ” trong hình đang tập yoga , và xóa các logo cùng icone và chữ , giữ phông nền , và thảm yoga , hình ảnh sắc nét
```

### 2.2. Câu lệnh đổi màu thảm tập yoga để biến tấu độc bản (không trùng lặp đối thủ)
```text
- hãy tạo lại hình ảnh này cho tôi chiếc thảm yoga trong hình ảnh đổi sang màu “ xanh dương nhạt ” , còn lại giữ nguyên chi tiết , hình ảnh sắc nét
```
*(Ghi chú: Có thể thay cụm `"xanh dương nhạt"` bằng `"xanh lá"`, `"trắng"`, `"vàng"`, `"tím pastel"` tùy ý để tạo bộ nhận diện riêng cho từng video).*

### 2.3. Câu lệnh xóa nốt chiếc thảm để lấy phông nền trống (dùng cho cảnh Intro mở đầu & nền ghép Thumbnail)
```text
xóa cho tôi chiếc thảm , còn lại giữ nguyên chi tiết
```

---

## 3. Câu lệnh Master Prompt giao cho ChatGPT sinh hàng loạt Prompt Tư Thế Yoga

Đính kèm ảnh nhân vật tham chiếu (đã mặc đồ tập yoga ở Bước 1) vào **ChatGPT** và gửi câu lệnh sau:

```text
- bạn là 1 người am hiểu về tất cả các động tác yoga , hãy dựa hình ảnh gốc này mà tôi gửi , bạn hãy viết cho tôi 10 prompt để tạo 10 hình ảnh nhân vật trong hình ảnh này đang tập động tác yoga đó , thay đổi các động tác yoga cho từng prompt , cố định nhân vật bé hơn tỉ lệ khung hình , hình ảnh sắc nét , không cần phông nền cố định cho các prompt , yêu cầu prompt chi tiết đầy đủ , các prompt có độ dài như nhau .
```

### 10 Prompt Tiếng Anh Chuẩn (Output thực tế từ ChatGPT dùng để dán vào Google Flow kèm ảnh tham chiếu)

1. **Mountain Pose (Tư thế Trái Núi):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, standing in Mountain Pose, feet together, arms relaxed beside the body, back straight, calm confident face, character smaller in the frame, centered composition, clean white transparent-style background, ultra-detailed, high resolution.
   ```
2. **Tree Pose (Tư thế Cái Cây):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Tree Pose, one foot pressed against the inner thigh, hands together in prayer at chest level, elegant balance, calm face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.
   ```
3. **Warrior I Pose (Tư thế Chiến Binh I):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Warrior I Pose, front knee bent at 90 degrees, back leg straight, arms raised straight overhead, focused expression, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.
   ```
4. **Warrior II Pose (Tư thế Chiến Binh II):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Warrior II Pose, wide stance, front knee bent, arms extended parallel to the floor, gaze over front hand, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.
   ```
5. **Triangle Pose (Tư thế Tam Giác):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Triangle Pose, legs wide apart, one hand reaching down to the ankle, other arm extended straight up, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.
   ```
6. **Downward Dog Pose (Tư thế Chó Úp Mặt):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Downward-Facing Dog Pose, hands and feet on the floor, hips lifted high forming an inverted V-shape, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.
   ```
7. **Cobra Pose (Tư thế Rắn Hổ Mang):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Cobra Pose, lying on the stomach, palms on the floor, chest lifted, shoulders relaxed, face looking forward gently, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.
   ```
8. **Seated Forward Bend (Tư thế Ngồi Gập Mình):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Seated Forward Bend Pose, sitting with both legs straight forward, torso folded toward the legs, hands reaching toward the feet, peaceful face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.
   ```
9. **Lotus Pose (Tư thế Hoa Sen):**
   ```text
   Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Lotus Pose, sitting cross-legged with feet placed on opposite thighs, hands resting on knees, straight back, meditative calm expression, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.
   ```
10. **Dancer Pose (Tư thế Vũ Công):**
    ```text
    Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, performing Dancer Pose, standing on one leg, one hand holding the lifted foot behind the body, opposite arm reaching forward, elegant balance, graceful face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.
    ```

---

## 4. Câu lệnh tạo Nhạc Nền Tập Yoga trên Suno AI (`suno.com`)

Gửi vào **ChatGPT** (trong cùng luồng hội thoại trên) để lấy đoạn mô tả Style nhạc dán vào **Suno AI**:

```text
- dựa vào 10 prompt để tạo ra các động tác yoga trên , hãy tạo cho tôi 1 prompt styles để tạo nhạc nền tập yoga phù hợp cho các động tác trên , yêu cầu nhạc nền hấp hẫn , sáng tạo cho tôi prompt chi tiết đầy đủ .
```

---

## 5. Câu lệnh viết Lời Mở Đầu (Intro Hook) giữ chân người xem

Gửi tiếp vào **ChatGPT** để lấy câu thoại mở đầu (dùng tính năng *Chuyển văn bản thành giọng nói / Text-to-Speech* ngay trong **CapCut**):

```text
- dựa vào 10 động tác yoga trên , bạn hãy tạo cho tôi 1 câu mở đầu cho video , sáng tạo câu hook vào thẳng vấn đề , và hướng người xem ở lại tập yoga , sáng tạo 1 câu mở đầu chi tiết đầy đủ ngắn gọn
```

**Mẫu câu Hook thực tế được tạo ra và lồng tiếng trong bài (`09:10 – 10:48`):**
> *"Chỉ cần 5 phút mỗi ngày để cơ thể dẻo dai hơn, tinh thần thư thái hơn và tràn đầy năng lượng hơn! Hãy tập cùng tôi từ động tác đầu tiên đến cuối cùng, vì mỗi tư thế hôm nay sẽ giúp bạn tiến gần hơn đến một cơ thể khỏe mạnh và cân bằng hơn."*

---

## 6. Thông số Kỹ thuật Dựng CapCut & Thiết kế Thumbnail Picsart

- **Tách nền nhân vật trong CapCut:** Chọn clip ảnh tư thế yoga $\rightarrow$ `Xóa nền` $\rightarrow$ bật `Xóa tự động`.
- **Hiệu ứng chuyển động nhẹ (chống tĩnh ảnh):** Vào `Hiệu ứng video` $\rightarrow$ tìm `Camera rung` / `Máy ảnh rung` $\rightarrow$ chỉnh **Khoảng = `1`**, **Tốc độ = `2`**.
- **Bộ đếm ngược từng động tác (10 giây hoặc 20 giây):** Tạo 10 lớp chữ từ `10` lùi về `1` (mỗi số dài đúng `1 giây`, phông chữ `Anton`), gán hiệu ứng động và gom thành **Clip ghép (Compound Clip)** để nhân bản nhanh cho 10–30 động tác tiếp theo; chèn thêm **Nhãn dán (Sticker)** `clock` (đồng hồ đếm giờ) góc trái trên.
- **Thumbnail trên Picsart:** Khung vẽ trống `1920 x 1080`, đặt phông nền trống (đã xóa thảm) làm nền, tải lên **6 ảnh động tác yoga** xếp thành lưới 2 hàng $\times$ 3 cột rồi bấm `Gỡ nền` từng ảnh (hoặc chèn thêm chữ phông `Anton`).
