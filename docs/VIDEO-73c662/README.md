# Quy Trình Sản Xuất Video PODCAST Sức Khỏe (Bài 19 - DGMD-M06)

> **Mã video:** `VIDEO-73c662` | **Thời lượng:** `22:23` (`1343.65s`) | **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu 100% hình ảnh frame thực tế + phụ đề sạch 239 phân đoạn + tài liệu gốc `doc_1.txt` + kiểm chứng 2 kênh mẫu `HTTP 200`).

---

## 1. Mục tiêu bài học & Phân tích Kênh mẫu (Case Study)

Trong Bài 19 thuộc học phần **DGMD-M06**, giảng viên hướng dẫn quy trình sản xuất trọn gói từ A–Z dòng video **Podcast Sức Khỏe Chủ Động dành cho người trung niên & cao tuổi (50–60+ tuổi)** hoàn toàn bằng AI. Điểm đột phá của quy trình này là giải quyết triệt để bài toán **Nhất quán 100% nhân vật Bác sĩ AI và Nhất quán 100% giọng đọc tiếng Việt trầm ấm** xuyên suốt hàng trăm video trên kênh.

### 1.1. Hai kênh đối thủ thực tế trên màn hình (`00:08 – 01:38`)
Giảng viên mở trực tiếp 2 kênh đang tăng trưởng thần tốc trong ngách Sức khỏe người cao tuổi tại Việt Nam:

| STT | Tên kênh & Handle | Số lượng Video / Subscribers | Video nổi bật trên màn hình | Trạng thái HTTP |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **BS. Minh Tâm 60+** (`@BsMinhTâm60`) | `7 video` · `21,9 N người đăng ký` | *Huyết áp lý tưởng cho người TRÊN 60 TUỔI là bao nhiêu? Bác sĩ giải thích rất rõ* (`23:04` — đạt **540 N lượt xem** sau 11 ngày); *TẠI SAO Nhóm Máu Lại Có Thể Ảnh Hưởng Đến Tuổi Thọ?* (**341 N lượt xem** sau 3 ngày) | `HTTP 200` |
| 2 | **Podcast Tim Mạch** (`@PodcastTimMạch`) | `21,6 N người đăng ký` | *KHÔNG THỂ TIN ĐƯỢC: Đây là 5 loại trái cây âm thầm đẩy người già vào nguy cơ ĐỘT QUỴ* (`youtube.com/watch?v=fyLVMWok2kM` — đạt **453 N lượt xem** sau 11 ngày) | `HTTP 200` |

### 1.2. Cấu trúc thị giác giữ chân khán giả lớn tuổi (Split-Screen Podcast Layout)
Quan sát video của kênh `@PodcastTimMạch` (`01:10 – 01:35`), giảng viên chỉ rõ cấu trúc màn hình gồm **3 thành phần cố định**:
1. **Khung nền giao diện (Overlay Frame `16:9`):** Phía trên có bảng tên chương trình (*Podcast Tim Mạch* $\rightarrow$ đổi thành *Podcast Sức Khỏe Chủ Động*) kèm biểu tượng nhịp tim, ống nghe y tế; ở giữa đục thủng 2 khung cửa sổ; phía dưới cùng có dải băng ngang để chạy phụ đề chữ lớn cho cô chú dễ đọc.
2. **Khung cửa sổ dọc bên phải (`9:16`):** Nhân vật Bác sĩ nam người Việt Nam đeo kính, mặc áo blouse/scrubs ngồi tại phòng làm việc bệnh viện, nhìn thẳng ống kính trò chuyện điềm tĩnh với khẩu hình môi khớp từng chữ.
3. **Khung cửa sổ ngang bên trái:** Chiếu các đoạn video minh họa y khoa (B-Roll: máy đo huyết áp, mạch máu, thực phẩm, người cao tuổi tập thể dục...) thay đổi liên tục theo lời giảng của bác sĩ.

---

## 2. Tổ hợp Công cụ Sử dụng trong Quy trình

