# Bộ Prompt & Tài Liệu Thực Hành: Quy Trình Sản Xuất Video Nhạc Chầu Văn (VIDEO-f2ebfb)

> **Mã bài học:** `VIDEO-f2ebfb` | **Học phần:** `DGMD-M08` (Bài 24)
> **Giảng viên:** Đại Gia Mang Dép (Văn Thế Web)
> **Nguồn đối chiếu:** Trích xuất nguyên văn 100% từ Google Docs của giảng viên và các màn hình thực chiến (`YouTube`, `ChatGPT`, `Suno AI`, `Pinterest`, `Grok Imagine`, `CapCut PC`) trong video bài giảng.

---

## 1. Case Study Kênh Đối Chứng Trên Màn Hình (`00:00` – `02:32`)

- **Kênh YouTube đối chứng:** **`Phật Giáo Làng Sen`** (`https://www.youtube.com/@PhatGiaoLangSen` — `6,65 N người đăng ký`, trạng thái `ACTIVE`).
- **Hiệu suất các video nhạc Chầu Văn dài (`16:9`) trên kênh:**
  - *Văn Cô Bơ Thoải Phủ - Bản Chuẩn Cảm Xúc Nhất - Phật Giáo Làng Sen* (`https://www.youtube.com/watch?v=aaZfiUDBnFw`, thời lượng `8:15`) — đạt **897.000 lượt xem** và **1.000 lượt thích** sau 2 tháng.
  - *VĂN ÔNG HOÀNG BẢY BẢO HÀ - Bản Chuẩn Đầy Đủ Nhất | Ban Lộc Tài, Bình An* (`30:43`) — đạt **545.000 lượt xem** sau 2 tháng.
  - *Hầu Đồng Cô Đôi Thượng Ngàn - Hát Văn Cực Hay - BẢN CHUẨN CÓ CHỮ* (`7:30`) — đạt **365.000 lượt xem** sau 2 tháng.
  - *CHẦU LỤC CUNG NƯƠNG - Tuyệt Phẩm Hát Văn - Mế Lục Ngàn Tối Linh* (`28:28`) — đạt **226.000 lượt xem** sau 2 tháng.
  - *Trọn Bộ 5 Giá Quan Lớn Chuẩn Lề Lối (Đệ Nhất đến Đệ Ngũ)* (`2:12:39`) — đạt **150.000 lượt xem** sau 1 tháng.

---

## 2. Prompt 1: Câu Lệnh Thiết Lập Chuyên Gia Nhạc Chầu Văn Trên ChatGPT (`00:39` – `01:45`)

### 2.1. Câu lệnh yêu cầu gốc (Trích xuất từ Google Docs của giảng viên tại `00:45`)
> **Mẹo thao tác nhanh:** Nếu không muốn gõ lại tay, nhấn tổ hợp phím **`Alt + Shift + S`** chụp màn hình đoạn văn bản dưới đây, dán vào **ChatGPT** kèm lệnh *"viết ra cho tôi câu lệnh trong hình"*, sau đó sao chép kết quả gửi lại cho ChatGPT ghi nhớ.

```text
Câu lệnh yêu cầu :
Bạn hãy đóng vai thành 1 nhà chuyên gia âm nhạc về dòng nhạc chầu văn việt nam , bây giờ hãy tạo cho tôi 1 câu lệnh , khi tôi gửi 1 lyrics bài hát bất kỳ , bạn hãy phân tích về lyrics bài hát đó , sau đó viết lại cho tôi 1 lyrics bài hát đầy đủ , và viết 1 prompt styles để tạo lại 1 bài hát chầu văn bám sát bài hát gốc , yêu cầu sáng tạo chi tiết , hãy viết cho tôi 1 câu lệnh gửi cho chatgpt ghi nhớ , và chatgpt lưu lại , tôi chỉ cần gửi lyrics nên và bạn sẽ trả về kết quả , viết 1 câu lệnh liền mạch các mục xuống dòng , cho tôi
```

### 2.2. Output Style Prompt & Negative Prompt Chuẩn Cho Suno AI (Trích xuất tại `03:20`)

Khi dán **Bản chép lời (Transcript)** của một bài hát Chầu Văn từ YouTube vào khung chat đã ghi nhớ của **ChatGPT**, hệ thống sẽ sinh ra lời bài hát Chầu Văn mới hoàn toàn (ví dụ bài *Hàn Sơn Khói Hương* lấy cảm hứng từ *Văn Cô Bơ Thoải Phủ*) kèm cặp Prompt cấu hình cho **Suno AI**:

