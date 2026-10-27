# Bộ Tài Liệu Thực Chiến & Master Prompt: Quy Trình Đăng Video Chuẩn SEO Trên Máy Tính

> **SKU:** `VIDEO-4483df` · **Bài học:** Bài 42 (`DGMD-M10`) — *Quy Trình Đăng Video Chuẩn SEO Trên Máy Tính*  
> **Nguồn gốc:** Trích xuất nguyên bản 100% từ slide `UP VIDEO NÊN NHỚ` và thao tác thực tế trên kênh `@ChillBuồnStudio` (`YouTube Studio` + `ChatGPT`) trong bài giảng.

---

## 1. Công Thức 5 Nguyên Tắc Vàng Khi Upload Video Chuẩn SEO (`00:00 – 00:25`)

Khi tải bất kỳ video nào lên YouTube trên máy tính, nhà sáng tạo bắt buộc phải kiểm tra đủ **5 yếu tố cốt lõi** xuất hiện trên slide gốc của giảng viên:

```text
UP VIDEO NÊN NHỚ:
1. Tiêu đề có từ khóa (Kết hợp tính năng Thử nghiệm A/B 3 tiêu đề trên YouTube Studio)
2. Thumbnail rõ ràng (Đổi tên file ảnh chứa từ khóa chính trước khi upload)
3. Mô tả có từ khóa (Viết câu mở đầu chứa từ khóa chính + Nhờ ChatGPT triển khai đoạn văn)
4. 3 đến 5 hashtag (Chỉ gắn 3–5 thẻ #hashtag và 3–5 thẻ từ khóa ẩn, tuyệt đối không spam)
5. Hook mạnh 3 giây đầu (Giữ chân khán giả ngay khi bấm vào video)
```

---

## 2. Quy Tắc Đổi Tên File Gốc (Raw File SEO) Trước Khi Tải Lên (`00:25 – 01:21`)

Tuyệt đối không để tên file mặc định do phần mềm render xuất ra (như `ABCD.mp4` hoặc chuỗi UUID `ceba040d-f144-4eac-a141-86dce37d78de.jpg`). Trước khi bấm nút **Tải video lên**, phải đổi tên cả 2 tệp trong thư mục máy tính trùng khớp với từ khóa chính để thuật toán YouTube đọc hiểu siêu dữ liệu tệp:

- **Tệp Video (`.mp4`):** `doraemon đến thăm việt nam.mp4`
- **Tệp Ảnh thu nhỏ Thumbnail (`.jpg`/`.png`):** `doraemon đến thăm việt nam.jpg`

---

## 3. Bộ Câu Lệnh ChatGPT Hỗ Trợ Tối Ưu Hóa SEO Khi Đăng Video (`02:16 – 06:45`)

### 3.1. Câu lệnh tạo biến thể Tiêu đề cho tính năng "Thử nghiệm A/B" (A/B Title Testing)
Trong giao diện đăng video của **YouTube Studio**, bấm vào nút **`Thử nghiệm A/B`** $\rightarrow$ chọn tab **`Chỉ tiêu đề`**, sau đó dùng câu lệnh sau trên **ChatGPT**:

```text
[TIÊU ĐỀ GỐC CỦA BẠN] , tạo cho tôi thêm 2 tiêu đề bám sát tiêu đề gốc
```

**Ví dụ thực tế trên màn hình (`02:25` — Kênh `Chill Buồn Studio`):**
- **Prompt nhập vào ChatGPT:**
  ```text
  Bài hát Doraemon đến thăm việt nam , tạo cho tôi thêm 2 tiêu đề
  ```
- **3 Tiêu đề nạp vào khung Thử nghiệm A/B của YouTube Studio (`02:45`):**
  1. **Tiêu đề 1 (Gốc):** `Bài hát Doraemon đến thăm việt nam` (Từ khóa chính: `Bài hát`, `Doraemon`, `đến thăm Việt Nam`)
  2. **Tiêu đề 2:** `Doraemon Ghé Thăm Việt Nam`
  3. **Tiêu đề 3:** `Doraemon Du Ngoạn Việt Nam`

---

