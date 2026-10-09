# Báo cáo UI-standard đợt 2 (2026-10-09), cập nhật vòng 3

> **Trạng thái:** PARTIAL. Đợt 2 đã nằm trong commit `800caa4` (commit của việc khác, message không nhắc UI). Vòng 3 (sửa theo quyết định của chủ dự án) nằm trong commit `13c40f5`.
> **Nhánh:** `ui/ui-standard-2026-10-09`. **Commit vòng 3:** `13c40f5` (sau `54872e1` của việc khác; đợt 2 nằm trong `800caa4`, `server.js` của D-05 trong `551be56`). **Phiên bản tài nguyên:** `uifix71`.
> **Kế hoạch:** `docs/plans/ui-standard-round2.md`. **Bài học:** `docs/solutions/2026-10-09-ui-standard-round2.md` (H2DEV-UI-013 đến 024).

## 1. Số liệu (12 route × 5 cỡ = 60 tổ hợp)

| Chỉ số | Trước đợt 2 (`a97383a`) | Đầu vòng 3 (`uifix68`) | Cuối vòng 3 (`uifix71`) |
|---|---|---|---|
| Mồ côi (`orphanRows`) | 36 | 2 | **0** |
| Vùng chạm dưới 24 px (`smallTargets`) | — | 0 | 0 |
| Vùng chạm dưới 44 px (`targetsBelow44`) | — | 4.628 | 4.629 (+1: nút thứ 6 mới của thanh `/chienluoc`, cao 36 px ở 1440 px) |
| Chữ 11 px, cắt chữ không title, nhảy cấp, offscreen, tràn ngang, `h1` khác 1 | 0 | 0 | 0 |
| G-2: vùng cùng hàng lệch hơn 2 px | chưa đo | 59 vùng / 28 tổ hợp | 54 vùng / 28 tổ hợp |

Đo bằng `ui-harness.js audit` (mồ côi, vùng chạm) và `ev2.js g2` (G-2). Số đếm lấy từ trường `count` trong JSON.

## 2. Quyết định của chủ dự án và việc đã làm

- **D-02 "Xem tiếp":** chọn **trọn hàng 2**. Hiện trạng đúng như vậy, không đổi CSS. Ảnh so sánh: `scratchpad\ui\preview-xemtiep-2x2.png`.
- **D-03 commit:** các thay đổi đợt 2 đã nằm trong `800caa4`. Vòng 3 nằm trong `13c40f5` (chủ dự án giao em tự quyết).
- **D-05 `H2DEV_Service`:**
  - Đã làm trong code: route `/api/intelligence/spider` chỉ nhận POST kèm header `X-H2DEV-Action: spider`. GET trả 405, POST không header trả 403. `server.js` đã nằm trong commit `551be56` (09:04:30, commit của việc khác).
  - Dịch vụ đã nạp code mới: tiến trình 8899 khởi động lúc 09:00:13, sau khi sửa `server.js` lúc 08:55:08. Kiểm bằng POST không header → 403; DB không đổi.
  - Đã tạo luật tường lửa chặn cổng 8899 trên mạng Public (mục 3).
  - Trang khác nguồn không gửi được POST: đo bằng `localhost:8898` → `127.0.0.1:8898`, trình duyệt báo `Failed to fetch`, không có request nào rời trình duyệt.
- **D-06 chip:**
  - Hàng có nhãn đi kèm, tối đa 4 chip, từ 641 px chia đều: "Tình trạng sống" 1440 px từ 261 / 300 / 309 px thành 290 / 290 / 290 px.
  - Cụm nhiều chip (Kênh mẫu, 34 chip) và điện thoại giữ `flex: 1 1 auto`. Thử chia đều: cụm bị bóp còn 30 px, chip chồng lên nhau ở 1024 px; điện thoại còn 33–56 px, chữ xuống 3–4 dòng. Đã trả về.
  - Chủ dự án giao em tự quyết: giữ như hiện tại.
