# ĐỐI CHIẾU NGÁCH (NICHE) + THỊ TRƯỜNG (MARKET) — KHO H2DEV 129 VIDEO

**Ngày:** 2026-08-17 · **Loại task:** RESEARCH (chỉ đọc + phân tích, không sửa file)
**Nguồn dữ liệu đã đọc:**
- `data-tabs/videos.json` — 129 video (sku, title, niche, market[], …)
- `data-tabs/ngach-xanh.json` — định nghĩa 12 nhãn ngách + thị trường xanh/phụ
- `data-tabs/kenh-mau.json` — 131 kênh mẫu (handle, niche, niches[], markets[])
- `data/catalog_full.json` — 129 records, 93 có `desc` (hỗ trợ xác định nội dung)

**Lưu ý phương pháp:** Kết luận dựa trên đối chiếu **title + desc + kênh đối thủ trong desc**. Không xem nội dung video, nên các flag "nghi sai" được chia 2 mức: **CAO** (title mâu thuẫn trực tiếp) và **TRUNG BÌNH** (không đủ căn cứ trong title/desc, cần xác nhận bằng nội dung video).

---

## 1. ĐÁNH GIÁ TỔNG THỂ

### 1.1 Phân loại ngách (niche) — ƯỚC TÍNH ~86% CHUẨN
- 129/129 video **đều có niche** (không bỏ sót) — cấu trúc đầy đủ.
- **8 video gắn SAI rõ** (6,2%): chủ yếu là **video hướng dẫn edit/thumb/tool bị gắn nhãn nội dung** (Drama/Stories, Triết lý) và **video tool bị gắn nhãn Prompt/Reup**.
- **~10 video NHẬP NHẰNG** (7,8%): video lai "share key + quy trình" hoặc "share key + edit" — nhãn hiện tại có thể chấp nhận nhưng không phải nhãn tối ưu.
- **~111 video chuẩn/không tranh cãi** (~86%).

**Vấn đề hệ thống:** Quy ước gắn nhãn **không nhất quán** giữa 2 triết lý:
- Nhóm A — gắn theo **ngách nội dung của KEY** (vd `VIDEO-70f1f1` Đức Phật/Chúa → Triết lý; `VIDEO-502960` drama Nhật → Drama).
- Nhóm B — gắn theo **loại video/quy trình** (vd `VIDEO-1b4be3`, `VIDEO-8b69c9` — video nói cách edit tránh lỗi → Kiếm tiền/Chính sách; `VIDEO-DD983D`, `VIDEO-484f9e`, `VIDEO-9aff6d` — có từ "cách edit" → Edit/Thumb).
→ Cần chốt **1 quy ước duy nhất** (đề xuất ở mục 6).

### 1.2 Phân loại thị trường (market) — ƯỚC TÍNH ~72% SỐ ĐÃ GẮN LÀ CHUẨN
- 85/129 video có market; **44 video chưa gắn** (34%) — nhưng **đa số trong số 44 là bài quy trình chung hợp lệ để trống** (chỉ ~10 cái có thể suy market từ desc).
- Trong 85 video đã gắn: **25 video có market KHÔNG được title nhắc tới** (nghi gắn sai/thừa). Vấn đề lặp lại rõ nhất:
  - **"🇬🇧 Anh" thừa trong 8/9 video** (chỉ 1 video title nhắc Anh).
  - **"🇨🇳 Trung" thừa trong 8/16 video** (title chỉ nói Nhật/Hàn/Việt nhưng bị thêm Trung).
  - Một số "🇰🇷 Hàn" (5 video), "🇺🇸 US" (2), "🇷🇺 Nga" (2) gắn mà title không nói nước nào.
- Không thấy video nào gắn market MÀ title nói nước khác hẳn (kiểu "title Nhật nhưng gắn Hàn") — các tag thừa chủ yếu là **thêm vào**, không phải thay thế sai.

### 1.3 Kênh mẫu — ĐÁNG LO NHẤT
- 131 kênh: **36 kênh gắn "Khác"** (27%) — nhưng **đa số thực ra thuộc Sức khỏe/Triết lý/Kinh tế/Lịch sử** rõ ràng qua handle.
- **~30 kênh gắn nhãn vận hành (Nhân bản/Kênh, Kiếm tiền, Edit/Thumb, Prompt/AI) thay vì ngách nội dung** — handle cho thấy đây là kênh nội dung thật (Bible, sức khỏe senior, kinh tế, phật giáo…).
- 21 kênh chưa gắn markets — đa số suy được từ ngôn ngữ handle.
- **Kênh mẫu = dữ liệu "học mẫu" quan trọng nhất của kho** (ngách/market của kênh là nguồn suy luận khi title video không đủ). Việc gắn sai ở đây ảnh hưởng luôn chất lượng gắn tag video.

---

## 2. PHẦN 1 — NGÁCH: VIDEO GẮN SAI / NHẬP NHẰNG

### 2.1 Gắn SAI rõ (mức CAO — nên sửa)

