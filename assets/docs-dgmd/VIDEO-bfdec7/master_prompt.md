# BỘ MASTER PROMPT SẢN XUẤT VIDEO BIẾN ĐỔI NHÂN VẬT HOẠT HÌNH SANG PHIÊN BẢN THỰC TẾ — VIEW NHẬT (DORAEMON AI LIVE-ACTION / ROBOT / SAMURAI)

> **Nguồn trích xuất:** Bài 20 (`DGMD-M06` - `VIDEO-bfdec7`) — *Quy Trình Sản Xuất Video Biển Đổi Nhân Vật View Nhật* (Giảng viên: Đại Gia Mang Dép).
> **Hệ sinh thái công cụ thực chiến:** `Google Dịch` (Tra cứu từ khóa tiếng Nhật) + `ChatGPT` (Liệt kê 10 bộ Anime Nhật, xuất bảng tên nhân vật song ngữ Anh - Nhật & tạo Master Prompt Grok/Suno) + `Pinterest` (Tải ảnh gốc 2D nhân vật & nền lưới `grid Background`) + `Grok Imagine` (Tạo ảnh AI biến đổi tỷ lệ `1:1`) + `Suno AI` (Tạo nhạc nền Instrumental không lời) + `CapCut PC` (Dựng video so sánh trái/phải `16:9` xuất `720p`/`1080p`) + `Picsart` (Thiết kế Thumbnail `1920x1080` kèm mũi tên đỏ).

---

## 1. TỪ KHÓA TÌM KIẾM NGÁCH TRÊN YOUTUBE NHẬT BẢN (`00:00 – 01:03`)

Sử dụng **Google Dịch** (`Tiếng Việt -> Tiếng Nhật`) để dịch từ khóa gốc rồi dán lên thanh tìm kiếm YouTube:

```text
Tiếng Việt: Doraemon phiên bản thực tế
Tiếng Nhật: 現実世界のドラえもん
```

- **Các từ khóa mở rộng cùng công thức:**
  - `ドラえもん AI実写化` (*Doraemon AI Live Action*)
  - `もしドラえもんのキャラクターが現実世界にいたら` (*What if Doraemon characters were in the real world*)

---

## 2. CHUỖI CÂU LỆNH CHATGPT KHAI THÁC DANH SÁCH ANIME & TÊN NHÂN VẬT SONG NGỮ (`01:27 – 03:05`)

### Bước 2.1 — Xin 10 bộ phim hoạt hình Nhật Bản nổi tiếng (`01:31`)

```text
cho tôi xin tên 10 bộ phim hoạt hình của Nhật Bản
```

*(Kết quả gợi ý từ ChatGPT trong bài giảng: 1. Chiikawa, 2. Doraemon, 3. Crayon Shin-chan, 4. Pokémon, 5. Demon Slayer: Kimetsu no Yaiba, 6. Sazae-san, 7. Chibi Maruko-chan, 8. Detective Conan, 9. Dragon Ball, 10. Sailor Moon).*

### Bước 2.2 — Liệt kê toàn bộ tên nhân vật trong bộ Anime được chọn (`02:01`)

```text
cho tôi xin các tên nhân vật trong doraemon
```

### Bước 2.3 — Xuất bảng đối chiếu tên nhân vật Song Ngữ Tiếng Anh & Tiếng Nhật để dán vào CapCut (`02:23`)

```text
viết cho tôi các tên nhân vật doraemon , 1 bên là tiếng anh , 1 bên là tiếng nhật
```

**Bảng dữ liệu chuẩn trích xuất trực tiếp từ màn hình bài giảng (`02:45 – 03:20` & `21:30`):**

| STT | Tên Tiếng Anh / Latin (Dòng 1 trên CapCut) | Tên Tiếng Nhật / Kanji - Kana (Dòng 2 trên CapCut) | Tên quen thuộc tại Việt Nam |
| :---: | :--- | :--- | :--- |
| 1 | `Doraemon` | `ドラえもん` | Đô-rê-mon |
| 2 | `Nobita Nobi` | `野比 のび太` | Nô-bi-ta |
| 3 | `Shizuka Minamoto` | `源 静香` | Xuka |
| 4 | `Takeshi Gouda (Gian)` | `剛田 武（ジャイアン）` | Chaien |
| 5 | `Suneo Honekawa` | `骨川 スネ夫` | Xêkô |
| 6 | `Dorami` | `ドラミ` | Đô-rê-mi |
| 7 | `Hidetoshi Dekisugi` | `出木杉 英才` | Đê-khi |
| 8 | `Tamako Nobi` | `野比 玉子` | Mẹ Nobita |
| 9 | `Nobisuke Nobi` | `野比 のび助` | Bố Nobita |
| 10 | `Jaiko Gouda` | `剛田 ジャイ子` | Em gái Chaien |
| 11 | `Sewashi Nobi` | `セワシ` | Chắt của Nobita |
| 12 | `Sensei (Teacher)` | `先生` | Thầy giáo |

