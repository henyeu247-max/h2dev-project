# Bộ Master Prompt & Quy Trình Sản Xuất Video Nhạc Cổ Trung Hoa (Bóc Tách Nguyên Bản)

> **Mã bài giảng:** `VIDEO-ab68db` · **Học phần:** `DGMD-M04` (Bài 12 — Quy Trình Sản Xuất Video Nhạc Cổ Trung Hoa)  
> **Nguồn Google Docs trên màn hình (`01:41 – 04:39` & `12:40`):** `https://docs.google.com/document/d/1_2L1jCi7d_5EhLJ0RtWGR9uC8mZ9iKJaILTlVRwUO18/edit?tab=t.ntj8zhza39gc`  
> **Kênh YouTube mẫu trên màn hình (`00:00 – 01:20`):** **`@shenharmony2798`** (`Shen Harmony` — `https://www.youtube.com/@shenharmony2798/videos`, HTTP 200 Live)  
> **Bộ 5 công cụ thực chiến:** `ChatGPT` + `Flow (labs.google/fx/vi/tools/flow - Nano Banana 2)` + `Grok (grok.com/imagine)` + `Suno AI` + `CapCut PC`

---

## 1. CÂU LỆNH 1: PHÂN TÍCH ẢNH GỐC & TẠO PROMPT HÌNH ẢNH TRÊN GOOGLE FLOW (`16:9`)

> **Mục đích:** Chụp màn hình (`Alt + Z` trên Cốc Cốc) một khung hình video nhạc cổ Trung Hoa mẫu từ kênh `@shenharmony2798` (ví dụ bài *"Giai điệu từ Trung Hoa cổ đại – Sáo và đàn tranh êm dịu..."* đạt `313 N lượt xem`), tải lên `ChatGPT` kèm câu lệnh dưới đây để trích xuất prompt tạo ảnh ngang `16:9` trên `Google Flow (Nano Banana 2)`.

### Prompt gốc tiếng Việt (dán kèm ảnh chụp màn hình vào ChatGPT):
```text
Câu prompt để tạo hình ảnh :
- hãy phân tích hình ảnh gốc này cho tôi , và bây giờ hãy tạo cho tôi 1 prompt để tạo lại 1 hình ảnh trên flow , sáng tạo cho tôi hình ảnh bám sát chi tiết với hình ảnh gốc , từ phong cách , nhạc cụ truyền thống , bối cảnh , tỉ lệ hình ảnh luôn cố định 16.9 , hình ảnh chất lượng cao , giờ hãy tạo cho tôi 1 prompt chi tiết đầy đủ.
```
*(Sau khi ChatGPT trả kết quả: phần trên là phân tích ảnh gốc, phần dưới là đoạn Prompt tiếng Anh $\rightarrow$ Sao chép đoạn Prompt tiếng Anh dán vào `Flow`, chọn tỷ lệ ngang `16:9` [tuyệt đối không chọn `9:16`, `4:3`, `3:4`], tải ảnh kết quả chất lượng `1K` về máy).*

---

## 2. CÂU LỆNH 2: TẠO MASTER PROMPT CHUYỂN HÌNH ẢNH THÀNH VIDEO 10 GIÂY TRÊN GROK

> **Mục đích:** Thiết lập một "câu lệnh ghi nhớ" (`Master Prompt`) trên tab `ChatGPT` riêng biệt để mỗi khi tải bất kỳ bức ảnh nhạc cổ Trung Hoa `16:9` nào lên, `ChatGPT` sẽ lập tức xuất ra câu lệnh tiếng Anh đưa sang `Grok (grok.com/imagine)` tạo video dài đúng `10 giây` (`720p`), giữ nguyên 100% chữ thư pháp trên ảnh, cố định camera hoàn toàn và chỉ cho nhân vật gảy đàn/thổi sáo nhẹ nhàng.

### Prompt gốc tiếng Việt (dán vào ChatGPT để tạo câu lệnh ghi nhớ):
```text
Câu lệnh để tạo ra Master Prompt làm video :
- hãy tạo cho tôi 1 câu lệnh , để khi tôi tải những hình ảnh liên quan đến nhạc cổ trung hoa này , bạn sẽ trả cho tôi 1 câu prompt để dùng hình ảnh này tạo video 10 giây trên grok , cố định chữ giữ nguyên có trong hình ảnh , không được thêm bất kỳ 1 hiệu ứng nào vào trong video , cố định camera 100 % không di chuyển , camera cố định chi tiết , các nhân vật đang biểu diễn đạo cụ uyển chuyển nhẹ nhàng , sáng tạo cho tôi 1 câu lệnh ghi nhớ , yêu cầu phải bám sát tất cả những nội dung mà tôi đã liệt kê trên , để khi tôi gửi hình ảnh liên quan , bạn hãy trả kết quả bằng prompt tạo video luôn .
```

