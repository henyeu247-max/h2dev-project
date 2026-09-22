# H2DEV — CHECK-PASS PROTOCOL (Quy trình kiểm định bắt buộc)

> **Trạng thái:** `approved` — quy trình BẮT BUỘC cho mọi thay đổi.
> **Căn cứ:** rule workspace "Multi-Loop Verification tối thiểu 3 vòng" + audit thực tế 2026-09-23.
> **Nguyên tắc:** **KHÔNG báo cáo hoàn thành khi chưa check-pass 100%.** Không check qua loa rồi vội vã kết luận.

---

## 0. LUẬT SẮT

1. **Không có ngoại lệ.** Mọi thay đổi — dù 1 dòng — đều phải check-pass.
2. **Kiểm tra 100% đối tượng**, không lấy mẫu tượng trưng ("Check N/N" rule).
3. **Ba vòng bắt buộc:** Đĩa & Asset → Code & Schema → Dual-Environment E2E.
4. **Bằng chứng phải đo được** — không suy đoán, không "chắc là chạy được".
5. **Thấy FAIL phải sửa rồi check LẠI từ đầu**, không bỏ qua.
6. **Dọn rác tạm ngay** sau khi check xong.

---

## 1. BA VÒNG KIỂM ĐỊNH (BẮT BUỘC)

```
┌─────────────────────────────────────────────────────────────────┐
│ VÒNG 1 — ĐĨA CỨNG & ASSET                                       │
│ File tồn tại? Kích thước > 0? ffprobe OK? Tổng khớp manifest?   │
├─────────────────────────────────────────────────────────────────┤
│ VÒNG 2 — CODE, SCHEMA & INVARIANT                               │
│ Syntax OK? Schema khớp? grep invariant = 0? Validate PASS?      │
├─────────────────────────────────────────────────────────────────┤
│ VÒNG 3 — DUAL-ENVIRONMENT E2E                                   │
│ Local HTTP 200? VPS HTTP 200? Browser render? 0 JS error?       │
└─────────────────────────────────────────────────────────────────┘
```

> **Chỉ được báo cáo hoàn thành khi CẢ 3 VÒNG đạt 100%.**

---

## 2. VÒNG 1 — ĐĨA CỨNG & ASSET

### 2.1. Kiểm tra bắt buộc

| # | Kiểm tra | Lệnh / Cách | Kỳ vọng |
|---|---|---|---|
| 1.1 | File media tồn tại | `Test-Path` từng file | 140/140 |
| 1.2 | Không file 0 byte | `Get-ChildItem \| Where Length -eq 0` | 0 file |
| 1.3 | ffprobe duration > 0 | `D:\Linly-Dubbing\bin\ffprobe.exe` | 100% có duration |
| 1.4 | Bitrate chuẩn | ffprobe stream | MP3 192kbps / MP4 H.264 |
| 1.5 | Tổng dung lượng khớp | so `counts-manifest.json` | `mediaBytes` khớp |
| 1.6 | Thumbnail/avatar đủ | đếm file | 202 thumb · 251 avatar |
| 1.7 | Rác tạm = 0 | `Get-ChildItem -Filter '_tmp*'` | 0 file |

### 2.2. Lệnh mẫu

```powershell
# Kiem tra file 0 byte toan bo media
Get-ChildItem -Path video,assets\nhac-nen,assets\thumbs,assets\avatars -Recurse -File |
  Where-Object { $_.Length -eq 0 } | Measure-Object | Select-Object -Expand Count

# Kiem tra ffprobe
& 'D:\Linly-Dubbing\bin\ffprobe.exe' -v error -show_entries format=duration `
  -of default=noprint_wrappers=1:nokey=1 'video\VIDEO-DD983D\VIDEO-DD983D.mp4'
