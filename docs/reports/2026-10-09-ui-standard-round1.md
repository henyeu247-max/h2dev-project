# Báo cáo UI-standard đợt 1 — 2026-10-09

**Trạng thái:** `PARTIAL` (không PASS). Phần đã sửa đã đo và đã kiểm; còn các mục mở ở mục 6.
**Commit:** `c22844d` trên nhánh `ui/ui-standard-2026-10-09`, 17 file, +458 / −293. Chưa push.
**Bài học:** `docs/solutions/2026-10-09-ui-standard-round1.md` (H2DEV-UI-001 đến 012).
**Kế hoạch vòng sau:** `docs/plans/ui-standard-round2.md`.

---

## 1. Phạm vi và cách đo

- Route: /tatca, /video, /rawkenh, /ngachxanh, /tai-lieu, /kenh-mau, /nguonreup, /lotrinh, /learn.html, /lotrinh/<SKU>.
- Cỡ màn hình: 360, 390, 820, 1024, 1440 px. Thêm 642, 700, 1280, 1366 px khi chạm mốc 640/1023/1024.
- Trạng thái tiến độ bài học: chưa xem, đang dở (20%), đã xem.
- Công cụ: `scripts/audit-ui.js` (skill `ui-ux-standard`) dán inline vào trình duyệt; số đo `getBoundingClientRect` / `getComputedStyle`; so ảnh bằng PIL (ngưỡng điểm ảnh 24/255).
- Trước mỗi lần đo: hủy service worker, xóa cache, đổi `?v=` khi đã sửa CSS/JS.

## 2. Đã sửa, theo nhóm

| Nhóm | Thay đổi chính | File |
|---|---|---|
| Kiểu chữ (T-2) | 11 px → 12 px; `text-2xs` → `text-xs`; bỏ token `--h2-font-2xs` | viddar, learn, player, h2dev-shell, h2dev-primitives, h2dev-components-lesson-row, h2dev-tokens, content.js, main.js, search.js, player-main.js, music_player_modal.js |
| Tiêu đề (H-2/H-3) | nhóm/thẻ h2 cỡ 13–14 px → h3; hai mục trang bài học → h2 | content.js, player.html |
| Vùng chạm (A-1) | nút chính sách, nút tài liệu, tiêu đề bài học ≥ 24 px; khối điều khiển bài học 44 px trên màn hình rộng | viddar, learn.css, player.css, main.js |
| Tab Video (điện thoại) | ô Ngách cả hàng; Thị trường và Sắp xếp chia đôi; ba nút trạng thái cùng cỡ; lưới chip đều | viddar, content.js |
| Chip ≤1024 px | flex-wrap + `flex: 1 1 112px`; nhóm có id riêng giữ lưới | viddar |
| Khối điều khiển bài học | hàng 1 điều hướng + trạng thái; "Xem tiếp" hàng 2 trọn chiều; 44 px | player.css |
| Chữ bị cắt (T-10) | lớp dùng chung trong `h2dev-core.js`; title cho chip mốc thời gian | h2dev-core.js, player-main.js |
| Tràn ngang điện thoại | music studio (`minmax(0,1fr)`), bảng tăng trưởng raw kênh, dải tab trang Lộ trình | viddar, learn.css, index.html |
| URL bộ lọc ngách | tham số `skus` giữ bộ lọc khi tải lại / Back | main.js |
| Phiên bản | `uifix67` (index, learn, player, sw) | html, sw.js |

Không đưa vào commit (chưa rõ nguồn hoặc thuộc công việc khác): ba nhóm hunk trong `player-main.js` (xem mục 6, M7).

## 3. Số đo trước / sau

| Chỉ số | Trước | Sau | Nguồn |
|---|---|---|---|
| Chữ 11 px, /video | 78% | 0% | audit-ui, các phiên trước |
| Chữ 11 px, trang học | 65% | 0% | audit-ui, các phiên trước |
| Nhảy cấp tiêu đề (h1 → h3) | có | 0 (h1 = 1) | audit-ui |
| Chữ cắt không có title, trang bài học 1024 px | 4 | 0 | audit-ui, uifix63 |
| Vùng chạm < 24 px | có (chính sách, btn-doc-link, text-xs, row-title) | 0 ở các route đã đo | audit-ui |
| Khối điều khiển bài học, 1440 px | 32–34 px; "Đang dở" và "Xem tiếp" xuống hàng 2, lệch phải | 44 px; hàng 1 gồm điều hướng + trạng thái; hàng 2 "Xem tiếp" | getBoundingClientRect, uifix67 |
| Tràn ngang music studio, 390 px | cột bị kéo theo min-content 483 px | scrollWidth = clientWidth = 368 px | số đo trong `viddar.css` (ghi chú sửa) |

