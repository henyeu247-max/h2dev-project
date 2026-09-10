# KIỂM CHỨNG 23 KÊNH DEAD — TÌM HANDLE MỚI (2026-08-20)

> Phương pháp: vidIQ channel_search (fuzzy) → mở URL gốc (firecrawl maxAge=0) → web search (exa/tavily/jina) tìm handle thay thế theo tên kênh bản xứ. Mỗi kênh xác nhận bằng ≥2 nguồn. Không sửa `data-tabs/kenh-mau.json` — chỉ báo cáo (chờ duyệt trước khi ghi).

## Kết quả phân loại (23 kênh)

### ✅ TÌM THẤY HANDLE MỚI (10 kênh — xác minh kênh còn sống, đổi handle hoặc cùng thương hiệu)

| # | Handle cũ | Handle mới | Title kênh | Bằng chứng |
|---|-----------|------------|------------|------------|
| 9 | `@UC-pBHWL4Eb7QwBTF0072Afg` | **`@투자전략-n7u`** | 투자 전략 (KR finance) | URL cũ 404 nhưng `/channel/UC-pBHWL4Eb7QwBTF0072Afg` còn 200; vidIQ xác nhận cùng channelId = handle mới. **Đáng tin NHẤT (cùng channel ID)** |
| 14 | `@人生の感動物語-d7f` | **`@人生の感動物語-16`** | 人生の感動物語 (JP storytelling) | vidIQ tìm kênh cùng tên chính xác, channelId UCLq7Bngo0s5xFWKcyKaJHWA, tạo 08/2023, last video 07/2026; URL mở 200 |
| 3 | `@DoctorJohnMeyers` | **`@DrJohnMeyers-4`** | Dr. John Meyers | URL cũ 404. @DrJohnMeyers-4 mở 200. ⚠️ Persona AI-doctor — cảnh báo cửa 3 (mạng lưới AI-doctor, maldita.es 07/2026) |
| 5 | `@건강백단-c2u` | **`@건강백단`** | 건강백단 - 건강정보 (KR health) | URL mới mở 200, ~164K subs (playboard). Cùng tên kênh, chưa xác minh cùng channel ID |
| 8 | `@家族の物語449` | **`@家族の物語123-p3k`** | 家族の物語 (JP drama) | URL mới 200 (~999 subs). Cùng tên/niche drama. Có biến thể @OvtR585 (~12.7K) cùng title — cần xác nhận kênh chính |
| 18 | `@賢者の灯` | **`@賢者の灯88`** | 賢者の灯 (JP triết lý) | URL mới 200. Cùng tên kênh, chưa xác minh cùng channel ID |
| 20 | `@노인건강습관-m3o` | **`@노인건강습관-l`** | 노인 건강 습관 (KR senior health) | URL mới 200, ~12.3K subs, video 130K views. Cùng tên/niche |
| 21 | `@당신의경제학` | **`@danggyung`** | 당신의 경제학 (KR kinh tế) | URL mới 200. Cùng tên kênh/niche |
| 22 | `@あの年の空` | **`@あの年の空.99`** | あの年の空 (JP 朗読 drama) | URL mới 200, ~953 subs. Cùng tên/niche |
| 23 | `@baeksehealth` | **`@가족건강지킴이`** | 건강심층리포트 (KR health) | Link-in-bio chính chủ (link.inpock.co.kr/baeksehealth — thương hiệu 백세건강) trỏ tới channel UCn5FMVHsFRqjq2bD1iOYVgg = handle mới; URL mở 200. Đổi tên kênh |

### ❌ DEAD THẬT (10 kênh — không tìm thấy handle thay thế)

| # | Handle | Lý do |
|---|--------|-------|
| 2 | `@RichPatternResearchInstitute` | URL 404, vidIQ 0, web không thấy dấu vết |
| 4 | `@oijfwaoldsfae` | 404, vidIQ 0, handle ngẫu nhiên — kênh reup đã xóa |
| 6 | `@イエスのアファメーション` | 404, vidIQ 0, chỉ thấy kênh khác tên (イエスの肯定) |
| 7 | `@偉人の救い` | 404 (read HTTP 404), web trả SEO junk, không xác minh được |
| 10 | `@mimymedia` | 404, vidIQ 0, chỉ là công ty quay phim US — không phải kênh reup |
| 11 | `@kyzoravietsub` | 404, vidIQ 0, không có kênh vietsub trùng tên |
| 12 | `@静思の道` | 404, vidIQ 0, không xác minh được kênh live |
| 13 | `@VaultBoy001` | 404, vidIQ 0, vaultboy (music) là người khác |
| 16 | `@FinalUrgency` | 404, vidIQ 0, video cũ "isn't available anymore" — bị terminate |
| 17 | `@fuetunoijin` | 404; kênh '不滅の偉人' ~230K subs bị **terminate vì vi phạm ToS** (X @ytranking) |

### ⚠️ KHÔNG XÁC ĐỊNH (3 kênh — có kênh cùng tên nhưng chưa đủ căn cứ, cần user xác nhận)

| # | Handle | Tình trạng |
|---|--------|------------|
| 1 | `@HealthyToday0` | 404; tìm thấy kênh EN 'HealthToday' @healthtoday_com (216K subs) nhưng market KHO ghi Hàn — khác thị trường, không dám khẳng định cùng kênh |
| 15 | `@漫画で学ぶシニアの健康CH-n8i` | 404; có kênh tương tự '漫画でわかるシニア健康CH' + '元気に長生き マンガでわかるシニア健康' nhưng tên khác (わかる vs 学ぶ) |
| 19 | `@새벽의두만강` | 404; playboard index '새벽의 두만강ㅣ탈북 스토리' nhưng channel giờ đổi tên khác ('수원ff7-3') — không rõ handle/trạng thái |

## Đề xuất xử lý (chờ duyệt trước khi sửa data-tabs/kenh-mau.json)

1. **Cập nhật handle mới (10 kênh):** sửa `handle` + `url` + bỏ `dead` (file: data-tabs/kenh-mau.json, có backup trước). Riêng #3 DrJohnMeyers — CÂN NHẮC xóa hẳn khỏi kho vì là AI-doctor cửa 3, không nên làm mẫu.
2. **Xóa hoặc giữ dead (10 kênh dead thật):** giữ `dead: true` (giữ hồ sơ, đồng nhất với trước).
3. **3 kênh không xác định:** giữ `dead: true`, cần user tự tìm trên YouTube (theo đúng quy trình phiên 6).
4. Trước khi ghi: `node scripts/backup-data.js` → sửa → `node scripts/validate-project.js`.