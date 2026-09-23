# H2DEV — BẢNG MAPPING EMOJI → ICON LUCIDE (Phase 3)

> **Ngày lập:** 2026-09-23 · **Trạng thái:** approved (anh đã chốt: em tự quyết, anh nghiệm thu kết quả)
> **Nguyên tắc:** thay **emoji trong UI thật** → `.h2-icon`. **GIỮ NGUYÊN** quốc kỳ (dữ liệu ngôn ngữ) và emoji trong **comment** (không hiện UI).
> **Đo được:** 375 emoji / 79 loại / 16 file.
>
> ⚠️ **CẬP NHẬT 2026-09-23 (sau P3.5):** anh đã **đổi quyết định** cho hệ đèn báo YPP — xem Mục 2b.
> Số liệu ở bảng dưới là **đo ban đầu**; số thực tế từng file có thể lệch (vd `music_player_modal.js` đo lại = **41**, không phải 44).
>
> ✅ **HOÀN TẤT 2026-09-23 (P3.6):** đã quét sạch `content.js` (126), `main.js` (155), `search.js`.
> Tổng còn lại **0 emoji trang trí** trong DOM toàn bộ 10 tab (Playwright đo: 0/10 tab có emoji).
> Chi tiết quyết định riêng của P3.6 → xem **Mục 2d** (bên dưới Mục 2c).

---

## 1. QUY TẮC THAY (BẮT BUỘC)

| # | Quy tắc |
|---|---|
| 1 | Emoji trong **HTML template / JS render ra DOM** → thay bằng `<span class="h2-icon h2-icon--16" data-h2i="ten"></span>` |
| 2 | Emoji trong **string JS dùng làm textContent** (nút copy đổi nhãn) → **BỎ emoji**, giữ chữ. Vì đổi textContent thì icon bị xoá theo. |
| 3 | Emoji trong **`<option>` của `<select>`** → **BỎ**, giữ chữ (không nhét được icon vào option). |
| 4 | Emoji trong **CSS `content:`** → thay bằng `mask` hoặc bỏ. |
| 5 | **QUỐC KỲ** (🇺🇸🇯🇵🇻🇳…) → **GIỮ NGUYÊN** |
| 6 | Emoji trong **comment** → **GIỮ NGUYÊN** (không hiện UI) |
| 7 | Emoji là **icon trong object config** (`icon: '⏱️'`) → đổi value thành **tên icon** (`icon: 'timer'`), rồi chỗ render dùng `data-h2i` |
| 8 | Kích thước: mặc định `--16`; trong title/heading lớn dùng `--20`/`--24`; trong nút nhỏ dùng `--14` |
| 9 | Phải thêm `aria-hidden="true"` khi icon chỉ trang trí (đã có chữ bên cạnh) |
| 10 | **Nếu chuỗi vừa HIỂN THỊ vừa làm KEY** (vd `data-market-chip="🌐 Ngoại"` để so khớp `state.marketFilter`): **`value`/`data-*` GIỮ NGUYÊN emoji, chỉ strip khi in ra chữ**. TUYỆT ĐỐI không strip ở key → gãy filter. |

---

## 1b. HÀM DÙNG CHUNG (BẮT BUỘC — không tự viết lại)

| Hàm | Nơi định nghĩa | Dùng khi |
|---|---|---|
| `ico(name, size)` | `assets/h2dev-core.js` (`window.H2Core.ico`) + inject qua deps vào `content.js` | Sinh thẻ `<span class="h2-icon ...">` |
| `stripDecorEmoji(s)` | `assets/h2dev-core.js` (`window.H2Core.stripDecorEmoji`) + inject qua deps | Bỏ emoji trang trí, **GIỮ quốc kỳ** |
| `ico()` bản local | `assets/app/player-main.js` | Trang player không load h2dev-core |

> **Cấm** thêm bản sao thứ 3. Nếu cần ở file mới → export qua `window.H2Core` hoặc thêm vào `deps` của `content.js`.

---

## 2. BẢNG MAPPING CHÍNH (79 loại)