### Câu lệnh ghi nhớ do ChatGPT sinh ra (Copy gửi ngược lại cho ChatGPT cùng bức ảnh `16:9`):
```text
Từ bây giờ, khi tôi tải lên bất kỳ hình ảnh nào liên quan đến nhạc cổ Trung Hoa, tranh thủy mặc, dàn nhạc cổ trang, guzheng, guqin, pipa, dizi, xiao, erhu, chuông cổ, trống lễ nghi, tiên cảnh phương Đông, núi non mây trời hoặc nhạc không lời Trung Hoa cổ đại, bạn phải tự động tạo cho tôi một prompt video chuyên nghiệp để dùng trên Grok AI Video.

Yêu cầu bắt buộc cho mọi prompt video:
- Video dài đúng 10 giây.
- Giữ nguyên 100% toàn bộ bố cục hình ảnh gốc.
- Giữ nguyên tất cả chữ có sẵn trong hình ảnh, tuyệt đối không thay đổi font, vị trí, kích thước hay hiệu ứng chữ.
- Không thêm bất kỳ hiệu ứng mới nào vào video.
- Không thêm vật thể mới, không thêm nhân vật mới.
- Camera cố định 100%, không zoom, không rung, không pan, không tilt, không dolly, không cinematic movement.
- Camera giữ nguyên toàn bộ chi tiết hình ảnh gốc.
- Các nhân vật trong hình chỉ biểu diễn nhạc cụ cổ truyền với chuyển động tay và cơ thể cực kỳ nhẹ nhàng, uyển chuyển, tự nhiên.
```

### Mẫu Prompt tiếng Anh 10 giây do ChatGPT trả về để dán vào Grok (`720p`, `10s`):
```text
10-second ancient Chinese music animation, preserve 100% of the original image composition and layout, preserve all original Chinese and English text exactly as shown, keep original font, text position, size, spacing, and style unchanged, no new effects, no new objects, no new characters, fixed camera completely static, no zoom, no movement, no cinematic motion, preserve original watercolor painting texture and ancient Chinese ink illustration details, musicians gently and gracefully playing traditional Chinese instruments (guzheng, guqin, pipa, dizi flute, erhu, bronze bells) with subtle natural hand and finger movements, calm and serene atmosphere.
```

---

## 3. CÂU LỆNH 3: TẠO MASTER PROMPT LÀM NHẠC KHÔNG LỜI LẶP MƯỢT TRÊN SUNO AI

> **Mục đích:** Tạo một câu lệnh ghi nhớ thứ 2 để khi tải bức ảnh dàn nhạc cổ trang lên, `ChatGPT` sẽ nhận diện chính xác các nhạc cụ xuất hiện trong bức tranh (`guzheng`, `guqin`, `pipa`, `xiao flute`, `dizi bamboo flute`, `erhu`, `ancient ceremonial bronze bells`) và xuất ra đoạn **`[SUNO AI STYLE PROMPT]`** tối ưu cho việc ghép nối lặp lại (`seamless ambient loop`) dài 1 tiếng không bị vấp nhịp.

### Prompt gốc tiếng Việt (dán vào ChatGPT):
```text
Câu prompt để tạo Master Prompt làm nhạc :
- hãy đóng vai thành 1 nhà chuyên gia về âm nhạc trung hoa cổ đại , bạn am hiểu các dòng nhạc không lời của trung quốc , hãy tạo cho tôi 1 câu lệnh , để khi tôi gửi hình ảnh liên quan đến nhạc trung hoa trên , bạn hãy tạo ra cho tôi 1 styles để tạo nhạc không lời , yêu cầu nhạc không lời có thể lặp đi lặp lại , để tôi có thể ghép thành 1 bài nhạc không lời dài , không có độ vấp khi ghép , yêu cầu bám sát các nhạc cụ mà tôi đã gửi có trong hình ảnh , sáng tạo cho tôi 1 styles để tạo nhạc trên suno ai , yêu cầu tạo 1 câu lệnh chi tiết , để cho chat gpt ghi nhớ về sau .
```

