# VIDEO-0c72ab — V1 - Full 50 phút Thực chiến hướng dẫn quy trình A-Z làm ngách "What-If" đang cực HOT trends bằng Claude và Edit 100% = Claude code  |  Update 21-10-2026

## 1. Thông Tin Tổng Quan (H2DEV 7-Layer Verified)
- **Mã SKU:** `VIDEO-0c72ab` (Bài `#100`)
- **Tiêu đề gốc:** V1 - Full 50 phút Thực chiến hướng dẫn quy trình A-Z làm ngách "What-If" đang cực HOT trends bằng Claude và Edit 100% = Claude code  |  Update 21-10-2026
- **Chủ đề thực chiến:** V1 Full 50 Phút Thực Chiến Hướng Dẫn Quy Trình A-Z Làm Ngách Trends What-If Biên Tập 100% Bằng Claude Code
- **Ngách nội dung:** Tự Động Hóa YouTube, Edit Bằng Code & Ngách Giả Định What-If
- **Thị trường mục tiêu:** 🇺🇸 US / Global (Mã: `US`)
- **Thời lượng:** 50:03 (`3003s`)
- **File Video:** [`video/VIDEO-0c72ab/VIDEO-0c72ab.mp4`](/video/VIDEO-0c72ab/VIDEO-0c72ab.mp4)
- **Ảnh đại diện:** [`assets/thumbs/VIDEO-0c72ab.png`](/assets/thumbs/VIDEO-0c72ab.png)
- **Phụ đề chuẩn 1:1:** [`video/VIDEO-0c72ab/transcript.txt`](/video/VIDEO-0c72ab/transcript.txt)

---