| # | SKU | Hiện tại | Title/desc cho thấy | Đề xuất |
|---|-----|----------|---------------------|---------|
| 1 | `VIDEO-64130d` | Reup / Hoạt hình | "TOOL DỊCH PHỤ ĐỀ SRT VIP - HƯỚNG DẪN DÙNG TOOL DỊCH PHỤ ĐỀ SRT" — đây là video giới thiệu/ hướng dẫn tool | **Nền tảng / Tool** |
| 2 | `VIDEO-04c2e3` | Prompt / AI | "Tool Elevenlab, Clone Minimax, Dịch SRT, Tài Khoản ChatGPT Plus/CapCut Pro - Giá rẻ" — bán tool/tài khoản | **Nền tảng / Tool** |
| 3 | `VIDEO-cb907b` | Kinh tế / Tài chính | "FULL QUY TRÌNH HƯỚNG DẪN REUP NGÁCH VIEW VIỆT RPM 2$" (desc: reup douyin, câu lệnh thumb) — trọng tâm là **reup** | **Reup / Hoạt hình** |
| 4 | `VIDEO-ed1be9` | Drama / Stories | "Hướng dẫn edit key _Chill Dude_ chi tiết từ A-Z" — video dạy **edit**, Chill Dude chỉ là key ví dụ | **Edit / Thumb** |
| 5 | `VIDEO-b559c8` | Drama / Stories | "Hướng dẫn làm thumb ngách nhỏ trong key người que - Chill Dude" — video dạy **thumb** | **Edit / Thumb** |
| 6 | `VIDEO-a348a5` | Triết lý / Tâm linh | "Hướng dẫn làm thumb key triết lý _ khắc kỷ" — video dạy **thumb** | **Edit / Thumb** |
| 7 | `VIDEO-b96929` | Triết lý / Tâm linh | "Hướng dẫn edit key triết lý _ khắc kỷ chi tiết từ A-Z" — video dạy **edit** | **Edit / Thumb** |
| 8 | `VIDEO-61e354` | Nhân bản / Kênh | "Hướng Dẫn Tư Duy Tìm, Lọc Key Youtube View Ngoại, Xác Định Được Key Trends, Key Ngon" — nội dung là **chọn key/ngách**, không phải nhân bản kênh | **Share key / Ngách nhỏ** |

### 2.2 Nhập nhằng (mức TRUNG BÌNH — cần chốt quy ước trước khi sửa)

| # | SKU | Hiện tại | Lý do nhập nhằng | Hướng đề xuất |
|---|-----|----------|------------------|---------------|
| 1 | `VIDEO-e90874` | Nhân bản / Kênh | "Tặng Prompt Master Tự Nhân Bản…" — trọng tâm là **prompt**, nhân bản chỉ là mục đích dùng | Prompt / AI |
| 2 | `VIDEO-a2b317` | Kiếm tiền / Chính sách | "4 VIDEO NGÁCH US NỔ 3 TRIỆU VIEW + SHARE THÊM 3 NGÁCH US + NGA" — không phải bài chính sách, là **share key + show kênh** | Share key / Ngách nhỏ (hoặc Nhân bản) |
| 3 | `VIDEO-3f85a1` | Kinh tế / Tài chính | "SHARE KEY NGÁCH BÁN CONTENT… RPM CỰC CAO" — title không nói kinh tế; kênh đối thủ `@100歳まで元気1` (senior health Nhật) → RPM cao có thể là sức khỏe | Share key / Ngách nhỏ (xác nhận nội dung) |
| 4 | `VIDEO-134a25` | Kinh tế / Tài chính | "NGÁCH THỊ TRƯỜNG NHẬT BẢN TRENDS CỰC CAO - RPM 6-8" — kênh đối thủ `@偉人のコンパス1` (triết lý vĩ nhân) | Triết lý hoặc Share key (xác nhận) |
| 5 | `VIDEO-7e00ee` | Kinh tế / Tài chính | "RPM 8-15 VỚI 2 NGÁCH… NHẬT" — kênh `@人生の感動物語` (drama/cảm động) + `@老後の誤算` (hưu trí) | Lai Drama + Kinh tế → Share key |
| 6 | `VIDEO-5fd052` | Triết lý / Tâm linh | "SHARE 3 NGÁCH… (TRUYỆN + STORIES + TRIẾT LÝ)" — 1 video share 3 ngách | Share key / Ngách nhỏ |
| 7 | `VIDEO-44cf22` | Kinh tế / Tài chính | "Share key và giải thích về chủ đề rpm cao ở các thị trường" — share key chung | Share key / Ngách nhỏ |
| 8 | `VIDEO-5cb825` | Nhân bản / Kênh | "Share Key Và Hướng Dẫn Làm Youtube View Ngoại Và Prompt Lấy + Tạo Kịch Bản" — share key + prompt | Share key (hoặc Prompt) |
| 9 | `VIDEO-aacc70` | Nhân bản / Kênh | "Tút Bám Theo Key Đối Thủ Làm Video Không Bao Giờ Bị 0 View" — nói về **key**, không phải nhân bản | Share key / Ngách nhỏ |
| 10 | `VIDEO-af606d` | Nhân bản / Kênh | "SHOW KEY KÊNH MỚI CỰC NGON THỊ TRƯỜNG HÀN" — show **key** | Share key / Ngách nhỏ |