| Emoji | CP | Số | Icon Lucide | Lập luận / Phản biện |
|---|---|---|---|---|
| 📋 | 1F4CB | 25 | `clipboard` | Copy/sao chép → clipboard. ✅ Đúng ngữ nghĩa. |
| → | 2192 | 27 | `arrow-right` | Mũi tên điều hướng. ⚠️ **PHẢN BIỆN:** đây là ký tự ASCII-ish trong câu chữ ("Xem tiếp →"), thay bằng icon sẽ làm câu văn gãy. **Giữ nguyên** khi nằm giữa câu; chỉ thay khi là nút độc lập. |
| ↗ | 2197 | 27 | `arrow-up-right` | "Mở tab mới" → external-link/arrow-up-right. ⚠️ Nhiều chỗ nằm cuối câu text → **giữ** nếu trong câu. |
| ✅ | 2705 | 15 | `check-circle` | Hoàn thành. ⚠️ CP này là **string đổi nhãn nút copy** (quy tắc 2) → **BỎ emoji, giữ chữ "Đã sao chép!"** để không phá icon. |
| ▶ | 25B6 | 12 | `play` | Nút phát. ✅ Thay. |
| ✕ | 2715 | 12 | `x` | Nút đóng. ✅ Thay. |
| 📄 | 1F4C4 | 10 | `file-text` | Tài liệu. ✅ |
| ⚡ | 26A1 | 10 | `zap` | Nhanh/công thức. ✅ |
| ✓ | 2713 | 9 | `check` | Đã xem. ⚠️ CSS `content:"✓"` → dùng mask icon. |
| 📺 | 1F4FA | 9 | `tv` | YouTube/Top video. ✅ |
| ⚠️ | 26A0 | 8 | `alert-triangle` | Cảnh báo. ✅ |
| 🎬 | 1F3AC | 8 | `clapperboard` | Scene/video. ✅ |
| 👁️ | 1F441 | 6 | `eye` | Lượt xem. ✅ |
| ⏳ | 23F3 | 6 | `hourglass` | Đang dở. ⚠️ Trong `<option>` → **BỎ**. |
| ⬇️ | 2B07 | 5 | `download` | Tải về. ✅ |
| 🔴 | 1F534 | 5 | `alert-triangle` | ~~GIỮ~~ → **ĐỔI (xem Mục 2b):** anh chốt thay bằng icon + giữ màu qua `color`. |
| 🟢 | 1F7E2 | 4 | `shield-check` | → **ĐỔI (Mục 2b)** |
| 🟡 | 1F7E1 | 2 | `alert-circle` | → **ĐỔI (Mục 2b)** |
| 🟠 | 1F7E0 | 1 | `alert-circle` | → **ĐỔI (Mục 2b)** |
| 📜 | 1F4DC | 5 | `scroll-text`❌ | Không có `scroll-text` trong bộ 213. → dùng `file-text`. ✅ |
| 🎧 | 1F3A7 | 4 | `headphones`❌ | Không có. → dùng `music`. ⚠️ Hoặc thêm SVG `headphones` mới. |
| 🛡️ | 1F6E1 | 4 | `shield` | Phòng thủ YPP. ✅ |
| 🔍 | 1F50D | 4 | `search` | Tìm kiếm. ⚠️ Trong `placeholder` của input → **BỎ** (không nhét icon vào placeholder). |
| 🎙️ | 1F399 | 4 | `mic` | Voice DNA. ✅ |
| 📦 | 1F4E6 | 4 | `package` | Trọn bộ. ✅ |
| 🎯 | 1F3AF | 4 | `target` | CTR. ✅ |
| 🔥 | 1F525 | 4 | `flame` | Nổi bật. ✅ |
| 🌐 | 1F310 | 4 | `globe` | Ngôn ngữ. ✅ |
| 📸 | 1F4F8 | 4 | `camera`❌ | Không có `camera`! → dùng `image`. ✅ |
| 🇺🇸🇯🇵🇻🇳… | 1F1** | 10 | — | **QUỐC KỲ = DỮ LIỆU NGÔN NGỮ → GIỮ NGUYÊN** |
| 🚪 | 1F6AA | 4 | `door-open`❌ | Không có. → dùng `door` ❌ cũng không. → dùng `shield`. ⚠️ Hoặc `circle-dot`. Cân nhắc thêm SVG. |
| ← | 2190 | 3 | `arrow-left` | Quay lại. ✅ Thay (nút độc lập). |
| ⏱️ | 23F1 | 3 | `timer` | Mốc thời gian. ✅ Đổi config `icon:'timer'` |
| 💡 | 1F4A1 | 3 | `lightbulb`❌ | Không có! → `info`. ⚠️ Cân nhắc thêm SVG `lightbulb`. |
| ✨ | 2728 | 3 | `sparkles` | ✅ |
| 📊 | 1F4CA | 3 | `bar-chart-3` | ✅ |
| 🚀 | 1F680 | 3 | `rocket` | ✅ |
| 📅 | 1F4C5 | 3 | `calendar` | ✅ |
| 👤 | 1F464 | 3 | `user` | ✅ |
| 🏷️ | 1F3F7 | 3 | `tag` | ✅ |
| ▼▲ | 25BC/25B2 | 5 | `chevron-down`/`chevron-up` | ✅ (thay cả `group-open:rotate-180` – cần đổi class) |
| 🧠 | 1F9E0 | 2 | `brain` | ✅ |
| ⬜ | 2B1C | 2 | `square` | Chưa xem. ✅ |
| ↺ | 21BA | 2 | `rotate-ccw` | Xoá/đặt lại. ✅ |
| 🏮 | 1F3EE | 2 | `flame` | Cổ trang. ⚠️ trong option → BỎ |
| 🕵️ | 1F575 | 2 | `fingerprint` | Dark crime. ⚠️ option → BỎ |
| 🏛️ | 1F3DB | 2 | `landmark` | Lịch sử. ⚠️ option → BỎ |
| 🌌 | 1F30C | 2 | `moon` | Triết lý. ⚠️ option → BỎ |
| 🔮 | 1F52E | 2 | `gem` | Tiên tri. ⚠️ option → BỎ |
| 🐾 | 1F43E | 2 | `paw-print` | Sinh tồn. ⚠️ option → BỎ |
| ⚔️ | 2694 | 2 | `shield` | Quân sự. ⚠️ option → BỎ |
| 🎨 | 1F3A8 | 2 | `palette` | Visual kit. ✅ |
| 📝 | 1F4DD | 2 | `file-edit` | Kịch bản. ✅ |
| 🎓 | 1F393 | 2 | `award`❌ | Không có `graduation-cap`. → `award`. ⚠️ Cân nhắc thêm SVG. |
| 📌 | 1F4CC | 2 | `pin` | Điểm chính. ✅ |
| 💰 | 1F4B0 | 2 | `coins` | Doanh thu. ✅ |
| 🎭 | 1F3AD | 2 | `theater` | Faceless. ✅ |
| 💬 | 1F4AC | 1 | `message-circle` | Phụ đề. ✅ |
| ❤ | 2764 | 1 | `heart` | Yêu thích. ✅ |
| 📁 | 1F4C1 | 1 | `folder` | Thư mục. ✅ |
| 📑 | 1F4D1 | 1 | `file-text` | Tất cả tài liệu. ✅ |
| ◌ | 25CC | 1 | `circle` | Tín hiệu. ⚠️ trang trí → có thể bỏ |
| 🛠️ | 1F6E0 | 1 | `wrench` | Tech stack. ✅ |
| 📂 | 1F4C2 | 1 | `folder-open` | Repo. ✅ |
| 📈 | 1F4C8 | 1 | `trending-up` | Tăng trưởng. ✅ |
| 🕒 | 1F552 | 1 | `clock` | Tuổi video. ✅ |
| ○ | 25CB | 1 | `circle` | Trạng thái. ✅ |
| ↳ | 21B3 | 1 | `corner-down-right`❌ | Không có. → `arrow-right`. ⚠️ Hoặc bỏ (trang trí) |
| ⚙ | 2699 | 1 | `settings` | Cấu hình. ✅ |
| 🔎 | 1F50E | 1 | `search` | Tìm kiếm. ⚠️ trong JS search icon map → đổi thành tên icon |

