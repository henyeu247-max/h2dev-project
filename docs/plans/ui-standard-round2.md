# Kế hoạch vòng 2 — UI-standard (H2DEV-Project)

> **Cập nhật:** 2026-10-09. **Tài liệu đọc kèm:** `docs/reports/2026-10-09-ui-standard-round1.md` (số đo và mục mở), `docs/solutions/2026-10-09-ui-standard-round1.md` (bài học H2DEV-UI-001 đến 012).
> **Nhánh:** `ui/ui-standard-2026-10-09` (commit `c22844d`, bổ sung `f21837e` và `c984695`). Chưa push.
> **Mục đích:** một người mới chỉ đọc file này là làm tiếp được, không cần hỏi lại.

---

## 1. Mục tiêu và tiêu chí xong

**Mục tiêu:** đưa 12 route về trạng thái đạt chuẩn UI-standard ở 5 cỡ màn hình, rồi nghiệm thu.

**Route:** /tatca, /video, /ngachxanh, /tai-lieu, /nhac, /nguonreup, /kenh-mau, /rawkenh, /chienluoc, /lotrinh, /lotrinh/VIDEO-DD983D, /learn.html.

**Cỡ:** 360, 390, 820, 1024, 1440 px. Thêm 642, 700, 1280, 1366 px khi chạm mốc 640/641 hoặc 1023/1024.

**Trạng thái bài học** (khi đo trang bài học): chưa xem, đang dở (20%), đã xem.

**Tiêu chí xong (Definition of Done).** Chỉ được báo PASS khi tất cả đều đạt:

| # | Tiêu chí | Cách kiểm |
|---|---|---|
| DoD-1 | 12 route × 5 cỡ: `overflowX = 0`, `eleven = 0`, `clippedWithoutTitle = 0`, `h1Count = 1`, `headingSkips = 0`, `smallTargets (< 24 px) = 0` | `audit-ui` dán inline vào trình duyệt |
| DoD-2 | `orphanRows = 0` ở mọi route. Mục còn lại phải có lý do ghi trong báo cáo và được anh chấp nhận | `audit-ui` + xem ảnh |
| DoD-3 | Vùng chạm < 44 px: đã liệt kê hết, mỗi nhóm đã sửa hoặc có lý do (cảnh báo A-1) | đếm theo nhóm |
| DoD-4 | Khối điều khiển bài học: sáu điều khiển cùng 44 px ở 3 trạng thái × 5 cỡ; hàng 1 không xuống dòng ở 642–1440 px | `getBoundingClientRect` |
| DoD-5 | Sáu gate `exit 0` trên working tree **và** trên cây commit. `sync-counts --check` exit 0 nếu có đổi dữ liệu | chạy lệnh, ghi mã thoát |
| DoD-6 | Ảnh mọi route đã đổi được anh xem bằng mắt (không chỉ số) | ảnh 390 px và 1440 px |
| DoD-7 | Ảnh so sánh: thay đổi trên 5% có giải thích theo vùng; trên 20% có dừng và xác nhận | PIL, ngưỡng 24/255 |
| DoD-8 | Các mục M5–M7 có quyết định hoặc được đánh dấu ngoài phạm vi có chủ sở hữu | Decision Log (mục 7) |
| DoD-9 | Báo cáo đợt 2, CHANGELOG, PROGRESS và plan này được cập nhật. Commit trên nhánh; không push nếu chưa được yêu cầu | `git log`, `git status` |

---

## 2. Bối cảnh xuất phát

- **Commit:** `c22844d` (đợt sửa), `f21837e` (ba hunk text-2xs còn sót), `c984695` (tài liệu) trên `ui/ui-standard-2026-10-09`, gốc `main` tại `773e40e`. Phiên bản tài nguyên `uifix67`.
- **Server:** dịch vụ `H2DEV_Service` (NSSM) đang nghe `0.0.0.0:8899`. Kiểm bằng `netstat -ano | grep :8899`. Không tự khởi động lại dịch vụ. Xem M7.
- **Working tree còn của công việc khác:** 122 file M (trong đó `player-main.js` còn 10 hunk ngoài phạm vi) và khoảng 152 file untracked (dữ liệu, tài liệu ingest, script part2/part6, `docs/reports/` không theo dõi). **Không đụng vào.**
- **Gate:** sáu gate ở `scripts/`. `gate-shell.js` cần `NODE_PATH` tới `node_modules` của repo khi chạy trong worktree.
- **Dữ liệu:** không đổi số đếm trong đợt 1. `docs/WORKING_STATE.md` đang ở trạng thái M do công việc khác.