> ⚠️ **Trường hợp NGƯỢC LẠI (ngách nội dung bị gắn nhãn vận hành) — đúng trọng tâm câu hỏi:** Trong kho video, hầu hết video "ngách nội dung" (Bible, tâm linh, kinh tế, sức khỏe…) đã được gắn đúng nhãn nội dung (`VIDEO-469cb5` kênh Bible→Nhân bản là do **video đó là bài cập nhật kênh đối thủ**, không phải sai). Không phát hiện video nào title thuộc "ngách nội dung" thuần mà bị gắn "Share key"/"Nhân bản" một cách sai — nhưng có **~10 video share-key/nhân-bản đang bị gắn theo ngách nội dung của key** (mục 2.1–2.2 trên) khiến dữ liệu không nhất quán.

---

## 3. PHẦN 2 — THỊ TRƯỜNG (MARKET)

### 3.1 44 video CHƯA GẮN market — phân loại

**Nhóm A — Đúng là bài quy trình chung, NÊN ĐỂ TRỐNG (31 video):**

| SKU | Lý do |
|-----|-------|
| `VIDEO-e90874`, `VIDEO-54c8f7`, `VIDEO-54422c`, `VIDEO-891f32`, `VIDEO-3e943c` | Train prompt / dùng Claude — quy trình chung, không thuộc thị trường nào |
| `VIDEO-1aaf46`, `VIDEO-7312df`, `VIDEO-e9e879`, `VIDEO-b1208e`, `VIDEO-5785a5`, `VIDEO-2469ee`, `VIDEO-acd33f`*, `VIDEO-34c92b` | Show kênh reup/khám kênh — không nói nước (*xem 3.2) |
| `VIDEO-4425fc`, `VIDEO-00136f` | Hướng dẫn tạo/fix AdSense — quy trình chung |
| `VIDEO-46c57e`, `VIDEO-ec9c50`, `VIDEO-ff9be6`, `VIDEO-9ea5e3` | Chính sách (kháng lỗi, trùng lặp, gãy view) — chung |
| `VIDEO-2553da`, `VIDEO-21824a`, `VIDEO-199f44`, `VIDEO-027064`, `VIDEO-943781`, `VIDEO-7db740`, `VIDEO-5c438a` | Build/ngâm/SEO kênh, nuôi mail — chung |
| `VIDEO-61e354`, `VIDEO-3df94e`, `VIDEO-5cb825`, `VIDEO-aacc70`, `VIDEO-f59aa7`, `VIDEO-44cf22`, `VIDEO-ba3904`, `VIDEO-d20744` | "view ngoại"/tư duy/tool/community — chung |
| `VIDEO-ed1be9`, `VIDEO-a348a5`, `VIDEO-b96929`, `VIDEO-b559c8`, `VIDEO-8e0275` | Hướng dẫn edit/thumb — chung |

**Nhóm B — CÓ THỂ gắn market từ desc/kênh đối thủ (13 video — mức TRUNG BÌNH):**

| SKU | Căn cứ (desc/kênh) | Đề xuất |
|-----|--------------------|---------|
| `VIDEO-e24c31` | Desc: `@복이오는길`, `@mokamoka-e9f` (Hàn) | 🇰🇷 Hàn |
| `VIDEO-a7bfd0` | Desc: `@은밀한응답`, `@장수채소습관` (Hàn) | 🇰🇷 Hàn |
| `VIDEO-d2cd90` | Desc: `@시니어살림노트`(Hàn), `@アマテラス巫女あまね`(Nhật), `@スピリチュアルの泉`(Nhật)… | 🇰🇷 Hàn + 🇯🇵 Nhật |
| `VIDEO-9aff6d` | Desc: text thumb tiếng Nhật (`夜中3時〜4時に目が覚める人`…) | 🇯🇵 Nhật |
| `VIDEO-84a039` | Desc: `@イエスのアファメーション` (Nhật) | 🇯🇵 Nhật |
| `VIDEO-a1c98f` | Desc: text thumb tiếng Nhật | 🇯🇵 Nhật |
| `VIDEO-acd33f` | Desc: `@ChuXinDiaoYu01` (Trung), "câu cá vạn cân" | 🇨🇳 Trung |
| `VIDEO-5785a5` | Desc: `@Tieulongreview2026` (review Trung/Việt) | 🇨🇳 Trung (hoặc bỏ) |
| `VIDEO-54422c` | Desc: `@baeksehealth`, `@실버라디오-z4u` (Hàn) | 🇰🇷 Hàn |
| `VIDEO-458892` | Prompt "WORLD WAR II HISTORY" (tiếng Anh), key quân sự | 🇺🇸 US (xác nhận) |
| `VIDEO-21824a` | Desc: "Skill prompt - ngách bible explainer" (Bible = US) | 🇺🇸 US (xác nhận) |
| `VIDEO-e91589`/`VIDEO-f77c31`/`VIDEO-4a5aac` | (đã gắn — xem mục 3.3) | — |

### 3.2 VIDEO GẮN market NHƯNG TITLE KHÔNG NHẮC NƯỚC ĐÓ (nghi gắn sai/thừa — 25 video)

**Mức CAO (title/desc mâu thuẫn trực tiếp):**

