# Quy Trình Sản Xuất Video Nhận Biết English (Bài 17 - DGMD-M05)

> **Mã video:** `VIDEO-0963e3` | **Thời lượng:** `25:18` (`1518.30s`) | **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu 100% hình ảnh frame thực tế + phụ đề sạch 203 phân đoạn + kiểm chứng kênh mẫu `HTTP 200`).

---

## 1. Mục tiêu bài học & Phân tích Kênh mẫu (Case Study)

Trong Bài 17 thuộc học phần **DGMD-M05**, giảng viên hướng dẫn quy trình sản xuất dòng video **Giáo dục nhận biết từ vựng Tiếng Anh cho trẻ em (Kids English Vocabulary Recognition)** — một chủ đề kinh điển trên YouTube có thể mở rộng vô hạn sang:
- **Các loài động vật** (*Animals*)
- **Các loại hoa quả, trái cây** (*Fruits & Vegetables*)
- **Các phương tiện giao thông** (*Vehicles & Cars*)
- **Các loài chim, côn trùng, bò sát** (*Birds, Insects, Reptiles*)

### Kênh đối thủ thực tế trên màn hình (`00:00 – 00:32`)
- **Tên kênh:** **Saba study Classes** (`@StudyClasses_sa`) — `341 N người đăng ký`.
- **URL kênh:** `https://www.youtube.com/@StudyClasses_sa` *(Đã kiểm chứng `HTTP 200`)*.
- **Video mẫu phân tích:** *Insects Name in Hindi and English with Pictures | कीड़े मकोड़े के नाम | Pictures Made by AI* (`10:46`), đăng 1 năm trước và đạt **12 triệu lượt xem (12 Tr lượt xem)**.
- **Cấu trúc giữ chân trẻ nhỏ (Retention Loop):** Mỗi từ vựng không chỉ chiếu một bức ảnh tĩnh nhàm chán mà được chia thành 3 pha liên hoàn:
  1. **Pha 1 (5 giây — Kích thích tò mò):** Một bàn tay cầm bút vẽ dần hình ảnh con vật từ nét đầu tiên đến khi hoàn chỉnh trên nền màu tươi sáng.
  2. **Pha 2 (5 giây — Ghi nhớ mặt chữ & Phát âm):** Bàn tay cầm bút tiếp tục viết từng chữ cái tên tiếng Anh của con vật (ví dụ: `LION`), đi kèm giọng đọc phát âm chuẩn lặp lại 2 lần.
  3. **Pha 3 (6 giây — Phần thưởng thị giác):** Chuyển sang đoạn video thực tế 4K sắc nét quay cảnh con vật đó đang hoạt động ngoài tự nhiên (sư tử uống nước, hươu cao cổ ăn lá, gấu trúc ăn tre...) kèm âm thanh sống động.

---

## 2. Tổ hợp Công cụ Sử dụng trong Quy trình

| STT | Công cụ | Vai trò cụ thể trong quy trình | Thông số kỹ thuật cố định |
| :--- | :--- | :--- | :--- |
| 1 | **ChatGPT** | Sinh đồng bộ 10–50 prompt tạo ảnh tĩnh, 10–50 prompt tạo video 6s và lời dẫn mở đầu (Intro Hook) | Giữ nguyên mạch hội thoại để danh sách 10 con vật ở phần ảnh và phần video khớp nhau 100% |
| 2 | **Google Flow (`Nano Banana 2`)** | Tạo bộ ảnh tĩnh con vật sắc nét trên nền trắng tinh khiết | Chế độ: `Image` \| Model: `Nano Banana 2` \| Tỷ lệ: `1:1` \| Số lượng: `x1` |
| 3 | **Grok Imagine (`grok.com/imagine`)** | Tạo bộ video con vật hoạt động hàng ngày ngoài tự nhiên kèm âm thanh thực tế | Chế độ: `Video` \| Thời lượng: `6 giây` \| Tỷ lệ: `16:9` \| Có sẵn Audio môi trường |
| 4 | **Pinterest (`pinterest.com`)** | Tải ảnh PNG/JPG bàn tay cầm bút và video nút bấm Like/Subscribe phông xanh | Từ khóa: `bàn tay cầm bút` (tab Hình ảnh) & `like subscribe phông xanh video` (tab Video) |
| 5 | **CapCut PC** | Thiết kế Intro, dựng **Phôi đầu** (Mặt nạ Cuộn phim + Mặt nạ Hình chữ nhật + Keyframe bàn tay vẽ + Giọng đọc TTS) và nhân bản hàng loạt | Tỷ lệ: `16:9` \| Giọng đọc: `Tiếng Anh -> Người thương ấm áp (Cozy Darling)` \| Thước kẻ: `1 giây/mốc` |
| 6 | **Picsart (`picsart.com`)** | Thiết kế ảnh bìa Thumbnail quy tụ 6–8 con vật nổi bật kèm tiêu đề lớn | Kích thước: `1920 x 1080 px` \| Công cụ: `Gỡ nền (Remove BG)` |

