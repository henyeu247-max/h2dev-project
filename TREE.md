# Cây thư mục chuẩn — H2DEV-Project

Cập nhật: **2026-09-16**

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
    ├── server.js                  # HTTP tĩnh · bind 0.0.0.0:8899 · chặn web tại `SENSITIVE_SEGMENTS` (dòng 305)
    ├── package.json · package-lock.json · tailwind.config.js
    ├── css\                       # input.css — nguồn Tailwind → assets/tailwind.css
    ├── H2DEV-OneClick.cmd         # ⭐ khởi động 1 nhấp (wrapper mỏng → scripts\windows\)
    ├── h2dev-silent.vbs · h2dev-watchdog-hidden.vbs   # wrapper mỏng cho Task Scheduler → scripts\windows\
    ├── h2dev-icon.ico · h2dev-icon.png · .env.example
    │
    ├── scripts\windows\           # (dời từ gốc 11/09) start-lan.cmd · h2dev-tray.ps1 · h2dev-watchdog.ps1
    │                              #   install-h2dev-{watchdog,noadmin,startup}.ps1 · check-server.ps1
    │                              #   _rereg_watchdog_silent_admin.cmd · h2dev-service-autoreload-hook.ps1 (16/09)
    ├── data\                      # catalog gốc + manifest dẫn xuất — tạo bằng script
    │   ├── catalog.json               # 136 record (projection gốc)
    │   ├── catalog_full.json          # 136 record (projection đầy đủ)
    │   ├── modules.json               # 12 module
    │   ├── video_acceptance.json      # trạng thái pilot, QA, blocker — không gọi PASS giả
    │   ├── raw-channels-deep\         # 149 hồ sơ kênh sâu (transcripts/summary/vision) — phục vụ UI
    │   ├── research-20260916\         # 43 prompt master research (nguồn của +43 card 16/09)
    │   └── *.db (h2dev_master · intelligence) · *.json dẫn xuất/manifest · *_backup_* (detritus cũ, không trỏ vào)
    ├── data-tabs\                 # data LIVE của 9 tab (8 data tab + tab Lộ trình/lotrinh) — đúng 9 file JSON
    │   ├── videos.json            # 136 SKU (22 free / 110 pro + 4 Zoom free)
    │   ├── kenh-mau.json          # 165 kênh (152 sống · 13 dead ẩn) · ngay_do 165/165
    │   ├── tai-lieu-full.json     # 152 card (prompt 78 · report 20 · tool 22 · list 16 · other 11 · internal-doc 5)
    │   ├── nguon-reup.json        # 27
    │   ├── ngach-xanh.json        # 34 ngách (xanh:true 11 · CÓ MẪU TĂNG 10 · CHƯA ĐỦ BC 8 · THẬN TRỌNG 3 · CÓ ĐK 2) + 5 meta kho + 5 đỏ + 13 BXH
    │   ├── chien-luoc.json        # workflow 11 bước · 4 nguyên tắc
    │   ├── kich-ban.json          # 45 — extract cũ, UI không đọc
    │   ├── dong-bo-ngoai.json     # bảng match/gôm (13 matched · 19 merged · 5 không gom)
    │   └── raw-kenh-mau.json      # 156 record canonical (149 kênh unique · 7 bản ghi trùng channel) · OCR 83 · Vision 156/156 · vidIQ verified 83
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
    ├── video\                     # 136 thư mục: 132 VIDEO-<sku>\<sku>.mp4 + 4 ZOOM-<slug>\<slug>.webm (~21.55 GiB / 23.1 GB) · KHÔNG vào git
    ├── inbox\                     # THẢ FILE MỚI VÀO ĐÂY (web bị chặn)
    ├── scripts\                   # validate · sync · intake · clean
    ├── _backup\                   # snapshot — web bị chặn · KHÔNG vào git
    ├── _audit\                    # raw/nhật ký kiểm chứng — web bị chặn · KHÔNG đưa lên UI
    ├── _private\                  # chỗ key local — web bị chặn
    ├── _archive\                  # rác đã dời khỏi web serve — KHÔNG xoá (NO_DELETE) · web bị chặn
    │   ├── 20260831-rac\_verify\  # 7 file scratch (chứa SKU pending VIDEO-3F8339)
    │   └── 20260916-junk-cleanup\ # _frames (235 file/71M) · _internal (1285 file/125M, gồm dot_git_backup\ 108M) · _drafts (4) · _tmp_audio
    ├── .cache\                    # cache runtime (checkpoint, thumbnail, reload-state) · web bị chặn
    ├── logs\                      # log server/watchdog/reload · web bị chặn · KHÔNG vào git
    │   # (không còn ở gốc: _frames\ · _tmp_audio\ · _drafts\ · _internal\ — đã dời 16/09; script tự tạo lại khi chạy)
    ├── raw-kenh-goc\             # 135 ảnh raw canonical + metadata (156 record: 21 kênh mới chưa có ảnh chụp) · web bị CHẶN (403)
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

## Web không serve (`server.js:305` — `SENSITIVE_SEGMENTS`)

> Cơ chế cũ là mảng `BLOCKED` tại `server.js:150`; **16/09/2026** nâng cấp thành `Set SENSITIVE_SEGMENTS` (dòng 305), so khớp **chữ thường** (chống bypass `/.GIT/config`, `/_PRIVATE/`) và mở rộng danh sách.

`SENSITIVE_SEGMENTS` hiện tại: `.git` · `node_modules` · `_private` · `_backup` · `_audit` · `_internal` · `_drafts` · `_archive` · `_verify` · `_frames` · `_tmp_audio` · `.cache` · `.venv-gpu` · `.zcode` · `logs` · `inbox` · `raw-kenh-goc` · `design-is-2026-08-22` · `raw kênh mẫu tìm kiếm` (historical only)

Ngoài ra chặn theo **tên file**: `.env*` (`:293`) · `*.db` / `*.sqlite*` kèm `-wal/-shm/-journal` · `mcp-keys*` (`:334`).

> Đo lại 16/09/2026: `_private` · `_backup` · `_audit` · `_frames` · `_tmp_audio` · `_drafts` · `_internal` · `raw-kenh-goc` → **403**; `data-tabs/` · `assets/` · `index.html` → **200**.