| # | SKU | Market đang gắn | Title/desc | Đề xuất |
|---|-----|-----------------|------------|---------|
| 1 | `VIDEO-806c0c` | 🇬🇧 Anh | Title không nhắc nước nào | Bỏ Anh (hoặc xác nhận) |
| 2 | `VIDEO-d84a78` | 🇬🇧 Anh | Title không nhắc; **desc nói "phật pháp thị trường Hàn"** | Đổi 🇰🇷 Hàn hoặc bỏ |
| 3 | `VIDEO-9ef6fe` | 🇺🇸 US + 🇬🇧 Anh | Title chỉ nói US | Bỏ Anh |
| 4 | `VIDEO-91bb96` | 🇺🇸 US + 🇨🇦 Canada | Title: "US/ CANADA" — **Canada KHÔNG trong title** | Xác nhận hoặc bỏ Canada |
| 5 | `VIDEO-2ed37a` | 🇺🇸 US + 🇵🇭 PH + 🇬🇧 Anh | Title: "PHILIPPINES + VIEW HOA KỲ" | Bỏ Anh |
| 6 | `VIDEO-ffccd2` | 🇰🇷 Hàn + 🇬🇧 Anh | Title chỉ nói Hàn | Bỏ Anh |
| 7 | `VIDEO-95 ffccd2` (đã ở trên) | — | — | — |
| 8 | `VIDEO-4a5aac` | 🇻🇳 Việt + 🇬🇧 Anh | Title: "REUP VIETSUB" — chỉ Việt | Bỏ Anh |
| 9 | `VIDEO-15 e91589` | 🇯🇵 Nhật + 🇬🇧 Anh | Title chỉ nói Nhật | Bỏ Anh |
| 10 | `VIDEO-f77c31` | 🇻🇳 Việt + 🇬🇧 Anh | Title chỉ nói "view Việt" | Bỏ Anh |
| 11 | `VIDEO-502960` | 🇯🇵 Nhật + 🇨🇳 Trung | Title chỉ nói "DRAMA NHẬT BẢN" | Bỏ Trung |
| 12 | `VIDEO-9a6957` | 🇰🇷 Hàn + 🇨🇳 Trung | Title chỉ nói "KINH TẾ… HÀN" | Bỏ Trung |
| 13 | `VIDEO-1a7f58` | 🇯🇵 Nhật + 🇰🇷 Hàn + 🇨🇳 Trung | Title chỉ nói "HÀN + NHẬT" | Bỏ Trung |
| 14 | `VIDEO-33d701` | 🇯🇵 Nhật + 🇻🇳 Việt + 🇨🇳 Trung | Title nói "NHẬT & VIỆT" | Bỏ Trung |
| 15 | `VIDEO-7e00ee` | 🇯🇵 Nhật + 🇨🇳 Trung | Title chỉ nói Nhật | Bỏ Trung |
| 16 | `VIDEO-8b69c9` | 🇯🇵 Nhật + 🇰🇷 Hàn + 🇨🇳 Trung | Title nói Hàn+Nhật; kênh đối thủ toàn Hàn/Nhật | Bỏ Trung |
| 17 | `VIDEO-1b4be3` | 🇯🇵 Nhật + 🇻🇳 Việt + 🇨🇳 Trung | Title nói "NHẬT BẢN - VIỆT" | Bỏ Trung |
| 18 | `VIDEO-6ad3fe` | 🇨🇳 Trung | Title: "FIX LỖI NỘI DUNG KHÔNG TRUNG THỰC" — **"trung" là từ "trung thực", KHÔNG phải Trung Quốc** | Bỏ Trung (gắn nhầm do keyword) |
| 19 | `VIDEO-7f0bb4` | 🇺🇸 US + 🇷🇺 Nga | Title không nhắc nước nào | Bỏ hoặc xác nhận |
| 20 | `VIDEO-9f9fbc` | 🇷🇺 Nga | Title không nhắc; **desc kênh Nhật `ちょっとダークな心理学`** | Bỏ Nga → 🇯🇵 Nhật (xác nhận) |
| 21 | `VIDEO-04c2e3` | 🇺🇸 US | Title: "Tool Elevenlab… Giá rẻ" — không nhắc US | Bỏ US |
| 22 | `VIDEO-5c438a` | 🇺🇸 US | Title: chọn mail/kênh — không nhắc US | Bỏ hoặc xác nhận |
| 23 | `VIDEO-5d54d0` | 🇰🇷 Hàn | Title không nhắc; **desc: skill "Script_Akihiro Miwa_JP" (Nhật)** | Đổi 🇯🇵 Nhật hoặc bỏ |
| 24 | `VIDEO-3e943c` | 🇰🇷 Hàn | "Nên dùng bản web hay app? Claude AI" — chung, không nhắc Hàn | Bỏ Hàn |
| 25 | `VIDEO-9873fb` | 🇰🇷 Hàn | "Khám kênh thành viên Pro" — không nhắc nước | Bỏ hoặc xác nhận |
| 26 | `VIDEO-bf7b32` | 🇰🇷 Hàn | "Reup/ bán content cực mới" — không nhắc nước | Bỏ hoặc xác nhận |
| 27 | `VIDEO-3e5a21` | 🇰🇷 Hàn | "ADD quyền quản lý kênh và mail" — không nhắc nước | Bỏ hoặc xác nhận |

> Ghi chú trung thực: các tag Anh/Trung thừa **có thể bắt nguồn từ kênh đối thủ trong nội dung video** (không thể kiểm chứng từ title/desc). Với những video này cần xem nhanh nội dung để xác nhận trước khi xóa. Riêng `VIDEO-6ad3fe` gần như chắc chắn gắn nhầm do keyword "trung thực".

