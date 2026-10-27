# Bài 24 (`DGMD-M08`): Quy Trình Sản Xuất Video Nhạc Chầu Văn (`VIDEO-f2ebfb`)

> **Mã định danh bài học:** `VIDEO-f2ebfb`
> **Học phần:** `DGMD-M08` — Bài 24
> **Giảng viên:** Đại Gia Mang Dép (Văn Thế Web)
> **Thời lượng:** `13:16` (`796.0s` — 120 phân đoạn phụ đề chuẩn hóa `GROUNDED_VERIFIED`)
> **Tài liệu Prompt đính kèm:** [`assets/docs-dgmd/VIDEO-f2ebfb/master_prompt.md`](../../assets/docs-dgmd/VIDEO-f2ebfb/master_prompt.md)

---

## 1. Luận Điểm Cốt Lõi & Phân Tích Kênh Mẫu Thực Chiến (`00:00` – `00:38`)

Bài học hướng dẫn quy trình khép kín để sản xuất **MV Nhạc Chầu Văn thời lượng dài (`16:9`)** bằng AI với độ đồng nhất nhân vật 100% xuyên suốt 30 phân cảnh, phục vụ nhóm khán giả yêu thích văn hóa tâm linh và tín ngưỡng thờ Mẫu tại Việt Nam.

### Chiến lược phân tầng cho học viên
- **Người mới bắt đầu:** Nên ưu tiên cắt hoặc sản xuất các đoạn video ngắn (Shorts/Reels) để thuật toán đề xuất nhanh, kéo lượng người xem và người đăng ký ban đầu.
- **Người làm chuyên nghiệp (Pro):** Tập trung sản xuất các video dài khung ngang **`16:9`** (từ 8 phút đến hơn 30 phút) để tối đa hóa chỉ số **RPM (Doanh thu trên mỗi 1.000 lượt xem)** ngay khi kênh bật kiếm tiền YouTube.

### Case Study kênh YouTube đối chứng trên màn hình (`Phật Giáo Làng Sen`)
- **Đường dẫn kênh:** **`Phật Giáo Làng Sen`** (`https://www.youtube.com/@PhatGiaoLangSen` — `6,65 N người đăng ký`, đã xác minh `HTTP 200 ACTIVE`).
- **Số liệu thực tế trên màn hình bài giảng:**
  - *Văn Cô Bơ Thoải Phủ - Bản Chuẩn Cảm Xúc Nhất - Phật Giáo Làng Sen* (`8:15`) — đạt **897.000 lượt xem** sau 2 tháng đăng tải.
  - *VĂN ÔNG HOÀNG BẢY BẢO HÀ - Bản Chuẩn Đầy Đủ Nhất | Ban Lộc Tài, Bình An* (`30:43`) — đạt **545.000 lượt xem** sau 2 tháng.
  - *Hầu Đồng Cô Đôi Thượng Ngàn - Hát Văn Cực Hay - BẢN CHUẨN CÓ CHỮ* (`7:30`) — đạt **365.000 lượt xem** sau 2 tháng.
  - *CHẦU LỤC CUNG NƯƠNG - Tuyệt Phẩm Hát Văn - Mế Lục Ngàn Tối Linh* (`28:28`) — đạt **226.000 lượt xem** sau 2 tháng.

---

## 2. Tổ Hợp Công Cụ Trong Dây Chuyền Sản Xuất (`00:39` – `01:45`)

| Thứ tự | Công cụ sử dụng | Vai trò trong quy trình sản xuất Nhạc Chầu Văn | Cấu hình kỹ thuật bắt buộc |
| :--- | :--- | :--- | :--- |
| **1** | **YouTube (`Bản chép lời`)** | Khai thác lời bài hát gốc từ các bản Chầu Văn triệu view (*Văn Cô Bơ Thoải Phủ*, *Cô Đôi Thượng Ngàn*) | Mở mục `Hiện bản chép lời` ở góc dưới mô tả video |
| **2** | **ChatGPT** | Đóng vai Chuyên gia âm nhạc Chầu Văn viết lại Lyrics mới + `Style Prompt`; tách nền ảnh tham chiếu; sinh 30 cặp Prompt Ảnh/Video & thiết kế Thumbnail | Tách thành 2 tab riêng (Tab 1: Lyrics & 30 Prompts; Tab 2: Tách nền nhân vật `9:16`) |
| **3** | **Suno AI** | Phối khí đàn nguyệt, sáo trúc, trống phách và hát tự động toàn bộ bài Chầu Văn mới | Chế độ `Advanced`, tải file âm thanh chuẩn **`WAV`** |
| **4** | **Pinterest** | Tìm kiếm hình ảnh mẫu trang phục cô đồng / thanh đồng Chầu Văn | Từ khóa tìm kiếm: `chầu văn` |
| **5** | **Grok Imagine (`Grok`)** | Tạo 30 bức ảnh bối cảnh biểu diễn `16:9` từ ảnh tham chiếu gốc & chuyển thành 30 clip `6 giây` | Ảnh: `Image 16:9`; Video: `720p`, thời lượng `6s` |
| **6** | **CapCut PC** | Ghép nối các cảnh video `6s`, tắt âm gốc của clip và lồng file nhạc `WAV` từ Suno AI | Kéo thanh âm lượng video gốc về `0`, xuất file `1080p` |

