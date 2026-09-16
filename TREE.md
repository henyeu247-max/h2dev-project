# Cây thư mục chuẩn — H2DEV-Project

Cập nhật: **2026-09-12**

H2DEV là **một nguồn sự thật**. Gốc `Y:\YTB` không chứa data làm việc.

```
Y:\YTB\
├── README.md                      # trỏ vào H2DEV
├── _archive\                      # KHÔNG sửa · bản gốc đã gom
│   ├── 20260818-root\             # MD / prompt / excel / tmp / pipeline gốc
│   └── secrets\                   # mcp-keys — không đưa lên web
└── H2DEV-Project\                 # NÃO
    ├── TREE.md                    # file này
    ├── 00_README.md               # chạy server / nguyên tắc
    ├── AGENTS.md                  # SSoT 1 chỗ — boot order mỗi phiên
    ├── CHANGELOG.md               # trạng thái vận hành
    ├── CHAY-LAN.md                # hướng dẫn chạy LAN / Tailscale
    ├── index.html · player.html · learn.html
    ├── server.js                  # HTTP tĩnh · bind 0.0.0.0:8899 · BLOCKED ở dòng 150
    ├── package.json · package-lock.json · tailwind.config.js
    ├── css\                       # input.css — nguồn Tailwind → assets/tailwind.css
    │
    ├── VẬN HÀNH (giữ server sống)
    ├── H2DEV-OneClick.cmd         # khởi động 1 nhấp
    ├── start-lan.cmd              # khởi động LAN
    ├── h2dev-tray.ps1             # tray app + ghi h2dev-tray.log
    ├── h2dev-watchdog.ps1         # check port 8899 mỗi 5 phút · healthy = exit 0 không log
    ├── h2dev-watchdog-hidden.vbs  # task H2DEV-Watchdog gọi file này (wscript, không flash console)
    ├── install-h2dev-watchdog.ps1 # đăng ký task (cần Administrator)
    ├── install-h2dev-noadmin.ps1 · install-h2dev-startup.ps1
    ├── check-server.ps1           # kiểm tra nhanh server
    ├── h2dev-silent.vbs · h2dev-icon.ico · .env.example
    ├── _rereg_watchdog_silent_admin.cmd   # đăng ký lại task (silent, cần Administrator)
    │
    ├── data\                      # catalog gốc + manifest dẫn xuất — tạo bằng script
    │   ├── catalog.json
    │   ├── catalog_full.json
    │   └── video_acceptance.json             # trạng thái pilot, QA, blocker — không gọi PASS giả
    ├── data-tabs\                 # data LIVE của 9 tab (8 data tab + tab Lộ trình/lotrinh) — đúng 9 file JSON
    │   ├── videos.json            # 136 SKU (22 free / 110 pro + 4 Zoom free)
    │   ├── kenh-mau.json          # 165 kênh (152 sống · 13 dead ẩn) · ngay_do 165/165
    │   ├── tai-lieu-full.json     # 109 card (prompt 35 · report 20 · tool 22 · list 16 · other 11 · internal-doc 5)
    │   ├── nguon-reup.json        # 27
    │   ├── ngach-xanh.json        # 34 ngách (xanh:true 11 · CÓ MẪU TĂNG 10 · CHƯA ĐỦ BC 8 · THẬN TRỌNG 3 · CÓ ĐK 2) + 5 meta kho + 5 đỏ + 13 BXH
    │   ├── chien-luoc.json        # workflow 9 bước · 4 nguyên tắc
    │   ├── kich-ban.json          # 45 — extract cũ, UI không đọc
    │   ├── dong-bo-ngoai.json     # bảng match/gôm (13 matched · 19 merged · 5 không gom)
    │   └── raw-kenh-mau.json      # 124 record canonical (118 kênh unique · 6 bản ghi trùng channel) · OCR 83 · Vision 124/124 · vidIQ verified 83
    │
    ├── assets\                    # tailwind.css · viddar.css · learn.css · fonts\ (woff2 self-host)
    │   ├── thumbs\                # 136/136 khớp videos.json + placeholder.svg
    │   └── avatars\ · docs\
    ├── docs\
    │   ├── VIDEO-*\               # 132/132 SKU: README + description.html
    │   ├── ZOOM-*\                # 4 buổi Zoom (ZOOM-01..04) + ZOOM-00 quy trình: README + link tài liệu chi tiết
    │   └── NOI-BO\                # tài sản nội bộ đã chuẩn hóa tên
    │       ├── README.md
    │       ├── bao-cao\
    │       ├── prompt\
    │       ├── nguon\
    │       ├── chat\
    │       └── zoom\              # ⭐ Kiến thức Zoom: QUY-TRINH-XAY-KENH-A-Z.md + 4 buổi chi tiết
    │
    ├── pipelines\                 # pipeline chạy được
    │   ├── hoat-hinh-ai\
    │   ├── ton-giao\
    │   ├── wildlife\
    │   └── bible-explainer\
    ├── knowledge-hub\             # archive transcript / NotebookLM
    │
    ├── video\                     # 136 thư mục: 132 VIDEO-<sku>\<sku>.mp4 + 4 ZOOM-<slug>\<slug>.webm (~21.9 GB) · KHÔNG vào git
    ├── inbox\                     # THẢ FILE MỚI VÀO ĐÂY (web bị chặn)
    ├── scripts\                   # validate · sync · intake · clean
    ├── _backup\                   # snapshot — web bị chặn · KHÔNG vào git
    ├── _audit\                    # raw/nhật ký kiểm chứng — web bị chặn · KHÔNG đưa lên UI
    ├── _private\                  # chỗ key local — web bị chặn
    ├── _archive\                  # rác đã dời khỏi web serve — KHÔNG xoá (NO_DELETE) · web bị chặn
    │   └── 20260831-rac\_verify\  # 7 file scratch (chứa SKU pending VIDEO-3F8339)
    ├── raw-kenh-goc\             # 124 ảnh raw canonical + metadata · web bị CHẶN (403)
    ├── DESIGN-IS-2026-08-22\      # audit UI 22/08 (14/30 REDESIGN) · web bị CHẶN (403)
    └── node_modules\              # web bị chặn · KHÔNG vào git
```