---

## 3. Quy tắc làm việc (đã nắm lại)

1. **Đo trước, sửa sau.** Mọi số có đủ: route, cỡ, trạng thái, công cụ, phiên bản hoặc thời điểm.
2. **Số đo chỉ phát hiện.** Phải xem ảnh trước khi nói "đẹp" hoặc "đạt". Không báo PASS từ một công cụ.
3. **Mỗi lần đổi CSS/JS:** tăng `?v=` trong `index.html` (21 chỗ), `learn.html` (10), `player.html` (10) và `CACHE` trong `assets/app/sw.js`. Trước mỗi lần đo: hủy đăng ký service worker, xóa cache, tải lại trang. Số đo cũ hơn lần đổi gần nhất là vô giá trị.
4. **Đo đủ ma trận** route × cỡ × trạng thái. Mốc 640/641 và 1023/1024 phải kiểm cả hai phía.
5. **Ngưỡng ảnh (pha 5 của skill):** dưới 0,5% giữ nguyên; 0,5–5% đổi nhẹ, nêu lý do; 5–20% giải thích từng vùng; trên 20% dừng và kiểm lại, ghi rõ trong báo cáo.
6. **Sau mỗi nhóm đổi:** chạy sáu gate, mã thoát phải là 0. Sau khi đổi dữ liệu: `node scripts/sync-counts.js --check`.
7. **Git:** làm việc trên nhánh riêng, không trên `main`. Chỉ commit khi được yêu cầu. Nếu file lẫn việc khác, stage theo hunk (`git diff -U0` và `git apply --cached --unidiff-zero`). Không push nếu chưa được yêu cầu. Không đưa thay đổi của người khác vào commit.
8. **Bí mật:** không in giá trị. Kiểm bằng đếm hoặc hash. Quét dòng được thêm trước mỗi commit.
9. **Bài học:** của dự án → `docs/solutions/` và một dòng trỏ trong `AGENTS.md` (mục `## Lessons`, ID `H2DEV-UI-###`). Kỹ thuật tái dùng → skill toàn cục (sửa nguồn, lint, `apply --yes`, `verify`). Luật toàn cục → chỉ đề xuất, không tự sửa.
10. **Không sửa bản sinh tự động.** Bản copy của skill trong các công cụ là bản sinh. Sửa ở `~/.agents/source/skills/` rồi đồng bộ.
11. **Không polling job nền.** Job treo: dùng `TaskStop` sau khi xác minh tác dụng của nó đã có.
12. **Môi trường này:** heredoc trong Bash bị treo. Tạo file bằng công cụ Write rồi `cp` hoặc `cat`. Browser runner không đọc được file: dán nội dung script vào `page.evaluate`. Sửa byte bằng perl chỉ theo dòng, rồi kiểm `od -c`.
13. **Xóa:** chỉ xóa file tạm do chính mình tạo, sau khi kiểm đích. Không xóa thứ của người khác. Metadata worktree tạm cũng do mình tạo: xóa thư mục `.git/worktrees/<tên>` nếu `prune` không xóa được.

---

## 4. Các milestone

### M0 — Chuẩn bị (không đổi code)

1. Kiểm server: `netstat -ano | grep :8899` có `LISTENING`. Nếu không có: báo BLOCKED, không tự khởi động.
2. Chạy sáu gate trên working tree. Kết quả mong đợi: sáu mã thoát 0. Ghi lại.
3. Chụp baseline: 12 route × cỡ 390, 820, 1440 px. Đặt tên `<route>-<cỡ>-<trạng thái>.png` trong scratchpad, không đưa vào repo.
4. Đo baseline: `audit-ui` cho 12 route × 5 cỡ. Lưu JSON vào scratchpad.

**Acceptance:** sáu mã thoát 0; có đủ ảnh và JSON baseline. **Rủi ro:** server dừng giữa chừng → BLOCKED.

### M1 — Chip và handle mồ côi (DoD-2)

**Vấn đề (đo ở uifix63):**