---

## 3. Bộ 3 Câu lệnh Gốc (Master Prompt) & Mẫu Output Thực tế

Toàn bộ câu lệnh được trích xuất chính xác từng chữ từ tài liệu Google Docs hiển thị trên màn hình bài giảng (`00:40`, `02:31` và `06:21`), lưu trữ tại [`assets/docs-dgmd/VIDEO-0963e3/master_prompt.md`](../../assets/docs-dgmd/VIDEO-0963e3/master_prompt.md).

### 3.1. Câu lệnh 1 — Sinh 10 Prompt tạo hình ảnh con vật 1:1 trên nền trắng
```text
- hãy tạo cho tôi 10 prompt để tạo 10 hình ảnh về động vật , thay đổi 10 con vật cho từng prompt , hình ảnh các con vật sắc nét cố định cho 10 prompt , hình ảnh kích thước 1.1 cố định cho các prompt , không cần phông nền cố định cho các prompt , không có bối cảnh chỉ có nền trắng cố định cho các prompt , tỉ lệ con vật bé hơn tỉ lệ khung hình cố định cho các prompt , phong cách thực tế cố định cho các prompt , 10 prompt chi tiết đầy đủ có độ dài như nhau , các prompt phải đầy đủ chi tiết như tôi đã yêu cầu
```
- **Tại sao bắt buộc phải ép "chỉ có nền trắng" và "tỉ lệ con vật bé hơn khung hình"?**
  - Khi đưa ảnh sang CapCut ở Bước 5, học viên chỉ cần bấm **Xóa nền $\rightarrow$ Xóa tự động**. Nhờ nền trắng tuyệt đối và con vật nằm gọn ở 60% khung hình (không bị cắt cụt đuôi hay tai ở mép ảnh), AI của CapCut tách nền sạch 100% không dính bất kỳ mảng cỏ hay bóng đổ nào.
- **Mẫu Prompt tiếng Anh do ChatGPT sinh ra (Prompt 1 – Lion):**
  ```text
  A realistic lion standing naturally, full body visible, perfectly centered, ultra sharp fur details, photorealistic wildlife photography, natural anatomy, detailed facial features, clean white background only, no environment, no shadows, no props, isolated subject, animal occupying about 60% of frame, plenty of white space around the animal, professional studio lighting, high detail, realistic colors, crisp focus, educational animal reference image, square 1:1 aspect ratio, 4K quality, highly detailed, realistic style
  ```

### 3.2. Câu lệnh 2 — Sinh 10 Prompt tạo Video 6 giây trên Grok Imagine (16:9)
```text
- dựa vào 10 prompt để tạo 10 hình ảnh về động vật trên , bạn hãy tạo cho tôi 10 prompt để tạo 10 video , dựa vào 10 prompt tạo 10 con vật trên , sáng tạo cho tôi các con vật đang hoạt động hàng ngày cố định cho các prompt , prompt tạo video 6 giây trên grok cố định cho các prompt , các bối cảnh phù hợp cho các video , các video có kích thước 16.9 cố định cho các prompt , âm thanh của từng video chân thực cố định cho các prompt , 10 prompt chi tiết đầy đủ có độ dài như nhau , các prompt phải đầy đủ chi tiết như tôi đã yêu cầu
```
- **Mẫu Prompt tiếng Anh do ChatGPT sinh ra (Prompt 3 – Giraffe Eating Leaves):**
  ```text
  A realistic giraffe standing beside a tall acacia tree, slowly stretching its neck and eating fresh green leaves, natural chewing motion, occasional blinking and tail movement, highly detailed fur patterns, warm daylight, realistic African grassland background, cinematic wildlife documentary style, camera fixed and stable throughout the entire 6-second video, no zoom, no camera movement, ultra-realistic 4K quality, 16:9 aspect ratio. Audio: gentle leaf rustling, soft chewing sounds, light wind, distant bird calls, no music.
  ```

