# Hãy Tạo Ra Master Prompt Trước Khi Sản Xuất Video (`VIDEO-fc62eb`)

> **Mã video (SKU):** `VIDEO-fc62eb`
> **Học phần:** Bài 44 — Module `DGMD-M10` (*Prompt Engineering & Nhân Vật Nhất Quán*)
> **Giảng viên:** Đại Gia Mang Dép (DGMD Academy)
> **Thời lượng:** `09:45` (`584.60s` — `119 segments` đã chuẩn hóa chính tả 100%)
> **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu 100% khung hình thực tế trên **Google Flow** & **ChatGPT** + lời giảng âm thanh)

---

## 1. TỔNG QUAN BÀI GIẢNG & TƯ DUY CỐT LÕI

Trong sản xuất video AI dạng kể chuyện (*Storytelling*), sai lầm phổ biến nhất của người mới là **làm thủ công từng cảnh một**: mở công cụ tạo ảnh, tải ảnh nhân vật lên, rồi tự nghĩ và gõ từng câu lệnh đơn lẻ cho từng bức ảnh. Cách làm này khiến quá trình sản xuất một video dài gồm 30–300 phân cảnh trở nên cực kỳ chậm chạp, mệt mỏi và thiếu tính hệ thống.

Bài giảng `VIDEO-fc62eb` hướng dẫn tư duy cốt lõi của người làm nội dung AI chuyên nghiệp: **Không tự ngồi viết từng Prompt ảnh, mà viết câu lệnh yêu cầu để ChatGPT đúc ra một bộ Master Prompt, rồi dùng chính Master Prompt đó để ChatGPT tự động sinh hàng loạt 30–300 Prompt phân cảnh chi tiết**, sau đó đưa sang **Google Flow** (*model* **Nano Banana 2**) kèm ảnh nhân vật gốc để sản xuất hàng loạt hình ảnh đồng nhất 100%.

### Công cụ xuất hiện và thao tác trực tiếp trong bài giảng
- **Google Flow** (`labs.google/fx/vi/tools/flow/project/71c5ae52-e4c7-432f-b989-63cddd153f73`): Công cụ sinh ảnh AI tích hợp mô hình **Nano Banana 2** (`x2`), hỗ trợ gắn ảnh nhân vật gốc làm ảnh tham chiếu (*Tác nhân*) để giữ nguyên diện mạo nhân vật qua hàng chục phân cảnh.
- **ChatGPT** (`chatgpt.com`): Trợ lý AI dùng để đúc **Master Prompt**, tự động phân tích đặc điểm nhận dạng nhân vật từ ảnh tải lên (`[PHÂN TÍCH NHÂN VẬT]`) và xuất ra danh sách 30 Prompt tiếng Anh chuẩn điện ảnh.
- **Nano Banana 2**: Mô hình tạo ảnh trong Google Flow được giảng viên chọn để render đồng loạt 2 biến thể ảnh/lệnh (`Nano Banana 2 x2`).

---

## 2. BẢNG ĐỐI CHIẾU TRỰC QUAN TỪ KHUNG HÌNH VIDEO (VISUAL EVIDENCE)

