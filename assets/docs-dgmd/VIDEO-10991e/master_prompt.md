# Bộ Prompt Tạo Thumbnail & Quy Trình Khai Thác Video TikTok Bằng Máy Tính (`VIDEO-10991e`)

> **SKU:** `VIDEO-10991e` · **Bài học:** Bài 32 (`DGMD-M09`) — *Quy Trình Sản Xuất Video Có Sẵn Trên Nền Tảng Tiktok Bằng Máy Tính*  
> **Kênh thực chiến minh họa trên màn hình:** [`Hiếu Mang Dép`](https://www.youtube.com/channel/UCs9II6amKbHIPJYPKLEI_pA) (`301.708 người đăng ký` · `464.745 lượt xem/28 ngày` · `18,0N giờ xem` — đủ bật kiếm tiền chỉ sau 7 ngày chuyển từ Shorts sang video dài)  
> **Tổ hợp công cụ:** `Google Trends` + `TikTok PC` + `Cốc Cốc / SnapTik` + `CapCut PC` + `ChatGPT`

---

## 1. Công thức Từ khóa Săn Video Livestream Dài Trên TikTok PC

Khi một nhân vật hoặc sự việc đang bùng nổ trên **Google Trends** (ví dụ: *Huấn Hoa Hồng, Vua Quạt, Khánh Sky, Nguyễn Phương Hằng*), các idol thường phát trực tiếp trên TikTok trước tiên. Để lấy được các video gốc có thời lượng dài (từ `5 – 15 phút`) phục vụ kéo `4.000 giờ xem` trên YouTube:

```text
[Tên nhân vật / Sự việc đang Trend] + live
full + [Tên nhân vật / Sự việc đang Trend] + live
```

**Ví dụ từ khóa thực tế gõ trên thanh tìm kiếm TikTok PC trong bài giảng (`03:40 & 13:56`):**
```text
vua quat live
nguyễn phương hằng live
full nguyễn phương hằng live
```
- **Bộ lọc bắt buộc trên TikTok PC:** Sau khi nhấn tìm kiếm, chuyển từ tab `Top` sang tab **`Video`** để lọc ra toàn bộ các bản ghi màn hình buổi phát trực tiếp dài hàng chục phút.
- **2 cách tải video không dính logo / chất lượng gốc trên PC (`04:16`):**
  1. Mở trực tiếp trên trình duyệt **Cốc Cốc** $\rightarrow$ bấm nút **Tải xuống (`720p MP4`)** hiển thị ngay góc trên video.
  2. Sao chép đường link video TikTok $\rightarrow$ dán vào công cụ **SnapTik** (`snaptik.app`) $\rightarrow$ bấm **Download** về máy tính.

---

## 2. Thông số Biến Đổi Khung Hình & Phụ Đề Trên CapCut PC (`05:56 – 11:27`)

| Hạng mục xử lý | Thông số gốc (TikTok) | Thông số chuẩn hóa trên CapCut PC | Thao tác kỹ thuật chi tiết |
| :--- | :---: | :---: | :--- |
| **1. Tỷ lệ khung hình** | `9:16` (Dọc) | **`16:9`** (Ngang - Video dài) | Bấm nút **Tỷ lệ khung hình** dưới màn hình preview $\rightarrow$ chuyển từ `9:16` sang `16:9`. |
| **2. Cắt cúp (Crop)** | Full màn hình điện thoại (dính bình luận & thanh trạng thái) | **Khung vuông trung tâm lấy sát khuôn mặt** | Vào công cụ **Cắt (Crop)** $\rightarrow$ khoanh vùng vuông chính giữa lấy trọn khuôn mặt nhân vật chính, loại bỏ thanh bình luận TikTok bên dưới. |
| **3. Mặt nạ bo góc (Mask)** | Góc nhọn thô | **Hình chữ nhật bo tròn 4 góc** | Vào **Video $\rightarrow$ Mặt nạ (Mask) $\rightarrow$ Hình chữ nhật** $\rightarrow$ giữ phím `Ctrl` kéo thu phóng vừa khít khung cắt và kéo **hình thoi trắng** để bo tròn 4 góc. |
| **4. Xử lý Nền (Background)** | Hai dải đen hai bên | **Phông nền Mờ (Blur) hoặc ghép video đường phố (`Pexels`/`Pixabay`)** | Cách 1 (Nhanh): Vào **Video $\rightarrow$ Cơ bản $\rightarrow$ Nền $\rightarrow$ Mờ (Blur)** $\rightarrow$ chọn mức độ làm mờ vừa phải.<br>Cách 2: Tải video đường phố từ `Pexels` / `Pixabay` đặt làm lớp nền phía dưới. |
| **5. Phụ đề tự động (Auto Captions)** | Không có phụ đề | **Phông chữ `Anton` · Chữ trắng viền đen · Hộp nền màu Đỏ/Đen bo góc** | Vào **Văn bản $\rightarrow$ Phụ đề tự động $\rightarrow$ Tiếng Việt $\rightarrow$ Tạo**. Chọn phông chữ **`Anton`**, màu chữ trắng viền đen, bật **Phông nền (Background)** màu đỏ/đen/trắng đổi màu theo từng video. |
| **6. Thông số Xuất file (Export)** | `1080p` (Nặng, render lâu) | **`720p` · `H.264` · `MP4` · `30fps`** | Chọn độ phân giải **`720p`** để tối ưu tốc độ render và tải lên hàng loạt (`30–50 video/kênh`) mà không tốn tài nguyên máy. |

---

## 3. Master Prompt Tạo Thumbnail 16:9 Tự Động Trên ChatGPT (`11:57 – 15:24`)

### 3.1. Quy tắc chụp ảnh đầu vào
- Mở video gốc đến đúng khoảnh khắc nhân vật có biểu cảm mạnh nhất (ví dụ: chỉ thẳng tay vào màn hình).
- Bấm tổ hợp phím **`Windows + Shift + S`** $\rightarrow$ khoanh vùng **hình vuông** lấy rõ khuôn mặt và cử chỉ tay của nhân vật (**Tuyệt đối không chụp toàn màn hình desktop**).
- Dán (`Ctrl + V`) ảnh vừa chụp vào khung chat của **ChatGPT**.

### 3.2. Câu lệnh Prompt nguyên bản giảng viên gõ trên màn hình (`12:50 – 13:20`)
```text
hãy tạo cho tôi 1 hình ảnh thumbnail , bên cạnh có dòng chữ , thằng nhựa HDBE , tao chỉ thẳng mặt , không vướng chúng mày đâu , hình ảnh 16.9
```

### 3.3. Mẫu Prompt chuẩn hóa tổng quát cho mọi chủ đề Trend / Nhân vật
```text
Hãy tạo cho tôi 1 hình ảnh thumbnail YouTube dựa trên ảnh nhân vật đính kèm, bên cạnh nhân vật có dòng chữ lớn nổi bật: "[CÂU NÓI CAO TRÀO / KEYWORD GÂY TÒ MÒ TRONG VIDEO]", hình ảnh tỷ lệ 16.9
```
