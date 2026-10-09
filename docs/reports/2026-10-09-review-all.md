# Báo cáo rà soát toàn bộ dự án H2DEV — 2026-10-09

> Chế độ: chỉ đọc. Không sửa file mã nguồn, không chạy build/test/lint (CI xử lý).
> File duy nhất được tạo là báo cáo này (chuẩn §01.S: báo cáo > 70 dòng nằm trong `docs/reports/`).
> Không có giá trị secret nào được in trong báo cáo. Khóa được ghi là `<redacted>` hoặc `sk-…` và chỉ so sánh bằng hash.

---

## 0. Tóm tắt điều hành

Dự án có **hai lộ bí mật đang xảy ra ngay trên server cục bộ đang chạy (bind `0.0.0.0:8899`, tức LAN và Tailscale)**, và một khóa API thứ ba nằm trong git đã push lên ba remote. Đã xác nhận bằng HTTP HEAD, không tải nội dung.

1. **Khóa API `mcp-pool` đang bị lộ ở 3 nơi.** Khóa này cũng nằm trong git, và `.env` đang dùng đúng giá trị đó.
   **Bắt buộc rotate khóa ở nhà cung cấp.** Chỉ viết lại lịch sử git là chưa đủ, vì khóa đã lộ.
2. **Widevine CDM device file (`_tools/cdm/device.wvd`) có thể tải được qua HTTP.** Cần coi như đã lộ.
3. **Khóa 9Router (`sk-…`) nằm dạng văn bản rõ trong `scripts/ai_video_deep_analyzer.js:34`,** đã commit và push lên `origin`, `github`, `vps`. Trạng thái công khai của repo GitHub: UNVERIFIED.
4. **Nguyên nhân gốc là cơ chế chặn đường dẫn.** Đây là denylist và so sánh chuỗi, không phân giải symlink. Vì vậy `.agents` (trỏ ra `D:\YTB\.agents`) và `assets/nhac-nen` (trỏ ra `D:\YTB\Nhạc nền`) đều được phục vụ.
5. **Production (VPS) chưa được xác minh.** CHANGELOG ghi nhận `.agents` đã được đồng bộ sang VPS. Cần kiểm tra trực tiếp trên VPS, ngoài phạm vi task chỉ-đọc này.

Ngoài các mục Critical, có nhóm High về **deploy** (xóa DB live và không dừng khi lỗi), **firewall** (rule cho mọi profile kể cả Public), **SSH tới VPS dưới quyền root** không kiểm host key, và **supply chain** (tải skill từ bên thứ ba không kiểm checksum). Thêm hai High từ agent client và pipelines: khóa imgbb bị in ra console khi lỗi HTTP (H11), và markdown tóm tắt được đưa vào `innerHTML` không escape (H12, có điều kiện). Chi tiết ở mục 4 (H7–H12).

Các đề xuất sửa chỉ là đề xuất, chưa được áp dụng.

---

## 1. Phạm vi, cách kiểm và giới hạn

**Đã đọc đầy đủ (CONFIRMED):**
- `server.js` (689 dòng, toàn bộ request pipeline)
- `scripts/master_dal.js`, `scripts/spider_graph_engine.js`, `scripts/live_player_resolver.js`, `scripts/logrotate.js`, `scripts/load-keys.js`, `scripts/get_drm_key.py`, `scripts/deploy/post-receive`
- `AGENTS.md`, `package.json`, `TREE.md`, `00_README.md`

**Đã kiểm bằng HTTP (CONFIRMED):** HEAD request tới `127.0.0.1:8899` (server đang chạy, `/health` trả `{"ok":true}`). Chỉ lấy mã trạng thái và độ dài, không tải body. **Không probe production.** Một lần GET không xác thực tới API công khai của GitHub để kiểm trạng thái repo (trả 403, xem C3).

**Đã kiểm bằng git và hệ thống file:** `git ls-files`, `git check-ignore`, `git log -G` (đếm commit, không in nội dung khớp), `git branch -r --contains`, `find -type l`, `readlink`, so sánh hash giá trị khóa.

**Agent đọc song song:**
- `scripts/` — **đã hoàn thành**, 110 file (không phải 97 như ước lượng ban đầu). Kết quả ở mục 6.1.
- Client JS: `assets/app/**` (17 file), `assets/learn.js`, `assets/h2dev-core.js`, `assets/music_player_modal.js`, inline script trong `index.html` / `player.html` / `learn.html` — **đã hoàn thành**, kết quả ở mục 6.2.
- `pipelines/` và `knowledge-hub/scripts/` (Python và JS, bỏ media) — **đã hoàn thành**, kết quả ở mục 6.3.

**Chỉ inventory, không đọc nội dung:** `video/` (~22 GiB, gitignored, phục vụ có chủ đích), `data/` (149 MB dữ liệu JSON/DB), `_backup/`, `_archive/`, `_audit/`, `.venv-gpu/`, `node_modules/`, `logs/`, `_private/`, `.zcode/`, `_tools/` (chỉ tên file và magic bytes), `.env` (chỉ đọc tên biến, không đọc giá trị).

**Quy mô:** khoảng 29.338 file. Phân bố theo đuôi: 1.153 json, 1.101 md, 104 html, 64 js, 49 py, 13 cjs, 11 css, 7 ps1, 6 cmd, 5 vbs. Mã nguồn chính khoảng 8.000 dòng JS client và 689 dòng server.

**Không kết luận được:** nội dung thực tế trên VPS production; hành vi upstream mona.academy khi nhận token ẩn danh; trạng thái hiệu lực của các khóa đã lộ; trạng thái công khai của repo GitHub.

---

## 2. Bản đồ dự án và tech stack

- **Loại:** web app tĩnh + API nhỏ, monolith. Server là Node.js CommonJS tự viết, không framework (`server.js`). Client là Vanilla JS, Tailwind 3 (build từ `css/input.css`).
- **Persistence:** SQLite qua `node:sqlite`. SSoT là `data/h2dev_master.db`. Các projection JSON nằm ở `data-tabs/` và được sync bởi `scripts/master_dal.js`. `data/intelligence.db` là DB riêng cho spider.
- **Pipeline sản xuất:** Python + ffmpeg (`pipelines/`, 5 pipeline: hoat-hinh-ai, wildlife, ton-giao, everyday-history, bible-explainer), DRM tooling (`scripts/get_drm_key.py`, `scripts/download_full_drm_audio.cjs`).
- **Deploy:** `git push` tới bare repo trên VPS → hook `post-receive` (`git reset --hard origin/main`, build DB, guard counts, `pm2 reload`).

| Tầng | Module chính | Vai trò |
|---|---|---|
| Entry & bootstrap | `server.js:37, 677, 680` | Init log rotation, listen `0.0.0.0:8899`, check log khi khởi động |
| Routing & bảo vệ | `server.js:285–690` | Route API, redirect, validate SKU, traversal guard, denylist |
| Static serving | `server.js:93–247` | Range, ETag, gzip (cache 120 entry), Cache-Control theo loại file |
| Provider ngoài | `scripts/live_player_resolver.js`, `scripts/spider_graph_engine.js` | Mona Cloud GraphQL, YouTube InnerTube và RSS |
| Persistence | `scripts/master_dal.js`, `scripts/build_master_db.js`, `scripts/lib/counts.js` | DAL, FTS5, projection sync, đếm số liệu |
| Infra | `scripts/logrotate.js` | Nén và xoay log, dọn file mồ côi |
| Client | `assets/app/main.js`, `assets/app/tabs/content.js` (2.107 dòng), `assets/app/player-main.js` | 9 tab, render qua string template, service worker |
| Tooling | `scripts/` (110 file), `scripts/validate-project.js` | Validate, sync, guard, download, DRM |
| Deploy | `scripts/deploy/post-receive`, `scripts/deploy/README.md` | Hook VPS với guard và rollback |