---

## 3. Quy Trình Thực Thi Chi Tiết Từng Bước (SOP 5 Bước Chuẩn Hóa)

### Bước 1: Thiết lập Chuyên gia Nhạc Chầu Văn trên ChatGPT & Khai thác Bản chép lời YouTube (`00:39` – `02:56`)
1. **Huấn luyện ChatGPT ghi nhớ quy tắc viết nhạc Chầu Văn:**
   - Mở tài liệu Google Docs của bài học (hoặc dùng phím tắt **`Alt + Shift + S`** chụp ảnh màn hình câu lệnh yêu cầu đưa vào ChatGPT để trích xuất chữ), gửi câu lệnh sau để ChatGPT tạo ra một Prompt hệ thống và ghi nhớ:
     ```text
     Bạn hãy đóng vai thành 1 nhà chuyên gia âm nhạc về dòng nhạc chầu văn việt nam , bây giờ hãy tạo cho tôi 1 câu lệnh , khi tôi gửi 1 lyrics bài hát bất kỳ , bạn hãy phân tích về lyrics bài hát đó , sau đó viết lại cho tôi 1 lyrics bài hát đầy đủ , và viết 1 prompt styles để tạo lại 1 bài hát chầu văn bám sát bài hát gốc , yêu cầu sáng tạo chi tiết , hãy viết cho tôi 1 câu lệnh gửi cho chatgpt ghi nhớ , và chatgpt lưu lại , tôi chỉ cần gửi lyrics nên và bạn sẽ trả về kết quả , viết 1 câu lệnh liền mạch các mục xuống dòng , cho tôi
     ```
   - Sao chép đoạn câu lệnh liền mạch mà ChatGPT vừa sinh ra, dán ngược lại vào khung chat và nhấn **Enter** để ChatGPT xác nhận đã lưu quy trình làm việc.
2. **Lấy lời bài hát mẫu từ YouTube:**
   - Truy cập YouTube, mở một video Chầu Văn có lượt xem cao (ví dụ bài *Văn Cô Bơ Thoải Phủ* — `897K view` trên kênh `Phật Giáo Làng Sen`).
   - Cuộn xuống phần mô tả video, bấm nút **`Hiện bản chép lời` (Show transcript)**.
   - Khi bảng chép lời hiện ra ở cột bên phải màn hình, bôi đen và sao chép toàn bộ nội dung lời hát từ đầu đến cuối rồi dán thẳng vào khung chat **ChatGPT** đã lưu lệnh ở trên.

### Bước 2: Phối khí và tạo bài hát Chầu Văn mới trên Suno AI (`02:57` – `03:44`)
1. Dựa trên bản chép lời vừa gửi, **ChatGPT** sẽ tự động phân tích và trả về một bài hát Chầu Văn mới hoàn toàn (ví dụ: *Hàn Sơn Khói Hương*, có chia rõ cấu trúc `[MỞ ĐẦU]`, `[VERSE 1]`, `[ĐIỆP KHÚC]`, `[KẾT]`) kèm đoạn **`[STYLE PROMPT]`** tiếng Anh chuyên biệt.
2. Mở **Suno AI (`suno.com/create`)**, chuyển sang chế độ **`Advanced` (Trình độ cao)**:
   - Sao chép toàn bộ phần lời bài hát từ đoạn mở đầu đến đoạn kết dán vào ô **`Lyrics`**.
   - Sao chép đoạn **`[STYLE PROMPT]`** dán vào ô **`Styles`**:
     ```text
     Vietnamese Chau Van traditional spiritual music, authentic Vietnamese folk ceremonial singing, sacred temple atmosphere, Hau Dong ritual energy, emotional female Vietnamese vocal with traditional ornamentation and luyến láy, đàn nguyệt lead melody, bamboo flute, traditional Vietnamese drums, wooden clappers, ceremonial percussion, hypnotic rhythmic chanting, deep spiritual emotion, cinematic ethnic fusion, dramatic build-up, powerful chorus, mystical river atmosphere, ancient Vietnamese temple ambience, emotional storytelling vocal, rich folk textures, spiritual sacred energy, clean professional mix and master, dynamic ritual transitions, emotional crescendo, authentic Northern Vietnam Chau Van performance style, divine feminine spiritual atmosphere, immersive cultural soundscape, haunting melodic progression, traditional Vietnamese spiritual folk music.
     ```
   - Nhấn nút **`Create`** để Suno AI tiến hành tạo bài hát trong lúc chúng ta chuyển sang bước làm hình ảnh và video.