- **D-07 nhãn "Ngách có data":** `text-wrap: balance` cho nhãn trong khối điện thoại (D1). Kết quả "Ngách / có data", không còn chữ lẻ. Nhãn vẫn 2 dòng (cao 32 px), các giá trị số vẫn thẳng hàng. Rút ngắn chữ cần chủ dự án đưa chữ.
- **D-09 "Đi nhanh" điện thoại:** 2 cột; nút lẻ cuối chiếm cả hàng (cùng mẫu tab học). Mồ côi 2 → 0 ở 360 và 390 px.
- **Thanh nút `/chienluoc` trên điện thoại (phát hiện thêm, đã sửa):** nút thứ 6 "Tất cả nội dung" (thêm bởi công việc chiến lược, `main.js:756`, commit `800caa4`) làm thanh 5 cột thành hai hàng cao 92 px, trong khi khung phụ của tiêu đề cố định cao 48 px: hàng đầu bị dòng tiêu đề che, nút thứ 6 nằm ngoài tiêu đề (đo hit-test: bản HEAD che 1 nút). Đã thử 3 cột × 2 hàng: làm xấu hơn (che 3 nút), nên gỡ. Cách sửa cuối: đúng 6 nút thì giữ một hàng, mỗi nút tối thiểu 76 px, dải tự cuộn ngang (360 và 390 px: 6/6 nút trong tiêu đề, cao 44 px, không cắt chữ, cuộn tới được). Mồ côi `/chienluoc` 360 và 390 px: 1 → 0. Ảnh: `ui\check\chienluoc-truoc-390.png`, `chienluoc-sau-390.png`, `chienluoc-sau-390-cuon.png`.
- **M7 ba script chưa theo dõi:** `analyze_h2dev_intelligence.js`, `audit_chienluoc_web.js`, `check_chienluoc_links.js` đã được chuyển vào `_archive/2026-10-09-audit-scripts/` lúc 08:44. Thư mục `_archive/` bị `.gitignore:10` bỏ qua, nên `git status` không thấy. Phiên này không có lệnh chuyển file. Các transcript đã lưu của dự án này không nhắc tới ba file. **Chủ sở hữu chưa xác định được.**

## 3. Tường lửa (đã chạy 2026-10-09)

- Luật `H2DEV-8899 chan Public`: Inbound, Block, TCP 8899, profile Public, enabled. Tạo bằng lệnh nâng quyền (UAC) rồi đọc lại từ shell thường.
- Kiểm từ máy này: `127.0.0.1`, `192.168.50.216` (LAN) và `100.83.146.28` (Tailscale) đều trả `/health` 200. Chưa kiểm được từ một mạng Public thật.
- Gỡ nếu cần (Admin): `Remove-NetFirewallRule -DisplayName "H2DEV-8899 chan Public"`.
- Vì sao cần luật chặn riêng: quy tắc `H2DEV-8899` (từ `scripts/windows/H2DEV-OneClick.cmd` dòng 44, `profile=any`) cho phép trên Public, và quy tắc `Node.js JavaScript Runtime` cho `node.exe` qua mọi cổng trên Public. Luật chặn thắng luật cho phép. `H2DEV-OneClick.cmd` vẫn tạo lại quy tắc cho phép `profile=any` mỗi lần chạy; luật chặn vẫn thắng.

## 4. Quyết định (chủ dự án giao em tự quyết, 2026-10-09)

1. D-06, D-07, D-09: giữ như hiện tại.
2. D-03: commit vòng 3 trên nhánh, chỉ stage file của vòng này.
3. M7: để nguyên ba script trong `_archive/` (git đã bỏ qua).
4. Funnel 8443: đã tắt (mục 5).

## 5. Tailscale

- Funnel cổng 8443 (→ `127.0.0.1:8088`) đã tắt bằng `tailscale funnel --https=8443 off`. Trước đó cổng 8088 không có tiến trình nghe và không có tác vụ hay file repo nào tham chiếu. Handler chỉ trong tailnet (`/` → `127.0.0.1:3773`) giữ nguyên. Sao lưu cấu hình: `scratchpad\tailscale-serve-backup.json`. Bật lại: `tailscale funnel --bg --https=8443 8088`.
- Còn mở: tailnet có thiết bị của tài khoản `masterdev8386@` (`desktop-cnr4k71`, `desktop-faidav2`). Nếu ACL cho phép, các máy này truy cập được `100.83.146.28:8899` mà không cần đăng nhập. Kiểm ACL trong Tailscale admin console.

## 6. Kiểm chứng (lệnh đã chạy, mã thoát)

