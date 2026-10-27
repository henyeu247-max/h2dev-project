# Quy Trình Tạo Ra Tool Tự Động Nhất Quán Nhân Vật (`VIDEO-27e4e0`)

> **Mã video (SKU):** `VIDEO-27e4e0`
> **Học phần:** Bài 45 — Module `DGMD-M10` (*Tooling & Tự Động Hóa YouTube*)
> **Giảng viên:** Đại Gia Mang Dép (DGMD Academy)
> **Thời lượng:** `07:27` (`446.78s` — `61 segments` đã chuẩn hóa chính tả 100%)
> **Trạng thái kiểm định:** `GROUNDED_VERIFIED` (Đã đối chiếu 100% khung hình thực tế trên **Google Flow Tool Builder**, **Google Docs** & **ChatGPT** + lời giảng âm thanh)

---

## 1. TỔNG QUAN BÀI GIẢNG & ĐỘT PHÁ TỰ ĐỘNG HÓA

Ở bài học trước (`VIDEO-fc62eb`), học viên đã biết dùng ChatGPT đúc **Master Prompt** để sinh ra 30–300 câu lệnh phân cảnh tiếng Anh. Tuy nhiên, nếu vẫn phải tự tay copy-paste từng câu lệnh một sang Google Flow và gắn lại ảnh nhân vật tham chiếu 30–300 lần thì khâu tạo ảnh vẫn tốn nhiều công sức.

Trong bài giảng cuối cùng của học phần (`VIDEO-27e4e0`), giảng viên hướng dẫn cách **dùng chính Master Prompt để ra lệnh cho Google Flow tự động lập trình ra một Web-App Tool riêng ngay trong trình duyệt** (không cần biết viết code). Công cụ mang tên **“ĐẠI GIA MANG DÉP — PRO AUTOMATION”** cho phép:
1. Tải ảnh nhân vật gốc lên một lần duy nhất và khóa nhãn **`NHÂN VẬT ✓`**.
2. Dán cùng lúc danh sách 20–200 câu lệnh Prompt (mỗi dòng 1 Prompt).
3. Tự động chia luồng chạy song song **5–8 Prompt cùng lúc** (mỗi Prompt 1–4 ảnh, tùy chọn tỷ lệ `16:9`, `9:16`, `1:1`, `4:3`, `3:4`), tự động đánh số thứ tự phân cảnh (`prompt_001_image_01.png`) và chạy cuốn chiếu cho đến khi hoàn thành toàn bộ bộ ảnh câu chuyện.

### Công cụ xuất hiện và thao tác trực tiếp trong bài giảng
- **Google Flow — Tính năng `Công cụ` (`Trình tạo công cụ`)** (`labs.google/fx/vi/tools/flow`): Môi trường khởi tạo ứng dụng AI trực tiếp bằng câu lệnh tự nhiên (*No-Code AI Tool Builder*), cho phép xem trực tiếp mã nguồn ở tab **Mã** và sử dụng giao diện hoàn chỉnh ở tab **Xem trước**.
- **Mô hình Nano Banana (`Nano Banana Pro` / `Nano Banana 2`)**: Động cơ sinh ảnh AI tốc độ cao được gắn bên dưới tool tự động hóa.
- **Google Docs (`Tạo ra tool veo3`)** (`docs.google.com/document/d/15o1kllnyKj8heea5Sy5YnUINzR_8Bi61cCGzrBCWXs8/edit`): Tài liệu lưu trữ toàn văn bản Master Prompt đặc tả 8 khu vực giao diện và logic hoạt động của tool.
- **ChatGPT** (`chatgpt.com`): Dùng để sinh nhanh danh sách 20–200 Prompt tiếng Anh liền mạch (không đánh dấu tiêu đề) từ bức ảnh nhân vật gốc.

---

## 2. BẢNG ĐỐI CHIẾU TRỰC QUAN TỪ KHUNG HÌNH VIDEO (VISUAL EVIDENCE)