## 2. Kênh Đối Thủ Trong Video & Mô Tả Gốc
### Danh sách kênh đối thủ xuất hiện trong bài giảng:
- `@thewhatiftales` (https://www.youtube.com/@thewhatiftales)
- `@IFOLOGYFILMS` (https://www.youtube.com/@IFOLOGYFILMS)

### Nội dung mô tả gốc (description.txt):
```text
đây là bản hướng dẫn làm thô cứng trước cho mấy bác hiểu qua, mai em sẽ lên thêm một siêu phẩm tự động vip hơn nữa nhen!

video chất lượng cao + thời lượng dài nên nó upload hơi tí ạ mấy bác thông cảm đợi nha

tài nguyên + Skill em để đây mấy bác nhé: https://drive.google.com/file/d/1wrtfXhzFF4z5wVLDU1J0tHAm0Mjlr6K3/view?usp=drive_link (Tệp lưu cục bộ: assets/docs/VIDEO-0c72ab/WhatIf-Skills.zip)

mọi người nhớ xem hết video để rõ chi tiết quy trình và nhiều thứ quan trọng nhé!
```

---

## 3. Mấu Chốt Bài Giảng (Key Takeaways)
- 📌 Bùng nổ ngách What-If hoạt hình 2D tại Hoa Kỳ: Kênh mẫu Ifverse (@thewhatiftales, phôi kênh 2022) mới đăng 14 video đã đạt hơn 6,3 triệu view (video đầu nổ 4,4 triệu view sau 14 ngày) và kênh IFOLOGY (@IFOLOGYFILMS) mới 17 video đã có bài đạt 4,1 triệu view nhờ xây dựng câu chuyện giả định kịch tính với 6 giọng đọc phân vai.
- 📌 Bộ kỹ năng WhatIf-Skills.zip đóng gói toàn diện: Tích hợp sẵn kho hiệu ứng âm thanh SFX miễn phí, quy tắc tạo kịch bản 8 phút (01_script), file hội thoại phân vai 6 nhân vật (02_dialogue / DGT) và file prompt tổng hợp (04_prompts) chạy trực tiếp trên Claude Code.
- 📌 Quy trình tạo hình ảnh đồng nhất 3 tầng trên Google Flow: Tạo cố định 8 nhân vật (CH-*) lưu vào thư mục series và 8 bối cảnh nền (LOC-01..LOC-08), sau đó giữ phím Ctrl chọn ảnh tham chiếu (REF) để sinh 74 ảnh phân cảnh (I001..I074) và chuyển 35 cảnh quan trọng thành video 8 giây (dùng chế độ Fast 20 credit, mở 2 tab song song).
- 📌 Tạo voice hội thoại 6 nhân vật trên ElevenLabs: Gắn 6 ID giọng đọc (từ #1 đến #6, ưu tiên model Multilingual v2 ổn định) cho từng tuyến nhân vật (Hero, người mẹ, bạn bè, bác sĩ) và chạy 160 giây để xuất toàn bộ file thoại khớp thứ tự kịch bản.
- 📌 Dựng video tự động 100% bằng Python & Claude Code: Chạy lệnh kiểm tra đủ 74 ảnh, 35 clip và file voice để xuất ra file GHEP.bat; code tự động cắt bỏ tạp âm trong video gốc, dùng khung đen che khéo logo ngôi sao góc phải dưới của Google Flow mà không làm mờ ảnh, rồi xuất thẳng MP4 1080p kèm phụ đề.

---

## 4. Kỹ Thuật Edit & SOP Né Quét AI
- **Quy trình cốt lõi:** Quy trình sản xuất hoạt hình 2D What-If tự động hóa với bộ WhatIf-Skills.zip, Google Flow, ElevenLabs 6 giọng và dựng 100% bằng Claude Code + Python.
- **Các bước triển khai chi tiết:**
  - Giải nén bộ WhatIf-Skills.zip, mở Claude Code tại thư mục dự án để sinh kịch bản 8 phút (01_script), file hội thoại 6 giọng (02-DGT) và file 04_prompts.
  - Trên Google Flow, tạo trước 8 ảnh nhân vật (CH) lưu vào thư mục series và 8 ảnh bối cảnh (LOC-01..LOC-08) để khóa đồng nhất ngoại hình xuyên suốt.
  - Tạo 74 ảnh phân cảnh (I001..I074) bằng cách giữ phím Ctrl chọn đúng ảnh REF nhân vật + bối cảnh theo hướng dẫn trong 04_prompts, sau đó tạo 35 video clip 8 giây ở chế độ Fast (20 credit).
  - Đưa file hội thoại 02-DGT vào tool ElevenLabs gắn 6 ID giọng đọc (#1 đến #6, model Multilingual v2) để xuất thư mục voice đồng bộ.
  - Chạy lệnh dựng video trên Claude Code để kiểm tra tài nguyên, tự động che logo góc phải dưới bằng khung đen và chạy file GHEP.bat xuất video Full HD 1080p.

---

## 5. Cảnh Báo & Lỗi Cần Tránh (Avoid Flags)
- ⚠️ Không đặt sai tên file hoặc thiếu số thứ tự trong 74 ảnh phân cảnh (I001..I074) và 35 video clip vì script Python ghép tự động theo đúng mã file.
- ⚠️ Không dùng tool xóa logo bên thứ ba làm nhòe góc khung hình; tận dụng cơ chế khung đen của code edit để che logo ngôi sao của Google Flow ở góc phải dưới.
- ⚠️ Không nhảy cóc sang bản tự động hóa V2 nếu chưa nắm vững cấu trúc thư mục và quy trình tham chiếu nhân vật ở bản V1 này.

---

## 6. Mốc Thời Gian Trọng Tâm (Key Timestamps)
- **[00:00]** Phân tích 2 kênh What-If Hoa Kỳ (@thewhatiftales, @IFOLOGYFILMS) nổ 4 triệu view và bộ WhatIf-Skills.zip (`0s`)
- **[09:54]** Khởi tạo dự án trên Claude Code: Sinh kịch bản 8 phút, file hội thoại 6 giọng (02-DGT) và 04_prompts (`594s`)
- **[16:10]** Tạo 8 ảnh nhân vật (CH) và 8 ảnh bối cảnh (LOC) cố định trên Google Flow để khóa ngoại hình (`970s`)
- **[24:50]** Ghép ảnh tham chiếu (REF) sinh 74 ảnh phân cảnh (I001..I074) trên Google Flow (`1490s`)
- **[32:50]** Chuyển 35 phân cảnh thành video 8 giây (Fast 20 credit) và tạo hội thoại 6 giọng ElevenLabs (`1970s`)
- **[41:14]** Chạy Claude Code & GHEP.bat dựng tự động 100% ra video 1080p có phụ đề và che logo góc phải (`2474s`)

---

## 7. Công Cụ Sử Dụng Trong Bài
- **Công cụ & Nền tảng:** `Claude`, `Google Flow`, `ElevenLabs`, `Python`
