# H2DEV Project — Não Faceless YouTube

> Cập nhật: **2026-09-08**

Web quản lý **toàn bộ** kho học H2DEV (136 bài: 132 video + 4 buổi Zoom) + tài sản nội bộ đã chuẩn hóa (prompt, báo cáo, pipeline).

## Cơ chế vận hành & Đồng bộ

- **Máy chủ chính:** Chạy tại thư mục cục bộ `D:\YTB\H2DEV-Project` trên máy `192.168.50.216`.
- **Khởi động server:**
  - Một nhấp: `H2DEV-OneClick.cmd`
  - Hoặc: `node server.js` (tự động bind `0.0.0.0:8899`)
- **Truy cập & Tự động đồng bộ sang các máy khác:**
  - **Mạng nội bộ (LAN):** [http://192.168.50.216:8899/](http://192.168.50.216:8899/)
  - **Mạng từ xa (Tailscale):** [http://100.83.146.28:8899/](http://100.83.146.28:8899/) (Tất cả máy trong mạng Tailscale tự động thấy data cập nhật ngay khi máy chính lưu file).
  - **Ổ mạng máy trạm:** Mapped thành ổ `Y:` (`\\192.168.50.216\laptopshare`).

Cây chuẩn: **[TREE.md](TREE.md)**

## 9 tab hiện tại

1. Tổng quan
2. Lộ trình (iframe `learn.html`)
3. Video — 136 SKU
4. Ngách xanh
5. Tài liệu — catalog + nội bộ
6. Nguồn reup
7. Kênh mẫu — 165
8. Raw kênh — 95 ảnh/record OCR
9. Chiến lược

## Nguyên tắc

- `data/` = catalog gốc, không sửa tay.
- `data-tabs/` = data sống (đúng 9 JSON, gồm `raw-kenh-mau.json`).
- File mới → `inbox/` → `node scripts/intake-inbox.js`.
- Trước sửa lớn → copy vào `_backup\<YYYYMMDD>\`.
- Xong → `node scripts/validate-project.js`.
- Gốc `Y:\YTB` không chứa MD rời.

## Data hiện tại

- **136 bài học** · ~21.9 GB · ffprobe 136/136 có hình+audio · 26 free / 110 pro
- **4 buổi Zoom** (2026-09): Nền tảng/Môi trường · Chiến lược kênh · Quy trình Tool · AdSense & Kháng lỗi — kèm tài liệu `docs/NOI-BO/zoom/`
- **103 tài liệu**: prompt 33 · report 20 · tool 17 · list 16 · other 12 · internal-doc 5 (cập nhật Zoom 11/09)
- **165 kênh mẫu** (152 sống · 13 dead 404 đã ẩn) · `ngay_do` 165/165
- **34 ngách** + 5 khối meta (tab Ngách xanh) — `xanh:true` 11 · CÓ MẪU TĂNG 10 · CHƯA ĐỦ BẰNG CHỨNG 8 · THẬN TRỌNG 3 · CÓ ĐK 2
  - Trụ: Phật Nhật · Everyday History EN · Kinh Thánh EN explainer · Wildlife documentary (không rescue)
- 4 pipeline trong `pipelines/` · Knowledge Hub trong `knowledge-hub/`
- `docs/` 137 thư mục (132 `VIDEO-*` + 4 `ZOOM-*` + `NOI-BO`) · `assets/thumbs/` 136/136 khớp
- Raw kênh: 95 ảnh gốc + metadata OCR/Vision; bản hiển thị chuẩn nằm ở `assets/raw-kenh/` và `data-tabs/raw-kenh-mau.json`.
- Phân tích Gemini: `data/video_analysis_schema.json` (schema), `data/video_analysis_batches.json` (20 lô/136 video), `data/video_analysis_manifest.json` (trạng thái 136/136) và `data/video_analysis_public.json` (chỉ bản đã làm sạch).
- Quy trình AI Studio web, chia đoạn tối đa 5 phút chồng 10 giây, mẫu JSON nhập và tiêu chí kiểm chứng: `knowledge-hub/docs/GEMINI-VIDEO-ANALYSIS.md`. Không coi file tồn tại hoặc câu trả lời AI là bằng chứng nội dung đã đúng.
- Video nghiệm thu được theo dõi riêng tại `data/video_acceptance.json`; pilot Mirror hiện **chưa nghiệm thu** vì script thiếu độ dài và chưa có tài nguyên miễn phí đã xác nhận.