| STT | Công cụ / Nền tảng | Vai trò cụ thể trong quy trình | Cấu hình kỹ thuật cố định |
| :--- | :--- | :--- | :--- |
| 1 | **ChatGPT Plus / Pro (`chatgpt.com`)** | (1) Thiết kế lại Khung nền 2 ô phông xanh; (2) Tạo ảnh chân dung Bác sĩ `9:16`; (3) Chạy Master Prompt sinh 100 ý tưởng & viết kịch bản chi tiết 17 phần | Dùng công cụ `Tạo ảnh` (Image Generation) cho Bước 1 & Bước 2 |
| 2 | **Google Flow (`Veo 3` & `Nano Banana Pro`)** | (1) Dùng **Veo 3** tạo các đoạn video 8s Bác sĩ nói chuyện khớp khẩu hình + khóa giọng nói; (2) Dùng **Nano Banana Pro** tạo ảnh Thumbnail `16:9` | Video: `Veo 3 \| 9:16 \| 1x` (+ Ảnh Bác sĩ + Giọng nói) \| Ảnh bìa: `Nano Banana Pro \| 16:9 \| x2` |
| 3 | **Pexels (`pexels.com`) & Pixabay** | Tìm và tải miễn phí các video B-Roll y tế, đo huyết áp, tim mạch, bệnh viện để lồng vào ô cửa sổ bên trái | Bộ lọc: `Video` \| Từ khóa: `huyết áp`, `sức khỏe`, `tim mạch` |
| 4 | **CapCut PC (CapCut Pro)** | Xóa phông xanh khung nền, ghép video Bác sĩ + video B-Roll, tạo phụ đề tự động tiếng Việt và thiết kế chữ trên ảnh bìa Thumbnail | Xóa nền: `Phông xanh (Chroma Key)` \| Phụ đề & Thumbnail: Phông chữ `Anton` |

---

## 3. Hệ thống 4 Prompt Kỹ thuật & Master Prompt 7 Phần

Toàn bộ câu lệnh gốc của giảng viên được lưu trữ đầy đủ tại [`assets/docs-dgmd/VIDEO-73c662/master_prompt.md`](../../assets/docs-dgmd/VIDEO-73c662/master_prompt.md) và [`assets/docs-dgmd/VIDEO-73c662/doc_1.txt`](../../assets/docs-dgmd/VIDEO-73c662/doc_1.txt).

### 3.1. Bước 1 — Tạo Khung hình nền Overlay 2 cửa sổ phông xanh (`01:02 – 03:49`)
1. Mở một video của kênh mẫu `@PodcastTimMạch`, bấm tổ hợp phím chụp màn hình đúng toàn bộ khung hình `16:9` của video đó và dán vào **ChatGPT**.
2. Dán **Prompt tạo ảnh nền** (lưu ý nhắc ChatGPT xóa luôn dòng phụ đề cũ bị dính ở đáy ảnh chụp):
   ```text
   ảnh nền : xóa bỏ cho tôi 2 chi tiết trong 2 khung hình bên phải và bên trái , giữ nguyên các khung , thay đổi các khung sang màu đỏ , thay đổi dòng chữ podcast tim mạch , sang dòng chữ podcast sức khỏe chủ động , còn lại giữ nguyên chi tiết , đổi 2 nền trong 2 khung hình sang màu xanh lá cây hình ảnh sắc nét, kích thước hình ảnh 16.9 , xóa bỏ dòng chữ ở phía dưới
   ```
3. ChatGPT sẽ xuất ra một bức ảnh khung giao diện `16:9` hoàn toàn mới mang tên **`Podcast Sức Khỏe Chủ Động`**, trong đó cả ô cửa sổ lớn bên trái và ô cửa sổ dọc bên phải đều được phủ **màu xanh lá cây (Green Screen)** sẵn sàng để tách nền trên CapCut.

### 3.2. Bước 2 — Tạo Nhân vật Bác sĩ Việt Nam độc bản (`9:16` — `03:50 – 05:02`)
1. Chụp màn hình riêng khung hình nhân vật bác sĩ của kênh mẫu, dán vào ChatGPT kèm câu lệnh yêu cầu **sinh ra một câu Prompt mới** (tuyệt đối không tạo ảnh ngay trong luồng chat đang chứa ảnh gốc của đối thủ để tránh giống mặt người cũ):
   ```text
   ảnh nhân vật : hãy tạo cho tôi 1 prompt để tạo lại hình ảnh này , sáng tạo 1 prompt tạo ảnh bác sĩ , 1 nhân vật bác sĩ nam người việt nam , mặc bộ trang phục quần áo bác sĩ , có đeo kính , nhìn tri thức , bối cảnh phía sau là nơi làm việc trong bệnh viện , hình ảnh 9.16 , hình ảnh sắc nét , yêu cầu chi tiết nhân vật tư thế như hình ảnh gốc mà tôi gửi .
   ```