| Route | Cỡ | Mồ côi |
|---|---|---|
| /ngachxanh | 390, 820, 1024, 1440 | các dòng handle "@lilliput_history ↗", "@theopenscriptures ↗", "@Jinseioiyasukotoba ↗"; "Tách khỏi đề xuất (1)" (820) |
| /tai-lieu | 390, 820, 1440 | "Xem thêm 23 ngách" (1440); "Reup / Hoạt hình" (390, 820) |
| /nguonreup | 390 | "Cộng đồng · 2" |
| /kenh-mau | 390, 820, 1024, 1440 | "Bán content & Reup Part 3 · 4" (390); dòng "@늦기전에… SỐNG…" (820–1440) |
| /rawkenh | 1440 | "Phim AI / Điện ảnh · 5" |

**Phương án (chọn theo ảnh từng trường hợp):**
- (a) Phần tử lẻ chiếm cả hàng: quy tắc `:nth-child(2n+1)` full-width, có `:not(#id)` để loại nhóm đã có layout riêng.
- (b) `flex: 1 1 auto` cho hàng chip thuần (đã dùng ≤1024 px). Kiểm lại ở 1440 px, vì hiện chưa áp dụng ở đó.
- (c) Nút "Xem thêm N ngách": đặt cùng hàng với nhóm trước, hoặc full-width.

**Thứ tự:** /ngachxanh (nhiều nhất), rồi /tai-lieu, /kenh-mau, /nguonreup, /rawkenh.

**Đo:** `audit-ui` ở 5 cỡ cho route vừa sửa; `orphanRows = 0`. Xem ảnh ở 390 và 1440.
**Rủi ro:** quy tắc chung lan sang /video, /tatca, /rawkenh. Đo cả ba. **Rollback:** `git revert` commit M1 trên nhánh.

### M2 — Dải tab trang Lộ trình (/lotrinh, /learn.html) ở 390 (UI-012)

**Vấn đề:** tab "Tìm kiếm bài học" nằm một mình ở hàng cuối khi `.tabbar` xuống dòng.

**Phương án:**
- (a) Tab lẻ cuối chiếm cả hàng (cùng mẫu với M1).
- (b) Hai cột đều cho tab, cuối full-width khi số lẻ.
- (c) Giảm padding để năm tab vừa một hàng ở 360 px, miễn không cắt chữ và không cuộn ngang.

**Đo:** 360, 390, 820, 1024 px. `scrollWidth = clientWidth`, `orphanRows = 0`, không cắt chữ (kiểm `clippedWithoutTitle`).

### M3 — Trang bài học: thẻ tài liệu và nút nhỏ (DoD-2, DoD-3)

**Vấn đề:**
- Sáu nút "Mở file local" mồ côi ở mọi cỡ (đo ở uifix66).
- Vùng chạm dưới 44 px: 239 ở 1024 px, 269 ở 1440 px (uifix66). **Số này đã cũ:** uifix67 đưa ba nút khối điều khiển lên 44 px. Đo lại trước khi kết luận.

**Phương án:** xem ảnh thẻ ở 390, 820, 1440 rồi chọn: (a) lưới hai cột đều trong thẻ, (b) nút "Mở file local" full-width trong thẻ, (c) giữ xếp dọc (khi đó không còn mồ côi).

**Đo:** `orphanRows = 0`. Liệt kê `targetsBelow44` còn lại theo nhóm (nút tài liệu, nút điều hướng nhỏ, liên kết), mỗi nhóm có lý do.

### M4 — Nhãn KPI sau khi lên 12 px (/tatca, /rawkenh)

**Vấn đề:** chưa xem bằng mắt ở 820 và 1440 px. Rủi ro: nhãn 2–3 dòng lệch giữa các thẻ cạnh nhau.

**Bước:**
1. Chụp thẻ KPI ở 820 và 1440 px.
2. Đếm dòng của nhãn mỗi thẻ (`Range.getClientRects()` hoặc chiều cao / line-height).
3. Nếu lệch: `text-wrap: balance` (T-8), hoặc `min-height` đồng nhất cho nhãn.

**Acceptance:** nhãn cùng hàng thẻ có số dòng bằng nhau, hoặc chênh tối đa một dòng; không tràn.

### M5 — Kiểm trên thiết bị thật (cần anh)

Sandbox không có thiết bị thật. Danh sách kiểm trên điện thoại và iPad:

