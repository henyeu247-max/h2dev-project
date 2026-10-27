# BÀI 35: UPDATE QUY TRÌNH SẢN XUẤT TOOL TỰ ĐỘNG VÀ NHẤT QUÁN NHÂN VẬT (`VIDEO-17e135`)

> **Thuộc Học phần:** `DGMD-M10` — Tự Động Hóa Sản Xuất & Phát Trực Tiếp Đa Luồng (Đại Gia Mang Dép Academy)  
> **Mã định danh SKU:** `VIDEO-17e135`  
> **Thời lượng:** `14:44` (`884.22s` — `113 segments` phụ đề sạch chuẩn hóa 100%)  
> **Phân nhóm danh mục:** `ha_tang` (Tooling & Tự Động Hóa YouTube — `character_consistency_tool`)  
> **Thị trường mục tiêu:** Việt Nam & Toàn Cầu (`VN_GLOBAL`)  
> **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu chéo Hình ảnh Frame thực tế + Âm thanh + Tài liệu Google Docs gốc)

---

## 1. TỔNG QUAN CHIẾN LƯỢC & BẢN CHẤT BÀI GIẢNG

Trong sản xuất video AI số lượng lớn (100 đến 1.000 hình ảnh hoặc video mỗi ngày cho các ngách hoạt hình 3D, truyện kể, Stickman, thế giới động vật hoặc làm tiếp thị liên kết Affiliate), người mới thường gặp hai rào cản chí mạng:
1. **Thao tác thủ công rời rạc:** Phải ngồi nhập từng câu lệnh (`prompt`) một vào công cụ sinh ảnh và bấm tải từng bức ảnh về máy tính.
2. **Đứt gãy nhận diện nhân vật (`Character Inconsistency`):** Câu lệnh tự viết lúc quá ngắn, lúc quá dài khiến khuôn mặt, kiểu tóc, màu tóc và trang phục của nhân vật bị biến đổi hoàn toàn giữa các cảnh.

Bài 35 (`VIDEO-17e135`) hướng dẫn quy trình kết hợp **ChatGPT** và trình dựng ứng dụng tích hợp sẵn bên trong **Google Flow** (`labs.google/fx/vi/tools/flow` — sử dụng gói nâng cấp **Veo 3 Ultra** giá rẻ chỉ khoảng 30.000–50.000 VNĐ) cùng kho ảnh mẫu **Pinterest** để giải quyết triệt để cả hai bài toán trên mà **không cần biết lập trình**:
- **Tư duy Meta-Prompting (Dùng AI tạo Master Prompt cho AI):** Thay vì tự ngồi viết một bản đặc tả kỹ thuật dài hàng chục mục, học viên giao vai **"nhà chuyên gia về code tool"** cho **ChatGPT** để sinh ra bản **Master Prompt** hoàn chỉnh, sau đó dán trực tiếp vào mục **Công cụ (`Tools`) -> `+ Tạo mới`** trên **Google Flow** để hệ thống tự động biên dịch thành Web-Tool **`ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION`**.
- **Tư duy Khóa Nhân Vật 2 Tầng (`2-Stage Character Locking`):** Dùng hình ảnh nhân vật gốc tải từ **Pinterest** (ví dụ nhân vật cô gái tóc tím `Rumi` hoặc nhân vật `Stickman`) nạp đồng thời vào **ChatGPT** (để sinh khung Master Prompt khóa nhân vật + xuất 100 câu lệnh dài đồng đều không đánh số thứ tự) và nạp vào tab **Tham chiếu** của Tool trên **Google Flow** (để chạy hàng loạt 5 prompt cùng lúc và tự động tải ảnh về thư mục máy tính).

---

## 2. HỆ SINH THÁI CÔNG CỤ & TÀI LIỆU ĐÍNH KÈM TRONG BÀI

### 2.1. Danh mục công cụ sử dụng (`tools_mentioned`)

