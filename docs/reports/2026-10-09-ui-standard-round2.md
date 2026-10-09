# Báo cáo UI-standard đợt 2 (2026-10-09), cập nhật vòng 3

> **Trạng thái:** PARTIAL. Đợt 2 đã nằm trong commit `800caa4` (commit của việc khác, message không nhắc UI). Vòng 3 (sửa theo quyết định của chủ dự án) nằm trong commit `13c40f5`.
> **Nhánh:** `ui/ui-standard-2026-10-09`. **Commit vòng 3:** `13c40f5` (sau `54872e1` của việc khác; đợt 2 nằm trong `800caa4`, `server.js` của D-05 trong `551be56`). **Phiên bản tài nguyên:** `uifix80`.
> **Kế hoạch:** `docs/plans/ui-standard-round2.md`. **Bài học:** `docs/solutions/2026-10-09-ui-standard-round2.md` (H2DEV-UI-013 đến 024).

## 1. Số liệu (12 route × 5 cỡ = 60 tổ hợp)

| Chỉ số | Trước đợt 2 (`a97383a`) | Đầu vòng 3 (`uifix68`) | Cuối vòng 3 (`uifix80`) |
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
- **Nút "Cuộn lên đầu trang" ở 820 và 1024 px (phát hiện khi kiểm lại `/tatca`, đã sửa):** thanh điều hướng dưới (cao 56 px, z-index 100) hiện từ 1024 px trở xuống, nhưng nút chỉ được nâng lên 76 px ở dưới 640 px; ở 820 và 1024 px nút cách đáy 16 px nên bị thanh đè (đáy nút 828 px so với đỉnh thanh 788 px, hit-test: bị che, chỉ lộ một vệt nhỏ). Sửa trong `assets/h2dev-shell.css`: trang có `.vd-bottom-nav` thì từ 1024 px trở xuống nút cách đáy 76 px. Sau sửa: đáy nút 768 px, cách thanh 20 px, không bị che; 60 tổ hợp route × cỡ: 0 nút bị che. Ảnh trước/sau: `ui\check\tatca-nutlendau-truoc-820.png` và `-sau-820.png`.
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
- `index.html`, `learn.html`, `player.html`, `assets/app/sw.js`: `uifix68` → `uifix80`.
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

## 10. Kiểm lại UX, animation, logic và dữ liệu của `/tatca` (2026-10-09, `uifix80`)

**Kết quả: PASS cho `/tatca` (toàn dự án vẫn PARTIAL, mục 9), kèm 6 lỗi tìm thấy khi kiểm lại đã sửa.** Mọi con số lấy từ lệnh đo, không ước lượng.