**Rủi ro kiến trúc:** dữ liệu có nhiều nguồn SSoT chồng nhau (`data/catalog.json`, `data-tabs/videos.json`, `data/h2dev_master.db`). `server.js` đọc `catalog.json` cho validate SKU (`server.js:471`), còn client đọc `data-tabs/`. Quan hệ đồng bộ giữa chúng chỉ được bảo vệ bằng guard lúc deploy.

---

## 3. Cơ chế vận hành cốt lõi

**Khởi động.** `server.js:37` khởi tạo log rotation (30 phút/lần). `server.js:677` listen trên `HOST` (mặc định `0.0.0.0`). `server.js:684–689` đăng ký `uncaughtException` và `unhandledRejection` chỉ để ghi log, process không thoát. Không có graceful shutdown và không có dependency container.

**Pipeline request** (`server.js:285` → kết thúc ở `:674`):
`OPTIONS` → `/health` → `/api/admin-state` (GET-only, ghi bị từ chối) → `/api/intelligence/breakouts` → `/api/intelligence/spider` (GET, có side effect) → `/api/search` (FTS5) → `/live/<SKU>` (proxy HTML bên thứ ba) → chặn method khác GET (`:412`) → decode URL (`:433`) → redirect cũ (`:448`) → `/lotrinh` validate SKU (`:463–489`) → `path.resolve` và kiểm traversal bằng chuỗi (`:494–502`) → chặn `.env*` theo basename (`:506`) → `/api/niche-radar` (`:519`) → denylist segment (`:585–611`) → chặn `*.db` và `mcp-keys*` (`:614`) → chặn `/scripts/` (`:644`) → `fs.stat` → `sendFile`.

**State.** Server gần như stateless. Có hai thứ trong bộ nhớ: `GZIP_CACHE` (`server.js:75`, tối đa 120 entry) và `admin-state.json` đọc đồng bộ mỗi request (`server.js:249–253`). Không có lock. SQLite mở và đóng kết nối cho từng lần gọi (`master_dal.js:20–33`).

**Đồng bộ và ghi.** Ghi DB xảy ra ở hai chỗ: `master_dal.mutateDatabase` (gọi từ script, không từ server) và `spider_graph_engine.saveToDatabase` (`spider_graph_engine.js:343, 360–456`). Route spider kích hoạt ghi bằng GET. `server.js` import `mutateDatabase`, `query`, `queryOne` (`:8`) nhưng **không gọi hàm nào trong số này**.

**Tích hợp bên ngoài và chịu lỗi.** Có timeout cho đa số fetch trong provider (`live_player_resolver.js:11, 30`; `spider_graph_engine.js:23, 39`). Không có retry, circuit breaker hay fallback chain. Nhánh `/live/` không có timeout (`server.js:382`). Spider có sleep chống rate-limit (`spider_graph_engine.js:249, 278`) nhưng không có cache.

**Deploy.** `scripts/deploy/post-receive` reset về `origin/main` (dòng 19–21). Dòng 23 gọi `build_master_db.js` không kiểm tra exit code. Dòng 26 chạy guard `sync-counts --check`, nếu lệch thì rollback về commit cũ (dòng 31–35). Dòng 40 reload PM2.

---

## 4. Phát hiện và đánh giá rủi ro

Mức độ: **Critical** = lộ credential đang dùng được hoặc truy cập trái phép trực tiếp. **High** = lộ tài nguyên có giá trị, ghi dữ liệu hoặc gọi mạng không xác thực, hoặc lỗi làm hỏng deploy. **Medium** = rủi ro có điều kiện hoặc lỗi độ tin cậy. **Low / Tech debt** = chất lượng, không khẩn cấp.

### CRITICAL

**C1. Khóa API `mcp-pool` bị lộ ở ba nơi.** *(CONFIRMED)*
- **(a) Phục vụ qua HTTP.** `GET /.agents/mcp_config.json` trả **HTTP 200, 263 byte**. File chứa header `X-API-Key` và `Authorization`. Đã xác nhận bằng cách in cấu trúc file với mọi giá trị đã che. Nguyên nhân: `.agents` là symlink tới `D:\YTB\.agents` (`readlink`), không nằm trong `SENSITIVE_SEGMENTS` (`server.js:585–605`), và phần kiểm tra theo đuôi không chặn `.json`.
- **(b) Khóa dự phòng cứng trong mã có git theo dõi.** `scripts/load-keys.js:40` có `|| '<chuỗi-24-ký-tự>'`. Hash khớp với giá trị trong (a). Biến `required` ở `load-keys.js:48` không bao giờ báo thiếu, vì luôn có fallback, nên khóa này được dùng ngầm.
- **(c) Chuỗi xuất hiện trong 4 file tracked tại HEAD và 3 commit trong lịch sử.** Tại HEAD: `scripts/load-keys.js`, `scripts/normalize-raw-channels.py`, `docs/NOI-BO/bao-cao/KE-HOACH-SUA-CHUA-TOAN-DIEN-2026-08-27.md`, `knowledge-hub/docs/H2DEV-MASTER-OPERATING-PROMPT.md`.
- **(d) `.env` đang dùng đúng giá trị đó.** Hash `MCP_POOL_API_KEY` trong `.env` trùng với chuỗi đã commit. Đây là khóa đang hoạt động.
- **Hành động đề xuất:** rotate khóa ở nhà cung cấp `mcp-pool`. Sau đó bỏ fallback ở `load-keys.js` và bắt buộc đọc từ env (lỗi nếu thiếu). Xóa literal khỏi 4 file. Viết lại lịch sử git là tùy chọn, không thay thế được việc rotate.
- Các khóa `VIDIQ_KEY`, `EXA_KEY`, `JINA_KEY`, `TRENDS_KEYS` trong `.env` **không** khớp giá trị nào trong lịch sử git (so hash, tìm bằng regex gán `KEY=value`). Chưa thấy bằng chứng chúng đã bị commit theo dạng đó. Không loại trừ khả năng lộ theo dạng khác.

**C2. Widevine CDM device file có thể tải qua HTTP.** *(CONFIRMED)*
- `GET /_tools/cdm/device.wvd` → **HTTP 200, 2.954 byte**. Magic bytes `57 56 44 02` (`WVD` phiên bản 2), tức đúng định dạng Widevine device.
- Nguyên nhân: `_tools` không có trong `SENSITIVE_SEGMENTS` (`server.js:585–605`). Tên file không khớp regex `*.db` hay `mcp-keys*` (`:614`). `_tools/` nằm trong `.gitignore`, nên git không đưa đi, nhưng server phục vụ trực tiếp từ đĩa.
- `scripts/get_drm_key.py:11` đọc chính file này để cấp license DRM. **Coi như đã lộ.** Cần thu hồi hoặc thay CDM theo nhà cung cấp, và xóa `_tools` khỏi phạm vi phục vụ.
- Thêm `_tools/deno.exe` (97 MB) và `_tools/ffmpeg/*.exe` cũng tải được tự do (`200`). Không phải bí mật, nhưng vẫn là bề mặt tải về không cần thiết.