| STT | Tên công cụ | Vai trò cốt lõi trong quy trình | Chi tiết cấu hình / Thao tác thực tế trên màn hình |
| :--- | :--- | :--- | :--- |
| 1 | **Google Flow** | Nền tảng dựng Web-Tool & Render ảnh/video hàng loạt | Truy cập tại `labs.google/fx/vi/tools/flow`. Vào mục **Công cụ** ở cột menu trái -> nhấn nút dấu cộng **`+ Tạo mới`** -> dán Master Prompt vào **Trình tạo công cụ** để tạo ứng dụng **`ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION`**. |
| 2 | **Veo 3 Ultra** | Gói tài khoản nâng cấp chạy Google Flow | Loại tài khoản nâng cấp giá rẻ (khoảng 30.000 – 50.000 VNĐ) giúp mở khóa quyền truy cập trình tạo công cụ và tăng tốc độ tạo hình ảnh/video hàng loạt trên **Google Flow**. |
| 3 | **ChatGPT** | Bộ não Meta-Prompting sinh đặc tả Tool & 100 Prompt nhân vật | Thực hiện 2 nhiệm vụ: (1) Đóng vai chuyên gia code tool viết bản Master Prompt hơn 20 tiêu chí gửi sang Google Flow; (2) Phân tích ảnh nhân vật mẫu từ Pinterest để lập Master Prompt khóa nhận diện và xuất danh sách 100 prompt độ dài đồng đều. |
| 4 | **Pinterest** | Nguồn khai thác hình ảnh nhân vật tham chiếu gốc | Dùng để tìm kiếm và tải ảnh mẫu nhân vật có đường nét rõ ràng (như nhân vật hoạt hình 3D `Elegant Rumi` hoặc nhân vật que `Stickman`) làm hình ảnh tham chiếu (`Reference Image`). |

### 2.2. Tài liệu khóa học gốc (`course_docs`)
- **Link Google Docs gốc trong phần mô tả video:**  
  `https://docs.google.com/document/d/1dOgdumKy_kHHgbdMaTuQNhPEGIF1nj9tweodivyS7HE/edit?usp=sharing`
- **Tệp lưu trữ nội bộ:**
  - Bản chuẩn hóa Markdown đầy đủ: [`assets/docs-dgmd/VIDEO-17e135/master_prompt.md`](../../assets/docs-dgmd/VIDEO-17e135/master_prompt.md)
  - Bản văn bản trích xuất nguyên gốc từ Google Docs: [`assets/docs-dgmd/VIDEO-17e135/doc_1.txt`](../../assets/docs-dgmd/VIDEO-17e135/doc_1.txt)
  - Bản sao 2 câu lệnh gốc: [`assets/docs-dgmd/VIDEO-17e135/master_prompt.txt`](../../assets/docs-dgmd/VIDEO-17e135/master_prompt.txt)

---

## 3. NGUYÊN VĂN 2 CÂU LỆNH GỐC TỪ TÀI LIỆU ĐÍNH KÈM (`doc_1.txt`)

### 3.1. Câu lệnh số 1 — Yêu cầu ChatGPT tạo Master Prompt để Code Tool trên Google Flow
> **Mục đích:** Gửi vào **ChatGPT** để yêu cầu AI đóng vai chuyên gia code tool và xuất ra bản đặc tả kỹ thuật chi tiết gửi thẳng vào mục **Công cụ -> Tạo mới** của **Google Flow**.

```text
Hãy tạo cho tôi 1 master prompt  , nhưng đầu tiên bạn hãy đóng vai thành 1 nhà chuyên gia về code tool , hãy tạo cho tôi 1 master prompt để gửi trực tiếp vào google flow để tạo 1 tool tự động tạo ảnh  , trong tool có nút thêm hình ảnh tham chiếu có thể thêm nhiều hình ảnh để ghi nhớ , có các kích thước tạo ảnh 16.9 , 4.3 , 1.1 , 3.4 , 9.16 , có thể lựa chọn số ảnh cho từng prompt 1 ảnh , 2 ảnh , 3 ảnh , hoặc 4 ảnh , tool tự động gửi ảnh tham chiếu nhân vật nếu có hình ảnh nhân vật tham chiếu , và có các rất nhiều dòng có thể tự động khi tôi vất 1 danh sách prompt vào , tool sẽ tự động lấy từng prompt 1 để tạo ảnh , yêu cầu tạo 5 prompt 1 lúc , và tạo liên tục , tốc độ tạo ảnh nhanh , tool có tên là đại gia mang dép , tool có nút yêu cầu tải về file về thư mục để mình lựa chọn các thư mục bất kỳ , khi tải ảnh về tool sẽ tự động nhớ từng hình ảnh 1 để đánh dấu khi tải vào file , tool tạo ảnh nào sẽ tự động tải ảnh đó về , tool có giao diện đẹp , giao diện bắt mắt , yêu cầu tạo cho tôi 1 master prompt chi tiết để gửi cho google flow
```