2. Sao chép đoạn Prompt tiếng Việt/tiếng Anh mà ChatGPT vừa viết ra $\rightarrow$ Mở một **Đoạn chat mới (New Chat)** $\rightarrow$ Chọn công cụ **Tạo ảnh** $\rightarrow$ Dán Prompt vào để ChatGPT vẽ một bức chân dung **Bác sĩ nam Việt Nam tỷ lệ dọc `9:16`** cực kỳ sắc nét.
3. Tải bức ảnh Bác sĩ này về máy: **Đây sẽ là gương mặt đại diện cố định xuyên suốt 100% các video trên kênh của bạn.**

### 3.3. Bước 3 & 4 — Chạy Master Prompt 100 Ý tưởng & Viết Kịch bản 17 mục (`05:03 – 09:02`)
1. Mở một đoạn chat mới trên ChatGPT, sao chép toàn bộ **Master Prompt 7 Phần** (từ dòng *"Bạn là chuyên gia sáng tạo nội dung podcast sức khỏe cho người Việt Nam..."* đến hết *"Bắt đầu thực hiện ngay"* trong file `doc_1.txt`) và gửi cho ChatGPT.
2. ChatGPT sẽ tự động quy hoạch **100 chủ đề Podcast sức khỏe** chia đều vào **10 nhóm bệnh lý cốt lõi của tuổi 50–60+**:
   - *Nhóm 1:* Tim mạch, huyết áp, đột quỵ (Ý tưởng 1–10)
   - *Nhóm 2:* Tiểu đường, đường huyết, biến chứng (Ý tưởng 11–20)
   - *Nhóm 3:* Mỡ máu, gan nhiễm mỡ, béo bụng (Ý tưởng 21–30)
   - *Nhóm 4:* Thận, tiểu đêm, phù chân, suy thận (Ý tưởng 31–40)
   - *Nhóm 5 – Nhóm 10:* Trí nhớ/Tuần hoàn não, Giấc ngủ, Xương khớp, Dinh dưỡng, Thuốc men, Lối sống chủ động.
3. Khi ChatGPT đang liệt kê, bạn có thể bấm nút **Dừng (Stop)** ở khoảng ý tưởng thứ 25–30, sau đó copy **Ý tưởng số 1** (*"Bác sĩ cảnh báo: Con số huyết áp đẹp chưa chắc trái tim đã khỏe"*) dán xuống ô chat để yêu cầu ChatGPT viết thành **Kịch bản Podcast hoàn chỉnh đủ 17 phần** (Từ *Tiêu đề chính*, *Hook mở đầu 30–60 giây*, *Lời chào*, *Giải thích sai lầm*, *Câu chuyện bệnh nhân*... đến *Cảnh báo y khoa* và *Gợi ý tập tiếp theo*).

---

## 4. Sản xuất Video Bác Sĩ AI Nhất Quán Giọng Nói trên Google Flow (Veo 3) (`09:03 – 13:08`)

Đây là kỹ thuật quan trọng nhất giúp nhân vật Bác sĩ giữ nguyên 100% khuôn mặt và 100% giọng đọc qua hàng chục phân đoạn:

1. Truy cập **Google Flow** (`labs.google/fx/vi/tools/flow`), nhấn **Tạo dự án mới**.
2. **Khóa chặt 2 thành phần tham chiếu (Ingredients) vào ô câu lệnh (`09:08 – 09:50`):**
   - **Thành phần 1 (Nhân vật):** Nhấn nút tải lên hình ảnh **Bác sĩ `9:16`** vừa tạo ở Bước 2 và bấm **Thêm vào câu lệnh**.
   - **Thành phần 2 (Giọng nói):** Nhấn vào biểu tượng dấu **`+`** trong khung prompt $\rightarrow$ Chọn mục **Giọng nói (Voice)** $\rightarrow$ Chọn một **giọng nam trầm ấm** bất kỳ. Lúc này trên đầu khung nhập lệnh sẽ xuất hiện cố định 2 biểu tượng: `[Ảnh Bác sĩ] + [Icon Giọng nói]`.