---

## 2b. QUYẾT ĐỊNH MỚI: HỆ ĐÈN BÁO YPP (2026-09-23)

**Thay đổi so với Mục 2:** trước đây chốt **GIỮ** 🟢🔴🟡. Nay anh **đổi quyết định: THAY bằng icon**.

| Emoji | Icon Lucide | Màu giữ lại | Cách làm |
|---|---|---|---|
| 🟢 | `shield-check` | `#6ee7b7` (xanh) | Bọc `<span style="color:#6ee7b7">` |
| 🔴 | `alert-triangle` | `#fca5a5` (đỏ) | Bọc `<span style="color:#fca5a5">` |
| 🟡 | `alert-circle` | `#fde68a` (vàng) | Bọc `<span style="color:#fde68a">` |
| 🟠 | `alert-circle` | `#fdba74` (cam) | idem |

**Lý do GIỮ ĐƯỢC ngữ nghĩa màu:** `.h2-icon` dùng `background-color: currentColor` + `mask-image`
⇒ màu icon **kế thừa từ `color` của phần tử cha**. Nên chỉ cần bọc span có `color` tương ứng là
**vẫn phân biệt được đèn xanh/vàng/đỏ** như emoji, mà không phụ thuộc font emoji.

**Hàm dùng:** `icoColored(name, size, color)` (định nghĩa local trong `music_player_modal.js`).