**C3. Khóa 9Router (`sk-…`) nằm dạng văn bản rõ trong file đang được git theo dõi.** *(CONFIRMED về vị trí và commit; trạng thái hiệu lực UNVERIFIED; công khai của repo UNVERIFIED)*
- `scripts/ai_video_deep_analyzer.js:34` có một literal `sk-…` (giá trị che, khoảng 35 ký tự) làm fallback. Fallback dùng khi `ROUTER_KEY` không set và tra cứu SQLite ở dòng 31 thất bại. Khóa được gắn trong header `Authorization` (`:141`).
- Literal có trong commit `87b0bb3`. Commit này nằm trên `origin/main`, `github/main` và `vps/main` (`git branch -r --contains`). Đây là lần duy nhất mẫu này xuất hiện trong toàn bộ lịch sử.
- **Lưu ý về phương pháp:** lần quét lịch sử trước của em dùng regex không có `-` và `_` nên bỏ sót khóa này. Quét lại với regex đầy đủ mới bắt được. Các mẫu khác (`gsk_`, `AIza`, `ghp_`, `xox`, `AKIA`, private key, `Bearer`) đều có 0 commit.
- **Công khai của repo GitHub:** một lần GET không xác thực tới `api.github.com/repos/<repo>` trả 403. 403 không phân biệt được riêng tư với bị giới hạn tốc độ. **Coi như có thể công khai cho đến khi kiểm trực tiếp.**
- **Hành động đề xuất:** rotate khóa ở nhà cung cấp 9Router. Xóa literal khỏi `ai_video_deep_analyzer.js`. Bỏ fallback, bắt buộc có env. Nếu repo công khai, mức này lên ngang C1.

### HIGH

**H1. Traversal guard so sánh chuỗi, không phân giải symlink (nguyên nhân gốc của C1, C2, H6).** *(CONFIRMED)*
- `server.js:494–495` dùng `path.resolve` và `path.relative`. Không có `fs.realpath`, nên symlink trong ROOT trỏ ra ngoài vẫn qua được kiểm tra.
- `.agents` → `D:\YTB\.agents`: **200**.
- `assets/nhac-nen` → `D:\YTB\Nhạc nền`: `GET /assets/nhac-nen/Bach%20-%20Air%20...mp3` **HTTP 200, 6.239.337 byte**.
- Junction trong `_audit/.../_private/registry/junction-*` (5 cái) bị chặn nhờ segment `_audit`/`_private`. Không rò rỉ trực tiếp, nhưng cho thấy kiểu link này tồn tại.
- **Đề xuất (chưa áp dụng):** chuyển từ denylist sang allowlist thư mục được phục vụ. Ngoài ra kiểm `fs.realpathSync(full)` có nằm dưới `ROOT` không.

**H2. Denylist thiếu mục gitignored và mục tài nguyên.** *(CONFIRMED)*
- `SENSITIVE_SEGMENTS` (`server.js:585–605`) không có `_tools`, `.agents`, `models`, `assets/nhac-nen`. Các mục này đều tồn tại trên đĩa và đều được phục vụ.
- `.gitignore` liệt kê `models/scrfd/*.onnx` và `models/arcface/*.onnx`. `models/` tồn tại trên đĩa và được phục vụ (chưa liệt kê nội dung). Không phải bí mật, nhưng là dữ liệu mô hình nội bộ.

**H3. `/live/<SKU>` proxy HTML bên thứ ba trên origin của app, không có header bảo mật, không timeout, không kiểm entitlement.** *(CONFIRMED về mã, UNVERIFIED về hành vi upstream)*
- `server.js:390–394`: response không gọi `withSecure`, nên **không có CSP, X-Frame-Options, nosniff**, và có `Access-Control-Allow-Origin: *`.
- `server.js:382`: `fetch(liveUrl)` không có timeout.
- Nguồn URL: `scripts/live_player_resolver.js:9–34` lấy cookie `__vdk`/`__vui` từ `https://h2dev.vn/learn` (một phiên ẩn danh), rồi gọi GraphQL `saas-api.mona.academy` với SKU bất kỳ khớp regex. `server.js:376–380` chỉ kiểm regex SKU, **không kiểm quyền xem của người gọi**.
- **UNVERIFIED:** liệu upstream có áp entitlement cho token ẩn danh này không. Nếu không, mọi SKU (kể cả 113 bài "pro" trong `TREE.md`) phát được cho bất kỳ ai truy cập server. Cần xác nhận đây có phải hành vi chủ ý.
- Nếu upstream bị xâm phạm, HTML của nó sẽ chạy trên origin của app (thực chất là stored XSS). Mức rủi ro phụ thuộc vào upstream.

**H4. `/api/intelligence/spider` gọi mạng và ghi DB khi GET không xác thực.** *(CONFIRMED)*
- `server.js:340–356` → `spider_graph_engine.js:216–357` → `saveToDatabase` (`:343`) ghi `cowatch_edges`, `channels`, `videos` trong `data/intelligence.db`.
- `seed` không được validate (`server.js:343`, mặc định ở `spider_graph_engine.js:460`). Mỗi request gửi 3 request InnerTube (1 hop đầu + 2 hop sau) và tối đa 15 request RSS, cộng sleep 350 ms × 2 và 200 ms × 15 (`:249, 278`). Không có rate limit, không có cache.
- Vì là GET và CORS `*`, một trang web bất kỳ trong LAN có thể kích hoạt bằng `<img>` hoặc `fetch`. Đây là ghi dữ liệu và gọi mạng không xác thực.
- **Đề xuất:** validate `seed` theo regex 11 ký tự YouTube; đổi sang POST hoặc yêu cầu token; thêm rate limit.

**H5. Khóa giải mã DRM (KID:KEY) nằm dạng văn bản rõ trong `CHANGELOG.md:90`.** *(CONFIRMED)*
- Dòng 90 ghi một cặp `KID:KEY` của một video cụ thể. Giá trị được che trong báo cáo này.
- File này được git theo dõi, nên khóa nằm trong lịch sử commit. Xóa khỏi file hiện tại là không đủ.
- **Đề xuất:** xóa khỏi file, cân nhắc viết lại lịch sử nếu repo được chia sẻ, và ghi nhận rủi ro bản quyền.

**H6. `.agents` đã được đồng bộ sang VPS production.** *(UNVERIFIED trên production)*
- `CHANGELOG.md:298` ghi "Tạo junction `.agents/` và đồng bộ sang VPS". `CHANGELOG.md:306` ghi "scp … và `.agents` sang VPS".
- Hook deploy dùng `git reset --hard`, không xóa file untracked, nên bản copy (nếu còn) vẫn tồn tại.
- Nếu VPS vẫn có `/app/.agents` và chạy cùng `server.js`, thì `/.agents/mcp_config.json` có khả năng trả 200 trên production, cùng cấu trúc với C1.
- **Hành động:** kiểm trực tiếp trên VPS (`ls`, và `curl -I` từ bên trong VPS). Nếu có, xóa `/app/.agents` và rotate C1. Báo cáo này không probe production.