3. Thiết lập chế độ tạo: **`Video | Tỷ lệ dọc 9:16 | Số lượng 1x`** (sử dụng mô hình **Veo 3**).
4. Dán **Prompt tạo video Veo 3** vào ô lệnh:
   ```text
   Sử dụng hình ảnh gốc này , hãy tạo cho tôi 1 video podcast chân thực , giữ nguyên 100% nhân vật nam trong ảnh , khuân mặt , kiểu tóc , kính mắt , trang phục , tư thế ngồi , Camera cố định hoàn toàn ở một góc chính diện trung cảnh, không zoom, không lia máy, không rung máy, không thay đổi bố cục. Nhân vật nam ngồi yên trên ghế, cơ thể gần như không di chuyển, chỉ có chuyển động tự nhiên rất nhẹ ở môi, mắt và nét mặt khi nói. Ánh mắt nhìn thẳng vào camera, biểu cảm nghiêm túc, điềm tĩnh, có chiều sâu như một người nói podcast ,Không thêm nhân vật khác, không thay đổi bối cảnh, không thêm hiệu ứng, không thêm chữ trên màn hình, không thêm nhạc nền, không thêm âm thanh phụ.
   Nhân vật nam nói bằng tiếng việt , với giọng rõ ràng, chậm rãi , truyền cảm , phù hợp phong cách kể podcast .
   "câu thoại "
   Yêu cầu kỹ thuật: không thêm từ hoặc bớt từ vào câu thoại ,video chân thực, phong cách phỏng vấn tài liệu, ánh sáng tự nhiên ấm áp, môi khớp chính xác với lời thoại tiếng Việt, biểu cảm tự nhiên, không cử động tay, không quay đầu, không thay đổi góc máy, giữ nguyên nhân vật và toàn bộ bối cảnh như ảnh gốc.
   ```
5. **Cách chia câu thoại cho chuẩn khung 8 giây của Veo 3 (`10:10 – 12:55`):**
   - Mỗi lần tạo video trên Veo 3 có độ dài khoảng **8 giây**. Do đó, học viên quay sang kịch bản của ChatGPT (bắt đầu từ mục *3. Hook mở đầu 30–60 giây*) và **copy từng câu ngắn (khoảng 15–22 từ)** dán thay thế vào vị trí `"câu thoại"`:
     - *Đoạn 1:* `"Nhiều cô chú ở nhà có máy đo huyết áp. Sáng ngủ dậy đo một lần, thấy 120/80. Chiều đo lại, thấy cũng đẹp."` $\rightarrow$ Bấm **Tạo (Generate)**.
     - *Đoạn 2:* Ngay khi bấm tạo Đoạn 1, nhấn nút **Sử dụng lại câu lệnh (Reuse prompt)** $\rightarrow$ Ảnh Bác sĩ, Giọng nói và toàn bộ Prompt kỹ thuật được giữ nguyên, chỉ cần xóa câu thoại số 1 và dán câu số 2: `"Con số huyết áp đẹp không phải lúc nào cũng có nghĩa là trái tim đang hoàn toàn khỏe."` $\rightarrow$ Bấm **Tạo**.
     - *Đoạn 3:* Tiếp tục bấm **Sử dụng lại câu lệnh**, dán câu số 3: `"Nếu huyết áp nhìn có vẻ bình thường, nhưng cô chú lại thường xuyên chóng mặt, hụt hơi khi đi bộ, nặng ngực..."`
   - Nếu có phân đoạn nào báo lỗi quá tải máy chủ (*"Không thành công - Flow đang có lượng truy cập cao"*), chỉ cần bấm biểu tượng **Tạo lại (Retry)** hoặc **Sử dụng lại câu lệnh** cho đoạn đó. Sau khi hoàn tất, tải toàn bộ các clip 8s về máy.

---

## 5. Tải Video B-Roll Y Tế & Biên tập Ghép Khung trên CapCut PC (`13:09 – 18:48`)