### 3.3. Câu lệnh 3 — Sinh kịch bản Mở đầu (Intro Hook)
```text
- dựa vào 10 prompt trên tạo hình ảnh và video , bạn hãy tạo cho tôi 1 phần mở đầu để cho các bé nhận biết từ tiếng anh về các con vật , mở đầu gây hook và xin mọi người nhấn like và đăng ký kênh , thu hút người xem đến cuối video , mở đầu ngắn gọn chi tiết
```
- **Câu mở đầu tiếng Anh được giảng viên chọn dùng (`06:54 – 07:05`):**
  > *"Hello kids! Today we're going to meet 10 amazing animals and learn their English names together! Can you guess them all? Don't forget to like and subscribe, and let's start our animal adventure now!"*

---

## 4. Quy trình Dựng Video & Kỹ thuật "Phôi Đầu" (Compound Clip Template) trên CapCut

Đây là phần cốt lõi nhất của bài giảng (`05:50 – 22:32`), giúp biến một quy trình đánh keyframe phức tạp thành một phôi mẫu có thể nhân bản hàng chục con vật trong vài phút:

### Bước 1: Thiết kế đoạn Mở đầu (Intro Hook — `05:50 – 09:13`)
1. Mở **CapCut PC**, tạo dự án mới và thiết lập tỷ lệ khung hình **16:9**.
2. Đưa một tấm nền màu sáng vào timeline, vào mục **Văn bản $\rightarrow$ Thêm văn bản**, dán câu chào tiếng Anh của ChatGPT vào.
3. Chọn tab **Chuyển đổi văn bản thành giọng nói (Text-to-Speech)** $\rightarrow$ Bộ lọc **Tiếng Anh** $\rightarrow$ Chọn giọng nữ **Người thương ấm áp (Cozy Darling)** $\rightarrow$ Nhấn **Bắt đầu đọc**.
4. Chỉnh phông chữ đậm dễ đọc, thêm **Hiệu ứng chữ** và **Hiệu ứng động** để chữ nhảy ra theo giọng đọc.
5. Đưa video nút **Like & Subscribe phông xanh** (tải từ Pinterest) lên lớp trên $\rightarrow$ Vào **Xóa nền $\rightarrow$ Phông xanh (Chroma Key)** $\rightarrow$ Dùng bút chấm vào màu xanh lá để xóa sạch nền, thu nhỏ đặt ở góc dưới.
6. Bôi đen toàn bộ cụm Intro $\rightarrow$ Chuột phải chọn **Tạo clip ghép (Compound Clip)** để khóa gọn đoạn mở đầu.

### Bước 2: Dựng Hiệu ứng "Bàn tay vẽ con vật" (5 giây đầu của Phôi — `09:14 – 12:36`)
1. Kéo tấm nền màu **Xanh dương (Blue background)** xuống timeline để dễ quan sát chi tiết.
2. Kéo hình ảnh tĩnh con vật số 1 (**Sư tử - Lion**, ảnh `1:1` nền trắng tạo từ Google Flow) đặt lên trên nền xanh dương, kéo thời lượng đúng **5 giây**.
3. Chọn ảnh con sư tử $\rightarrow$ Vào **Xóa nền $\rightarrow$ Xóa tự động** để tách riêng con sư tử.
4. Chuyển sang tab **Mặt nạ (Mask)** $\rightarrow$ Chọn kiểu mặt nạ **Cuộn phim (Filmstrip)** $\rightarrow$ Xoay chéo đường cắt mặt nạ:
   - Kéo thanh thời gian về **cuối giây thứ 5**: Đặt 1 **Keyframe** mặt nạ ở trạng thái mở hoàn toàn (hiện 100% con sư tử).
   - Kéo thanh thời gian về **đầu giây thứ 0**: Kéo đường mặt nạ lên góc trên cùng bên trái để che kín con sư tử. Khi bấm Play, con sư tử sẽ hiện dần từ góc trên bên trái xuống góc dưới bên phải trong 5 giây.