**H7. SSH và SCP tới VPS dưới quyền root với `StrictHostKeyChecking=no`.** *(CONFIRMED)*
- `scripts/sync_videos_to_vps.py:28` (ssh `ls`) và `:59` (scp upload) đều dùng `-o StrictHostKeyChecking=no`, đăng nhập `root@<host>`.
- Host key đổi hoặc bị giả mạo sẽ được chấp nhận im lặng. Khi đó file video và lệnh đi tới một máy không phải VPS.
- **Đề xuất:** pin host key trong `known_hosts`, dùng user không phải root.

**H8. Rule firewall `H2DEV-8899` cho mọi profile (kể cả Public), và watchdog luôn bind `0.0.0.0`.** *(CONFIRMED về cấu hình; mức phơi nhiễm phụ thuộc mạng)*
- `scripts/windows/H2DEV-OneClick.cmd:44` và `scripts/windows/install-h2dev-startup.ps1:27` tạo rule `profile=any`.
- `scripts/windows/h2dev-watchdog.ps1:50, 57` và `h2dev-tray.ps1:60` đặt `HOST=0.0.0.0` mỗi lần khởi động, không có tùy chọn để tắt.
- Server không có xác thực (xem H1–H4, M2). Khi máy kết nối mạng Public (quán cà phê, khách sạn), các endpoint trong báo cáo có thể tới được từ mạng đó.
- Ghi chú: ý định mở LAN và Tailscale được ghi trong tài liệu. Vấn đề là profile Public được bao gồm và không có opt-in.
- **Đề xuất:** rule chỉ cho `profile=private` (và interface Tailscale nếu cần).

**H9. `install-market-skill.js` tải zip từ bên thứ ba và cài vào thư mục skill, không kiểm checksum.** *(CONFIRMED)*
- URL `https://lightmake.site/api/v1/download?slug=…` (`scripts/install-market-skill.js:16`). Redirect được theo khi đổi host (`:22–23`).
- Không có `sha256`, `createHash`, chữ ký hay allowlist host (grep xác nhận). Nội dung được giải nén và đặt vào thư mục skill của agent (`:41–51`).
- Ảnh hưởng: nội dung skill là chỉ dẫn cho agent, nên nội dung độc hại có thể thay đổi hành vi agent. Script chạy thủ công nên mức là High, không phải Critical.
- Zip-slip khi giải nén bằng `tar`: UNVERIFIED.
- **Đề xuất:** kiểm SHA256 đã biết, allowlist host, không theo redirect sang host khác.

**H10. Deploy xóa DB live rồi build lại, và không dừng khi build lỗi (nâng M5).** *(CONFIRMED về từng bước; chuỗi lỗi LIKELY)*
- `scripts/build_master_db.js:27–29` xóa `h2dev_master.db`, `-wal`, `-shm` mà không backup.
- `scripts/deploy/post-receive:23` gọi build không kiểm exit code (không có `set -e`). Dòng 34 (rollback) cũng không kiểm.
- `scripts/sync-counts.js:168` trả `skipped` khi thiếu DB, và guard "bỏ qua, không fail" (chú thích đầu file). Vì vậy DB thiếu thì guard vẫn xanh.
- `post-receive:40` reload PM2. Server không ghi DB (xem mục 3), nhưng route `/api/search` dùng `searchFts` sẽ lỗi khi thiếu DB, và `server.js:367` trả HTTP 200 kèm `error`, che lỗi đi.
- **Đề xuất:** `set -e` trong hook; build vào file tạm rồi rename; backup DB trước khi xóa; guard phải fail khi DB thiếu.

**H11. Khóa imgbb bị in ra console khi request lỗi.** *(CONFIRMED)*
- `pipelines/hoat-hinh-ai/scripts/generate_images.py:221` gửi khóa trong query string (`params={"key": IMGBB_API_KEY}`). File có bản sao byte-identical tại `skills/03-generating-character-and-background-images/scripts/generate_images.py`.
- `resp.raise_for_status()` (`:226`) tạo `HTTPError` có URL đầy đủ kèm `?key=…`. `except Exception as e: return None, str(e)` (`:230–232`) đưa chuỗi đó ra ngoài, và được in ở `:253, :271, :314`.
- Đã kiểm trong môi trường: `str(HTTPError)` chứa đúng chuỗi khóa (dùng khóa giả để kiểm, không dùng khóa thật).
- Trigger: mọi lỗi HTTP 4xx/5xx từ imgbb, kể cả 429. Lỗi timeout không in URL nên không lộ.
- Ảnh hưởng: khóa đi vào terminal, log và transcript. Khóa được đọc từ môi trường; agent không tìm thấy khóa sống trong file nào trong scope.
- **Đề xuất:** không in `str(e)` của lỗi HTTP (chỉ in `status_code`), hoặc gửi khóa qua header. Rotate khóa nếu đã thấy trong log.

**H12. Markdown tóm tắt được đưa vào `innerHTML` không escape.** *(CONFIRMED về đường đi; có điều kiện về dữ liệu)*
- `assets/app/main.js:2238–2239` fetch `*_summary_vi.md`. `inlineMdFull()` (`:2173–2184`) chỉ thay regex markdown, không escape. Kết quả được đưa vào `contentEl.innerHTML` (`:2352–2356`) khi người dùng bấm tab "Kịch bản AI".
- CSP có `script-src-attr 'unsafe-inline'` (`server.js:19`), nên thuộc tính `onerror=` trong HTML do file tóm tắt sinh ra sẽ chạy.
- Hiện tại: 0 trên 766 file `*_summary_vi.md` có ký tự `<`. Nội dung tóm tắt do LLM tạo từ transcript của video bên thứ ba, nên prompt injection có thể đưa HTML vào. Rủi ro là có điều kiện, không phải đang xảy ra.
- So sánh: `renderMarkdownDoc` trong `player-main.js` escape trước khi transform, nên không có lỗi tương tự. Đây là điểm không nhất quán giữa hai đường render markdown.
- **Đề xuất:** escape trước khi transform (theo mẫu `renderMarkdownDoc`), hoặc dùng renderer có sanitize. Bỏ `script-src-attr 'unsafe-inline'` (M3).

### MEDIUM

**M1. Null byte làm treo request.** *(CONFIRMED)*
- `GET /%00` không có phản hồi. `curl -m 5` hết giờ (exit 28). `/health` vẫn trả 200 sau đó, nên process không chết.
- Nguyên nhân: `server.js:433` decode thành `\0`. `server.js:650` gọi `fs.stat`, và `fs.stat` ném `ERR_INVALID_ARG_VALUE` đồng bộ (đã kiểm trên Node v24.14.0) bên trong handler `async` (`:285`). Lỗi chỉ rơi vào `unhandledRejection` (`:687`), response không bao giờ kết thúc.
- **Ảnh hưởng:** mỗi request giữ một socket. Nhiều request có thể làm cạn kết nối.
- **Đề xuất:** kiểm `\0` ngay sau decode và trả 400.

**M2. CORS `Access-Control-Allow-Origin: *` áp cho mọi response, kể cả dữ liệu riêng tư.** *(CONFIRMED)*
- `server.js:124, 262, 288, 416` đặt `*`. `/api/admin-state` (`:307`) đi qua `sendJson` (`:262`) nên cũng nhận `*`, và trả trạng thái đã xem, yêu thích và bài gần nhất.
- Điều này khuếch đại H1, C1, C2 khi trình duyệt của người trong LAN truy cập được server. Chrome Private Network Access có thể chặn một phần, nhưng không phải tất cả.
- **Đề xuất:** bỏ `*` cho `/api/*` và các file không phải static công khai.

