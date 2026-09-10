# KẾ HOẠCH SỬA CHỮA TOÀN DIỆN — H2DEV-Project
> Ngày lập: **2026-08-27** · Nguồn: kiểm toán đọc FULL sau phiên rà soát toàn dự án.
> Mỗi bước có: **Hiện trạng (path:line) → Nguyên nhân → Sửa → Verify → Rollback**.
> Quy ước: **[ADMIN]** cần PowerShell Running as Administrator · **[RESTART]** cần restart server 8899 · **[ANH DUYỆT]** em không tự làm.

---

## BẢNG TỔNG HỢP MỨC ĐỘ

| Mã | Việc | Ưu tiên | Rủi ro nếu để | Cờ |
|---|---|---|---|---|
| B1 | Credential lộ qua HTTP (2 file) | **P0** | Mất key vidIQ/Tavily/Firecrawl/Context.dev + 194 tool MCP Pool | [RESTART] |
| B2 | Nút "Xem video ngách" trả 0 kết quả | **P0** | UI cross-tab chết hoàn toàn | — |
| B3 | `modules.json` 129 ≠ `videos.json` 130 | **P1** | Player mất nút Bài trước/sau, "Bài 00/129" | — |
| B4 | `RULE-LAM-VIEC.md` §5.2/§5.3 là bảng không nguồn; §4.6 RPM stale | **P1** | Agent phiên sau lấy số ma làm tiêu chí chọn ngách | — |
| B5 | 4 script ghi đè data sống không backup | **P1** | Mất fix tay 17–18/08 không cứu được | — |
| B6 | Script heuristic đè 4 file SSoT | **P1** | Boilerplate hoá nội dung đã verify | — |
| B7 | `H2DEV-Watchdog` không tồn tại (dù CHANGELOG ghi đã cài) | **P2** | Đúng cái lỗi gây zombie 24/08 lặp lại | [ADMIN] |
| B8 | `tailwind.css` cũ 10 ngày + checker kiểm CSS mồ côi → báo ALL OK giả | **P2** | UI thật thiếu style mà không ai biết | — |
| B9 | Số đếm hardcode trôi (129, "70/70", 11 module) | **P2** | Web hiển thị sai data của chính nó | — |
| B10 | Player không PUT tiến độ + `esc()` thiếu `'` | **P2** | Mất tiến độ xem khi reload | — |
| B11 | Rác trùng ~2 MB + 12 file giả zip | **P3** | Ồn ào khi git init, nhiễu audit | [ANH DUYỆT] |
| B12 | Nợ data từ 20/08 (dead kênh, RPM ngách #1) | **P3** | Kết luận ngách thiếu căn cứ | [ANH DUYỆT] |

Ước lượng tổng: **P0+P1 ≈ 1,5–2 giờ** (nếu em làm, có verify từng bước). P2 ≈ 1 giờ. P3 chờ anh duyệt danh sách.

**Thứ tự phụ thuộc bắt buộc:** B0 → B1 → B2 → B3 → B4 → B5 → B6 → B8 → B9 → B10 → B7 → (B11, B12 sau).

---

## PHẦN 0 — CHUẨN BỊ (bắt buộc, làm trước mọi sửa đổi)

### B0.1 — Snapshot toàn bộ data sống
```powershell
cd D:\YTB\H2DEV-Project
node scripts/backup-data.js        # → _backup\<timestamp>\ (data-tabs + data)
```
**Verify:** `ls _backup/ | tail -1` phải là thư mục timestamp mới, chứa 8 file `data-tabs` + `data`.

### B0.2 — Snapshot tay các file không nằm trong backup-data.js
`backup-data.js` chỉ gom `data-tabs/` + `data/`. Các file sắp sửa dưới đây **không được nó phủ**:
```powershell
$d = "_backup\20260827-plan"; mkdir $d -Force
copy server.js $d\; copy index.html $d\; copy player.html $d\; copy learn.html $d\
copy tailwind.config.js $d\; copy assets\tailwind.css $d\; copy assets\h2dev-core.js $d\
copy knowledge-hub\docs\*.md $d\; copy RULE-LAM-VIEC_placeholder $d\ 2>$null
copy knowledge-hub\docs\RULE-LAM-VIEC.md $d\
```
**Verify:** đếm 9 file trong `_backup\20260827-plan\`.

### B0.3 — `git init` [ANH DUYỆT]
Hiện repo **không có git** — mọi sửa data chỉ dựa `_backup/` cơ học (14 snapshot, không diff được).
```powershell
cd D:\YTB\H2DEV-Project
git init
@'
video/
_backup/
_private/
inbox/
_verify/
node_modules/
assets/thumbs/
assets/avatars/
.env
.env.*
!.env.example
*.log
Thumbs.db
'@ | Out-File -Encoding ascii .gitignore
git add -A; git commit -m "baseline 2026-08-27 (pre-remediation)"
```
**Rủi ro:** lần commit đầu sẽ add cả `assets/docs/` (2 MB) và 130 thư mục `docs/` — chấp nhận được. **Tuyệt đối không** `git push` lên host công khai (kho có tài sản nội bộ + log transcript).

---

## PHẦN 1 — P0 · CREDENTIAL LỘ QUA HTTP

### Hiện trạng (đã verify bằng chứng)
| File | Vấn đề |
|---|---|
| `docs/NOI-BO/chat/phien-1-khoi-dong-du-an.md` | **10 chuỗi dạng key thật** (Tavily / Firecrawl / Context.dev) — em đếm pattern, không in giá trị |
| `knowledge-hub/docs/HUONG-DAN-MCP-CHUAN.md:13,51-52,113` | Bearer key của MCP Pool VPS bằng plaintext |

`server.js:150` chặn `_backup, _private, node_modules, inbox, _verify, .git, _archive` + `.env*` + `mcp-keys*` — **`docs/` và `knowledge-hub/` không nằm trong danh sách**. Server bind `0.0.0.0` (`server.js:8`), CORS `Access-Control-Allow-Origin: *` (`server.js:67-70`), không có auth. → bất kỳ thiết bị nào chạm được `192.168.50.216:8899` hoặc `100.83.146.28:8899` đọc được 2 file đó.

### B1.1 — Xoay vòng key [ANH DUYỆT / ANH LÀM]
Xoay trước, sửa file sau — ngược thứ tự là vô nghĩa vì key đã nằm ngoài tầm kiểm soát.
- Tavily, Firecrawl, Context.dev → dashboard nhà cung cấp, thu hồi + cấp mới.
- MCP Pool VPS (`mcp-pool.tonymmo.com`) → đổi key trong `/opt/mcp-pool/.env` + reload Nginx/PM2, rồi cập nhật `.agents/mcp_config.json`.
- **Ghi chú của em:** `D:\YTB\MCP_POOL_HUONG_DAN.md:200` chính tài liệu đã tự cảnh báo "key mặc định không nên giữ lâu".

### B1.2 — Chặn segment `chat` trong server [RESTART]
`server.js:150`, thêm 1 phần tử:
```js
  const BLOCKED = new Set(['_backup', '_private', 'node_modules', 'inbox', '_verify', '.git', '_archive', 'chat']);
```
**Tác dụng phụ đã đo trước:** `tai-lieu-full.json:637` có 1 card trỏ `docs/NOI-BO/chat/README.md` → link "MD gốc" của card đó sẽ 403. Xử lý ở B1.4.

**Verify:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8899/docs/NOI-BO/chat/README.md   # mong đợi 403
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8899/index.html                    # mong đợi 200
```

### B1.3 — Redact key tại chỗ (2 file)
- `phien-1-khoi-dong-du-an.md`: thay 10 chuỗi key bằng `[REDACTED-2026-08-27 — key đã xoay, xem _private/mcp-keys-h2dev.md]`, giữ nguyên phần hội thoại.
- `HUONG-DAN-MCP-CHUAN.md:13,51-52,113`: thay giá trị key bằng `<xem _private/mcp-keys-h2dev.md>`.
- Tạo `_private/mcp-keys-h2dev.md` chứa key mới — **đã chặn web 2 lớp**: segment `_private` (`server.js:150`) và regex `mcp-keys` (`server.js:153`).

**Verify (không in giá trị, chỉ đếm):**
```bash
grep -rc "mcp-pool-2026-secure-key" knowledge-hub/ docs/ data-tabs/ index.html 2>/dev/null | grep -v ':0' || echo "SẠCH"
```
**Rollback:** `_backup\20260827-plan\` (B0.2).

### B1.4 — Cứu link card chat/README
`copy docs\NOI-BO\chat\README.md docs\NOI-BO\chat-index.md` rồi sửa `tai-lieu-full.json:637` → `"file": "docs/NOI-BO/chat-index.md"`. (Backup data đã có ở B0.1.)

---

## PHẦN 2 — P0 · UI LỌC NGÁCH HỎNG HOÀN TOÀN

### Hiện trạng (em đo trực tiếp, không qua agent)
- `NICHE_MAP` (`index.html:83-128`) = **46 cặp**, giá trị thuộc 9 nhóm: `"Triết lý / Tâm linh"`, `"Lịch sử / Quân sự"`, `"Sức khỏe / Lão hóa"`…
- `videos.json` có **24 giá trị `contentNiche` distinct** thuộc bộ từ vựng khác hẳn: `"Drama Gia Đình & Xã Hội Nhật Bản"`, `"Triết Lý & Phật Pháp Việt Nam"`…
- **Overlap = 0** (đo bằng node trên chính 2 file).
- Bộ lọc ở `index.html:508`: `v.contentNiche !== state.nicheFilter && v.niche !== state.nicheFilter` → không bao giờ khớp khi `nicheFilter` là **tên nhóm**.
- Chuỗi hỏng: 3 nút `data-open-niche="${esc(vKey)}"` tại `index.html:1007`, `:1144`, `:1237` → handler `:173` gán vào `nicheFilter` → `openTab('video', …)` (`:148`) → 0 card.
- **Dropdown "Mọi ngách" ở `:552` vẫn chạy đúng** (nó lấy value từ chính `videos.json`) — chỉ 3 nút cross-tab hỏng. Đừng sửa nhầm dropdown.

### B2.1 — Hàm khớp duy nhất, xoá 3 bản định nghĩa trùng
Hiện có **3 định nghĩa `videoNicheKey` lặp lại** ở `index.html:971`, `:1107`, `:1205`. Thay bằng 1 hàm mức module, đặt cạnh `esc()` (khoảng `:182`):
```js
function nicheMatches(v, filter) {
  if (!filter) return true;
  const vals = [v.contentNiche, v.niche].filter(Boolean);
  if (vals.includes(filter)) return true;                       // dropdown: tên gốc
  return vals.some(x => NICHE_MAP[x] === filter);                // nút cross-tab: tên nhóm
}
```
`renderVideo` `:508` đổi thành:
```js
} else if (state.nicheFilter && !nicheMatches(v, state.nicheFilter)) return false;
```

### B2.2 — 3 chỗ render nút
Mỗi chỗ xoá `videoNicheKey` cục bộ và tính `vKey` từ nhóm **có thật**:
```js
const videoGroups = new Set(
  videos.flatMap(v => [v.contentNiche, v.niche].filter(Boolean).map(x => NICHE_MAP[x] || x))
);
const vKey = videoGroups.has(g.niche) ? g.niche : '';   // group không có video → ẩn nút
```
- `renderKichBan` (~`:971`) và `renderNguonReup` (~`:1107`) đã load `videos.json` sẵn (`:866`, `:1038`) → chỉ cần đổi.
- `renderKenh` (~`:1205`) **chỉ load `kenh-mau.json`** (`:1171`) → phải thêm `const rawVideos = await loadJSON('data-tabs/videos.json');` rồi dùng `videos` đã chuẩn hoá.
- `nicheKeyFor()` (`:130`) hiện là no-op → xoá hoặc gộp vào `nicheMatches`.

### B2.3 — Verify bằng data (không cần mở web)
```bash
node -e "
const fs=require('fs');const h=fs.readFileSync('index.html','utf8');
const v=require('./data-tabs/videos.json');
const pairs=[...h.match(/\"([^\"]+)\":\s*\"([^\"]+)\"/g)];
const groups=new Set(v.flatMap(x=>[x.contentNiche,x.niche].filter(Boolean)));
console.log('video groups:',groups.size);
const M={}; [...h.matchAll(/\"([^\"]+)\":\s*\"([^\"]+)\"/g)].forEach(s=>M[s[1]]=s[2]);
const mapped=new Set(Object.values(M));
console.log('nhóm có ít nhất 1 video:',[...mapped].filter(g=>[...groups].some(x=>M[x]===g||x===g)).length,'/',mapped.size);
"
```
Trước: `0/9`. **Sau khi sửa, mở web thật**: vào Tab Kịch bản / Nguồn reup / Kênh mẫu → bấm "Xem video ngách →" → Tab Video phải ra **> 0 card** cho mỗi nhóm có video.

---

## PHẦN 3 — P1 · `modules.json` 129 ≠ `videos.json` 130

### Hiện trạng
- Em đo: `modules.json` có **129 SKU**, `videos.json` **130**. SKU mồ côi duy nhất: **`VIDEO-61ad94`** (`totalLessons: 129`).
- Hệ quả: `player.html:280` `routePos = -1` → nút Bài trước/Bài tiếp disabled (`:283-284`, `:292`, `:296`), nhãn in **"Bài 00/129"**.
- **Vì sao chạy lại script không tự sinh 130:** `build-modules-v2.js:63` lặp `siteMod.items` (129 bản ghi từ `h2dev-raw.json` — em đo: 11 module / **129 items**), `:126` đặt `totalLessons = catalog.length` (130) → file ra sẽ tự mâu thuẫn 130 vs 129.

### B3.1 — Bổ sung bản ghi vào `data/h2dev-raw.json` (module M06)
Lấy số liệu thật đã ghi ở `CHANGELOG.md` bản 2026-08-24 (10): title `Update ngách bán content Nhật, Hàn..`, duration `10:28`, badge `Quan trọng`, access `PRO`, vị trí Module 4 = M06. Chèn vào `SITE_RAW[6].items` **với title khớp `catalog_full.json`** để `norm()` match được, rồi chạy:
```powershell
node scripts/build-modules-v2.js
```
**Kịch bản xấu cần tránh:** `build-modules-v2.js:79` có fallback `catalog.find(c => !assigned.has(c.sku))` — nếu match title fail, nó **gán bừa bài đầu tiên còn trống** vào vị trí đó mà không báo lỗi. Đây là bug cần bịt ở B3.3.

### B3.2 — Verify
```bash
node -e "
const m=require('./data/modules.json'),v=require('./data-tabs/videos.json');
const s=new Set(m.modules.flatMap(x=>x.items.map(i=>i.sku)));
console.log('modules',s.size,'videos',v.length,'thiếu:',v.filter(x=>!s.has(x.sku)).map(x=>x.sku));
console.log('dư:',[...s].filter(k=>!v.some(x=>x.sku===k)));
console.log('totalLessons',m.totalLessons,'| M06',m.modules.find(x=>x.id==='M06').count);
"
```
Mong đợi: `modules 130 videos 130 thiếu: []` và `totalLessons 130`.

### B3.3 — Bịt fallback + thêm guard
`build-modules-v2.js:77-80`: thay fallback gán bừa bằng `console.warn('KHÔNG MATCH: ' + siteItem.title)` + đếm `unmatched`; nếu `unmatched > 0` → **`process.exit(1)`**, không ghi file. Đồng thời thêm assert `totalAssigned === catalog.length`.
**Xoá hoặc đổi tên `build-modules.js`** (v1): nó ghi cùng `data/modules.json` (`:247`) nhưng **không có `duration`/`seq`/`badge`** (`:242` để `durationLabel:''`) → chạy nhầm là rỗng thời lượng toàn bộ learn.html + player.html.

---

## PHẦN 4 — P1 · TÀI LIỆU RULE CHỨA SỐ KHÔNG NGUỒN

### Hiện trạng (đã đối chiếu 6.695 dòng báo cáo nguồn)
| Tuyên bố | Kết luận |
|---|---|
| `RULE-LAM-VIEC.md:143-152` bảng 7 số (74.1 · 69.1 · 68.8 · 68.6 · 67.7 · 67.4 · 63.6, comp 29.2, 41.8K) | **KHÔNG-CÓ-NGUỒN** — grep `74.1` trong `docs/NOI-BO/`: **0 file** |
| `AGENTS.md:48` Phật pháp Nhật 76.8 / comp 13.3 | **CÓ NGUỒN** — `data-tabs/ngach-xanh.json:423` |
| `RULE-LAM-VIEC.md:154-157` outliers 369K / 28x / History Vs Myths | **KHÔNG-CÓ-NGUỒN** trong báo cáo |
| `RULE-LAM-VIEC.md:125` Finance $5-20 · Health $7-22 | **STALE** — `AGENTS.md:60` + `MEMORY.md:37` cấm đúng 2 số này (chuẩn AIR: Education $10.22 · Health $1.23 · Business $2.01) |
| `AGENTS.md:48` ghi "đo lại 21/08" | Số 76.8 thực đo **18/08, đối chiếu 19/08** → nhãn ngày sai |
| `AGENTS.md:44` "Nguồn MCP duy nhất: `d:\YTB\.mcp.json`" | Mâu thuẫn `HUONG-DAN-MCP-CHUAN.md:59,96`; và `CHANGELOG.md:397` ghi file `.mcp.json` **đã bị xóa** 20/08 |
| Xếp hạng ngách | **4 văn bản, 4 thứ tự khác nhau** (`AGENTS.md:48` #1 Phật pháp vs `ngach-xanh.json:46-78` #1 Everyday History vs `CHANGELOG.md:156` #1 Everyday vs `RULE` #1 Phật pháp) |

### B4.1 — Gộp về 1 nguồn sự thật
**Nguyên tắc đề xuất:** `data-tabs/ngach-xanh.json` là SSoT số liệu (vì nó có `doNgay`, `evidence`, `rpm` từng ngách). Mọi file MD chỉ được **dẫn chiếu**, không chép số.
- `RULE-LAM-VIEC.md:143-157`: thay 2 bảng bằng 1 dòng "Bảng xếp hạng đọc tại `data-tabs/ngach-xanh.json` → `auditTong2026.xepHang` (đo ngày `doNgay`)".
- `RULE-LAM-VIEC.md:123-131` (bảng RPM §4.6): thay bằng 3 số AIR đã chốt trong `AGENTS.md:60`, gạch đầu dòng "cấm dùng lore Health $7–22 / Finance $5–20".
- `AGENTS.md:48`: sửa nhãn ngày → "đo 18/08, đối chiếu 19/08"; thêm nguồn `ngach-xanh.json:423`.
- `AGENTS.md:44`: sửa thành "Nguồn MCP: `.agents/mcp_config.json` (MCP Pool VPS). `d:\YTB\.mcp.json` = legacy, đã xoá 20/08".

### B4.2 — Ghi rõ 4 việc đang mâu để anh quyết (không tự sửa)
1. Ngách #1 là Phật pháp Nhật hay Everyday History EN.
2. Everyday History EN đang có `skus: []` (`ngach-xanh.json:1206`) — **trụ chưa có video nào**, nhưng `prompt-ngach-everyday-history.md` đã tồn tại.
3. `ngach-xanh.json:404` ngách Phật pháp Nhật: `"rpm": "chưa đo RPM"` — ngách đang xếp cao nhất **chưa từng đo RPM**.
4. `CHANGELOG.md:378-383` kết luận 23 kênh dead (10 có handle mới, 3 không xác định) nhưng **chưa ghi vào kho** — `kenh-mau.json` hiện vẫn 13 dead / 148 live (em đo).

---

## PHẦN 5 — P1 · SCRIPT GHI ĐÈ DATA KHÔNG BACKUP

### Hiện trạng (em grep `writeFileSync` + kiểm tra logic backup từng file)
| Script | Dòng ghi | Backup? | File đích |
|---|---|---|---|
| `scripts/build-modules.js` | `:247` | **KHÔNG** | `data/modules.json` |
| `scripts/build-modules-v2.js` | `:132` | **KHÔNG** | `data/modules.json` |
| `scripts/fix-kind-niche.js` | `:118` | **KHÔNG** | `data-tabs/tai-lieu-full.json` |
| `scripts/fix-mp4-size.js` | `:51` | **KHÔNG** | `data-tabs/videos.json` |
| `scripts/intake-inbox.js` | `:77` | **KHÔNG** (`:56` là copy file inbox, không phải backup; `:74` `renameSync` dời file) | `data-tabs/tai-lieu-full.json` |

Vi phạm trực tiếp `AGENTS.md:43` ("Backup trước khi sửa data file").

### B5.1 — Thêm 1 helper dùng chung, gắn vào 5 chỗ
Tạo `scripts/lib-safe-write.js`:
```js
const fs = require('fs'), path = require('path');
function safeWriteJson(absPath, data, ROOT) {
  const dir = path.join(ROOT, '_backup', 'auto-' + new Date().toISOString().slice(0,10));
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(absPath)) {
    const dst = path.join(dir, path.basename(absPath) + '.pre-' + Date.now() + '.json');
    fs.copyFileSync(absPath, dst);          // backup TRƯỚC, không bao giờ ghi đè backup
  }
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
module.exports = { safeWriteJson };
```
Thay `fs.writeFileSync(X, JSON.stringify(...))` bằng `safeWriteJson(X, data, ROOT)` tại 5 dòng bảng trên.
**Không dùng `fs.renameSync` làm "backup"** — đổi tên file giữa chừng là dạng phá vỡ liên kết mà `check-broken-refs.js` sẽ không bắt được.

**Verify:** chạy thử 1 script có gate `--write` → `ls _backup/auto-2026-08-27/` phải có `.pre-*.json` → rồi `node scripts/validate-project.js` vẫn PASS.

---

## PHẦN 6 — P1 · CÔ LẬP SCRIPT HEURISTIC ĐÈ 4 FILE SSoT

### Hiện trạng
`scripts/process_all_129_videos.py` (`:51-131`, `:278-331`) và `scripts/generate_video_insights.py` (`:351`, `:384-386`) **ghi đè cùng lúc** `video_insights.json` + `catalog_full.json` + `catalog.json` + `data-tabs/videos.json`. `PROTECTED_SKUS` (`process_all_129_videos.py:218-222`) chỉ che **10/130** → mọi fix tay ngày 17–18/08 (`CHANGELOG.md:448`, `:571-573`) sẽ bị nội dung heuristic đè lên. `generate_video_insights.py:49,86,123,164,204,243` chỉ có 6 nhánh hardcode — video ngoài 6 nhánh đó bị boilerplate hoá.

### B6.1 — Cách ly [ANH DUYỆT — vì đụng NO_DELETE]
```powershell
mkdir _archive\20260827-heuristic-scripts
move scripts\process_all_129_videos.py        _archive\20260827-heuristic-scripts\
move scripts\generate_video_insights.py       _archive\20260827-heuristic-scripts\
move scripts\update_batch_2_insights.py       _archive\20260827-heuristic-scripts\
move scripts\update_batch_3_insights.py       _archive\20260827-heuristic-scripts\
move scripts\update_video_dd983d_exact.py     _archive\20260827-heuristic-scripts\
```
(Đổi tên thêm hậu tố `.disabled-20260827` nếu anh muốn giữ nguyên chỗ cũ.)
**Kèm 1 dòng vào `AGENTS.md` rules cứng:** "Cấm chạy các script sinh nội dung heuristic đè `videos.json`/`catalog*.json`. Muốn enrich: ghi ra file tạm, đối chiếu tay, rồi patch có backup."

---

## PHẦN 7 — P2 · WATCHDOG KHÔNG TỒN TẠI

### Hiện trạng (em kiểm tra live)
```
Get-ScheduledTask -TaskName 'H2DEV*'  →  chỉ có: H2DEV-Server-AutoStart (Ready)
```
`CHANGELOG.md:16` mô tả watchdog "check port 8899 mỗi 5 phút" như đã xong, và `CHANGELOG.md:10` nêu nguyên nhân zombie là "**không có watchdog**" → **lỗ hổng gốc vẫn còn**. `h2dev-watchdog.ps1` có thật nhưng chưa được đăng ký.
Đã kiểm thêm: nhận định `CHANGELOG.md:18` "đã xóa HKCU Run key + Startup shortcut" là **ĐÚNG** (Startup folder chỉ còn `9router.vbs`, `Tailscale.lnk`, `mcp-pool-v2.lnk.disabled`). **Nhưng** không script nào có logic xoá — `install-h2dev-noadmin.ps1` chỉ có thêm (`Set-ItemProperty` + `shortcut.Save()`), tức ai double-click lại file đó là 3 đường autostart trùng quay về.

### B7.1 — Đăng ký watchdog [ADMIN]
```powershell
cd D:\YTB\H2DEV-Project
powershell -ExecutionPolicy Bypass -File .\install-h2dev-watchdog.ps1
```
**Sửa trước khi chạy** — `install-h2dev-watchdog.ps1:41`:
```powershell
-RepetitionDuration (New-TimeSpan -Days 365)
```
→ `TimeSpan.MaxValue` (hoặc `-RepetitionDuration ([TimeSpan]::MaxValue)`), vì bản hiện tại **hết hạn sau 1 năm** và Windows sẽ âm thầm ngừng xoay.
 Script này cũng re-register `H2DEV-Server-AutoStart` với `-RestartCount 999` (`:67`) — tốt, giữ.

### B7.2 — Thêm port-guard vào watchdog
`h2dev-tray.ps1:44-48` có guard "port đã listen thì skip", nhưng `h2dev-watchdog.ps1:58-71` **không có** → watchdog và tray có thể cùng spawn, sinh đúng cảnh `Killed old node PID=11680` đã ghi ở `h2dev-tray.log` (24/08 18:47:08). Sao chép nguyên logic guard của tray sang watchdog trước khi gọi `Start-Server`.

**Kèm 2 lỗi nhỏ nên sửa luôn:**
- `h2dev-tray.ps1:33`, `h2dev-watchdog.ps1:23`, `H2DEV-OneClick.cmd:37` kill node theo substring `server\.js` → **giết nhầm mọi tiến trình node khác có tên `server.js`** (cực phổ biến). Đổi sang so khớp `CommandLine -like "*H2DEV-Project*server.js*"`.
- `h2dev-tray.ps1:64-65` và `watchdog:44-45` dùng `-RedirectStandardOutput` → **ghi đè `server-lan.log` mỗi lần restart**, mất dấu crash cũ. Đổi sang `Add-Content` có timestamp như `h2dev-tray.log`.

**Verify:** `Get-ScheduledTask -TaskName 'H2DEV*'` ra 2 task → kill server tay → chờ 5–6 phút → port 8899 tự LISTEN lại.

---

## PHẦN 8 — P2 · CSS CŨ 10 NGÀY + CHECKER BÁO OK GIẢ

### Hiện trạng (em đo)
- `assets/tailwind.css` = **18.023 bytes**, ngày **2026-08-13**; `index.html` ngày **2026-08-23** → CSS build trước UI 10 ngày, `npm run build:css` chưa chạy lại.
- `index.html` chỉ nạp `assets/tailwind.css` + `assets/viddar.css` (`index.html:10-11`). **Không file HTML nào nạp `app.css` hay `studio.css`** (em grep `*.html` → 0 kết quả) — 2 file CSS mồ côi.
- `scripts/check-ui-full.js:18,68-70` lại đi kiểm `app.css`/`studio.css` → checker xanh trong khi UI thật thiếu class. Ước tính **64 class** trong index.html không tồn tại trong 2 CSS được nạp (`stat-glyph`, `text-[11px]`, `space-y-1.5`, `grid-cols-2`, `lg:grid-cols-3`, `bg-amber-950/10`…).
- `tailwind.config.js:3` = `content: ['./index.html','./player.html']` → **thiếu `learn.html`** (learn.html cũng không nạp tailwind.css ở `learn.html:10-11`).

### B8.1 — Build lại CSS
```powershell
cd D:\YTB\H2DEV-Project
node scripts/backup-data.js                     # đã có ở B0.1, nhắc lại nếu làm lẻ
copy assets\tailwind.css assets\tailwind.css.bak-20260827
npm run build:css
```
**Rủi ro phải biết:** `build:css` (`package.json:12`) sinh lại **toàn bộ** `tailwind.css` từ `css/input.css` + quét `content`. Nếu ai đó đã thêm rule tay vào `tailwind.css` sau ngày 13/08 thì sẽ mất — vì vậy mới copy `.bak` trước. Rule viết tay nên chuyển vào `css/input.css` (`@layer`).

### B8.2 — Sửa `tailwind.config.js:3`
```js
content: ['./index.html', './player.html', './learn.html', './assets/*.js'],
```
(Thêm `assets/*.js` vì `h2dev-core.js`/`learn.js` sinh class Tailwind trong chuỗi template — không quét vào thì không sinh CSS cho chúng.)
Quyết định của anh: `learn.html` có theo thiết kế viddar không? Nếu có → thêm `<link rel="stylesheet" href="assets/viddar.css">` ở `learn.html:10-11`.

### B8.3 — Sửa checker để nó không thể báo OK giả
`scripts/check-ui-full.js:18,68-70`: chỉ kiểm **CSS mà HTML thật nạp**. Cách an toàn: parse `<link rel="stylesheet" href="…">` từ chính file HTML rồi duyệt danh sách đó, thay vì hardcode. Đồng thời bỏ `D:/YTB/H2DEV-Project/` hardcode (`:3,19,26,33,40,68-69` → dùng `path.resolve(__dirname,'..')`) — hiện cả 4 checker UI hỏng ngay khi đổi máy.
Xử lý `assets/app.css` + `assets/studio.css`: hoặc nạp lại, hoặc dời vào `_archive/` [ANH DUYỆT].

**Verify:** `node scripts/check-ui-full.js` → số class thiếu phải về **0** (hiện ~64); `node scripts/validate-project.js` vẫn PASS.

---

## PHẦN 9 — P2 · SỐ HARDCODE ĐÃ TRÔI KHỎI DATA

| Vị trí | Đang ghi | Data thật |
|---|---|---|
| `index.html:6` meta description | "radar kho 129 video" | 130 |
| `index.html:45` footer | "H2DEV · 129 video" | 130 |
| `learn.html:6,19,43` | "129 bài / 11 Module" | 130 bài |
| `index.html:704` | `'70 / 70'` kênh mẫu sạch | `mauSach` chỉ **51 handle distinct**; `kenh-mau.json` = 161 (148 live) |

### B9.1 — Sinh động từ JSON, cấm hardcode
Footer/meta: thay bằng render từ `videos.length` (pattern đã có sẵn ở `index.html:1492` — nó in đúng 130). Card "Kênh mẫu sạch": lấy `mauSach` đã khử trùng + nguồn `doNgay` từ `ngach-xanh.json`, format `${checked} / ${total}`. Nếu số liệu chưa đo thật → hiển thị `KHÔNG-VERIFY`, **không** để số đẹp.
Đây là yêu cầu của `RULE-LAM-VIEC.md:26-27` (mọi nhận định kèm evidence, cấm bịa số liệu).

**Verify:** grep `129` trong `index.html`/`learn.html` phải còn **0** kết quả thuộc nhãn hiển thị.

---

## PHẦN 10 — P2 · TIẾN ĐỘ XEM BỊ MẤT + escape

### B10.1 — Player không đồng bộ lên server
- `player.html:182-188` `saveStore()` chỉ ghi `localStorage`, **không** `PUT /api/admin-state`.
- `index.html:189-199` `hydrateAdminState()` lại **lấy server ghi đè** `h2dev-watched` mỗi lần boot.
→ Tiến độ vừa tạo trong player biến mất khi về trang chủ / mở máy khác. Path PUT duy nhất tồn tại là `assets/h2dev-core.js:75-81`, chỉ chạy ở `learn.html`.
**Sửa:** gọi cùng hàm debounce-PUT của `h2dev-core.js` từ `saveStore()` trong `player.html`. Lưu ý `server.js:116-132` nhận `PUT`/`POST` **không auth** — đã mở LAN/Tailscale nên mọi máy trong mạng đều ghi được `data/admin-state.json`. Chỉ chấp nhận được nếu mạng là LAN tin cậy; nếu Tailscale ACL rộng thì nên thêm 1 token trong `_private/`.

### B10.2 — Escape
- `assets/h2dev-core.js:29` `esc()` **không escape `'`** (khác `index.html:182` và `player.html:155`) → hỏng khi value đặt trong `onclick="fn('…')"` một dấu nháy đơn. Dẫn chứng cụ thể: `player.html:329` nhét handle kênh vào `onclick="copyHandle('@…')"`, và `player.html:391` chèn `${k.seconds}` thô vào `onclick`. Thêm `.replace(/'/g,'&#39;')`.
- Nhiều chỗ `innerHTML` ăn dữ liệu thô không `esc()`: `index.html:430`, `:444`, `:786`, `:788` (cả ở **thuộc tính class** → class injection), `:857`, `:1354`, `:1366`. `esc()` cũng **không chặn `javascript:`** → `origin`/`link`/`url`/`file` ở `:493`, `:1024`, `:1159`, `:1241` là sink. Sửa: bọc `esc()` + validate scheme `/^https?:/` trước khi đặt vào `href`.

---

## PHẦN 11 — P3 · RÁC TRÙNG [ANH DUYỆT TRƯỚC KHI XÓA]

| # | Mục | Bằng chứng |
|---|---|---|
| 1 | `assets/docs/` **45 file / 2,0 MB** trùng `docs/` | 47 cặp sha256 giống hệt, 24 SKU (nhiều nhất: `VIDEO-2aa1f7` 6 file, `VIDEO-8e0275` 4, `VIDEO-d20744` 6) |
| 2 | 6 file `.zip` của `VIDEO-d20744` **không phải zip** | Magic bytes = `<!-- OnePanel Se` (HTML challenge WAF) × 2 cây = **12 file chết ~54 KB**; 6 link ở `docs/VIDEO-d20744/README.md:10-15` chưa bao giờ tải được |
| 3 | `docs/VIDEO-8e0275/drive_1qYA4aaI…` 1.789 B | Là `<!DOCTYPE html>` — không phải asset |
| 4 | 2 `.zip` wildlife | Bản sao đúng của `SKILL.md` đang mở (12.609 B và 7.416 B khớp byte) |
| 5 | `pipelines/hoat-hinh-ai/scripts/` ≡ `skills/03…/scripts/` + `skills/05…/scripts/` | 3 file, **967 dòng trùng tuyệt đối** (md5 khớp) |
| 6 | `video/VIDEO-61ad94/VIDEO-61ad94.mp4.part` | 0 byte, sót cạnh mp4 đã xong |
| 7 | `_verify/` 7 file scratch | Không script nào đọc (chỉ `server.js:150` block). Vi phạm `RULE-LAM-VIEC.md` PHẦN 7 mục 4 |
| 8 | `Raw Kênh Mẫu Tìm Kiếm/` 96 ảnh / **12 MB** + `Thumbs.db` | Không có trong `TREE.md`; nằm trong vùng web serve |

**Cách làm an toàn:** không `rm`. Dời hết sang `_archive\20260827-rac\` giữ nguyên cấu trúc, chạy `node scripts/validate-project.js` + `node scripts/deep-audit.js` + mở web đủ 7 tab → **nếu tất cả vẫn PASS thì mới xoá hẳn**.

---

## PHẦN 12 — P3 · NỢ DATA CHỜ ANH

1. **23 kênh dead** (`CHANGELOG.md:378-383`): 10 đã có handle mới, 10 dead thật, **3 không xác định** (`HealthyToday0`, `漫画で学ぶシニアの健康CH`, `새벽의두만강`) — chờ anh tự tìm. Kho hiện vẫn 13 dead / 148 live.
2. **`@DoctorJohnMeyers`**: xoá hẳn hay giữ handle mới `@DrJohnMeyers-4` (AI-doctor = Cửa 3 cấm).
3. **7 handle trong video không resolve được vidIQ** (`CHANGELOG.md:368`) — vẫn giữ nguyên trong `videos.json`, cần anh xác minh.
4. **RPM cho ngách đang xếp #1**: `ngach-xanh.json:404` "chưa đo RPM" → cần 1 lượt `vidiq__*` đo thật.
5. **3 việc đã duyệt từ 30/07 nhưng chưa chạy** (`docs/NOI-BO/chat/README.md:29-33`): chuẩn hóa view theo tuổi video · scrape JP/KR · check policy 7/2026. Phiên 5 chết giữa dòng (`2026-07-30_6c4ddd63.md:1113`), không report nào ra đời.
6. **Blind spot Hàn Quốc**: NexLev có 18 kênh JP / **0 kênh KR** → mọi kết luận về thị trường Hàn hiện chỉ dựa scrape tay ngày 27/07.
7. **3/4 pipeline không chạy được hôm nay**: thiếu `python` trong PATH (chỉ có `py` launcher), thiếu `ffmpeg`/`ffprobe` (chỉ có ở `D:/Linly-Dubbing/bin`), thiếu `.env` ở cả `ton-giao` và `hoat-hinh-ai`; 2 pipeline dùng 2 tên biến key khác nhau (`KIE_API_KEY` vs `KIE_API_TOKEN`) → 1 file `.env` không thoả cả hai. `bible-explainer` nằm **100% trong 3 zip** (69 KB prompt) → không review/diff được.

---

## PHẦN 13 — CẤM TỰ CHẠY

| Lệnh | Lý do |
|---|---|
| `node scripts/build-modules.js` | v1, ghi `modules.json` không duration/seq/badge → sập learn + player |
| `python scripts/process_all_129_videos.py` | đè 4 file SSoT bằng heuristic, chỉ che 10/130 SKU |
| `python scripts/generate_video_insights.py` | đè toàn bộ `video_insights.json`, boilerplate hoá video ngoài 6 nhánh hardcode |
| `python scripts/update_batch_2_insights.py` / `batch_3` / `update_video_dd983d_exact.py` | one-shot 08/2026 đã apply — chạy lại đè mọi sửa đổi sau đó |
| `node scripts/clean-root-to-tree.js` | `:190-197` move **mọi** `.md/.xlsx/.py/.js/.txt/.json` ở gốc `D:\YTB` sang `_archive/leftover`; `:22-27` ghi đè dest đã tồn tại; và nó **đá nhau** với `sync-ngoai-vao-h2dev.js` (hai file ghi `knowledge-hub-POINTER.md` nội dung ngược nhau) |
| `powershell -File .\install-h2dev-noadmin.ps1` | thêm HKCU Run + Startup.lnk trong khi task AutoStart đã tồn tại → 3 đường autostart, tray thứ hai giết server đang chạy |
| `H2DEV-OneClick.cmd` khi server đang OK | kill theo port (`:38`) và substring `server\.js` (`:37`) — giết cả tiến trình node khác |
| `python scripts/transcribe_videos.py --force` | đè 129 transcript; và file này có **credential hardcode ở `:163`** + đọc key từ `D:/Linly-Dubbing/config/groq_config.json` (`:61`) |
| `node scripts/count-warnings.js` | input `scripts/audit-recheck.txt` không tồn tại |
| `python knowledge-hub/scripts/archive_yt_channel.py` | trỏ `D:\Hermes-Work\venvs\hermes-work\Scripts\yt-dlp.exe` — file không tồn tại trên máy này |

---

## PHẦN 14 — CHECKLIST KẾT THÚC (theo `RULE-LAM-VIEC.md` PHẦN 7)

```text
[ ] B0.1 backup-data.js đã chạy → _backup\<ts>\ tồn tại
[ ] B0.2 snapshot 9 file code/docs
[ ] B1.1 key đã xoay (anh)          [ ] B1.2 curl 403 chat/          [ ] B1.3 grep key = 0 kết quả
[ ] B2.3 cả 3 nút "Xem video ngách" ra > 0 card trên web thật
[ ] B3.2 modules 130 = videos 130, thiếu: []
[ ] B4.1 RULE-LAM-VIEC không còn số không nguồn; AGENTS.md:44 đã sửa
[ ] B5.1 _backup/auto-2026-08-27/ có .pre-*.json sau mỗi lần script ghi
[ ] B6.1 script heuristic đã cách ly + AGENTS.md có dòng cấm
[ ] B7.1 Get-ScheduledTask ra 2 task; kill server → tự dậy trong 6 phút
[ ] B8.3 check-ui-full class thiếu = 0
[ ] B9.1 grep "129" = 0 nhãn hiển thị
[ ] node scripts/validate-project.js  → PASS, 0 warning
[ ] node scripts/deep-audit.js        → ISSUES: 0 (hiện còn VIDEO-61ad94)
[ ] Mở web đủ 8 tab (tongquan/lotrinh/video/ngachxanh/kichban/nguonreup/kenh/chienluoc) không console lỗi
[ ] CHANGELOG.md thêm bản 2026-08-27, ghi rõ tool/lệnh đã chạy
```

**Hai sửa đổi nhỏ về tài liệu nên làm cùng đợt:** `TREE.md:24` ghi "7 tab" nhưng `TABS` (`index.html:61-70`) là **8 mục** (`lotrinh` là iframe `learn.html`); `TREE.md` cũng chưa liệt kê `DESIGN-IS-2026-08-22/`, `Raw Kênh Mẫu Tìm Kiếm/`, `_verify/`. Và `MCP_POOL_HUONG_DAN.md` đang nằm ở gốc `D:\YTB\` — trái `README.md:18` "không thả MD ở gốc"; nên dời vào `docs/NOI-BO/`.
