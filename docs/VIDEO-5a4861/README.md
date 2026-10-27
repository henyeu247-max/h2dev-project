# Quy Trình Sản Xuất Page Triệu View

> **SKU:** `VIDEO-5a4861` · **Bài học:** Bài 22 (Chương `DGMD-M07` — Combo Quy Trình Sản Xuất Facebook 1)  
> **Thời lượng:** `17:41` (`1061.62s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Xây Dựng Fanpage Triệu View — Video Thử Thách Dừng Hình (Pause Challenge)` · **Thị trường:** `🇻🇳 Việt Nam & 🌍 Toàn Cầu (Facebook Reels)`  
> **Bài học gốc:** [Mở trên Đại Gia Mang Dép Academy](https://daigiamangdep.com/learn/study/quy-trinh-san-xuat-page-trieu-view) · **Bản ghi phụ đề:** [`video/VIDEO-5a4861/transcript.txt`](../../video/VIDEO-5a4861/transcript.txt) · **Tài liệu Prompt gốc:** [`assets/docs-dgmd/VIDEO-5a4861/master_prompt.md`](../../assets/docs-dgmd/VIDEO-5a4861/master_prompt.md)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng bóc tách trực tiếp mô hình **Fanpage Facebook Reels tương tác siêu khủng thông qua trò chơi "Thử thách dừng hình khớp khung viền" (Pause Challenge)** từ Page mẫu quốc tế **Mohamed Boukrine** (`facebook.com/mohamed.boukrine.2025/reels/` — đạt **3,1 triệu người theo dõi**, các video Reels ghim trên đầu trang đạt **56 triệu view**, **35 triệu view**, **13 triệu view**, và các video mới đăng 15 giờ đạt ngay `100K – 385K views`).

Cốt lõi của định dạng này nằm ở đòn bẩy thuật toán: một cụm vật thể (ví dụ: **1 con trâu + 3 bó rơm**) bay lắc lư qua lại cực nhanh (mỗi `10 frame` = $1/3$ giây) trên một **khung viền nét đỏ cố định**, kèm giọng đọc thách thức người xem bấm dừng màn hình đúng khoảnh khắc vật thể khớp vào khung viền (chỉ xuất hiện thoáng qua $< 0.5$ giây tại mốc `05:15`) rồi chụp ảnh màn hình gửi xuống phần bình luận. Quy trình sản xuất chỉ tốn vài phút với nguyên liệu miễn phí từ `Pinterest`, thiết kế 3 lớp ảnh trên `Picsart Pro`, nhân bản lời kêu gọi đa ngôn ngữ bằng `ChatGPT` và copy-paste chuỗi Keyframe trên `CapCut PC`.

---

## 2. Bảng Phân Tích Case Study & Kiến Trúc 3 Lớp Ảnh Trên Màn Hình (Visual Frame Evidence)

### 2.1. Phân tích Fanpage Facebook mẫu `Mohamed Boukrine` (`00:00 – 01:08` & `07:17`)

| Hạng mục | Số liệu & Bằng chứng hiển thị trực tiếp trên màn hình |
| :--- | :--- |
| **Tên Fanpage mẫu** | **Mohamed Boukrine** (`facebook.com/mohamed.boukrine.2025/reels/` — tích xanh) |
| **Quy mô người theo dõi** | **3,1 triệu người theo dõi** · `1 đang theo dõi` · Bio: `challenge 🎉🎉` · Hạng mục: *Người tạo thước phim* |
| **Hiệu suất 3 Video Ghim** | • Video ghim 1 (Con gà + 3 quả trứng): **56 triệu view**<br>• Video ghim 2 (Cây ăn quả + 3 trái tím): **35 triệu view**<br>• Video ghim 3 (Chú chó + 3 đùi thịt): **13 triệu view** |
| **Hiệu suất Video thường** | Các video liên tiếp đạt `100K` (sau 15 giờ), `153K`, `141K`, `266K`, `107K`, `265K`, `114K`, `385K`, `226K`, `122K` views |
| **Video mẫu bóc tách (`07:17`)** | URL: `facebook.com/reel/975959452027269` · Caption: `Impossible ❎⏸️` · Tương tác: **242K lượt thích**, **22,5K bình luận**, **2,1K chia sẻ** |

### 2.2. Bảng kiến trúc 3 Lớp Ảnh (`1080 x 1920`) thiết kế trên `Picsart Pro` (`03:22 – 07:16`)

| Thứ tự Lớp | Tên file xuất từ Picsart | Quy trình thao tác trên `Picsart Pro` (`picsart.com/create/editor`) | Cách xử lý khi đưa vào `CapCut PC` |
| :-: | :--- | :--- | :--- |
| **Lớp 1 (Trên cùng)** | `Untitled Project.png`<br>*(Vật thể di chuyển)* | Đổi cỡ `1080 x 1920` $\rightarrow$ Xóa nền trắng để hiện nền caro răng cưa $\rightarrow$ Tải ảnh **Con trâu** và **Bó rơm** lên $\rightarrow$ Bấm **Gỡ nền (Remove BG)** $\rightarrow$ Xếp 1 con trâu ở trên + 3 bó rơm dọc ở dưới $\rightarrow$ Xuất PNG trong suốt. | Đặt ở **Track 3 (Trên cùng)** $\rightarrow$ Gắn chuỗi **Keyframe** vị trí & góc xoay lắc qua lại trái/phải mỗi `10 frame`. |
| **Lớp 2 (Ở giữa)** | `Untitled Project (1).png`<br>*(Khung viền nét đỏ)* | Đổ nền trắng vào thiết kế Lớp 1 rồi tải về $\rightarrow$ Xóa canvas, tải lại ảnh nền trắng đó lên $\rightarrow$ Bấm **Gỡ nền** $\rightarrow$ Chọn **Cục tẩy (Erase)** $\rightarrow$ Bấm **Đảo ngược (Invert)** $\rightarrow$ Bấm **Áp dụng** $\rightarrow$ Vào **Chỉnh sửa (Edit) > Nét (Stroke)** chọn **Màu đỏ**, cỡ **`6`** $\rightarrow$ Xuất ảnh. | Đặt ở **Track 2 (Ở giữa)** $\rightarrow$ Vào **Video > Cơ bản > Xóa nền > Xóa tự động** để khử sạch nền trắng, chỉ giữ lại đường viền đỏ. |
| **Lớp 3 (Dưới cùng)** | `Untitled Project (1).jpg`<br>*(Phông nền cảnh quan)* | Chọn màu nền tím hồng pastel dịu mắt $\rightarrow$ Tải ảnh **Cánh rừng cây** lên, kéo phủ 1/3 phía trên khung hình $\rightarrow$ Xuất ảnh nền. | Đặt ở **Track 1 (Dưới cùng)** làm lớp nền tĩnh xuyên suốt video. |

---

## 3. Bộ Master Prompt & Kịch Bản Song Ngữ Trích Xuất Từ Màn Hình (`07:17 – 10:49`)

Toàn bộ câu lệnh và bảng 10 kịch bản song ngữ Việt – Anh đã được lưu trữ đầy đủ tại [`assets/docs-dgmd/VIDEO-5a4861/master_prompt.md`](../../assets/docs-dgmd/VIDEO-5a4861/master_prompt.md):

### 3.1. Quy trình bóc lời thoại gốc từ Reels đối thủ (`07:17 – 09:16`)
1. Mở video Reels của `Mohamed Boukrine` trên trình duyệt **Cốc Cốc**, bấm nút tải trên thanh nổi và chọn tải riêng định dạng **Audio (`Impossible .mp3`)**.
2. Đưa file `Impossible .mp3` vào `CapCut PC` $\rightarrow$ chọn **Văn bản (Text)** $\rightarrow$ **Phụ đề tự động (Auto Captions)** $\rightarrow$ bật **Dịch phụ đề** từ Tiếng Anh sang **Tiếng Việt** $\rightarrow$ nhấn **Tạo**.
3. Gom 3 dòng phụ đề dịch được thành 1 câu hoàn chỉnh rồi đưa sang `ChatGPT`.

### 3.2. Câu lệnh Prompt gõ trực tiếp trên `ChatGPT` (`09:17 – 10:15`)
```text
một trong những thách thức khó khăn nhất trên thế giới , Tôi thách bạn dừng bức tranh lại , nếu bạn có thể dừng nó, hãy chụp ảnh màn hình và gửi cho chúng tôi , hãy tạo cho tôi 10 câu lại , yêu cầu bám sát câu nói trên , 1 bên là 10 câu bằng tiếng việt , 1 bên là 10 câu bằng tiếng anh
```

### 3.3. Kịch bản đầu ra hiển thị trực tiếp trên màn hình ChatGPT (`10:18`)
- **Câu 1 (Sử dụng trực tiếp trong bài để tạo TTS giọng `Thanh niên tự tin`):**
  - **Tiếng Việt:** *"Đây là một trong những thử thách khó nhất thế giới. Tôi thách bạn dừng được bức tranh này! Nếu làm được, hãy chụp ảnh màn hình và gửi cho chúng tôi."*
  - **Tiếng Anh:** *"This is one of the hardest challenges in the world. I challenge you to stop this picture! If you can do it, take a screenshot and send it to us."*
- **Câu 2:**
  - **Tiếng Việt:** *"Một trong những thử thách khó nhất đang chờ bạn. Bạn có thể dừng bức tranh này lại không? Hãy chụp màn hình và gửi cho chúng tôi nếu bạn thành công."*
  - **Tiếng Anh:** *"One of the world's toughest challenges is waiting for you. Can you stop this picture? Take a screenshot and send it to us if you succeed."*
- **Câu 3:**
  - **Tiếng Việt:** *"Đây được xem là một trong những thử thách khó nhất thế giới. Hãy thử dừng bức tranh lại, chụp màn hình và gửi kết quả cho chúng tôi."*
  - **Tiếng Anh:** *"This is considered one of the most difficult challenges in the world. Try to stop the picture, take a screenshot, and send us your result."*
- **Câu 4:**
  - **Tiếng Việt:** *"Tôi cá rằng bạn không thể dừng bức tranh này đúng lúc. Nếu làm được, hãy nhanh chóng chụp màn hình và gửi cho chúng tôi xem."*
  - **Tiếng Anh:** *"I bet you can't stop this picture at the right moment. If you can, quickly take a screenshot and send it to us."*

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Mở đầu & Phân tích Fanpage mẫu *Mohamed Boukrine* (`3,1 triệu follow`, Reels ghim đạt `56 triệu` & `35 triệu view` nhờ thử thách dừng hình)
- **`01:09`** — Bước 1 trên `Pinterest`: Tìm kiếm và tải 3 nguyên liệu hình ảnh miễn phí (*Con trâu, Bó rơm vàng, Cánh rừng cây*)
- **`03:22`** — Bước 2 trên `Picsart Pro`: Tạo khung dọc `1080x1920`, xóa nền trắng, ghép 1 con trâu + 3 bó rơm và `Gỡ nền` xuất file PNG (Lớp 1)
- **`04:46`** — Bước 3 trên `Picsart Pro`: Đổ nền trắng tải về, mở lại bấm `Gỡ nền` $\rightarrow$ `Cục tẩy` $\rightarrow$ `Đảo ngược` $\rightarrow$ `Nét (Stroke)` màu đỏ cỡ `6` tạo viền (Lớp 2)
- **`06:21`** — Bước 4 trên `Picsart Pro`: Chọn màu nền tím nhạt kết hợp ghép ảnh cánh rừng ở phía trên để xuất file Phông nền (Lớp 3)
- **`07:17`** — Bước 5 trên `Cốc Cốc` & `CapCut PC`: Tải riêng file âm thanh từ Reels đối thủ, bật `Phụ đề tự động` và dịch sang Tiếng Việt
- **`09:17`** — Bước 6 trên `ChatGPT`: Dùng Prompt viết lại 10 câu thử thách dừng hình song ngữ Việt – Anh để dành làm 10 video
- **`10:29`** — Bước 7 trên `CapCut PC`: Dán câu kêu gọi vào Văn bản, bật `Chuyển đổi văn bản thành giọng nói` (Giọng *Thanh niên tự tin*)
- **`11:13`** — Bước 8 trên `CapCut PC`: Xếp chồng 3 lớp ảnh, dùng tính năng `Xóa nền tự động` để tách riêng đường viền đỏ trên nền rừng
- **`12:55`** — Bước 9 trên `CapCut PC`: Đặt Keyframe lắc Trái - Phải cách nhau mỗi `10 frame` (`Ctrl+C`/`Ctrl+V`) và chèn 1 điểm khớp tâm ở `05:15`

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Giải mã cơ chế viral của Fanpage mẫu Mohamed Boukrine (`3,1 triệu người theo dõi`, video ghim đạt `56M`, `35M`, `13M view`):** Kích thích người xem bấm dừng màn hình (*Pause Challenge*) cho vật thể khớp vào khung viền rồi chụp màn hình bình luận (`22,5K bình luận` trên 1 video), đẩy tỷ lệ tương tác và thời gian xem lại lên mức kịch trần.
- **Chi phí đầu tư công cụ gần như bằng không:** Nguyên liệu hình ảnh lấy miễn phí 100% trên `Pinterest` (*con bò, con trâu, con gà, bó rơm, cánh rừng*), kịch bản dùng `ChatGPT` bản thường miễn phí, chỉ cần 1 tài khoản `Picsart Pro` (vài chục nghìn đồng/tháng) kết hợp `CapCut PC`.
- **Kỹ thuật "Gỡ nền – Đảo ngược Cục tẩy – Thêm Nét (Stroke) cỡ 6" trên Picsart Pro:** Sau khi xuất cụm ảnh PNG (1 con trâu + 3 bó rơm) trên nền trắng, tải lại bức ảnh đó lên, bấm `Gỡ nền` $\rightarrow$ chọn `Cục tẩy` $\rightarrow$ bấm `Đảo ngược` $\rightarrow$ `Áp dụng` $\rightarrow$ vào `Chỉnh sửa > Nét` chọn màu đỏ cỡ `6` để tạo ra khung viền chuẩn xác 100% với hình dáng vật thể.
- **Mẹo bóc tách kịch bản đa quốc gia bằng Cốc Cốc & CapCut:** Dùng nút tải của trình duyệt `Cốc Cốc` tải riêng file âm thanh (`.mp3`) từ Reels nước ngoài, đưa vào `CapCut` chạy `Phụ đề tự động` kèm `Dịch sang tiếng Việt`, rồi ném vào `ChatGPT` nhân bản thành 10 câu song ngữ Việt – Anh (hoặc Trung, Âu) dùng dần cho 10 video.
- **Tổ chức 3 lớp hình ảnh trên timeline CapCut PC:** Lớp 1 (dưới cùng) là ảnh nền màu tím nhạt ghép cánh rừng; Lớp 2 (ở giữa) là ảnh khung viền đỏ trên nền trắng đã bật `Cơ bản -> Xóa nền -> Xóa tự động` để chỉ hiện đường viền đỏ; Lớp 3 (trên cùng) là ảnh PNG con trâu và 3 bó rơm.
- **Thuật toán Keyframe 10-frame ($1/3$ giây) trên CapCut PC:** Giữ `Ctrl` + lăn chuột thu nhỏ vùng Preview, đặt keyframe lệch trái ở `00:00` và lệch phải ở `00:10`, sau đó dùng `Ctrl+C` / `Ctrl+V` dán xen kẽ Trái – Phải mỗi `10 frame` suốt `7 giây`, đồng thời gài đúng 1 keyframe khớp tâm viền đỏ tại mốc `05:15` ($< 0.5\text{s}$) để tạo đáp án thật cho khán giả.

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Reels Thử Thách Dừng Hình (Pause Challenge) Triệu View Bằng Picsart Pro & Keyframe CapCut PC

1. **Khai thác nguyên liệu miễn phí (`Pinterest`):** Truy cập `Pinterest` tìm và tải 3 hình ảnh miễn phí theo cặp chủ đề (ví dụ: *1 con trâu/bò, 1 bó rơm/đám cỏ, 1 cánh rừng cây*), có thể thay đổi vô hạn sang *con gà - quả trứng*, *con chó - đùi thịt*, *con mèo - con cá* cho các video tiếp theo.
2. **Thiết kế bộ 3 ảnh chuẩn `1080x1920` (`Picsart Pro`):** Mở `Picsart Pro` tạo khung dọc `1080x1920`, thiết kế và xuất ra 3 file ảnh: (1) Ảnh PNG nền trong suốt gồm 1 con trâu ở trên + 3 bó rơm xếp dọc ở dưới; (2) Ảnh khung viền đỏ trên nền trắng bằng thao tác `Gỡ nền -> Cục tẩy -> Đảo ngược -> Áp dụng -> Chỉnh sửa Nét màu đỏ cỡ 6`; (3) Ảnh phông nền màu nhạt ghép cánh rừng ở phía trên.
3. **Bóc tách & Nhân bản lời thoại kêu gọi (`Cốc Cốc` $\rightarrow$ `CapCut` $\rightarrow$ `ChatGPT`):** Dùng trình duyệt `Cốc Cốc` tải audio từ video mẫu của đối thủ, đưa vào `CapCut` bật `Phụ đề tự động + Dịch sang tiếng Việt`, sau đó dán vào `ChatGPT` yêu cầu viết lại 10 câu kêu gọi dừng hình chụp màn hình song ngữ Việt – Anh.
4. **Lồng giọng đọc TTS & Xếp 3 lớp Layer (`CapCut PC`):** Trong `CapCut PC`, tạo giọng đọc AI (`Chuyển đổi văn bản thành giọng nói` $\rightarrow$ giọng *Thanh niên tự tin*), rồi xếp 3 lớp ảnh lên timeline (Lớp nền rừng ở dưới $\rightarrow$ Lớp viền đỏ ở giữa bật `Xóa nền tự động` $\rightarrow$ Lớp PNG con trâu và 3 bó rơm ở trên cùng).
5. **Tạo chuyển động Keyframe 10-frame & Điểm khớp đáp án (`CapCut PC`):** Giữ `Ctrl` + lăn chuột thu nhỏ khung Preview, đặt Keyframe cho lớp con trâu + 3 bó rơm ở vị trí lệch trái (`00:00`) và lệch phải (`00:10`), dùng `Ctrl+C` và `Ctrl+V` nhân bản xen kẽ mỗi `10 frame` dọc theo chiều dài giọng đọc (`~7s`), chèn duy nhất 1 keyframe khớp khít vào tâm khung viền đỏ ở mốc `05:15` rồi xuất video `1080p`.

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Khi xuất Lớp ảnh số 1 (con trâu và 3 bó rơm) trên `Picsart`, bắt buộc phải xóa bỏ lớp nền trắng để hiện nền caro răng cưa trong suốt trước khi tải về.
- ⚠ Ở bước tạo khung viền đỏ trên `Picsart` (`Gỡ nền -> Cục tẩy -> Đảo ngược`), tuyệt đối không quên bấm nút **Áp dụng (Apply)** trước khi chuyển sang mục Chỉnh sửa Nét (`Stroke`).
- ⚠ Khi đưa ảnh khung viền đỏ nền trắng vào `CapCut PC`, phải đặt ở track giữa và bật `Cơ bản -> Xóa nền -> Xóa tự động` để làm trong suốt nền trắng, nếu không nền trắng sẽ che mất lớp phông nền rừng cây phía dưới.
- ⚠ Không kéo các keyframe quá thưa làm chuyển động bị chậm dễ dừng hình; phải đặt khoảng cách `10 frame` ($1/3$ giây) và chỉ để đúng 1 điểm khớp khung viền ($< 0.5$ giây) để kích thích khán giả thử đi thử lại và bình luận.

---

## 8. Công cụ & Tài liệu đính kèm

- **Công cụ sử dụng:** `Pinterest`, `Picsart`, `ChatGPT`, `CapCut`, `Cốc Cốc`, `Facebook`
- **Tài liệu đính kèm (3 tài liệu khóa học):**
  - [`docs/VIDEO-5a4861/README.md`](README.md) — Hồ sơ phân tích & SOP thực chiến: Quy Trình Sản Xuất Page Triệu View
  - [`assets/docs-dgmd/VIDEO-5a4861/master_prompt.md`](../../assets/docs-dgmd/VIDEO-5a4861/master_prompt.md) — Bộ Master Prompt & Quy Trình Thiết Kế 3 Lớp Ảnh + Keyframe: Xây Dựng Fanpage Triệu View Ngách Thử Thách Dừng Hình
  - [`video/VIDEO-5a4861/transcript.txt`](../../video/VIDEO-5a4861/transcript.txt) — Bản ghi phụ đề đầy đủ đã kiểm định 141 phân đoạn
