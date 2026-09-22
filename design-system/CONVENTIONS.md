# H2DEV — CONVENTIONS (Quy ước chuẩn toàn dự án)

> **Trạng thái:** `approved` — quy ước bắt buộc cho ALL dự án.
> **Căn cứ:** đo thực tế 2026-09-23 (`scripts/`: 34 kebab vs 32 snake · JSON: 102 snake + 255 camel + 163 key động · FE: 97% strict equality, 90.6% arrow).
> **Hiệu lực:** áp dụng cho MỌI thay đổi MỚI. Code cũ chuyển đổi dần theo lộ trình ở `MASTER-ARCHITECTURE.md` mục 7.
> **Nguyên tắc:** một việc — một cách làm. Cấm "mỗi chỗ một luồng".

---

## 1. NGUYÊN TẮC VÀNG

1. **Một việc — một chuẩn.** Không tồn tại 2 cách làm cùng 1 việc trong dự án.
2. **Đọc trước, viết sau.** Đọc `MASTER-ARCHITECTURE.md` → `CONVENTIONS.md` → `CHECK-PASS-PROTOCOL.md` → `SKILL.md` rồi mới code.
3. **Không hard-code số liệu.** Mọi con số trên UI phải tính động từ data.
4. **Sửa data phải qua script.** Cấm sửa tay `data/`, `data-tabs/`.
5. **Mọi thay đổi phải check-pass.** Xem `CHECK-PASS-PROTOCOL.md`.
6. **Dọn rác ngay.** Script test/one-shot xoá sau khi dùng (Ephemeral Cleanup).

---

## 2. QUY ƯỚC ĐẶT TÊN FILE

### 2.1. Bảng chuẩn

| Loại file | Chuẩn | Ví dụ ĐÚNG | Ví dụ SAI |
|---|---|---|---|
| **JS module (FE)** | `kebab-case.js` | `ui-core.js`, `player-main.js`, `sw-register.js` | `h2dev_core.js`, `uiCore.js` |
| **JS script (Node)** | `kebab-case.js` / `.cjs` | `sync-counts.js`, `build_master_db.js` ❌ | `sync_db_to_tabs.js` |
| **Python script** | `snake_case.py` | `transcribe_videos.py`, `mark_media_integrity.py` | `transcribeVideos.py` |
| **CSS** | `kebab-case.css` | `h2dev-tokens.css`, `music-player.css` | `musicPlayer.css` |
| **HTML** | `kebab-case.html` | `index.html`, `learn.html`, `player.html` | `Learn.html` |
| **JSON data** | `kebab-case.json` | `video_insights.json` ❌, `kenh-mau.json` ✅ | `videoInsights.json` |
| **PowerShell** | `kebab-case.ps1` | `check-server.ps1` | `CheckServer.ps1` |
| **Batch** | `kebab-case.cmd` | `start-lan.cmd` | `StartLAN.cmd` |
| **Markdown doc** | `SCREAMING-KEBAB.md` (hợp đồng) hoặc `kebab-case.md` | `MASTER-ARCHITECTURE.md`, `consistency-matrix.md` | `master_architecture.md` |
| **Thư mục** | `kebab-case` | `data-tabs/`, `design-system/` | `dataTabs/`, `data_tabs/` |

### 2.2. Quy tắc riêng cho từng ngôn ngữ

| Ngôn ngữ | Chuẩn | Lý do |
|---|---|---|
| **JavaScript** | `kebab-case` | Web convention, URL-friendly |
| **Python** | `snake_case` | PEP 8 — convention của Python |
| **PowerShell/CMD/VBS** | `kebab-case` | Tránh conflict Windows |

> **Ghi chú:** `h2dev-` là prefix hợp lệ cho file hệ thống H2DEV (`h2dev-tokens.css`, `h2dev-core.js`).

### 2.3. Tên file cấm

| Cấm | Lý do | Thay bằng |
|---|---|---|
| `_tmp-*`, `_tmp_*` ở root | Rác tạm | Đặt trong `%TEMP%` |
| `fix-*` lâu dài | Script 1 lần | `scripts/oneshot/` + xoá sau dùng |
| `test_*` lẫn source | Test ad-hoc | `scripts/audit/` |
| `*_v2`, `*-new`, `*-old`, `*-backup` | Version hoá bằng tên | Dùng git |
| Số trần: `125`, `20`, `980` | File rác | Xoá |
| Tiếng Việt có dấu trong tên file | Encoding | Kebab-case không dấu |

---

## 3. QUY ƯỚC ĐẶT TÊN BIẾN / HÀM

### 3.1. JavaScript

