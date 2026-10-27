# Quy Trình Sản Xuất Video Có Sẵn Trên Nền Tảng Tiktok Bằng Máy Tính

> **SKU:** `VIDEO-10991e` · **Bài học:** Bài 32 (`DGMD-M09` — Đại Gia Mang Dép Academy)  
> **Thời lượng:** `15:51` (`951.7s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Khai Thác Video Trend TikTok & Bật Kiếm Tiền Nhanh (PC)` · **Thị trường:** `🇻🇳 Việt Nam & 🇺🇸 Toàn Cầu (US / Quốc Tế)`  
> **Tài liệu thực chiến:** [`assets/docs-dgmd/VIDEO-10991e/master_prompt.md`](../../assets/docs-dgmd/VIDEO-10991e/master_prompt.md) · **Bản ghi phụ đề:** [`video/VIDEO-10991e/transcript.txt`](../../video/VIDEO-10991e/transcript.txt)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài học hướng dẫn quy trình thực chiến khai thác nguồn video phát trực tiếp (livestream) có sẵn trên **TikTok bằng máy tính** để chuyển thể thành video dài (`16:9`) trên YouTube, giúp các kênh đã có sẵn lượng người đăng ký từ Shorts nhanh chóng cán mốc `4.000 giờ xem` bật kiếm tiền chỉ trong **7 ngày**. Giảng viên chứng minh trực tiếp bằng số liệu YouTube Studio của kênh **`Hiếu Mang Dép`** (`UCs9II6amKbHIPJYPKLEI_pA` — đạt **`464.745 lượt xem`**, **`18.000 giờ xem`** trong 28 ngày và **`301.708 người đăng ký`**), đồng thời làm mẫu trọn vẹn từ khâu săn từ khóa `[Tên nhân vật] + live` trên TikTok PC, tải video qua **Cốc Cốc / SnapTik**, biên tập khung `16:9` bo góc mặt nạ + nền mờ + phụ đề tự động phông `Anton` trên **CapCut PC** (xuất chuẩn `720p`), cho tới bước dùng **ChatGPT** tự động thiết kế Thumbnail `16:9` bắt mắt.

---

## 2. Số liệu Kênh Thực Tế & Quy Trình Kỹ Thuật Trên Màn Hình (Visual Frame Evidence)

### 2.1. Bảng số liệu YouTube Studio kênh mẫu `Hiếu Mang Dép` (`00:00 – 01:46`)

| Chỉ số thống kê trên màn hình (`11 thg 7 – 7 thg 8, 2026`) | Con số thực tế trên YouTube Studio | Ý nghĩa chiến lược trong bài giảng |
| :--- | :---: | :--- |
| **Tên kênh & ID kênh** | **`Hiếu Mang Dép`** ([`UCs9II6amKbHIPJYPKLEI_pA`](https://www.youtube.com/channel/UCs9II6amKbHIPJYPKLEI_pA)) | Kênh gốc xây từ Shorts (từ tháng 2/2025), sau đó chuyển sang đăng video dài bắt trend để bật kiếm tiền. |
| **Số người đăng ký (Subscribers)** | **`301.708`** | Lượng sub tích lũy sẵn từ giai đoạn làm Shorts (chỉ cần kênh đạt `1.000 – 3.000 sub` là áp dụng được ngay). |
| **Tổng lượt xem (28 ngày qua)** | **`464.745 lượt xem`** (`464,7 N` $\uparrow$) | Cao hơn `464,3 N` so với bình thường nhờ loạt video dài bắt trend nhân vật đang sốt. |
| **Thời gian xem (Giờ) (28 ngày qua)** | **`18,0 N giờ xem`** (`18.000 giờ` $\uparrow >999\%$) | Vượt gấp **4,5 lần** điều kiện bật kiếm tiền của YouTube (`4.000 giờ xem`) chỉ sau vài ngày đăng video dài. |
| **Số lượt xem 48 giờ qua (Realtime)** | **`28.170 lượt xem`** | Top video đang kéo view: *Vua quạt nói không cầ...* (`6.254`), *Bài Hát Chầu Văn Trả...* (`6.131`), *Bài Hát Xẩm Huấn Hoa...* (`2.165`). |
| **Định giá kênh bật kiếm tiền trên thị trường** | **`Up to ~20.000.000 VNĐ`** (với kênh sub lớn) | Các kênh nhỏ `1K – 3K sub` đã bật kiếm tiền có thể giao dịch trung gian trên các hội nhóm để thu hồi vốn nhanh. |

### 2.2. Bảng thông số kỹ thuật 5 công đoạn từ `TikTok PC` $\rightarrow$ `CapCut PC` $\rightarrow$ `ChatGPT` (`01:47 – 15:51`)

| Công đoạn | Công cụ trên màn hình | Thao tác & Thông số kỹ thuật hiển thị trực tiếp | Mốc thời gian |
| :--- | :--- | :--- | :---: |
| **1. Săn nguồn Video dài trên TikTok PC** | `Google Trends` + `TikTok Web` | • Xác định các nhân vật đang tạo sóng dư luận (*Huấn Hoa Hồng, Vua Quạt, Khánh Sky, Nguyễn Phương Hằng*).<br>• Vào `tiktok.com` gõ từ khóa **`vua quat live`**, **`nguyễn phương hằng live`** hoặc **`full nguyễn phương hằng live`** $\rightarrow$ chuyển sang tab **`Video`** để lấy các clip ghi hình livestream dài (`09:08`). | `01:47 – 04:15` |
| **2. Tải video MP4 không dính logo** | `Cốc Cốc` / `SnapTik` | • **Cách 1:** Mở trên trình duyệt **Cốc Cốc** $\rightarrow$ bấm nút **Tải về (`720p`)** nổi ngay trên góc khung phát video.<br>• **Cách 2:** Copy link video TikTok $\rightarrow$ mở tab **SnapTik** (`Tải Video TikTok Không...`) $\rightarrow$ dán link và bấm **Download**. | `04:16 – 05:55` |
| **3. Chuyển khung 16:9, Bo góc & Làm mờ nền** | `CapCut PC` (`Dự án 0808 (1)`) | • Nhập file `Vua Quạt trút hết nỗi lòng trong live mới nhất P4.mp4` (`00:09:08:21`).<br>• Đổi **Tỷ lệ khung hình** từ `9:16` sang **`16:9`**.<br>• Dùng **Cắt (Crop)** lấy khung vuông chính giữa sát mặt nhân vật.<br>• Vào **Video $\rightarrow$ Mặt nạ (Mask) $\rightarrow$ Hình chữ nhật**: Giữ `Ctrl` kéo thu phóng và kéo hình thoi trắng bo tròn 4 góc.<br>• Vào **Video $\rightarrow$ Cơ bản $\rightarrow$ Nền $\rightarrow$ Mờ (Blur)** để xóa hai dải đen hai bên (hoặc chèn nền đường phố từ `Pexels` / `Pixabay`). | `05:56 – 08:53` |
| **4. Tạo Phụ đề tự động & Xuất chuẩn 720p** | `CapCut PC` | • Vào **Văn bản $\rightarrow$ Phụ đề tự động $\rightarrow$ Ngôn ngữ nói: Tiếng Việt $\rightarrow$ Tạo**.<br>• Chọn phông chữ **`Anton`**, chữ màu trắng viền đen, bật **Phông nền (Background)** màu đỏ/đen/trắng bo tròn góc.<br>• Bấm **Xuất (Export)**: Chọn độ phân giải **`720P`**, bộ mã hóa **`H.264`**, định dạng **`mp4`**, tỷ lệ khung hình **`30fps`**. | `08:54 – 11:26` |
| **5. Tạo Thumbnail 16:9 tự động bằng AI** | `Windows + Shift + S` + `ChatGPT` | • Mở video đến đoạn nhân vật chỉ thẳng tay vào màn hình (`02:50`), bấm **`Windows + Shift + S`** cắt khung vuông lấy rõ khuôn mặt và bàn tay.<br>• Dán ảnh vào **ChatGPT** (`chatgpt.com`) kèm câu lệnh tạo Thumbnail `16:9` có chữ nổi bật bên cạnh. | `11:27 – 15:51` |

---

## 3. Bộ Master Prompt Tạo Thumbnail 16:9 Trên ChatGPT (`master_prompt.md`)

Toàn bộ công thức từ khóa săn livestream TikTok, thông số biên tập CapCut PC và câu lệnh Prompt tạo Thumbnail trên ChatGPT đã được đóng gói tại [`assets/docs-dgmd/VIDEO-10991e/master_prompt.md`](../../assets/docs-dgmd/VIDEO-10991e/master_prompt.md):

```text
[PROMPT NGUYÊN BẢN GIẢNG VIÊN GÕ TRÊN MÀN HÌNH CHATGPT TẠI MỐC 12:50]:
hãy tạo cho tôi 1 hình ảnh thumbnail , bên cạnh có dòng chữ , thằng nhựa HDBE , tao chỉ thẳng mặt , không vướng chúng mày đâu , hình ảnh 16.9

[TIÊU ĐỀ ĐỒNG BỘ KHI ĐĂNG VIDEO]:
Vua Quạt chỉ thẳng mặt HDPE và nói không vướng chúng mày đâu
```

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Case study kênh `'Hiếu Mang Dép'` (`301.708 sub`): Chuyển từ kênh Shorts có sẵn sub sang đăng video dài bắt trend đủ `4.000 giờ xem` bật kiếm tiền chỉ trong 7 ngày
- **`01:05`** — Phân tích số liệu thực tế trong YouTube Studio: `464.745 lượt xem`, `18.000 giờ xem` trong 28 ngày và định giá bán kênh bật kiếm tiền (tới 20 triệu VNĐ)
- **`01:47`** — Tư duy săn chủ đề đang sốt trên `Google Trends` (*Huấn Hoa Hồng, Vua Quạt, Khánh Sky, Nguyễn Phương Hằng*) kết hợp 2 công cụ `CapCut` và `ChatGPT`
- **`03:13`** — Thủ thuật tìm nguồn video dài trên `TikTok PC`: Gõ từ khóa `'[Tên nhân vật] + live'` (`vua quạt live`, `nguyễn phương hằng live`) và lọc tab `'Video'`
- **`04:16`** — 2 phương pháp tải video TikTok trên máy tính: Dùng nút tải tích hợp sẵn của trình duyệt `Cốc Cốc` hoặc dán link vào `SnapTik`
- **`05:56`** — Xử lý khung hình trên `CapCut PC`: Đổi tỷ lệ từ `9:16` sang `16:9` và dùng công cụ `Cắt (Crop)` lấy vùng vuông chính giữa khuôn mặt nhân vật
- **`07:14`** — Tạo `Mặt nạ (Mask)` hình chữ nhật bo tròn 4 góc và làm mờ nền (`Blur Background`) hoặc ghép nền đường phố từ `Pexels`/`Pixabay`
- **`08:54`** — Tạo `Phụ đề tự động` tiếng Việt trên `CapCut PC`: Chỉnh phông chữ `Anton`, chữ trắng viền đen và đóng hộp phông nền màu đỏ/đen bo góc
- **`10:59`** — Tiêu chuẩn xuất video tốc độ cao: Chọn độ phân giải `720p` (`H.264`, `30fps`) thay vì `1080p` để tối ưu sản xuất hàng loạt `30–50 video dài`
- **`11:27`** — Quy trình tạo Thumbnail `16:9` bằng `ChatGPT`: Dùng `Windows + Shift + S` chụp khung vuông nhân vật và nhập prompt kèm câu nói cao trào trong video
- **`13:20`** — Khai thác kho tài nguyên vô tận với từ khóa `'full nguyễn phương hằng live'` và nghiệm thu ảnh Thumbnail `16:9` do `ChatGPT` sinh tự động

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Chiến lược bật kiếm tiền siêu tốc trong 7 ngày (Case study kênh `Hiếu Mang Dép` - `UCs9II6amKbHIPJYPKLEI_pA` đạt `464.745 view` và `18.000 giờ xem/28 ngày`):** Tận dụng kênh đã có sẵn `1.000 – 300.000 sub` từ video ngắn (Shorts), sau đó đăng `30–50 video dài` cùng một chủ đề bắt trend đang nóng trên `Google Trends` để gom đủ `4.000 giờ xem` bật kiếm tiền hoặc bán kênh.
- **Công thức từ khóa `'[Tên nhân vật] + live'` trên `TikTok PC`:** Các nhân vật tâm điểm mạng xã hội (như *Vua Quạt, Huấn Hoa Hồng, Nguyễn Phương Hằng*) luôn phát trực tiếp trên TikTok; chỉ cần gõ kèm hậu tố `'live'` hoặc `'full ... live'` rồi bấm sang tab `'Video'` sẽ thu được kho video gốc dài 9–15 phút.
- **2 cách tải video TikTok nhanh nhất trên máy tính:** Đăng nhập trực tiếp trên trình duyệt `Cốc Cốc` để hiện nút tải `720p` ngay trên góc video, hoặc sao chép liên kết dán vào `SnapTik` để lấy file MP4 sạch logo.
- **Combo biến đổi hình ảnh trên `CapCut PC`:** Đổi khung hình từ `9:16` sang `16:9`, cắt (`Crop`) gọn vùng vuông quanh khuôn mặt nhân vật để loại bỏ bình luận rác, áp `'Mặt nạ'` (`Mask`) hình chữ nhật kéo hình thoi bo tròn 4 góc, kết hợp bật `'Nền -> Mờ'` (hoặc lồng video đường phố từ `Pexels`/`Pixabay`) và tạo `'Phụ đề tự động'` tiếng Việt phông `Anton` chữ trắng viền đen trên hộp nền đỏ.
- **Nguyên tắc xuất file `720p` tối ưu hiệu suất:** Đối với dòng video tin tức/bắt trend cần tốc độ phủ sóng `30–50 video/kênh`, chỉ cần xuất ở độ phân giải `720p` (`30fps`, `H.264`) giúp giảm một nửa thời gian render và upload mà trải nghiệm xem trên điện thoại không khác biệt.
- **Tự động hóa thiết kế Thumbnail `16:9` bằng `ChatGPT` thay thế `Canva`/`Picsart`:** Mở video chọn khoảnh khắc nhân vật chỉ tay gay cấn nhất, bấm `Windows + Shift + S` chụp đúng khung vuông khuôn mặt rồi gửi vào `ChatGPT` kèm câu lệnh yêu cầu chèn câu trích dẫn đắt giá nhất trong video và khóa đuôi `'hình ảnh 16.9'`.

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Dài Bắt Trend Từ TikTok Bằng Máy Tính (CapCut PC + ChatGPT)

1. **Săn nguồn video livestream dài trên TikTok PC:** Tra cứu nhân vật/sự việc đang hot trên `Google Trends`, vào `TikTok` trên máy tính gõ từ khóa `'[Tên nhân vật] + live'` (chuyển sang tab `Video`) để chọn các clip dài 5–15 phút và tải về qua trình duyệt `Cốc Cốc` hoặc `SnapTik`.
2. **Đổi khung `16:9`, Cắt vuông & Bo góc Mặt nạ:** Đưa video vào `CapCut PC`, chuyển tỷ lệ khung hình từ `9:16` sang `16:9`, dùng công cụ `Cắt (Crop)` lấy khung vuông sát mặt nhân vật và bật `Mặt nạ (Mask)` hình chữ nhật kéo bo tròn 4 góc.
3. **Làm mờ nền (Blur Background) hoặc ghép nền phụ:** Vào mục `Video -> Cơ bản -> Nền -> chọn 'Mờ' (Blur)` để lấp đầy hai dải đen hai bên (hoặc chèn video đường phố tải từ `Pexels`/`Pixabay` làm nền động phía sau).
4. **Sinh Phụ đề tự động tiếng Việt & Xuất chuẩn `720p`:** Vào `Văn bản -> Phụ đề tự động -> chọn Tiếng Việt` để sinh sub toàn bộ video, đổi sang phông chữ `Anton` (màu trắng, viền đen, hộp phông nền màu đỏ/đen bo góc) rồi xuất file ở chuẩn `720p MP4`.
5. **Tạo Thumbnail `16:9` bằng ChatGPT & Đặt tiêu đề đồng bộ:** Mở video vừa xuất, bấm `Windows + Shift + S` chụp khung vuông khoảnh khắc nhân vật biểu cảm mạnh nhất, dán vào `ChatGPT` kèm câu lệnh: `'hãy tạo cho tôi 1 hình ảnh thumbnail, bên cạnh có dòng chữ [câu nói cao trào], hình ảnh 16.9'` và đặt tiêu đề đồng bộ với chữ trên thumbnail.

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Không giữ nguyên khung hình dọc `9:16` của TikTok khi đăng làm video dài trên YouTube; bắt buộc phải đảo sang `16:9`, cắt vuông, bo góc bằng `Mặt nạ` và làm mờ nền.
- ⚠ Không chọn nhầm ngôn ngữ Tiếng Anh khi bấm tạo `Phụ đề tự động` cho video tiếng Việt trên `CapCut PC` vì hệ thống sẽ không nhận diện được lời nói.
- ⚠ Không xuất video dạng bắt trend ở độ phân giải `1080p` hay `4K` gây tốn dung lượng và chậm tiến độ phủ `30–50 video`; chỉ xuất ở mức `720p`.
- ⚠ Khi chụp ảnh nhân vật bằng `Windows + Shift + S` để đưa vào `ChatGPT` làm Thumbnail, tuyệt đối không chụp toàn bộ màn hình máy tính và không quên ghi rõ cụm `'hình ảnh 16.9'` ở cuối câu lệnh.

---

## 8. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ:** `CapCut`, `ChatGPT`, `TikTok`, `Google Trends`, `SnapTik`, `Cốc Cốc`, `Pexels`, `Pixabay`, `Canva`, `Picsart`, `YouTube`
- **Kênh thực chiến minh họa (Đã xác thực HTTP 200):** [`@HieuMangDep` (`Hiếu Mang Dép` — `UCs9II6amKbHIPJYPKLEI_pA`)](https://www.youtube.com/channel/UCs9II6amKbHIPJYPKLEI_pA)
- **Tài liệu đính kèm:**
  - [`docs/VIDEO-10991e/README.md`](README.md) (Hồ sơ phân tích 7 lớp, Bảng số liệu YouTube Studio 464.7K views & Quy trình CapCut PC + ChatGPT)
  - [`assets/docs-dgmd/VIDEO-10991e/master_prompt.md`](../../assets/docs-dgmd/VIDEO-10991e/master_prompt.md) (Bộ Prompt Tạo Thumbnail & Quy Trình Khai Thác Video TikTok Bằng Máy Tính)
  - [`video/VIDEO-10991e/transcript.txt`](../../video/VIDEO-10991e/transcript.txt) (Bản ghi phụ đề đầy đủ đã kiểm định 92 phân đoạn)