### 3.3 Video gắn market mà title KHÔNG nhắc nhưng CÓ THỂ đúng (không flag — mức thấp)
`VIDEO-91bb96` (Canada không trong title nhưng có thể từ nội dung), `VIDEO-3f85a1` (Canada+Nhật đều trong title ✓), `VIDEO-a2b317` (US+Nga đều trong title ✓), `VIDEO-105 ca266f` (4 nước đều trong title ✓), `VIDEO-8603a9` (HK+Hàn+Việt ✓).

### 3.4 Video "nghi gắn đúng cả 2 market" — xác nhận OK
`VIDEO-10 c5837a` (Nhật+Hàn+Việt ✓), `VIDEO-14 21956b` (Hàn+Nhật+Việt ✓), `VIDEO-19 817ae6` (Nhật+Việt ✓), `VIDEO-26 ca0b1a` (US→Việt ✓), `VIDEO-31 2235fb` (US+Thái ✓), `VIDEO-55 5c0b20` (US+Hàn+Việt ✓), `VIDEO-70 546afa` (Nhật+Việt ✓), `VIDEO-74 e25d3b` (Hàn+US ✓), `VIDEO-79 35014d` (Nhật+Hàn ✓), `VIDEO-81 34f417` (Việt+Hàn+Nhật ✓), `VIDEO-99 3ae732` (US+Việt ✓), `VIDEO-118 39ae49` (Nhật+Hàn+Việt ✓), `VIDEO-114 25fddf` (Nhật+Hàn ✓).

---

## 4. PHẦN 3 — ĐỐI CHIẾU KÊNH MẪU (131 KÊNH)

### 4.1 Kênh gắn "Khác" nhưng thực ra thuộc ngách cụ thể (36 kênh → ít nhất 24 kênh gắn lại được)

**→ Sức khỏe / Lão hóa (12):**
`@시니어살림노트`, `@HealthyToday0`, `@의사가숨긴건강법-z9n`, `@みんなの若返りアカデミア`, `@식탁보약·백세비결`, `@노후건강한끼`, `@건강백단-c2u`, `@ThựcPhẩmSứcKhoẻ-u8y`, `@kienthucthanhoc9`, `@漫画で学ぶシニアの健康CH-n8i`, `@SuGia_SucKhoe`, `@suckhoedongy99`, `@KhỏeVềGià`

**→ Triết lý / Tâm linh (8):**
`@quietstrength88` (stoicism), `@アマテラス巫女あまね` (miko/Shinto), `@スピリチュアルの泉-l4z`, `@金運と言葉の力`, `@PHONGTHUYTIEMTANG`, `@偉人の救い`, `@kotobano-housekibako`, `@IjinNoNouri`, `@空海の真理`, `@tritueconhanradio`, `@gockhuatnhansinh-official`, `@노년의마음`

**→ Kinh tế / Tài chính (4):**
`@RichPatternResearchInstitute`, `@お金の心理`, `@성실한경제학`, `@당신의경제학`

**→ Lịch sử / Quân sự (2):**
`@thecoldwartales` (Cold War), `@militarytactics113` (military tactics)

**→ Drama / Stories (2):**
`@izinnokatari` (異人の語り), `@シルバー世代の語り部` (storyteller)

**→ Không đủ căn cứ (giữ "Khác"):**
`@desidilse`, `@HinognaKaalamanYT`, `@VaultBoy001` (nếu thuộc video 33d701)

### 4.2 Kênh gắn NHÃN VẬN HÀNH nhưng thực chất là KÊNH NỘI DUNG (phổ biến nhất — cần chuyển nhãn)

**Từ "Nhân bản / Kênh" (38) → ngách nội dung thật:**
- **Triết lý / Tâm linh:** `@복이오는길` (phúc lành), `@은밀한응답`, `@Jinseioiyasukotoba`, `@asuhetsudukumichi`, `@イエスのアファメーション` (Jesus), `@meophongthuy-m7d`, `@プレアデス最終通知556`, `@biblemadeclear26`, `@scripturemadesimpleyt`, `@ScriptureMadeSimpleTV`, `@theopenscriptures`, `@BibleLegacyAssets98` (5 kênh Bible → US), `@trihueconhan-vn`, `@偉大さJAPAN721`, `@붓다의등불`, `@静思の道`, `@AnNhienChuyenDoiBinhDi`, `@FinalUrgency`
- **Sức khỏe / Lão hóa:** `@장수채소습관`, `@長生きの秘訣22`, `@노후의삶-s1s`, `@songkhoekhivegia`, `@Songkhoetungngay365`, `@늦기전에알아야할것`, `@BàiHọcTuổiGià-VN`, `@DoctorDr.Lee-h9t`, `@LightYogawithNatalie`, `@TuổiGiàRadio_VN`, `@songlausongkhoe360`, `@healthlonglife`
- **Kinh tế / Tài chính:** `@KapitalKompass-US`, `@똑똑해지는경제학-m2y`, `@방구석워런버핏`
- **Drama / Stories:** `@家族の物語449`, `@Dadstruerevenge`
- **Lịch sử:** `@새벽의두만강`