**M3. CSP cho phép inline handler và style.** *(CONFIRMED)*
- `server.js:19`: `script-src-attr 'unsafe-inline'`. `server.js:20`: `style-src 'unsafe-inline'`.
- Đây là nền cho XSS khi kết hợp với `innerHTML` (kết quả agent client sẽ bổ sung ở mục 6.2).

**M4. Lỗi bị che thành thành công.** *(CONFIRMED)*
- `server.js:367`: `/api/search` trả **HTTP 200** kèm trường `error` thay vì 500.
- `spider_graph_engine.js:452–455`: `saveToDatabase` nuốt mọi lỗi và trả về object. Caller `:343` không đọc giá trị này.
- `spider_graph_engine.js:364, 450`: kết nối SQLite không đóng khi lỗi.

**M5. Deploy tiếp tục khi build DB thất bại.** *(CONFIRMED; gộp vào H10)*
- `scripts/deploy/post-receive:23` không kiểm exit code. Xem H10 để biết chuỗi đầy đủ.

**M6. `master_dal.js` tự test sẽ ghi vào DB thật.** *(CONFIRMED)*
- `master_dal.js:227–233`: chạy `node scripts/master_dal.js` trực tiếp sẽ `UPDATE lessons SET visual_audio_checked = 1 WHERE sku = 'VIDEO-73d98a'` trên `h2dev_master.db`, và có thể kích hoạt đồng bộ JSON.

**M7. Projection có thể lệch im lặng.** *(CONFIRMED)*
- `master_dal.js:178–179`: `exportProjections` chỉ xuất khi `lessons.length === C.videos`. Nếu lệch, hàm bỏ qua và không ghi log. Không có cảnh báo cho người vận hành.

**M8. Cache gzip có thể chiếm tới khoảng 600 MB RAM.** *(CONFIRMED về số liệu, LIKELY về tác động)*
- `server.js:75–76`: tối đa 120 entry. `server.js:202`: mỗi entry cho file dưới 5 MB. Trường hợp xấu nhất là khoảng 600 MB.

**M9. Thông báo lỗi làm lộ chi tiết nội bộ.** *(CONFIRMED)*
- `server.js:331, 350, 404, 577`: `err.message` được trả trực tiếp cho client. Có thể lộ đường dẫn và thông tin upstream.

**M10. `uncaughtException` giữ process sống sau lỗi không xác định.** *(CONFIRMED)*
- `server.js:684–686`. Trạng thái có thể đã hỏng nhưng process vẫn phục vụ request.

**M11. Khóa giải mã DRM được in ra console.** *(CONFIRMED)*
- `scripts/download_full_drm_audio.cjs:144`: `console.log` in `KID=… | KEY=…`. Output đi vào terminal và có thể vào log.

**M12. Thay đổi chỉ ghi DB bị mất khi rebuild.** *(LIKELY; agent báo, lead đọc một phần)*
- `scripts/update_voice_language_db.js:62` ghi `competitor_channels` nhưng không ghi JSON nguồn. `scripts/build_master_db.js` tái tạo DB từ JSON mỗi lần deploy, nên thay đổi này bị ghi đè ở lần deploy kế tiếp.

**M13. Ghi đè video không kiểm tra và không backup.** *(CONFIRMED, agent)*
- `scripts/download_h2dev_video.cjs:228` (`ffmpeg -y`) ghi đè `video/<SKU>/<SKU>.mp4`. `:289` `rmSync` thư mục tạm dựa trên SKU. SKU không được validate (`:7`), khác với `fetch_h2dev_video.cjs:34`.

**M14. Lỗi ssh làm upload lại toàn bộ và ghi đè file trên VPS.** *(CONFIRMED, agent)*
- `scripts/sync_videos_to_vps.py:31–35`: exit code ssh khác 0 trả về tập rỗng không có log. Mọi thư mục local khi đó trông như thiếu và được upload bằng `scp -r` vào thư mục video live (`:47–79`), ghi đè file đã có.

**M15. Ghi JSON không atomic lên `data-tabs/` và `data/`.** *(CONFIRMED, agent)*
- Khoảng chín script ghi thẳng, không dùng file tạm rồi rename. Ví dụ: `scripts/mark_dead_channels.js:33, 57`; `write_voice_dna_to_tabs.js:52, 63`; `intake-inbox.js:99`; `sync_insights_to_catalog.py:48, 63, 95`. Crash giữa chừng để lại JSON bị cắt, và app đọc file đó.

**M16. Ghi kiểu truncate-before-serialize.** *(CONFIRMED, agent)*
- `json.dump(x, open(p, 'w'))` ở `scripts/add_market_tags.py:75, 86, 96`; `normalize_terminology.py:62`; `record_review_evidence.py:51`; `update-raw-records.py:470`. Lỗi giữa `dump` (giá trị không serialize được, hết đĩa) để lại file rỗng hoặc dở.

**M17. `fetch_h2dev_video.cjs --apply` không kiểm exit code của ffprobe.** *(CONFIRMED, agent)*
- `:168–172` chỉ parse stdout. `:180` chấp nhận nếu kích thước ≥ 80% bản cũ. `:183` `copyFileSync` đè MP4 không backup. Một file hỏng có kích thước gần bằng sẽ được áp dụng.

**M18. `ai_video_deep_analyzer.js --apply` ghi output LLM vào dữ liệu app.** *(CONFIRMED về đường đi; UNVERIFIED về rủi ro render)*
- `:305–327` ghi vào `data/video_insights.json`, `catalog.json`, `catalog_full.json`, `data-tabs/videos.json`, mỗi file một lần đọc-sửa-ghi, không backup. Input LLM có transcript scrape (`:119`), nên nội dung không tin cậy đi vào dữ liệu app. Việc app có render các trường này như HTML hay không: UNVERIFIED.

**M19. Lỗi đọc JSON nguồn bị nuốt, transaction vẫn commit.** *(CONFIRMED, agent)*
- `scripts/build_master_db.js:519, 526, 530, 720–722`: lỗi parse production_toolkit.json, voice_profile.json và file top-video theo kênh bị nuốt. Dữ liệu lỗi thành dòng thiếu, và transaction vẫn commit (`:726`).

**M20. `generate_videos.py` đặt manifest về rỗng khi đọc lỗi.** *(CONFIRMED, agent)*
- `pipelines/hoat-hinh-ai/scripts/generate_videos.py:401–402`: `except (OSError, json.JSONDecodeError)` đặt manifest về `{}`, rồi `:450–452` ghi đè file. Toàn bộ URL composite đã lưu bị mất. Trigger: manifest hỏng, hoặc bị khóa bởi sync hay antivirus.

**M21. Manifest chỉ ghi cuối Phase 1, Ctrl-C làm mất URL composite đã trả phí.** *(CONFIRMED, agent)*
- `generate_videos.py:450–452` ghi sau khi mọi job xong. Ngắt giữa chừng làm mất URL của các composite đã hoàn thành. Lần chạy lại đánh dấu các shot đó FAILED (`:245–246`). SKILL.md nói có khả năng resume, nhưng điều này không đúng.