- **`[STYLE PROMPT]` (Dán vào ô `Styles` trên Suno AI — Chế độ `Advanced`):**
```text
Vietnamese Chau Van traditional spiritual music, authentic Vietnamese folk ceremonial singing, sacred temple atmosphere, Hau Dong ritual energy, emotional female Vietnamese vocal with traditional ornamentation and luyến láy, đàn nguyệt lead melody, bamboo flute, traditional Vietnamese drums, wooden clappers, ceremonial percussion, hypnotic rhythmic chanting, deep spiritual emotion, cinematic ethnic fusion, dramatic build-up, powerful chorus, mystical river atmosphere, ancient Vietnamese temple ambience, emotional storytelling vocal, rich folk textures, spiritual sacred energy, clean professional mix and master, dynamic ritual transitions, emotional crescendo, authentic Northern Vietnam Chau Van performance style, divine feminine spiritual atmosphere, immersive cultural soundscape, haunting melodic progression, traditional Vietnamese spiritual folk music.
```

- **`[NEGATIVE PROMPT]` (Tham chiếu kiểm soát chất âm):**
```text
Avoid strong EDM drops, avoid modern commercial pop style, avoid robotic vocals, avoid wrong Vietnamese pronunciation, avoid missing traditional instruments, avoid heavy electronic bass, avoid muddy mix, avoid generic melody, avoid losing Chau Van identity, avoid emotionless singing, avoid westernized vocal style, avoid trap drums, avoid synthetic atmosphere, avoid overly fast tempo, avoid noisy arrangement, avoid weak spiritual feeling.
```

---

## 3. Prompt 2: Câu Lệnh Tạo Hình Ảnh Nhân Vật Tham Chiếu Đồng Nhất 100% (`03:45` – `04:50`)

1. Lên **Pinterest** (`https://www.pinterest.com/`), tìm kiếm từ khóa **`chầu văn`**, chọn một bức ảnh cô đồng/thanh đồng có trang phục khăn chầu áo ngự đẹp mắt $\rightarrow$ chuột phải chọn **Sao chép hình ảnh**.
2. Mở một tab **ChatGPT** mới, dán bức ảnh vừa copy vào kèm câu lệnh sau để tách bỏ phông nền cũ và tạo ảnh nhân vật chuẩn:

```text
Hãy tạo lại hình ảnh này cho tôi , hình ảnh 9.16 , đầy đủ chi tiết nhân vật nữ trong hình ảnh , nhân vật bé hơn tỉ lệ khung , hình ảnh sắc nét , nhân vật đứng thẳng , không cần phông nền , xóa bỏ tất cả phông nền từ hình ảnh cũ .

Đặt tỷ lệ khung hình thành 9:16
```
3. Tải bức ảnh nhân vật đã tách nền này xuống máy để làm **Hình ảnh tham chiếu gốc (Reference Image)** xuyên suốt toàn bộ 30 cảnh của MV.

---

## 4. Prompt 3: Câu Lệnh Tạo Hàng Loạt 30 Prompt Ảnh & 30 Prompt Video (`04:51` – `06:51`)

### 4.1. Câu lệnh tiếng Việt gửi vào ChatGPT (Đính kèm ảnh nhân vật tham chiếu ở Bước 3 vào đúng tab ChatGPT đã viết lời bài hát)
```text
Câu lệnh tạo ảnh và video dựa trên lyrics bài hát :
dựa trên bài hát lyrics mà bạn đã tạo lại , hãy tạo cho tôi 30 prompt khi tôi tải hình ảnh này nên grok , prompt sẽ tạo ra 1 hình ảnh , nhân vật này liên quan đến 1 đoạn trong bài hát , chia đều cho 30 prompt , sáng tạo các góc quay liên quan đến nhạc chầu văn , yêu cầu prompt tạo ảnh chi tiết , các prompt tạo góc quay liên tục thay đổi , sáng tạo nhân vật cầm các đồ vật liên quan đến biểu diễn chầu văn , sau đó dưới mỗi prompt tạo hình ảnh , bạn hãy tạo cho tôi 1 prompt để tạo ra video , yêu cầu prompt chi tiết để tạo dựa vào hình ảnh có sẵn , để tạo ra video nhân vật đang biểu diễn dựa trên hình ảnh , sáng tạo các quay liên tục cho tôi , biểu diễn chi tiết cho tôi , sáng tạo đầy đủ cho 30 prompt chi tiết tạo ảnh và 30 prompt chi tiết để tạo video , các câu prompt phải đầy đủ ký tự hay từ như nhau , bám sát và tạo luôn prompt cho tôi , tất cả từ prompt tạo ảnh và prompt tạo video đều là kích thước 16.9 yêu cầu ghi nhớ .
```
> **Lưu ý:** Khi ChatGPT xuất xong 5 cặp prompt đầu tiên (`Prompt 01` $\rightarrow$ `Prompt 05`), chỉ cần gõ **`tiếp tục`** để ChatGPT sinh tiếp từ `Prompt 06` đến đủ `Prompt 30`.

### 4.2. Mẫu Cặp Prompt Thực Tế Do ChatGPT Sinh Ra (Trích xuất tại `06:30` & `12:15`)