**Từ "Kiếm tiền / Chính sách" (7) → ngách nội dung:**
- `@조선야담소` → **Drama/Stories** (야담 = truyện kể lịch sử Hàn)
- `@江戸怪異ものがたり` → **Drama/Stories** (quái đàm Edo)
- `@남현진전문의` → **Sức khỏe** (bác sĩ)
- `@MindfulPawsPsychology` → Triết lý / Tâm linh (tâm lý học)
- `@UCeVwhrEnYjCNdaDr47x4dSw`, `@UCEGZ_eUt6HeseHScQEcqTxw`, `@UCqZpuhhJC5G4kfvBG7MTAXg` → không đủ căn cứ

**Từ "Edit / Thumb" (4) → ngách nội dung:**
- `@昔の人の知恵` → **Triết lý** (trí tuệ người xưa)
- `@DoctorJohnMeyers`, `@EricBennettMD` → **Sức khỏe** (bác sĩ US)
- `@kurumanozokitai` → không đủ căn cứ

**Từ "Prompt / AI" (2) → ngách nội dung:**
- `@baeksehealth`, `@실버라디오-z4u` → **Sức khỏe / Lão hóa** (senior Hàn)

**Từ "Kinh tế / Tài chính" (7) → nhãn khác:**
- `@100歳まで元気1` → **Sức khỏe / Lão hóa** (sống khỏe đến 100 tuổi)
- `@人生の感動物語-d7f` → **Drama / Stories**
- `@偉人のコンパス1` → **Triết lý / Tâm linh**
- `@fuetunoijin` → xác nhận

**Từ "Sức khỏe / Lão hóa" (4) → nhãn khác:**
- `@오싹한경제` → **Kinh tế / Tài chính** (kinh tế "rùng mình")

**Từ "Reup / Hoạt hình" (20) → ngách nội dung (nếu coi Reup là phương thức, không phải ngách):**
- `@fansdrWilliamLI` (Dr. William Li — sức khỏe), `@다시이팔청춘-k5d` (lão hóa), `@양자과학이야기` (khoa học), `@斎藤一人の福の言霊` (tâm linh)

### 4.3 Nhóm thiếu markets (21 kênh) — suy từ handle:

| Kênh | Suy từ handle | Đề xuất market |
|------|---------------|----------------|
| `@복이오는길`, `@은밀한응답`, `@baeksehealth`, `@실버라디오-z4u` | Tiếng Hàn | 🇰🇷 Hàn |
| `@アマテラス巫女あまね`, `@みんなの若返りアカデミア`, `@スピリチュアルの泉-l4z`, `@kurumanozokitai`, `@昔の人の知恵`, `@asuhetsudukumichi`, `@イエスのアファメーション` | Tiếng Nhật | 🇯🇵 Nhật |
| `@DoctorJohnMeyers`, `@EricBennettMD`, `@quietstrength88` | Tiếng Anh | 🇺🇸 US (hoặc Anh) |
| `@ChuXinDiaoYu01` | Tiếng Trung | 🇨🇳 Trung |
| `@kyzoravietsub`, `@HDVietsub-h7u` | "vietsub" | 🇻🇳 Việt |
| `@Tieulongreview2026` | review | 🇨🇳 Trung hoặc 🇻🇳 Việt (xác nhận) |
| `@mimymedia`, `@redvoices90` | — | Không đủ căn cứ |

### 4.4 Kênh gắn market KHÔNG khớp handle (phát hiện qua desc video):
- `@오싹한경제` gắn **Sức khỏe** nhưng handle = kinh tế (đang nằm trong video `VIDEO-35014d` nói "kênh ngách KINH TẾ thị trường HÀN") → chuyển Kinh tế ✓ (trùng 4.2).
- `@100歳まで元気1` gắn **Kinh tế** nhưng handle = sức khỏe senior → chuyển Sức khỏe ✓.

---

## 5. PHẦN 4 — LIST CHUẨN A-Z

### 5.1 Bảng ngách chuẩn (12 ngách, số liệu hiện tại + đề xuất)