### Bước 1: Tải video minh họa sức khỏe miễn phí từ Pexels / Pixabay (`13:09 – 14:03`)
1. Truy cập **Pexels** (`pexels.com/vi-vn/`), chuyển sang bộ lọc **Video** và gõ từ khóa **`huyết áp`** hoặc **`sức khỏe`**.
2. Bấm vào một video cảnh bác sĩ đo huyết áp hoặc người cao tuổi kiểm tra sức khỏe, sau đó kéo xuống phần **Video tương tự (Related Videos)** ở bên dưới để tải liên tiếp 5–10 video minh họa chất lượng HD miễn phí bản quyền.

### Bước 2: Ráp bố cục 3 lớp & Xóa phông xanh trên CapCut PC (`14:04 – 17:13`)
1. Mở **CapCut PC**, nhập toàn bộ: (1) Tấm ảnh **Khung nền 16:9**, (2) Các clip **Bác sĩ AI nói chuyện**, và (3) Các clip **B-Roll Pexels**.
2. Kéo tấm ảnh **Khung nền 16:9** lên **Lớp hình ảnh trên cùng (Top Overlay Track)**:
   - Chọn ảnh Khung nền $\rightarrow$ Vào tab **Video $\rightarrow$ Xóa nền $\rightarrow$ Phông xanh (Chroma Key)**. *(Tuyệt đối không dùng "Xóa tự động")*.
   - Dùng bút chấm màu vào ô màu xanh lá cây và kéo thanh **Cường độ (Strength)** lên khoảng `20` để đục thủng hoàn toàn 2 ô cửa sổ thành trong suốt.
3. **Lắp nhân vật Bác sĩ vào ô bên phải (`14:46 – 15:55`):**
   - Kéo các đoạn video 8s của Bác sĩ đặt vào lớp bên dưới ảnh Khung nền.
   - Ở clip Bác sĩ đầu tiên, thu nhỏ và di chuyển khung hình Bác sĩ nằm vừa khít vào ô cửa sổ dọc bên phải. Đối với các clip Bác sĩ tiếp theo, có thể copy thuộc tính vị trí hoặc kéo nối tiếp để bác sĩ đứng yên cố định một chỗ từ đầu đến cuối.
4. **Lắp video B-Roll vào ô bên trái (`16:00 – 17:13`):**
   - Kéo các video B-Roll tải từ Pexels đặt vào lớp dưới cùng, chỉnh tốc độ nhanh lên một chút (`1.3x`) và căn chỉnh kích thước lọt gọn vào ô cửa sổ ngang bên trái (nằm dưới lớp Khung nền phông xanh nên viền thừa sẽ được che kín đẹp mắt).

### Bước 3: Tạo Phụ đề Tự động Tiếng Việt cỡ lớn (`17:14 – 18:48`)
1. Vào mục **Văn bản $\rightarrow$ Phụ đề tự động**, chọn ngôn ngữ **Tiếng Việt** rồi nhấn **Tạo**.
2. Chọn toàn bộ dải phụ đề vừa sinh ra $\rightarrow$ Đổi phông chữ sang **`Anton`**, chữ màu trắng viền đen, cỡ chữ khoảng `10`.
3. Đặt dòng phụ đề nằm ngay trên dải băng xanh dương dưới đáy khung hình; với những câu dài bị ngắt làm 2 dòng, hãy nắm kéo rộng hai đầu khung giới hạn văn bản ra để phụ đề luôn hiển thị gọn gàng trên **1 dòng duy nhất**.

---

## 6. Thiết kế Ảnh bìa Thumbnail Bác Sĩ Đau Cổ Chuẩn CTR Cao (`18:49 – 22:23`)

1. **Tạo phôi ảnh Bác sĩ `16:9` trên Google Flow (`18:49 – 20:08`):**
   - Quay lại cửa sổ **Google Flow**, giữ nguyên bức ảnh Bác sĩ gốc làm tham chiếu, bấm chuyển từ chế độ *Video* sang **`Hình ảnh (Image) | Tỷ lệ 16:9 | Số lượng x2 | Mô hình Nano Banana Pro`**.
   - Dán **Prompt tạo ảnh Thumbnail**:
     ```text
     hãy tạo cho tôi 1 hình ảnh , góc nhìn trung cảnh nhân vật bác sĩ này , nhân vật đang có cảm giác bị đau cổ , bối cảnh nơi làm việc trong bệnh viện , chỉ có 1 mình nhân vật bác sĩ không có thêm nhân vật nào khác trong khung hình , nhân vật được đặt vị trí phía bên tay trái sát phía bên trái hình ảnh , hình ảnh 16.9 , hình ảnh sắc nét
     ```
   - Tải bức ảnh Bác sĩ đang ôm cổ nhăn mặt đứng ở phía bên trái hành lang bệnh viện về máy (phía bên phải bức ảnh trống trải để đặt chữ). Ở các video sau, bạn chỉ cần đổi cụm từ `"bị đau cổ"` thành `"bị đau ngực"`, `"đau vai"`, `"đau chân"` để toàn bộ Thumbnail trên kênh đồng bộ 100% bối cảnh bệnh viện và gương mặt bác sĩ!