**Khối điều khiển bài học (uifix67), đo ở 390, 820, 1024, 1440 px và ba trạng thái:** sáu điều khiển (`btnPrev`, `btnNext`, `btnWatched`, `btnResume`, `btnClearProgress`, `noteInput`) đều 44 px. Không tràn ngang.

**Hàng 1 không xuống dòng:** đã kiểm ở 642, 700 (uifix66), 820, 1024, 1280, 1366, 1440 px.

## 4. Điểm pixel so với bản trước

| Cặp so sánh | Khác | Cách đọc |
|---|---|---|
| Chưa xem, 1024 / 1280 / 1366 / 1440 px: bản chưa có khối desktop (quy tắc gỡ trong trình duyệt) so với uifix66 | 0,00% ở cả bốn cỡ | giữ nguyên trạng thái đã duyệt |
| Đang dở, 1024 / 1280 / 1366 / 1440 px: cùng cặp trên | 21,8% (1024); 26,1% (1280, 1366, 1440) | đổi bố cục có chủ đích ở hàng 1–3, đã xem ảnh. Vượt ngưỡng 20% nên ghi rõ tại đây |
| Chưa xem, 1440 px: uifix66 so với uifix67 | 2,19% | đổi nhẹ: nút và ô ghi chú cao thêm (32–34 → 44 px) |
| Đang dở, 1440 px: uifix66 so với uifix67 | 2,96% | đổi nhẹ, cùng nguyên nhân |
| Đã xem, 1440 px: uifix66 so với uifix67 | 1,73% | đổi nhẹ, cùng nguyên nhân |
| Chưa xem và đang dở, 390 px: bản chưa có khối desktop so với uifix66 | 0,00% | không đổi (phần điện thoại) |

Ảnh so sánh: `scratchpad/ui/` (không đưa vào repo).

## 5. Kiểm tra đã chạy

| Kiểm | Kết quả | Thời điểm |
|---|---|---|
| `gate-p1.js`, `gate-p2.js`, `gate-shell.js`, `check-ui-classes.js`, `gate-typography.js`, `gate-icons.js` trên working tree | mã thoát 0 cả sáu | sau uifix67 |
| Cùng sáu gate trên cây commit (worktree tạm) | mã thoát 0; `gate-shell` cần `NODE_PATH` tới `node_modules` của repo (H2DEV-UI-011) | trước khi xóa worktree |
| `node --check` các file JS ở phiên bản sẽ commit (7 file) | 7/7 ok | trước commit |
| Quét mẫu thông tin nhạy cảm trong dòng được thêm | 0 dòng khớp (chỉ đếm, không in nội dung) | trước commit |
| `audit-ui` trên trang bài học, trạng thái đang dở, 360/390/820/1024/1440 | không tràn; 11 px = 0; chữ cắt không title = 0; h1 = 1; nhảy cấp = 0; vùng chạm < 24 px = 0; mồ côi = 6 ("Mở file local") | uifix66 |
| Vùng chạm dưới 44 px (cảnh báo A-1, không phải lỗi) | 239 ở 1024 px, 269 ở 1440 px | uifix66; uifix67 đã đưa ba nút trong khối điều khiển lên 44 px nên số này giảm, chưa đo lại |
| `audit-ui` cả 12 route, 4 cỡ (sweep cuối) | mọi route: không tràn, không 11 px, không chữ cắt thiếu title, h1 = 1, không nhảy cấp, không vùng chạm < 24 px. Còn mồ côi (mục 6) | uifix63 |
| Hiệu năng lớp title | longtask = 0 khi cuộn /rawkenh (12.000 px) và /tatca ở 390 px | PerformanceObserver |

**Chưa chạy:** kiểm trên điện thoại và iPad thật; `sync-counts.js --check` (không đổi dữ liệu nên không chạy lại trong đợt này); sweep đầy đủ trên cây commit (sweep chạy trên working tree, khác commit ở các hunk chưa stage).

## 6. Mục còn mở