---

## 2c. HAI ICON BỔ SUNG (tải 2026-09-23)

| Icon | Nguồn | Dùng cho | Nguồn tải |
|---|---|---|---|
| `swords` | `lucide-static@1.47.0` | ⚔️ Quân sự (anh yêu cầu tải) | unpkg CDN |
| `clipboard-copy` | `lucide-static@1.47.0` | 📋 nút Copy Path | unpkg CDN |
| `files` | `lucide@1.47.0` (GitHub raw) | 📑 tab "Tất cả" trong Raw Deep modal | GitHub raw |

⚠️ **Bản quyền:** cả 3 file giữ nguyên `stroke="currentColor"` (và header license nếu có).
**KHÔNG xoá header license** khi thêm icon mới. Version phải khớp version của các icon cũ (`1.47.0`).
Tổng hiện tại: **225 SVG = 225 rule CSS** (đã đo parity 225/225, xem Mục 2e).

---

## 2d. QUYẾT ĐỊNH RIÊNG CỦA P3.6 (đo thật 2026-09-23)

### Bảng "icon cần tải" ở tài liệu cũ là **SAI** — đã kiểm chứng lại

Tài liệu này từng ghi `lightbulb`, `camera`, `graduation-cap`, `headphones`, `scroll-text`,
`door-open`, `corner-down-right` là **"chưa có, cần tải"**. **ĐO LẠI THỰC TẾ: TẤT CẢ ĐỀU ĐÃ CÓ.**
Không tải thêm icon nào cho P3.6 (chỉ `files` là thiếu thật, phát hiện qua gate tự động).

### 4 nhóm quyết định khi thay emoji ở `content.js` + `main.js`

| Nhóm | Xử lý | Lý do |
|---|---|---|
| `→` `↗` `▶` `▼` `▲` `↺` `○` nằm **giữa câu chữ** ("Xem bài ↗", "▶ Tua đến 00:30") | **GIỮ NGUYÊN** | Thay icon sẽ làm câu/ nhãn gãy. Đúng Quy tắc 1. |
| `→` `↗` `▶` là **nút độc lập** (nút tròn, icon-only) | **THAY** `arrow-right`/`arrow-up-right`/`play` | Không có chữ đi kèm → phải là icon. |
| **Quốc kỳ** `🇺🇸🇯🇵🇷🇺🇪🇸🇻🇳` | **GIỮ NGUYÊN** | Quy tắc 5 — là nhãn ngôn ngữ, dữ liệu thật. |
| `─` trong `optgroup label="── Nhóm ngách lớn ──"` | **GIỮ NGUYÊN** | Ký tự vẽ đường, không phải emoji. |