> **Mẹo mở rộng sang Tool Tạo Video (`01:44` – `01:55`):** Nếu muốn code ra công cụ tự động tạo video hàng loạt thay vì tạo ảnh, học viên chỉ cần thay cụm từ `"tạo ảnh"` thành `"tạo video"` trong câu lệnh trên trước khi gửi vào **ChatGPT**.

### 3.2. Câu lệnh số 2 — Yêu cầu ChatGPT tạo Master Prompt tham chiếu 100 hình ảnh nhất quán nhân vật
> **Mục đích:** Đính kèm ảnh nhân vật mẫu (tải từ **Pinterest**) lên **ChatGPT** cùng câu lệnh này để khóa đặc điểm nhân vật trước khi yêu cầu xuất 100 prompt.

```text
yêu cầu tạo cho tôi 1 master prompt tạo cho tôi 100 prompt , khi dùng hình ảnh này tạo lên flow làm nhân vật tham chiếu , thay đổi cử chỉ hành động cho từng prompt , sáng tạo các bối cảnh cùng 1 phong cách với nhân vật , các prompt tạo hình ảnh kích thước 16.9 , sáng tạo 1 master prompt trả 100 prompt chi tiết đầy đủ , không cần đánh dấu prompt
```

---

## 4. GIẢI PHẪU KỸ THUẬT TRỰC QUAN TỪNG GIAI ĐOẠN TRÊN MÀN HÌNH

### Giai đoạn 1: Giải phẫu 7 tham số bắt buộc trong Câu lệnh Code Tool (`01:08` – `04:05`)
Giảng viên phân tích trực tiếp trên file Google Docs lý do vì sao câu lệnh số 1 phải chứa đủ 7 khối yêu cầu nghiệp vụ:
1. **Định danh vai trò (`Role Prompting`):** Bắt buộc mở đầu bằng *"đóng vai thành 1 nhà chuyên gia về code tool"* để **ChatGPT** tự động bổ sung các cơ chế xử lý hàng đợi, quản lý bộ nhớ và bắt lỗi mà người không biết code không thể tự nghĩ ra.
2. **Bộ nhớ Đa ảnh tham chiếu (`Multi-Reference Memory`):** Có nút thêm nhiều hình ảnh tham chiếu để ghi nhớ (phục vụ kịch bản có 5 nhân vật khác nhau cùng xuất hiện xuyên suốt một bộ phim).
3. **Đầy đủ 5 tỷ lệ khung hình chuẩn của Google Flow:** `16:9` (ngang), `4:3`, `1:1` (vuông), `3:4`, và `9:16` (dọc Shorts/TikTok).
4. **Tuỳ chọn số lượng biến thể mỗi câu lệnh:** Cho phép chọn `1 ảnh`, `2 ảnh`, `3 ảnh` hoặc `4 ảnh` trên 1 prompt.
5. **Cơ chế tự động đính kèm ảnh tham chiếu:** Hễ có ảnh trong kho tham chiếu, tool phải tự động gửi kèm ảnh đó vào mọi câu prompt trong danh sách.
6. **Xử lý đa luồng 5 Prompt cùng lúc (`5x Parallel Batch Queue`):** Khi dán một danh sách dài vào ô nhập liệu, tool tự động bóc từng câu lệnh và chạy **5 prompt 1 lúc** liên tục để tối ưu tốc độ.
7. **Tự động tải xuống & Chống trùng lặp (`Auto-Download with File Tracking`):** Cho phép chọn thư mục lưu bất kỳ trên máy; ảnh nào tạo xong tự động tải về ngay và đánh dấu ghi nhớ từng ảnh để không tải trùng.