### Bước 3: Tạo Hình ảnh nhân vật tham chiếu đồng nhất 100% từ Pinterest & ChatGPT (`03:45` – `04:50`)
1. Truy cập **Pinterest**, gõ từ khóa **`chầu văn`** để tìm các hình ảnh nghệ sĩ/thanh đồng mặc trang phục khăn chầu áo ngự truyền thống.
2. Chọn một bức ảnh có thần thái và màu sắc trang phục phù hợp với bài hát $\rightarrow$ nhấp chuột phải chọn **Sao chép hình ảnh**.
3. Mở một **tab ChatGPT mới**, dán bức ảnh vừa lấy từ Pinterest vào kèm câu lệnh tách nền chuẩn:
   ```text
   Hãy tạo lại hình ảnh này cho tôi , hình ảnh 9.16 , đầy đủ chi tiết nhân vật nữ trong hình ảnh , nhân vật bé hơn tỉ lệ khung , hình ảnh sắc nét , nhân vật đứng thẳng , không cần phông nền , xóa bỏ tất cả phông nền từ hình ảnh cũ .

   Đặt tỷ lệ khung hình thành 9:16
   ```
4. Khi ChatGPT xuất ra bức ảnh nhân vật nữ đứng thẳng trên nền đen sạch sẽ (giữ nguyên 100% gương mặt, khăn chầu và áo dài thêu), nhấn **Tải xuống**. Đây chính là **Hình ảnh nhân vật tham chiếu gốc** giúp giữ đồng nhất nhân vật cho cả 30 cảnh MV.

### Bước 4: Sinh 30 cặp Prompt Ảnh/Video trên ChatGPT & Render hàng loạt trên Grok Imagine (`04:51` – `09:56`)
1. **Tạo 30 cặp Prompt trên ChatGPT:**
   - Quay trở lại **tab ChatGPT đầu tiên** (tab vừa dùng để viết lời bài hát Chầu Văn), bấm dấu **`+`** tải **Hình ảnh nhân vật tham chiếu gốc** lên và dán câu lệnh:
     ```text
     dựa trên bài hát lyrics mà bạn đã tạo lại , hãy tạo cho tôi 30 prompt khi tôi tải hình ảnh này nên grok , prompt sẽ tạo ra 1 hình ảnh , nhân vật này liên quan đến 1 đoạn trong bài hát , chia đều cho 30 prompt , sáng tạo các góc quay liên quan đến nhạc chầu văn , yêu cầu prompt tạo ảnh chi tiết , các prompt tạo góc quay liên tục thay đổi , sáng tạo nhân vật cầm các đồ vật liên quan đến biểu diễn chầu văn , sau đó dưới mỗi prompt tạo hình ảnh , bạn hãy tạo cho tôi 1 prompt để tạo ra video , yêu cầu prompt chi tiết để tạo dựa vào hình ảnh có sẵn , để tạo ra video nhân vật đang biểu diễn dựa trên hình ảnh , sáng tạo các quay liên tục cho tôi , biểu diễn chi tiết cho tôi , sáng tạo đầy đủ cho 30 prompt chi tiết tạo ảnh và 30 prompt chi tiết để tạo video , các câu prompt phải đầy đủ ký tự hay từ như nhau , bám sát và tạo luôn prompt cho tôi , tất cả từ prompt tạo ảnh và prompt tạo video đều là kích thước 16.9 yêu cầu ghi nhớ .
     ```
   - ChatGPT sẽ trả về từng mục rõ ràng (ví dụ: `PROMPT 01 — MỞ ĐẦU KHÓI HƯƠNG HÀN SƠN`), bên dưới gồm **`PROMPT TẠO ẢNH (16:9)`** và **`PROMPT TẠO VIDEO (16:9)`**. Nhập **`tiếp tục`** để lấy trọn bộ từ Prompt 1 đến Prompt 30.
