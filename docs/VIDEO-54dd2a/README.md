# Quy Trình Sản Xuất Video Xếp Hạng Shorts (Bài 18 - DGMD-M06)

> **Mã video:** `VIDEO-54dd2a` | **Thời lượng:** `20:19` (`1219.55s`) | **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu 100% hình ảnh frame thực tế + phụ đề sạch 180 phân đoạn + kiểm chứng 5 kênh đối thủ `HTTP 200`).

---

## 1. Mục tiêu bài học & Bài toán Doanh thu Ngách Ranking Shorts View Ngoại

Mở đầu học phần **DGMD-M06** (Bài 18), giảng viên hướng dẫn học viên bước vào ngách **YouTube Shorts View Ngoại** thông qua định dạng **Xếp hạng tổng hợp (Ranking Shorts / Top 1–7 Moments)** dựa trên nguyên tắc *Fair Use / Bán Content* (tổng hợp, cắt lọc và bình luận/xếp hạng các khoảnh khắc ngắn có cùng chủ đề từ nhiều nền tảng).

### 1.1. Phân tích hệ thống kênh mẫu triệu view trên màn hình (`00:00 – 01:28`)
Giảng viên mở trực tiếp tài liệu Google Docs **`Online shorts`** (`1gkv9zb6dcbO2ODytCjfxWVbBCTx809E2BD2leca4hzQ`) và thị phạm các kênh đối thủ điển hình:

