# BÁO CÁO RÀ SOÁT — H2DEV-Project

Ngày: 2026-10-14 · Chế độ: chỉ đọc (không sửa file dự án)
Căn cứ: đọc mã nguồn, gọi thử server local `127.0.0.1:8899`, chạy các gate có sẵn của dự án.

## Phạm vi đã đọc
- Đọc trọn: `AGENTS.md` (2 file), `TREE.md`, `package.json`, `.gitignore`, `.env.example`, `server.js`, `scripts/master_dal.js`, `scripts/live_player_resolver.js`, `scripts/validate-project.js`, `sw.js`, `assets/app/sw.js`.
- Đọc một phần: `scripts/spider_graph_engine.js`, `scripts/mcp-http-proxy.js`, các điểm `innerHTML` trong `main.js` và `player-main.js`.
- Chỉ kiểm kê, chưa đọc nội dung: khoảng 120 script còn lại, `content.js`, phần còn lại của `main.js`, `pipelines/`, `data/`, `docs/`.
- Không đọc: `node_modules`, `.venv-gpu`, `_archive`, `_backup`, `_audit`, `video/`.

## 1. Tổng quan
- Mục đích: kho tri thức và player cho khoá faceless YouTube, 144 bài, 256 kênh mẫu, 300 tài liệu, 34 ngách.
- Stack: Node.js thuần, SQLite (FTS5), HTML/JS vanilla, Tailwind, service worker. Chạy Windows.
- Kiến trúc: monolith tĩnh kèm vài API mỏng. `data/*.db` được chiếu ra 9 file JSON trong `data-tabs/`.

## 2. Bản đồ module
| Thư mục | Vai trò | File then chốt |
|---|---|---|
| gốc | server và 3 trang | `server.js`, `index.html`, `learn.html`, `player.html` |
| `assets/app/` | JS ứng dụng, tab, modal, service worker | `main.js`, `player-main.js`, `tabs/content.js`, `sw.js` |
| `data/`, `data-tabs/` | catalog, DB, 9 JSON tab | `catalog.json`, `videos.json`, `h2dev_master.db` |
| `scripts/` (124 file) | build, sync, gate, audit, pipeline | `validate-project.js`, `master_dal.js`, `gate-*.js` |
| `pipelines/` | hoạt hình AI, tôn giáo, wildlife, bible | `*/SKILL.md` |
| `docs/` | tài liệu, báo cáo, nội bộ | `docs/NOI-BO/` |

## 3. Kết quả gate
| Gate | Kết quả |
|---|---|
| `validate-project` (144 video, 256 kênh) | PASS |
| `counts:check` | PASS |
| `gate-icons`, `gate-typography`, `gate-p2`, `gate-shell`, `guard-no-inline-onclick` | PASS |
| `gate-p1` | FAIL 1 lỗi |

## 4. Phát hiện
- **[Medium] Gate P1 đỏ:** `assets/h2dev-components-lesson-row.css:107` có `line-height:22px`, ngoài thang 1 / 1.2 / 1.35 / 1.5 / 1.6. File đang sửa dở (10 file `M` chưa commit).
- **[Medium] Link chết:** `assets/app/player-main.js:446` trỏ tới `/watch-f59aa7.html`, file không tồn tại (404). 6/144 video có `drm:true` hiển thị nút này.
- **[Medium] Lỗi xử lý URL:** request có `%00` làm rớt kết nối (`server.js`). Server vẫn sống. Nguyên nhân chưa xác minh.
- **[Low] Catch rỗng ở frontend:** `main.js` 32, `player-main.js` 17, `h2dev-core.js` 10, `learn.js` 4, `content.js` 3, `nav.js` 2 (đếm bằng regex, chưa strip comment nên có thể dư).
- **[Nợ kỹ thuật]**
  - ID SCAR-006 đến 018 của dự án trùng số với SCAR toàn cục nhưng khác nội dung.
  - `AGENTS.md` ở `D:\YTB` dài 227 dòng, còn bản trong `H2DEV-Project` chỉ 13 dòng. Cả hai chỗ đều thiếu `CLAUDE.md`.
  - `TREE.md` ghi sai số dòng của `server.js` (ghi 305, 293, 334; thực tế 591, 512, 620).
  - Logic `niche-radar` nằm trong `server.js:525-589`.
  - `/lotrinh/<sku>` đọc `catalog.json` đồng bộ mỗi request (`server.js:477`).
  - `master_dal.js` có `mutateDatabase` và `mutateBatch` nhưng `server.js` chỉ dùng `searchFts`.
  - `.venv-gpu` (18.847 file) và `node_modules` nằm trong gốc dự án.

## 5. Đánh giá chung
- Điểm mạnh: hệ gate có probe và bắt được hồi quy thật. Service worker precache đủ 26/26 file. Số liệu khớp giữa manifest, DB và JSON.
- Việc nên làm: làm xanh `gate-p1` trước khi commit, xử lý link `/watch-f59aa7.html`, chặn `%00` trả 400.

## Giới hạn
- Chưa đọc nội dung khoảng 120 script, `content.js` và phần lớn `main.js`. Chưa chạy test trình duyệt. Số catch rỗng là ước lượng.