5. Đưa ảnh **Bàn tay cầm bút** (đã xóa nền) lên lớp trên cùng, kéo dài **5 giây**:
   - Dùng nút **Đảo ngược / Phản chiếu (Mirror)** trên thanh công cụ để đầu ngòi bút hướng đúng vào vùng con sư tử đang hiện ra.
   - Cắm **5 mốc thước kẻ (Ruler)** cách đều nhau mỗi **1 giây** (`1s, 2s, 3s, 4s, 5s`).
   - Tại tab **Cơ bản (Vị trí)**, bấm dấu thoi **Keyframe** ở giây `0`, sau đó cứ mỗi mốc thước kẻ `1 giây` lại kéo bàn tay dịch chuyển lên – xuống **so le (zíc-zắc)** bám theo mép xuất hiện của con sư tử. Ở giây cuối cùng, kéo bàn tay trượt hẳn ra ngoài khung hình.

### Bước 3: Dựng Hiệu ứng "Bàn tay viết chữ từ vựng" & Giọng đọc (5 giây tiếp theo — `12:37 – 16:50`)
1. Tạo một lớp **Văn bản**, gõ chữ `LION` (chữ in hoa, cỡ lớn, đặt phía trên hoặc cạnh con sư tử), kéo dài **5 giây**.
2. **Thủ thuật mở khóa Mặt nạ cho Văn bản (`13:11 – 14:15`):**
   - Mặc định lớp Văn bản trên CapCut không có tab *Mặt nạ (Mask)*.
   - **Cách xử lý:** Copy lớp chữ `LION` thành **2 lớp chữ giống hệt nhau nằm chồng khít**, bôi đen cả 2 lớp chữ $\rightarrow$ Chuột phải chọn **Tạo clip ghép (Compound Clip)**.
   - Lúc này khối chữ `LION` trở thành một đối tượng Video và xuất hiện tab **Mặt nạ (Mask)**!
3. Chọn khối Clip ghép chữ `LION` $\rightarrow$ Vào **Mặt nạ $\rightarrow$ Hình chữ nhật (Rectangle)**:
   - Ở **cuối giây thứ 5**: Đặt Keyframe mặt nạ bao trọn chữ `LION`.
   - Ở **đầu giây thứ 0**: Kéo thu hẹp mặt nạ về phía bên trái để chữ `LION` hiện dần từng ký tự từ trái sang phải trong 5 giây.
4. Nhân bản lớp **Bàn tay cầm bút** sang đoạn 5 giây này, đánh Keyframe vị trí zíc-zắc mỗi 1 giây đè dọc theo dòng chữ `LION` như đang viết chữ.
5. Tạo giọng đọc phát âm từ `Lion` bằng **Chuyển đổi văn bản thành giọng nói** (giọng *Cozy Darling*), nhân đôi file âm thanh để đọc lặp lại 2 lần (`"Lion... Lion"`).