| # | Mục | Chi tiết (đo ở đâu) | Kế hoạch |
|---|---|---|---|
| 1 | Chip mồ côi ở danh sách và chip lọc | /ngachxanh: handle "@lilliput_history ↗" và các dòng tương tự ở 390/820/1024/1440 px; /tai-lieu: "Xem thêm 23 ngách" (1440), "Reup / Hoạt hình" (390, 820); /nguonreup: "Cộng đồng · 2" (390); /kenh-mau: "Bán content & Reup Part 3 · 4" (390), dòng "SỐNG…" (820–1440); /rawkenh: "Phim AI / Điện ảnh · 5" (1440) | M1 |
| 2 | Tab mồ côi trên trang Lộ trình | "Tìm kiếm bài học" ở hàng cuối, 390 px, /lotrinh và /learn.html (do H2DEV-UI-012) | M2 |
| 3 | Thẻ tài liệu trên trang bài học | 6 nút "Mở file local" mồ côi ở mọi cỡ; số nút < 44 px là cảnh báo (239 và 269) | M3 |
| 4 | Nhãn KPI sau khi lên 12 px | chưa xem bằng mắt ở /tatca và /rawkenh, 820 và 1440 px | M4 |
| 5 | Thiết bị thật | chạm: nút chính sách, chip Watch, ô chọn, khối điều khiển bài học | M5 |
| 6 | Token `2xs` | `design-system/tokens.json` còn `font-2xs: 11px`; `tailwind.config.js` còn `'2xs'` và safelist `text-2xs`; `tailwind.css` chưa build lại | M6 |
| 7 | Thay đổi chưa commit ngoài phạm vi | `player-main.js`: nhánh resize (khoảng dòng 218), SKU không phân biệt hoa thường (353–358, 499, 619), kênh DIE và handle (452–466), SOP dạng mảng (536) | M7 |
| 8 | Lắng nghe mạng | `H2DEV_Service` nghe `0.0.0.0:8899` (đã xác nhận bằng `netstat`); quy tắc dự án là `127.0.0.1` trừ khi có chủ đích | cần anh xác nhận, không đổi |

Mục 6.1, 6.2 là lỗi giao diện thật, chặn PASS. Mục 6.3 đến 6.5 cần ảnh và quyết định của anh. Mục 6.6 cần quyết định. Mục 6.7 cần chủ sở hữu xác nhận.

## 7. Quyết định đã chốt trong đợt này

- Khối điều khiển bài học: 44 px ở mọi trạng thái, theo yêu cầu "luôn bằng Bài trước/Bài tiếp theo" (đợt 4 trong phiên).
- "Xem tiếp": chiếm trọn hàng 2 (anh đã nói có thể tự sắp xếp). Phương án căn phải vẫn có thể làm trong một lượt nếu anh muốn.
- Commit trên nhánh riêng, không trên `main`. Không push.
- Chỉ commit hunk thuộc đợt này. Dữ liệu, tài liệu ingest và script của công việc khác để nguyên trong working tree.
- Bài học dự án vào `docs/solutions/`, một dòng trỏ trong `AGENTS.md`. Bài học kỹ thuật tái dùng vào skill toàn cục (xem mục 8).

## 8. Bài học đưa vào skill toàn cục

Skill `ui-ux-standard` (nguồn `~/.agents/source/skills/ui-ux-standard/`) được bổ sung mục "Lỗi thường gặp" về: lệch thiết bị do quy tắc theo mốc màn hình; mỗi trạng thái dữ liệu là một trường hợp đo; `display: contents` trong flex-wrap; đổi tên class hàng loạt phải chạy gate token; stage theo hunk khi file lẫn việc khác; gate phụ thuộc môi trường. Sau khi sửa: lint, `apply --yes`, `verify`. Chi tiết kết quả ghi ở mục 9.

## 9. Cách tái lập

```
# Gate (trong thư mục repo)
node scripts/gate-p1.js ; node scripts/gate-p2.js ; node scripts/gate-shell.js
node scripts/check-ui-classes.js ; node scripts/gate-typography.js ; node scripts/gate-icons.js

# Gate trên cây commit (worktree tạm)
git worktree add --detach <thư-mục-tạm> ui/ui-standard-2026-10-09
cd <thư-mục-tạm> && NODE_PATH=<repo>/node_modules node scripts/gate-shell.js
cd <repo> && git worktree remove --force <thư-mục-tạm> && git worktree prune

# Số đo: dán nội dung scripts/audit-ui.js (skill toàn cục) vào page.evaluate
# Server: dịch vụ H2DEV_Service, kiểm bằng netstat -ano | grep :8899
```