### 3.2. Câu lệnh viết Mô tả Video chứa Từ khóa & 3–5 Hashtag chuẩn SEO (`03:49`)
Dán câu lệnh này vào **ChatGPT** để tạo phần mô tả tự nhiên không bị tính là nhồi nhét từ khóa (Keyword Stuffing):

```text
Tôi đang làm một video YouTube có tiêu đề "[TIÊU ĐỀ VIDEO]". Nội dung chính của video nói về [TÓM TẮT 1-2 CÂU VỀ NỘI DUNG VIDEO].
Hãy viết cho tôi một đoạn mô tả video chuẩn SEO (khoảng 3-5 dòng) chứa tự nhiên cụm từ khóa chính ở ngay câu đầu tiên, kèm theo đúng 3 đến 5 thẻ #hashtag liên quan nhất ở cuối bài (tuyệt đối không dùng quá 5 hashtag để tránh lỗi lạm dụng từ khóa).
```

**Mẫu Mô tả & Hashtag thực tế trên màn hình (`04:09`):**
```text
Doraemon cùng nhóm bạn đến thăm việt nam
#doraemon #baihat #nobita #music
```

---

### 3.3. Câu lệnh quy đổi Khung Giờ Vàng Đăng Video theo Quốc Gia Mục Tiêu (`06:24`)
Tuyệt đối không đăng video lúc 1 giờ đêm theo giờ của quốc gia mục tiêu. Trước khi chọn chế độ **Công khai** hoặc **Lên lịch**, hỏi **ChatGPT**:

```text
Tôi đang làm kênh YouTube hướng tới khán giả tại [TÊN QUỐC GIA: ví dụ Hoa Kỳ / Việt Nam].
Hiện tại giờ Việt Nam đang là [GIỜ VIỆT NAM HIỆN TẠI, ví dụ: 5 giờ chiều]. Hãy cho tôi biết bên [TÊN QUỐC GIA] hiện tại là mấy giờ theo các múi giờ chính (EST/PST) và đề xuất khung giờ vàng khi người dân nước đó vừa thức dậy hoặc đang trong giờ cao điểm giải trí để tôi bấm Xuất bản video.
```

---

## 4. Bảng Checklist Cấu Hình Kỹ Thuật Trong YouTube Studio Trước Khi Bấm Xuất Bản (`04:33 – 06:50`)

| Hạng mục trong YouTube Studio | Thiết lập chuẩn thực chiến | Lý do / Tác dụng thuật toán |
| :--- | :--- | :--- |
| **1. Đối tượng người xem** | Chọn: **`Không, nội dung này không dành cho trẻ em`** | Mở khóa bình luận, quảng cáo cá nhân hóa và tính năng đề xuất |
| **2. Nội dung đã chỉnh sửa (Sử dụng AI)** | Chọn: **`Có`** *(nếu dùng AI tạo hình ảnh/âm thanh chân thực)* | Tuân thủ chính sách công bố nội dung sinh bằng AI của YouTube |
| **3. Thẻ từ khóa ẩn (Tags)** | Chỉ điền **`3 – 5 thẻ`** chính (VD: `Bài hát`, `Doraemon`, `Việt Nam`) | Từ khóa chính đã nằm ở Tiêu đề; chỉ thêm 3–5 thẻ phụ trợ chống lỗi chính tả |
| **4. Danh mục (Category)** | Chọn đúng **1 trong 15 danh mục** khớp với nội dung (VD: Làm nhạc chọn **`Nhạc`**) | Định hướng thuật toán phân phối đúng tệp khán giả (Không làm truyện/tin tức mà chọn Nhạc) |
| **5. Kiểm tra (Checks)** | Đợi báo: **`Đã kiểm tra xong. Không phát hiện vấn đề nào.`** | Đảm bảo video sạch bản quyền 100% trước khi phát hành |
| **6. Chế độ hiển thị** | Chọn **`Công khai`** (hoặc **`Lên lịch`**) vào đúng khung giờ thức dậy của quốc gia mục tiêu | Đón luồng người xem trực tuyến cao điểm ngay khi video vừa xuất bản |