| Mốc thời gian | Nền tảng hiển thị | Thao tác thực tế trên màn hình | Nội dung câu lệnh / Chi tiết kỹ thuật trực quan |
| :--- | :--- | :--- | :--- |
| **`00:00 - 00:45`** | **Google Flow** (`labs.google/fx/vi/tools/flow`) | Giảng viên truy cập trang chủ Google Flow (`Create characters and cast them anywhere`), nhấn nút **`+ Dự án mới`**, sau đó chọn mục **`Công cụ`** ở thanh menu bên trái và bấm **`Tạo công cụ`**. | Màn hình chuyển sang giao diện `Tool mới`: *"Bắt đầu xây dựng công cụ sáng tạo mà bạn mơ ước bằng cách mô tả công cụ ở bên dưới"*. |
| **`00:46 - 01:22`** | **Google Docs** (`Tạo ra tool veo3`) | Mở tab Google Tài liệu chứa bản Master Prompt tạo tool, bôi đen sao chép toàn bộ nội dung từ đầu đến cuối. | Giảng viên lưu ý học viên có thể sửa dòng tên bắt buộc `“ĐẠI GIA MANG DÉP”` thành tên thương hiệu cá nhân của mình. |
| **`01:23 - 02:27`** | **Google Flow** (`Trình tạo công cụ`) | Dán toàn bộ bản Master Prompt vào khung chat `Trình tạo công cụ` ở cột bên phải và bấm chạy để AI tự động viết code. | Giảng viên chỉ vào tab **`Xem trước`** và tab **`Mã`** ở góc trên: toàn bộ dòng code được AI tự động biên dịch trong khoảng 5–10 phút. |
| **`02:28 - 03:07`** | **Google Flow** (`Tool ĐẠI GIA MANG DÉP`) | Tool hoàn tất biên dịch với giao diện Dark Mode hiện đại (`ĐẠI GIA MANG DÉP - PRO AUTOMATION - VERSION 1.0.4`). Giảng viên bấm **`+ Thêm mới`** tại mục `ẢNH THAM CHIẾU (1)`, tải ảnh nhân vật người que (**Stickman**) lên và bấm tích vào nhãn **`NHÂN VẬT ✓`**. | Thumbnail nhân vật Stickman hiển thị ở cột trái kèm nút tích xanh `NHÂN VẬT ✓`, đảm bảo tool tự động đính kèm ảnh nhân vật này vào mọi câu lệnh. |
| **`03:08 - 04:18`** | **ChatGPT** (`chatgpt.com`) | Chuyển sang ChatGPT, tải ảnh nhân vật Stickman lên và gõ câu lệnh yêu cầu tạo 20 Prompt xoay quanh cuộc sống hàng ngày, thay đổi góc quay và viết liền mạch không đánh số. | Câu lệnh gõ trực tiếp trên màn hình: `hãy tạo cho tôi 20 prompt để sử dụng hình ảnh này tạo ra hình ảnh trên flow , sáng tạo 20 prompt thay đổi cuộc sống hàng ngày của nhân vật này , thay đổi các góc quay cho từng prompt , sáng tạo các prompt chi tiết đầy đủ , các prompt liền mạch , không cần đánh dấu các prompt`. |
| **`04:19 - 04:35`** | **ChatGPT** (`chatgpt.com`) | ChatGPT xuất ra 20 đoạn văn tiếng Anh liên tiếp, mỗi đoạn bắt đầu bằng `A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers...`. Giảng viên bôi đen sao chép toàn bộ 20 đoạn. | Các phân cảnh gồm: chụp ảnh trong vườn hoa, học bài khuya dưới ánh đèn bàn, leo núi giữa rừng mây, tham quan thủy cung, làm việc với laptop trên sân thượng... |
| **`04:36 - 05:24`** | **Google Flow** (`Tool ĐẠI GIA MANG DÉP`) | Dán 20 đoạn văn vào ô **`DANH SÁCH PROMPT`** ở góc dưới bên trái, nhấn **`Cập nhật danh sách`**. Kiểm tra `CẤU HÌNH TẠO ẢNH`: Tỷ lệ khung hình `16:9`, Ảnh/Prompt `2 ảnh`, Chạy song song `5 prompt`, rồi nhấn nút **`▶ Bắt đầu chạy`**. | Bộ đếm trên thanh trạng thái cập nhật ngay `TỔNG: 20`. Cột giữa `HÀNG ĐỢI THỰC THI` tự động đánh số thứ tự từ `1` đến `20` kèm trạng thái `CHỜ ĐỢI` -> `ĐANG CHẠY`. |
| **`05:25 - 07:27`** | **Google Flow** (`Tất cả nội dung nghe nhìn`) | Quay ra lưới dự án tổng của Google Flow để xem tool tự động bắn lệnh và render hàng loạt hình ảnh nhân vật Stickman. | Hàng chục bức ảnh 16:9 đồng nhất 100% nhân vật Stickman hiện lên liên tục: đẩy xe siêu thị, đứng giữa ngã tư thành phố, ngồi quán cà phê gõ laptop, đạp xe trong công viên nắng vàng, nướng bánh mì trong bếp, đọc sách trong thư viện cổ, ngồi tàu điện nhìn mưa rơi ngoài cửa sổ, chạy bộ trên bãi biển hoàng hôn, ngồi ghế gaming chơi game. |