| Nhóm | Đã kiểm | Kết quả |
|---|---|---|
| Dữ liệu | 31 phép đối chiếu: SKU, Free/Pro, tài liệu, kênh, dung lượng, thị trường, ngách, chính sách, module, cộng 7 số trên màn hình so với nguồn. Thứ tự 6 ngách đầu theo trường `hang` (1 đến 6), thanh bên cạnh là số video live | 31/31 PASS (sau khi sửa 2 lỗi, mục dưới) |
| Logic điều hướng | 4 thẻ KPI, nút lộ trình, hàng thị trường, hàng ngách, hai nút "Xem thêm", bộ lọc giữ nguyên sau khi tải lại, nút Quay lại | PASS (lọc Việt 45/144, Hàn 39/144, không lọc 144/144; 2, 2 và 6 trang) |
| Tiến độ học | 1 bài đã xem + 1 đang dở, chưa xem bài nào, xem hết 144 bài, dữ liệu lưu hỏng, SKU đã xóa | 6/6 PASS |
| Bàn phím | Tab 14 bước, Enter trên hàng lọc, Space mở chính sách, "Bỏ qua điều hướng", quét 670 phần tử focus trên 12 route × 2 cỡ (đợi 400 ms mỗi bước): 653 vòng đỏ của dự án, 17 vòng mặc định của Chrome (nhìn thấy được), 0 thiếu | PASS sau khi sửa 1 lỗi (mục dưới) |
| Animation và hiệu năng | Không chuyển động vô hạn khi giảm chuyển động. Hiệu năng đo riêng bằng trace Chrome (Lighthouse lần này không có hạng mục Performance): LCP 292 ms, CLS 0,00, máy cục bộ không giới hạn mạng | PASS, 1 ngoại lệ có lý do |
| Trạng thái lỗi | Mất `videos.json`, `ngach-xanh.json` trả 500, kho rỗng, tải chậm 3,5 s | 6/6 PASS: không lộ `undefined/NaN`, có thông báo lỗi, có nút thử lại, có khung chờ |
| Lighthouse | Bốn hạng mục Accessibility, Best Practices, SEO, Agentic Browsing đều 100 (không có hạng mục Performance). Đo trên `/tatca`: điện thoại 51 mục đạt, 0 lỗi; máy tính 55 mục đạt, 0 lỗi (trước khi sửa: 54 đạt, 1 lỗi) | PASS |
| Lớp phủ và chạm thật | Modal "Nhạc nền" (1440 và 390 px) và bảng "Khác" (390 px): mở bằng Enter, tiêu điểm vào trong, `role="dialog"` + `aria-modal`, Tab không thoát, Esc đóng, tiêu điểm về nút mở, trang phía sau không cuộn. Chạm thật (`tap()` trên iPhone 13 giả lập): hàng thị trường, chính sách mở/thu gọn, thẻ KPI, "Khác" | 30/30 PASS (sau khi sửa khóa cuộn, mục dưới) |
| SPA | Tiêu đề tab riêng cho 10 route; thông báo "Đã mở tab Video" cho trình đọc màn hình; mất mạng vẫn mở được khung ứng dụng | 6/6 PASS |

**Lỗi tìm thấy và đã sửa:**
1. **Dữ liệu:** thẻ KPI "Kịch bản & Tài liệu" ghi 275 file local, thực tế 269. Sáu mục công cụ (Pexels, Vecteezy, Coverr, Freepik, Pixabay, TikVideo) có trường `file` là địa chỉ web. Cùng cách đếm sai ở tab Tài liệu (File local 275 / Link catalog 25, nay 269 / 31). Sửa trong `assets/app/tabs/content.js` (hàm `isLocalDocFile`). Bên đọc độc lập chỉ ra còn hai nơi khác coi `file` là file local: thẻ của chính 6 mục đó hiện hai nút cùng địa chỉ ("↗ coverr.co" và "File local" mở ra trang web ngoài) kèm nhãn đuôi "FILE"; đã sửa nút và nhãn (xem mục 5 dưới).
2. **Truy cập (WCAG 2.5.3):** logo ở thanh bên có chữ hiển thị "h2dev Radar kho YouTube" nhưng tên truy cập chỉ là "Về trang chủ Tổng quan", nên người dùng giọng nói nói "bấm h2dev" không gọi được. Sửa trong `assets/app/main.js`: tên truy cập bắt đầu bằng chữ hiển thị.
3. **Truy cập (WCAG 2.4.7), trang bài học `/lotrinh/<SKU>`:** bảy loại điều khiển không có chỉ báo focus nào (Bài trước, Bài tiếp theo, Bài học gốc, Tải MP4, Chưa xem, Bỏ tiến độ, các mốc thời gian). Nguyên nhân: `assets/player.css` đặt `box-shadow: none !important` cho các khối đó. Đã khôi phục vòng focus. Quét lại 5 loại trang bài học: 243 phần tử, 0 thiếu vòng.
4. **Nút "Cuộn lên đầu trang"** bị thanh dưới đè ở 820 và 1024 px (đã nằm trong `4a6b342`).
5. **Thẻ tài liệu địa chỉ web:** 6 thẻ (Pexels, Vecteezy, Coverr, Freepik, Pixabay, TikVideo) hiện nút "File local" trỏ ra web và nhãn "FILE". Sau sửa mỗi thẻ có đúng một nút liên kết ngoài và "Video gốc", không nhãn đuôi; thẻ tài liệu local vẫn có "File local" và nhãn "MD". Kiểm ở 1440 và 390 px.
6. **Khóa cuộn khi lớp phủ mở (điện thoại):** `html` có `overflow-x: hidden` nên `body { overflow: hidden }` không lan lên khung nhìn. Trước khi sửa: cuộn chuột làm trang phía sau trôi 700 px khi modal "Nhạc nền" hoặc bảng "Khác" mở; vuốt chạm thật làm trang trôi 185 px khi bảng "Khác" mở (modal "Nhạc nền" không bị lọt ở điểm vuốt đã thử). Sau sửa: 0 px ở cả hai kiểu nhập, vuốt đối chứng không lớp phủ vẫn cuộn 345 px. Sửa: `assets/viddar.css` (khóa cả `html` khi `body` bị khóa) và `assets/app/tabs/nav.js` (bảng "Khác" tự khóa/mở khóa).