### Emoji nằm trong CHUỖI COPY (dán sang Notion/Docs/AI) → BỎ
`kitText` (Visual Directive Kit) và `fullKit` (Bao bì CTR) mở đầu bằng `🎨` / `🎯`.
→ Đã **bỏ emoji**, giữ tiêu đề chữ. Lý do: đây là văn bản đích để dán ra ngoài, không phải UI.

### Emoji trong `data-badge` (vừa là KEY vừa HIỂN THỊ) → Quy tắc 10
`data-badge="🎬 Demo Tuyến Nội Dung"` / `data-badge="🔥 Đang xem Transcript"`:
- **`data-*` giữ nguyên emoji** (là key, đọc bằng `getAttribute`).
- **Chỉ `stripDecorEmoji()` khi in ra chữ**: tại `openQuickVideoModal()` → `const badge = stripDecorEmoji(badgeLabel || 'Tuyến Chuẩn')`.

### Emoji trong DỮ LIỆU JSON (`vitalityAudit.healthBadge` = `"🟢 Đang hoạt động"`) → strip khi hiển thị
Đây **không phải** emoji trong code mà là **giá trị dữ liệu**. Đã bọc `stripDecorEmoji()` tại 3 chỗ render
(`content.js` healthBadge, `main.js` healthBadge + monetizationBadge). **Không sửa file JSON** (giữ nguyên gốc).

### 6 emoji trong Raw Deep modal được **GIỮ CÓ CHỦ Ý** (đã phân loại từng chỗ)
Toàn bộ nằm trong khối **dữ liệu lấy từ hồ sơ đối thủ**, không phải UI chrome:

| Chỗ | Nội dung | Kết luận |
|---|---|---|
| `<pre>` master script prompt | Prompt nguồn của người dùng | Dữ liệu — giữ |
| `<span>` ví dụ bao bì | `"MOO! 🐄 / SING ALONG! 🎵"` (chữ trên thumbnail thật của đối thủ) | Dữ liệu — giữ |
| `<li>` tiêu đề mẫu | `"Old MacDonald... 🐄🐕 3D Cartoon"` (tiêu đề video thật) | Dữ liệu — giữ |
| 3× tiêu đề Demo/Top Video | Tiêu đề YouTube thật của đối thủ | Dữ liệu — giữ |

> Sửa/xoá các emoji này = **bóp méo dữ liệu đối thủ** → phá mục đích bóc tách. Cấm strip.

---

## 2e. GATE TỰ ĐỘNG (chạy trước mỗi lần push)

**Chạy:** `node scripts/gate-icons.js` → `ALL PASS` (exit 0) hoặc `N FAIL` (exit 1).

| Kiểm tra | Cách đo | Ngưỡng PASS |
|---|---|---|
| Tên icon dùng trong `ico()` đều tồn tại | quét `ico('name')` toàn bộ JS ↔ `assets/h2dev-icons.css` | **100%** resolve |
| SVG ↔ rule CSS khớp 1-1 | đếm file `.svg` ↔ số rule `.h2-icon[data-h2i=...]` | **225 = 225**, 0 lệch, 0 trùng |
| Không file SVG 0 byte | `Get-Item *.svg \| Length -eq 0` | **0** |
| 0 emoji trang trí trong code | quét `EMOJI_CLEAN` (8 file), **bỏ comment**, bỏ quốc kỳ | **0** (trừ 2 `data-badge` KEY có ghi lý do) |
| **[5] Size class đúng chuẩn** | quét `h2-icon--NN` trong 16 file | **0 sai** — chỉ `14/16/20/24` |
| 0 emoji trang trí trong DOM | Playwright walk text node, bỏ quốc kỳ | **0** ở cả 10 tab |
| 0 lỗi console | Playwright `pageerror` + `console.error` | **0** |

