# Bộ Prompt & Tài Liệu Thực Hành: Quy Trình Sản Xuất Video Nhạc Xẩm (VIDEO-043b07)

> **Mã bài học:** `VIDEO-043b07` | **Học phần:** `DGMD-M08` (Bài 25)
> **Giảng viên:** Đại Gia Mang Dép (Văn Thế Web)
> **Nguồn đối chiếu:** Trích xuất nguyên văn 100% từ Google Docs của giảng viên và các màn hình thao tác thực tế (`YouTube`, `ChatGPT`, `Suno AI`, `CapCut PC`) trong video bài giảng.

---

## 1. Case Study Kênh Đối Chứng Trên Màn Hình (`00:00` – `00:49`)

- **Kênh YouTube đối chứng:** **`Xẩm-Đời`** (`https://www.youtube.com/@XamDoiofficial` — `10,6 N người đăng ký · 64 video`, trạng thái `ACTIVE`).
- **Đặc trưng tệp khán giả:** Dòng nhạc Xẩm (tương tự các tác phẩm của nghệ sĩ **Hà Myo** hay dòng xẩm chợ quê dân gian) đánh trúng tệp **khán giả người lớn và trung niên** có tỷ lệ nghe trọn bài rất cao.
- **Hiệu suất thực tế các video trên kênh `Xẩm-Đời`:**
  - *Xẩm Tếu - Chuyện Đời Lắm Trò 🎭 Nghe Mà Thấm, Cười Mà Cay* (`https://www.youtube.com/watch?v=XVx864mEtXI`, thời lượng `4:13`) — đạt **420.000 lượt xem** sau 3 tuần.
  - *Xẩm Chợ Đông - Chuyện Đời Thằng Bé: Bản Nhạc Khiến Triệu Người Suy Ngẫm* (`5:03`) — đạt **329.000 lượt xem** sau 3 tuần.
  - *[Xẩm-Đời] Công Cha Nghĩa Mẹ – Ai Còn Cha Mẹ Xin Đừng Vô Tâm* (`4:04`) — đạt **196.000 lượt xem** sau 3 tuần.
  - *[Xẩm-Đời] Xẩm Chợ Đông: Ai Nhớ Ai Quên | Bản Nhạc Về Đạo Hiếu Khiến Triệu Người Suy Ngẫm* (`5:10`) — đạt **193.000 lượt xem** sau 1 tháng.
  - *🎧 TOP 10 BẢN XẨM HAY NHẤT TIKTOK | NHỮNG CÂU XẨM BUỒN TRIỆU NGƯỜI NGHE* (`46:45`) — đạt **185.000 lượt xem** sau 10 ngày.
  - *XẨM PHỐ ĐÊM 🎭 Nghe Mà Thấm | Xẩm Đời Cực Hay 2026* (`3:49`) — đạt **171.000 lượt xem** sau 1 tháng.

---

## 2. Bộ 3 Câu Lệnh Gốc Trong Google Docs Của Giảng Viên (`00:50` – `03:01`)

> **Điểm khác biệt cốt lõi của quy trình Nhạc Xẩm:** Thay vì tạo nhạc trước rồi mới làm ảnh, ở quy trình này chúng ta **Tạo hình ảnh bối cảnh Xẩm trước** (từ ảnh chụp màn hình kênh đối thủ bằng phím tắt `Alt + Shift + S`), sau đó **dùng chính bức ảnh đó để ChatGPT phân tích và sáng tác lời bài hát Xẩm + Style Prompt cho Suno AI**.

### 2.1. Câu Prompt Số 1 — Tạo Prompt Hình Ảnh Mới Bám Sát Ảnh Đối Thủ (`01:05`)
*(Đính kèm ảnh chụp màn hình video của đối thủ vào ChatGPT và dán câu lệnh sau)*:
```text
Câu prompt tạo hình ảnh :
- hãy tạo cho tôi 1 câu lệnh bám sát vào hình ảnh gốc mà tôi gửi , hãy tạo cho tôi 1 câu prompt để tạo hình ảnh , bám sát chi tiết hình ảnh , và tạo cho tôi đúng phong cách như hình ảnh gốc , yêu cầu prompt tạo ảnh 16.9 , sáng tạo hình ảnh chi tiết , bây giờ hãy tạo cho tôi 1 câu prompt để tạo hình ảnh .
```