**Đồng bộ kiểu (không phải lỗi):** thẻ KPI và logo dùng vòng focus trắng mặc định của Chrome (nhìn thấy được). Đã chuyển sang vòng đỏ của dự án để giống các nút khác.

**Ngoại lệ có lý do (không sửa):**
- Hai chuyển động vô hạn (`radar-ping`, `radar-sweep`) ở biểu tượng radar của logo (28 px, `role="img"` có tên "H2DEV"). Là họa tiết thương hiệu và tắt hoàn toàn khi hệ điều hành bật giảm chuyển động.
- Không có thẻ `canonical`. Đây là ứng dụng nội bộ không cần đăng nhập, không phục vụ tìm kiếm công khai; Lighthouse SEO vẫn 100.

**Báo động giả của máy đo (ghi để khỏi lặp lại):**
- Đếm thẻ video bằng liên kết `/lotrinh/VIDEO-…` thiếu 4 buổi Zoom (`/lotrinh/ZOOM-…`). Đếm đúng bằng dòng tổng kết "45/144".
- Đo vòng focus ngay sau khi nhấn Tab, trong lúc còn chuyển tiếp 0,2 s, thấy `box-shadow` trong suốt. Phải đợi tối thiểu 400 ms.
- Viền mặc định của Chrome (`outline: auto`) là vòng hai lớp tối và trắng, nhìn thấy trên nền tối dù màu tính ra là `rgb(16,16,16)`.

**Quyết định của em (không chặn nghiệm thu, nêu lý do một dòng):**
- Giữ họa tiết radar vô hạn ở logo: nhỏ, có tên truy cập, tắt khi giảm chuyển động.
- Không thêm `canonical`: ứng dụng nội bộ, không phục vụ tìm kiếm công khai.
- Nút Quay lại về đầu trang, không khôi phục vị trí cuộn của `/tatca`: chấp nhận được; khôi phục cần can thiệp bộ định tuyến tự viết, rủi ro lớn hơn lợi ích.

**Chưa làm, chờ chủ dự án:**
- Nội dung "Chính sách YouTube phải nhớ" cập nhật lần cuối 2026-09-16 (đo ngày 2026-08-21). Đây là việc của người sở hữu dữ liệu, không phải lỗi giao diện.