---

## 3. NGUYÊN VĂN CÁC CÂU LỆNH (VERBATIM PROMPTS) TRONG BÀI GIẢNG

### 3.1. Câu lệnh yêu cầu ChatGPT sinh 20 Prompt liền mạch nạp vào Tool (`03:12 - 04:12`)
```text
hãy tạo cho tôi 20 prompt để sử dụng hình ảnh này tạo ra hình ảnh trên flow , sáng tạo 20 prompt thay đổi cuộc sống hàng ngày của nhân vật này , thay đổi các góc quay cho từng prompt , sáng tạo các prompt chi tiết đầy đủ , các prompt liền mạch , không cần đánh dấu các prompt
```

### 3.2. Mẫu các dòng Prompt tiếng Anh do ChatGPT sinh ra trên màn hình (`04:25` & `05:10`)
```text
A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, identical to the reference image. Taking photos in a vibrant flower garden using a camera, colorful blossoms everywhere, bright afternoon sun, camera perspective from behind flowers framing the subject, artistic cartoon composition.

A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, same original appearance. Studying late at night at a desk filled with notebooks and sticky notes, desk lamp creating dramatic lighting, close-up frontal camera shot, cozy productivity atmosphere, detailed cartoon illustration.

A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, unchanged design. Hiking on a mountain trail surrounded by forests and clouds, breathtaking landscape, wide cinematic landscape shot from a distant viewpoint, adventurous cartoon style, highly detailed environment.

A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, preserving the exact original look. Visiting an aquarium, standing in front of a giant glass tank filled with sharks and colorful fish, blue underwater glow, camera angle from behind the character looking toward the tank.

A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, maintaining original proportions and facial expression. Working remotely on a rooftop terrace overlooking a modern skyline, laptop on a small table, golden hour lighting, side profile medium shot, detailed cartoon illustration.

A simple stickman character with a round white head, black oversized t-shirt, rolled-up blue denim shorts, white sneakers, same original design. Exploring a lively night market, surrounded by food stalls and neon signs, vibrant atmosphere, handheld-style street photography camera angle, cinematic cartoon storytelling scene.
```

### 3.3. Cấu trúc 8 khu vực của Master Prompt tạo Tool “ĐẠI GIA MANG DÉP” (`doc_1.txt`)
*(Toàn văn 130 dòng câu lệnh được lưu trữ đầy đủ tại file đính kèm `master_prompt.md` và `doc_1.txt`)*:
1. **Khu vực thêm hình ảnh tham chiếu:** Cho phép kéo thả nhiều ảnh, hiển thị thumbnail, đánh dấu **`ảnh nhân vật`** để tự động gửi kèm vào mọi Prompt.
2. **Khu vực nhập danh sách Prompt:** Ô văn bản nhiều dòng, tự động tách từng dòng thành 1 Prompt, bỏ qua dòng trống, đánh số thứ tự và theo dõi trạng thái (`chưa tạo`, `đang tạo`, `đã tạo`, `lỗi`).
3. **Khu vực chọn kích thước ảnh:** Hỗ trợ 5 tỷ lệ chuẩn `16:9`, `4:3`, `1:1`, `3:4`, `9:16`.
4. **Khu vực chọn số ảnh cho mỗi Prompt:** Tùy chọn `1`, `2`, `3` hoặc `4 ảnh / prompt`.
5. **Khu vực chạy tự động:** Các nút `Bắt đầu tạo ảnh`, `Tạm dừng`, `Tiếp tục`, `Dừng toàn bộ`; xử lý đa luồng **5 Prompt cùng lúc** cuốn chiếu đến hết danh sách.
6. **Khu vực chọn thư mục tải ảnh:** Tự động tải ảnh hoàn tất về máy tính và đặt tên chuẩn hóa theo cú pháp `prompt_001_image_01.png`, `prompt_001_image_02.png`.
7. **Tính năng ghi nhớ ảnh đã tải:** Đánh dấu trạng thái `Đã tải` / `Lỗi tải`, chống tải trùng và hỗ trợ tự động thử lại (*Auto-Retry*) mặc định **3 lần** khi gặp sự cố.
8. **Khu vực hiển thị kết quả & Bộ đếm:** Thống kê tổng số Prompt, số Prompt hoàn thành, số ảnh đã tạo/tải về và log hoạt động thời gian thực.