**M22. Vòng poll của ton-giao không bắt lỗi HTTP.** *(CONFIRMED, agent)*
- `pipelines/ton-giao/skill-tao-video-Youtube-ton-giao/scripts/generate_image.py:119–120` gọi `raise_for_status()` không có try. Một lỗi 5xx hoặc 429 thoáng qua làm script chết sau khi task trả phí đã được gửi. `task_id` không được in trước khi poll (`:218–219`).

**M23. Tiêu đề viral của wildlife là danh sách cố định nói về voi, tê giác, trâu.** *(CONFIRMED)*
- `pipelines/wildlife/scripts/generate_wildlife_script.py:117–128`. Chạy với `--animal` khác elephant vẫn ra tiêu đề sai.

**M24. Tên bảo tàng và khẳng định lịch sử được hardcode, không có nguồn.** *(CONFIRMED hardcode; độ chính xác UNVERIFIED)*
- `pipelines/everyday-history/scripts/generate_everyday_history.py:28, 46, 64, 88` ghi "Museum Citations" vào `script.md` và `prompts.json`. README nói các bảo tàng đã được xác minh, nhưng script không kiểm tra gì.

**M25. Một lần yt-dlp timeout làm hỏng cả kênh được archive.** *(LIKELY)*
- `knowledge-hub/scripts/archive_yt_channel.py:38, 95`: `TimeoutExpired` không được bắt. `meta.json` và `urls.txt` cấp kênh không bao giờ được ghi.

**M26. `videoId` được nội suy không escape vào `href`, `src` và `innerHTML`.** *(CONFIRMED path; trigger hiếm)*
- `assets/app/main.js:2500, 2505, 2445, 1585, 1596`. `data-vid` được escape khi render (`:1606, 1802, 1839, 1847`), nhưng `getAttribute` (`:2601–2604, 2622`) trả về giá trị đã decode và các hàm dựng modal nội suy trực tiếp. YouTube ID thường dài 11 ký tự, nên khả năng thấp.

**M27. Link markdown trong trang tài liệu không có allowlist scheme.** *(CONFIRMED path; CSP chặn thực thi)*
- `assets/app/player-main.js:910` (`[text](url)` thành `<a href="$2">`), `:964–986` fetch tài liệu vào `innerHTML`, `:972` `rawLink.href = filePath`. Trigger: `docs[].file` trong catalog trỏ tới `.md` có `javascript:` hoặc `data:`. CSP `script-src 'self'` là lớp phòng thủ; chưa kiểm trên trình duyệt.

**M28. `/api/admin-state` không xác thực; client gộp trạng thái server vào localStorage.** *(CONFIRMED, latent)*
- `server.js:302–307` (GET không xác thực). Client gộp dữ liệu này ở ba nơi: `assets/h2dev-core.js:137–169`, `assets/app/main.js:368–400`, `assets/app/player-main.js:672–700`. Ba bản đã khác nhau (chỉ bản core kiểm `writable`), nên có nguy cơ lệch.
- `data/admin-state.json` không tồn tại trong bản này, nên hiện chưa có lộ. Nếu file xuất hiện, route tĩnh sẽ phục vụ nó vì không có deny rule (`server.js:585–615`). Agent chỉ kiểm sự tồn tại, không đọc nội dung.

### LOW / TECH DEBT

- **T1.** `master_dal.js:20–33`: mỗi lần đọc mở kết nối mới, chạy `PRAGMA journal_mode = WAL` và `mmap_size = 30000000000`. Chi phí không cần thiết.
- **T2.** `spider_graph_engine.js:13`: import `execFile` không được dùng.
- **T3.** `scripts/logrotate.js:142–160`: khi server khởi động, mọi `*.log` trong `D:\YTB` (ngoài repo) bị chuyển sang `_archive/logs-automated`. Side effect ngoài phạm vi repo, không được ghi trong `TREE.md`.
- **T4.** `server.js:471–476`: `/lotrinh` đọc và parse `catalog.json` đồng bộ mỗi request.
- **T5.** `server.js:404`: nhánh `/live/` trả `err.message` trong text response (đã gộp vào M9, ghi lại để tiện tra cứu).
- **T6.** `scripts/install-market-skill.js:41–51` và `scripts/download_h2dev_video.cjs:228–232`: đường dẫn được nội suy vào chuỗi shell của `execSync`. Agent xác nhận: SKU và slug từ argv chưa validate. Trong PowerShell, `install-market-skill.js:45, 51` có thể bị vỡ bởi dấu `'`. Mức ảnh hưởng phụ thuộc vào việc người vận hành có truyền ký tự đặc biệt hay không.
- **T7.** `scripts/ai_video_deep_analyzer.js:31`: dùng `execSync` chạy inline Python để đọc khóa API đang hoạt động từ SQLite của một ứng dụng khác (`9router`). Đây là kiểu SCAR-002 và là đọc credential từ nơi không thuộc dự án.
- **T8.** `scripts/update_voice_dna_db.js:20` dùng `inFile` nhưng không khai báo (chỉ có `fileIdx` ở `:11`). Đường mặc định ném `ReferenceError`; chỉ `--from-verify` chạy được. *(CONFIRMED)*
- **T9.** `scripts/mcp-http-proxy.js:15–17, 31`: Bearer token truyền qua argv, lộ trong danh sách tiến trình cho cùng user. *(CONFIRMED, agent)*
- **T10.** `scripts/windows/H2DEV-OneClick.cmd:37–38` dừng bất kỳ process nào đang giữ cổng 8899 mà không kiểm danh tính. Gợi ý `taskkill /f /im node.exe` (`install-h2dev-watchdog.ps1:106`) sẽ giết mọi Node process. *(CONFIRMED, agent)*
- **T11.** `scripts/clean-root-to-tree.js:20–26, 118–119`: `rename` đè file đích có sẵn; script migration một lần ngày 2026-08-18. *(LIKELY)*
- **T12.** Đường dẫn tuyệt đối cứng: `D:/Linly-Dubbing/bin/ffmpeg.exe` ở 4 file (`download_full_drm_audio.cjs:14–15`, `download_h2dev_video.cjs:8–9`, `fetch_h2dev_video.cjs:44–45`, `verify_takeaway_claims.cjs:26`); đường dẫn profile và scratch; IP VPS hardcode trong `sync_videos_to_vps.py:14` (không in lại ở đây); thư mục audit `20260918`. *(Tech debt)*