#### Output Prompt Tạo Ảnh 16:9 Do ChatGPT Sinh Ra (Trích xuất tại `01:30` — Dùng tạo ảnh trực tiếp ngay trên ChatGPT, tỷ lệ `16:9`):
```text
Tạo hình ảnh phong cách điện ảnh chân thực, bám sát hình ảnh gốc: một người đàn ông Việt Nam ngồi xếp bằng trên chiếu cói giữa sân chợ quê cổ, mặc bộ áo nâu truyền thống, đội nón lá rộng vành, đeo kính tròn đen, tay trái cầm đàn nhị dựng thẳng, tay phải kéo vĩ đàn như đang biểu diễn nhạc dân gian/xẩm/chầu văn. Gương mặt nghiêm nghị, trầm tư, ánh nhìn hướng sang một bên. Bối cảnh là làng quê Việt Nam xưa với tường gạch cũ bong tróc, nền đất, cột nhà thô mộc, quầy rau củ dân dã, rổ tre, mẹt rau, khoai, cà rốt, bí xanh, người dân đội nón lá đang bán hàng phía sau. Bên phải có một cô gái mặc áo nâu, đội nón lá, ngồi nhặt rau cạnh người đàn ông. Ánh sáng ban ngày tự nhiên, tông màu vàng nâu hoài cổ, bụi nhẹ trong không khí, cảm giác đời sống thôn quê chân thật. Góc máy ngang tầm mắt, bố cục điện ảnh rộng, nhân vật chính ở trung tâm hơi lệch phải, hậu cảnh có chiều sâu, chi tiết sắc nét, realistic cinematic Vietnamese countryside market, vintage documentary film look, 4K, ultra detailed, natural shadows, shallow depth of field, 16:9 aspect ratio
```

---

### 2.2. Câu Prompt Số 2 — Đóng Vai Chuyên Gia Nhạc Xẩm Viết Lyrics & Style Từ Hình Ảnh (`01:55`)
*(Sao chép bức ảnh nghệ nhân hát xẩm `16:9` vừa được ChatGPT tạo ra, dán xuống khung chat kèm câu lệnh thứ 2)*:
```text
Câu prompt tạo lệnh :
- Bạn hãy đóng vai thành 1 nhà chuyên gia âm nhạc về dòng nhạc xẩm việt nam , và hiểu về dòng nhạc từ phong cách chất giọng , bây giờ dựa vào hình ảnh gốc mà tôi đã gửi , bạn hãy sáng tạo cho tôi 1 lyrics để tạo ra bài hát xẩm , sau đó sáng tạo 1 prompt để tạo ra styles dùng tạo nhạc trên suno ai , yêu cầu hãy am hiểu về dòng nhạc xẩm chế tại việt nam trước , sau đó bạn hãy tạo cho tôi toàn bộ chi tiết , yêu cầu phân tích lyrics và styles mà bạn cho với bắt đầu viết bài hát .
```

#### Output Lyrics & Style Prompt Nhạc Xẩm Do ChatGPT Sinh Ra (Trích xuất tại `02:25` & `05:25`):

- **Tên bài hát:** `TIẾNG NHỊ GIỮA CHỢ QUÊ`
- **Trích đoạn `[LYRICS XẨM MỚI]` (Dán vào ô `Lyrics` trên Suno AI — Chế độ `Advanced`):**
```text
[MỞ ĐẦU]
Ới a... là ơi...
Chợ quê còn đó bóng người xưa
Chiếu cói trải giữa nắng trưa
Một cung đàn kéo cho vừa lòng dân

[VERSE 1]
Tôi ngồi giữa chợ làng ta
Áo nâu bạc gió, nón già che vai
Tay nâng cây nhị thở dài
Kéo câu nhân nghĩa cho ai nhớ đời
...
[ĐIỆP KHÚC CUỐI]
Ới ai qua chợ thì nghe
Một câu xẩm cũ chở che kiếp người
Dẫu nghèo vẫn giữ nụ cười
Dẫu đau vẫn hát cho đời bớt đau

Ới a... nón lá phai màu
Áo nâu còn ấm nhịp cầu quê ta
Chợ quê, tiếng nhị ngân xa
Xẩm còn vang mãi trong nhà Việt Nam

[KẾT]
Ới a... là ơi...
Ai về qua mái chợ xưa
Nghe câu xẩm cũ như vừa hôm qua
Đàn nhị còn kéo thiết tha
Giữ hồn đất Việt, giữ nhà quê hương.
```

- **`[SUNO AI STYLE PROMPT]` (Dán vào ô `Styles` trên Suno AI):**
```text
Vietnamese Xẩm folk music, traditional northern Vietnamese street singing, old countryside market atmosphere, raw emotional male vocal, slightly nasal and gritty voice, expressive vibrato, folk ornamentation, storytelling vocal delivery, đàn nhị lead melody, wooden clappers, small hand drum, light phách rhythm, bamboo flute accents, rustic acoustic texture, slow to medium tempo 82–96 BPM, nostalgic and earthy mood, vintage documentary feeling, Vietnamese village market soundscape, emotional build-up, call-and-response folk phrasing, authentic traditional Xẩm style, warm natural mix, organic instruments, no modern EDM, no heavy bass, cinematic folk atmosphere, deeply Vietnamese cultural identity.
```

- **`[NEGATIVE PROMPT]` (Tham chiếu kiểm soát chất âm):**
```text
Avoid EDM, trap drums, heavy electronic bass, robotic vocals, pop autotune, modern club sound, wrong Vietnamese pronunciation, over-polished commercial pop, muddy mix, weak folk identity, lack of đàn nhị, lack of phách rhythm, emotionless singing, too fast tempo, generic melody.
```