| Loại | Chuẩn | Ví dụ |
|---|---|---|
| Biến/hàm | `camelCase` | `renderTongQuan`, `state.tab` |
| Hằng số | `SCREAMING_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DB_PATH` |
| Class/Constructor | `PascalCase` | `UICore`, `MusicPlayer` |
| Private (quy ước) | `_camelCase` | `_allVideos`, `_cachedStatsText` |
| Boolean | `is/has/should/can` + camelCase | `isDrm`, `hasFooter`, `freeOnly` |
| Hàm xử lý event | `handle*` / `on*` | `handleScroll`, `onClick` |
| DOM element | `el*` hoặc tên rõ nghĩa | `els.tabbar`, `btt`, `nav` |

**Cấm:**
- `var` → dùng `const` (mặc định) hoặc `let` (khi cần gán lại)
- `==` / `!=` → dùng `===` / `!==` (hiện 97% đã đúng, cấm thêm mới)
- `function()` → dùng arrow `=>` (hiện 90.6% đã đúng)
- Global `window.X =` → dùng module-scoped state (hiện có 20 chỗ vi phạm, cấm thêm)

### 3.2. Python

| Loại | Chuẩn | Ví dụ |
|---|---|---|
| Biến/hàm | `snake_case` | `write_json`, `actual_topic` |
| Hằng số | `SCREAMING_SNAKE_CASE` | `MAX_RETRY`, `DB_PATH` |
| Class | `PascalCase` | `VideoAnalyzer` |

> **Cấm** dùng `camelCase` cho biến Python (trừ khi đọc JSON field camelCase — khi đó phải dùng `obj['camelCaseKey']`).

---

## 4. QUY ƯỚC JSON FIELD (QUAN TRỌNG NHẤT)

### 4.1. Chuẩn bắt buộc

| Quy tắc | Chuẩn | Ví dụ |
|---|---|---|
| Kiểu dấu | **`camelCase`** | `sizeMb`, `isDrm`, `publishedAt` |
| **CẤM** snake_case mới | — | ~~`size_mb`, `is_drm`~~ |
| **CẤM** SCREAMING cho field | — | ~~`SIZE_MB`~~ |
| **CẤM** đổi tên key động | — | SKU `VIDEO-xxx`, emoji nước |
| Tiếng Việt | **Giữ camelCase tiếng Việt** | `lyDo`, `ngachXanh`, `mauSach` ✅ |

> **Chốt của chủ dự án:** chỉ chuẩn hoá **kiểu dấu** (`size_mb` → `sizeMb`), **KHÔNG** đổi tiếng Việt sang tiếng Anh (`lyDo` giữ nguyên, không đổi thành `reason`).

### 4.2. Quy tắc viết tắt (ácronym)

| Viết ĐÚNG | Viết SAI | Lý do |
|---|---|---|
| `sizeMb` | `sizeMB` | Đơn vị đo chỉ viết hoa 1 chữ khi ghép |
| `durationSec` | `durationSEC` | idem |
| `isDrm` | `isDRM` | idem |
| `urlKey` | `URLKey` | idem |
| `yppSafe` | `YPPSafe` | idem |

> **Ngoại lệ giữ nguyên:** `safeForYPP` (đã tồn tại, khớp convention camelCase tiếng Anh).

### 4.3. Ba vùng CẤM ĐỔI (bất khả xâm phạm)

| Vùng cấm | File | Lý do |
|---|---|---|
| 144 key SKU | `video_insights.json` | Key động = SKU lookup (`insights[sku]`) |
| 7 constant `UU_TIEN_SAN_XUAT`… | `ngach-xanh.json` | Vừa key vừa value, `content.js:650-828` |
| Cột SQLite | `build_master_db.js` (DDL) | Phá DB 2.4MB |

### 4.4. Trường hợp đặc biệt

| Trường hợp | Quy tắc |
|---|---|
| Field trong `music_catalog.json` | Đã camelCase — chỉ đồng bộ `sizeMB` → `sizeMb` (cùng đơn vị) |
| Field trong `raw-kenh-mau.json` | Có 2 tầng: `technical.sizeBytes` (camel) + tầng khác snake → chuẩn hoá từ từ |
| Field mới | BẮT BUỘC camelCase, không cần chờ migrate |

---

## 5. QUY ƯỚC NGÔN NGỮ & CÔNG CỤ

### 5.1. Chọn ngôn ngữ theo loại việc

| Loại việc | Ngôn ngữ BẮT BUỘC | Lý do |
|---|---|---|
| **Backend HTTP** | **Node.js** (CommonJS) | Đang chạy `server.js`, không đổi |
| **Frontend** | **JavaScript** (browser) | Bắt buộc |
| **Tooling/dữ liệu (đọc/ghi JSON, SQLite)** | **Node.js** | Cùng hệ với data + validate |
| **Pipeline AI/ML** (transcribe, vision, ASR) | **Python** | Hệ sinh thái AI mạnh nhất |
| **Script tác chiến YouTube** | **Python** | Đang có `free_yt_engine.py` |
| **Windows service/watchdog** | **PowerShell + CMD + VBS** | Bắt buộc trên Windows |
| **Deploy VPS** | **Bash** (`.sh`) | Môi trường Linux |