2. **Thiết kế chữ Thumbnail trực tiếp trong CapCut PC (`20:09 – 21:55`):**
   - Ngay trên đầu timeline CapCut, bấm vào ô **Ảnh bìa (Cover)** $\rightarrow$ Chọn tab **Trên thiết bị** $\rightarrow$ Tải bức ảnh Bác sĩ đau cổ `16:9` lên và nhấn **Chỉnh sửa ảnh bìa**.
   - Thêm văn bản tiêu đề lấy từ kịch bản của ChatGPT, chia làm 4 dòng bên khoảng trống tay phải với phông chữ **`Anton`** có **Viền chữ màu trắng (White Stroke)** và phối 4 màu tương phản cho từng dòng:
     - Dòng 1 (**Màu Xanh lá**): `BÁC SĨ CẢNH BÁO:`
     - Dòng 2 (**Màu Vàng/Cam**): `CON SỐ HUYẾT ÁP ĐẸP`
     - Dòng 3 (**Màu Tím**): `CHƯA CHẮC ĐÃ LÀ`
     - Dòng 4 (**Màu Đỏ**): `TRÁI TIM KHỎE`
   - Nhấn **Lưu** $\rightarrow$ Khi bấm **Xuất (Export)** video, CapCut sẽ tự động xuất kèm luôn file ảnh bìa Thumbnail hoàn chỉnh ra cùng thư mục!

---

## 7. Bảng Mốc Thời Gian Chi Tiết (Key Timestamps)

| Thời gian | Giây (`seconds`) | Nội dung chi tiết trong bài giảng |
| :--- | :---: | :--- |
| `00:00` | `0s` | Phân tích 2 kênh mẫu `@BsMinhTâm60` (540K views) và `@PodcastTimMạch` (453K views) & Tiềm năng ngách Podcast Sức Khỏe AI |
| `01:02` | `62s` | Bước 1: Chụp màn hình khung đôi kênh đối thủ & Dùng ChatGPT thiết kế lại Khung nền `16:9` có 2 ô cửa sổ phông xanh lá |
| `03:50` | `230s` | Bước 2: Trích xuất Prompt nhân vật từ ảnh gốc & Tạo chân dung Bác sĩ AI Việt Nam (`9:16`) độc bản trên ChatGPT |
| `05:03` | `303s` | Bước 3: Chạy Master Prompt 7 Phần trên ChatGPT để lập kế hoạch 100 ý tưởng Podcast chia theo 10 nhóm bệnh lý tuổi 50–60+ |
| `07:41` | `461s` | Bước 4: Triển khai kịch bản chi tiết 17 phần cho Ý tưởng số 1 (*Bác sĩ cảnh báo: Con số huyết áp đẹp chưa chắc trái tim đã khỏe*) |
| `09:03` | `543s` | Bước 5: Khóa nhất quán Ảnh Bác sĩ + Giọng nói trên Google Flow (`Veo 3`) & Render từng câu thoại 8 giây bằng nút `Sử dụng lại câu lệnh` |
| `13:09` | `789s` | Bước 6: Tìm kiếm và tải nguồn video B-Roll minh họa y khoa, đo huyết áp miễn phí bản quyền trên Pexels & Pixabay |
| `14:04` | `844s` | Bước 7: Dựng video trên CapCut: Xóa phông xanh Khung nền, lồng ghép video Bác sĩ + B-Roll & Tạo phụ đề tự động font `Anton` |
| `18:49` | `1129s` | Bước 8: Tạo ảnh Bác sĩ đau cổ bằng `Nano Banana Pro` (`16:9`) trên Google Flow & Thiết kế chữ Thumbnail bắt mắt trên CapCut |
