# Báo cáo UI-standard đợt 2 (2026-10-09)

> **Trạng thái:** PARTIAL. Chưa commit. Nhánh `ui/ui-standard-2026-10-09`, HEAD `a97383a`. Phiên bản tài nguyên `uifix68`.
> **Kế hoạch:** `docs/plans/ui-standard-round2.md`. **Bài học:** `docs/solutions/2026-10-09-ui-standard-round2.md` (H2DEV-UI-013 đến 020).

## 1. Phạm vi và cách đo

- 12 route × 5 cỡ (360, 390, 820, 1024, 1440 px) = 60 tổ hợp, bằng `audit-ui` của skill toàn cục. Số đếm đọc từ trường `count` trong JSON.
- Trước: bản HEAD, lấy bằng `git show` và chặn ở trình duyệt; service worker bị chặn. Sau: working tree hiện tại.
- Ảnh toàn trang 390 và 1440 px; so pixel với ngưỡng 24/255 (`compare_dirs.py`).
- Gate chạy trên working tree (chưa có cây commit).

## 2. Số liệu (HEAD → hiện tại, 60 tổ hợp)

| Chỉ số | HEAD | Hiện tại |
|---|---|---|
| Mồ côi (`orphanRows`) | 36 | **2** |
| Chữ 11 px, cắt chữ không title, nhảy cấp tiêu đề, vùng chạm < 24 px, phần tử ngoài khung, chữ dưới 12 px | 0 | 0 |
| `h1Count` khác 1; tràn ngang | 0 | 0 |
| Vùng chạm < 44 px (tổng số phần tử) | 4.632 | 4.628 |

Ảnh có thay đổi (HEAD → hiện tại): lớn nhất 2,00 % ở Kênh mẫu 1440 px; Kênh mẫu 390 px 0,55 %; Lộ trình VIDEO-DD983D 390 px 0,32 % (thẻ tài liệu); phần còn lại dưới 0,5 %. Không vùng nào trên 5 %. Các vùng thay đổi nằm trong dải chip, nút "Đi nhanh", lưới thẻ kênh và thẻ tài liệu bài học.

## 3. Tiêu chí xong (DoD)

- DoD-1 **Đạt**: không có chữ 11 px, cắt chữ, nhảy cấp tiêu đề, phần tử ngoài khung, vùng chạm dưới 24 px, tràn ngang ở 60 tổ hợp.
- DoD-2 **Chưa đạt**: còn 2 mồ côi (/tai-lieu 360, 390). Cần anh chấp nhận hoặc chọn D-09.
- DoD-3 **Chưa làm**: 4.628 vùng chạm dưới 44 px chưa nhóm và chưa có lý do theo nhóm.
- DoD-4 **Không đo lại** trong đợt này; khối điều khiển bài học giữ kết quả đợt 1.
- DoD-5 **Đạt trên working tree**: `validate-project`, gate-icons, gate-p1, gate-p2, gate-typography, check-ui-classes, gate-shell (6/6) và `sync-counts --check` đều mã thoát 0. Cây commit: chưa có.
- DoD-6 **Chờ anh xem ảnh**: ảnh toàn trang 390 và 1440 px nằm trong scratchpad (`ui/snap-after4/`, không đưa vào repo). Em đã xem ảnh thẻ 2aa1f7 và ảnh so sánh chip; các ảnh toàn trang còn chờ anh.
- DoD-7 **Đạt**: mọi thay đổi trên 0,5 % có giải thích vùng; không có vùng nào trên 5 %.
- DoD-8 **Chưa đạt**: M5 BLOCKED; M7 chưa có chủ sở hữu; D-02, D-05 chờ quyết định.
- DoD-9 **Chưa đạt**: tài liệu đã cập nhật; chưa commit (chưa có yêu cầu).

## 4. Milestone