| Mốc thời gian | Nền tảng hiển thị | Thao tác thực tế trên màn hình | Nội dung câu lệnh / Kết quả hiển thị trực quan |
| :--- | :--- | :--- | :--- |
| **`00:19 - 00:35`** | **Google Flow** (`Nano Banana 2`) | Giảng viên mở thư mục `Downloads` chọn ảnh nhân vật hoạt hình 2D **Stickman** (đầu tròn trắng, 3 sợi tóc dựng, áo thun đen, quần short jean xanh, giày sneaker trắng) tải lên Google Flow. | Nhân vật Stickman gốc xuất hiện trong kho dự án Google Flow (`17:58 22 thg 6`). |
| **`00:36 - 01:09`** | **Google Flow** (`Nano Banana 2`) | Minh họa cách làm thủ công của người mới: đính kèm ảnh Stickman làm tham chiếu và gõ tay 1 câu lệnh ngắn để tạo 1 cảnh duy nhất. | Câu lệnh gõ trên màn hình: `hãy tạo cho tôi , nhân vật này đang ôm 1 bao gạo , còn lại giữ nguyên chi tiết`. Kết quả sinh ra 2 tấm ảnh nhân vật Stickman ôm bao gạo (`RICE`). |
| **`01:31 - 02:25`** | **ChatGPT** (`chatgpt.com`) | Chuyển sang tab ChatGPT, bấm dấu `+` tải bức ảnh nhân vật Stickman gốc lên khung chat để bắt đầu viết câu lệnh tạo Master Prompt. | Ảnh nhân vật Stickman hiển thị ở góc trên khung nhập lệnh của ChatGPT. |
| **`02:26 - 03:56`** | **ChatGPT** (`chatgpt.com`) | Giảng viên gõ trực tiếp câu lệnh yêu cầu ChatGPT tạo ra 1 **Master Prompt** dựa trên 30 bối cảnh đời thường của một con người. | Toàn văn câu lệnh yêu cầu thay đổi bối cảnh, hành động, sự vật, sự việc xảy ra, góc quay và cảm xúc nhân vật hiển thị rõ trong khung nhập ChatGPT. |
| **`04:03 - 04:30`** | **ChatGPT** (`chatgpt.com`) | ChatGPT trả về khối văn bản `MASTER PROMPT` đóng khung đen có nút `Sao chép`, bên trong liệt kê vai trò chuyên gia và danh sách `PHÂN BỐ 30 TÌNH HUỐNG ĐỜI THƯỜNG` (từ `1. Thức dậy buổi sáng` đến `30. Đi ngủ`). | Giảng viên giải thích: những bài chia sẻ Master Prompt dài hàng trang trên Facebook đều được tạo bằng cách ra lệnh cho ChatGPT viết chứ không ai ngồi gõ tay. |
| **`04:32 - 05:16`** | **ChatGPT** (`chatgpt.com`) | Mở một đoạn chat mới (`Phân tích và tạo prompt`), tải lại ảnh nhân vật Stickman và dán bản `MASTER PROMPT` vừa sao chép vào. | ChatGPT lập tức xuất mục `[PHÂN TÍCH NHÂN VẬT]` (Ngoại hình, Phong cách, Đặc điểm nhận dạng) và sinh liên tiếp 30 Prompt tiếng Anh (`[PROMPT 1]` đến `[PROMPT 30]`). |
| **`05:17 - 07:25`** | **Google Flow** (`Nano Banana 2`) | Sao chép lần lượt từng `[PROMPT]` tiếng Anh từ ChatGPT, chuyển qua tab Google Flow, gắn ảnh nhân vật Stickman gốc làm tham chiếu rồi bấm tạo ảnh liên tiếp. | Hàng loạt thẻ ảnh đang render song song (`36%`, `76%`, `99%`) trên lưới dự án Google Flow. |
| **`07:26 - 08:35`** | **Google Flow** (`Nano Banana 2`) | Kiểm tra lưới kết quả hình ảnh đã hoàn thành trên Google Flow từ các Prompt 1, 2, 3, 4, 11, 13, 14. | Nhân vật Stickman giữ nguyên 100% đầu tròn trắng, 3 sợi tóc, áo đen, quần short xanh trong mọi cảnh: vươn vai thức dậy trên giường, đánh răng trước gương phòng tắm, vừa ăn bánh mì nướng vừa đọc báo *Morning Gazette*, đi bộ trên vỉa hè phố, đẩy xe hàng trong siêu thị. |
| **`08:36 - 09:45`** | **ChatGPT** (`chatgpt.com`) | Quay lại màn hình hiển thị bản `MASTER PROMPT` trên ChatGPT để đúc kết nguyên lý vận hành cho học viên làm YouTube. | Khung code `MASTER PROMPT` hiển thị phần đóng vai 5 chuyên gia và nhiệm vụ phân tích nhân vật. |

---

## 3. NGUYÊN VĂN CÁC CÂU LỆNH (VERBATIM PROMPTS) TRÍCH XUẤT TỪ MÀN HÌNH

### 3.1. Câu lệnh đơn lẻ thủ công trên Google Flow (`00:36 - 00:48`)
```text
hãy tạo cho tôi , nhân vật này đang ôm 1 bao gạo , còn lại giữ nguyên chi tiết
```

### 3.2. Câu lệnh gốc yêu cầu ChatGPT đúc Master Prompt (`02:26 - 03:56`)
```text
hãy tạo cho tôi 1 master prompt , khi tôi gửi ảnh nhân vật này lên flow , bạn hãy tạo cho tôi 30 prompt , để khi tôi gửi hình ảnh này lại chatgpt , bạn hãy dựa vào 30 bối cảnh hàng ngày của 1 con người , tạo cho tôi 30 prompt , yêu cầu các prompt thay đổi bối cảnh , hành động , sự vật , sự việc sảy ra , các góc quay phù hợp cho các prompt , cảm xúc của nhân vật , bây giờ hãy tạo cho tôi 1 master prompt , để tôi gửi lại cho chatgpt tạo ra 30 prompt chi tiết và đầy đủ
```

