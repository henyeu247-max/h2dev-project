---
name: h2dev-project-audit
description: Audit toàn diện dự án H2DEV (H2DEV-Project) bằng evidence thật — validate, JSON integrity, docs đếm, server probe, broken refs, rule drift. Dùng khi user yêu cầu "check dự án", "audit", "xem có lỗi gì", hoặc trước/sau mỗi đợt sửa lớn.
agent_created: true
---

# H2DEV Project Audit

Audit bằng **số liệu thật**, không đoán. Mọi kết luận ghi kèm lệnh + output. Đường dẫn tuyệt đối của dự án nằm tại [`references/project-paths.md`](references/project-paths.md).

## Boot order (đọc trước khi audit)

1. `H2DEV-Project/AGENTS.md` (SSoT)
2. `knowledge-hub/docs/RULE-LAM-VIEC.md`
3. `knowledge-hub/docs/SOUL.md`
4. `knowledge-hub/docs/HUONG-DAN-MCP-CHUAN.md`
5. `H2DEV-Project/CHANGELOG.md`

## Checklist audit (chạy tuần tự)

### 1. Validate tổng
```bash
cd "<H2DEV_PROJECT>" && node scripts/validate-project.js
```
Kỳ vọng: exit 0. **Số kỳ vọng KHÔNG ghi trong skill** (đổi theo data) — lấy từ `data/counts-manifest.json`, và chạy `node scripts/sync-counts.js --check` (kỳ vọng exit 0) để chắc docs khớp manifest.

### 2. JSON integrity (9 file data-tabs)
```bash
for f in data-tabs/*.json; do node -e "const d=require('./$f'); console.log('$f', Array.isArray(d)?d.length:Object.keys(d).length)"; done
```
Đúng 9 file JSON. Đối chiếu số từng file với `counts-manifest.json` (videos · kenh-mau · tai-lieu-full · nguon-reup · kich-ban · raw-kenh-mau); `ngach-xanh`/`chien-luoc`/`dong-bo-ngoai` là object nhiều khoá, không so với manifest.

### 3. Docs completeness
```bash
ls docs/VIDEO-*/README.md | wc -l
ls docs/VIDEO-*/description.html | wc -l
```
So với `docsVideoDirs` trong manifest. Thư mục nào không có `description.html` thì phải có marker `DESCRIPTION_EMPTY.md` — **đúng thiết kế, KHÔNG phải lỗi**. Link tải trong `data-tabs/*.json` phải trỏ tới file có thật ở `assets/docs/` (dùng `scripts/find-404.js`).

### 4. Server probe
```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 http://127.0.0.1:8899/
curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 http://192.168.50.216:8899/
```
`000` hoặc ECONNREFUSED = server chết. Khởi động: `node server.js` (background).

### 5. Broken refs
```bash
node scripts/find-404.js
```
`scripts/check-broken-refs.js` không còn tồn tại; `find-404.js` thay thế (cần server chạy). Lỗi UI đo bằng trình duyệt thật: `scripts/deep-ui-acceptance.js`, `scripts/playwright-g2-acceptance.js` (nội dung do JS render không đo bằng curl).

### 6. Rule drift
- Gốc `<YTB_ROOT>` chỉ được có `README.md` (+ thư mục). MD rời ở gốc = vi phạm TREE.md.
- `AGENTS.md` nguồn MCP phải là `.agents/mcp_config.json`. `<YTB_ROOT>/.mcp.json` = legacy, không tồn tại.
- `kenh-mau.json`: trường `ngay_do` có trên phần lớn kênh (xem `channelsWithNgayDo` trong manifest); kênh thiếu ngày đo là tồn đọng đã biết, không phải lỗi mới.

### 7. Kiến trúc 3 Track & 3 CSDL SQLite
Dự án vận hành 3 nhánh bài giảng độc lập (H2DEV + Huân Academy + DGMD; số lượng SKU lấy động từ `data/counts-manifest.json` và đối chiếu qua `node scripts/sync-counts.js --check`) và 3 CSDL SQLite WAL:
- `data/h2dev_master.db`: 10 bảng nghiệp vụ + `search_fts` FTS5 (kiểm tra `PRAGMA integrity_check; PRAGMA foreign_key_check;` và đối chiếu số dòng với `node scripts/sync-counts.js --check`).
- `data/h2dev_knowledge_graph.db`: Đồ thị 2 tầng khớp 1:1 với `data/knowledge_graph.json`.
- `data/intelligence.db`: Dữ liệu kênh breakout/outlier.

### 8. Kiểm định Grounding 3 Track & Gate 10 Cổng A–Z (`H2DEV-SCAR-033`)
```bash
py -3 scripts/check-grounding.py --track all
py -3 scripts/check-grounding-md.py --live
node scripts/check-ui-classes.js
node scripts/verify_sku_az.js <SKU>
```
Kỳ vọng: `TOTAL ungrounded: 0` trên toàn bộ video theo `counts-manifest.json` (`totalSystemVideos`), `0` cảnh báo class CSS, và `ALL 10 GATES PASS` cho từng SKU kiểm mẫu.

## Lỗi đã biết / bẫy

| Bẫy | Thực tế |
|---|---|
| Trạng thái Watchdog & AutoStart | Cả 4 tasks (`H2DEV-Auto-Ingest-Watcher`, `H2DEV-Server-AutoStart`, `H2DEV-Video-Faststart-Guard`, `H2DEV-Watchdog`) đã đăng ký State `Ready`. Verify: `Get-ScheduledTask -TaskName "*H2DEV*"`. |
| Đăng ký scheduled task | `Register-ScheduledTask` từ sandbox trả OK nhưng task **không tồn tại**. Cần PowerShell quyền Admin chạy `install-h2dev-watchdog.ps1`. |

## Mẹo môi trường

- **PowerShell tool không trả stdout** → ghi ra file (`Out-File`) rồi dùng Read.
- **Ổ mạng `<NAS_SHARE>` (`Hermes - Agent`) không mount** trong sandbox — không đọc được.
- `wmic`, `netsh`, `schtasks` bị chặn bởi security policy.
- **LOLBin guard**: lệnh PowerShell có chữ `powershell` hoặc `wscript` trong pattern/`-Name` sẽ bị chặn. Dùng `Get-Process -Name node` hoặc filter chỉ `node`.
- **Background `node server.js` sẽ báo failed khi phiên agent kết thúc** — shell wrapper bị terminate, nhưng process node sống sót dưới dạng orphan. Đây là hiện tượng harness, **không phải lỗi dự án**. Kiểm tra thực tế bằng curl, đừng tin status.

## Bẫy đếm process (đã mắc 28/08)

`CommandLine -match "server\.js"` sẽ vớ cả `9router\app\custom-server.js` (app khác trên máy) → tưởng có nhiều server.
**Cách đúng:** đọc full command line + xác định ai giữ port:
```powershell
Get-NetTCPConnection -LocalPort 8899 -State Listen | Select OwningProcess
```

## Rule cứng khi sửa

- Backup vào `_backup\<YYYYMMDD>\` **trước** khi sửa.
- NO_DELETE khi chưa được phép.
- Xong → cập nhật `CHANGELOG.md` bản mới + chạy lại validate.
- Nhận định chỉ: CÓ / KHÔNG / KHÔNG-VERIFY-ĐƯỢC.