## Quy tắc match / update

| Tình huống | Làm gì |
|---|---|
| File mới | Thả `inbox\` → `node scripts/intake-inbox.js` |
| Trùng prompt/list đã có | **MATCH** — gắn `fileLocal`, không tạo card mới |
| Báo cáo / pipeline / pack mới | **GÔM** — vào `docs/NOI-BO` hoặc `pipelines` + 1 card `tai-lieu-full.json` |
| Sửa data tab | Sửa JSON trong `data-tabs\` (không sửa `data\catalog*.json`) |
| Trước sửa lớn | Copy JSON vào `_backup\<YYYYMMDD>\` |
| Xong | `node scripts/validate-project.js` |

## Không được nằm ở gốc Y:\YTB

MD rời, prompt, excel, `_tmp_*`, `.bak`, pipeline zip, key.

## Web không serve (`server.js:150` BLOCKED)

`_backup` · `_private` · `_audit` · `inbox` · `node_modules` · `_verify` · `.git` · `_archive` · `Raw Kênh Mẫu Tìm Kiếm` (historical only) · `DESIGN-IS-2026-08-22` · file `.env*` · `mcp-keys*`

> 31/08: chặn thêm `Raw Kênh Mẫu Tìm Kiếm` (historical only; 96 ảnh 12 MB, từng public HTTP 200) + `DESIGN-IS-2026-08-22` (bản audit nội bộ). Đo lại: 3 vùng → **403**, `data-tabs/` + `assets/` → **200**.