> **Cấm:** viết script Node để làm việc Python đã làm tốt, và ngược lại. **Cấm** 2 script cùng chức năng khác ngôn ngữ.

### 5.2. Module system JS

| Loại file | Module system | Cú pháp |
|---|---|---|
| FE browser (`assets/app/**`) | ES module / global | `<script src>` + `window.H2X` hoặc `import` |
| BE + script Node (`.js`) | **CommonJS** | `require()` / `module.exports` |
| Script 1 lần (`.cjs`) | **CommonJS** | `require()` / `module.exports` |
| `.mjs` | **KHÔNG DÙNG** | — |

> **Hiện trạng:** `server.js` + 27 script dùng CommonJS. Không có `.mjs`. Giữ nguyên.

### 5.3. Script mới đặt ở đâu

| Vai trò | Thư mục |
|---|---|
| CI/validate (phải pass) | `scripts/ci/` |
| Build/generate artifact | `scripts/build/` |
| Đồng bộ 2 nguồn | `scripts/sync/` |
| One-shot migration (xoá sau dùng) | `scripts/oneshot/` |
| Audit/test/verify | `scripts/audit/` |
| Pipeline tác chiến | `scripts/pipeline/` |
| Thư viện dùng chung | `scripts/lib/` |
| Windows service | `scripts/windows/` |
| Deploy hook | `scripts/deploy/` |

