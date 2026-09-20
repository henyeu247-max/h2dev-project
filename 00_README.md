# H2DEV Project — Não Faceless YouTube

> Cập nhật: **2026-09-16**

Web quản lý **toàn bộ** kho học H2DEV (140 bài: 136 video + 4 buổi Zoom) + tài sản nội bộ đã chuẩn hóa (prompt, báo cáo, pipeline).

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
3. Video — 140 SKU
4. Ngách xanh
5. Tài liệu — catalog + nội bộ
6. Nguồn reup
7. Kênh mẫu — 165
8. Raw kênh — 156 record canonical (149 kênh unique · 7 bản ghi trùng)
9. Chiến lược

## Nguyên tắc

- `data/` = catalog gốc, không sửa tay.
- `data-tabs/` = data sống (đúng 9 JSON, gồm `raw-kenh-mau.json`).
- File mới → `inbox/` → `node scripts/intake-inbox.js`.
- Trước sửa lớn → copy vào `_backup\<YYYYMMDD>\`.
- Xong → `node scripts/validate-project.js`.
- Gốc `Y:\YTB` không chứa MD rời.

## Data hiện tại

- **140 bài học** · ~23.52 GB (21.90 GiB) · ffprobe **140/140** có hình + audio (0 file 0 byte) · 27 free · 113 pro
- **4 buổi Zoom** (2026-09): Nền tảng/Môi trường · Chiến lược kênh · Quy trình Tool · AdSense & Kháng lỗi — kèm tài liệu `docs/NOI-BO/zoom/` và `ZOOM-00` (tài liệu quy trình, không phải bài học)
- **157 tài liệu**: prompt 78 · report 20 · tool 23 · list 16 · other 11 · internal-doc 5 (gồm cẩm nang nhạc nền NOI-BO-MUSIC-01)
- **38 tracks nhạc nền đã audit Gemini Multimodal**: 25 SAFE (YPP) · 9 REVIEW · 4 COPYRIGHTED loại bỏ — quản lý tại `data/music_catalog.json` & cẩm nang `assets/docs/tai-lieu/CATALOG-NHAC-NEN-EDIT-CHUAN-NGACH.md`
- **165 kênh mẫu** (152 sống · 13 dead 404 đã ẩn) · `ngay_do` 165/165
- **34 ngách** + 5 khối meta (tab Ngách xanh) — `xanh:true` 11 · CÓ MẪU TĂNG 10 · CHƯA ĐỦ BẰNG CHỨNG 8 · THẬN TRỌNG 3 · CÓ ĐK 2
  - Nhóm ứng viên khảo sát tiêu biểu: Phật Nhật · Everyday History EN · Khoa học ru ngủ EN · Kinh Thánh EN explainer · Wildlife documentary (luôn rà soát theo dữ liệu YouTube sống)
- 4 pipeline trong `pipelines/` · Knowledge Hub trong `knowledge-hub/`
- `docs/` 142 thư mục (136 `VIDEO-*` + 5 `ZOOM-*`, gồm `ZOOM-00` quy trình + 4 buổi, + `NOI-BO`) · `assets/thumbs/` 140/140 khớp
- Raw kênh: 156 record canonical (149 kênh unique · 7 bản ghi trùng channel); bản hiển thị chuẩn nằm ở `assets/raw-kenh/` và `data-tabs/raw-kenh-mau.json`.
- Khung tiêu chuẩn nghiệm thu video mẫu mở được quản lý tại `data/video_acceptance.json`, sẵn sàng áp dụng linh hoạt cho bất kỳ đề tài nào được chọn thử nghiệm.