1. Nút chính sách (mở và thu) trên /tatca.
2. Ba chip Watch: đều cỡ, không nhảy hàng.
3. Ô chọn Ngách (cả hàng), Thị trường và Sắp xếp (chia đôi).
4. Dải chip thị trường: lưới đều, không chip mồ côi.
5. Trang bài học: khối điều khiển 44 px, "Xem tiếp", ô ghi chú.
6. Tab trang Lộ trình.

**Nếu chưa có thiết bị:** dùng emulation chạm qua công cụ devtools. Ghi rõ đây là xấp xỉ, không thay thế thiết bị thật.

**Acceptance:** anh xác nhận từng mục (đạt, hoặc không đạt kèm ảnh).

### M6 — Token `2xs`: quyết định và thực hiện

**Hiện trạng:**
- `assets/h2dev-tokens.css`: đã bỏ `--h2-font-2xs`.
- `design-system/tokens.json` dòng 242: `font-2xs: 11px`; dòng 253: `font-2xs` ánh xạ class `text-2xs`. **Đây là tài liệu viết tay.** `scripts/sync-tokens.js` đọc CSS để tạo manifest, không tạo CSS từ JSON.
- `tailwind.config.js` dòng 49: `'2xs': '11px'`; dòng 21: safelist `text-2xs`.
- `design-system/token-manifest.json` đang ở trạng thái M (không do đợt này). Có thể cần tạo lại sau khi bỏ token.
- `assets/tailwind.css` chưa build lại.

**Lựa chọn:**
- (A) Giữ tài liệu và config, ghi rõ "2xs không còn dùng". Không đổi build.
- (B) Đổi `tokens.json` và `tailwind.config.js` sang 12 px / `xs`, rồi build lại Tailwind.

**Nếu chọn B:**
1. Sao lưu `assets/tailwind.css` (vào scratchpad).
2. Kiểm glob `content` của `tailwind.config.js`: đếm file quét được so với file chứa class.
3. `npm run build:css`.
4. `node scripts/check-ui-classes.js`: mã thoát 0. So kích thước `tailwind.css` trước và sau. Nếu mất class, khôi phục bản sao lưu.
5. `gate-typography.js` mã thoát 0.

**Acceptance:** quyết định ghi trong Decision Log; nếu chọn B thì các gate trên đều 0.

### M7 — Thay đổi ngoài phạm vi: quyền sở hữu (DoD-8)

**Đối tượng 1 — `assets/app/player-main.js` (10 hunk ngoài phạm vi, chưa commit):**

| Vị trí (khoảng dòng) | Nội dung | Ghi chú |
|---|---|---|
| ~218 | nhánh `else` trong `resize`: gọi lại `setPlayerTab` khi thu nhỏ | chưa rõ nguồn; không có nhãn của đợt này |
| ~353–358, 499, 619 | SKU không phân biệt hoa thường (`catalogBySkuLower`, `resolvedSku`) | dữ liệu |
| ~452–466 | handle dạng object, kênh DIE (`c.dead`, `deadNote`), `cleanDocName` theo `title` | dữ liệu / kênh DIE |
| ~536 | SOP dạng mảng (`edit_sop` là mảng hoặc object) | dữ liệu |

**Đối tượng 2 — công việc khác:** `docs/WORKING_STATE.md` (M), `docs/reports/` (không theo dõi), `scripts/*part*`, `assets/docs/`, `assets/thumbs/`, `_proof_043d15/`, `_web_proof/`.

**Đối tượng 3 — mạng:** `H2DEV_Service` nghe `0.0.0.0:8899`. Quy tắc dự án là `127.0.0.1` trừ khi có chủ đích.

**Bước:** hỏi chủ sở hữu từng nhóm: giữ, commit riêng hoặc bỏ. Không commit các nhóm này trong nhánh UI. Ghi quyết định vào Decision Log.

### M8 — Nghiệm thu cuối

1. Sweep 12 route × 5 cỡ bằng `audit-ui`. Lập bảng số (DoD-1, DoD-2).
2. Xem ảnh từng route ở 390 và 1440 px (DoD-6).
3. Sáu gate trên working tree và trên cây commit (DoD-5). Trên worktree tạm nhớ `NODE_PATH` cho `gate-shell`.
4. Gọi advisor để đánh giá độc lập trước khi báo PASS.
5. Viết báo cáo đợt 2, cập nhật CHANGELOG, PROGRESS và plan này. Commit trên nhánh. Không push nếu chưa được yêu cầu.