### Bước 4: Ghép Video Thực tế 6 giây & Đóng gói "Phôi Đầu" (`16:51 – 22:31`)
1. Ngay sau khi bàn tay viết xong chữ `LION` và đọc tên 2 lần, kéo đoạn **Video 6 giây con sư tử uống nước ngoài tự nhiên** (tải từ Grok Imagine, có sẵn âm thanh thực tế) nối vào phía sau.
2. **Đóng gói Phôi đầu (`17:01`):** Bôi đen toàn bộ cụm của con sư tử (từ lúc bàn tay vẽ hình $\rightarrow$ viết chữ $\rightarrow$ đọc tên $\rightarrow$ video 6 giây) $\rightarrow$ Chuột phải chọn **Tạo clip ghép (Compound Clip)**. Đây chính là **Phôi đầu chuẩn**.
3. **Nhân bản siêu tốc cho 10–50 con vật tiếp theo (`17:20 – 22:05`):**
   - Copy **Phôi đầu** dán nối tiếp ra phía sau cho con vật số 2 (`TIGER`), số 3 (`ELEPHANT`), số 4 (`GIRAFFE`)...
   - Nhấp chuột phải vào bản copy $\rightarrow$ Chọn **Hoàn tác clip ghép (Ungroup)**.
   - Giữ nguyên mọi đường Keyframe bàn tay và Mặt nạ: chỉ cần kéo ảnh tĩnh **Con Hổ (Tiger)** thả đè vào lớp ảnh Con Sư Tử, nhấp đúp vào Clip ghép chữ đổi `LION` thành `TIGER`, tạo giọng đọc `Tiger`, và kéo video 6s Con Hổ đè vào video Con Sư Tử!

---

## 5. Thiết kế Ảnh bìa Thumbnail trên Picsart (`22:32 – 25:18`)

1. Truy cập **Picsart** (`picsart.com`), chọn **Bắt đầu thiết kế mới** với kích thước chuẩn YouTube **1920 x 1080 px**.
2. Giữ nền trắng hoặc chọn nền tươi sáng, tải lên **6 đến 8 hình ảnh con vật** (từ bộ ảnh `1:1` đã tạo trên Google Flow).
3. Sử dụng công cụ **Gỡ nền (Remove Background)** trên Picsart (hoặc dùng luôn ảnh nền trắng tùy cách bố trí) để sắp xếp 8 con vật bao quanh khung hình.
4. Thêm dòng tiêu đề tiếng Anh nổi bật ở trung tâm (ví dụ: **`50 ANIMALS NAME`** hoặc **`LEARN ANIMALS IN ENGLISH`**) để kích thích tỷ lệ nhấp chuột (CTR) của phụ huynh và trẻ nhỏ.

---

## 6. Bảng Mốc Thời Gian Chi Tiết (Key Timestamps)

| Thời gian | Giây (`seconds`) | Nội dung chi tiết trong bài giảng |
| :--- | :---: | :--- |
| `00:00` | `0s` | Phân tích kênh mẫu `@StudyClasses_sa` (video 10 phút đạt 12 triệu views) & Tổng quan ngách nhận biết từ vựng Tiếng Anh |
| `00:40` | `40s` | Câu lệnh số 1: Tạo 10 Prompt hình ảnh con vật `1:1` trên nền trắng bằng ChatGPT & Render trên Google Flow (`Nano Banana 2`) |
| `02:31` | `151s` | Câu lệnh số 2: Tạo 10 Prompt video con vật hoạt động hàng ngày & Render video 6 giây (`16:9`) kèm âm thanh trên Grok Imagine |
| `04:17` | `257s` | Tìm kiếm nguyên liệu `bàn tay cầm bút` và video nút `Like Subscribe phông xanh` trên Pinterest |
| `05:50` | `350s` | Câu lệnh số 3: Tạo lời dẫn Intro Hook, chuyển văn bản thành giọng nói tiếng Anh (`Cozy Darling`) & Xóa phông xanh trên CapCut |
| `09:14` | `554s` | Dựng Phôi đầu phần 1 (`5s`): Xóa nền con sư tử, đánh Keyframe Mặt nạ Cuộn phim & Bàn tay cầm bút vẽ so le theo thước kẻ 1 giây |
| `12:37` | `757s` | Dựng Phôi đầu phần 2 (`5s`): Nhân đôi chữ `LION` thành Clip ghép để mở Mặt nạ Hình chữ nhật, đánh Keyframe tay viết chữ & Giọng đọc từ vựng |
| `17:01` | `1021s` | Đóng gói Phôi đầu thành Clip ghép & Kỹ thuật nhân bản, hoàn tác thay thế nguyên liệu siêu tốc cho `Tiger`, `Elephant`, `Giraffe` |
| `22:32` | `1352s` | Thiết kế ảnh bìa Thumbnail chuẩn `1920x1080` quy tụ 8–50 con vật tách nền bắt mắt trên Picsart |