| STT | Tên kênh & Handle | Số lượng Video / Subscribers | Thành tích nổi bật trên màn hình | Trạng thái HTTP |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Oogway Ranks** (`@Oogway_Ranks`) | `79 video` · `1,13 Tr người đăng ký` | Video top đầu đạt **373 triệu views**, **214 triệu views**, **206 triệu views**, **137 triệu views**, **123 triệu views** (*Ranking Don't Trust Your Eyes Moments*, *Ranking Funniest Trampoline Moments*) | `HTTP 200` |
| 2 | **LADRANKS** (`@Ladrank`) | `87 video` · `130 N người đăng ký` | Video cao nhất đạt **62 triệu views**; chỉ cần 1 video bùng nổ là đủ điều kiện bật kiếm tiền toàn kênh | `HTTP 200` |
| 3 | **Phuc Anh Hoang** (`@PhucAnhHoang-i3e`) | Kênh mẫu trong tài liệu | Các video đạt **150 triệu views**, **93 triệu views**, **46 triệu views**, **35 triệu views** | `HTTP 200` |
| 4 | **Basile Khaber** (`@BasileKhaber`) | Kênh mẫu trong tài liệu | Chuyên tổng hợp và xếp hạng các tình huống hài hước, thể thao, tai nạn bất ngờ | `HTTP 200` |
| 5 | **Omerfaruk Kocatas** (`@OmerfarukKocatas-j4c`) | Kênh mẫu trong tài liệu | Kênh Ranking Shorts view ngoại đạt lượng tương tác lớn | `HTTP 200` |

*(Ghi chú kiểm định: Kênh thứ 6 xuất hiện ở `01:15` là `YR Shorts` / `@YRShorts-629` với `77,8 N người đăng ký` hiện trả về `HTTP 404` trên YouTube do đã đổi tên/xóa kênh nên được lược bỏ khỏi danh sách `competitor_channels` hoạt động).*

### 1.2. Bài toán kinh tế của một video Shorts 300 triệu views (`00:25 – 00:59`)
- Ngay cả khi tính theo mức RPM thấp nhất của thị trường Việt Nam (`$0.02 / 1.000 lượt xem`, tức `$20 / 1 triệu views`), một video đạt **300 triệu views hợp lệ (Engaged views)** đã mang về **`$6.000 USD`**.
- Khi sử dụng tiêu đề và danh mục xếp hạng bằng **Tiếng Anh** để đánh thẳng vào tệp người xem ngoại (Mỹ, Anh, Châu Âu), mức RPM cao gấp nhiều lần giúp mỗi video Shorts bùng nổ dễ dàng thu về **2.000 – 3.000+ USD**.

---

## 2. Tổ hợp Công cụ & Nguồn Tài nguyên Sử dụng

| STT | Công cụ / Nền tảng | Vai trò cụ thể trong quy trình | Địa chỉ / Cài đặt chuẩn |
| :--- | :--- | :--- | :--- |
| 1 | **Douyin (抖音) & Xiaohongshu** | Kho khai thác nguyên liệu video ngắn miễn phí từ thị trường tỷ dân Trung Quốc | Đăng ký tài khoản Douyin bằng số điện thoại Việt Nam |
| 2 | **Google Dịch (`translate.google.com`)** | Dịch từ khóa tìm kiếm (Việt $\rightarrow$ Trung Phồn thể) và dịch tên hạng mục xếp hạng (Việt $\rightarrow$ Anh) | Cặp ngôn ngữ: `Việt -> Trung (Phồn thể)` & `Việt -> Anh` |
| 3 | **Cốc Cốc / Chrome + Snaptik Douyin** | Tải 7 video từ Douyin về máy tính không dính logo (Watermark-free) ở độ phân giải HD | Tìm từ khóa `tải video douyin` $\rightarrow$ Vào `unduhtiktok.com/vi/douyin/` |
| 4 | **CapCut PC** | Cắt ghép 7 video theo khung dọc `9:16`, tách giọng nói khử nhạc nền và thiết kế bảng xếp hạng `1–7` | Phông chữ: `Anton` \| Độ mờ chữ: `50% – 56%` \| Xuất file: `1080p 60fps` |
| 5 | **MyInstants (`myinstants.com`)** | Bổ sung các hiệu ứng âm thanh (Sound Effects) vui nhộn vào video nếu cần | Tùy chọn theo ghi chú trong Google Docs của giảng viên |

---

## 3. Nguyên văn Tài liệu Gốc & Quy trình Tìm Nguồn Video trên Douyin

Toàn bộ nội dung tài liệu Google Docs hiển thị tại `01:24 – 02:20` và bảng từ khóa đã được trích xuất nguyên văn tại [`assets/docs-dgmd/VIDEO-54dd2a/master_prompt.md`](../../assets/docs-dgmd/VIDEO-54dd2a/master_prompt.md).

### 3.1. Nguyên văn Tài liệu `Online shorts` của Giảng viên
```text
Cách tìm nguồn :
- Tìm các từ khóa liên quan , giải trí , ảo thuật , thể thao , động vật hài hước , đồ ăn , gia đình
- có thể lấy các nguồn trên doyin , xiaohongshu , tiktok , youtube , facebook .
- Tải 5 đến 7 video có nội dung giống nhau

Cách làm :
- Sử dụng capcut để sản xuất video , xếp hạng 7 video theo nhu cầu của bạn , yêu cầu sắp xếp mục số 1 video đó để cuối cùng .
- Yêu cầu tắt hết các nhạc nền có trong video , chỉ có để hiệu ứng âm thanh nhạc nền
- Có thể sử dụng thêm hiệu ứng âm thanh trên myinstants để cho vào video
- Đăng tải video cố định bằng điện thoại , sử dụng các nhạc trend ngoại
```

### 3.2. Chiến thuật tìm kiếm 7 video đồng chủ đề trên Douyin (`02:53 – 06:20`)
1. **Tư duy chọn ngách kích thích tò mò:**
   - Khi làm về chủ đề **Đồ ăn (Food)**, thay vì lấy các món ăn bình thường ít gây tranh luận, giảng viên chọn ngách **"Đồ ăn đường phố kỳ lạ / Đồ ăn bẩn ở Ấn Độ"** (những cảnh dùng chân nhào mì, dùng bụng nhào bánh bao, vắt nước cam bằng chân...) vì dạng video này giữ chân khán giả quốc tế cực kỳ mạnh.
   - Tương tự, với chủ đề **Động vật**, hãy tìm **"Động vật hài hước"** (`搞笑动物`).
2. **Dịch từ khóa sang Tiếng Trung:**
   - Mở **Google Dịch**, chọn dịch từ **Tiếng Việt** sang **Tiếng Trung (Phồn thể / Giản thể)**.
   - Gõ từ khóa `đồ ăn Ấn Độ` (`印度菜`) hoặc `đồ ăn bẩn ở Ấn Độ` (`脏兮兮的印度菜`), sao chép kết quả và dán vào thanh tìm kiếm của ứng dụng **Douyin**.
3. **Kỹ thuật đào sâu bằng Thẻ Hashtag (`#` — `05:35 – 06:15`):**
   - Nếu kết quả tìm kiếm trực tiếp có ít video phù hợp, hãy bấm mở một video chuẩn chủ đề (ví dụ video dùng chân nhào bột) rồi **nhấp thẳng vào các thẻ tag (`#`)** nằm ở góc dưới video (như `#印度街头小吃` — *Ăn vặt đường phố Ấn Độ*, hoặc `#干净又卫生` — *Sạch sẽ và hợp vệ sinh*).
   - Douyin sẽ lập tức gom toàn bộ các video cùng ngách về một danh sách để học viên tải liên tiếp đủ **7 video**.
4. **Quy tắc sống còn khi gom nguyên liệu (`03:58 – 04:27`):**
   - **Bắt buộc cả 7 video phải cùng 1 chủ đề duy nhất.** Tuyệt đối không ghép cảnh 1 là đồ ăn, cảnh 2 là con vật, cảnh 3 là gia đình — sự hỗn tạp khiến người xem rời đi ngay và làm video bị flop.
5. **Tải video không logo (`04:36 – 06:20`):**
   - Trong giao diện Douyin, bấm vào mũi tên **Chia sẻ (Share)** $\rightarrow$ Chọn **Sao chép liên kết**.
   - Mở trình duyệt **Cốc Cốc**, tìm từ khóa `video douyin` / `tải video douyin`, truy cập trang **Snaptik Douyin** (`https://unduhtiktok.com/vi/douyin/`), dán link vào ô và bấm **Download $\rightarrow$ Tải chất lượng HD**. Lặp lại cho đến khi đủ 7 video.

---

## 4. Quy trình Biên tập & Thiết kế Bảng Xếp Hạng (Ranking Overlay) trên CapCut PC

### Bước 1: Đưa 7 video vào Timeline, Cắt gọn & Khử nhạc nền bản quyền (`06:20 – 09:35`)
1. Mở **CapCut PC**, nhấn **Tạo dự án**, bấm dấu `+` tại mục **Tệp phương tiện** để nhập cả 7 video vừa tải vào.
2. Kéo 7 video xuống thanh thời gian (Timeline) và đảm bảo khung hình ở tỷ lệ dọc **9:16 (Shorts)**.
3. **Cắt gọn thời lượng:** Những video gốc dài tới `40 – 44 giây` (hoặc video tổng hợp nhiều cảnh) cần được dùng phím tắt **`Ctrl + B` (Tách)** để cắt bỏ phần thừa, chỉ giữ lại đúng phân đoạn đắt giá nhất (`khoảng 8–12 giây/cảnh`).
4. **Khử nhạc nền gốc bằng công cụ Tách giọng nói (`07:50 – 09:36`):**
   - Để tránh 100% lỗi bản quyền âm thanh trên YouTube, bạn **không được giữ bất kỳ bản nhạc nền nào có sẵn từ Douyin/TikTok/Facebook**.
   - **Thao tác nhanh:** Quét chuột bôi đen toàn bộ cả 7 video trên timeline $\rightarrow$ Nhìn sang bảng thuộc tính bên phải chọn tab **Âm thanh** $\rightarrow$ Tích chọn **Tách giọng nói (Vocal Isolation)** $\rightarrow$ Chọn **Chỉ giữ lời**. CapCut sẽ tự động lọc bỏ toàn bộ nhạc nền và chỉ giữ lại tiếng nói/tiếng động hiện trường tự nhiên.

### Bước 2: Thiết kế Tiêu đề Chính đa sắc màu ở đỉnh khung hình (`09:36 – 12:47`)
1. Mở **Google Dịch** (`Tiếng Việt -> Tiếng Anh`), gõ câu: `xếp hạng những món ăn bẩn nhất ở Ấn Độ` $\rightarrow$ Nhận bản dịch tiếng Anh: **`Ranking of the dirtiest foods in India`**.
2. Trên CapCut, vào tab **Văn bản $\rightarrow$ Thêm văn bản mặc định**, dán dòng tiếng Anh vào và dùng **`Shift + Enter`** ngắt làm 2 dòng cân đối ở phía trên cùng của khung hình:
   ```text
   Ranking of the
   dirtiest foods in India
   ```
3. Đổi **Phông chữ (Font)** sang **`Anton`** (phông chữ dày, khỏe, chuẩn phong cách Ranking quốc tế).
4. **Kỹ thuật tô màu từng từ (Word-by-word Coloring — `11:30 – 12:25`):**
   - Nếu để cả tiêu đề chỉ có 1 màu trắng hoặc 1 mẫu hiệu ứng sẵn có, người xem sẽ lướt qua mà không đọc.
   - Hãy dùng chuột **bôi đen từng từ riêng lẻ** ngay trong ô nhập văn bản (tab *Cơ bản*) và chọn màu sắc nổi bật cho từng từ:
     - `Ranking` $\rightarrow$ **Màu Vàng**
     - `of` $\rightarrow$ **Màu Xanh dương**
     - `the` $\rightarrow$ **Màu Cam**
     - `dirtiest` $\rightarrow$ **Màu Xanh lá**
     - `foods` $\rightarrow$ **Màu Trắng**
     - `in` $\rightarrow$ **Màu Đen viền trắng**
     - `India` $\rightarrow$ **Màu Đỏ**
5. Kéo dài lớp văn bản tiêu đề phủ suốt từ giây đầu tiên đến hết video thứ 7.

### Bước 3: Dựng Cột Số Thứ Tự `1. -> 7.` dọc sườn trái (`12:48 – 14:51`)
1. Chọn lớp văn bản tiêu đề vừa làm, nhấn **`Ctrl + C`** rồi **`Ctrl + V`** để nhân bản ra lớp văn bản thứ 2.
2. Xóa nội dung cũ và gõ danh sách số thứ tự từ `1.` đến `7.` theo chiều dọc (dùng **`Shift + Enter`** sau mỗi số):
   ```text
   1.
   2.
   3.
   4.
   5.
   6.
   7.
   ```
3. Đặt cột số thứ tự này nằm dọc sát mép trái màn hình (từ khoảng giữa khung hình trở xuống).
4. Bôi đen từng con số từ `1.` đến `7.` để đổi sang 7 màu sắc/hiệu ứng khác nhau (trắng, vàng, sọc 3D, tím hồng, đỏ, xanh lá...) sao cho hài hòa và bắt mắt.

### Bước 4: Chiến thuật Đảo Thứ Tự Xếp Hạng (Retention Trick) & Điền tên 7 món ăn (`14:52 – 18:43`)
1. **Nguyên lý giữ chân người xem (`15:03 – 15:48`):**
   - Khán giả xem video xếp hạng luôn tò mò muốn biết **"Cái nào đứng vị trí Số 1 (Top 1)?"**.
   - Vì vậy, **bắt buộc phải xếp mục Số 1 xuất hiện ở cuối cùng (hoặc áp chót)** và đảo lộn thứ tự xuất hiện của các mục trước đó (ví dụ: `6 -> 7 -> 3 -> 5 -> 2 -> 1 -> 4`).
2. **Thao tác điền tên 7 hạng mục trên Timeline (`15:48 – 18:15`):**
   - Mỗi khi chuyển sang một clip món ăn mới, dùng Google Dịch dịch tên món đó sang tiếng Anh, nhân bản lớp chữ (font `Anton`, chữ trắng viền đen, cỡ chữ `15`) và đặt nằm ngang hàng với con số được gán:
     - **Clip 1 (`00:00`):** *Món chả làm bằng chân* $\rightarrow$ `meatballs made with feet` $\rightarrow$ Đặt cạnh số **`6.`**
     - **Clip 2 (`00:10`):** *Bánh bao nhào bằng bụng* $\rightarrow$ `steamed buns kneaded with the belly` $\rightarrow$ Đặt cạnh số **`7.`**
     - **Clip 3 (`00:20`):** *Bánh chiên bằng chân* $\rightarrow$ `fried cakes made with feet` $\rightarrow$ Đặt cạnh số **`3.`**
     - **Clip 4 (`00:31`):** *Bánh mì chan súp* $\rightarrow$ `bread with soup` $\rightarrow$ Đặt cạnh số **`5.`**
     - **Clip 5 (`00:41`):** *Nước súp thần thánh* $\rightarrow$ `divine soup` $\rightarrow$ Đặt cạnh số **`2.`**
     - **Clip 6 (`00:58`):** *Mì nhào bằng chân* $\rightarrow$ `Pasta kneaded with feet` $\rightarrow$ Đặt cạnh số **`1.`** *(Top 1 xuất hiện ở clip áp chót)*
     - **Clip 7 (`01:08`):** *Món ăn sáng hàng ngày* $\rightarrow$ `daily breakfast` $\rightarrow$ Đặt cạnh số **`4.`**

### Bước 5: Hạ Độ Mờ (Opacity 50–56%), Xuất File 60fps & Đăng bằng Điện thoại (`18:15 – 20:19`)
1. Đưa thanh thời gian về điểm kết thúc của video số 7, bôi đen toàn bộ các lớp chữ bị dư ra phía sau và nhấn **`Ctrl + B`** rồi xóa phần thừa để các lớp chữ kết thúc bằng nhau.
2. **Chỉnh Độ mờ (Opacity — `18:44 – 19:05`):**
   - Bôi đen toàn bộ 7 lớp chữ tên món ăn $\rightarrow$ Vào tab **Văn bản $\rightarrow$ Cơ bản** $\rightarrow$ Kéo xuống mục **Độ mờ (Opacity)** và giảm từ `100%` xuống còn **`50% – 56%`**.
   - Việc làm mờ nhẹ giúp danh sách chữ trở nên trong suốt vừa phải, khán giả vẫn đọc rõ thứ hạng nhưng không bị chữ che khuất cảnh chế biến món ăn ở giữa màn hình.
3. **Xuất video & Đăng tải chuẩn thuật toán Shorts (`19:05 – 19:30`):**
   - Nhấn nút **Xuất (Export)**: Đặt tên file là `ranking`, chọn độ phân giải **`1080p`** và tỷ lệ khung hình **`60fps`**.
   - Chuyển file video sang **điện thoại** để đăng tải trực tiếp qua ứng dụng YouTube và **chọn chèn nhạc nền từ thư viện Nhạc Trend Ngoại trên YouTube Shorts** (đảm bảo 100% an toàn bản quyền và được hưởng luồng đề xuất theo nhạc thịnh hành).

---

## 5. Bảng Mốc Thời Gian Chi Tiết (Key Timestamps)

| Thời gian | Giây (`seconds`) | Nội dung chi tiết trong bài giảng |
| :--- | :---: | :--- |
| `00:00` | `0s` | Phân tích kênh mẫu `@Oogway_Ranks` (video đạt 373 triệu views), `@Ladrank` (62 triệu views) & Bài toán doanh thu Shorts ngoại |
| `01:24` | `84s` | Xem tài liệu Google Docs `Online shorts` & Tư duy khai thác kho video miễn phí từ thị trường tỷ dân Douyin, Xiaohongshu |
| `02:53` | `173s` | Sử dụng Google Dịch chuyển từ khóa sang tiếng Trung Phồn thể & Tìm kiếm 7 video cùng chủ đề trên ứng dụng Douyin |
| `04:27` | `267s` | Sao chép link Douyin, tải 7 video không dính logo qua Snaptik Douyin (`unduhtiktok.com`) & Mẹo đào sâu bằng thẻ Hashtag (`#`) |
| `06:20` | `380s` | Đưa 7 video vào CapCut khung dọc, cắt chọn phân cảnh đắt giá & Dùng `Tách giọng nói` để xóa sạch nhạc nền bản quyền |
| `09:36` | `576s` | Tạo tiêu đề tiếng Anh (`Ranking of the dirtiest foods in India`) với phông `Anton` & Kỹ thuật bôi đen đổi màu từng chữ |
| `12:48` | `768s` | Nhân bản lớp chữ để dựng cột số thứ tự `1–7` đa sắc màu dọc bên trái khung hình |
| `14:52` | `892s` | Chiến thuật đảo thứ tự xếp hạng giữ chân người xem (giấu Top 1 ở cuối) & Ghép tên tiếng Anh cho 7 món ăn Ấn Độ |
| `18:15` | `1095s` | Cắt bằng các lớp chữ, hạ Độ mờ (`Opacity 50–56%`), xuất file `1080p 60fps` & Quy tắc đăng bằng điện thoại kèm nhạc trend |