### 3.3. Cấu trúc bản Master Prompt do ChatGPT sinh ra trên màn hình (`04:12 - 04:30` & `09:20`)
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

PHÂN BỐ 30 TÌNH HUỐNG ĐỜI THƯỜNG
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
```

### 3.4. Kết quả ChatGPT phân tích nhân vật & xuất Prompt tiếng Anh (`04:45 - 05:15`)
```text
[PHÂN TÍCH NHÂN VẬT]
Ngoại hình:
- Nhân vật hoạt hình tối giản với đầu tròn màu trắng.
- Ba sợi tóc đen ngắn trên đỉnh đầu.
- Đôi mắt đen hình oval đơn giản.
- Một chân mày nhướng lên tạo cảm giác tinh nghịch.
- Miệng cười lệch nhẹ.
- Mặc áo thun đen rộng.
- Quần short jean xanh gập gấu.
- Giày sneaker trắng.
- Tay thường bỏ túi tạo cảm giác tự tin.

Phong cách:
- Minimalist Cartoon / Doodle Character / Simple Line Art / Modern Social Media Mascot / Friendly Storytelling Character.

[PROMPT 4]
English Prompt:
A full-body view of the original reference character walking along a city sidewalk on a beautiful morning. The same face, hairstyle, outfit style and proportions remain unchanged. Shops, bicycles, traffic lights, trees, pedestrians and street signs create an active urban environment. The character walks confidently while observing daily city life. Gentle breeze moves leaves and banners. Dynamic side-angle camera shot following the character's movement. Bright daylight, realistic shadows, cinematic city atmosphere, vibrant colors, highly detailed environment, storytelling composition, depth of field, professional illustration quality, ultra detailed cartoon artwork, social media friendly framing, full-body character, consistent reference character throughout the scene.