#### Mẫu `PROMPT 01 — MỞ ĐẦU KHÓI HƯƠNG HÀN SƠN`
- **`PROMPT TẠO ẢNH (16:9)` (Dán vào Grok Imagine — Chế độ `Hình ảnh / Image`, tỷ lệ `16:9`, đính kèm ảnh nhân vật tham chiếu):**
```text
Use the uploaded Vietnamese Chau Van female performer as the ONLY main character reference, keep 100% same face, same costume, same traditional khăn chầu màu đỏ, same floral black ceremonial áo dài, same Vietnamese spiritual performer appearance. Cinematic Vietnamese Chau Van spiritual scene at Hàn Sơn temple at night, thick incense smoke floating through ancient temple lanterns, sacred altar glowing with golden candles, traditional Vietnamese temple architecture, mystical moonlight, character holding burning incense sticks while smiling gently, dramatic ceremonial atmosphere, ancient Vietnamese spiritual culture, detailed embroidered costume reflections, cinematic lighting, ultra realistic, Vietnamese folk spiritual aesthetic, sacred temple energy, cinematic ethnic fusion, highly detailed, sharp focus, wide angle shot, low camera angle looking upward toward the performer, atmospheric smoke, glowing red candles, traditional ceremonial objects surrounding the character, 16:9 ratio, ultra HD, cinematic masterpiece.
```

- **`PROMPT TẠO VIDEO (16:9)` (Dán vào Grok Imagine — Chế độ `Video`, độ phân giải `720p`, thời lượng `6s` trên chính bức ảnh Cảnh 1 vừa tạo):**
```text
Use the generated image as the ONLY reference frame. Create a cinematic Vietnamese Chau Van performance video. The female performer slowly raises the incense sticks toward the sky while softly swaying her body following ceremonial rhythm. Incense smoke continuously moves across the frame. Her sleeves and khăn chầu move naturally in slow wind. Temple lanterns flicker dynamically. The camera slowly pushes forward from low angle toward the performer while maintaining character consistency. Traditional spiritual atmosphere, realistic movement, cinematic lighting, sacred temple environment, smooth ceremonial gestures, emotional Vietnamese Chau Van performance, ultra detailed facial expression, realistic smoke simulation, no modern dance, 16:9 cinematic video.
```

#### Mẫu `PROMPT 08 — NGÂN KHÚC NAM THƯƠNG`
- **`PROMPT TẠO ẢNH (16:9)`:**
```text
Use the uploaded Vietnamese Chau Van female performer as the ONLY character reference, preserve all original costume and facial details exactly. Inside a traditional Vietnamese temple performance hall illuminated by warm lantern light, the performer gracefully singing Chau Van while holding a traditional ceremonial microphone decorated with silk ribbons, ancient musicians visible softly blurred in background playing đàn nguyệt and sáo trúc, sacred incense smoke filling the hall, dramatic cinematic spotlight on performer face, emotional storytelling expression, embroidered costume glowing beautifully under warm lighting, cinematic close-up shot from front angle, Vietnamese spiritual performance atmosphere, ultra realistic ceremonial environment, highly detailed textures, cinematic ethnic fusion aesthetic, sacred folk ritual energy, ultra HD quality, 16:9 cinematic ratio.
```

- **`PROMPT TẠO VIDEO (16:9)`:**
```text
Use the generated image as the main animation reference. The performer passionately sings Chau Van lyrics while gently moving her hands following traditional ceremonial rhythm. Her eyes and facial expressions continuously shift emotionally. Smoke drifts slowly around the temple hall. Lantern lights flicker naturally across the embroidered costume. The camera slowly zooms inward toward the performer face while softly rotating from left to center angle. Traditional Vietnamese spiritual performance atmosphere, cinematic emotional storytelling, realistic singing movement, sacred Chau Van energy, ultra detailed facial animation, cinematic 16:9 performance video.
```

---

## 5. Prompt 4: Câu Lệnh Thiết Kế Ảnh Bìa Thumbnail YouTube 16:9 (`12:00` – `13:16`)

Đính kèm một bức ảnh cảnh biểu diễn đẹp nhất vừa tạo vào khung chat **ChatGPT** (tab đã chứa lời bài hát) và nhập câu lệnh:

```text
Dựa vào lyrics trên hãy thiết kế cho toi 1 hình ảnh thumbnail , cho bài hát trên , sáng tạo cho hình ảnh gốc này mà tôi gửi , thiết kế trên hình ảnh to rõ ràng có điểm nhấn , có tên bài hát trên hình ảnh , sáng tạo hình ảnh thumbnail 16.9 , hình ảnh thumbnail nổi bật

Đặt tỷ lệ khung hình thành 16:9
```
> **Quy trình xuất file hoàn chỉnh:** Tải nhạc từ **Suno AI** dưới định dạng chuyên nghiệp **`WAV`** $\rightarrow$ đưa toàn bộ các clip `6s` từ **Grok** vào **CapCut PC** $\rightarrow$ kéo thanh **Âm lượng của tất cả clip video về `0`** $\rightarrow$ ghép khớp với file nhạc `WAV`, xuất video `1080p` và đăng tải lên YouTube bằng **máy tính (PC)** kèm ảnh Thumbnail `16:9`.