**Ảnh bằng chứng** (thư mục `scratchpad\ui\check\`): `focus-baitruoc-*`, `focus-taimp4-*`, `focus-moc-thoigian-*`, `focus-kpi-*`, `focus-logo-*` (mỗi loại có `-truoc.png` và `-sau.png`), `focus-sau-tabsidebar.png`, `tailieu-coverr-truoc.png` và `-sau.png`, `tailieu-kpi-truoc.png` và `-sau.png`, `overlay-nhacnen-1440.png`, `overlay-nhacnen-390.png`, `overlay-khac-390.png`. Báo cáo Lighthouse: `scratchpad\ui\lighthouse-mobile-final\report.html`, `scratchpad\ui\lighthouse-desktop-final\report.html`.

**Chưa kiểm:** Firefox và Safari (`:has()`), thiết bị thật, vuốt chạm trên iOS thật (khóa cuộn trên Safari iOS còn có thể khác Chromium).

## 11. Kiểm chứng dữ liệu với nguồn ngoài (2026-10-09, `uifix80`)

Mục 10 chỉ chứng minh dữ liệu **nhất quán nội bộ**. Mục này đối chiếu với thực tế bên ngoài và quét toàn bộ file dữ liệu hiển thị (9 file trong `data-tabs/`, `data/catalog.json`, `data/modules.json`).

**Phạm vi N/N:** 256/256 kênh (HTTP), 7/7 chính sách (5 trang YouTube Help), 144/144 video và 300/300 tài liệu (tham chiếu SKU, file trên đĩa), 34/34 ngách (ngưỡng XANH). Không đo: nhãn thị trường so với nội dung từng video (chỉ thử gần đúng qua chữ viết tên kênh).

| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| Số đếm, tham chiếu SKU, file trên đĩa | Nhất quán | 15/15 số viết tay khớp trước khi sửa; 0 SKU mồ côi; 0 file tài liệu/video/ảnh thiếu |
| Kênh sống/chết | Đã xác minh ngoài, có sửa | 242 khớp, 14 lệch (5,5%): 8 `dead` sai, 2 sống sai, 4 giữ nguyên (3 rỗng đúng, 1 chưa đủ bằng chứng) |
| 7 chính sách | Đã xác minh ngoài, có sửa | 6/7 khớp; mục 5 thiếu quy tắc chính thức; mục 6 lỗi thời. Mục 1: chưa đọc được chép lời video gốc |
| Ngách XANH | Đã sửa 1 | 1/11 dưới ngưỡng ≥2 kênh mẫu còn sống |
| Từ vựng thị trường | Đã gộp trong `kenh-mau` | Việt Nam/Việt, Hoa Kỳ/Mỹ/US, Toàn cầu/Đa quốc gia |
| Từ vựng ngách | Chưa chuẩn hóa | 3 bộ tên, 0 trùng giữa videos và ngach-xanh; chờ quyết định bảng ánh xạ |
| Khoảng trống | Mở | 49/256 kênh thiếu `niche` và `markets`; 8 ngách thiếu `rpm` |

**Hai lỗi hiển thị tìm thấy khi đọc dữ liệu:** (1) thẻ "Kênh mẫu sạch" luôn 0 vì bộ đếm đọc `n.mauSach` trong khi dữ liệu đã làm giàu để ở `n.channels`; nay 51, trùng số tính độc lập từ file. (2) Thẻ "RPM Benchmark $10,22" bỏ mọi ký tự không phải số khỏi văn bản tự do, nên "135.1K" (nhu cầu search) và "407K…" bị tính là RPM; trung vị đúng chỉ do may mắn. Nay chỉ đọc số ngay sau chữ "median" và ghi rõ là benchmark ngành, không phải RPM đo trên kênh mẫu.

**Giới hạn của phép dò kênh:** HTTP 200 chỉ chứng minh kênh còn tồn tại, không chứng minh "đăng trong 30 ngày" hay "còn tăng"; RSS chập chờn (kênh sống vẫn trả 404/500); `channelId` và số sub lấy từ HTML trang bị lẫn phần tử khác nên không được ghi vào dữ liệu. Cờ `dead` trong dữ liệu mang hai nghĩa (404 và "kênh rỗng 0 video"); chưa tách thành hai trạng thái.

**Ảnh và dữ liệu thô** (thư mục `scratchpad\ui\check\`): `du-lieu-kiem-chung.html`, `dulieu-kenh-song-sau.png`, `dulieu-tatca-sau.png`, `dulieu-ngach-haicap-sau.png`; thô: `scratchpad\ui\channel-resolve-live.json`, `channel-resolve-diff.json`, `channel-rss12.json`.