> **Lưu ý:** hiện 67 file còn ở cấp 1 `scripts/` — sẽ tách dần (xem `MASTER-ARCHITECTURE.md` nợ #3).

---

## 6. QUY ƯỚC COMMENT

### 6.1. Ngôn ngữ comment

| Vị trí | Ngôn ngữ | Dấu |
|---|---|---|
| **FE JS** (`assets/app/**`) | Tiếng Việt | **CÓ DẤU** (UTF-8) |
| **BE JS** (`server.js`) | Tiếng Việt | **CÓ DẤU** |
| **Script Node** (`scripts/**/*.js`, `.cjs`) | Tiếng Việt | **KHÔNG DẤU** (ASCII) |
| **Script Python** (`scripts/**/*.py`) | Tiếng Việt | **KHÔNG DẤU** (ASCII) |
| **PowerShell/CMD/VBS** | Tiếng Anh | ASCII |
| **CSS** (`assets/*.css`) | Tiếng Việt | **CÓ DẤU** |

> **Lý do:** script CLI + Windows script phải ASCII-safe (theo rule workspace). FE/BE chạy UTF-8 nên dùng dấu cho dễ đọc.

### 6.2. Mẫu comment đầu file (bắt buộc)

```javascript
/**
 * H2DEV — <TEN FILE> (<mục đích 1 dòng>)
 * Tầng: <1-5> · Phụ thuộc: <file nào>
 * Chế độ: DARK-MODE ONLY
 *
 * GHI CHÚ: <cảnh báo quan trọng nếu có>
 */
```

### 6.3. Mẫu comment thay đổi (thay `TODO`/`FIXME`)

Dự án **không dùng** `TODO`/`FIXME`/`HACK` (hiện 0 — giữ nguyên).
Thay bằng comment ngày-fix rõ ràng:

```javascript
// PHASE 2 (2026-09-23): doi class .visible -> .is-visible dong bo 3 trang.
// Ly do: ban cu 38x38 (< 44px WCAG 2.5.8) va hover xanh duong lech brand.
```

---

## 7. QUY ƯỚC CSS / UI

> **Chi tiết đầy đủ tại `SKILL.md`.** Đây là tóm tắt bắt buộc.

### 7.1. Token

| Quy tắc | Nội dung |
|---|---|
| Nguồn token | `assets/h2dev-tokens.css` + `design-system/tokens.json` |
| **CẤM** hard-code màu | Dùng `var(--brand)`, `var(--bg)` |
| **CẤM** sửa token gốc | `--bg:#050505`, `--brand:#E2023A` là bất biến |
| Chỉ được THÊM token mới | hoặc gán `deprecated` |
| Theme | **Dark-mode only** — không light, không toggle |

### 7.2. Class component

| Loại | Class chuẩn | File |
|---|---|---|
| Button | `.h2-btn` + `.h2-btn-primary/ghost/danger` | `h2dev-primitives.css` |
| Card | `.h2-card` | idem |
| Heading | `.h2-h1` / `.h2-h2` / `.h2-h3` | idem |
| Badge | `.h2-badge` + `.h2-badge-green/red/amber/blue` | idem |
| Stat | `.h2-stat` + `.h2-stat-grid` | idem |
| Empty state | `.h2-empty` | idem |
| Input | `.h2-field` | idem |
| Shell | `.h2-shell-header/footer/backtotop/skip` | `h2dev-shell.css` |
| Icon | `.h2-icon` (CSS mask) | `h2dev-primitives.css` |

> **Cấm** tạo tổ hợp Tailwind tự chế cho cùng mục đích đã có class chuẩn.

### 7.3. Icon

| Quy tắc | Nội dung |
|---|---|
| **1 hệ icon duy nhất** | `assets/icons/**` (213 SVG Lucide, ISC license) |
| **CẤM emoji** trong UI | Thay bằng `.h2-icon` |
| Thang size | **4 mức: 14 / 16 / 20 / 24px** (token `--h2-icon-*`) |
| Màu | `currentColor` bắt buộc |
| Thêm icon mới | Copy file SVG vào `assets/icons/` — không sửa JS |

### 7.4. Typography

| Quy tắc | Nội dung |
|---|---|
| Thang font-size | **9 bậc** (token `--h2-font-*`) |
| **CẤM** `text-[15px]` arbitrary | Dùng token |
| Font-weight | Chỉ **400 / 500 / 600 / 700** — cấm 650/800/900 |
| Font mono | Chỉ cho mã định danh (SKU, ID) — **cấm** cho text tiếng Việt |

### 7.5. Responsive & motion

| Quy tắc | Nội dung |
|---|---|
| Breakpoint | Chỉ **640 / 1024 / 1280px** |
| Touch target | **≥ 44px** trên mobile (WCAG 2.5.8) |
| Motion | hover 120ms · state 200ms · reveal 300ms · translate ≤ 4px |
| Bắt buộc | Tôn trọng `prefers-reduced-motion` |

---

## 8. QUY ƯỚC URL / ROUTING

> **Chi tiết đầy đủ tại `URL-ROUTING-SPEC.md`.** Tóm tắt:

| Quy tắc | Nội dung |
|---|---|
| Chữ | lowercase, không dấu tiếng Việt |
| Từ ghép | dùng `-` (kebab) |
| Trailing slash | Cấm |
| Slug khớp tên UI | Tab "Tài liệu" → `/tai-lieu` |
| Filter/state | Dùng `?query`, **cấm `#`** cho state chính |
| Giá trị mặc định | Cấm lên URL |
| Encoding | Bắt buộc `encodeURIComponent` |
| Title động | Đổi theo route |
| Deep link | Mọi thứ nhấp được phải phản ánh vào `location` |

---

## 9. QUY ƯỚC GIT

### 9.1. Commit message

```
<loại>: <mô tả ngắn>

<chi tiết nếu cần>
```

| Loại | Dùng khi |
|---|---|
| `feat:` | Thêm tính năng |
| `fix:` | Sửa bug |
| `refactor:` | Tái cấu trúc không đổi hành vi |
| `docs:` | Tài liệu |
| `style:` | CSS/format |
| `data:` | Cập nhật data |
| `chore:` | Việc lặt vặt |

### 9.2. Quy tắc

| Quy tắc | Nội dung |
|---|---|
| Mỗi Phase = 1 commit | Để revert được từng Phase |
| **Cấm** commit media | `video/`, `assets/nhac-nen/`, thumbs, avatars |
| **Cấm** commit runtime | `*.db`, `admin-state.json`, `logs/`, `.cache/` |
| **Cấm** commit rác tạm | `_tmp-*`, `*.log`, `*.tmp` |
| Bắt buộc trước commit | `validate-project.js` + `sync-counts --check` PASS |

---

## 10. CHECKLIST TRƯỚC KHI VIẾT CODE

```
□ Đã đọc MASTER-ARCHITECTURE.md
□ Đã đọc CONVENTIONS.md (file này)
□ Đã đọc CHECK-PASS-PROTOCOL.md
□ Đã đọc SKILL.md (nếu làm UI)
□ Biết mình đang sửa TẦNG nào (1-5)
□ Không vi phạm quy tắc single-writer (nếu sửa data)
□ Không hard-code số liệu / màu / font
□ Không thêm emoji vào UI
□ Không thêm snake_case vào JSON mới
□ Biết phải chạy validate gì sau khi xong
```

---

## 11. LỊCH SỬ THAY ĐỔI

| Ngày | Thay đổi | Người |
|---|---|---|
| 2026-09-23 | Khởi tạo từ đo thực tế. Chốt: kebab-case file · camelCase JSON (giữ tiếng Việt) · 6 nhóm scripts · 4 mức icon · 9 bậc font · 3 breakpoint. | Em (Kiến trúc sư hệ thống) |