### Giai đoạn 2: Sinh Master Prompt trên ChatGPT & Khởi tạo Tool trong Google Flow (`04:44` – `08:47`)
- Tại mốc `04:44` – `06:25`, sau khi dán câu lệnh số 1 vào **ChatGPT**, hệ thống sinh ra một bản đặc tả **Master Prompt** cực kỳ chi tiết gồm hơn 13 mục lớn (tiêu biểu trên màn hình tại `05:40`: cơ chế chống tải trùng bằng ID/hash của ảnh, gắn nhãn trạng thái `Chưa tải`, `Đang tải`, `Đã tải`, `Tải thất bại`, `Trùng file`, mục `13. THƯ VIỆN ẢNH KẾT QUẢ`, và dòng lệnh kết thúc `Hãy bắt đầu xây dựng Tool **ĐẠI GIA MANG DÉP – AI IMAGE AUTOMATION** ngay bây giờ`).
- Tại mốc `06:26` – `07:48`, giảng viên chuyển sang giao diện **Google Flow**, bấm vào mục **`Công cụ`** ở thanh điều hướng bên trái, nhấn nút **`+ Tạo mới`**, dán toàn bộ bản Master Prompt vừa copy từ ChatGPT vào ô **Trình tạo công cụ** rồi bấm gửi.
- Tại mốc `07:48` – `08:47`, nếu bản dựng đầu tiên phát sinh lỗi nhỏ, học viên chỉ cần bấm nút tự động sửa lỗi (`Fix`) tích hợp sẵn của Google Flow. Kết quả thu được là giao diện Web-Tool **`ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION`** (`PHIÊN BẢN V1.0.1` • `MÁY CHỦ: ỔN ĐỊNH`) với các mô-đun:
  - Khung **Thông số tỷ lệ khung hình** (`16:9`, `4:3`, `1:1`, `3:4`, `9:16`) và **Số ảnh / Prompt** (`1`, `2`, `3`, `4`).
  - Công tắc **Khóa định dạng đồng nhất nhân vật**.
  - Hệ thống 4 tab điều hành: **`Nhập File`**, **`Tiến trình`**, **`Tham chiếu`**, **`Thư viện`**.

### Giai đoạn 3: Khai thác nhân vật mẫu trên Pinterest & Khóa nhân vật 100 Prompt (`08:47` – `13:13`)
- Tại mốc `08:47` – `09:22`, giảng viên mở **Pinterest**, giải thích rằng ngoài nhân vật que **`Stickman`** đơn giản, quy trình này áp dụng hoàn hảo cho cả nhân vật 3D phức tạp hoặc người thật. Giảng viên chọn và tải ảnh nhân vật cô gái tóc tím tết bím dài mặc trang phục trắng đính vàng (**`Elegant Rumi`**) về máy.
- Tại mốc `09:22` – `10:38`, giảng viên tải ảnh `Rumi` lên **ChatGPT** kèm câu lệnh số 2, đồng thời quay sang tab **Tham chiếu** của tool trên **Google Flow** để tải sẵn bức ảnh `Rumi` đó lên làm ảnh gốc.
- Tại mốc `11:08` – `11:52`, **ChatGPT** trả về bản **Master Prompt khóa nhân vật** (quy định rõ tư thế, biểu cảm, bối cảnh, kèm điều kiện cấm tuyệt đối: `No character redesign, no different face, no different hairstyle, no different hair color, no short hair`). Ngay bên dưới, giảng viên gõ lệnh kích hoạt:
  ```text
  tạo 100 prompt cho tôi
  ```
- Tại mốc `12:47` – `13:13`, **ChatGPT** xuất ra danh sách **100 prompt tiếng Anh** hoàn chỉnh. Điểm khác biệt quan trọng là cả 100 đoạn prompt đều có **độ dài đồng đều nhau** (khoảng 4–5 dòng mỗi đoạn mô tả đầy đủ nhân vật, trang phục, hành động, ánh sáng, bối cảnh) và **không có số thứ tự đầu dòng**.

### Giai đoạn 4: Vận hành Batch 5 Prompt/Lượt & Авто-Download trên Google Flow (`13:13` – `14:44`)
- Tại mốc `13:13` – `13:43`, giảng viên nhấn nút **Sao chép** toàn bộ 100 prompt từ ChatGPT, chuyển sang tool **`ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION`** trên **Google Flow**, dán vào ô danh sách câu lệnh, bấm **`Phân tích`** (hệ thống nhận diện đủ 100 prompt) rồi nhấn **`Bắt đầu tạo`**.
- Tại mốc `13:43` – `14:44`, trên tab **`Tiến trình`**, hệ thống tự động kích hoạt **5 luồng xử lý song song** (`#0001` đến `#0005` hiển thị trạng thái `ĐANG CHẠY`, trong khi `#0006`, `#0007`, `#0008`... ở trạng thái `CHỜ`). Ngay khi 5 bức ảnh đầu tiên hoàn tất, tool tự động tải thẳng file ảnh về thư mục máy tính và cuốn chiếu chạy tiếp 5 prompt kế tiếp hoàn toàn tự động.

---

## 5. TIMELINE CHI TIẾT (ĐỐI CHIẾU CHÍNH XÁC VỚI `transcript.json`)

