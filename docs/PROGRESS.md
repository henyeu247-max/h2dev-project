# Tiến độ — H2DEV-Project

> Cập nhật cuối phiên: **2026-10-09**. File này được viết lại mỗi cuối phiên. Đọc đầu phiên cùng `AGENTS.md`, plan đang mở và lịch sử commit gần nhất.

## Đã xong

- **UI-standard đợt 1:** commit `c22844d`, `f21837e`, `c984695` trên `ui/ui-standard-2026-10-09` (chưa push). Báo cáo `docs/reports/2026-10-09-ui-standard-round1.md`.
- **UI-standard đợt 2 (chưa commit):** chip và nút lẻ, thẻ kênh, thẻ tài liệu bài học, tab học ở 390 px, bỏ 2xs. Mồ côi 36 → 2 trên 60 tổ hợp route × cỡ. Phiên bản `uifix68`. Báo cáo `docs/reports/2026-10-09-ui-standard-round2.md`; bài học H2DEV-UI-013 đến 020.
- **Gate và kiểm dự án** trên working tree: `validate-project`, sáu gate, `sync-counts --check`: mã thoát 0.
- **Skill toàn cục `ui-ux-standard`:** đã sửa và đồng bộ tới 11 nơi; kiểm độc lập 649/649 bản sao khớp.

## Đang làm

- Không có. Chờ quyết định ở mục dưới.

## Tiếp theo

- Sau quyết định: commit trên nhánh (13 file sửa và tài liệu của đợt này) nếu anh cho phép; đo lại trên cây commit (DoD-5); nhóm vùng chạm dưới 44 px (DoD-3).

## Lỗi và việc còn treo

- Mồ côi còn 2: /tai-lieu 360 và 390 ("Reup / Hoạt hình"). Nguyên nhân: "Đi nhanh" trên điện thoại là lưới ba cột. M1, D-09.
- Nhãn KPI "Ngách có data" xuống 2 dòng ở 390 px (/tai-lieu, /nguonreup). M4, D-07.
- Vùng chạm dưới 44 px: 4.628 trên 60 tổ hợp; chưa nhóm và chưa có lý do theo nhóm (DoD-3).
- Nút "Đọc trực tiếp" ngắt chữ ở 1440 px (VIDEO-2aa1f7).
- Chưa kiểm trên thiết bị thật (M5, BLOCKED).
- `assets/tailwind.css` lệch 38 class so với cấu hình; chưa dựng lại (M6).
- Các thay đổi ngoài phạm vi (10 hunk `player-main.js`, 122 M, 152 untracked ghi trong plan) không còn trong cây này. Ba script chưa theo dõi mới (`scripts/analyze_h2dev_intelligence.js`, `audit_chienluoc_web.js`, `check_chienluoc_links.js`) do công việc khác tạo lúc 08:35–08:36; chưa rõ chủ sở hữu (M7).
- Đích Pi của đồng bộ skill: README v6.3 ghi đã gỡ, manifest ghi cài lại 2026-10-06. Cần xác nhận.

## Cần anh quyết định

1. "Xem tiếp" trọn hàng 2 hay căn phải (D-02).
2. `H2DEV_Service` nghe `0.0.0.0:8899`: giữ, thu hẹp, hay bind 127.0.0.1 (D-05).
3. Giãn chip và "Đi nhanh" (đã áp dụng): giữ hay trả về (D-06).
4. Nhãn "Ngách có data" ở 390 px: rút ngắn hay đảo D1 (D-07).
5. "Đi nhanh" trên điện thoại: hai cột hay chấp nhận 2 mồ côi (D-09).
6. Chủ sở hữu của thay đổi ngoài phạm vi (M7, D-04).
7. Commit đợt 2 trên nhánh (D-03).

## Ghi chú

- Không commit, không push, không deploy trong đợt này.
- Số đếm dữ liệu không đổi (`sync-counts --check` mã thoát 0). `docs/WORKING_STATE.md` không chỉnh.
