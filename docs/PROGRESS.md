# Tiến độ — H2DEV-Project

> Cập nhật cuối phiên: **2026-10-09**. File này được viết lại mỗi cuối phiên. Đọc đầu phiên cùng `AGENTS.md`, plan đang mở và lịch sử commit gần nhất.

## Đã xong

- **UI-standard đợt 1:** commit `c22844d` (17 file), `f21837e` (ba hunk text-2xs còn sót), `c984695` (tài liệu), trên nhánh `ui/ui-standard-2026-10-09`, chưa push. Phạm vi và số đo: `docs/reports/2026-10-09-ui-standard-round1.md`.
- **Khối điều khiển bài học:** sáu điều khiển 44 px ở mọi trạng thái trên màn hình rộng. Phiên bản `uifix67`.
- **Sáu gate của dự án:** mã thoát 0 trên working tree và trên cây commit (`gate-shell` cần `NODE_PATH`).
- **Bài học:** `docs/solutions/2026-10-09-ui-standard-round1.md` (H2DEV-UI-001 đến 012).
- **Skill toàn cục `ui-ux-standard`:** đã thêm bảy bài học chung; lint 0 lỗi; đồng bộ và verify 0 lệch (kết quả chi tiết trong báo cáo, mục 8).

## Đang làm

- Không có. Chờ anh quyết định ở mục "Cần anh quyết định".

## Tiếp theo

- Kế hoạch vòng 2: `docs/plans/ui-standard-round2.md`. Bắt đầu từ **M0** (chuẩn bị, không đổi code), rồi M1 (chip mồ côi, /ngachxanh trước).

## Lỗi và việc còn treo

- Chip và handle mồ côi ở /ngachxanh, /tai-lieu, /nguonreup, /kenh-mau, /rawkenh (M1).
- Tab mồ côi "Tìm kiếm bài học" ở /lotrinh và /learn.html ở 390 px (M2).
- Sáu nút "Mở file local" mồ côi trong thẻ tài liệu bài học (M3).
- Nhãn KPI sau khi lên 12 px chưa xem bằng mắt (M4).
- Chưa kiểm trên thiết bị thật (M5).
- Token `2xs` còn trong `tokens.json` và `tailwind.config.js` (M6).
- Thay đổi chưa commit trong `player-main.js` (nhánh resize, SKU, SOP, kênh DIE) chưa có chủ sở hữu xác nhận (M7).

## Cần anh quyết định

1. "Xem tiếp" chiếm trọn hàng 2, hay căn phải? (D-02)
2. Nhánh resize, SKU và SOP trong `player-main.js` có phải của anh hoặc của đợt này không? (D-04)
3. Dịch vụ `H2DEV_Service` nghe `0.0.0.0:8899` có chủ ý không? Quy tắc là `127.0.0.1`. (D-05)
4. Token `2xs`: giữ như hiện tại (A) hay đổi và build lại Tailwind (B)? (M6)

## Ghi chú

- Working tree còn thay đổi của công việc khác: khoảng 122 M và 152 untracked. Không thuộc đợt này. Không commit trong nhánh UI.
- Số đếm dữ liệu không đổi trong đợt này. `docs/WORKING_STATE.md` là M do công việc khác, không chỉnh.