---

### 2.3. Câu Prompt Số 3 — Thiết Kế Ảnh Bìa Thumbnail 16:9 Trực Tiếp Trên ChatGPT (`02:49` – `03:32`)
*(Đính kèm bức ảnh nghệ nhân hát xẩm vào ChatGPT, chọn công cụ `Tạo hình ảnh`, tỷ lệ `16:9` và dán câu lệnh)*:
```text
Câu prompt tạo ảnh thumbnail :
Dựa vào lyrics trên hãy thiết kế cho toi 1 hình ảnh thumbnail , cho bài hát trên , sáng tạo cho hình ảnh gốc này mà tôi gửi , thiết kế trên hình ảnh to rõ ràng có điểm nhấn , có tên bài hát trên hình ảnh , sáng tạo hình ảnh thumbnail 16.9 , hình ảnh thumbnail nổi bật
```
> **Kết quả thực tế trên màn hình (`03:15`):** ChatGPT tự động thiết kế hoàn chỉnh bức ảnh Thumbnail `16:9` có bố cục chữ nghệ thuật cực kỳ bắt mắt (*`Tiếng Nhị Giữa Chợ Quê` — `XẨM VIỆT NAM` — `XẨM QUÊ XƯA` — `Một câu xẩm cũ – Chở che kiếp người`*) mà không cần dùng đến Photoshop hay Canva.

---

## 3. Quy Trình Hậu Kỳ Ảnh Tĩnh & Phụ Đề Thủ Công Trên CapCut PC (`03:38` – `09:03`)

1. **Cắt đoạn nhạc trống & Kéo dài ảnh nền:**
   - Đưa bức ảnh nghệ nhân hát xẩm `16:9` và file nhạc `TIẾNG NHỊ GIỮA CHỢ QUÊ.wav` tải từ Suno AI vào **CapCut PC**.
   - Cắt bỏ khoảng lặng không có tiếng ở đầu file nhạc để vào nhịp hát ngay lập tức, sau đó kéo dài thời lượng bức ảnh tĩnh khớp bằng độ dài bài nhạc (`04:52`).
2. **Tạo chuyển động giả lập bằng Hiệu ứng `Camera rung` & `Nhãn dán` đĩa xoay:**
   - Vào mục **Hiệu ứng (Effects)** $\rightarrow$ gõ tìm **`camera rung`** $\rightarrow$ chọn đúng hiệu ứng **`Camera rung`** (tuyệt đối **không chọn** `Máy ảnh rung` vì độ giật quá mạnh) $\rightarrow$ kéo phủ suốt chiều dài bức ảnh (thông số chuẩn trên màn hình: `Tốc độ: 5`, `Rực sáng: 13`, `Cường độ: 16`).
   - Vào mục **Nhãn dán (Stickers)** $\rightarrow$ tìm từ khóa **`nhạc`** $\rightarrow$ chọn nhãn dán **đĩa nhạc xoay tròn** đặt ở góc trên bên phải màn hình, kéo dài suốt video để khung hình luôn có chuyển động sống động.
3. **Biên tập phụ đề bài hát thủ công (2 câu/lần) trên 2 màn hình:**
   - *Lưu ý kỹ thuật:* Tính năng Phụ đề tự động của CapCut chỉ đọc chuẩn giọng nói văn bản thông thường, không thể bóc băng chính xác giọng hát Xẩm luyến láy. Do đó bắt buộc phải chèn chữ thủ công.
   - Mở **2 màn hình song song** (Màn 1 mở lời bài hát trên **Suno AI**, Màn 2 mở **CapCut PC**).
   - Chọn **Văn bản (Text)** $\rightarrow$ **Thêm văn bản** $\rightarrow$ chọn phông chữ **`Teeprang`**, cỡ chữ **`10`**, đặt ở chính giữa phía dưới màn hình.
   - Mỗi lần chỉ sao chép **2 câu thơ (2 dòng)** từ Suno AI dán vào khối văn bản, nghe giai điệu đến đâu thì cắt tách khối chữ và thay cặp câu mới đến đó (không để đoạn chữ quá dài như karaoke).
4. **Áp dụng đồng loạt Hiệu ứng động (`Vào` + `Vòng lặp`):**
   - Sau khi dán xong lời bài hát đến hết video, quét chuột bôi đen toàn bộ các khối văn bản trên timeline.
   - Vào mục **Hiệu ứng động (Animation)** ở góc phải $\rightarrow$ chọn kết hợp **1 hiệu ứng `Vào` (In)** (ví dụ: `Bụi đốm`) cộng với **1 hiệu ứng `Vòng lặp` (Loop)** (ví dụ: `Phóng to chữ`, tốc độ `3.7s`) để từng câu thơ xẩm hiện lên mềm mại và chuyên nghiệp.
