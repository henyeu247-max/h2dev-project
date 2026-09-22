# H2DEV — URL ROUTING SPEC (Quy Hoạch Đường Dẫn Chuẩn)

> **Trạng thái:** `draft` — chờ chủ dự án chốt các điểm tại [mục 9](#9-các-điểm-cần-chủ-dự-án-chốt).
> **Bằng chứng gốc:** `server.js:360-373` · `assets/app/main.js:61-71` · `assets/app/main.js:144-175` · `assets/app/main.js:782-792` · HTTP probe thực tế cổng `8899` ngày `2026-09-23`.
> **Nguyên tắc bất di bất dịch:** tài liệu này chỉ **mô tả + đề xuất**. Mọi giá trị đã probe là **bằng chứng**, không được sửa cho đẹp. Mọi đề xuất ghi rõ `proposed`, phải được chủ dự án chốt trước khi thi công.

---

## 1. Triết lý & Quy tắc đặt URL

### 1.1. Triết lý

URL là **hợp đồng công khai** của dự án. Một người dùng mở thanh địa chỉ phải **đoán được** URL của thứ mình cần, và **copy URL dán cho đồng nghiệp** phải mở ra đúng ngữ cảnh đó. Hệ quả:

- **Nhấp đến đâu — URL đến đó.** Mọi thứ nhấp được (tab, sub-tab, filter, modal có ngữ cảnh sâu, deep link bài học) **bắt buộc** phản ánh vào `location` để F5 không mất trạng thái và Back/Forward hoạt động đúng.
- **URL là nguồn sự thật khi reload.** Trạng thái phải dựng lại được **hoàn toàn** từ URL. Cấm có trạng thái "sống" chỉ trong RAM mà URL không biết.
- **Đoán được, không cần đọc code.** Slug phải là **từ tiếng Việt không dấu, đọc lên hiểu ngay**, khớp với nhãn UI người dùng nhìn thấy.
- **Check-pass được.** Mỗi route có 1 dòng trong [mục 8](#8-checklist-check-pass) để kiểm thủ công: HTTP code, title, tab active, breadcrumb.
- **Không có route chết.** Route đã từng công khai không được phép biến thành 404; phải redirect.

### 1.2. Quy tắc đặt URL (BẮT BUỘC)

| # | Quy tắc | Chi tiết | Ví dụ ĐÚNG | Ví dụ SAI |
|---|---|---|---|---|
| R1 | **Lowercase toàn bộ** | Không viết hoa bất kỳ ký tự nào trong path | `/ngachxanh` | `/NgachXanh` |
| R2 | **Không dấu tiếng Việt** | Path chỉ dùng `[a-z0-9-]`. Dấu tiếng Việt phải bỏ dấu, không dùng `%C3%A9` | `/chienluoc` | `/chiếnlược`, `/chi%E1%BA%BFnluoc` |
| R3 | **Từ ghép dùng dấu gạch ngang `-`** | Không dùng `_`, không dùng camelCase, không viết liền | `/kenh-mau`, `/tai-lieu` | `/kenh_mau`, `/rawKenh`, `/rawkenh` (viết liền) |
| R4 | **Không viết tắt mơ hồ** | Slug phải đọc hiểu ngay. Cấm `qb`, `nx`, `cl`, `tl`, `kr` | `/ngachxanh` | `/nx` |
| R5 | **Không trailing slash** | `/video` hợp lệ; `/video/` bị 301 về `/video` | `/video` | `/video/` |
| R6 | **Slug khớp tên UI** | Nhãn tab hiển thị phải suy ra được slug | UI "Kênh mẫu" → `/kenh-mau` | UI "Tài liệu" → `/kichban` ⚠️ |
| R7 | **`?query` cho filter/trạng thái lá** | Filter, phân trang, cờ nhị phân đi vào query string | `/video?market=US&free=1` | `/video/US/free` |
| R8 | **`#` KHÔNG dùng cho state chính** | Fragment cấm gánh tab/sub-tab/modal. Chỉ dùng cho anchor cuộn trang trong tài liệu dài | — | `/tai-lieu#nhac` cho trạng thái chính |
| R9 | **Path = danh từ số nhiều/không đếm, ổn định** | Không nhúng số đếm, không nhúng ID nội bộ vào path cấp tab | `/rawkenh` | `/rawkenh-trang-2` |
| R10 | **ID động chỉ ở tầng detail** | SKU/ID chỉ xuất hiện ở `/lotrinh/<sku>`; cấm ID trong path tab | `/lotrinh/VIDEO-DD983D` | `/video/VIDEO-DD983D` |
| R11 | **Tên param: lowercase, 1 từ, không dấu** | Ưu tiên ngắn nhưng phải có tài liệu tại [mục 5](#5-quy-tắc-tham-số-query-params) | `market`, `niche`, `page` | `Market`, `thi-truong` |
| R12 | **Giá trị mặc định CẤM xuất hiện trên URL** | Nếu trạng thái = mặc định thì bỏ param khỏi URL | `/video` (khi chưa lọc) | `/video?page=1&free=0&niche=` |
| R13 | **Encode bắt buộc cho giá trị Unicode** | Mọi giá trị vào query phải qua `encodeURIComponent` | `?market=US` · `?market=%F0%9F%87%BB%F0%9F%87%B3+Vi%E1%BB%87t` | dán thô `?market=🇻🇳 Việt` |
| R14 | **1 URL — 1 trạng thái duy nhất** | Cấm 2 URL khác nhau cho cùng 1 trạng thái (gây trùng lặp canonical) | `/` và `/tongquan` phải 301 về 1 | cả `/` và `/tongquan` cùng tồn tại như 2 trang riêng |
| R15 | **Cấm ký tự `?`, `#`, `&`, `%` trong path tĩnh** | Chỉ dùng để phân tách query/fragment | — | `/video&market` |

### 1.3. Hệ quả trực tiếp của R6 + R7 với hiện trạng

- ⚠️ **Vi phạm R6:** tab id `kichban` ↔ UI "Tài liệu"; tab id `kenh` ↔ UI "Kênh mẫu". Xem [mục 4](#4-đối-soát-route-cũ--route-mới).
- ⚠️ **Vi phạm R13 (tiềm ẩn):** ví dụ chủ dự án nêu `http://127.0.0.1:8899/video?market=🇻🇳+Việt` — dán thô trên thanh địa chỉ. Trình duyệt tự encode khi copy từ DOM, nhưng **code build URL phải gọi `encodeURIComponent`** để không sinh URL hỏng.
- ⚠️ **Vi phạm R12:** `openTab()` hiện `if (state.rawPage && state.rawPage > 1)` — đúng tinh thần R12 cho `page`, nhưng các param khác đã đúng (`if (state.marketFilter)` chỉ set khi có giá trị).

---

## 2. Cây URL chuẩn

Ký hiệu: `[current]` = đã chạy thật, probe 200 · `[proposed]` = đề xuất, chưa tồn tại · `[deprecated]` = route cũ phải redirect.

```
http://127.0.0.1:8899/                      # Local base
https://h2dev-learn.tonymmo.com/            # Production base
│
├── /                                       [current]  → index.html  · tab Tổng quan (tab mặc định)
├── /tongquan                               [current]  → index.html  · tab Tổng quan (trùng / — xem R14)
│
├── /tatca                                  [proposed] → index.html  · tab "Tất cả" (gộp mọi danh sách)
│     └── ?type=video|tai-lieu|kenh|nguon   [proposed] · lọc loại nội dung trong tab gộp
│
├── /video                                  [current]  → index.html  · tab Video (140 bài học)
│     ├── ?market=<market>                  [current]  · lọc theo thị trường
│     ├── ?niche=<nicheId>                  [current]  · lọc theo ngách
│     ├── ?watch=<watchFilter>              [current]  · lọc trạng thái xem
│     └── ?free=1                           [current]  · chỉ bài FREE
│
├── /ngachxanh                              [current]  → index.html  · tab Ngách xanh
│     ├── ?niche=<nicheId>                  [current]  · lọc ngách
│     └── ?market=<market>                  [current]  · lọc thị trường
│
├── /tai-lieu                               [proposed] → index.html  · tab "Tài liệu" (thay /kichban)
│     └── /kichban                          [deprecated] → 301 /tai-lieu
│
├── /nhac                                   [proposed] → index.html  · Trạm nhạc nền (tab/modal có URL riêng)
│     ├── ?mood=<moodId>                    [proposed]  · lọc theo mood
│     ├── ?risk=safe|review|copyrighted     [proposed]  · lọc theo cờ bản quyền
│     └── ?track=<MUSIC-xxx>                [proposed]  · mở sẵn 1 track (deep link)
│
├── /nguonreup                              [current]  → index.html  · tab Nguồn reup
├── /kenh-mau                               [proposed] → index.html  · tab "Kênh mẫu" (thay /kenh)
│     └── /kenh                             [deprecated] → 301 /kenh-mau
│
├── /rawkenh                                [current]  → index.html  · tab Raw kênh
│     ├── ?page=<n>                         [current]  · phân trang (n > 1 mới lên URL)
│     ├── ?rn=<rawNiche>                    [current]  · lọc nhóm ngách raw
│     ├── ?rg=<rawGroup>                    [current]  · lọc nhóm raw
│     ├── ?rq=<keyword>                     [current]  · tìm kiếm trong raw
│     └── /raw                              [deprecated] → 301 /rawkenh
│
├── /chienluoc                              [current]  → index.html  · tab Chiến lược
│     ├── ?sub=principles                   [proposed]  · sub-tab "4 Nguyên tắc"
│     ├── ?sub=workflow                     [proposed]  · sub-tab "Quy trình A–Z"
│     ├── ?sub=distribution                 [proposed]  · sub-tab "Phân bổ ngách"
│     ├── ?sub=policy                       [proposed]  · sub-tab "YPP & Chính sách"
│     └── ?sub=all                          [proposed]  · sub-tab "Tất cả nội dung" (mặc định → bỏ param)
│
├── /lotrinh                                [current]  → learn.html  · Lộ trình học
│     └── ?embed=1                          [current]  · chế độ nhúng (ẩn shell)
│
├── /lotrinh/<sku>                          [current]  → player.html · trình phát bài học
│     ├── ?back=<url>                       [current]  · URL quay về
│     └── ?tab=overview|sub|transcript      [proposed] · sub-tab trong player
│
├── /player.html                            [current]  → player.html · shell player trực tiếp (nội bộ)
│
├── # ---- Modal / overlay có ngữ cảnh ---- #
├── /modal/nhac                             [proposed] · deep link mở modal nhạc nền
├── /modal/quick-video                      [proposed] · deep link mở quick video modal
├── /modal/raw-image                        [proposed] · deep link mở raw image modal
├── /modal/raw-channel                      [proposed] · CSS đang DEAD — cấm tạo route cho tới khi có DOM/JS
│
└── # ---- API (BE thuần, không trả HTML) ---- #
    ├── /api/admin-state                    [current]  200 · 101 bytes
    ├── /api/intelligence/breakouts         [current]  API
    ├── /api/intelligence/spider            [current]  API
    ├── /api/search                         [current]  200 · 35 bytes
    └── /api/niche-radar                    [current]  API
```

> **Ghi chú về `/tatca`:** chủ dự án yêu cầu route `/tatca`. Hiện **404**. Đây là route cấp cao gộp mọi danh sách — cần chốt xem `/tatca` là **tab thứ 10** (thêm vào `TABS`) hay là **view tổng hợp** (aggregation) đọc-only. Xem [mục 9.1](#91-tatca--tab-thứ-10-hay-view-tổng-hợp).

---

## 3. Bảng đặc tả từng route

### 3.1. Route trang (BE rewrite → serve file)

| URL chuẩn | Loại | Serve file | FE handler | Tham số | Title động | Canonical | Trạng thái |
|---|---|---|---|---|---|---|---|
| `/` | page | `index.html` | `openTab('tongquan')` | — | `Tổng quan — H2DEV` | `https://h2dev-learn.tonymmo.com/` | current · 200 |
| `/tongquan` | tab | `index.html` | `openTab('tongquan')` | — | `Tổng quan — H2DEV` | `/` | current · 200 ⚠️ xem R14 |
| `/tatca` | tab | `index.html` | `openTab('tatca')` | `type` | `Tất cả — H2DEV` | `/tatca` | proposed |
| `/video` | tab | `index.html` | `openTab('video')` | `market`, `niche`, `watch`, `free` | `Video — H2DEV` | `/video` | current · 200 |
| `/ngachxanh` | tab | `index.html` | `openTab('ngachxanh')` | `niche`, `market` | `Ngách xanh — H2DEV` | `/ngachxanh` | current · 200 |
| `/tai-lieu` | tab | `index.html` | `openTab('kichban')` | — | `Tài liệu — H2DEV` | `/tai-lieu` | **proposed** ⚠️ chờ chốt |
| `/nhac` | tab/modal | `index.html` | `openMusicStudioModal()` | `mood`, `risk`, `track` | `Nhạc nền — H2DEV` | `/nhac` | **proposed** · hiện 404 |
| `/nguonreup` | tab | `index.html` | `openTab('nguonreup')` | — | `Nguồn reup — H2DEV` | `/nguonreup` | current · 200 |
| `/kenh-mau` | tab | `index.html` | `openTab('kenh')` | — | `Kênh mẫu — H2DEV` | `/kenh-mau` | **proposed** ⚠️ chờ chốt |
| `/rawkenh` | tab | `index.html` | `openTab('rawkenh')` | `page`, `rn`, `rg`, `rq` | `Raw kênh — H2DEV` | `/rawkenh` | current · 200 |
| `/chienluoc` | tab | `index.html` | `openTab('chienluoc')` | `sub` | `Chiến lược — H2DEV` | `/chienluoc` | current · 200 |
| `/lotrinh` | page | `learn.html` | init learn | `embed` | `Lộ trình học — H2DEV` | `/lotrinh` | current · 200 (2847 b) |
| `/lotrinh/<sku>` | detail | `player.html` | `player-main.js` đọc `pathname` | `back`, `tab` | `<tên bài> — H2DEV` (đã có, `player-main.js:258`) | `/lotrinh/<sku>` | current · 200 (14946 b) ⚠️ không validate |
| `/player.html` | page | `player.html` | init player | `sku`, `back` | `Trình phát — H2DEV` | — (nội bộ, `noindex`) | current · 200 |

### 3.2. Route API

| URL chuẩn | Loại | Trả về | Tham số | Trạng thái |
|---|---|---|---|---|
| `/api/admin-state` | api | JSON | — | current · 200 |
| `/api/intelligence/breakouts` | api | JSON | — | current |
| `/api/intelligence/spider` | api | JSON | — | current |
| `/api/search` | api | JSON | `q` | current · 200 |
| `/api/niche-radar` | api | JSON | — | current |

### 3.3. Route lỗi

| URL | Loại | Response | Nội dung |
|---|---|---|---|
| `*` không khớp | error | `404` `text/plain` | `404: <path>` (10 bytes, ví dụ `404: /nhac`) |
| path vượt `ROOT` | error | `403` | `Forbidden` |
| `*.env*` | error | `403` | `Forbidden` |
| URI hỏng | error | `400` | `400 Bad Request: Malformed URI` |

---

## 4. Đối soát route CŨ → route MỚI

| Route cũ | Trạng thái cũ | Route mới (đề xuất) | Quyết định | Redirect | Lý do |
|---|---|---|---|---|---|
| `/kichban` | 200 | `/tai-lieu` | **CHỜ CHỐT** | nếu đổi: `301 /kichban → /tai-lieu` | UI gọi "Tài liệu", slug `kichban` vi phạm R6. Xem [9.2](#92-kichban--tai-lieu-hay-giu-nguyên) |
| `/kenh` | 200 | `/kenh-mau` | **CHỜ CHỐT** | nếu đổi: `301 /kenh → /kenh-mau` | UI gọi "Kênh mẫu", slug `kenh` vi phạm R6 |
| `/rawkenh` | 200 | giữ | **GIỮ NGUYÊN** | — | UI "Raw kênh" ↔ `rawkenh` (viết liền) — chấp nhận, hoặc đổi `raw-kenh` xem [9.3](#93-rawkenh--raw-kenh) |
| `/nguonreup` | 200 | giữ | **GIỮ NGUYÊN** | — | UI "Nguồn reup" ↔ `nguonreup` — khớp nghĩa |
| `/ngachxanh` | 200 | giữ | **GIỮ NGUYÊN** | — | UI "Ngách xanh" ↔ `ngachxanh` — khớp nghĩa |
| `/chienluoc` | 200 | giữ | **GIỮ NGUYÊN** | — | UI "Chiến lược" ↔ `chienluoc` — khớp nghĩa |
| `/video` | 200 | giữ | **GIỮ NGUYÊN** | — | Khớp tuyệt đối |
| `/tongquan` | 200 | giữ + canonical về `/` | **GIỮ + canonical** | không redirect cứng (giữ tương thích) | R14: 2 URL cùng nội dung. Xem [9.4](#94-tongquan-vs--canonical) |
| `/` | 200 | giữ | **GIỮ NGUYÊN** | — | Trang chủ |
| `/lotrinh` | 200 | giữ | **GIỮ NGUYÊN** | — | Khớp nghĩa |
| `/lotrinh/<sku>` | 200 (kể cả SKU rác) | giữ + validate | **GIỮ + THÊM VALIDATE** | SKU rác: `404` hoặc `302 /lotrinh` | Xem [9.5](#95-lotrinhsku-rác-xử-lý-thế-nào) |
| `/nhac` | **404** | `/nhac` | **THÊM MỚI** | — | Chủ dự án yêu cầu "Nhấp nhạc cũng cần /nhac" |
| `/tatca` | **404** | `/tatca` | **THÊM MỚI** | — | Chủ dự án yêu cầu |
| `/kenh-mau` | **404** | `/kenh-mau` | **THÊM MỚI** | — | Khớp R6 |
| `/tai-lieu` | **404** | `/tai-lieu` | **THÊM MỚI** | — | Khớp R6 |
| `/raw` | **404** | → `/rawkenh` | **THÊM REDIRECT** | `301 /raw → /rawkenh` | Tránh người dùng gõ tắt bị 404 |

> **Quy tắc redirect:** dùng **`301` (permanent)** khi route cũ **vĩnh viễn** bị thay tên (SEO + bookmark cũ vẫn sống). Dùng **`302` (temporary)** khi chỉ là alias tạm trong giai đoạn chuyển tiếp. **Cấm** để route cũ rơi vào 404.

---

## 5. Quy tắc tham số (Query Params)

> **Luật chung:** Tên param **lowercase, không dấu, 1 từ** (R11). Giá trị **luôn** qua `encodeURIComponent` (R13). Giá trị mặc định **không** xuất hiện trên URL (R12).

### 5.1. Bảng chuẩn hoá tham số

| Param | Ý nghĩa | Kiểu giá trị | Route dùng | Encode | Mặc định (cấm lên URL) | Trạng thái |
|---|---|---|---|---|---|---|
| `market` | Lọc theo thị trường | `string` (có thể chứa emoji + khoảng trắng, ví dụ `🇻🇳 Việt`, `US`) | `/video`, `/ngachxanh` | **CÓ** — `encodeURIComponent` bắt buộc | `''` (tất cả) | current |
| `niche` | Lọc theo mã ngách | `string` (id ngách, ví dụ `nicheId` trong `NICHE_MAP`) | `/video`, `/ngachxanh` | CÓ | `''` | current |
| `page` | Trang hiện tại của danh sách Raw | `integer ≥ 2` | `/rawkenh` | không cần | `1` | current |
| `rn` | Raw niche — lọc nhóm ngách raw | `string` | `/rawkenh` | CÓ | `''` | current |
| `rg` | Raw group — lọc nhóm raw | `string` | `/rawkenh` | CÓ | `''` | current |
| `rq` | Raw query — từ khoá tìm trong raw | `string` | `/rawkenh` | **CÓ** (có thể có dấu tiếng Việt) | `''` | current |
| `watch` | Lọc trạng thái xem | `string` (enum do FE định nghĩa) | `/video` | CÓ | `''` | current |
| `free` | Cờ chỉ hiện bài FREE | `'1'` \| vắng mặt (boolean encoded) | `/video` | không cần | vắng mặt ≠ `0` | current |
| `embed` | Chế độ nhúng (ẩn shell) | `'1'` | `/lotrinh` | không cần | vắng mặt | current |
| `back` | URL quay về từ player | `string` (URL/path đã encode) | `/lotrinh/<sku>` | **CÓ** (double-encode nếu là URL) | vắng mặt | current |
| `sku` | Mã bài học (dạng query, đường phụ) | `string` (`VIDEO-xxxxx`) | `/player.html` | không cần | vắng mặt | current |
| `tab` | Sub-tab trong player | enum `overview`\|`sub`\|`transcript` | `/lotrinh/<sku>` | không cần | `overview` | **proposed** |
| `sub` | Sub-tab trong tab Chiến lược | enum `principles`\|`workflow`\|`distribution`\|`policy`\|`all` | `/chienluoc` | không cần | `all` | **proposed** |
| `type` | Lọc loại nội dung trong tab gộp | enum `video`\|`tai-lieu`\|`kenh`\|`nguon` | `/tatca` | không cần | vắng mặt (tất cả) | **proposed** |
| `mood` | Lọc mood nhạc nền | `string` | `/nhac` | **CÓ** | `all` | **proposed** |
| `risk` | Lọc cờ bản quyền nhạc | enum `safe`\|`review`\|`copyrighted` | `/nhac` | không cần | vắng mặt | **proposed** |
| `track` | Deep link 1 track nhạc | `string` (`MUSIC-xxx`) | `/nhac` | không cần | vắng mặt | **proposed** |
| `q` | Từ khoá tìm kiếm (API) | `string` | `/api/search` | **CÓ** | vắng mặt | current |

### 5.2. Ví dụ encode chuẩn (R13)

```js
// ĐÚNG — dùng URL API, tự encode
const url = new URL('/video', location.origin);
url.searchParams.set('market', state.marketFilter); // tự encodeURIComponent
// → /video?market=%F0%9F%87%BB%F0%9F%87%B3+Vi%E1%BB%87t

// SAI — nối chuỗi thô, sinh URL hỏng khi có emoji/dấu
const bad = '/video?market=' + state.marketFilter; // ⚠️ CẤM
```

> **Ghi chú về ví dụ của chủ dự án** `http://127.0.0.1:8899/video?market=🇻🇳+Việt`: trình duyệt hiển thị đã decode cho dễ đọc, nhưng giá trị thật lưu trong `location.search` là `%F0%9F%87%BB%F0%9F%87%B3+Vi%E1%BB%87t`. Khi so khớp filter, **phải** so trên giá trị đã decode (`URLSearchParams.get('market')`), cấm so chuỗi thô trên `location.search`.

### 5.3. Thứ tự param trên URL (để URL ổn định, dễ so sánh)

Khi build URL, **luôn** set theo thứ tự cố định sau — đảm bảo cùng trạng thái → cùng chuỗi URL (R14):

```
1. market  2. niche  3. sub  4. type  5. mood  6. risk
7. page    8. rn     9. rg  10. rq   11. watch 12. free  13. track  14. embed  15. back  16. tab
```

---

## 6. Deep link + Back/Forward contract

### 6.1. Danh sách state BẮT BUỘC khôi phục trong `popstate`

Hiện trạng `main.js:782-792` **chỉ khôi phục 3/9** — `tab`, `market`, `niche`. **Mất 6**: `page`, `rn`, `rg`, `rq`, `watch`, `free`. Đây là bug "Back sai trạng thái nhưng F5 lại đúng" (khó tái hiện vì F5 đọc lại URL đầy đủ).

| # | State | Nguồn URL | popstate hiện tại | Yêu cầu |
|---|---|---|---|---|
| 1 | `tab` | pathname | ✅ khôi phục | BẮT BUỘC |
| 2 | `market` | `?market` | ✅ khôi phục | BẮT BUỘC |
| 3 | `niche` | `?niche` | ✅ khôi phục | BẮT BUỘC |
| 4 | `rawPage` | `?page` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 5 | `rawNiche` | `?rn` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 6 | `rawGroup` | `?rg` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 7 | `rawQ` | `?rq` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 8 | `watchFilter` | `?watch` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 9 | `freeOnly` | `?free=1` | ❌ **MẤT** | **BẮT BUỘC BỔ SUNG** |
| 10 | `clSubTab` | `?sub` | ❌ không có URL | **BẮT BUỘC** (proposed) |
| 11 | player tab | `?tab` | ❌ không có URL | **BẮT BUỘC** (proposed) |
| 12 | `mood`/`risk`/`track` | `?mood/?risk/?track` | ❌ không có URL | **BẮT BUỘC** (proposed) |

### 6.2. Contract

1. **`pushState` phải đẩy đủ 100% state hiện hành** — mọi state ảnh hưởng hiển thị phải có mặt trên URL trước khi push.
2. **`popstate` phải đọc URL và dựng lại state từ đầu** (`state = parseFromURL(location)`), **không** merge dở dang. Cấm set tay từng field.
3. **Nguyên tắc 1 nguồn:** viết **đúng 1 hàm** `readStateFromURL(location)` dùng chung cho cả lúc init (F5) và `popstate`. Hiện tại init và popstate parse khác nhau → nguồn gốc bug lệch trạng thái.
4. **Cấm mất state khi Back/Forward.** Test bắt buộc: đổi filter → phân trang → Back → **filter và trang phải còn nguyên**.
5. **`replaceState` cho thay đổi không nên vào history** (ví dụ player cập nhật `sku` sau khi load `main.js:14`).
6. **Cuộn trang:** Back/Forward phải khôi phục vị trí cuộn (browser tự lo) — cấm `resetScrollToTop()` vô điều kiện trong `popstate` (hiện `main.js:791` gọi thẳng → phá scroll restore).

---

## 7. Title & Breadcrumb động

### 7.1. Hiện trạng

- **`index.html` (shell 9 tab): 0 chỗ set `document.title`** → mọi tab đều "H2DEV — Radar kho YouTube". Mở 5 tab trình duyệt không phân biệt được.
- `player-main.js:258` **có** set: `document.title = v.title + ' — H2DEV Project'`. ⚠️ Không nhất quán suffix (`H2DEV Project` vs `H2DEV`).

### 7.2. Template title động (BẮT BUỘC)

Suffix thống nhất: **`— H2DEV`**.

| Route | Title |
|---|---|
| `/` | `Tổng quan — H2DEV` |
| `/tongquan` | `Tổng quan — H2DEV` |
| `/tatca` | `Tất cả — H2DEV` · có `?type`: `Tất cả · <Nhãn loại> — H2DEV` |
| `/video` | `Video — H2DEV` · có `?market`: `Video · <market> — H2DEV` |
| `/ngachxanh` | `Ngách xanh — H2DEV` |
| `/tai-lieu` | `Tài liệu — H2DEV` |
| `/nhac` | `Nhạc nền — H2DEV` · có `?track`: `Nhạc nền · <MUSIC-xxx> — H2DEV` |
| `/nguonreup` | `Nguồn reup — H2DEV` |
| `/kenh-mau` | `Kênh mẫu — H2DEV` |
| `/rawkenh` | `Raw kênh — H2DEV` · `?page=n`: `Raw kênh · Trang <n> — H2DEV` |
| `/chienluoc` | `Chiến lược — H2DEV` · `?sub=x`: `Chiến lược · <Nhãn sub> — H2DEV` |
| `/lotrinh` | `Lộ trình học — H2DEV` |
| `/lotrinh/<sku>` | `<tên bài học> — H2DEV` |
| `*` (404) | `Không tìm thấy — H2DEV` |

**Luật:** title **bắt buộc** cập nhật trong **cùng hàm** đổi tab (`openTab`), **cấm** set rời rạc. Cấm để title tĩnh.

### 7.3. Breadcrumb

Breadcrumb là **dẫn xuất từ URL**, không phải state riêng:

| Route | Breadcrumb hiển thị |
|---|---|
| `/video` | `H2DEV / Video` |
| `/video?market=US` | `H2DEV / Video / US` |
| `/rawkenh?rn=<x>&page=2` | `H2DEV / Raw kênh / <nhãn rn> / Trang 2` |
| `/chienluoc?sub=workflow` | `H2DEV / Chiến lược / Quy trình A–Z` |
| `/lotrinh/<sku>` | `H2DEV / Lộ trình / <tên bài>` |
| `/nhac?track=MUSIC-041` | `H2DEV / Nhạc nền / MUSIC-041` |

**Luật breadcrumb:**
1. Mỗi cấp breadcrumb = **1 URL thật** nhấp được (trừ cấp cuối).
2. Cấm breadcrumb "trang trí" không dẫn đi đâu.
3. Cấp cuối trùng `document.title` (phần trước suffix).

---

## 8. Checklist check-pass

> Dùng cho cả **kiểm thủ công** (dán URL vào trình duyệt) và **kiểm tự động** (script HTTP + Playwright). Mỗi dòng phải **PASS 100%** mới được báo hoàn thành (luật 3 vòng `AGENTS.md`).

### 8.1. Tầng 1 — HTTP status (Local `127.0.0.1:8899` + Production `h2dev-learn.tonymmo.com`)

| # | URL | HTTP kỳ vọng | Serve file | Ghi chú |
|---|---|---|---|---|
| 1 | `/` | 200 | index.html | |
| 2 | `/tongquan` | 200 | index.html | |
| 3 | `/video` | 200 | index.html | |
| 4 | `/ngachxanh` | 200 | index.html | |
| 5 | `/tai-lieu` | 200 | index.html | **đề xuất** — hiện 404 |
| 6 | `/nhac` | 200 | index.html | **đề xuất** — hiện 404 |
| 7 | `/nguonreup` | 200 | index.html | |
| 8 | `/kenh-mau` | 200 | index.html | **đề xuất** — hiện 404 |
| 9 | `/rawkenh` | 200 | index.html | |
| 10 | `/chienluoc` | 200 | index.html | |
| 11 | `/tatca` | 200 | index.html | **đề xuất** — hiện 404 |
| 12 | `/lotrinh` | 200 | learn.html | |
| 13 | `/lotrinh/VIDEO-DD983D` | 200 | player.html | SKU hợp lệ |
| 14 | `/lotrinh/khong-ton-tai-xyz` | **404** | — | **đề xuất** — hiện sai (200) |
| 15 | `/kichban` | **301** | → `/tai-lieu` | nếu chốt đổi |
| 16 | `/kenh` | **301** | → `/kenh-mau` | nếu chốt đổi |
| 17 | `/raw` | **301** | → `/rawkenh` | |
| 18 | `/video/` (trailing slash) | **301** | → `/video` | R5 |
| 19 | `/video?market=US` | 200 | index.html | |
| 20 | `/api/admin-state` | 200 | JSON | |

### 8.2. Tầng 2 — Trạng thái FE (thủ công)

| # | Thao tác | URL kỳ vọng sau thao tác | Kiểm gì |
|---|---|---|---|
| 1 | Nhấp tab "Tài liệu" | `/tai-lieu` | URL, tab active, title `Tài liệu — H2DEV` |
| 2 | Nhấp nút 🎧 "Nhạc nền" | `/nhac` | Modal mở **và** URL đổi |
| 3 | Đóng modal nhạc | `/tai-lieu` (route trước đó) | URL khôi phục |
| 4 | `/video` → lọc market `US` | `/video?market=US` | URL, filter UI, title `Video · US — H2DEV` |
| 5 | `/rawkenh` → sang trang 2 | `/rawkenh?page=2` | URL có `page=2` |
| 6 | Từ bước 5 → thêm `?rq=abc` | `/rawkenh?page=2&rq=abc` | Thứ tự param đúng [5.3](#53-thứ-tự-param-trên-url-để-url-ổn-định-dễ-so-sánh) |
| 7 | Từ bước 6 → nhấn **Back** | `/rawkenh?page=2` | **`rq` biến mất, `page=2` còn** |
| 8 | Từ bước 7 → nhấn **Back** | `/rawkenh` | `page` biến mất |
| 9 | `/chienluoc` → sub-tab "Quy trình A–Z" | `/chienluoc?sub=workflow` | URL, sub-tab active |
| 10 | F5 tại bước 9 | giữ `?sub=workflow` | Reload giữ đúng sub-tab |
| 11 | `/lotrinh/VIDEO-DD983D` → tab transcript | `/lotrinh/VIDEO-DD983D?tab=transcript` | URL player |

### 8.3. Tầng 3 — Chống hồi quy

| # | Kiểm | Kỳ vọng |
|---|---|---|
| 1 | Mọi URL trong [8.1](#81-tầng-1--http-status-local-1270018899--production-h2dev-learnhomecom) trả **HTTP 200** trên **cả** Local và Production | PASS 100% |
| 2 | Không còn URL nào trong bảng trả 404 | PASS |
| 3 | Mọi route có title **khác nhau** và khớp [7.2](#72-template-title-động-bắt-buộc) | PASS |
| 4 | `route-manifest.json` validate JSON + mọi `verified.httpStatus` khớp probe thật | PASS |
| 5 | Cache-busting: script/CSS/media có `?v=` — Cloudflare không phục vụ 404 cache | PASS |

---

## 9. Các điểm CẦN chủ dự án CHỐT

> **Em KHÔNG tự quyết.** Mỗi điểm dưới đây nêu phương án + khuyến nghị kỹ thuật. Điểm nào chốt xong thì cập nhật ngay vào tài liệu này + `route-manifest.json`.

### 9.1. `/tatca` — tab thứ 10 hay view tổng hợp?

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A** | Thêm tab thứ 10 vào `TABS`; `/tatca` = tab ngang hàng, gộp mọi danh sách có search/filter | Đúng kỳ vọng "tất cả là /tatca"; có URL rõ | +1 tab trên sidebar (hiện 9 → 10); cần thêm icon; tăng tải dữ liệu |
| **B** | `/tatca` = view aggregation read-only gộp card từ mọi nguồn, không phải tab điều hướng | Không phá cấu trúc 9 tab | Vẫn là 1 route mới; khó biết "đang ở tab nào" |
| **C** | Không thêm; coi `/` (Tổng quan) đã là "tất cả" | Không cần thi công | Không đúng yêu cầu chủ dự án |

➡️ **Khuyến nghị: Phương án A.** Lý do: chủ dự án nói rõ *"ví dụ tất cả là /tatca rồi /... từ mục từng tab"* → `/tatca` là **điểm neo cấp cao**, ngang hàng với các tab, và là nơi liệt kê mọi thứ để nhấp sâu xuống tab con. Đây là mô hình "hub & spoke" — `/tatca` là hub.

### 9.2. `/kichban` → `/tai-lieu`, giữ nguyên?

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A — Đổi** | Slug mới `/tai-lieu`; `301 /kichban → /tai-lieu` | Khớp R6, người dùng đoán được; đúng nguyện vọng "rõ từng tiền tố" | Phải sửa BE whitelist + FE `openTab` + thêm redirect; bookmark cũ phụ thuộc redirect |
| **B — Giữ** | Giữ `/kichban`, đổi nhãn UI thành "Kịch bản" cho khớp slug | Không đụng routing | Nhãn "Kịch bản" **sai nội dung** — tab chứa tài liệu/công cụ/prompt, không phải kịch bản |
| **C — Alias** | Giữ `/kichban` là canonical, thêm `/tai-lieu` redirect ngược về `/kichban` | Ít sửa BE | Người dùng vẫn thấy URL khó đoán — **không giải quyết vấn đề** |

➡️ **Khuyến nghị: Phương án A.** Lý do: nhãn UI **đã** là "Tài liệu" (`main.js:66`); slug lệch nhãn là vi phạm R6 nặng nhất hệ thống. Có `301` thì bookmark cũ vẫn sống → rủi ro thấp.

### 9.3. `/rawkenh` → `/raw-kenh`?

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A — Giữ** | `rawkenh` viết liền | Không đụng gì; đang 200 | Vi phạm nhẹ R3 (từ ghép nên có gạch ngang) |
| **B — Đổi** | `/raw-kenh` + `301 /rawkenh → /raw-kenh` | Chuẩn R3 | Thêm 1 redirect; đụng BE whitelist |

➡️ **Khuyến nghị: Phương án A (giữ nguyên).** Lý do: `rawkenh` **đọc hiểu ngay**, không mơ hồ; đổi chỉ để "đẹp quy tắc" mà sinh thêm redirect + sửa BE. Ghi nhận là **ngoại lệ có ý thức** của R3. (Nếu chủ dự án muốn tuyệt đối nhất quán thì chọn B.)

### 9.4. `/tongquan` vs `/` — canonical?

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A** | `/` là canonical; `/tongquan` giữ 200 + `<link rel="canonical" href="/">` | Không phá link cũ; 1 canonical rõ | 2 URL cùng nội dung (chấp nhận được nhờ canonical) |
| **B** | `/` **301** → `/tongquan` | 1 URL duy nhất | Đổi URL trang chủ — rủi ro SEO/bookmark |
| **C** | `/tongquan` **301** → `/` | 1 URL duy nhất, trang chủ ở `/` | Link `/tongquan` cũ phải đi qua redirect |

➡️ **Khuyến nghị: Phương án C.** Lý do: `/` là URL ngắn nhất, tự nhiên nhất cho trang chủ (R14 yêu cầu 1 URL cho 1 trạng thái). `openTab` đã build `/` cho tongquan (`main.js:160`), nên FE đã nghiêng về `/` làm canonical.

### 9.5. `/lotrinh/<sku>` rác xử lý thế nào?

| Phương án | Hành vi | Ưu | Nhược |
|---|---|---|---|
| **A — 404** | SKU không tồn tại → trang 404 + gợi ý về `/lotrinh` | Rõ ràng, đúng chuẩn web | Cần BE biết danh sách SKU hợp lệ |
| **B — 302** | SKU rác → `302 /lotrinh` (về danh sách lộ trình) | Người dùng không gặp ngõ cụt | Che giấu lỗi; URL xấu im lặng |
| **C — 200 + empty state** | player.html render "Không tìm thấy bài học" | Không cần sửa BE | Vẫn 200 cho URL rác → sai SEO + khó check-pass |

➡️ **Khuyến nghị: Phương án A.** Lý do: 404 là tín hiệu đúng cho "tài nguyên không tồn tại", và giúp **check-pass phát hiện lỗi** thay vì che. Cần BE đọc danh sách SKU hợp lệ (nguồn: `data-tabs` / catalog bài học) để validate.

### 9.6. Nhạc nền: tab riêng hay modal có URL?

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A — Route `/nhac` mở modal** | `/nhac` dựng lại = mở `openMusicStudioModal()` | Giữ UX modal hiện tại; có URL | Modal ≠ trang → cần state machine mở/đóng theo URL |
| **B — Tách thành tab thật** | Nhạc nền thành tab ngang hàng trong `TABS` | Nhất quán với 9 tab | Đổi cấu trúc điều hướng; nhạc nền hiện là công cụ, không phải tab nội dung |
| **C — Trang riêng `music.html`** | Shell thứ 4 chuyên nhạc | Tách bạch tuyệt đối | Thêm 1 shell phải bảo trì token/shell/ARIA |

➡️ **Khuyến nghị: Phương án A.** Lý do: hiện nút 🎧 **có sẵn 2 entry + 1 modal** trên topbar (`index.html:260`, `music_player_modal.js:74`), chỉ thiếu URL. Thêm route mở modal là **chi phí nhỏ nhất, đúng nguyện vọng** "Nhấp nhạc cũng cần /nhac", không phá cấu trúc tab.

### 9.7. Modal có URL: phạm vi nào?

| Phương án | Mô tả |
|---|---|
| **A — Chỉ modal có ngữ cảnh sâu** | Chỉ `/modal/nhac`, `/modal/quick-video`, `/modal/raw-image` (3 modal có nội dung đáng share) |
| **B — Mọi modal** | Mọi modal đều có route, kể cả modal xác nhận ngắn |
| **C — Không modal nào** | Modal thuần ephemeral, không vào URL |

➡️ **Khuyến nghị: Phương án A.** Lý do: modal xác nhận/thông báo là **ephemeral**, đưa vào URL gây rác history. Chỉ modal có nội dung share được mới cần URL. **Đặc biệt lưu ý:** `#raw-channel-modal` hiện là **CSS DEAD** (`index.html:19-47` có CSS nhưng **không có JS/DOM**) — **cấm** tạo route cho tới khi có DOM/JS thật.

### 9.8. Param `sub` vs đặt sub-tab vào path?

| Phương án | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| **A — Query** | `/chienluoc?sub=workflow` | Đúng R7 (state lá → query); không phình path | Query dài hơn |
| **B — Path** | `/chienluoc/workflow` | Path "đẹp" | Trùng pattern `/lotrinh/<sku>` → dễ nhầm detail vs sub-tab |

➡️ **Khuyến nghị: Phương án A.** Lý do: R7 chốt state lá dùng query; path chỉ dành cho tài nguyên có ID (như SKU). Giữ path phẳng giúp phân biệt rõ **trang vs trạng thái trang**.

---

## 10. Phân công FE / BE

| Loại route | Ai lo | Cơ chế | Ví dụ |
|---|---|---|---|
| **Route trang (top-level)** | **BE (bắt buộc)** + FE (best-effort) | BE: whitelist regex rewrite → serve file. FE: `pushState` khi nhấp tab | `/video`, `/tai-lieu`, `/nhac`, `/tatca` |
| **Route detail** | **BE** (rewrite) + **FE** (đọc `pathname` + validate) | BE rewrite `/lotrinh/<sku>` → `player.html`; FE parse SKU từ `pathname` | `/lotrinh/VIDEO-DD983D` |
| **Route redirect cũ** | **BE (bắt buộc)** | BE trả `301`/`302` `Location` header | `/kichban → /tai-lieu` |
| **Trailing slash** | **BE (bắt buộc)** | BE `301` bỏ slash | `/video/ → /video` |
| **Filter / phân trang / cờ** | **FE (bắt buộc)** | `history.pushState` / `replaceState` | `?market=`, `?page=`, `?free=1` |
| **Sub-tab / sub-state** | **FE (bắt buộc)** | `pushState` trong handler sub-tab | `?sub=workflow`, `?tab=transcript` |
| **Modal state** | **FE (bắt buộc)** | `pushState` khi mở, `popstate` khi đóng | `/modal/nhac` |
| **Title động** | **FE (bắt buộc)** | `document.title` trong cùng hàm đổi tab | mọi tab |
| **Canonical** | **Cả hai** | FE `<link rel="canonical">` + BE header khi reverse proxy | `/tongquan` → `/` |
| **API** | **BE (bắt buộc)** | Xử lý trước khi fallthrough static | `/api/*` |
| **404** | **BE (bắt buộc)** | Fallthrough static hiện trả `404: <path>` `text/plain` | `/khong-ton-tai` |
| **Route chết** | **BE (bắt buộc) + FE (BẮT BUỘC phối hợp)** | BE redirect; FE phải build URL chuẩn để không sinh link chết | — |

### 10.1. Vị trí sửa (khi được chủ dự án cho phép thi công)

| Việc | File | Vị trí chính xác |
|---|---|---|
| Thêm slug whitelist | `server.js` | dòng `371` — regex `/^\/(?:tongquan\|video\|...)\/?$/i` |
| Thêm redirect cũ | `server.js` | trước dòng `363` (trước khối rewrite) |
| Validate SKU | `server.js` | dòng `363-370` |
| Thêm tab `/tatca` + đổi slug | `assets/app/main.js` | `TABS` dòng `61-71` |
| Build URL đủ param | `assets/app/main.js` | `openTab()` dòng `158-172` |
| Khôi phục đủ state | `assets/app/main.js` | `popstate` dòng `782-792` |
| Title động | `assets/app/main.js` | trong `openTab()` |
| Sub-tab Chiến lược → URL | `assets/app/main.js` | handler `strategy-tab` (dòng `664-668`) |
| Modal nhạc → URL | `assets/music_player_modal.js` | `openMusicStudioModal` dòng `74` |
| Sub-tab player → URL | `assets/app/player-main.js` | `setPlayerTab` (dòng `120`, `657`) |

> ⚠️ **Bảng này là bản đồ thi công, KHÔNG phải lệnh sửa.** Theo ràng buộc nhiệm vụ hiện tại, **em chưa sửa bất kỳ dòng code nào**. Cần chủ dự án ra lệnh riêng cho từng file.

---

## 11. Phụ lục — Nhật ký kiểm chứng (probe thật)

**Thời điểm:** `2026-09-23` · **Môi trường:** Local `http://127.0.0.1:8899` · **Công cụ:** `Invoke-WebRequest` (HTTP thật, không mô phỏng)

| URL | HTTP | Bytes | Kết luận |
|---|---|---|---|
| `/` | 200 | 11354 | index.html |
| `/tongquan` | 200 | 11354 | = `/` cùng file |
| `/lotrinh` | 200 | 2847 | learn.html |
| `/video` | 200 | 11354 | index.html |
| `/ngachxanh` | 200 | 11354 | index.html |
| `/kichban` | 200 | 11354 | index.html |
| `/nguonreup` | 200 | 11354 | index.html |
| `/kenh` | 200 | 11354 | index.html |
| `/rawkenh` | 200 | 11354 | index.html |
| `/chienluoc` | 200 | 11354 | index.html |
| `/player.html` | 200 | 14946 | player.html |
| `/lotrinh/VIDEO-DD983D` | 200 | 14946 | player.html (SKU hợp lệ) |
| `/lotrinh/khong-ton-tai-xyz` | 200 | 14946 | ⚠️ **SAI** — SKU rác vẫn 200 |
| **`/nhac`** | **404** | 10 | `text/plain` body `404: /nhac` |
| **`/tatca`** | **404** | — | chưa có route |
| **`/kenh-mau`** | **404** | — | chưa có route |
| **`/tai-lieu`** | **404** | — | chưa có route |
| **`/raw`** | **404** | — | chưa có route |
| `/video?market=US` | 200 | 11354 | filter không phá route |
| `/api/admin-state` | 200 | 101 | API sống |
| `/api/search` | 200 | 35 | API sống |

**Bằng chứng bổ sung:** `server.js:360` (`urlPath = '/index.html'`) · `server.js:363-373` (whitelist 9 slug) · `server.js:94-98` (fallthrough 404 `text/plain`) · `main.js:61-71` (TABS 9 tab) · `main.js:158-172` (build URL 8 param) · `main.js:782-792` (popstate 3 state) · `player-main.js:258` (title player) · `content.js:602` (`href="/lotrinh/${sku}"`) · `player-main.js:14` (`replaceState` `/lotrinh/<sku>`).

---

## 12. Lịch sử thay đổi tài liệu

| Ngày | Thay đổi | Người |
|---|---|---|
| 2026-09-23 | Khởi tạo. Đo thực tế 21 URL. Phát hiện 5 route chết. Đề xuất cây URL 13 route cấp trang + 3 modal + 5 API. Nêu 8 điểm chờ chốt. | Em (Kiến trúc sư hệ thống) |

> **Bắt buộc:** mọi lần đổi route phải cập nhật **đồng thời** `URL-ROUTING-SPEC.md` **và** `route-manifest.json` trong **cùng 1 lượt commit** (theo `SKILL.md` mục "URL And Routing Rules").