2. **Tạo các cảnh ảnh `16:9` trên Grok Imagine (`grok.com/imagine`):**
   - Chọn chế độ **`Hình ảnh (Image)`**, thiết lập tỷ lệ khung hình **`16:9` (Màn hình rộng)**.
   - Tải **Hình ảnh nhân vật tham chiếu gốc** lên, dán **`PROMPT TẠO ẢNH (16:9)`** của Cảnh 1 vào và nhấn **Enter**.
   - **Quy tắc bắt buộc từ Cảnh 2 trở đi:** Sau khi tạo xong Cảnh 1, phải **quay trở về chọn lại bức Hình ảnh nhân vật tham chiếu gốc** rồi mới dán tiếp Prompt tạo ảnh của Cảnh 2, Cảnh 3... để mọi cảnh đều giữ nguyên một khuôn mặt và trang phục duy nhất.
3. **Chuyển từng cảnh ảnh thành Video `6 giây` trên Grok Imagine:**
   - Trong lúc chờ các cảnh sau tạo ảnh, bấm vào bức ảnh Cảnh 1 đã hoàn thành, chuyển sang chế độ **`Video`**, chọn độ phân giải **`720p`** và thời lượng **`6s`** (6 giây giúp chuyển động biểu diễn mượt và tự nhiên hơn so với 10 giây).
   - Sao chép đúng **`PROMPT TẠO VIDEO (16:9)`** của Cảnh 1 dán vào và bấm **Tạo video**. Lặp lại tuần tự cho các cảnh tiếp theo (ảnh tạo từ Prompt số mấy thì phải dùng đúng Prompt tạo video của số đó) rồi tải toàn bộ các clip MP4 về máy.

### Bước 5: Tải nhạc `WAV`, ghép hậu kỳ trên CapCut PC & Tạo Thumbnail 16:9 (`09:57` – `13:16`)
1. **Tải nhạc chất lượng cao từ Suno AI:** Quay lại tab **Suno AI**, chọn bản phối ưng ý nhất $\rightarrow$ nhấn **Tải xuống (Download)** $\rightarrow$ chọn định dạng âm thanh không nén **`WAV`** để đảm bảo chất âm đàn nguyệt và giọng hát đạt độ trong trẻo chuyên nghiệp.
2. **Ghép video và nhạc trên CapCut PC:**
   - Mở **CapCut PC**, nhập toàn bộ các clip video đã tải từ Grok và file nhạc `.wav` vào dự án, kéo tất cả xuống timeline.
   - **Thao tác bắt buộc:** Bôi đen toàn bộ các clip video trên timeline $\rightarrow$ vào tab **Âm thanh** $\rightarrow$ kéo thanh **Âm lượng về `0`** (tắt hoàn toàn tiếng động gốc của các clip Grok) để chỉ giữ lại duy nhất tiếng nhạc Chầu Văn từ file `WAV`.
   - Sắp xếp hoặc nhân bản nối tiếp các cảnh biểu diễn khớp với chiều dài bài hát rồi xuất video.
3. **Thiết kế ảnh bìa Thumbnail `16:9` trên ChatGPT:**
   - Sao chép một bức ảnh cảnh biểu diễn đẹp nhất vừa tạo, dán vào tab ChatGPT chứa lời bài hát kèm câu lệnh:
     ```text
     Dựa vào lyrics trên hãy thiết kế cho toi 1 hình ảnh thumbnail , cho bài hát trên , sáng tạo cho hình ảnh gốc này mà tôi gửi , thiết kế trên hình ảnh to rõ ràng có điểm nhấn , có tên bài hát trên hình ảnh , sáng tạo hình ảnh thumbnail 16.9 , hình ảnh thumbnail nổi bật

     Đặt tỷ lệ khung hình thành 16:9
     ```
   - Tải bức ảnh Thumbnail `16:9` có chữ tiêu đề nổi bật về máy và tiến hành đăng tải video lên kênh YouTube bằng **máy tính (PC)**.

---

## 4. Mốc Thời Gian Chi Tiết (Key Timestamps)