**Kết quả:** PASS chỉ khi DoD-1 đến DoD-9 đều đạt. Nếu không, báo PARTIAL với danh sách mở.

---

## 5. Tiến độ

- [x] 2026-10-09 Commit `c22844d` (17 file), `f21837e` (ba hunk text-2xs còn sót), `c984695` (tài liệu), nhánh `ui/ui-standard-2026-10-09`.
- [x] 2026-10-09 Sáu gate mã thoát 0 trên working tree và trên cây commit (`gate-shell` với `NODE_PATH`).
- [x] 2026-10-09 Báo cáo đợt 1, bài học H2DEV-UI-001 đến 012, plan này.
- [ ] M0 Chuẩn bị.
- [ ] M1 Chip và handle mồ côi.
- [ ] M2 Dải tab Lộ trình.
- [ ] M3 Trang bài học: thẻ tài liệu.
- [ ] M4 Nhãn KPI.
- [ ] M5 Thiết bị thật (cần anh).
- [ ] M6 Token `2xs`.
- [ ] M7 Quyền sở hữu thay đổi ngoài phạm vi (cần anh).
- [ ] M8 Nghiệm thu cuối.

---

## 6. Phát hiện bất ngờ (Surprises & Discoveries)

- Quy tắc chạm 44 px trong `h2dev-shell.css` (mục 10b) chỉ áp dụng đến 1024 px. PC và iPad vì vậy khác nhau. Xem H2DEV-UI-001.
- `display: contents` đặt trong `flex-wrap` làm phần tử cuối nhảy dòng và lệch phải. Xem H2DEV-UI-002.
- Đổi `.tabbar` sang xuống dòng tạo tab mồ côi. Xem H2DEV-UI-012.
- `gate-shell.js` cần gói `playwright` trong `node_modules`. Worktree mới không có gói này. Xem H2DEV-UI-011.
- `str.splitlines()` tách thêm ở ký tự đặc biệt và làm mất một hunk khi phân loại. Dùng `split('\n')`. Xem H2DEV-UI-010.
- `tokens.json` và `tailwind.config.js` vẫn có `2xs`, dù CSS đã bỏ (M6).
- Số file untracked của working tree tăng từ 149 lên 152 trong lúc làm việc. Không do đợt này.
- Thư mục metadata `.git/worktrees/wt-check` không xóa được bằng `prune` (lỗi quyền). Đã xóa thủ công.

---

## 7. Nhật ký quyết định (Decision Log)

- **D-01 (2026-10-09):** khối điều khiển bài học 44 px ở mọi trạng thái, theo yêu cầu "luôn bằng Bài trước/Bài tiếp theo". Lý do: đồng nhất với điều hướng và với iPad. Đảo ngược được: đặt lại 32 px cho "chưa xem" nếu anh muốn.
- **D-02 (2026-10-09):** "Xem tiếp" chiếm trọn hàng 2. **Chờ anh xác nhận.** Phương án căn phải đã có sẵn để làm trong một lượt.
- **D-03 (2026-10-09):** commit trên nhánh riêng, chỉ hunk thuộc đợt này.
- **D-04 (2026-10-09):** không đưa nhánh resize, SKU và SOP của `player-main.js` vào commit. **Chờ M7.**
- **D-05 (2026-10-09):** không đổi cấu hình mạng của `H2DEV_Service` trong vòng này. **Chờ anh xác nhận.**

---

## 8. Rủi ro và đường lui

- **Quy tắc CSS chung ảnh hưởng nhiều trang.** Đo đủ route trước khi commit. Đường lui: `git revert` theo commit trên nhánh.
- **Đổi Tailwind có thể mất class** (SCAR-016 của dự án). Sao lưu `assets/tailwind.css`, chạy `check-ui-classes`, khôi phục nếu không đạt.
- **Dịch vụ nghe `0.0.0.0`.** Không thay đổi trong vòng này. Báo cáo để anh quyết định.
- **Thay đổi của người khác** trong working tree: không chạm, không commit.

---

## 9. Kết quả và nhận xét (điền khi xong)

*Chưa có. Điền khi kết thúc M8.*