### Gate đã được CHỨNG MINH hoạt động (probe 2026-09-24)

Gate không chỉ "chạy không lỗi" — đã **tiêm lỗi thử** để chứng minh nó thật sự bắt được:

| Probe | Kết quả | Ý nghĩa |
|---|---|---|
| Tiêm `🎯` vào `search.js` | `FAIL \| search.js` + exit 1 | Bắt được emoji lọt |
| Tiêm `h2-icon--12` vào `player-main.js` | `FAIL \| player-main.js:856 size "12" KHONG hop le` + exit 1 | Bắt được size sai |
| Phục hồi cả 2 | `ALL PASS` + exit 0, file y nguyên | Không phá dữ liệu |

> **Bài học:** gate phải được **probe** (tiêm lỗi → xác nhận bắt được → phục hồi) trước khi tin.
> Gate không được probe = gate có thể đang "PASS rỗng" mà không ai biết.

---

## 4. LỘ TRÌNH THỰC HIỆN (từng file, check-pass mỗi file)

> **TRẠNG THÁI: ✅ HOÀN TẤT 100% (2026-09-24).** Toàn bộ 17 file đã **0 emoji trang trí**.
> Kiểm chứng cuối: `node scripts/gate-icons.js` → ALL PASS (8 file trong `EMOJI_CLEAN`) +
> khảo sát 17 file → `TỔNG: 0 emoji trang trí | 0 ký tự quốc kỳ`.

| # | File | Số emoji | Trạng thái |
|---|---|---|---|
| 1 | `player.html` | ~~26~~ **0** | ✅ XONG — đo lại: HTML đã dùng `h2-icon` sẵn (19 icon tĩnh) |
| 2 | `index.html` | ~~3~~ **0** | ✅ XONG — đo lại: đã dùng `h2-icon` |
| 3 | `learn.html` | ~~3~~ **0** | ✅ XONG — đo lại: đã dùng `h2-icon` |
| 4 | `assets/learn.css` | ~~6~~ **0** | ✅ XONG — đo lại: 0 |
| 5 | `assets/player.css` | ~~1~~ **0** | ✅ XONG — đo lại: 0 |
| 6 | `assets/viddar.css` | ~~8~~ **0** | ✅ XONG — đo lại: 0 |
| 7 | `assets/app/tabs/nav.js` | 0 | ✅ XONG — nhận `t.icon` đã render sẵn HTML |
| 8 | `assets/app/ui-core.js` | ~~4~~ **1** (đo lại) | ✅ **XONG 2026-09-24** — `✓ Đã xem` → `H2Icons.ico('check',14)` |
| 9 | `assets/app/taxonomy.js` | ~~2~~ **0** | ✅ XONG — đo lại: 0 |
| 10 | `assets/app/search-core.js` | ~~1~~ **0** | ✅ XONG — đo lại: 0 |
| 11 | `assets/app/sw-register.js` | 0 | ✅ — |
| 12 | `assets/h2dev-core.js` | ~~12~~ **1** (đo lại) | ✅ **XONG 2026-09-24** — `❤` hint → `.h2-inline-ico` + `ICONS.heartRegular` |
| 13 | `assets/app/search.js` | 5 | ✅ **XONG 2026-09-23** — emoji→tên icon + `H2Icons.ico` |
| 14 | `assets/learn.js` | ~~18~~ **0** | ✅ XONG — đo lại: 0 (đã dùng `C.ico()`) |
| 15 | `assets/app/player-main.js` | ~~26~~ **3** (đo lại) | ✅ **XONG 2026-09-24** — `📺`→`tv`, `📋`→`clipboard`, `✓`→`check` |
| 16 | `assets/music_player_modal.js` | 41 (đo lại) | ✅ **XONG 2026-09-23** — 41→0, 4 `alert()`→toast |
| 17 | `assets/app/tabs/content.js` | 126 (đo lại) | ✅ **XONG 2026-09-23** — 126→0, 9 `icon:` → tên |
| 18 | `assets/app/main.js` | 155 (đo lại) | ✅ **XONG 2026-09-23** — 155→0, gộp 13 SVG → `window.H2Icons` |

