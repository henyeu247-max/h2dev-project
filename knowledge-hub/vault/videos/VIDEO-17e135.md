---
sku: "VIDEO-17e135"
title: "Update Quy Trình Sản Xuất tool Tự Động Và Nhất Quán Nhân Vật"
track: "dgmd"
module_id: "DGMD-M10"
module_title: "TƯ DUY CẦN NHỚ KHI XÂY DỰNG KÊNH YOUTUBE"
seq: "02"
niche: "Tooling & Tự Động Hóa YouTube"
markets: ["🇻🇳 Việt Nam", "🌍 View Ngoại"]
duration: "14:44"
published_at: "2026-10-12"
toolsCount: 4
channelsCount: 0
docsCount: 5
player_url: "/player.html?sku=VIDEO-17e135&track=dgmd"
---

# VIDEO-17e135 — Update Quy Trình Sản Xuất tool Tự Động Và Nhất Quán Nhân Vật

> **Chuỗi Liên Kết Tri Thức (Knowledge Graph Links):**  
> - **Track:** [[tracks/TRACK-DGMD|Nhánh Đại Gia Mang Dép (DGMD) · Thực Chiến Đa Kênh (45 Videos)]]  
> - **Module:** [[modules/DGMD-M10|DGMD-M10 — TƯ DUY CẦN NHỚ KHI XÂY DỰNG KÊNH YOUTUBE]] (Bài `#02`)  
> - **Ngách nội dung (Niche):** [[niches/tooling-tu-dong-hoa-youtube|Tooling & Tự Động Hóa YouTube]]  
> - **Thị trường:** 🇻🇳 Việt Nam · 🌍 View Ngoại | **Thời lượng:** `14:44` | **Ngày đăng:** `2026-10-12`  
> - **Mở trên Player:** [Xem Video & Phụ Đề Tương Tác](/player.html?sku=VIDEO-17e135&track=dgmd) · [Hồ sơ gốc README.md](../../../docs/VIDEO-17e135/README.md)

---

## 1. Chủ Đề Thực Tế & Giá Trị Cốt Lõi (`Key Takeaways`)
- **Chủ đề thực tế:** Quy trình dùng ChatGPT sinh Master Prompt để tự động code Web-Tool tạo ảnh/video hàng loạt trên Google Flow (chạy 5 prompt/lượt, tự tải về máy) và khóa nhất quán nhân vật 100–1.000 phân cảnh
- Người mới hoàn toàn không cần biết lập trình vẫn có thể tự tạo tool tự động hóa bằng tư duy Meta-Prompting: Giao vai 'chuyên gia về code tool' cho ChatGPT để AI viết bản đặc tả Master Prompt hơn 20 tiêu chí kỹ thuật thay vì tự viết thủ công.
- Trình tạo công cụ (Tools Builder) tích hợp sẵn bên trong Google Flow (tài khoản nâng cấp gói Veo 3 Ultra giá rẻ 30.000–50.000đ) cho phép biến bản Master Prompt thành một ứng dụng tạo ảnh/video hàng loạt ngay trên trình duyệt kèm nút Tự Fix khi phát sinh lỗi giao diện.
- Một công cụ tạo ảnh hàng loạt thực chiến trên Google Flow bắt buộc phải khai báo đủ 5 nhóm tính năng trong câu lệnh gốc: (1) Nút tải nhiều ảnh tham chiếu nhân vật, (2) 5 tỷ lệ khung hình 16:9, 4:3, 1:1, 3:4, 9:16, (3) Chọn 1–4 ảnh cho mỗi prompt, (4) Xử lý hàng đợi 5 prompt song song liên tục, và (5) Tự động đánh dấu ID/hash tải từng ảnh hoàn tất về thư mục chỉ định.
- Để mở rộng từ Tool tạo ảnh sang Tool tạo video tự động hàng loạt trên Google Flow, học viên chỉ cần đổi từ khóa 'tạo ảnh' sang 'tạo video' trong câu lệnh yêu cầu ChatGPT viết Master Prompt.
- Bí quyết giữ nhất quán nhân vật xuyên suốt 100–1.000 phân cảnh là quy trình 2 bước trên ChatGPT: Đính kèm ảnh mẫu (lấy từ Pinterest như nhân vật Rumi hoặc Stickman) để lập Master Prompt khóa chặt đặc điểm nhận dạng trước, sau đó mới gõ lệnh 'tạo 100 prompt cho tôi' để các câu prompt sinh ra có độ dài và cấu trúc đồng đều tuyệt đối.
- Yêu cầu 'không cần đánh dấu prompt' trong câu lệnh số 2 là chi tiết kỹ thuật then chốt giúp danh sách 100 prompt xuất ra ở dạng các đoạn văn độc lập, khi dán vào ô phân tích của Tool Google Flow sẽ tự động tách dòng chính xác mà không bị lẫn số thứ tự vào câu mô tả ảnh.