- M0 Chuẩn bị: **Đạt**.
- M1 Chip và handle mồ côi: **Một phần** (36 → 2).
- M2 Dải tab Lộ trình: **Đạt** (lưới 2×2 ở 390 px; mồ côi 1 → 0 ở 360 và 390 px cho /learn.html và /lotrinh).
- M3 Thẻ tài liệu bài học: **Một phần**. Thẻ hai tài liệu (VIDEO-043d15, VIDEO-d20744): không còn dòng lẻ ở 390, 820, 1024, 1440 px. Thẻ ba tài liệu (VIDEO-2aa1f7): nút thứ ba chiếm cả hàng; đã xem ảnh ở 390 và 1440 px. DoD-3 chưa làm.
- M4 Nhãn KPI: **Chưa sửa**, chờ D-07.
- M5 Thiết bị thật: **BLOCKED** (không có thiết bị).
- M6 Token `2xs`: **Đạt** (bỏ khỏi cấu hình và token; năm khai báo 11 px đổi sang 12 px; không dựng lại Tailwind).
- M7 Quyền sở hữu: **Chưa có chủ sở hữu** (xem mục 7).
- M8 Nghiệm thu: **PARTIAL**.

## 5. Thay đổi (chưa commit)

- Sửa (13 file): `assets/viddar.css`, `assets/player.css`, `assets/learn.css`, `assets/h2dev-components-lesson-row.css`, `assets/tailwind.css`, `css/input.css`, `design-system/tokens.json`, `tailwind.config.js`, `index.html`, `learn.html`, `player.html`, `assets/app/sw.js` (phiên bản `uifix68`), `AGENTS.md` (một dòng trỏ bài học).
- Tài liệu: `CHANGELOG.md`, `docs/PROGRESS.md`, `docs/plans/ui-standard-round2.md` (sửa); `docs/solutions/2026-10-09-ui-standard-round2.md` và `docs/reports/2026-10-09-ui-standard-round2.md` (mới).
- Ngoài repo: skill `ui-ux-standard` (nguồn `~/.agents/source/skills/`) đã đồng bộ tới 11 nơi; kiểm độc lập 649/649 bản sao khớp.

## 6. Quyết định chờ anh

1. D-02: "Xem tiếp" trọn hàng 2 hay căn phải (đề xuất: giữ trọn hàng).
2. D-05: `H2DEV_Service` nghe `0.0.0.0:8899` (đề xuất: thu hẹp tường lửa hoặc bind 127.0.0.1).
3. D-06: giãn chip và "Đi nhanh" (đã áp dụng; xác nhận hoặc trả về).
4. D-07: nhãn "Ngách có data" ở 390 px (đề xuất: rút ngắn nhãn).
5. D-09: "Đi nhanh" trên điện thoại (đề xuất: hai cột; hoặc chấp nhận 2 mồ côi).
6. M7 / D-04: chủ sở hữu của thay đổi ngoài phạm vi (10 hunk `player-main.js` và các file ghi trong plan).
7. D-03: commit đợt 2 trên nhánh (13 file sửa và các tài liệu của đợt này).

## 7. Rủi ro và điều chưa rõ

- `assets/tailwind.css` lệch 38 class so với cấu hình; không dựng lại cho đến khi xác định.
- Đường dẫn Pi: README v6.3 ghi Pi đã gỡ, nhưng manifest của công cụ đồng bộ ghi Pi được cài lại 2026-10-06. Đồng bộ skill vẫn ghi vào đích Pi theo manifest; cần anh xác nhận.
- `docs/solutions/2026-10-09-ui-standard-round2.md` đã có ở dạng chưa theo dõi lúc đầu phiên, nhưng khi em ghi thì file không còn trên đĩa (công cụ báo "tạo mới"). Em không biết nội dung cũ; git không giữ được.
- 10 hunk `player-main.js` và 122 M / 152 untracked ghi trong plan không còn trong cây làm việc này; không có worktree khác, không có stash. Chủ sở hữu chưa rõ. Lúc kiểm cuối có ba script chưa theo dõi mới (`scripts/analyze_h2dev_intelligence.js`, `audit_chienluoc_web.js`, `check_chienluoc_links.js`, tạo 08:35–08:36) của công việc khác; em không đụng vào.
- Nút "Đọc trực tiếp" ở 1440 px ngắt chữ.

## 8. Lệnh đã chạy (mã thoát)

- `npm test` (`scripts/validate-project.js`): 0 (144 video, 256 kênh, 60 kịch bản, 300 tài liệu, 284 thumbs).
- `gate-icons`, `gate-p1`, `gate-p2`, `gate-typography`, `check-ui-classes`: 0. `gate-shell`: 0 (6/6). `sync-counts --check`: 0.
- Đồng bộ skill: `agents_sync.py apply --yes`: 0; `verify_independent.py`: 0 (649/649).
- Đo: `audit-ui` 60 tổ hợp; 24 ảnh toàn trang; `compare_dirs.py` 24 cặp.