```

---

## 3. VÒNG 2 — CODE, SCHEMA & INVARIANT

### 3.1. Kiểm tra bắt buộc

| # | Kiểm tra | Lệnh | Kỳ vọng |
|---|---|---|---|
| 2.1 | JS syntax | `node --check <file>` | exit 0 mọi file |
| 2.2 | Python syntax | `py -3 -m py_compile <file>` | exit 0 |
| 2.3 | JSON hợp lệ | `node -e "JSON.parse(...)"` | 24/24 parse OK |
| 2.4 | **Validator chính** | `node scripts/validate-project.js` | **PASS** exit 0 |
| 2.5 | **Đồng bộ số liệu** | `node scripts/sync-counts.js --check` | **OK** 0 diff |
| 2.6 | Guard XSS inline | `node scripts/guard-no-inline-onclick.js` | PASS |
| 2.7 | Guard CSS class | `node scripts/check-ui-classes.js` | OK |
| 2.8 | Grep invariant | grep theo mục tiêu sửa | = 0 vi phạm |
| 2.9 | Build DB (nếu đổi data) | `node scripts/build_master_db.js` | build OK, số record không đổi |
| 2.10 | Rác tạm | `Get-ChildItem -Filter '_tmp*'` | 0 file |

### 3.2. Bảng grep invariant theo loại thay đổi

| Loại thay đổi | Grep phải = 0 |
|---|---|
| Thay emoji → icon | `grep -c emoji` trong UI |
| Chuẩn hoá font | `grep 'font-size: *[0-9.]+px'` ngoài token |
| Xoá weight lỗi | `grep 'font-weight: *(650\|800\|900)'` |
| Chuẩn hoá naming JSON | `grep '_\w+":' data/**/*.json` (snake trong JSON) |
| Xoá hard-code | `grep 'font-size:.*px'` + grep số trần trên UI |
| Sửa version cache | grep `?v=` đồng nhất |
| Sửa breakpoint | `grep '@media.*(720px\|1023px)'` |
| Xoá alert | `grep '(?<![\w.])alert\s*\('` |

### 3.3. Quy tắc bắt buộc

- Chạy **4 script chuẩn** (2.4 → 2.7) sau MỌI thay đổi.
- Nếu 1 script FAIL → **dừng**, sửa, chạy lại từ 2.1.
- Không được "tạm bỏ qua" 1 script vì "không liên quan".

---

## 4. VÒNG 3 — DUAL-ENVIRONMENT E2E

### 4.1. Môi trường

| Môi trường | URL | Cách chạy |
|---|---|---|
| **Local** | `http://127.0.0.1:8899` | Windows Service `H2DEV_Service` |
| **Production** | `https://h2dev-learn.tonymmo.com` | VPS `103.249.201.164` + Cloudflare |

### 4.2. Kiểm tra bắt buộc

| # | Kiểm tra | Kỳ vọng |
|---|---|---|
| 3.1 | Tất cả route trong `route-manifest.json` | HTTP 200 (hoặc 301 đúng) |
| 3.2 | SKU rác | HTTP 404 |
| 3.3 | Asset tĩnh (CSS/JS/font) | HTTP 200 |
| 3.4 | Media (mp4/mp3) | HTTP 200 + hỗ trợ Range 206 |
| 3.5 | Browser render | 0 JS error, 0 request ≥ 400 |
| 3.6 | Responsive 3 viewport | 375 / 834 / 1440px không overflow |
| 3.7 | Tìm kiếm mã định danh | `MUSIC-041` / `041` ra kết quả |
| 3.8 | Cloudflare cache | Có `?v=` khi cần bust |

### 4.3. Cloudflare cache-busting (bẫy đã biết)

> **Cảnh báo:** Cloudflare cache 404 tới **4 giờ** (`max-age=14400`). Sau khi upload file mới, PHẢI gắn `?v=YYYYMMDD-vNN` vào URL.

```powershell
# Kiem tra 2 dau
Invoke-WebRequest 'http://127.0.0.1:8899/tatca' -UseBasicParsing | Select StatusCode
Invoke-WebRequest 'https://h2dev-learn.tonymmo.com/tatca' -UseBasicParsing | Select StatusCode
```

### 4.4. Browser E2E mẫu (Playwright)

```javascript
// Script test tam - PHAI xoa sau khi dung
const { chromium } = require('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('response', r => { if (r.status() >= 400) errs.push('HTTP' + r.status()); });
await p.goto('http://127.0.0.1:8899/tatca', { waitUntil: 'networkidle' });
// ... assertions ...
console.log(errs.length === 0 ? 'PASS' : 'FAIL: ' + errs[0]);
```

---

## 5. QUY TRÌNH 5 BƯỚC ĐỒNG BỘ LOCAL → PRODUCTION VPS

> **Áp dụng khi thay đổi cần lên production.** (Theo `AGENTS.md` mục 4)

| Bước | Việc | Verify |
|---|---|---|
| **1** | Tải & kiểm định kỹ thuật | ffprobe: duration > 0, size > 0, bitrate chuẩn |
| **2** | Đồng bộ cấu trúc dữ liệu SSoT | Cập nhật catalog + `counts-manifest.json` |
| **3** | Đồng bộ logic UI | Search index có `t.id`; badge ID; đếm động; version `?v=` |
| **4** | Đồng bộ hạ tầng kép | `scp` media → VPS; `git push origin main` + `git push vps main` |
| **5** | Kiểm định E2E hai đầu | HTTP 200 cả Local + Production |

---

## 6. CHECKLIST THEO LOẠI THAY ĐỔI

### 6.1. Sửa UI / CSS

