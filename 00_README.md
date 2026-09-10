# H2DEV Project — Não Faceless YouTube

> Cập nhật: **2026-09-08**

Web quản lý **toàn bộ** kho học H2DEV (131 video) + tài sản nội bộ đã chuẩn hóa (prompt, báo cáo, pipeline).

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
3. Video — 132 SKU
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

- **132 video** · ~20.6 GB · ffprobe 132/132 có hình+audio · 22 free / 110 pro
- **98 tài liệu**: prompt 33 · report 20 · tool 17 · list 16 · other 12 (86 có file local; cập nhật 08/09; có file không đồng nghĩa file dùng được)
- **165 kênh mẫu** (152 sống · 13 dead 404 đã ẩn) · `ngay_do` 165/165
- **34 ngách** + 5 khối meta (tab Ngách xanh) — `xanh:true` 11 · CÓ MẪU TĂNG 10 · CHƯA ĐỦ BẰNG CHỨNG 8 · THẬN TRỌNG 3 · CÓ ĐK 2
  - Trụ: Phật Nhật · Everyday History EN · Kinh Thánh EN explainer · Wildlife documentary (không rescue)
- 4 pipeline trong `pipelines/` · Knowledge Hub trong `knowledge-hub/`
- `docs/` 133 thư mục (132 `VIDEO-*` + `NOI-BO`) · `assets/thumbs/` 132/132 khớp
- Raw kênh: 95 ảnh gốc + metadata OCR/Vision; bản hiển thị chuẩn nằm ở `assets/raw-kenh/` và `data-tabs/raw-kenh-mau.json`.
- Phân tích Gemini: `data/video_analysis_schema.json` (schema), `data/video_analysis_batches.json` (19 lô/132 video), `data/video_analysis_manifest.json` (trạng thái 132/132) và `data/video_analysis_public.json` (chỉ bản đã làm sạch).
- Quy trình AI Studio web, chia đoạn tối đa 5 phút chồng 10 giây, mẫu JSON nhập và tiêu chí kiểm chứng: `knowledge-hub/docs/GEMINI-VIDEO-ANALYSIS.md`. Không coi file tồn tại hoặc câu trả lời AI là bằng chứng nội dung đã đúng.
- Video nghiệm thu được theo dõi riêng tại `data/video_acceptance.json`; pilot Mirror hiện **chưa nghiệm thu** vì script thiếu độ dài và chưa có tài nguyên miễn phí đã xác nhận.