| Ngách | Số video (hiện tại) | Số sau khi sửa (đề xuất) | Danh sách SKU | Ghi chú |
|-------|---------------------|--------------------------|---------------|---------|
| **Nhân bản / Kênh** | 38 | ~31 | e24c31, a7bfd0, e90874*, 21956b, e91589, 34c92b, 21824a, 84a039, 817ae6, 2277b3, f77c31, ca0b1a, 469cb5, 9f9fbc, 10f129, 2553da, 9873fb, e83319, 1a7f58, 5c0b20, 7f0bb4, 7db740, d84a78, e25d3b, e95a8f, 91bb96, af606d*, 3e5a21, 3ae732, aacc70*, 199f44, 027064, 943781, f59aa7, 3df94e, 5cb825*, 61e354*, 5c438a | (* = đề xuất chuyển đi: e90874→Prompt, af606d/aacc70/61e354/5cb825→Share key) |
| **Share key / Ngách nhỏ** | 23 | ~30 | 4b3c09, d2cd90, 348217, f74bb1, 2de9e4, 2ba0d1, 546afa, 34f417, 2ed37a, 9ef6fe, 7ae3d6, ffccd2, 5fe83a, 806c0c, 83a28e, 948336, ca266f, 8603a9, 82f8a8, 25fddf, 39ae49, 5c3116, bdfa54 | + nhận thêm: 61e354, af606d, aacc70, 5cb825, a2b317, 5fd052, 44cf22, 3f85a1, 134a25, 7e00ee (mức trung bình) |
| **Reup / Hoạt hình** | 21 | 21–22 | 28e1cc, c5837a, 1aaf46, 7312df, 2235fb, e9e879, b1208e, 1acb10, 28bb9b, 3fd0d9, 10ceec, acd33f, 5785a5, 64130d*, bf7b32, 4a5aac, 2469ee, dbd487, c1bd51, 026112, 9a4ddc | (*64130d → Tool); + nhận cb907b |
| **Kiếm tiền / Chính sách** | 10 | ~9 | 4425fc, 46c57e, a2b317*, ff9be6, 6ad3fe, 8b69c9, 1b4be3, ec9c50, 00136f, 9ea5e3 | (*a2b317 → Share key — mức TB) |
| **Triết lý / Tâm linh** | 8 | ~6 | 70f1f1, 33f474, d71802, 33d701, 5fd052*, 2aa1f7, a348a5*, b96929* | (*a348a5/b96929 → Edit; 5fd052 → Share key — mức TB) |
| **Prompt / AI** | 7 | 7–8 | 5d54d0, 54c8f7, 3e943c, 54422c, 04c2e3*, b380a1, 891f32 | (*04c2e3 → Tool); + nhận e90874 |
| **Kinh tế / Tài chính** | 6 | ~3–5 | 9a6957, 3f85a1*, 7e00ee*, cb907b*, 134a25*, 44cf22* | (*mức TB — có thể chuyển Share key; cb907b chắc chắn → Reup) |
| **Edit / Thumb** | 5 | 9 | DD983D, 484f9e, 9aff6d, a1c98f, 8e0275 | + nhận ed1be9, b559c8, a348a5, b96929 |
| **Drama / Stories** | 4 | 2–3 | 502960, de2564, ed1be9*, b559c8* | (*→ Edit/Thumb) |
| **Nền tảng / Tool** | 3 | 5 | 6283a6, ba3904, d20744 | + nhận 64130d, 04c2e3 |
| **Sức khỏe / Lão hóa** | 3 | 3 | bdfab7, 35014d, 86c1ec | — |
| **Lịch sử / Quân sự** | 1 | 1 | 458892 | — |

### 5.2 Bảng market chuẩn (11 market + chưa gắn)

| Market | Số video | Đánh giá |
|--------|----------|----------|
| 🇰🇷 Hàn | 29 | Phần lớn chuẩn; 5 video không có title xác nhận (5d54d0, 3e943c, 9873fb, bf7b32, 3e5a21) |
| 🇻🇳 Việt | 27 | Chuẩn cao (title nhắc Việt/vietsub hầu hết) |
| 🇯🇵 Nhật | 26 | Chuẩn cao |
| 🇨🇳 Trung | 16 | **8/16 nghi thừa** (title không nhắc Trung/douyin/bilibili) |
| 🇺🇸 US | 15 | 2 nghi thừa (04c2e3, 5c438a); 1 thiếu (458892 có thể thêm) |
| 🇬🇧 Anh | 9 | **8/9 nghi thừa** — chỉ ca266f có "Anh" trong title |
| 🇷🇺 Nga | 3 | 2 nghi thừa (7f0bb4, 9f9fbc) |
| 🇨🇦 Canada | 3 | Chuẩn (title đều nhắc) |
| 🇹🇭 Thái | 1 | Chuẩn |
| 🇵🇭 Philippines | 1 | Chuẩn |
| 🇭🇰 HongKong | 1 | Chuẩn |
| Chưa gắn | 44 | **31 hợp lệ để trống** (bài quy trình chung); **13 có thể gắn** từ desc (mục 3.1) |

---

## 6. DANH SÁCH CẦN SỬA (ưu tiên)

### 6.1 Ưu tiên 1 — SỬA NGAY (chắc chắn, 8 niche + 4 market)

**Niche (8):**
| SKU | Hiện tại | Đề xuất | Lý do |
|-----|----------|---------|-------|
| `VIDEO-64130d` | Reup / Hoạt hình | Nền tảng / Tool | Video tool dịch SRT |
| `VIDEO-04c2e3` | Prompt / AI | Nền tảng / Tool | Video bán tool/tài khoản |
| `VIDEO-cb907b` | Kinh tế / Tài chính | Reup / Hoạt hình | Video hướng dẫn reup |
| `VIDEO-ed1be9` | Drama / Stories | Edit / Thumb | Hướng dẫn edit |
| `VIDEO-b559c8` | Drama / Stories | Edit / Thumb | Hướng dẫn thumb |
| `VIDEO-a348a5` | Triết lý / Tâm linh | Edit / Thumb | Hướng dẫn thumb |
| `VIDEO-b96929` | Triết lý / Tâm linh | Edit / Thumb | Hướng dẫn edit |
| `VIDEO-61e354` | Nhân bản / Kênh | Share key / Ngách nhỏ | Tư duy tìm/lọc key |