### 4.1. BÀI HỌC ĐO LƯỜNG: SỐ ƯỚC TÍNH BAN ĐẦU CAO HƠN THỰC TẾ

**Phát hiện quan trọng (2026-09-24):** cột "Số emoji" gốc là **ước tính sai**.
Khi đo lại bằng script có **strip comment** (Quy tắc 6), con số thật nhỏ hơn rất nhiều:

| File | Ước tính gốc | Thực tế | Sai lệch |
|---|---|---|---|
| `player.html` | 26 | **0** | đã dùng `h2-icon` từ trước |
| `index.html` / `learn.html` | 3 / 3 | **0** / **0** | đã dùng `h2-icon` |
| `learn.css` / `player.css` / `viddar.css` | 6 / 1 / 8 | **0** | đã sạch |
| `taxonomy.js` / `search-core.js` / `learn.js` | 2 / 1 / 18 | **0** | đã dùng `ico()` |
| `ui-core.js` / `h2dev-core.js` / `player-main.js` | 4 / 12 / 26 | **1** / **1** / **3** | chỉ còn 5 |

**Nguyên nhân sai lệch:** con số gốc đếm bằng grep thô, **tính cả emoji trong comment**
(ví dụ `main.js:64` có `🌐` trong comment giải thích giá trị `state.marketFilter`).
Comment được phép giữ emoji (Quy tắc 6) → **không phải việc phải sửa**.

> **Nguyên tắc rút ra:** khi báo cáo "còn N emoji cần sửa", **phải nói rõ có strip comment chưa**.
> Nếu không, con số sẽ **thổi phồng khối lượng** và dẫn tới quyết định sai (làm thừa, hoặc tưởng dự án bẩn hơn thực tế).
> Cách đo chuẩn: `node scripts/gate-icons.js` (đã strip comment + có `ALLOWED[]` cho ngoại lệ có lý do).

**5 emoji cuối cùng đã xử lý — mỗi cái một bản chất riêng (không gộp):**

| File:dong | Emoji | Bản chất | Cách xử lý |
|---|---|---|---|
| `ui-core.js:84` | `✓` | Ký tự văn bản trong badge động | → `H2Icons.ico('check', 14)` |
| `h2dev-core.js:287` | `❤` | Ký tự văn bản mô tả NÚT (không phải nút) | → `.h2-inline-ico` + `ICONS.heartRegular` (SVG inline, vì file này nạp TRƯỚC `icons.js`) |
| `player-main.js:403` | `📺` | Emoji trang trí trước link kênh | → `h2-icon tv` |
| `player-main.js:404` | `📋` | Emoji trang trí trên nút Copy | → `h2-icon clipboard` |
| `player-main.js:856` | `✓` | Ký tự văn bản trong ô checkbox markdown | → `h2-icon check` |

**Lưu ý kỹ thuật khi thay icon:**
1. `h2dev-core.js` nạp **TRƯỚC** `assets/app/icons.js` → **không dùng được** `H2Icons`. Phải tự chứa SVG.
2. `player.html` **KHÔNG** nạp `assets/app/icons.js` → phải dùng class CSS `h2-icon` (không cần JS).
3. Size class **chỉ được** `14/16/20/24` (đã gặp lỗi thật: viết `h2-icon--12` → render `0x0`).
   → Đã thêm luật `[5]` vào gate để chặn vĩnh viễn.
4. Kiểm chứng 2 nhánh khó **không được SKIP**: phải set `localStorage` để ép trạng thái
   (`h2dev-watched` cho badge "Đã xem"; `h2dev-fav` rỗng cho empty-state yêu thích)
   + **mở đúng tab** (`videoCard()` chỉ render ở tab Video).