---

## 4. MỐC THỜI GIAN TRỌNG TÂM (KEY TIMESTAMPS)

- **`00:00`** — Giới thiệu phương pháp tự động hóa tạo hình ảnh nhân vật nhất quán hàng loạt ngay trên Google Flow.
- **`00:24`** — Truy cập giao diện `labs.google`, bấm Tạo dự án mới -> chọn mục Công cụ -> bấm Tạo công cụ riêng.
- **`00:46`** — Sao chép toàn bộ bản Master Prompt tạo tool từ Google Docs (`Tạo ra tool veo3`) và tùy biến tên thương hiệu.
- **`01:43`** — Dán Master Prompt vào Trình tạo công cụ trên Google Flow để AI tự động viết mã code và dựng Dashboard trong 5–10 phút.
- **`02:37`** — Tải hình ảnh người que (Stickman) lên mục Ảnh tham chiếu của tool và tích chọn nhãn xác nhận Nhân vật.
- **`03:08`** — Chuyển sang ChatGPT nhập lệnh tạo 20 Prompt cuộc sống hàng ngày liền mạch, không đánh dấu tiêu đề từng Prompt.
- **`04:36`** — Dán 20 Prompt vào tool, bấm Cập nhật danh sách, chọn tỷ lệ `16:9`, `2 ảnh/prompt`, chạy song song `5 prompt` và bấm Bắt đầu chạy.
- **`05:25`** — Kiểm chứng hàng loạt ảnh Stickman tự động render trên Google Flow và tổng kết tư duy dùng Master Prompt để tạo công cụ.

---

## 5. BÀI HỌC CỐT LÕI (KEY TAKEAWAYS)

1. **Không biết lập trình vẫn tạo được Tool AI riêng:** Người làm nội dung không cần biết viết code vẫn có thể tự dựng phần mềm tự động hóa bằng tính năng **`Công cụ`** (*Trình tạo công cụ*) tích hợp sẵn trên Google Flow (`labs.google`).
2. **Dùng Master Prompt để sinh phần mềm:** Chỉ cần dán bản Master Prompt đặc tả 8 khu vực giao diện và logic hoạt động vào Trình tạo công cụ, Google Flow sẽ tự động sinh mã nguồn (tab **Mã**) và giao diện Dashboard (tab **Xem trước**) trong 5–10 phút.
3. **Khóa chặt nhân vật bằng nhãn `NHÂN VẬT ✓`:** Trên giao diện tool vừa tạo, sau khi tải ảnh nhân vật gốc lên mục `Ảnh tham chiếu`, bắt buộc phải bấm tích chọn nhãn **`Nhân vật`** để hệ thống tự động đính kèm ảnh đó vào toàn bộ các câu lệnh trong hàng đợi.
4. **Quy tắc xuất danh sách Prompt không đánh số:** Khi dùng ChatGPT sinh danh sách 20–200 Prompt để nạp vào tool, cần dặn rõ *"các prompt liền mạch, không cần đánh dấu các prompt"* để tool tách dòng chính xác mỗi dòng là 1 Prompt.
5. **Sản xuất công nghiệp đa luồng:** Tool hỗ trợ chạy song song 5–8 Prompt cùng lúc (mỗi Prompt 1–4 ảnh, tùy chọn tỷ lệ `16:9` hoặc `9:16`), tự động đánh số thứ tự phân cảnh (`prompt_001_image_01.png`) và chạy cuốn chiếu đến hết danh sách cho mọi chủ đề (Storytelling, quân sự, cao bồi, hoạt hình).

