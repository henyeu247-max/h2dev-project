# Cây thư mục chuẩn — H2DEV-Project

Cập nhật: **2026-10-29**

H2DEV là **một nguồn sự thật**. Gốc `Y:\YTB` không chứa data làm việc.

```
Y:\YTB\
├── README.md                      # trỏ vào H2DEV
├── Nhạc nền\                      # KHO 49 TRACKS NHẠC NỀN (328 MB) đã audit Gemini Multimodal
├── _archive\                      # KHÔNG sửa · bản gốc đã gom
│   ├── 20260818-root\             # MD / prompt / excel / tmp / pipeline gốc
│   └── secrets\                   # mcp-keys — không đưa lên web
└── H2DEV-Project\                 # NÃO
    ├── TREE.md                    # file này
    ├── 00_README.md               # chạy server / nguyên tắc
    ├── AGENTS.md                  # SSoT 1 chỗ — boot order mỗi phiên
    ├── CHANGELOG.md               # trạng thái vận hành
    ├── CHAY-LAN.md                # hướng dẫn chạy LAN / Tailscale
    ├── index.html · player.html · learn.html · graph.html
    ├── server.js                  # HTTP tĩnh · bind 0.0.0.0:8899 · chặn web tại `SENSITIVE_SEGMENTS` (trong `server.js`)
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
    │   ├── catalog.json               # 148 record (projection gốc)
    │   ├── catalog_full.json          # 148 record (projection đầy đủ)
    │   ├── catalog_huan.json · catalog_dgmd.json  # 140 record Huân Academy + 45 record DGMD (tổng 333 bài 3 nhánh)
    │   ├── modules.json · modules_huan.json · modules_dgmd.json  # 12 + 12 + 11 = 35 module
    │   ├── video_acceptance.json      # trạng thái pilot, QA, blocker — không gọi PASS giả
    │   ├── raw-channels-deep\         # 149 hồ sơ kênh sâu (transcripts/summary/vision) — phục vụ UI
    │   ├── research-20260916\         # 43 prompt master research (nguồn của +43 card 16/09)
    │   ├── music_catalog.json         # 49 tracks nhạc nền đã audit Gemini & FFprobe (36 SAFE · 9 REVIEW · 4 COPYRIGHTED)
    │   ├── counts-manifest.json       # manifest số liệu chuẩn tự động sinh bởi sync-counts.js
    │   ├── overview_summary.json      # micro-shard tổng hợp siêu nhẹ (~2 KB) phục vụ tức thì cho Topbar & các tab
    │   └── *.db (h2dev_master · h2dev_knowledge_graph · intelligence) · knowledge_graph.json
    ├── data-tabs\                 # data LIVE của 9 tab (8 data tab + tab Lộ trình/lotrinh) — đúng 9 file JSON
    │   ├── videos.json            # 148 SKU (27 free · 121 pro — gồm 4 Zoom free)
    │   ├── kenh-mau.json          # 1082 kênh (993 sống · 89 dead ẩn) · ngay_do 1082/1082 (đo thực tế: 993 sống · 75 DIE 404 · 14 rỗng)
    │   ├── tai-lieu-full.json     # 580 card (kind: prompt 211 · report 28 · tool 40 · list 22 · other 8 · internal-doc 11 · sop 90 · guide 102 · transcript 57 · sheet 11 · 0 chưa gán)
    │   ├── nguon-reup.json        # 52
    │   ├── ngach-xanh.json        # 40 ngách (xanh:true 16 · CÓ MẪU TĂNG 11 · CHƯA ĐỦ BC 6 · THẬN TRỌNG 5 · CÓ ĐK 2) + 5 meta kho + 5 đỏ + 12 Trụ cột Chính sách YouTube 2026
    │   ├── chien-luoc.json        # workflow 24 bước · 4 nguyên tắc · 12 bước Checklist trước khi đăng · Ma trận 148 bài học
    │   ├── kich-ban.json          # 60 — extract cũ, UI không đọc
    │   ├── dong-bo-ngoai.json     # bảng match/gôm (13 matched · 19 merged · 5 không gom)
    │   └── raw-kenh-mau.json      # 156 record canonical (149 kênh unique · 7 bản ghi trùng channel) · OCR 83 · Vision 156/156 · vidIQ verified 83
    │
    ├── assets\                    # tailwind.css (BUILD từ css/input.css) · viddar.css · learn.css · player.css · fonts\ (woff2 self-host)
    │   ├── thumbs\                # 148/148 khớp videos.json + 140 HUAN + placeholder.svg (289 files)
    │   └── avatars\ · docs\
    ├── docs\
    │   ├── VIDEO-*\               # 329 README.md · 166 description.html (đếm đệ quy hiện trạng)
    │   ├── ZOOM-*\                # 4 buổi Zoom (ZOOM-01..04) + ZOOM-00 quy trình: README + link tài liệu chi tiết
    │   └── NOI-BO\                # tài sản nội bộ đã chuẩn hóa tên
    │       ├── README.md
    │       ├── bao-cao\
    │       ├── prompt\
    │       ├── nguon\
    │       ├── chat\
    │       └── zoom\              # ⭐ Kiến thức Zoom: QUY-TRINH-XAY-KENH-A-Z.md + 4 buổi chi tiết
    │
    ├── pipelines\                 # 5 pipeline chạy được
    │   ├── everyday-history\
    │   ├── hoat-hinh-ai\
    │   ├── ton-giao\
    │   ├── wildlife\
    │   └── bible-explainer\
    ├── knowledge-hub\             # archive transcript / NotebookLM
    │
    ├── video\                     # 333 thư mục: 329 VIDEO-<sku>\<sku>.mp4 + 4 ZOOM-<slug>\<slug>.webm (~83.13 GiB / 89.26 GB) · KHÔNG vào git
    ├── inbox\                     # THẢ FILE MỚI VÀO ĐÂY (web bị chặn)
    ├── scripts\                   # validate · sync (sync_worker.js · kg_auto_sync.js · hot_memory_store.js) · intake · clean
    ├── _backup\                   # snapshot — web bị chặn · KHÔNG vào git
    ├── _audit\                    # raw/nhật ký kiểm chứng — web bị chặn · KHÔNG đưa lên UI
    ├── _private\                  # chỗ key local — web bị chặn
    ├── _archive\                  # rác & script lỗi thời đã dời khỏi web serve — KHÔNG xoá (NO_DELETE) · web bị chặn
    │   ├── 20260831-rac\_verify\  # 7 file scratch (chứa SKU pending VIDEO-3F8339)
    │   ├── 20260916-junk-cleanup\ # _frames (235 file/71M) · _internal (1285 file/125M, gồm dot_git_backup\ 108M) · _drafts (4) · _tmp_audio
    │   └── 20260918-obsolete-build-modules\ # 3 script sinh data SAI (xem README.md trong đó):
    │       # build-modules.js · build-modules-v2.js (chỉ 11 module, MẤT Zoom M11)
    │       # normalize_raw_kenh_mau.cjs (patch 1 lần cho 95 record → nay 156)
    ├── _internal\                 # dữ liệu nội bộ đang tồn tại ở gốc (xmdt.html · xmdt_showcase.html) · web bị chặn
    ├── _tmp-proof\                # bằng chứng/probe tạm đang tồn tại ở gốc · web bị chặn
    ├── .cache\                    # cache runtime (checkpoint, thumbnail, reload-state) · web bị chặn
    ├── logs\                      # log server/watchdog/reload · web bị chặn · KHÔNG vào git
    │   # (không còn ở gốc: _frames\ · _tmp_audio\ · _drafts\; _internal\ hiện đã tồn tại lại)
    ├── raw-kenh-goc\             # 158 ảnh raw canonical + metadata (156 record: 0 kênh chưa có ảnh chụp) · web bị CHẶN (403)
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
| Sửa CSS (Tailwind) | Sửa `css\input.css` hoặc `tailwind.config.js` → chạy `npm run build:css` → rồi `node scripts/check-ui-classes.js` |
| Xong | `node scripts/validate-project.js` (tự gồm check-ui-classes + guard inline-onclick) |

## Không được nằm ở gốc Y:\YTB

MD rời, prompt, excel, `_tmp_*`, `.bak`, pipeline zip, key.

## Web không serve (`SENSITIVE_SEGMENTS` trong `server.js`)

> Cơ chế cũ là mảng `BLOCKED`; **16/09/2026** nâng cấp thành `Set SENSITIVE_SEGMENTS`, so khớp **chữ thường** (chống bypass `/.GIT/config`, `/_PRIVATE/`) và mở rộng danh sách.

`SENSITIVE_SEGMENTS` hiện tại: `.git` · `node_modules` · `_private` · `_backup` · `_audit` · `_internal` · `_drafts` · `_archive` · `_verify` · `_frames` · `_tmp_audio` · `.cache` · `.venv-gpu` · `.zcode` · `logs` · `inbox` · `raw-kenh-goc` · `design-is-2026-08-22` · `raw kênh mẫu tìm kiếm` (historical only)

Ngoài ra chặn theo **tên file**: `.env*` · `*.db` / `*.sqlite*` kèm `-wal/-shm/-journal` · `mcp-keys*` (số dòng không ghi ở đây vì đổi theo mỗi lần sửa `server.js`; tìm bằng tên trong file).

> Đo lại 16/09/2026: `_private` · `_backup` · `_audit` · `_frames` · `_tmp_audio` · `_drafts` · `_internal` · `raw-kenh-goc` → **403**; `data-tabs/` · `assets/` · `index.html` → **200**.