```
□ node --check <file JS>
□ grep emoji = 0 (nếu Phase icon)
□ grep font-size lẻ = 0 (nếu chuẩn hoá font)
□ node scripts/check-ui-classes.js  → OK
□ node scripts/guard-no-inline-onclick.js → PASS
□ Browser 3 viewport: 0 JS error, 0 overflow
□ Đo touch target ≥ 44px trên 375px
□ Chụp màn hình so sánh trước/sau (nếu cần)
```

### 6.2. Sửa data / JSON

```
□ Backup data/ + data-tabs/ + master.db
□ Dừng H2DEV_Service (nếu atomic migration)
□ node -e JSON.parse từng file → 24/24 OK
□ node scripts/validate-project.js → PASS
□ node scripts/sync-counts.js --check → OK
□ node scripts/build_master_db.js → build OK
□ Đếm record trước/sau = nhau
□ Browser: mở tab dùng data đó → render đúng
```

### 6.3. Sửa route / server

```
□ node --check server.js
□ curl từng route → 200 / 301 đúng
□ curl SKU rác → 404
□ curl asset → 200
□ curl media → 200 + Range 206
□ Browser: title động, breadcrumb, tab active đúng
□ Back/Forward khôi phục đủ state
□ Kiểm production VPS
```

### 6.4. Sửa script / pipeline

```
□ node --check / py -3 -m py_compile
□ Chạy thử với --dry-run (nếu có)
□ Backup output trước khi ghi
□ Chạy thật → verify output
□ Validate chéo với validate-project.js
□ Xoá script nếu là one-shot
```

---

## 7. BẰNG CHỨNG NGHIỆM THU

Mọi báo cáo hoàn thành PHẢI có **số liệu thực đo**:

| Loại | Mẫu |
|---|---|
| Syntax | `node --check main.js → exit=0` |
| Validate | `validate-project.js → PASS · Videos: 140; channels: 165` |
| Sync | `sync-counts --check → OK — đồng bộ 100%` |
| HTTP | `GET /tatca → 200 · GET /lotrin/rac → 404` |
| Browser | `PASS=39 FAIL=0 · JS errors=0` |
| Grep | `emoji trong UI = 0 · font-size lẻ = 0` |

**Cấm** báo cáo kiểu: "chắc là chạy được", "đã sửa xong", "nhìn có vẻ ổn".

---

## 8. XỬ LÝ KHI FAIL

```
Phát hiện FAIL
   │
   ├─> KHÔNG được bỏ qua, KHÔNG được "tạm chấp nhận"
   │
   ├─> Xác định nguyên nhân gốc (root cause) — không sửa triệu chứng
   │
   ├─> Sửa
   │
   ├─> Chạy LẠI từ đầu Vòng 1 (không chỉ chạy lại test vừa fail)
   │
   └─> Nếu FAIL là do TEST SAI (không phải code sai) → ghi rõ "test sai", sửa test
```

> **Kinh nghiệm thực tế (Phase 1):** có 1 FAIL nhưng là do selector test sai, không phải code sai. **Phải xác minh** trước khi kết luận.

---

## 9. EPHEMERAL CLEANUP (DỌN RÁC BẮT BUỘC)

Sau khi check-pass xong, **XOÁ NGAY**:

| Loại | Ví dụ | Bắt buộc |
|---|---|---|
| Script test ad-hoc | `_tmp-verify-*.cjs`, `_tmp-dbg-*.cjs` | ✅ Xoá |
| File dump trung gian | `*.log`, `*.tmp`, `*.bak` | ✅ Xoá |
| Script vá 1 lần | `fix-*`, `restore_*` | ✅ Xoá sau dùng |
| Ảnh chụp test | `_tmp-*.png` | ✅ Xoá |
| Thư mục temp | `%TEMP%\h2dev-*` | ✅ Xoá |

**Verify sau khi dọn:**
```powershell
Get-ChildItem -Filter '_tmp*' -Force   # phải = 0
git status --short                      # không còn mục '??'
```

---

## 10. BẢNG TÓM TẮT (in ra dán tường)

| Vòng | Thời điểm | Bắt buộc | Kết quả |
|---|---|---|---|
| **1** | Sau khi sửa asset/media | ffprobe + đếm file | 140/140, 0 file 0B |
| **2** | Sau khi sửa code | 4 script validate | 100% PASS |
| **3** | Sau khi sửa route/UI | Local + VPS HTTP | 200 hết, 0 JS error |
| **Dọn** | Sau khi pass | Xoá rác tạm | 0 mục `??` |

---

## 11. LỊCH SỬ THAY ĐỔI

| Ngày | Thay đổi | Người |
|---|---|---|
| 2026-09-23 | Khởi tạo. Định nghĩa 3 vòng bắt buộc + checklist theo loại thay đổi + bảng bằng chứng nghiệm thu. | Em (Kiến trúc sư hệ thống) |