- **`00:00`** (`0s`) — Mở đầu & Chiến lược kênh Nhạc Chầu Văn: Người mới làm video ngắn kéo view, người Pro làm video dài `16:9` tăng RPM (Case Study kênh `Phật Giáo Làng Sen` đạt 897K view).
- **`00:39`** (`39s`) — Bước 1 trên `ChatGPT`: Nạp câu lệnh đóng vai Chuyên gia âm nhạc Chầu Văn Việt Nam để phân tích lyrics gốc, viết lại lời mới và xuất `Style Prompt` cho `Suno AI`.
- **`01:46`** (`106s`) — Bước 2 trên `YouTube`: Mở video Chầu Văn 897.000 view (*Văn Cô Bơ Thoải Phủ*), bật `Hiện bản chép lời` ở góc phải để sao chép toàn bộ lyrics gốc.
- **`02:33`** (`153s`) — Bước 3 trên `ChatGPT` & `Suno AI`: Dán bản chép lời vào ChatGPT để nhận bài hát mới (*Hàn Sơn Khói Hương*) kèm `Style Prompt`, sau đó đưa sang `Suno AI` tạo nhạc.
- **`03:45`** (`225s`) — Bước 4 trên `Pinterest` & `ChatGPT`: Tìm ảnh trang phục Chầu Văn trên Pinterest, đưa vào ChatGPT kèm lệnh tách nền `9:16` tạo `Hình ảnh nhân vật tham chiếu` đồng nhất 100%.
- **`05:05`** (`305s`) — Bước 5 trên `ChatGPT`: Gửi ảnh nhân vật tham chiếu kèm câu lệnh sinh tự động `30 Prompt tạo ảnh (16:9)` và `30 Prompt tạo video (16:9)` bám sát từng câu hát.
- **`06:52`** (`412s`) — Bước 6 trên `Grok Imagine` (Chế độ `Image`): Tải ảnh nhân vật tham chiếu gốc lên và dán lần lượt các Prompt tạo ảnh tỷ lệ `16:9`.
- **`07:53`** (`473s`) — Bước 7 trên `Grok Imagine` (Chế độ `Video`): Dán Prompt tạo video tương ứng với từng cảnh ảnh ở độ phân giải `720p`, thời lượng `6 giây`.
- **`09:57`** (`597s`) — Bước 8 trên `Suno AI` & `CapCut PC`: Tải nhạc chất lượng `WAV`, đưa các cảnh video vào `CapCut PC`, tắt toàn bộ âm lượng gốc của clip và ghép khớp với file nhạc.
- **`12:00`** (`720s`) — Bước 9 trên `ChatGPT`: Dùng ảnh nhân vật kèm câu lệnh thiết kế `Thumbnail 16:9` có tiêu đề bài hát nổi bật để đăng YouTube bằng máy tính.

---

## 5. Các Lỗi Phải Tránh (Avoid Flags)

1. **Lỗi trượt ngoại hình nhân vật do không quay về ảnh tham chiếu gốc:** Khi tạo các cảnh ảnh từ cảnh thứ 2 trở đi trên Grok Imagine, tuyệt đối không lấy bức ảnh bối cảnh vừa sinh ra để tạo tiếp mà bắt buộc phải quay trở về chọn lại bức **Hình ảnh nhân vật tham chiếu gốc** đã tách nền nhằm giữ độ nhất quán khuôn mặt và trang phục 100%.
2. **Lỗi dán nhầm Prompt tạo ảnh sang mục tạo Video:** Không được dán Prompt tạo ảnh vào chế độ tạo Video trên Grok Imagine và phải kiểm tra đúng bức ảnh được sinh ra từ Prompt số mấy thì dán đúng Prompt tạo Video của số đó.
3. **Lỗi quên tắt âm thanh gốc của các clip Grok khi dựng trên CapCut:** Khi tải nhạc từ Suno AI phải chọn định dạng chuẩn **`WAV`**; đồng thời khi đưa các clip video từ Grok vào CapCut PC bắt buộc phải kéo âm lượng gốc của toàn bộ clip về `0` để tránh tạp âm đè lên tiếng hát Chầu Văn.
4. **Lỗi dùng thẳng ảnh Pinterest chưa xóa nền làm ảnh tham chiếu:** Không sử dụng nguyên xi ảnh chụp từ Pinterest làm ảnh tham chiếu ngay mà bỏ qua bước yêu cầu ChatGPT xóa bỏ toàn bộ phông nền cũ, vì phông nền tạp của ảnh gốc sẽ làm nhiễu bối cảnh đền phủ khi render trên Grok.