| Mốc thời gian | Giây (`seconds`) | Nội dung phân đoạn cốt lõi |
| :--- | :--- | :--- |
| **`00:00`** | `0` | Tổng quan tư duy dùng AI tự code tool tạo 100–1.000 ảnh/video nhất quán nhân vật mỗi ngày với tài khoản **Google Flow** (**Veo 3 Ultra**) và **ChatGPT**. |
| **`01:08`** | `68` | Phân tích cấu trúc câu lệnh số 1: Giao vai chuyên gia code tool cho **ChatGPT** để sinh **Master Prompt** tạo công cụ tự động trên **Google Flow**. |
| **`02:10`** | `130` | Thiết lập thông số kỹ thuật trong câu lệnh: 5 tỷ lệ khung hình (`16:9`, `4:3`, `1:1`, `3:4`, `9:16`), chọn 1–4 ảnh/prompt, chạy 5 prompt cùng lúc và tự động tải về thư mục. |
| **`04:44`** | `284` | Chạy câu lệnh trên **ChatGPT** để đóng gói bản đặc tả **Master Prompt** hơn 20 tiêu chí (giao diện, hàng đợi, chống trùng file). |
| **`06:26`** | `386` | Dán **Master Prompt** vào mục **Công cụ -> Tạo mới** trên **Google Flow** để khởi tạo Web-App **Đại Gia Mang Dép - AI Image Automation** và dùng tính năng Tự Fix lỗi. |
| **`08:47`** | `527` | Tải ảnh nhân vật mẫu `Rumi` từ **Pinterest** và gửi kèm câu lệnh số 2 vào **ChatGPT** để sinh **Master Prompt** khóa nhận diện nhân vật. |
| **`11:33`** | `693` | Ra lệnh `"tạo 100 prompt cho tôi"` trên **ChatGPT** để xuất danh sách 100 prompt độ dài đồng đều, không đánh số thứ tự đầu dòng. |
| **`13:13`** | `793` | Nạp ảnh tham chiếu `Rumi` cùng 100 prompt vào tool trên **Google Flow**, kích hoạt chạy tự động 5 prompt/lượt và tự động tải ảnh hoàn chỉnh về máy. |

---

## 6. QUY TRÌNH THỰC THI CHUẨN 5 BƯỚC (SOP VẬN HÀNH)

- **Khởi tạo Master Prompt dựng Tool trên ChatGPT:** Gửi câu lệnh yêu cầu đóng vai chuyên gia code tool vào **ChatGPT** để sinh bản **Master Prompt** đặc tả công cụ tạo ảnh hàng loạt trên **Google Flow** (hỗ trợ ảnh tham chiếu, 5 tỷ lệ khung hình, chọn 1–4 ảnh/prompt, chạy 5 prompt/lượt và tự tải file).
- **Biên dịch Web-Tool bên trong Google Flow:** Mở giao diện **Google Flow**, vào phần **Công cụ -> Tạo mới** (nút dấu cộng), dán bản **Master Prompt** của **ChatGPT** vào để khởi tạo tool và nhấn nút tự sửa lỗi nếu giao diện lần đầu chưa hoàn chỉnh.
- **Chuẩn bị và nạp Ảnh Tham Chiếu Nhân Vật gốc:** Tải ảnh nhân vật mẫu từ **Pinterest** (như nhân vật `Rumi` hoặc `Stickman`) và tải ảnh đó lên mục **Thêm ảnh tham chiếu** bên trong tool vừa tạo trên **Google Flow**.
- **Sinh 100 Prompt khóa nhân vật đồng đều bằng ChatGPT:** Tải cùng bức ảnh nhân vật đó lên **ChatGPT** kèm câu lệnh tạo **Master Prompt** 100 hình ảnh tham chiếu (tỷ lệ `16:9`, thay đổi cử chỉ hành động, đồng nhất bối cảnh, không đánh dấu số thứ tự), sau đó nhập lệnh `"tạo 100 prompt cho tôi"`.
- **Chạy Hàng Đợi 5 Luồng & Tự Động Lưu Thư Mục:** Copy danh sách 100 prompt có độ dài đồng đều từ **ChatGPT** dán vào tool trên **Google Flow**, bấm **Phân tích** và nhấn **Bắt đầu tạo** để hệ thống tự động render 5 prompt một lúc và lưu thẳng ảnh về thư mục.

---

## 7. CÁC LỖI PHẢI TRÁNH (`AVOID FLAGS` & RÀO CHẮN KỸ THUẬT)