- **T13.** Giá trị thô đi vào `innerHTML` ở `assets/app/main.js:1172, 1183, 1602, 1821, 1614, 1833, 1885, 1891` (nguồn là OCR ảnh chụp kênh và JSON pipeline). Khả năng thấp. *(CONFIRMED path)*
- **T14.** `decodeURIComponent` không có try: `assets/app/player-main.js:40, 44`; `main.js:1129`; `tabs/content.js:1722`. Handle có `%` lẻ (ví dụ "100%") làm render lỗi và hiện thẻ lỗi chung (`main.js:833–836`). URL có `%` sai làm dừng script player. *(CONFIRMED)*
- **T15.** Catch im lặng không log: `assets/h2dev-core.js:105, 107`; `main.js:399`; `player-main.js:95`; `sw-register.js:8`. `saveCheck` (`ui-core.js:74`) không có try, được gọi từ `onchange` (`main.js:811`), nên lỗi localStorage thành uncaught exception và checkbox không được lưu. *(CONFIRMED)*
- **T16.** Race ở gợi ý tìm kiếm: `assets/app/search.js:9, 16, 20` (request bị abort vẫn đặt `inflight = null` sau khi request mới đã gán); `tabs/content.js:394–398, 1431–1437` (promise đã abort vẫn render lại với giá trị cũ). Phản hồi trả không đúng thứ tự có thể để lại gợi ý của truy vấn cũ trên màn hình. *(LIKELY, đọc code)*
- **T17.** Hai bản `scripts/` và `skills/05/` của `generate_videos.py`, `merge_clips.py` đã lệch nhau theo cả hai chiều: `scripts/` có kiểm tra ffprobe mà `skills/05` không có, còn `skills/05` có kiểm tra output cuối mà `scripts/` không có. README cài `skills/` vào `~/.claude/skills`, nên bản đó mới là bản chạy thật. Sửa một bản thì bản kia không được sửa theo. *(CONFIRMED)*
- **T18.** Docs nói những thứ code không làm: `MAX_RETRIES=3` (không có hằng số, không có retry job), `VIDEOS_OUTPUT_DIR` (không script nào đọc), `assets/.env.example` (thư mục không tồn tại), Ken Burns và crossfade trong docstring (chưa có). Pipeline `wildlife` thiếu bước voice và merge. `requirements.txt` của hai pipeline khai báo gói không được import. *(CONFIRMED)*
- **T19.** Pipelines: ID và đường dẫn từ đối số hoặc LLM không được validate: `generate_images.py:303, 323`; `generate_videos.py:372, 435, 488`; `archive_yt_channel.py:43–45, 62–66`; `make_nlm_batch.py:24, 31`. Ghi file ngoài dự án cần ID chứa `..` hoặc `/`, khả năng khai thác thấp. Concat list của ffmpeg không escape dấu `'` (`assemble_history_video.py:68, 71`; `merge_clips.py:118`), đường dẫn có `'` làm lỗi. Kiểm tra placeholder ở `generate_images.py:83–84` tìm `your_kie_api_token_here`, nhưng template dùng `your_kie_api_key_here`, nên token chưa sửa vẫn qua kiểm tra và thất bại ở HTTP 401. *(CONFIRMED)*

### Điểm được kiểm tra và xác nhận là đúng

- **Chặn đúng (đã HEAD probe):** `/.env` → 403, `/data/intelligence.db` → 403, `/data/h2dev_master.db-wal` → 403, `/_archive/` → 403, `/_private/` → 403, `/scripts/logrotate.js` → 404 và `/Scripts/logrotate.js` → 404 (chữ hoa vẫn bị chặn), `/%2e%2e/etc/passwd` → 404.
- **SQL tham số hóa:** `master_dal.js:39–49, 162–167` và `spider_graph_engine.js:366–389` đều dùng prepared statement. `update_voice_language_db.js` nối tên cột nhưng tên cột là literal cố định, giá trị vẫn tham số hóa (agent xác nhận).
- **FTS được làm sạch:** `master_dal.js:157–160` loại bỏ ký tự đặc biệt, nên không có FTS injection qua dấu `"`.
- **Python không dùng `shell=True`:** `git grep` không tìm thấy mẫu này trong các file tracked, và mọi subprocess dùng mảng tham số (agent xác nhận, không có `os.system`).
- **Không tắt xác thực TLS** trong `scripts/` (agent kiểm: không có `rejectUnauthorized:false`, `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED`, `CERT_NONE`). Ngoại lệ là H7 (`StrictHostKeyChecking=no`, không phải TLS).
- **Không có `Remove-Item -Recurse`** trong `scripts/`.
- **`sync-counts.js --check` là chỉ đọc** (ghi bị chặn bởi `!check`, `:316` và `:359`).
- **Hook deploy có guard counts và rollback** (`post-receive:26–35`), dù có khe hở ở H10.
- **Header bảo mật cơ bản** được áp dụng cho static (`server.js:11–31`).

---

## 5. Đánh giá tổng thể và khuyến nghị

**Điểm mạnh:** SQL tham số hóa, FTS được làm sạch, có guard số liệu khi deploy, không tắt xác thực TLS, log rotation có giới hạn retention, ghi chú lý do cho từng quyết định bảo mật trong `server.js`.

**Điểm yếu cốt lõi:** bảo mật theo kiểu denylist và so sánh chuỗi. Cách này đã bị vượt qua ba lần (symlink, thư mục gitignored không có trong danh sách, và `_tools` nằm ngoài danh sách). Mỗi thư mục mới hoặc symlink mới đều là một lỗ hổng tiềm ẩn. Thứ hai là **secret được đặt thẳng trong mã** ở ít nhất ba chỗ (`load-keys.js`, `ai_video_deep_analyzer.js`, và các literal trong docs), dù đã có `.env` và `load-keys.js` làm nơi tập trung.

**Thứ tự ưu tiên đề xuất (chưa áp dụng):**
1. Rotate khóa `mcp-pool`. Xóa fallback ở `scripts/load-keys.js:40`. Xóa literal khỏi 4 file.
2. Rotate khóa 9Router. Xóa literal ở `scripts/ai_video_deep_analyzer.js:34`. Nếu repo công khai, làm việc này trước tiên.
3. Thu hồi hoặc thay CDM `device.wvd`. Đưa `_tools/` và `.agents/` ra ngoài thư mục phục vụ.
4. Thay denylist bằng allowlist. Kiểm `fs.realpathSync` nằm dưới `ROOT`.
5. Kiểm trực tiếp VPS: `/app/.agents`, `/app/_tools`. Xóa nếu có.
6. Firewall: rule `H2DEV-8899` chỉ cho `profile=private`.
7. `post-receive`: `set -e`; backup DB trước khi xóa; build vào file tạm rồi rename.
8. SSH tới VPS: pin host key, bỏ `StrictHostKeyChecking=no`, dùng user không phải root.
9. `/live/`: thêm `withSecure`, thêm timeout, xác nhận entitlement với upstream.
10. Spider: validate `seed`, đổi sang POST hoặc thêm token, rate limit.
11. Xóa KID:KEY khỏi `CHANGELOG.md:90`. Bỏ `console.log` khóa ở `download_full_drm_audio.cjs:144`.
12. `/%00`: trả 400. Bỏ CORS `*` cho `/api/*`.
13. Rotate khóa imgbb (H11). Không in `str(e)` của lỗi HTTP; chỉ in `status_code`.
14. Escape markdown tóm tắt trước khi transform (H12), theo mẫu `renderMarkdownDoc`. Bỏ `script-src-attr 'unsafe-inline'` (M3).

**Lưu ý khi phát triển tiếp (chống hồi quy):**
- Mọi thư mục hoặc symlink mới trong ROOT đều được phục vụ nếu không nằm trong danh sách chặn. Hãy kiểm lại `/<thư-mục>/` sau khi thêm.
- Không đặt giá trị secret vào file tracked, kể cả làm fallback. `load-keys.js` và `ai_video_deep_analyzer.js` đều có fallback, nên đây là lỗi lặp lại.
- Không dùng `execSync` với chuỗi nội suy. Dùng `execFile` với mảng tham số.
- Ghi JSON bằng file tạm rồi rename. Không dùng `open(p, 'w')` trước khi serialize.
- Quét bí mật bằng regex có đủ `-` và `_` trong ký tự lớp (`[A-Za-z0-9_-]`). Regex hẹp đã bỏ sót một khóa trong lần quét này.