[PROMPT 5]
English Prompt:
A full-body view of the original reference character waiting at a bus stop during a busy weekday morning. Keeping the exact same visual identity from the reference image. Bus stop bench, route map, digital schedule display, commuters, passing cars and nearby buildings fill the environment. The character checks the arrival board while holding a transit card. Expression shows patience mixed with curiosity. Wide-angle cinematic shot capturing the surrounding urban scene, natural daylight, realistic reflections, storytelling atmosphere, highly detailed street environment, depth of field, cinematic lighting, professional composition, ultra detailed cartoon illustration, consistent reference character design.
```

---

## 4. MỐC THỜI GIAN TRỌNG TÂM (KEY TIMESTAMPS)

- **`00:00`** — Vai trò cốt lõi của Prompt và tư duy Master Prompt khi sản xuất các chuỗi video câu chuyện AI.
- **`00:19`** — Thực hành Prompt đơn lẻ trên Google Flow (Nano Banana 2): Tạo 1 ảnh nhân vật Stickman ôm 1 bao gạo và hạn chế về tốc độ.
- **`01:31`** — Chuyển sang ChatGPT kết hợp ảnh nhân vật gốc để thiết lập câu lệnh yêu cầu tạo Master Prompt.
- **`02:26`** — Công thức viết câu lệnh yêu cầu ChatGPT đúc Master Prompt gồm 30 bối cảnh đời thường, hành động, sự vật, góc quay và cảm xúc.
- **`04:03`** — Phân tích cấu trúc bản Master Prompt hoàn chỉnh do ChatGPT xuất ra với danh sách 30 tình huống hàng ngày.
- **`04:32`** — Mở đoạn chat mới, dán Master Prompt kèm ảnh nhân vật Stickman để ChatGPT tự bóc tách ngoại hình và sinh 30 Prompt tiếng Anh.
- **`05:17`** — Sao chép từng Prompt con từ ChatGPT sang Google Flow kèm ảnh tham chiếu để tạo hàng loạt phân cảnh nối tiếp.
- **`07:26`** — Kiểm chứng bộ ảnh nhân vật Stickman (ngủ dậy, đánh răng, đọc báo, ăn sáng, đi siêu thị) và tổng kết tư duy dùng AI viết Prompt.

---

## 5. BÀI HỌC CỐT LÕI (KEY TAKEAWAYS)

1. **Từ bỏ lối làm thủ công từng cảnh lẻ:** Viết từng câu lệnh ngắn thủ công (như *"hãy tạo cho tôi nhân vật này đang ôm 1 bao gạo"*) chỉ tạo được 1 hình ảnh mỗi lần, rất tốn thời gian và không thể mở rộng cho video dài dạng Storytelling.
2. **Dùng AI để viết Prompt cho AI:** Người làm video AI chuyên nghiệp không tự ngồi viết lẻ tẻ hàng chục Prompt mà viết 1 câu lệnh yêu cầu để ChatGPT đúc ra bộ **Master Prompt** hoàn chỉnh.
3. **6 biến số bắt buộc trong câu lệnh tạo Master Prompt:** Câu lệnh yêu cầu phải chỉ rõ 6 yếu tố cần biến thiên qua từng phân cảnh: **Bối cảnh**, **Hành động**, **Sự vật/Đạo cụ**, **Sự việc xảy ra**, **Góc quay phù hợp** và **Cảm xúc nhân vật**, đồng thời giữ nguyên nhân vật gốc.
4. **Cơ chế phân tích nhân vật tự động:** Khi dán Master Prompt kèm ảnh nhân vật gốc vào đoạn chat mới trên ChatGPT, AI sẽ tự động lập bảng `[PHÂN TÍCH NHÂN VẬT]` (ngoại hình, phong cách, đặc điểm nhận dạng) trước khi sinh 30–300 Prompt tiếng Anh.
5. **Luôn khóa ảnh tham chiếu trên Google Flow:** Khi đưa các Prompt con sang Google Flow (model Nano Banana 2), bắt buộc luôn phải đính kèm ảnh nhân vật gốc làm ảnh tham chiếu (*Tác nhân*) để khóa chặt 100% nhận diện nhân vật.

---

## 6. QUY TRÌNH THỰC THI CHUẨN (SOP 5 BƯỚC)

- Chuẩn bị 1 hình ảnh nhân vật gốc rõ nét làm chuẩn tham chiếu xuyên suốt toàn bộ dự án video.
- Tải ảnh nhân vật lên ChatGPT và nhập câu lệnh yêu cầu thiết kế 1 Master Prompt sinh 30–300 Prompt theo cốt truyện hoặc 30 bối cảnh đời thường.
- Sao chép khối Master Prompt vừa tạo, mở một đoạn chat ChatGPT mới, tải lại ảnh nhân vật gốc kèm Master Prompt để ChatGPT xuất danh sách 30 Prompt tiếng Anh chi tiết.
- Mở Google Flow (chọn model Nano Banana 2), bấm dấu cộng thêm ảnh nhân vật gốc làm ảnh tham chiếu trong khung nhập lệnh.
- Lần lượt sao chép các Prompt tiếng Anh từ ChatGPT dán sang Google Flow để render hàng loạt phân cảnh (thức dậy, đánh răng, ăn sáng, đi bộ, mua sắm) đồng nhất 100% nhân vật.

---

## 7. CÁC LỖI CẦN TRÁNH (AVOID FLAGS)

- **Gõ tay từng lệnh đơn lẻ:** Ngồi gõ thủ công từng câu Prompt ngắn cho từng cảnh một khi làm video dài dạng câu chuyện (Storytelling), gây lãng phí thời gian và đứt gãy mạch sản xuất.
- **Quên gắn ảnh tham chiếu:** Quên đính kèm hình ảnh nhân vật gốc làm ảnh tham chiếu khi dán các Prompt con vào Google Flow khiến AI vẽ ra nhân vật hoàn toàn khác.
- **Thiếu biến số điện ảnh trong Master Prompt:** Viết câu lệnh yêu cầu tạo Master Prompt quá sơ sài, thiếu yêu cầu thay đổi góc quay, cảm xúc, sự vật và hành động dẫn đến 30 bức ảnh bị trùng lặp bố cục nhàm chán.
- **Tự viết tay Master Prompt dài:** Tự tay ngồi viết các bài Master Prompt dài hàng trang như trên mạng xã hội thay vì ra lệnh cho ChatGPT tự động cấu trúc hóa Master Prompt.

---

## 8. TÀI LIỆU ĐÍNH KÈM TRONG HỌC PHẦN (`COURSE_DOCS`)

- [Cẩm Nang Thực Chiến & Master Prompt 30 Tình Huống Đời Thường (`master_prompt.md`)](../../assets/docs-dgmd/VIDEO-fc62eb/master_prompt.md)
- [Công Thức Đúc Master Prompt Nhất Quán Nhân Vật AI (`master_prompt.txt`)](../../assets/docs-dgmd/VIDEO-fc62eb/master_prompt.txt)
- [Tài Liệu Học Phần Gốc: Tư Duy Master Prompt (`description.html`)](../../assets/docs-dgmd/VIDEO-fc62eb/description.html)