- **Không tự viết tay Master Prompt hoặc nhập lẻ từng câu lệnh:** Không tự ngồi viết tay Master Prompt dài hàng chục tiêu chí hoặc nhập thủ công từng câu prompt một vào **Google Flow** vì vừa tốn thời gian vừa thiếu các ràng buộc luồng xử lý và chống trùng file.
- **Không bỏ qua bước tạo Master Prompt khóa nhân vật trước khi xuất 100 prompt:** Không yêu cầu **ChatGPT** sinh ngay 100 prompt từ câu lệnh ngắn mà bỏ qua bước tạo **Master Prompt** khóa nhân vật trước, vì sẽ khiến các câu prompt bị câu ngắn câu dài thất thường và làm biến dạng nhân vật.
- **Không đánh số thứ tự ở đầu mỗi dòng prompt:** Không đánh số thứ tự hoặc ký hiệu đánh dấu ở đầu mỗi câu prompt trong danh sách 100 prompt để tránh làm hỏng bộ tách dòng tự động khi dán hàng loạt vào tool trên **Google Flow**.
- **Không dùng ảnh vi phạm chính sách làm ảnh tham chiếu:** Không sử dụng hình ảnh người nổi tiếng có thật hoặc hình ảnh nhạy cảm, hở hang làm ảnh tham chiếu nhân vật vì sẽ bị bộ lọc chính sách của **Google Flow** và **ChatGPT** từ chối xử lý.

---

## 8. BẢNG KIỂM ĐỊNH CHẤT LƯỢNG 10 GATES (H2DEV GOLD STANDARD)

| Gate | Hạng mục kiểm định | Kết quả tại `VIDEO-17e135` | Trạng thái |
| :--- | :--- | :--- | :--- |
| **G1** | Phụ đề sạch (`transcript.json` / `.srt` / `.txt`) | 113 segments, thời lượng `884.22s`, `0` khoảng trống >30s, đã chạy `asr_fixes.json` sạch 100% lỗi chính tả (`Google Flow`, `Veo 3 Ultra`, `ChatGPT`, `Master Prompt`, `Stickman`). | **PASS** |
| **G2** | Đối chiếu Frame hình ảnh thực tế (`Visual Grounding`) | Đã trích xuất và đọc tay 8 mốc frame CUDA (`15s, 110s, 220s, 340s, 460s, 580s, 700s, 820s`) xác thực giao diện tool `ĐẠI GIA MANG DÉP - AI IMAGE AUTOMATION V1.0.1` trên Google Flow. | **PASS** |
| **G3** | Tài liệu khóa học đính kèm (`course_docs`) | Đã tạo `assets/docs-dgmd/VIDEO-17e135/master_prompt.md` và liên kết đầy đủ với `doc_1.txt` + `master_prompt.txt` + link Google Docs gốc. | **PASS** |
| **G4** | Kiểm chứng kênh mẫu (`channels_mentioned`) | Bài giảng thuần kỹ thuật dựng tool trên Google Flow, không nêu kênh YouTube cụ thể (`channels_mentioned: []`). | **PASS** |
| **G5** | Đồng bộ công cụ (`tools_mentioned`) | 4 công cụ (`Google Flow`, `Veo 3 Ultra`, `ChatGPT`, `Pinterest`) đều xuất hiện nguyên văn trong `transcript.txt` và `README.md`. | **PASS** |
| **G6** | Khớp mốc thời gian toán học (`key_timestamps`) | 8 mốc thời gian khớp tuyệt đối `Math.floor(seg.start)` (`0, 68, 130, 284, 386, 527, 693, 793`). | **PASS** |
| **G7** | Chuẩn hóa `edit_sop` & `sop_steps` | Đủ 5 bước chi tiết ở cả `edit_sop.additional` và `sop_steps`, không chứa tiền tố `Bước 1:` hay `1.`. | **PASS** |
| **G8** | Chuẩn hóa `avoid_flags` & `key_takeaways` | Đủ 6 `key_takeaways` và 4 `avoid_flags` bám sát thực tế bài giảng. | **PASS** |
| **G9** | Độ sâu tài liệu `docs/<SKU>/README.md` | Dung lượng > 12.000 bytes (vượt chuẩn tối thiểu 8.000 bytes), trình bày đủ 8 phần chuyên sâu. | **PASS** |
| **G10** | Dọn dẹp thư mục tạm (`scratch/frames_*`) | Đã xóa sạch toàn bộ thư mục frame tạm của cả 5 SKU sau khi đọc xong. | **PASS** |
