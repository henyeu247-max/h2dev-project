# Tiến độ — H2DEV-Project

> Cập nhật cuối phiên: **2026-10-09** (cuối vòng 3). File này được viết lại mỗi cuối phiên. Đọc đầu phiên cùng `AGENTS.md`, plan đang mở và lịch sử commit gần nhất.

## Phiên 2026-10-14 — sửa gaps (chi tiết: `CHANGELOG.md` mục 2026-10-14, báo cáo `docs/reports/2026-10-14-gap-audit.md`)
- **Deploy (đợt 7):** `main` = `origin/main` = `vps main` = `0627819`; kiểm 3 vòng PASS (xem CHANGELOG đợt 7). F2 đã đóng: 4 SKU mới trên VPS 200/206. Đã xử lý ở đợt 8 (2026-10-15): RỖNG, `fetch_h2dev_video.cjs` (giữ), `B380A1`. Đợt 9 đã gộp nốt mọi sửa dở (`ngach-xanh.json`, `kich-ban.json`, `voice-dna-probe-final.json`, `h2dev-components-lesson-row.css`, 10 `description.txt`) và nghiệm thu; không còn thay đổi chưa commit.
- **Bài học đẩy VPS:** VPS main và origin trước đây khác SHA dù cùng cây. Đã hợp nhất bằng commit `0627819` (hai cha). Từ nay đẩy `main` fast-forward cho cả hai remote, không force-push.
- **Check-pass (đợt 4–5):** sửa 18 neo chết của `sync-counts` + số liệu cũ trong 5 tài liệu; đã xử lý 13 video mốc vượt thời lượng, 20 video thiếu mốc, 4 SKU mới thiếu tags/phụ đề, 1 `fileLocal` placeholder. `audit_videos_v2`: 140/144 clean, 4 issue còn lại là F2 (chưa có trên VPS — deploy); A8d = 0 (đợt 6). Chi tiết: `CHANGELOG.md` đợt 4 và 5.

- Đã sửa và đo lại: G1, G2, G4, G5, G7, G10, G11, G14 (mã), G15. Toàn bộ gate + deep-ui 11/11 + g2 23/23 + find-404 sạch.
- Đo thực tế 256/256 kênh (187 sống · 59 DEAD · 10 EMPTY) — G3 đóng; báo cáo `docs/reports/2026-10-14-kenh-mau-do-thuc-te.md`.
- `server.js` (G14) đã nạp trong dịch vụ, đo lại: `/index.html%00.js` → 400.
- G8, G9, G12 đã làm; G13 kiểm lại thì sai (thumb webp/jpeg đang được dùng) nên không dọn. Không còn gap mở. Handle và DB kênh mẫu đã đồng bộ với kết quả đo.
- 10 file đang sửa dở thuộc việc khác (không phải của phiên này): `sw.js`, `content.js` (phần ngoài G5), `h2dev-components-lesson-row.css`, `kenh-mau.json`, `kich-ban.json`, `ngach-xanh.json`, `voice-dna-probe-final.json`, `index.html`, `learn.html`, `player.html`. Bản chụp tách riêng: `_backup/20261014-gap-fix/pre-existing.patch`.
- Sau lần tải đầu, service worker có thể trả CSS/JS cũ — Ctrl+Shift+R.

## Đã xong

