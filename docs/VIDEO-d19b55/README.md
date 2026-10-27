# Quy Trình Sản Xuất Video Sức Khỏe Yoga

> **SKU:** `VIDEO-d19b55` · **Bài học:** Bài 16 (`DGMD-M05` — Quy Trình Sản Xuất Video Chủ Đề Sức Khỏe & Giáo Dục)  
> **Thời lượng:** `21:24` (`1284.63s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Hoạt Hình 3D Tập Yoga & Sức Khỏe (Kids / Character Yoga)` · **Thị trường:** `🇺🇸 Hoa Kỳ & Toàn Cầu (View Ngoại)`  
> **Tài liệu đính kèm:** [`assets/docs-dgmd/VIDEO-d19b55/master_prompt.md`](../../assets/docs-dgmd/VIDEO-d19b55/master_prompt.md) · **Bản ghi phụ đề:** [`video/VIDEO-d19b55/transcript.txt`](../../video/VIDEO-d19b55/transcript.txt)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng giải phẫu toàn diện quy trình công nghiệp hóa dòng video **Hoạt Hình 3D Tập Yoga (Kids Yoga / Character Yoga)** đang càn quét hàng triệu lượt xem tại thị trường quốc tế (điển hình như kênh `@SunnyRainbowYoga` đạt **4,6 triệu view** chỉ sau 1 tháng và `@GalaxyYoga` đạt **2,5 triệu view** với chỉ 29 video). Thay vì phải tốn chi phí lớn tạo video chuyển động bằng AI hay tự quay người thật, giảng viên hướng dẫn công thức **"Ảnh tĩnh 3D tách nền + Hiệu ứng Máy ảnh rung + Đồng hồ đếm ngược"** cực kỳ nhẹ nhàng nhưng giữ chân khán giả từ đầu đến cuối:

1. **Săn nhân vật 3D đang hot trên Pinterest** (*Rumi*, *Elsa*, *Rapunzel*, *Spider-Man*...) và chuẩn hóa thành **1 ảnh nhân vật tham chiếu** mặc đồ tập yoga, đi chân đất trên **Google Flow (`Nano Banana 2`)**.
2. **Xử lý phông nền & thảm tập bằng Grok Imagine (`grok.com/imagine`)** để lách bộ lọc bản quyền/độ tuổi của Flow: xóa nhân vật cũ + logo/chữ trên ảnh chụp màn hình đối thủ, đổi màu thảm tập sang **xanh dương nhạt** và tạo thêm 1 bản nền trống không thảm cho phần Intro/Thumbnail.
3. **Nhân bản 10–30 tư thế Yoga bằng ChatGPT + Google Flow**, kết hợp nhạc nền **Suno AI**, dựng hiệu ứng `Máy ảnh rung (Khoảng 1, Tốc độ 2)` kèm `Clip ghép đếm ngược 10s -> 1s` trên **CapCut**, và đóng gói Thumbnail 6 tư thế trên **Picsart**.

---

## 2. Bảng đối sánh Kênh Đối Thủ, Công cụ & Thông số Kỹ thuật trên màn hình (Visual Frame Evidence)

### 2.1. Danh sách 4 Kênh Đối Thủ Mẫu xuất hiện trực tiếp trên màn hình (`00:00 – 02:45`)

| STT | Handle / Tên kênh | Quy mô trên màn hình | Các video tiêu biểu hiển thị trên màn hình | Hiệu suất thực tế | Link xác thực (`HTTP 200`) |
| :-: | :--- | :---: | :--- | :--- | :--- |
| 01 | **`@SunnyRainbowYoga`** (`Sunny Rainbow Yoga`) | **79,4 N sub** · `63 video` | • *Yoga for Agility \| Stay Light Flexible and Full of Energy* (`8:46`)<br>• *Yoga for Flexibility \| Yoga for Kids \| Improve Posture* (`8:11`)<br>• *The Ultimate Yoga Routine for Focus \| Flexibility & Calmness* (`8:17`) | • **4,6 Tr lượt xem** (1 tháng trước)<br>• **4,2 Tr lượt xem** (3 tháng trước)<br>• **4 Tr lượt xem** (4 tháng trước) | [Mở kênh](https://www.youtube.com/@SunnyRainbowYoga) |
| 02 | **`@GalaxyYoga`** (`Galaxy Yoga`) | **14,8 N sub** · `29 video` | • *Full Body Kids Yoga Routine: Stretching for Flexibility & Strength* (`6:30`)<br>• *Yoga for Kids Flexibility & Posture \| Fun Easy Routine Daily* (`8:42`)<br>• *Yoga for Children \| Yoga for Health \| Yoga for Overthinking* (`8:42`) | • **2,5 Tr lượt xem** (1 tháng trước)<br>• **1,3 Tr lượt xem** (4 tuần trước)<br>• **986 N lượt xem** (6 ngày trước) | [Mở kênh](https://www.youtube.com/@GalaxyYoga) |
| 03 | **`@ToonYogaTime`** (`Toon Yoga Time`) | Kênh đề xuất cột phải (`02:30`) | • *Kids Yoga with Rumi \| Fun Poses for Better Posture \| KPop...* (`7:49`) | • **1,2 Tr lượt xem** (3 tháng trước) | [Mở kênh](https://www.youtube.com/@ToonYogaTime) |
| 04 | **`@MovewithJojoforKids`** (`Move with Jojo for Kids`) | Kênh đề xuất cột phải (`02:30`) | • *Yoga for Body Toning \| Yoga for Children \| Yoga for Health* (`4:36`) | • **10 Tr lượt xem** (5 tháng trước) | [Mở kênh](https://www.youtube.com/@MovewithJojoforKids) |

### 2.2. Ma trận Công cụ & Thông số kỹ thuật theo từng công đoạn (`00:40 – 21:20`)

| Công đoạn | Công cụ sử dụng | Thông số cấu hình / Thao tác chuẩn trên màn hình | Mục đích thực chiến |
| :--- | :--- | :--- | :--- |
| **1. Tìm mẫu nhân vật** | **Pinterest** (`pinterest.com`) | Từ khóa: `rumi` (Ghim mẫu: *Elegant Rumi - Modern & Stylish "Golden Edge"*, tóc tết tím dài), hoặc *Spider-Man*, *Elsa*, *Rapunzel* | Bám sát ngoại hình nhân vật 3D đang có lượng fan lớn để hút CTR tự nhiên |
| **2. Tạo ảnh tham chiếu** | **Google Flow** (`Nano Banana 2 x2`) | Khung hình `16:9`, tải ảnh gốc từ Pinterest + dán câu lệnh chuẩn hóa đồ tập yoga, xuất ảnh chất lượng `1K` | Tạo nhân vật gốc đứng thẳng, mặc đồ tập yoga màu đỏ rượu (burgundy), chân đất, nền trắng sạch |
| **3. Tách nền & Đổi màu thảm** | **Grok Imagine** (`grok.com/imagine`) | Khung hình `16:9`, upload ảnh chụp màn hình video đối thủ (`Alt + Cts`) $\rightarrow$ Chạy 3 lệnh: Xóa cô gái/logo $\rightarrow$ Đổi thảm sang `xanh dương nhạt` $\rightarrow$ Xóa thảm | Lách lỗi kiểm duyệt nhân vật trẻ em/nổi tiếng trên Flow và tạo bộ phông nền + thảm tập độc quyền |
| **4. Tạo 10 tư thế Yoga** | **ChatGPT** $\rightarrow$ **Google Flow** | Đính kèm ảnh tham chiếu vào ChatGPT lấy 10 prompt tiếng Anh $\rightarrow$ Sang Flow đính kèm ảnh tham chiếu + dán từng prompt 1 đến 10 | Giữ nguyên 100% khuôn mặt, bím tóc tím và bộ đồ tập yoga qua cả 10 tư thế phức tạp |
| **5. Tạo nhạc nền 3 phút** | **ChatGPT** $\rightarrow$ **Suno AI** | Dùng ChatGPT sinh prompt Style nhạc dựa trên 10 động tác $\rightarrow$ Tạo trên Suno AI (file xuất: `Lotus Morning Arc.wav` dài `03:04`) | Có nhạc nền êm dịu, cuốn hút, miễn phí bản quyền 100% |
| **6. Dựng Intro & Bài tập** | **CapCut PC** | • Voice Intro: `Chuyển văn bản thành lời nói` (`Giọng nữ dễ thương`), chữ phông `Anton`<br>• Nhân vật: `Xóa nền` $\rightarrow$ `Xóa tự động`<br>• Hiệu ứng: `Máy ảnh rung` (**Khoảng = `1`**, **Tốc độ = `2`**)<br>• Đếm giây: Số `10` $\rightarrow$ `1` (mỗi số `1s`, gom thành `Clip ghép`) + Nhãn dán `clock` | Biến 10 bức ảnh tĩnh thành bài tập sinh động, có nhịp nhún nhẹ và bộ đếm thời gian trực quan |
| **7. Thiết kế Thumbnail** | **Picsart** (`picsart.com/create/editor`) | Đổi cỡ khung vẽ trống `1920 x 1080` $\rightarrow$ Đặt nền trống (không thảm) $\rightarrow$ Tải lên 6 ảnh động tác $\rightarrow$ Bấm `Gỡ nền` từng ảnh & xếp lưới 6 tư thế | Tạo ảnh bìa tổng hợp 6 tư thế uốn dẻo bắt mắt giống hệt công thức triệu view của `@SunnyRainbowYoga` |

---

## 3. Bộ Master Prompt Nguyên Bản (Bóc tách 100% từ Google Docs & ChatGPT trên màn hình)

> Toàn bộ câu lệnh dưới đây đã được lưu trữ đầy đủ tại [`assets/docs-dgmd/VIDEO-d19b55/master_prompt.md`](../../assets/docs-dgmd/VIDEO-d19b55/master_prompt.md).

### 3.1. Bộ 6 Câu lệnh Tiếng Việt trong Google Docs của Giảng viên (`01:04 – 08:09`)

```text
Câu lệnh yêu cầu tạo ảnh nhân vật tham chiếu :
- Hãy tạo lại hình ảnh này cho tôi , hình ảnh 16.9 , đầy đủ chi tiết nhân vật nữ trong hình ảnh , nhân vật này đang mặc 1 bộ quần áo yoga , nhân vật đi chân đất , nhân vật bé hơn tỉ lệ khung , hình ảnh sắc nét , nhân vật đứng thẳng , không cần phông nền , xóa bỏ tất cả phông nền từ hình ảnh cũ .

Câu lệnh xóa phông nền :
- xóa bỏ nhân vật “ cô gái ” trong hình đang tập yoga , và xóa các logo cùng icone và chữ , giữ phông nền , và thảm yoga , hình ảnh sắc nét

Câu lệnh thay đổi :
- hãy tạo lại hình ảnh này cho tôi chiếc thảm yoga trong hình ảnh đổi sang màu “ xanh dương nhạt ” , còn lại giữ nguyên chi tiết , hình ảnh sắc nét

Câu lệnh xóa thảm (lấy nền trống cho Intro & Thumbnail) :
- xóa cho tôi chiếc thảm , còn lại giữ nguyên chi tiết

Câu lệnh viết prompt tạo các động tác yoga :
- bạn là 1 người am hiểu về tất cả các động tác yoga , hãy dựa hình ảnh gốc này mà tôi gửi , bạn hãy viết cho tôi 10 prompt để tạo 10 hình ảnh nhân vật trong hình ảnh này đang tập động tác yoga đó , thay đổi các động tác yoga cho từng prompt , cố định nhân vật bé hơn tỉ lệ khung hình , hình ảnh sắc nét , không cần phông nền cố định cho các prompt , yêu cầu prompt chi tiết đầy đủ , các prompt có độ dài như nhau .

Câu lệnh viết prompt tạo nhạc nền trên suno ai :
- dựa vào 10 prompt để tạo ra các động tác yoga trên , hãy tạo cho tôi 1 prompt styles để tạo nhạc nền tập yoga phù hợp cho các động tác trên , yêu cầu nhạc nền hấp hẫn , sáng tạo cho tôi prompt chi tiết đầy đủ .

Câu lệnh mở đầu có hook mạnh :
- dựa vào 10 động tác yoga trên , bạn hãy tạo cho tôi 1 câu mở đầu cho video , sáng tạo câu hook vào thẳng vấn đề , và hướng người xem ở lại tập yoga , sáng tạo 1 câu mở đầu chi tiết đầy đủ ngắn gọn
```

### 3.2. Danh sách 10 Tư Thế Yoga Tiếng Anh do ChatGPT sinh ra và render trên Flow (`04:42 – 06:45`)

1. **`Mountain Pose`** (*Tư thế Trái Núi*): `Create a sharp 16:9 full-body image of the same female character from the reference image, purple braided hair, burgundy yoga outfit, barefoot, gold accessories, standing in Mountain Pose, feet together, arms relaxed beside the body, back straight, calm confident face, character smaller in the frame, centered composition, clean white transparent-style background, ultra-detailed, high resolution.`
2. **`Tree Pose`** (*Tư thế Cái Cây*): `...performing Tree Pose, one foot pressed against the inner thigh, hands together in prayer at chest level, elegant balance, calm face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.`
3. **`Warrior I Pose`** (*Tư thế Chiến Binh I*): `...performing Warrior I Pose, front knee bent at 90 degrees, back leg straight, arms raised straight overhead...`
4. **`Warrior II Pose`** (*Tư thế Chiến Binh II*): `...performing Warrior II Pose, wide stance, front knee bent, arms extended parallel to the floor...`
5. **`Triangle Pose`** (*Tư thế Tam Giác*): `...performing Triangle Pose, legs wide apart, one hand reaching down to the ankle, other arm extended straight up...`
6. **`Downward Dog Pose`** (*Tư thế Chó Úp Mặt*): `...performing Downward-Facing Dog Pose, hands and feet on the floor, hips lifted high forming an inverted V-shape...`
7. **`Cobra Pose`** (*Tư thế Rắn Hổ Mang*): `...performing Cobra Pose, lying on the stomach, palms on the floor, chest lifted, shoulders relaxed, face looking forward gently, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.`
8. **`Seated Forward Bend`** (*Tư thế Ngồi Gập Mình*): `...performing Seated Forward Bend Pose, sitting with both legs straight forward, torso folded toward the legs, hands reaching toward the feet, peaceful face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.`
9. **`Lotus Pose`** (*Tư thế Hoa Sen*): `...performing Lotus Pose, sitting cross-legged with feet placed on opposite thighs, hands resting on knees, straight back, meditative calm expression, character smaller in the frame, centered composition, clean empty background, ultra-detailed, high resolution.`
10. **`Dancer Pose`** (*Tư thế Vũ Công*): `...performing Dancer Pose, standing on one leg, one hand holding the lifted foot behind the body, opposite arm reaching forward, elegant balance, graceful face, character smaller in the frame, centered composition, no background, ultra-detailed, high resolution.`

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Phân tích ngách Yoga hoạt hình 3D (`@SunnyRainbowYoga` 4.6M view, `@GalaxyYoga` 2.5M view) & Chọn nhân vật hot trên Pinterest (`Rumi`)
- **`01:04`** — Bước 1 - Tạo ảnh nhân vật tham chiếu mặc đồ tập yoga (tỷ lệ `16:9`, chân đất, nền trắng) trên Google Flow (`Nano Banana 2`)
- **`02:13`** — Bước 2 - Chụp màn hình kênh đối thủ & Dùng Grok Imagine xóa nhân vật/logo, giữ lại phông nền và đổi màu thảm tập sang xanh dương nhạt
- **`04:04`** — Bước 3 - Dùng ChatGPT sinh 10 prompt tư thế Yoga tiếng Anh (*Mountain, Tree, Warrior I/II, Triangle, Downward Dog, Cobra, Seated Forward Bend, Lotus, Dancer*)
- **`04:42`** — Bước 4 - Đưa ảnh nhân vật tham chiếu kèm từng prompt vào Google Flow để render trọn bộ 10 hình ảnh tư thế tập Yoga đồng nhất
- **`06:54`** — Bước 5 - Tạo prompt Style nhạc nền tập Yoga trên Suno AI, xóa thảm lấy nền trống trên Grok & Viết câu Hook mở đầu bằng ChatGPT
- **`09:10`** — Bước 6 - Dựng Intro trên CapCut: Chuyển văn bản Hook thành giọng nói AI có sẵn, chỉnh phông chữ `Anton` & hiệu ứng xuất hiện
- **`10:58`** — Bước 7 - Dựng bài tập: Xóa nền tự động nhân vật, gán hiệu ứng `Máy ảnh rung` (Khoảng `1`, Tốc độ `2`), tạo Clip ghép đếm ngược `10s-1s` & nhãn dán đồng hồ
- **`15:13`** — Bước 8 - Nhân bản nhanh (Copy/Paste) hiệu ứng rung & bộ đếm giây cho toàn bộ 10 tư thế Yoga, căn chỉnh kích thước đứng trên thảm và ghép nhạc Suno AI
- **`17:47`** — Bước 9 - Thiết kế Thumbnail chuẩn `1920x1080` trên Picsart: Xếp 6 tư thế Yoga trên phông nền trống, gỡ nền tự động và chèn tiêu đề phông `Anton`

---

## 5. Quy trình triển khai (SOP Thực Chiến 5 Bước)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Hoạt Hình 3D Tập Yoga & Thumbnail 6 Tư Thế Từ A-Z

1. **Tạo nhân vật tham chiếu từ Pinterest & Google Flow:** Săn nhân vật 3D đang thịnh hành trên `Pinterest` (*Rumi*, *Elsa*, *Spider-Man*) và đưa vào `Google Flow` (`Nano Banana 2`, tỷ lệ `16:9`) cùng câu lệnh chuẩn hóa để tạo 1 ảnh nhân vật tham chiếu mặc đồ tập yoga, đi chân đất trên nền trắng.
2. **Tách phông nền & Biến tấu màu thảm trên Grok Imagine:** Chụp màn hình bối cảnh kênh đối thủ, đưa vào `Grok Imagine` chạy 3 câu lệnh: xóa nhân vật/logo giữ lại thảm yoga, đổi màu thảm sang màu mới (*xanh dương nhạt*) làm nền bài tập, và xóa thảm lấy nền trống làm Intro/Thumbnail.
3. **Sinh hàng loạt 10–30 tư thế Yoga bằng ChatGPT & Flow:** Đưa ảnh nhân vật tham chiếu vào `ChatGPT` để sinh 10–30 prompt tư thế yoga tiếng Anh, sau đó dán lần lượt từng prompt kèm ảnh tham chiếu vào `Google Flow` để xuất trọn bộ ảnh động tác đồng nhất chất lượng `1K`.
4. **Dựng video trên CapCut với hiệu ứng Máy ảnh rung & Bộ đếm giây:** Dùng `ChatGPT` sinh prompt nhạc nền cho `Suno AI` và câu Hook mở đầu; đưa toàn bộ vào `CapCut`, dùng *Text-to-Speech* đọc câu Hook, tách nền tự động các ảnh tư thế, gán hiệu ứng `Máy ảnh rung` (**Khoảng `1`**, **Tốc độ `2`**), đóng gói `Clip ghép` đếm ngược `10s–1s` kèm sticker đồng hồ rồi nhân bản cho hết bài.
5. **Đóng gói Thumbnail 6 tư thế trên Picsart:** Mở `Picsart` tạo khung `1920 x 1080`, đặt phông nền trống, tải lên 6 ảnh tư thế yoga, bấm `Gỡ nền` từng ảnh, căn chỉnh lưới 6 động tác cân đối và thêm chữ phông `Anton` để xuất bản Thumbnail.

---

## 6. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ **Không đưa trực tiếp ảnh chụp màn hình kênh đối thủ có nhân vật nhỏ tuổi hoặc nhân vật nổi tiếng lên Google Flow** để xóa nền vì rất dễ bị lỗi từ chối kiểm duyệt; bắt buộc chuyển sang xử lý trên `Grok Imagine`.
- ⚠ **Không giữ nguyên màu thảm tập và phông nền y hệt kênh đối thủ;** phải dùng câu lệnh đổi màu thảm (sang xanh dương nhạt, trắng, vàng...) để tạo sự khác biệt thẩm mỹ.
- ⚠ **Không đóng khung cứng nhắc chỉ làm đúng 10 động tác hay đúng 10 giây mỗi tư thế như bài mẫu;** khi sản xuất thực tế cần mở rộng lên 20–30 hình ảnh tư thế và kéo dài 15–20 giây/động tác để video đạt thời lượng tối ưu nhưng không kéo lê thê hàng tiếng đồng hồ.
- ⚠ **Khi nhân bản (copy/paste) các tư thế trong CapCut, tuyệt đối không để mặc định** làm nhân vật bị lệch khỏi thảm hoặc lúc to lúc nhỏ mất thẩm mỹ; phải kiểm tra và căn chỉnh lại vị trí/tỷ lệ từng tư thế cho khớp mặt thảm.

---

## 7. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ:** `Pinterest`, `Flow`, `Grok`, `ChatGPT`, `Suno AI`, `CapCut`, `Picsart`, `YouTube`
- **Kênh đối thủ mẫu (4 kênh đã xác thực HTTP 200):** `@SunnyRainbowYoga`, `@GalaxyYoga`, `@ToonYogaTime`, `@MovewithJojoforKids`
- **Tài liệu đính kèm:**
  - [`docs/VIDEO-d19b55/README.md`](README.md) (Hồ sơ phân tích thực chiến & Bảng thông số Visual CUDA GPU)
  - [`assets/docs-dgmd/VIDEO-d19b55/master_prompt.md`](../../assets/docs-dgmd/VIDEO-d19b55/master_prompt.md) (Bộ Master Prompt đầy đủ bóc tách từ Google Docs & ChatGPT của bài học)
  - [`video/VIDEO-d19b55/transcript.txt`](../../video/VIDEO-d19b55/transcript.txt) (Bản ghi phụ đề sạch 160 phân đoạn đã kiểm định)