**Market (4):**
| SKU | Hiện tại | Đề xuất | Lý do |
|-----|----------|---------|-------|
| `VIDEO-6ad3fe` | 🇨🇳 Trung | (bỏ) | Gắn nhầm do keyword "trung thực" |
| `VIDEO-5d54d0` | 🇰🇷 Hàn | 🇯🇵 Nhật (hoặc bỏ) | Desc: skill tên "…_JP" |
| `VIDEO-9f9fbc` | 🇷🇺 Nga | 🇯🇵 Nhật (hoặc bỏ) | Desc: kênh đối thủ tiếng Nhật |
| `VIDEO-d84a78` | 🇬🇧 Anh | 🇰🇷 Hàn (hoặc bỏ) | Desc: phật pháp thị trường Hàn |

### 6.2 Ưu tiên 2 — RÀ SOÁT (mức trung bình, cần xem nhanh nội dung trước khi sửa)

- **Niche:** e90874 (→Prompt), a2b317 (→Share key), 3f85a1, 134a25, 7e00ee, 44cf22 (→Share key hoặc xác nhận Kinh tế), 5fd052 (→Share key), 5cb825 (→Share key/Prompt), aacc70, af606d (→Share key).
- **Market (bỏ tag thừa nếu nội dung không xác nhận):** Anh trên `VIDEO-806c0c`, `VIDEO-9ef6fe`, `VIDEO-2ed37a`, `VIDEO-ffccd2`, `VIDEO-4a5aac`, `VIDEO-e91589`, `VIDEO-f77c31`; Trung trên `VIDEO-502960`, `VIDEO-9a6957`, `VIDEO-1a7f58`, `VIDEO-33d701`, `VIDEO-7e00ee`, `VIDEO-8b69c9`, `VIDEO-1b4be3`; Hàn trên `VIDEO-3e943c`, `VIDEO-9873fb`, `VIDEO-bf7b32`, `VIDEO-3e5a21`; US trên `VIDEO-04c2e3`, `VIDEO-5c438a`; US+Nga trên `VIDEO-7f0bb4`.
- **Market thiếu (có thể gắn từ desc):** `VIDEO-e24c31`→Hàn, `VIDEO-a7bfd0`→Hàn, `VIDEO-d2cd90`→Hàn+Nhật, `VIDEO-9aff6d`→Nhật, `VIDEO-84a039`→Nhật, `VIDEO-a1c98f`→Nhật, `VIDEO-acd33f`→Trung, `VIDEO-5785a5`→Trung, `VIDEO-54422c`→Hàn, `VIDEO-458892`→US, `VIDEO-21824a`→US.

### 6.3 Ưu tiên 3 — CHUẨN HÓA KÊNH MẪU (kenh-mau.json)
- Chuyển **24–28 kênh "Khác"** sang ngách cụ thể (mục 4.1).
- Chuyển **~30 kênh nhãn vận hành** sang ngách nội dung thật (mục 4.2) — đặc biệt 5 kênh Bible, ~12 kênh sức khỏe, 3 kênh kinh tế.
- Gắn markets cho **21 kênh đang trống** (mục 4.3).
- Sửa 2 kênh gắn market/nhãn mâu thuẫn với handle: `@오싹한경제` (Sức khỏe→Kinh tế), `@100歳まで元気1` (Kinh tế→Sức khỏe).

---

## 7. ĐỀ XUẤT HÀNH ĐỘNG ĐỂ CHUẨN 100%

1. **Chốt 1 quy ước gắn nhãn** (quan trọng nhất): Đề xuất **"nhãn = nội dung chính mà video dạy"** —
   - Video "share key" thuần → `Share key / Ngách nhỏ` (kể cả khi key thuộc ngách nội dung — ngách của key ghi vào cột `notes`/`tags`, không ghi vào `niche`).
   - Video "hướng dẫn edit/thumb/tool/quy trình" → nhãn tương ứng (Edit/Thumb, Nền tảng/Tool, Kiếm tiền/Chính sách).
   - Chỉ gắn nhãn nội dung (Triết lý, Kinh tế, Sức khỏe…) khi video **dạy làm chính ngách đó từ A-Z** (vd `VIDEO-2aa1f7`).
2. **Market = chỉ gắn thị trường mà title/desc/trang video xác nhận.** Bỏ thói quen gắn "Anh/Trung" theo suy đoán. Sau khi sửa, chạy lại script kiểm tra "market không xuất hiện trong title" để chặn tái phát.
3. **Với 13 video chưa gắn market có kênh đối thủ trong desc:** xem nhanh 30–60s đầu video để xác nhận trước khi gắn (tránh suy đoán sai từ handle).
4. **Chuẩn hóa kenh-mau.json trước** (vì đây là "từ điển" giúp suy ngách/market cho video): chuyển nhãn vận hành → ngách nội dung, gắn markets còn thiếu.
5. **Thiết lập kiểm tra tự động:** script so niche/market theo bảng từ khóa chuẩn (12 nhãn, 11 market) chạy định kỳ, output danh sách nghi vấn — tránh lệ thuộc rà tay.
6. **Ngưỡng mục tiêu:** niche ≥ 98% (sau khi chốt quy ước), market: 44 bài chung để trống hợp lệ + toàn bộ video có thị trường rõ ràng được gắn đủ, không tag thừa.

---

*Báo cáo dựa trên dữ liệu đọc trực tiếp từ 4 file JSON. Mọi flag mức "TRUNG BÌNH" cần xác nhận bằng nội dung video trước khi áp dụng.*
