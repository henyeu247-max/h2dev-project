# 97yo-dev Project — Hệ Sinh Thái Đào Tạo & Radar Kho YouTube (H2DEV · Huân Academy · DGMD)

> Cập nhật: **2026-10-29**

Web quản lý **toàn bộ** kho học H2DEV (148 bài: 144 video + 4 buổi Zoom) cùng 2 nhánh con Huân Academy (140 bài) và Đại Gia Mang Dép (45 bài) — tổng hợp **333 bài học** trên nền tảng **97yo-dev** (`https://97yo-dev-learn.tonymmo.com`) + tài sản nội bộ đã chuẩn hóa (prompt, báo cáo, pipeline).

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
3. Video — 148 SKU
4. Ngách xanh
5. Tài liệu — catalog + nội bộ
6. Nguồn reup
7. Kênh mẫu — 1076
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

- **148 bài học** · ~89.26 GB (83.13 GiB) · ffprobe **333/333** có hình + audio (0 file 0 byte) · 27 free · 121 pro
- **4 buổi Zoom** (2026-09): Nền tảng/Môi trường · Chiến lược kênh · Quy trình Tool · AdSense & Kháng lỗi — kèm tài liệu `docs/NOI-BO/zoom/` và `ZOOM-00` (tài liệu quy trình, không phải bài học)
- **580 tài liệu**: theo `kind` (100% đã phân loại) prompt 211 · report 28 · tool 40 · list 22 · other 8 · internal-doc 11 · sop 90 · guide 102 · transcript 57 · sheet 11 · 0 chưa gán `kind`; gồm cẩm nang nhạc nền NOI-BO-MUSIC-01
- **49 tracks nhạc nền đã audit Gemini Multimodal & FFprobe**: 36 SAFE (YPP) · 9 REVIEW · 4 COPYRIGHTED loại bỏ — quản lý tại `data/music_catalog.json` & cẩm nang `assets/docs/tai-lieu/CATALOG-NHAC-NEN-EDIT-CHUAN-NGACH.md`
- **1076 kênh mẫu** (987 sống · 89 dead 404 đã ẩn) · `ngay_do` 1076/1076 (đo thực tế cả 1076 kênh: 987 sống · 75 DIE 404 · 14 kênh rỗng 0 video; bằng chứng `_audit/20261014-kenh-mau-probe.jsonl` & `data/ngachxanh_handle_probes.json`)
- **40 ngách** + 5 khối meta (tab Ngách xanh) — `xanh:true` 16 · CÓ MẪU TĂNG 11 · CHƯA ĐỦ BẰNG CHỨNG 6 · THẬN TRỌNG 5 · CÓ ĐK 2
  - Nhóm ứng viên khảo sát tiêu biểu: Phật Nhật · Everyday History EN · Khoa học ru ngủ EN · Kinh Thánh EN explainer · Wildlife documentary (luôn rà soát theo dữ liệu YouTube sống)
- 5 pipeline trong `pipelines/` (`hoat-hinh-ai`, `wildlife`, `ton-giao`, `everyday-history`, `bible-explainer`) · Knowledge Hub trong `knowledge-hub/`
- `docs/` 339 thư mục (329 `VIDEO-*` + 5 `ZOOM-*`, gồm `ZOOM-00` quy trình + 4 buổi, + `NOI-BO`) · `assets/thumbs/` 148/148 khớp
- Raw kênh: 156 record canonical (149 kênh unique · 7 bản ghi trùng channel); bản hiển thị chuẩn nằm ở `assets/raw-kenh/` và `data-tabs/raw-kenh-mau.json`.
- Khung tiêu chuẩn nghiệm thu video mẫu mở được quản lý tại `data/video_acceptance.json` (hiện ở trạng thái `paused` theo Phương án B để tập trung hoàn thiện sườn ứng dụng và các pipeline sản xuất chuyên biệt).