---

## 6. Kết quả các agent đọc sâu

### 6.1 `scripts/` — đã hoàn thành (110 file)

- **Phạm vi thực tế:** 110 file, không phải 97. Đã đọc đầy đủ 11 file (`ai_video_deep_analyzer.js`, `install-market-skill.js`, `download_full_drm_audio.cjs`, `download_h2dev_video.cjs`, `fetch_h2dev_video.cjs`, `get_drm_key.py`, `verify_takeaway_claims.cjs`, `mcp-http-proxy.js`, `deploy/post-receive`, `sync_videos_to_vps.py`, `update_voice_dna_db.js`), đọc một phần khoảng 14 file, phần còn lại grep.
- **Lead đã xác minh lại mọi mục High của agent** trước khi đưa vào báo cáo:
  - C3 (khóa 9Router): xác nhận vị trí, commit `87b0bb3`, và việc có trên ba remote. Phát hiện này cũng cho thấy quét regex trước của lead đã bỏ sót.
  - H7 (`StrictHostKeyChecking=no`), H8 (firewall `profile=any`), H9 (supply chain): xác nhận từng dòng.
  - H10 (xóa DB và không dừng khi lỗi): xác nhận `build_master_db.js:27–29`, `post-receive:23`, `sync-counts.js:168`.
- **Đã nâng hoặc hạ mức:** H10 gộp M5 và được nâng lên High vì chuỗi có thể để production chạy với DB thiếu.
- **Chưa xác minh:** zip-slip khi giải nén (UNVERIFIED); mức render HTML của dữ liệu LLM (UNVERIFIED); phần file còn lại chỉ được grep.

### 6.2 Client JS (`assets/`) — đã hoàn thành

- **Phạm vi:** `assets/app/**` (17 file), `assets/learn.js`, `assets/h2dev-core.js`, `assets/music_player_modal.js`, và inline script trong `index.html`, `player.html`, `learn.html`.
- **Đã đọc:** 14 file đầy đủ. `main.js`, `content.js` và `player-main.js` đọc theo vùng sink và qua grep. Ba file HTML chỉ grep (script, handler, sink).
- **Không có:** `eval`, `new Function`, `document.write`, `postMessage`, `setInterval`, khóa hoặc token trong client, inline `<script>` trong HTML.
- **Service worker đúng:** `/api/` và non-GET bị loại trước khi cache, chỉ cache response `res.ok`, và 27 asset precache đều tồn tại.
- **Lead đã xác minh mục High:** H12 (`main.js:2173–2184, 2238–2239, 2352–2356`).
- **Medium và Low:** M26–M28, T13–T16.

### 6.3 `pipelines/` và `knowledge-hub/scripts/` — đã hoàn thành

- **Phạm vi và quy tắc:** 12 file Python đọc đầy đủ; 3 bản sao skill được so khớp bằng diff. Không đọc `.env` hoặc `.env.*`, chỉ đọc `.env.example` (giá trị placeholder). Không mở 5 file zip (chỉ liệt kê tên).
- **Không có:** khóa sống trong file nào của scope, `shell=True`, `verify=False`, `pickle`, `eval`, `yaml.load`. Mọi `requests` đều có timeout. Mọi subprocess dùng dạng list.
- **Lead đã xác minh mục High:** H11 (`generate_images.py:221, 226, 230–232, 253, 271, 314`).
- **Chất lượng và độ tin cậy:** M20–M25 (manifest, resume, poll, tiêu đề cố định, tên bảo tàng, timeout yt-dlp). Drift giữa `scripts/` và `skills/05/` (T17).
- **Docs và độ hoàn thiện:** T18. Pipeline `wildlife` thiếu bước voice và merge. `bible-explainer` chỉ có docs và zip, không có code.
- **Medium và Low:** M20–M25, T17–T19.

---

## 7. Phạm vi kiểm tra đã đạt

| Hạng mục | Trạng thái |
|---|---|
| `server.js` (toàn bộ) | Đã đọc đầy đủ |
| Module tầng request (`master_dal`, `spider`, `live_resolver`, `logrotate`, `load-keys`, `get_drm_key.py`) | Đã đọc đầy đủ |
| Deploy hook | Đã đọc đầy đủ |
| `scripts/` (110 file) | Đã hoàn thành (11 đầy đủ, ~14 một phần, còn lại grep); mục High đã xác minh lại |
| Probe HTTP local | Đã thực hiện, chỉ HEAD |
| Probe production | **Không thực hiện** (ngoài phạm vi) |
| Client JS (`assets/`) | Đã hoàn thành (mục 6.2); H12 đã xác minh |
| `pipelines/`, `knowledge-hub/scripts/` | Đã hoàn thành (mục 6.3); H11 đã xác minh |
| `video/`, `data/`, `_backup/`, `_archive/`, `_audit/`, `.venv-gpu/`, `node_modules/` | Chỉ inventory |
| Build, test, lint | Không chạy (CI xử lý) |

---

## 8. Ghi chú

- Trong quá trình làm việc có một lệnh liệt kê nhầm thư mục sandbox của MCP pool (ngoài dự án). Không mở hoặc đọc file nào ở đó.
- Báo cáo này không sửa mã nguồn, không thay đổi cấu hình, không commit.
- Một lần GET không xác thực tới `api.github.com` để kiểm trạng thái công khai repo (xem C3).

### 8.1 Thay đổi không mong đợi trong working tree (chưa rõ nguồn gốc)

Lúc bắt đầu, `git status` ghi nhận working tree sạch. Trong lúc kiểm tra, các file untracked sau xuất hiện (mtime 03:53–03:57, trong khoảng thời gian các agent đang chạy). Lead không tạo chúng bằng lệnh nào. Nguồn gốc là UNVERIFIED. Không xóa, không sửa, không commit.

| File | Kích thước | Ghi chú |
|---|---|---|
| `assets/thumbs/VIDEO-043d15.png`, `VIDEO-0be6c9.png`, `VIDEO-a59a5e.png`, `VIDEO-a85eac.png` | ~42 KB mỗi file | Ảnh thumbnail mới |
| `scripts/_check_streams.cjs` | 1,9 KB | Script |
| `scripts/_get_next_details.cjs` | 0,9 KB | Script |
| `scripts/fetch_h2dev_video_crypto.cjs` | 10,9 KB | Script (có liên quan đến luồng tải video mã hóa) |
| `scripts/_matched_courses.json` | 2 byte | Gần như rỗng |
| `scripts/_keys_dump.json` | 261 KB | **Cần chú ý.** Tên gợi ý dữ liệu khóa. Chứa 334 dòng khớp mẫu chuỗi dài (đếm bằng regex rộng, chưa xác định là khóa hay ID thông thường). **Không nằm trong `.gitignore`**, nên `git add -A` sẽ commit file này. |

- **Hành động đề xuất:** xác định ai hoặc tiến trình nào tạo các file này. Với `_keys_dump.json`, kiểm nội dung thủ công trong môi trường cục bộ (không đưa vào báo cáo), sau đó chuyển ra ngoài repo hoặc thêm vào `.gitignore`.
- Các file này nằm trong `scripts/`, nên server trả 404 (`server.js:644`). `assets/thumbs/*.png` được phục vụ bình thường.
