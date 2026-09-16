# KẾ HOẠCH QUẢN TRỊ & KHUNG NGHIÊN CỨU MỞ YOUTUBE FACELESS (H2DEV)

> **Tầm nhìn & Định hướng:** Xây dựng H2DEV thành một nền tảng nghiên cứu, thẩm định và động cơ sản xuất YouTube Faceless MỞ — liên tục thích ứng, tìm kiếm cơ hội mới dựa trên dữ liệu thời gian thực (vidIQ, YouTube Outliers), không bị trói buộc cứng nhắc vào bất kỳ ngách hay kịch bản đơn lẻ nào.  
> **Nguyên tắc vận hành:** Lấy dữ liệu thực chứng làm gốc, nói thật, làm thật, kiểm tra số liệu sống trước khi bấm máy, linh hoạt chuyển hướng khi phát hiện sóng thị trường mới.

---

## PHẦN 1: TÀI SẢN NỀN TẢNG ĐÃ CHỨNG THỰC (GROUND TRUTH INVENTORY)

Toàn bộ tài nguyên trên máy chủ cục bộ `D:\YTB\H2DEV-Project` đã qua kiểm định tất định 100%:

### 1. Kho học liệu bài giảng (136 bài học — ~21.9 GB)
- **132 video bài giảng MP4 (`VIDEO-*`):** Hướng dẫn từ A đến Z cách làm YouTube (nuôi mail, môi trường sạch, nghiên cứu từ khóa, dựng video, kháng lỗi bản quyền và AdSense). Đầy đủ phụ đề đa định dạng (`.srt`, `.txt`, `.json`).
- **4 video ghi hình Zoom chuyên sâu (`ZOOM-01..04` — WebM):** Thực chiến nền tảng môi trường, chiến lược tách kênh, quy trình tool và AdSense kháng lỗi. Đầy đủ transcript và tài liệu tóm lược trong `docs/NOI-BO/zoom/`.
- Kiểm định `ffprobe`: **136/136 video có đầy đủ luồng hình ảnh và âm thanh**, 0 file lỗi, 0 file 0 byte.

### 2. Kho kênh đối thủ mẫu (165 kênh theo dõi)
- **152 kênh đang hoạt động (Live):** Dữ liệu đối chiếu đa thị trường (Mỹ, Nhật, Hàn, Việt Nam).
- **13 kênh đã dừng/chết (Dead 404):** Đã gắn cờ ẩn khỏi giao diện để tránh làm sai lệch việc nghiên cứu.
- **83 kênh Raw Canonical:** Chuẩn hóa và khử trùng 1:1 từ 95 ảnh chụp màn hình đối thủ thực tế ngoài thị trường.

### 3. Ma trận khảo sát ngách (34 ngách thị trường — Khung động)
- **Danh mục ứng viên linh hoạt:** Phân thành 3 nhóm (Tiềm năng cao, Cần theo dõi thêm, và Cảnh báo rủi ro chính sách).
- **Nguyên tắc cốt lõi:** Ngách không tự xanh hay đỏ vĩnh viễn. Dữ liệu trong kho là ảnh chụp tham chiếu (Snapshot); trước khi làm bất kỳ video nào, bắt buộc phải dùng vidIQ đo lại dữ liệu sống trong 30 ngày gần nhất.

### 4. Kho tài liệu & Pipeline kỹ thuật (109 tài liệu)
- **109 tài liệu nghiệp vụ:** 35 bộ prompt chuẩn, 20 báo cáo phân tích thị trường, 22 tools, 16 checklists/danh mục và tài liệu Zoom.
- **4 pipeline cấu trúc sẵn:** `bible-explainer/`, `wildlife/`, `hoat-hinh-ai/`, `ton-giao/` — sẵn sàng điều chỉnh cho mọi đề tài mới.

---

## PHẦN 2: NGUYÊN TẮC GIẢI PHÓNG — DỰ ÁN MỞ ĐỂ TÌM KIẾM & PHÁT TRIỂN

1. **Tuyệt đối không khoá cứng ngách hoặc kịch bản:**
   - Không có quy tắc nào bắt buộc dự án phải làm duy nhất một video hay một ngách cụ thể.
   - Các ý tưởng kịch bản nháp trong kho (như kịch bản Chiếc Gương) chỉ là các bài tập/tài liệu tham khảo lịch sử, không phải nút thắt cổ chai cản trở dự án.
2. **Quy trình 3 pha ra quyết định (Bảo vệ vốn & công sức):**
   - **Pha 1 — Quét sóng sống (Live Discovery):** Dùng vidIQ Outliers quét các video bùng nổ view trong 30–90 ngày qua của các kênh nhỏ (<50K sub).
   - **Pha 2 — Thẩm định 5 bước:** Đo Volume (>65), Competition (<50), RPM ước tính, kiểm tra 3 vùng cấm của YouTube YPP.
   - **Pha 3 — Thử nghiệm linh hoạt (Dynamic Pilot):** Khi anh em cùng thống nhất một đề tài hội tụ đủ dữ liệu tốt, lúc đó mới bấm máy làm video thử nghiệm hoàn chỉnh.
3. **Quy tắc Check N/N & Bằng chứng 3 mức:**
   - 100 đối tượng kiểm tra đủ 100.
   - Mọi nhận định kỹ thuật chỉ có 3 trạng thái rõ ràng: `[CÓ] / [KHÔNG] / [KHÔNG-VERIFY-ĐƯỢC]`. Không đoán mò.

---

## PHẦN 3: LỘ TRÌNH THỰC THI HIỆN TẠI (MỞ & THỰC CHIẾN)

### Bước 1: Duy trì Sức Khỏe & Bảo Mật Hệ Thống (Nền tảng vững)
- Duy trì bộ kiểm định tự động `validate-project.js` và `verify-routing.js` đạt PASS 100%.
- Giữ sạch biên mạng nội bộ (HTTP 403 cho các thư mục private/audit/backup).

### Bước 2: Khảo sát Dữ Liệu Sống & Sàng Lọc Cơ Hội (Đang triển khai)
- Chủ động rà soát thị trường qua vidIQ / YouTube Live để phát hiện các ngách đang lên (ví dụ: Khoa học đại dương ru ngủ, Khảo cổ nguồn gốc loài người, Lời dạy cổ nhân...).
- Phân tích cơ chế giữ chân (retention) và định dạng kịch bản của các kênh đang thắng thật.

### Bước 3: Vận Hành Khung Sản Xuất Thử Nghiệm (Khi chốt đề tài)
- Áp dụng Khung nghiệm thu video mở (`data/video_acceptance.json`) cho bất kỳ đề tài nào được duyệt.
- Sản xuất trọn vẹn từ Kịch bản (1.200–1.500 từ) → Giọng đọc AI → Ảnh minh hoạ → File MP4 hoàn chỉnh để thẩm định chất lượng thực tế.