---

## 3. MASTER PROMPT CHATGPT TỰ ĐỘNG SINH PROMPT ẢNH GROK IMAGINE (`03:54 – 09:05`)

### 3.1. Câu lệnh khởi tạo "Con tạo Master Prompt" (Kèm ảnh gốc 2D tải từ Pinterest — `04:40`)

```text
hãy tạo cho tôi 1 master prompt , khi tôi gửi hình ảnh bất kỳ lên đây , bạn hãy tạo cho tôi 1 prompt chi tiết , để sử dụng hình ảnh đó trên grok tạo lại hình ảnh khác , bám sát toàn bộ hình ảnh gốc , biến đổi nhân vật sang phiên bản thực tế , yêu cầu prompt chi tiết đầy đủ ngắn gọn để tôi gửi ảnh đưa lên grok tạo video
```

### 3.2. Câu lệnh biến tấu chủ đề (Mặc giáp Robot / Samurai / Giáp Vàng / Đáng yêu — `08:11`)

Khi muốn tạo sự khác biệt thay vì chỉ làm phiên bản người thật thông thường, nhập lệnh cập nhật quy tắc cho toàn bộ ảnh gửi sau đó:

```text
các nhân vật sau , khi tôi gửi lên , tạo 1 prompt biến đổi các nhân vật đó sang phiên bản thực tế , trang bị quần áo như robot
```

### 3.3. Mẫu Prompt Tiếng Anh chuẩn do ChatGPT xuất ra để dán vào Grok Imagine (`07:20`)

**Mẫu 1 — Biến đổi Doraemon sang phiên bản thực tế (Photorealistic Real-World Scene):**

```text
Recreate the uploaded image as a highly photorealistic real-world scene while preserving the original composition, pose, and proportions as closely as possible. Doraemon is sitting in the same relaxed seated pose, centered slightly toward the lower middle of the frame, with his recognizable round blue body, white face and belly, large white feet, small white hands resting in front, red nose, red collar and golden bell. Preserve his cheerful closed-eye smile, whiskers, facial proportions, body shape, pose, camera angle and framing. Transform the cartoon design into a believable real-life robotic cat with soft realistic blue-and-white surface textures while keeping his iconic appearance immediately recognizable. Preserve the reddish outdoor surface beneath him, diagonal architectural elements and green leafy vegetation in the background. Natural daylight, realistic shadows, cinematic photorealism, fine textures, shallow depth of field, sharp subject, 4K. For video, add subtle breathing-like body motion, gentle blinking and tiny natural head movement, with a very slow cinematic push-in. No redesign, no extra objects, no text, no deformation.
```

**Mẫu 2 — Biến đổi Doraemon sang phiên bản thực tế khoác giáp Robot cơ khí (`09:05`):**

```text
Recreate the uploaded image as a highly photorealistic real-world scene while preserving the original composition, pose, proportions, camera angle, and background as closely as possible. Transform the character into a realistic live-action mechanical robot version of Doraemon sitting in the exact same relaxed pose, with his round blue-and-white body redesigned as detailed metallic armor plating, visible mechanical joints, subtle panel lines, realistic brushed metal and glossy composite textures, a glowing red nose sensor, a metallic red collar, and a detailed golden mechanical bell. Keep his cheerful closed-eye expression, whiskers, iconic round head, body shape, hand placement, and foot position immediately recognizable. Preserve the warm reddish wooden deck beneath him, the railing behind him, and the green trees in the background with natural daylight, realistic reflections, soft shadows, shallow depth of field, ultra-detailed textures, cinematic photorealism, 4K. No extra characters, no text, no composition changes, no distortion.
```

> **Lưu ý sống còn trên Grok Imagine (`grok.com/imagine`):**
> - Chọn chế độ **`Image`** -> Tải ảnh gốc 2D lên làm ảnh tham chiếu (Reference Image) -> Dán Prompt tiếng Anh -> **Bắt buộc chọn tỷ lệ khung hình `1:1` (Vuông)** để khi ghép đôi Trái/Phải trên khung `16:9` của CapCut hai ảnh cân đối tuyệt đối.

---

## 4. CÂU LỆNH TẠO NHẠC NỀN KHÔNG LỜI TRÊN SUNO AI (`21:15 – 22:25`)

### Bước 4.1 — Yêu cầu ChatGPT viết Prompt nhạc Suno dựa trên bộ ảnh nhân vật (`21:30`)

```text
dựa theo những hình ảnh trên , bạn hãy tạo cho tôi 1 prompt để tạo nhạc nền không lời trên suno , ngắn gọn
```

### Bước 4.2 — Prompt Tiếng Anh dán vào mục Simple (Bật chế độ `Instrumental`) trên `suno.com/create` (`22:00`)

```text
Cute Japanese anime instrumental, playful, cheerful, warm, light piano, ukulele, soft bells, gentle strings, whimsical adventure, nostalgic childhood mood, no vocals
```