### Mẫu `[SUNO AI STYLE PROMPT]` thực tế hiển thị trên màn hình (`05:29`) để dán vào mục `Đơn giản -> Nhạc cụ (Instrumental)` trên Suno AI:
```text
Ancient Chinese instrumental music, cinematic watercolor fantasy atmosphere, ethereal oriental healing soundtrack, seamless looping composition, peaceful meditative ambience inspired by floating mountains and ancient Chinese mythology, featuring guzheng, guqin, pipa, xiao flute, dizi bamboo flute, erhu, ancient ceremonial bronze bells, soft ritual percussion, delicate traditional Chinese strings, flowing melodic layers, gentle evolving arrangement, spiritual mountain atmosphere, misty celestial ambience, calm flowing rhythm, serene eastern meditation music, soft reverb, airy texture, immersive fantasy environment, elegant Chinese harmonic progression, slow emotional dynamics, no vocals, no lyrics, cinematic ancient China soundtrack, relaxing study music, healing sleep ambience, watercolor fantasy soundscape, traditional Chinese orchestra ambience, seamless ambient loop, continuous melodic flow, soft intro, no hard ending, no dramatic transitions, ultra smooth looping structure, professional mix and master, warm analog texture, atmospheric stereo depth, peaceful fantasy soundtrack, meditative oriental instrumental, spiritual cloud mountain ambience, timeless ancient Chinese musical aesthetic
```

---

## 4. CÂU LỆNH 4: TẠO ẢNH THUMBNAIL 16:9 NỔI BẬT ĐỒNG BỘ VỚI VIDEO (CHATGPT)

> **Mục đích:** Tải lại bức ảnh gốc của video lên `ChatGPT` để tạo ảnh Thumbnail `16:9` có điểm nhấn thị giác mạnh hơn, có tên bài nhạc tiếng Anh/tiếng Trung thư pháp nổi bật (*"Melodies from Ancient China — Ancient Chinese Instrumental Music"*) nhưng vẫn giữ đúng bối cảnh và dàn nhân vật trong video.

### Prompt gốc tiếng Việt (dán kèm ảnh gốc vào ChatGPT ở mốc `12:40 – 13:02`):
```text
- hãy dựa vào hình ảnh gốc này , tạo cho tôi 1 hình ảnh thumbnail có điểm nhấn , có tên bài nhạc không lời trên hình ảnh , sáng tạo hình ảnh thumbnail 16.9 , hình ảnh thumbnail nổi bật
```

---

## 5. BẢNG THÔNG SỐ KỸ THUẬT HẬU KỲ VIDEO DÀI 25–60 PHÚT TRÊN CAPCUT PC

| Hạng mục | Thiết lập kỹ thuật trên CapCut PC | Tác dụng thực chiến |
| :--- | :--- | :--- |
| **Xử lý nối hình liền mạch (Ping-Pong Loop)** | Nhân đôi video `10s` từ Grok $\rightarrow$ Tắt âm thanh gốc $\rightarrow$ Chọn clip thứ 2 bấm **`Đảo ngược` (`Reverse`)** (không phải Phản chiếu) $\rightarrow$ Copy nhân bản theo từng cặp 2 clip (`20s/cặp`) | Điểm cuối của clip 1 trùng khớp 100% với điểm đầu của clip 2 đã đảo ngược, giúp chuyển động tay gảy đàn liền mạch tuyệt đối không bị giật khung hình |
| **Xử lý nối nhạc không vấp (`Crossfade 8.0s`)** | Đặt bài nhạc `.wav` từ Suno AI (`Misty Cloud Peaks.wav`) $\rightarrow$ Kéo thanh **`Mờ dần vào / Mờ dần ra` (`Fade in / Fade out`) ở mức `8.0s – 10.0s`** $\rightarrow$ Xếp chồng mí (Overlap) đoạn kết bài 1 với đoạn mở đầu bài 2 ở track dưới | Âm lượng bài trước nhỏ dần trong khi bài sau lớn dần lên cực êm, người nghe ngủ hoặc học bài không nhận ra vết cắt chuyển bài |
| **Hiệu ứng chống quét lặp lại (`Anti-Repetitive`)** | Vào `Hiệu ứng video` $\rightarrow$ Thêm 2 lớp phủ kéo dài toàn bộ timeline:<br>1. **`Phát sáng` (`Glow` / mục `Lấp lánh`)**: Cường độ nhẹ, Bộ lọc nhẹ, Xoay nhẹ<br>2. **`Băng tuyết` (mục `Mây`)**: `Không khí: 7`, `Rực sáng: 5`, `Khoảng: 2`, `Tốc độ: 0`, `Bộ lọc: 1` | Tạo hạt sáng và sương mây trôi nhẹ biến thiên liên tục trên toàn bộ thời lượng 25–60 phút, vừa tăng chiều sâu cổ trang vừa chống thuật toán quét nội dung tĩnh/lặp lại |
| **Đóng gói Timeline** | Chọn toàn bộ các track (`Ctrl + A`) $\rightarrow$ Nhấn chuột phải chọn **`Tạo clip ghép` (`Compound Clip`)** | Gom hàng trăm phân đoạn lặp thành 1 khối duy nhất (`00:22:44 – 00:25:00+`) dễ kiểm soát và xuất file Full HD `1080p 30fps` |