## 2. Quy Trình Sản Xuất & Dựng Video (`Edit SOP`)
- **Trọng tâm:** Quy trình 5 bước dùng ChatGPT và Google Flow tự code Tool tạo ảnh/video hàng loạt và khóa nhất quán nhân vật 100 phân cảnh
1. Copy câu lệnh số 1 trong tài liệu đính kèm gửi vào ChatGPT để AI đóng vai chuyên gia code tool và sinh bản đặc tả Master Prompt đầy đủ giao diện, hàng đợi 5 luồng và cơ chế tự tải file.
2. Truy cập Google Flow (labs.google/fx/vi/tools/flow), mở mục Công cụ ở thanh menu trái, nhấn nút dấu cộng Tạo mới và dán toàn bộ Master Prompt vừa sinh vào để hệ thống tự dựng tool Đại Gia Mang Dép.
3. Tìm và tải hình ảnh nhân vật gốc cần giữ đồng nhất từ Pinterest (ví dụ nhân vật Rumi hoặc Stickman) về máy tính, đồng thời nạp ảnh này vào tab Tham chiếu trên tool Google Flow.
4. Đính kèm ảnh nhân vật vừa tải lên ChatGPT cùng câu lệnh số 2 để tạo khung Master Prompt khóa nhận diện nhân vật, sau đó gõ tiếp 'tạo 100 prompt cho tôi' để lấy danh sách 100 prompt chi tiết không đánh số thứ tự.
5. Sao chép toàn bộ 100 prompt dán vào ô nhập liệu của tool trên Google Flow, nhấn Phân tích rồi bấm Bắt đầu tạo để tool tự động chạy 5 prompt cùng lúc và tự động tải từng ảnh hoàn chỉnh về thư mục máy tính.

## 3. Cảnh Báo Rủi Ro & Lỗi Cần Tránh (`Avoid Flags`)
- ⚠️ Không tự ngồi viết tay Master Prompt dài hàng chục tiêu chí hoặc nhập thủ công từng câu prompt một vào Google Flow vì vừa tốn thời gian vừa thiếu các ràng buộc luồng xử lý và chống trùng file.
- ⚠️ Không yêu cầu ChatGPT sinh ngay 100 prompt từ câu lệnh ngắn mà bỏ qua bước tạo Master Prompt khóa nhân vật trước, vì sẽ khiến các câu prompt bị câu ngắn câu dài thất thường và làm biến dạng nhân vật.
- ⚠️ Không đánh số thứ tự hoặc ký hiệu đánh dấu ở đầu mỗi câu prompt trong danh sách 100 prompt để tránh làm hỏng bộ tách dòng tự động khi dán hàng loạt vào tool trên Google Flow.
- ⚠️ Không sử dụng hình ảnh người nổi tiếng có thật hoặc hình ảnh nhạy cảm, hở hang làm ảnh tham chiếu nhân vật vì sẽ bị bộ lọc chính sách của Google Flow và ChatGPT từ chối xử lý.

## 4. Liên Kết Công Cụ AI & Phần Mềm (`Tools Mentioned`)
- [[tools/google-flow|Google Flow]]
- [[tools/veo-3-ultra|Veo 3 Ultra]]
- [[tools/chatgpt|ChatGPT]]
- [[tools/pinterest|Pinterest]]

## 5. Liên Kết Kênh Mẫu & Đối Thủ (`Competitor Channels`)
- *(Bài học tập trung vào tư duy/kỹ thuật nền tảng, không gắn kênh đối thủ cụ thể)*

## 6. Tài Liệu Đính Kèm Bài Học (`Course Docs`)
- **Hồ sơ phân tích & SOP thực chiến: Update Quy Trình Sản Xuất tool Tự Động Và Nhất Quán Nhân Vật (README.md):** `docs/VIDEO-17e135/README.md`
- **Bộ Master Prompt Code Tool Tự Động & Khóa Nhất Quán Nhân Vật Google Flow (Chuẩn Hóa Markdown):** `assets/docs-dgmd/VIDEO-17e135/master_prompt.md`
- **Tài Liệu Gốc Google Docs: Bài 1 Code Tool Tạo Ảnh Và Video Nhất Quán Nhân Vật Flow:** `assets/docs-dgmd/VIDEO-17e135/doc_1.txt`
- **Bản Sao Text Gốc: 2 Câu Prompt Tạo Tool & Tham Chiếu 100 Hình Ảnh:** `assets/docs-dgmd/VIDEO-17e135/master_prompt.txt`
- **Bản ghi phụ đề đầy đủ (Transcript .txt):** `video/VIDEO-17e135/transcript.txt`

## 7. Mốc Thời Gian Trọng Tâm (`Key Timestamps`)
- `00:00` (0s) — Tổng quan tư duy dùng AI tự code tool tạo 100–1.000 ảnh/video nhất quán nhân vật mỗi ngày với tài khoản Google Flow (Veo 3 Ultra) và ChatGPT
- `01:08` (68s) — Phân tích cấu trúc câu lệnh số 1: Giao vai chuyên gia code tool cho ChatGPT để sinh Master Prompt tạo công cụ tự động trên Google Flow
- `02:11` (131s) — Thiết lập thông số kỹ thuật trong câu lệnh: 5 tỷ lệ khung hình (16:9, 4:3, 1:1, 3:4, 9:16), chọn 1–4 ảnh/prompt, chạy 5 prompt cùng lúc và tự động tải về thư mục
- `04:43` (283s) — Chạy câu lệnh trên ChatGPT để đóng gói bản đặc tả Master Prompt hơn 20 tiêu chí (giao diện, hàng đợi, chống trùng file)
- `06:26` (386s) — Dán Master Prompt vào mục Công cụ -> Tạo mới trên Google Flow để khởi tạo Web-App Đại Gia Mang Dép - AI Image Automation và dùng tính năng Tự Fix lỗi
- `08:48` (528s) — Tải ảnh nhân vật mẫu Rumi từ Pinterest và gửi kèm câu lệnh số 2 vào ChatGPT để sinh Master Prompt khóa nhận diện nhân vật
- `11:34` (694s) — Ra lệnh tạo 100 prompt cho tôi trên ChatGPT để xuất danh sách 100 prompt độ dài đồng đều, không đánh số thứ tự đầu dòng
- `13:12` (792s) — Nạp ảnh tham chiếu Rumi cùng 100 prompt vào tool trên Google Flow, kích hoạt chạy tự động 5 prompt/lượt và tự động tải ảnh hoàn chỉnh về máy
