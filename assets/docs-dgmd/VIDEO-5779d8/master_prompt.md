# Bộ Master Prompt Tự Code Tool Phát Trực Tiếp Đa Luồng 24/7 (`VIDEO-5779d8`)

> **SKU:** `VIDEO-5779d8` · **Bài học:** Bài 34 (`DGMD-M10`) — *Quy Trình Sản Xuất Tool Phát Trực Tiếp Đa Luồng*  
> **Kênh đối thủ mẫu trên màn hình:** [`@LofiGirl`](https://www.youtube.com/@LofiGirl) (Vận hành đồng thời 10–20 luồng phát trực tiếp nhạc Lofi / Sleep / Study 24/7)  
> **Tài liệu gốc đính kèm:** [Google Docs — Câu Prompt Tạo Tool PTT](https://docs.google.com/document/d/1qXFPjEK1m6i0uloz_0wbsH1TqJaK9lebxDQy7d2ZTxY/edit?usp=sharing) (`assets/docs-dgmd/VIDEO-5779d8/doc_1.txt`)  
> **Kiến trúc phần mềm sinh ra:** `Python` + `PySide6 GUI` + `FFmpeg` + `PyInstaller (build_onefile.bat -> .exe)`

---

## 1. Câu lệnh Prompt Gốc (Meta-Prompt) Gửi Cho ChatGPT Sinh Master Prompt (`doc_1.txt` — Mốc `00:44 – 03:39`)

Copy nguyên văn đoạn lệnh dưới đây gửi vào **ChatGPT** để yêu cầu AI đóng vai chuyên gia phần mềm và viết ra bản đặc tả kỹ thuật (Master Prompt 18 hạng mục):

```text
phát trực tiếp đa luồng
hãy đóng vai thành 1 chuyên gia code tool , bạn hãy tạo cho tôi 1 master prompt yêu cầu để gửi trực tiếp cho chatgpt code cho tôi 1 con tool có chức năng như sau , tool này có tên là phát trực tiếp đa luồng , chức năng của tool là phát trực tiếp trên youtube , bao gồm 2 kích thước có thể lựa chọn trong tool kích thước 9.16 , và kích thước 16.9 , ghi nhớ url của sự kiện phát trực tiếp này cố định cho các luồng rtmp://a.rtmp.youtube.com/live2 , có nút thêm luồng nếu muốn , và có dòng mã sự kiện phát trực tiếp , chỉ cần dán mã sự kiện phát trực tiếp này có thể nhấn bắt đầu phát , có nút bắt đầu phát , có nút dừng phát , và trong các luồng có thêm video từ thư mục , mỗi luồng có thể chọn 1 video tùy thích , trong tool có nút chức năng lặp đi lặp lại , video của tôi có thể lặp đi lặp lại mà không tắt , thiết kế 1 giao diện công nghệ bắt mắt , sáng tạo 1 master prompt gửi trực tiếp cho chatgpt yêu cầu đóng gói và code 1 tool phát trực tiếp hoàn chỉnh
```

---

## 2. Lệnh Kích Hoạt Đóng Gói Mã Nguồn & Cấu Trúc Đặc Tả 18 Hạng Mục (`04:42 – 06:40`)

Sau khi ChatGPT trả về bản **Master Prompt** dài (gồm 18 mục đặc tả: *Giao diện PySide6 Dark Tech, Quản lý đa luồng RTMP tối đa 20 luồng mặc định, Theo dõi CPU/RAM/GPU, Bộ mã hóa NVIDIA NVENC / libx264, Tự động lặp vô tận `-stream_loop -1`, Tự động kết nối lại, Đóng gói `.exe`*), thực hiện 2 bước lệnh tiếp theo trong cùng cửa sổ ChatGPT:

1. **Bước kích hoạt viết code & đóng gói `.zip`:**
   - Copy toàn bộ bản Master Prompt vừa được ChatGPT sinh ra $\rightarrow$ dán ngược lại vào ô chat gửi cho ChatGPT.
   - Khi ChatGPT hỏi xác nhận phương án thực thi, gõ lệnh ngắn gọn:
     ```text
     bắt đầu code tool cho tôi
     ```
2. **Kết quả ChatGPT trả về:** Một file nén dự án hoàn chỉnh (`PhatTrucTiepDaLuong.zip`) chứa toàn bộ mã nguồn Python/PySide6, thư mục `bin/`, script chạy `run.bat` và script đóng gói `build_onefile.bat`.

---

## 3. Quy Trình Cài Đặt Core `FFmpeg` (`gyan.dev`) & Build File `.exe` (`06:40 – 09:38`)

Tool phát trực tiếp hoạt động bằng cách điều phối nhiều tiến trình `ffmpeg.exe` độc lập đẩy luồng video lên máy chủ RTMP của YouTube. Khi mới tải file `.zip` từ ChatGPT về, thư mục `bin/` chưa có sẵn bộ thực thi `FFmpeg`, cần nạp theo 5 bước:

| Bước | Thao tác thực hiện | Đường dẫn / Tên file chính xác trên màn hình |
| :-: | :--- | :--- |
| **01** | Tìm kiếm từ khóa `ffmpeg` trên trình duyệt $\rightarrow$ vào trang chủ `ffmpeg.org` $\rightarrow$ nhấn **Download** $\rightarrow$ chọn biểu tượng **Windows** $\rightarrow$ bấm **`Windows builds from gyan.dev`**. | URL đích: `https://www.gyan.dev/ffmpeg/builds/#release-builds` (*CODEX FFMPEG*) |
| **02** | Kéo xuống mục **`release builds`** $\rightarrow$ bấm tải **file thứ 2** có đuôi `.zip`. | Tên file: **`ffmpeg-release-essentials.zip`** (`104 MB`) |
| **03** | Giải nén file `ffmpeg-release-essentials.zip` $\rightarrow$ mở vào thư mục **`bin`** bên trong $\rightarrow$ nhấn `Ctrl + C` sao chép 2 file thực thi. | 2 file cần copy: **`ffmpeg.exe`** và **`ffprobe.exe`** |
| **04** | Mở thư mục dự án `PhatTrucTiepDaLuong` vừa tải từ ChatGPT $\rightarrow$ vào thư mục **`bin/`** $\rightarrow$ nhấn `Ctrl + V` dán 2 file vào $\rightarrow$ quay ra chạy file **`build_onefile.bat`**. | Chờ cửa sổ CMD chạy PyInstaller đóng gói ra thư mục **`dist/`**. |
| **05** | Mở thư mục `dist/PhatTrucTiepDaLuong/bin/` $\rightarrow$ dán (`Ctrl + V`) thêm một bản **`ffmpeg.exe`** và **`ffprobe.exe`** vào đây để đảm bảo file `.exe` độc lập chạy ổn định 100% khi mang sang máy khác hoặc đóng gói bán thương mại. | Thực thi phần mềm tại: `dist/PhatTrucTiepDaLuong/PhatTrucTiepDaLuong.exe` |

---

## 4. Bảng Thông Số Vận Hành Giao Diện `PHÁT TRỰC TIẾP ĐA LUỒNG v1.0.0` (`09:39 – 11:49`)

```text
[THÔNG SỐ CẤU HÌNH MỖI LUỒNG TRÊN GIAO DIỆN TOOL]:
- Tên luồng:          Luồng 01, Luồng 02, Luồng 03... (Hỗ trợ 10–20 luồng đồng thời)
- RTMP cố định:       rtmp://a.rtmp.youtube.com/live2
- Mã sự kiện (Key):   Dán Stream Key từ YouTube Studio (VD: t08f-u8a6-xbqw-t0kd-2q9d) + Tích chọn [Ghi nhớ mã]
- Tỷ lệ khung hình:   16:9 (Livestream ngang) hoặc 9:16 (Livestream dọc Shorts)
- Căn khung:          Cắt đầy khung (Crop to fill) hoặc Thêm viền đen (Pad)
- Preset & Encoder:   Cân bằng | NVIDIA NVENC (Ưu tiên GPU giảm tải CPU)
- FPS & Bitrate:      27 FPS (hoặc 30 FPS) | Video Bitrate: 5999 kbps | Audio Bitrate: 128 kbps
- Chế độ duy trì:     [x] Lặp video liên tục (Video 53 giây vẫn phát lặp 24/7 không ngắt) | [x] Tự động kết nối lại
```
