# Quy Trình Sản Xuất Video Nhạc Cổ Trung Hoa

> **SKU:** `VIDEO-ab68db` · **Bài học:** Bài 12 (`DGMD-M04` — Combo 3 Quy Trình View Ngoại 1)  
> **Thời lượng:** `13:23` (`803.2s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Âm Nhạc Thư Giãn & Cổ Phong Trung Hoa (Ancient Chinese Instrumental)` · **Thị trường:** `🇻🇳 Việt Nam, 🌏 Châu Á & 🌍 Toàn Cầu`  
> **Bài học gốc:** [Mở trên DGMD Academy](https://daigiamangdep.com/learn/study/quy-trinh-san-xuat-video-nhac-co-trung-hoa) · **Bản ghi phụ đề:** [`video/VIDEO-ab68db/transcript.txt`](../../video/VIDEO-ab68db/transcript.txt) · **Tài liệu Master Prompt:** [`assets/docs-dgmd/VIDEO-ab68db/master_prompt.md`](../../assets/docs-dgmd/VIDEO-ab68db/master_prompt.md)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng giải phẫu toàn diện quy trình sản xuất dòng **Video Nhạc Không Lời Cổ Phong Trung Hoa dài 25 – 60 phút** theo đúng chuẩn kênh đối thủ mẫu **`@shenharmony2798`** (`Shen Harmony`). Do đặc thù khán giả bật lặp đi lặp lại để ngủ, học tập, đọc sách hoặc phát tại quán cà phê, một video dài 1 tiếng trong ngách này **chỉ cần đạt `10.000 – 20.000 view` là đã đủ `4.000 giờ xem` để bật kiếm tiền**.

Quy trình khép kín kết hợp 5 công cụ AI và hậu kỳ:
1. **`ChatGPT`**: Đóng vai trò bộ não trung tâm thông qua **4 Câu lệnh (`Master Prompt` ghi nhớ)** để phân tích ảnh gốc đối thủ, sinh prompt tạo ảnh `16:9`, sinh prompt tạo video `10s`, sinh `Suno AI Style Prompt` và thiết kế ảnh Thumbnail `16:9` đồng bộ.
2. **`Google Flow (`labs.google/fx/vi/tools/flow` — model `Nano Banana 2`)`**: Tạo hình ảnh dàn nhạc cổ trang thủy mặc tỷ lệ chuẩn `16:9` chất lượng `1K`.
3. **`Grok (`grok.com/imagine`)`**: Biến bức ảnh tĩnh `16:9` thành đoạn video hoạt họa dài `10 giây` (`720p`) giữ nguyên 100% chữ thư pháp, khóa cứng camera và chỉ cho nhân vật gảy đàn/thổi sáo uyển chuyển nhẹ nhàng.
4. **`Suno AI`**: Sử dụng chế độ **`Đơn giản (Simple) -> Nhạc cụ (Instrumental)`** để tạo bản nhạc cổ phong không lời khớp với các nhạc cụ xuất hiện trong bức tranh (`guzheng`, `guqin`, `pipa`, `dizi`, `xiao`, `erhu`, `bronze bells`) có cấu trúc lặp mượt (`seamless ambient loop`).
5. **`CapCut PC`**: Nhân bản video `10s` thành `25 – 60 phút` không bị giật hình bằng kỹ thuật **`Đảo ngược` (`Reverse` / `Ping-Pong Loop`)**, nối chồng các đoạn nhạc bằng thanh **`Mờ dần` (`Fade 8.0s`)**, và phủ 2 lớp hiệu ứng **`Phát sáng`** + **`Băng tuyết`** chống thuật toán quét nội dung tĩnh/lặp lại.

---

## 2. Bảng tổng hợp Kênh mẫu, Công cụ & Thông số kỹ thuật trên màn hình (Visual Frame Evidence)

### 2.1. Phân tích Kênh Đối Thủ Mẫu trên màn hình (`00:00 – 01:20`)

- **Kênh mẫu:** **`@shenharmony2798`** (`Shen Harmony` — [Mở kênh trực tiếp HTTP 200](https://www.youtube.com/@shenharmony2798/videos))
- **Các video nổi bật hiển thị trực tiếp trên giao diện kênh (`f_15.jpg`):**

| STT | Tiêu đề video trên kênh `@shenharmony2798` | Thời lượng | Lượt xem | Phong cách Thumbnail / Visual |
| :-: | :--- | :---: | :---: | :--- |
| 01 | *Giai điệu từ Trung Hoa cổ đại – Sáo và đàn tranh êm dịu giúp thư giãn, học tập và ngủ ngon* | `1:04:39` | **`313 N lượt xem`** (1 tháng) | Tranh thủy mặc tiên cảnh, dàn nhạc cụ cổ ngồi trên mỏm đá mây trắng, chữ thư pháp `中国音乐 Melodies from Ancient China` |
| 02 | *Bản Giao Hưởng Đại Đường \| Nhạc Trung Hoa Thư Giãn Giúp Học Tập & Tập Trung* | `1:02:14` | **`138 N lượt xem`** (3 tuần) | Dàn nhạc cung đình Đại Đường, chữ thư pháp `大唐交响 Symphony of the Great Tang` |
| 03 | *Lạc Vào Cổ Cảnh Trung Hoa – Nhạc Thiền Thư Giãn Giúp Tập Trung & An Tĩnh Tâm Hồn* | `1:02:21` | **`56 N lượt xem`** (1 tháng) | Dàn nhạc cổ trang bên rừng trúc và núi sương mù xanh lam |
| 04 | *Tứ Linh Tiên Âm (四灵仙音) \| Nhạc Hòa Tấu Trung Hoa* | `4:00` | **`42 N lượt xem`** (2 tuần) | Minh họa Tứ Linh thần thoại kết hợp nhạc cụ cổ |
| 05 | *Nhạc Cổ Truyền Trung Hoa Thư Giãn – Hòa Tấu Nhạc Cụ Cổ Xưa Cho Học Tập & Thư Giãn* | `1:04:07` | **`42 N lượt xem`** (1 tháng) | Phong cách thủy mặc đồng bộ, chữ `中国音乐 A landscape of melody` |

### 2.2. Bảng thông số 5 Công cụ & Hậu kỳ CapCut PC (`00:53 – 13:09`)

| Bước | Công cụ | Thao tác & Thông số hiển thị trên màn hình | Mốc thời gian |
| :-: | :--- | :--- | :---: |
| **Bước 1** | **Cốc Cốc + ChatGPT + Google Flow** | • Nhấn `Alt + Z` chụp màn hình video mẫu *"Giai điệu từ Trung Hoa cổ đại..."*<br>• Dán Câu lệnh 1 vào ChatGPT (`Tạo prompt hình ảnh gốc`)<br>• Copy prompt tiếng Anh sang **Google Flow (`Nano Banana 2 x2`)**, chọn tỷ lệ **`16:9`**, tải ảnh `1K` | `01:10 – 02:55` |
| **Bước 2** | **ChatGPT + Grok Imagine** | • Mở tab ChatGPT `Tạo video từ hình ảnh`, chạy Câu lệnh 2 để lấy câu lệnh ghi nhớ<br>• Gửi lại câu lệnh ghi nhớ + ảnh `16:9` vừa tạo $\rightarrow$ Nhận prompt video 10 giây<br>• Đưa ảnh + prompt sang **Grok Imagine**, chọn độ phân giải **`720p`**, thời lượng **`10s`** | `03:00 – 04:20`<br>`06:00 – 06:28` |
| **Bước 3** | **ChatGPT + Suno AI** | • Mở tab ChatGPT `Tạo lệnh nhạc Trung Hoa`, chạy Câu lệnh 3 để lấy câu lệnh ghi nhớ âm nhạc<br>• Gửi lại câu lệnh ghi nhớ + ảnh `16:9` $\rightarrow$ Nhận đoạn **`[SUNO AI STYLE PROMPT]`**<br>• Vào **Suno AI**, chọn tab **`Đơn giản (Simple)`**, bật **`Nhạc cụ (Instrumental)`**, dán prompt $\rightarrow$ Tải file `Misty Cloud Peaks.wav` (`03:20`) | `04:21 – 05:57`<br>`06:29 – 06:44` |
| **Bước 4** | **CapCut PC** (Dự án `0528 (1)`) | • Tắt âm thanh gốc của video Grok `10s`<br>• Nhân đôi video `10s`, chọn clip số 2 bấm **`Đảo ngược` (`Reverse`)** $\rightarrow$ Copy nhân bản theo cặp 2 clip<br>• Kéo thanh **`Mờ dần` (`Fade in/out`) = `8.0s`** trên track nhạc, cắt (`Ctrl + B`) và xếp chồng mí các đoạn nhạc<br>• Thêm 2 lớp Hiệu ứng video: **`Phát sáng`** (mục `Lấp lánh`) + **`Băng tuyết`** (`Không khí: 7`, `Rực sáng: 5`, `Khoảng: 2`, `Tốc độ: 0`, `Bộ lọc: 1`)<br>• Chọn tất cả $\rightarrow$ **`Tạo clip ghép` (`Compound Clip`)** dài `22 – 25+ phút` | `06:45 – 12:35` |
| **Bước 5** | **ChatGPT (Tạo Thumbnail)** | • Dán Câu lệnh 4 kèm bức ảnh gốc của video vào ChatGPT<br>• Xuất ảnh Thumbnail `16:9` có tiêu đề thư pháp vàng kim *"Melodies from Ancient China"* | `12:36 – 13:09` |

---

## 3. Bộ 4 Master Prompt Nguyên Bản (Trích xuất từ Google Docs & ChatGPT trên màn hình)

### 3.1. Câu lệnh 1 — Phân tích ảnh gốc & Tạo prompt hình ảnh `16:9` trên Google Flow (`01:41`)
```text
Câu prompt để tạo hình ảnh :
- hãy phân tích hình ảnh gốc này cho tôi , và bây giờ hãy tạo cho tôi 1 prompt để tạo lại 1 hình ảnh trên flow , sáng tạo cho tôi hình ảnh bám sát chi tiết với hình ảnh gốc , từ phong cách , nhạc cụ truyền thống , bối cảnh , tỉ lệ hình ảnh luôn cố định 16.9 , hình ảnh chất lượng cao , giờ hãy tạo cho tôi 1 prompt chi tiết đầy đủ.
```

### 3.2. Câu lệnh 2 — Tạo Master Prompt làm video 10 giây trên Grok (`03:00 – 03:59`)
```text
Câu lệnh để tạo ra Master Prompt làm video :
- hãy tạo cho tôi 1 câu lệnh , để khi tôi tải những hình ảnh liên quan đến nhạc cổ trung hoa này , bạn sẽ trả cho tôi 1 câu prompt để dùng hình ảnh này tạo video 10 giây trên grok , cố định chữ giữ nguyên có trong hình ảnh , không được thêm bất kỳ 1 hiệu ứng nào vào trong video , cố định camera 100 % không di chuyển , camera cố định chi tiết , các nhân vật đang biểu diễn đạo cụ uyển chuyển nhẹ nhàng , sáng tạo cho tôi 1 câu lệnh ghi nhớ , yêu cầu phải bám sát tất cả những nội dung mà tôi đã liệt kê trên , để khi tôi gửi hình ảnh liên quan , bạn hãy trả kết quả bằng prompt tạo video luôn .
```

**Mẫu Prompt tiếng Anh 10 giây do ChatGPT sinh ra trên màn hình (`03:45`):**
```text
10-second ancient Chinese music animation, preserve 100% of the original image composition and layout, preserve all original Chinese and English text exactly as shown, keep original font, text position, size, spacing, and style unchanged, no new effects, no new objects, no new characters, fixed camera completely static, no zoom, no movement, no cinematic motion, preserve original watercolor painting texture and ancient Chinese ink illustration details, musicians gently and gracefully playing traditional Chinese instruments (guzheng, guqin, pipa, dizi flute, erhu, bronze bells) with subtle natural hand and finger movements, calm and serene atmosphere.
```

### 3.3. Câu lệnh 3 — Tạo Master Prompt làm nhạc không lời trên Suno AI (`04:25 – 05:35`)
```text
Câu prompt để tạo Master Prompt làm nhạc :
- hãy đóng vai thành 1 nhà chuyên gia về âm nhạc trung hoa cổ đại , bạn am hiểu các dòng nhạc không lời của trung quốc , hãy tạo cho tôi 1 câu lệnh , để khi tôi gửi hình ảnh liên quan đến nhạc trung hoa trên , bạn hãy tạo ra cho tôi 1 styles để tạo nhạc không lời , yêu cầu nhạc không lời có thể lặp đi lặp lại , để tôi có thể ghép thành 1 bài nhạc không lời dài , không có độ vấp khi ghép , yêu cầu bám sát các nhạc cụ mà tôi đã gửi có trong hình ảnh , sáng tạo cho tôi 1 styles để tạo nhạc trên suno ai , yêu cầu tạo 1 câu lệnh chi tiết , để cho chat gpt ghi nhớ về sau .
```

**Mẫu `[SUNO AI STYLE PROMPT]` thực tế trên màn hình (`05:30`):**
```text
Ancient Chinese instrumental music, cinematic watercolor fantasy atmosphere, ethereal oriental healing soundtrack, seamless looping composition, peaceful meditative ambience inspired by floating mountains and ancient Chinese mythology, featuring guzheng, guqin, pipa, xiao flute, dizi bamboo flute, erhu, ancient ceremonial bronze bells, soft ritual percussion, delicate traditional Chinese strings, flowing melodic layers, gentle evolving arrangement, spiritual mountain atmosphere, misty celestial ambience, calm flowing rhythm, serene eastern meditation music, soft reverb, airy texture, immersive fantasy environment, elegant Chinese harmonic progression, slow emotional dynamics, no vocals, no lyrics, cinematic ancient China soundtrack, relaxing study music, healing sleep ambience, watercolor fantasy soundscape, traditional Chinese orchestra ambience, seamless ambient loop, continuous melodic flow, soft intro, no hard ending, no dramatic transitions, ultra smooth looping structure, professional mix and master, warm analog texture, atmospheric stereo depth, peaceful fantasy soundtrack, meditative oriental instrumental, spiritual cloud mountain ambience, timeless ancient Chinese musical aesthetic
```

### 3.4. Câu lệnh 4 — Tạo ảnh Thumbnail `16:9` nổi bật đồng bộ với video (`12:40`)
```text
- hãy dựa vào hình ảnh gốc này , tạo cho tôi 1 hình ảnh thumbnail có điểm nhấn , có tên bài nhạc không lời trên hình ảnh , sáng tạo hình ảnh thumbnail 16.9 , hình ảnh thumbnail nổi bật
```

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Mở đầu: Phân tích kênh mẫu `@shenharmony2798` (Video nhạc không lời dài 1 tiếng chỉ cần 10K–20K view là đủ 4.000 giờ xem)
- **`00:53`** — Tổng quan quy trình 3 bước & 5 công cụ cốt lõi (`ChatGPT`, `Suno AI`, `Grok`, `Google Flow`, `CapCut PC`)
- **`01:41`** — Câu lệnh 1 (`ChatGPT` sang `Google Flow`): Chụp màn hình mẫu (`Alt + Z`), phân tích bối cảnh & tạo ảnh nhạc cổ Trung Hoa `16:9`
- **`03:00`** — Câu lệnh 2 (`Master Prompt Video`): Thiết lập câu lệnh ghi nhớ trên `ChatGPT` để xuất prompt tạo video 10 giây (`720p`) trên `Grok`
- **`04:25`** — Câu lệnh 3 (`Master Prompt Nhạc`): Tạo `Suno AI Style Prompt` bám sát nhạc cụ trong tranh (`guzheng`, `guqin`, `pipa`, `dizi`, `erhu`)
- **`06:45`** — Hậu kỳ `CapCut PC`: Nhân bản video 10s từ `Grok` & bật tính năng `Đảo ngược` (`Reverse`) cho clip số 2 để nối vòng lặp không giật
- **`08:20`** — Kỹ thuật nối nhạc dài 25–60 phút: Chỉnh `Mờ dần` âm thanh `8.0s` (`Audio Crossfade`), cắt ghép chồng mí & thêm hiệu ứng `Phát sáng` / `Băng tuyết`
- **`12:12`** — `Gộp Clip` (`Compound Clip`) hoàn thiện video dài & Câu lệnh 4 tạo ảnh Thumbnail `16:9` có chữ thư pháp nổi bật trên `ChatGPT`

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Lợi thế vượt trội của ngách Nhạc không lời Cổ phong Trung Hoa (như kênh mẫu `@shenharmony2798` với các video dài `1:02:00 – 1:04:39` đạt `138K – 313K views`):** Do đặc thù khán giả bật nghe liên tục khi ngủ, học tập hoặc thư giãn quán cà phê, chỉ cần đạt `10.000 – 20.000 view` là kênh đã thừa điều kiện `4.000 giờ xem` để bật kiếm tiền.
- **Quy trình tái tạo hình ảnh `16:9` chuẩn xác bằng `ChatGPT` + `Google Flow (Nano Banana 2)`:** Chụp màn hình video đối thủ (phím tắt `Alt + Z` trên Cốc Cốc), đưa vào `ChatGPT` dùng Câu lệnh 1 để phân tích toàn bộ bố cục, phong cách thủy mặc và nhạc cụ truyền thống, sau đó lấy prompt tiếng Anh đưa sang `Flow` xuất ảnh ngang `16:9` chất lượng cao.
- **Tư duy lập 'Master Prompt ghi nhớ' cho Video (`ChatGPT` $\rightarrow$ `Grok Imagine 720p 10s`):** Dùng Câu lệnh 2 huấn luyện `ChatGPT` tự động sinh prompt video dài đúng `10 giây` giữ nguyên 100% chữ thư pháp có sẵn trên ảnh, khóa cứng camera cố định 100% (không zoom, không pan) và chỉ cho các nghệ nhân gảy đàn/thổi sáo uyển chuyển nhẹ nhàng.
- **Tư duy lập 'Master Prompt ghi nhớ' cho Âm nhạc (`ChatGPT` $\rightarrow$ `Suno AI`):** Dùng Câu lệnh 3 để `ChatGPT` đọc bức ảnh và tự động liệt kê đúng các nhạc cụ cổ truyền trong tranh (`guzheng`, `guqin`, `pipa`, `xiao flute`, `dizi bamboo flute`, `erhu`, `bronze bells`) kèm cấu trúc lặp liền mạch (`seamless ambient loop, soft intro, no hard ending`) rồi dán vào chế độ `Đơn giản -> Nhạc cụ (Instrumental)` trên `Suno AI`.
- **Tuyệt chiêu nối video 10 giây thành 1 tiếng không bị giật trên `CapCut PC` (`Ping-Pong Loop`):** Tuyệt đối không nối tiếp các clip 10 giây giống hệt nhau vì điểm cắt sẽ bị giật hình; phải nhân đôi clip 10 giây, chọn clip thứ 2 và bật tính năng **`Đảo ngược` (`Reverse`)**, sau đó nhân bản theo từng cặp 2 clip (Thuận + Đảo ngược) để chuyển động nối tiếp mượt tuyệt đối.
- **Kỹ thuật xử lý âm thanh & chống quét lặp lại trên `CapCut PC`:** Kéo thanh làm mờ âm thanh (`Fade in / Fade out`) ở mức `8.0 – 10.0 giây` và xếp chồng mí các đoạn nhạc để không có độ vấp khi chuyển bài; đồng thời phủ 2 lớp hiệu ứng **`Phát sáng`** (mục `Lấp lánh`) và **`Băng tuyết`** (mục `Mây`: `Không khí 7`, `Rực sáng 5`, `Khoảng 2`, `Tốc độ 0`, `Bộ lọc 1`) rồi tạo ảnh Thumbnail `16:9` đồng bộ trực tiếp từ ảnh gốc của video.

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Nhạc Cổ Trung Hoa Không Lời Dài 25–60 Phút Với `ChatGPT`, `Flow`, `Grok`, `Suno AI` & `CapCut PC`

1. **Tạo hình ảnh cổ trang 16:9 trên Google Flow:** Chụp màn hình video mẫu từ kênh `@shenharmony2798` (`Alt + Z`), đưa vào `ChatGPT` chạy Câu lệnh 1 để lấy prompt tiếng Anh rồi dán sang `Google Flow (Nano Banana 2)` xuất ảnh tỷ lệ `16:9`.
2. **Tạo video chuyển động nhẹ 10 giây trên Grok:** Thiết lập Master Prompt làm video (Câu lệnh 2) trên `ChatGPT`, tải ảnh `16:9` lên để lấy prompt tiếng Anh (cố định chữ và camera 100%), đưa vào `Grok Imagine` xuất video MP4 `720p` dài `10 giây`.
3. **Tạo nhạc cổ truyền không lời lặp mượt trên Suno AI:** Thiết lập Master Prompt làm nhạc (Câu lệnh 3) trên `ChatGPT`, tải ảnh `16:9` lên để lấy đoạn `[SUNO AI STYLE PROMPT]` khớp nhạc cụ trong tranh, dán vào mục `Đơn giản -> Nhạc cụ` trên `Suno AI` và tải file WAV.
4. **Nhân bản vòng lặp Đảo ngược & Nối nhạc 8.0s trên CapCut PC:** Đưa video 10s vào `CapCut`, tắt tiếng gốc, nhân bản clip thứ 2 và bật **`Đảo ngược` (`Reverse`)** rồi copy cặp 2 clip kéo dài 25–60 phút; nối chồng các đoạn nhạc `Suno AI` với độ mờ dần âm thanh (`Fade`) `8.0 giây`.
5. **Phủ hiệu ứng chống quét lặp lại & Tạo Thumbnail đồng bộ:** Thêm lớp hiệu ứng **`Phát sáng`** (mục `Lấp lánh`) và **`Băng tuyết`** (`Không khí 7`, `Rực sáng 5`, `Khoảng 2`, `Tốc độ 0`, `Bộ lọc 1`), bấm **`Tạo clip ghép`** xuất video, và dùng Câu lệnh 4 trên `ChatGPT` tạo ảnh Thumbnail `16:9` từ chính bức ảnh gốc.

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Khi tạo ảnh trên `Google Flow` cho dòng nhạc thư giãn dài, tuyệt đối phải kiểm tra kỹ thông số tỷ lệ ngang `16:9`, tránh để mặc định sang tỷ lệ dọc `9:16` hoặc `4:3`, `3:4`.
- ⚠ Trong `CapCut PC`, không được nhân bản trực tiếp 1 clip 10 giây liên tiếp nhau vì sẽ gây giật hình tại điểm nối; bắt buộc phải dùng tính năng **`Đảo ngược` (`Reverse` — không nhầm với `Phản chiếu`/`Mirror`)** cho clip chẵn rồi mới copy theo từng cặp 2 clip.
- ⚠ Không quên tắt âm thanh gốc của video 10 giây tạo từ `Grok` trước khi ghép nhạc `Suno AI`, và phải chỉnh thanh mờ dần âm thanh (`Fade in/out`) khoảng `8.0 giây` để đoạn nối giữa các bài nhạc không bị khựng đột ngột.
- ⚠ Tuyệt đối không làm ảnh Thumbnail khác biệt hoàn toàn với bối cảnh trong video; phải dùng chính bức ảnh gốc của video đưa vào `ChatGPT` (Câu lệnh 4) để tạo Thumbnail đồng bộ kèm tiêu đề bài nhạc nổi bật.

---

## 8. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ:** `ChatGPT`, `Suno AI`, `Grok`, `Flow`, `CapCut`, `Google Docs`, `YouTube`, `Cốc Cốc`
- **Kênh đối thủ mẫu (Đã xác thực HTTP 200 Live):** [`@shenharmony2798` (`Shen Harmony`)](https://www.youtube.com/@shenharmony2798)
- **Tài liệu đính kèm:**
  - [`assets/docs-dgmd/VIDEO-ab68db/master_prompt.md`](../../assets/docs-dgmd/VIDEO-ab68db/master_prompt.md) (Bộ 4 Master Prompt gốc + Prompt Grok Video 10s + Suno AI Style Prompt + Thông số hậu kỳ CapCut PC)
  - [`docs/VIDEO-ab68db/README.md`](README.md) (Hồ sơ phân tích chuẩn 7 lớp H2DEV Gold Standard)
  - [`video/VIDEO-ab68db/transcript.txt`](../../video/VIDEO-ab68db/transcript.txt) (Bản ghi phụ đề sạch 95 phân đoạn đã vá lỗ thủng & chuẩn hóa chính tả)