---

## 6. QUY TRÌNH THỰC THI CHUẨN (SOP 5 BƯỚC)

- Truy cập Google Flow (`labs.google/fx/vi/tools/flow`), bấm Dự án mới -> chọn mục Công cụ ở thanh bên trái -> bấm Tạo công cụ.
- Sao chép toàn bộ câu lệnh Master Prompt tạo tool từ file tài liệu đính kèm (có thể đổi tên 'ĐẠI GIA MANG DÉP' thành tên riêng) rồi dán vào Trình tạo công cụ và chờ 5–10 phút để AI dựng xong Dashboard.
- Tại mục 'Ảnh tham chiếu' của tool, bấm '+ Thêm mới' để tải ảnh nhân vật gốc lên và bấm tích chọn xác nhận nhãn 'Nhân vật ✓'.
- Mở ChatGPT, tải ảnh nhân vật gốc lên kèm câu lệnh yêu cầu viết 20–200 Prompt tiếng Anh thay đổi bối cảnh và góc quay, dặn rõ 'các prompt liền mạch, không cần đánh dấu các prompt'.
- Sao chép toàn bộ danh sách Prompt từ ChatGPT dán vào ô 'Danh sách Prompt' của tool, bấm 'Cập nhật danh sách', chọn tỷ lệ khung hình (`16:9`), số ảnh/prompt (`2 ảnh`), số luồng song song (`5 prompt`) rồi nhấn 'Bắt đầu chạy'.

---

## 7. CÁC LỖI CẦN TRÁNH (AVOID FLAGS)

- **Quên tích chọn nhãn `Nhân vật`:** Tải ảnh tham chiếu lên tool nhưng quên bấm tích chọn nút xác nhận `Nhân vật`, khiến tool không tự động đính kèm ảnh nhân vật gốc vào từng Prompt khi chạy hàng loạt.
- **Để lẫn dòng tiêu đề trong danh sách Prompt:** Để ChatGPT đánh số thứ tự hoặc chèn dòng tiêu đề (`Prompt 1:`, `Prompt 2:`) xen kẽ khi tạo danh sách khiến ô nhập theo dòng của tool nhận diện nhầm dòng tiêu đề là một câu lệnh vẽ ảnh.
- **Quên bấm `Cập nhật danh sách`:** Dán danh sách Prompt vào ô văn bản nhưng quên nhấn nút `Cập nhật danh sách` trước khi bấm `Bắt đầu chạy`, làm hàng đợi thực thi không nạp được các câu lệnh.
- **Bối rối khi giao diện đổi bố cục nhẹ:** Hoang mang khi thấy giao diện tool sinh ra có bố cục màu sắc hơi khác lần trước — mỗi lần AI biên dịch code giao diện có thể khác nhau đôi chút nhưng các nút chức năng cốt lõi vẫn giữ nguyên.

---

## 8. TÀI LIỆU ĐÍNH KÈM TRONG HỌC PHẦN (`COURSE_DOCS`)

- [Cẩm Nang Thực Chiến & Master Prompt Tạo Tool Tự Động Hóa (`master_prompt.md`)](../../assets/docs-dgmd/VIDEO-27e4e0/master_prompt.md)
- [Master Prompt Gốc Tạo Tool Tự Động Nhất Quán Nhân Vật (`doc_1.txt`)](../../assets/docs-dgmd/VIDEO-27e4e0/doc_1.txt)
- [Bản Sao Master Prompt Tạo Tool (`master_prompt.txt`)](../../assets/docs-dgmd/VIDEO-27e4e0/master_prompt.txt)
- [Tài Liệu Google Docs Export (`master_prompt.html`)](../../assets/docs-dgmd/VIDEO-27e4e0/master_prompt.html)