- Gate: `gate-icons`, `gate-p1`, `gate-p2`, `gate-typography`, `check-ui-classes`, `gate-shell` (6/6), `sync-counts --check`, `npm test` (144 video, 256 kênh, 60 kịch bản, 300 tài liệu, 284 thumbs): đều mã 0. Log: `scratchpad\ui\gates-final.log`.
- Audit: `ui-harness.js audit` 60 tổ hợp: mồ côi 0, `smallTargets` 0, `targetsBelow44` 4.628, không tràn ngang. Kết quả: `scratchpad\ui\final3-audit.json`.
- G-2: `ev2.js g2` 60 tổ hợp: 54 vùng / 28 tổ hợp. Kết quả: `scratchpad\ui\ev2\g2-live.json`.
- Spider, cổng 8898 (bản thử, đã tắt): GET 405; POST không header 403; preflight không cho header `X-H2DEV-Action`; trang khác nguồn `Failed to fetch`; DB không đổi.
- Spider, cổng 8899 (dịch vụ đang chạy): POST không header 403; DB không đổi; `/health` 200.
- Bộ kiểm thử của dự án trên `127.0.0.1:8899`: `playwright-g2-acceptance.js` 23/23 PASS; `deep-ui-acceptance.js` 11/11 PASS.

## 7. Thay đổi trong vòng 3 (đã commit trên nhánh)

- `assets/viddar.css`: hàng có nhãn đến 4 chip chia đều từ 641 px (D-06); nút "Đi nhanh" điện thoại 2 cột (D-09); nhãn KPI `text-wrap: balance` (D-07). Các chip khác giữ hành vi của đợt 2. Chip chia đều thêm `min-width: max-content` (bên đọc độc lập đo lỗi xuống dòng ở 641–659 px). Thanh topbar đúng 6 nút trên điện thoại giữ một hàng, dải cuộn ngang.
- `index.html`, `learn.html`, `player.html`, `assets/app/sw.js`: `uifix68` → `uifix71`.
- `server.js`: route spider chỉ POST kèm header (D-05); đã nằm trong commit `551be56`.
- Tài liệu: `docs/PROGRESS.md`, `docs/reports/2026-10-09-ui-standard-round2.md`, `docs/solutions/2026-10-09-ui-standard-round2.md` (H2DEV-UI-021 đến 024), `docs/plans/ui-standard-round2.md`, `CHANGELOG.md`, `AGENTS.md` (con trỏ 013 đến 024).

## 8. Ảnh bằng chứng (`scratchpad\ui\`)

- D-06 Kênh mẫu 1440: trước `ev2-base\live-D06-kenh-1440.png`; sau `ev2\live-D06-kenh-1440.png`.
- D-06 cụm 34 chip: `ev5\pre-_kenh_mau-1024.png` (trước đợt 2), `ev5\live-_kenh_mau-1024.png` và `-820`, `-1440` (hiện tại).
- D-07 nhãn: trước `ev2-base\live-D07-tailieu-390.png`; sau `ev2\live-D07-tailieu-390.png`.
- D-09 "Đi nhanh" 390: trước `ev2-base\live-D09-tailieu-390.png`; sau `ev2\live-D09-tailieu-390.png`.
- Chip thuần 1440: `ev3\live-pure-tailieu-1440.png`.

## 9. Rủi ro và điều chưa rõ

- Spider: header `X-H2DEV-Action` chỉ chặn trang web khác, không phải xác thực; server không kiểm `Host` (DNS rebinding là suy luận chưa dựng thử). Máy trong LAN hoặc tailnet biết header vẫn kích hoạt được crawl.
- Kiểm độc lập (bên đọc ngữ cảnh sạch) đo 12 route × 5 cỡ: một lỗi thật (chip xuống dòng ở 641–659 px) đã sửa; chỉ kiểm Chromium, chưa kiểm Firefox hay Safari cho `:has()`.
- G-2 chưa đạt: 54 vùng. Trên điện thoại, hàng có nhãn và hàng chip thuần lệch 30 đến 40 px; cụm chip dài chưa có cách chia đều an toàn.
- `assets/tailwind.css` lệch 38 class so với cấu hình; chưa dựng lại (M6).
- Có tiến trình khác đang ghi repo: `docs/reports/part5_to_8_deep_intelligence.json` đã đổi trong cây làm việc. Không phải thay đổi của phiên này; không đụng vào.
- Đích Pi của đồng bộ skill: README v6.3 ghi đã gỡ, manifest ghi cài lại 2026-10-06. Cần xác nhận.
- Nút "Đọc trực tiếp" ngắt chữ ở 1440 px (`VIDEO-2aa1f7`): chưa sửa.
- M5 (thiết bị thật): BLOCKED, không có thiết bị.