- **UI-standard đợt 1:** commit `c22844d`, `f21837e`, `c984695` trên `ui/ui-standard-2026-10-09` (chưa push). Báo cáo `docs/reports/2026-10-09-ui-standard-round1.md`.
- **UI-standard đợt 2:** nằm trong commit `800caa4` (commit của việc khác). Báo cáo `docs/reports/2026-10-09-ui-standard-round2.md`; bài học H2DEV-UI-013 đến 024.
- **Vòng 3 (commit `13c40f5`):** mồ côi 36 → 0 trên 60 tổ hợp route × cỡ; nút "Đi nhanh" điện thoại 2 cột; hàng có nhãn đến 4 chip chia đều từ 641 px; nhãn KPI cân đối. Phiên bản tài nguyên `uifix81`. Nút "Cuộn lên đầu trang" ở 820 và 1024 px không còn bị thanh điều hướng dưới che. Thanh nút `/chienluoc` điện thoại (6 nút) giữ một hàng, cuộn ngang; trước đó hàng đầu bị tiêu đề che.
- **Route spider:** chỉ nhận POST kèm `X-H2DEV-Action: spider` (`server.js`, đã nằm trong `551be56`); dịch vụ đã nạp (POST không header → 403).
- **Tường lửa:** luật `H2DEV-8899 chan Public` (Block, TCP 8899, Public) đã tạo. LAN và Tailscale vẫn 200.
- **Tailscale:** Funnel cổng 8443 đã tắt (cấu hình sao lưu); handler chỉ trong tailnet giữ nguyên.
- **Kiểm lại UX, animation, logic, dữ liệu `/tatca` (`uifix81`):** 31/31 phép đối chiếu dữ liệu; Lighthouse bốn hạng mục 100 (không có Performance; trace LCP 292 ms, CLS 0,00); lớp phủ và chạm thật 30/30; 6 lỗi tìm thấy đã sửa (đếm file local 275 → 269, nút "File local" sai ở 6 thẻ, tên truy cập logo, vòng focus trang bài học, khóa cuộn khi lớp phủ mở, đồng bộ vòng focus KPI). Chi tiết: báo cáo, mục 10.
- **Kiểm chứng dữ liệu với nguồn ngoài (`uifix81`):** 256/256 kênh dò lại trên YouTube, 7/7 chính sách đối chiếu YouTube Help. Đã sửa: 10 kênh lệch cờ sống/chết, 1 ngách hạ xanh, 20 avatar 404, 10 nhãn thị trường, chính sách 1/5/6, thẻ "Kênh mẫu sạch" (0 → 51), thẻ "RPM Benchmark". Còn mở: 49/256 kênh thiếu `niche` và `markets`; 3 bộ tên ngách chưa có bảng ánh xạ; 5 video có nhãn thị trường lệch chữ viết tên kênh cần chủ dữ liệu xem; 14 đường dẫn trong `kich-ban.json` trỏ thư mục `.agents` không tồn tại; điều kiện "đăng trong 30 ngày" của ngách xanh chưa kiểm lại. Sau rà soát độc lập: 16 URL kênh hỏng (11 thẻ sống dẫn vào 404) đã chuẩn hóa; xung đột đo lường với commit `a97383a` ghi ở báo cáo mục 11. Chi tiết: báo cáo, mục 11.
- **Kiểm thử:** `validate-project`, sáu gate, `sync-counts --check`, `playwright-g2-acceptance` 23/23, `deep-ui-acceptance` 11/11: đều đạt.
- **Skill toàn cục `ui-ux-standard`:** đã sửa và đồng bộ tới 11 nơi; kiểm độc lập 649/649 bản sao khớp.
- **Quy Trình Xây Kênh A–Z & Ma Trận 144 Bài Học Chuẩn Toàn Diện:** Tái cấu trúc quy trình thành 16 bước SOP thực chiến (8 giai đoạn) gắn 100% 144 video bài học, 300 tài liệu SOP và 156 raw kênh. Tích hợp Subtab "Ma trận 144 Bài" (`sub=matrix144`) với trích đoạn phụ đề, SOP né AI và avoid flags. Kiểm thử Playwright E2E 16/16 bước, 144/144 cards, 0 console errors. Báo cáo nghiệm thu độc lập tại `docs/reports/2026-10-09-teamwork-e2e-verification-report.json`.

## Đang làm

- Không có.

## Tiếp theo

- Kiểm ACL tailnet (máy của `masterdev8386@`).
- G-2 (chip cùng hàng lệch chiều rộng): điện thoại và cụm chip dài.
- Nhóm vùng chạm dưới 44 px (DoD-3).

## Lỗi và việc còn treo

- G-2 chưa đạt: 54 vùng / 28 tổ hợp. Điện thoại: hàng có nhãn và hàng chip thuần lệch 30–40 px. Cụm chip dài (Kênh mẫu 34 chip): chưa có cách chia đều an toàn.
- Nhãn KPI "Ngách có data" còn 2 dòng ở 390 px (đã cân đối, không còn chữ lẻ).
- Vùng chạm dưới 44 px: 4.628 (DoD-3, chưa nhóm).
- Nút "Đọc trực tiếp" ngắt chữ ở 1440 px (VIDEO-2aa1f7).
- Nút Quay lại về đầu trang `/tatca`, không khôi phục vị trí cuộn (chấp nhận được; cần can thiệp bộ định tuyến).
- Nội dung chính sách YouTube cập nhật 2026-09-16: việc của người sở hữu dữ liệu.
- Chưa kiểm trên thiết bị thật (M5, BLOCKED).
- `assets/tailwind.css` lệch 38 class so với cấu hình; chưa dựng lại (M6).
- Tailnet có thiết bị của `masterdev8386@`; cần kiểm ACL.
- Ba script (`analyze_h2dev_intelligence.js`, `audit_chienluoc_web.js`, `check_chienluoc_links.js`) nằm trong `_archive/2026-10-09-audit-scripts/` từ 08:44; chủ sở hữu chưa xác định (M7). Để nguyên.
- Việc khác đang sửa trong cây làm việc: `assets/app/main.js`, `assets/app/tabs/content.js`, `data-tabs/chien-luoc.json`, `docs/reports/part5_to_8_deep_intelligence.json` và nhiều script mới. Không thuộc vòng này.
- Đích Pi của đồng bộ skill: README v6.3 ghi đã gỡ; manifest ghi cài lại 2026-10-06. Cần xác nhận.

## Ghi chú

- Không push, không deploy.
- Số đếm dữ liệu không đổi (`sync-counts --check` mã thoát 0). `docs/WORKING_STATE.md` không chỉnh.
