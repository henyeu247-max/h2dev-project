# Báo Cáo So Sánh Dữ Liệu: 2026-08-20 vs 2026-09-09

**Ngày tạo:** 2026-09-10  
**Mục đích:** Đối chiếu sự thay đổi giữa baseline tháng 8 và dữ liệu hiện tại (Sep 9)

---

## 🎯 TÓM TẮT EXECUTIVE

Dự án đã có **cập nhật đáng kể trong 20 ngày qua**:
- **+1 video mới** (từ 131 → 132 videos)
- **+4 kênh mẫu** (từ 161 → 165 channels) 
- **1 ngách mới xuất hiện:** "Bán Content Ngách Cực Nhỏ"
- **Nhiều báo cáo NOI-BO mới:** 2 báo cáo lớn (Sep 6, Sep 8)
- **Toàn bộ 132 video đều có file MP4 hợp lệ** (0 zero-byte files)

---

## 📊 BẢNG SO SÁNH SỐ LƯỢNG

| Thành phần | Aug 20 Baseline | Sep 9 Hiện tại | Δ (%) |
|------------|-----------------|----------------|-------|
| **Videos** | ~131 | **132** | +1 (0.76%) |
| **Channels** | ~161 | **165** | +4 (2.48%) |
| **Niches xanh** | 34 (Aug 20) | **34** | unchanged |
| **Thumbnails** | ~131 | **132** | +1 |
| **Video directories** | ~131 | **132** | +1 |
| **Channel avatars** | ~111 | **~111** | stable |
| **Documents (tai-lieu)** | 97 | **98** | +1 |
| **Scripts (kich-ban)** | 45 | **45** | stable |

---

## 🆕 VIDEO MỚI: VIDEO-73d98a

### Thông tin cơ bản
```json
{
  "sku": "VIDEO-73d98a",
  "title": "Update key (ngách cực nhỏ) mới nhất 06-09-2026",
  "published_at": "2026-09-06",
  "size": "190.68 MB",
  "resolution": "1920x1080",
  "duration": "09:19",
  "free": false,
  "drm": false
}
```

### Đặc điểm quan trọng
- **Market:** Nhật 🇯🇵 + Hàn 🇰🇷 (cross-market)
- **Niche mới:** `Bán Content Ngách Cực Nhỏ` - **KHÔNG CÓ TRONG ngach-xanh.json**
- **Content:** Cập nhật về chiến lược bán content cho ngách cực nhỏ (niche of micro-niches)
- **Source:** https://h2dev.vn/learn/study/update-key-ngach-cuc-nho-moi-nhat-06-09-2026

### Kênh đối thủ trích xuất (4 new)

| Handle | Thị trường | Niche chính | Ngày đo |
|--------|-----------|-------------|---------|
| @涙のひと駅 | Nhật | Drama / Stories | 2026-09-09 |
| @사연만남1짱 | Hàn | Drama / Stories | 2026-09-09 |
| @simbot2 | Hàn | Triết lý / Tâm linh | 2026-09-09 |
| @元気な老後-t5d | Nhật | Sức khỏe / Lão hóa | 2026-09-09 |

⚠️ **VẤN ĐỀ PHÁT HIỆN:** Ngách `"Bán Content Ngách Cực Nhỏ"` **không xuất hiện** trong `data-tabs/ngach-xanh.json`. Đây là loại meta-content (bán kinh nghiệm/content), không phải audience-facing content như các niche khác.

---

## 🗂️ FILE MỚI THÊM GẦN ĐÂY (Last 14 Days)

### Danh sách file được sửa/modified sau Aug 26:

#### Core Data Files
1. **data-tabs/videos.json** - Modified: 2026-09-09 09:59
   - Added VIDEO-73d98a record
   - Updated catalog counts

2. **data-tabs/kenh-mau.json** - Modified: 2026-09-09 10:14
   - Added 4 new channel records
   - All with `nguon_do: "h2dev VIDEO-73d98a"`

#### Reports & Documentation
3. **docs/NOI-BO/bao-cao/bao-cao-tong-hop-hoc-lieu-va-chuan-san-xuat-20260908.md**
   - Created: Sep 8
   - Content: 129/129 transcript read audit
   - Issues found: 6 ZIP tool files actually HTML
   - Pipeline bugs fixed in `inject-raw-tab.py`

4. **docs/NOI-BO/bao-cao/bao-cao-chien-luoc-raw-thi-truong-20260906.md**
   - Created: Sep 6
   - Content: Raw market analysis, 95 raw records OCR'd
   - 83 unique handles after deduplication
   - 10 duplicate groups identified

#### Raw/Niches Strategy Files
5. **raw-niches/US_EverydayHistory/README.md** - Enhanced strategy profile
6. **raw-nibes/DE_ScienceParadox/README.md** - Enhanced strategy profile  
7. **raw-niches/JP_PhatPhap/README.md** - Enhanced strategy profile
8. **raw-niches/KR_SeniorWisdom/README.md** - Enhanced strategy profile
9. **raw-niches/MX_MythologyStories/README.md** - Enhanced strategy profile
10. **raw-niches/VN_TrietLy/README.md** - Enhanced strategy profile

All 6 raw-niches READMEs upgraded to deep strategic profiles with:
- Target audience positioning
- Competitor channel lists from raw images
- 3-act script formula
- Passive listening mechanisms
- Red-flag fact-check warnings

---

## 🔴 VẤN ĐỀ CẦN LÀM RÃ

### Issue #1: ngach-xanh.json Content Stale?

**Triệu chứng:**
- File modified: `2026-09-03 23:14:09`
- Content says: `"updated": "2026-08-20"`
- User comment (CHANGELOG): "Đã chuẩn hóa số liệu nhưng nội dung vẫn snapshot Aug 20"

**Hỏi:**
1. File này có phản ánh dữ liệu **thật của ngày 3-9 Sep** hay chỉ là timestamp updated?
2. Ngách `"Bán Content Ngách Cực Nhỏ"` từ VIDEO-73d98a có cần add vào `ngach-xanh.json` không?

**Khuyến nghị:** Run rebuild script để regenerate ngach-xanh với danh mục mới nhất từ catalog_full.json

---

### Issue #2: Channel Resolve Trống cho VIDEO-73d98a

**Triệu chứng:**
```json
"channelResolve": []  ← RỖNG!
```

**So sánh với VIDEO-DD983D (mới trước đó):**
```json
"channelResolve": [
  { "handle": "@ธรรมสุข-2275", ..., "note": "Kênh 1..." },
  { "handle": "@新しい私の毎日", ..., "note": "Kênh 2..." },
  ...
]
```

**Hỏi:**
1. Có skip step resolve cho 4 kênh này không vì vừa thêm?
2. Cần chạy `prepare-gemini-batches.py` hoặc tương đương để populate metadata?

---

### Issue #3: Avatar Existence Check

**Claim:** 111/165 channels có avatar  
**Cần kiểm:** Tất cả 4 channel mới có avatar files tồn tại không?

```bash
ls assets/avatars/namida-hitoeki.jpg        ✅ ?
ls assets/avatars/sayeon-mannam1jjang.jpg   ✅ ?
ls assets/avatars/simbot2.jpg               ✅ ?
ls assets/avatars/genkina-rogo-t5d.jpg      ✅ ?
```

**Status:** Đã đếm 204 dòng trong thư mục avatars (~200 files). Cần confirm từng file cụ thể.

---

## ✅ ĐÃ XÁC MINH

### Data Integrity Checks (ALL PASS)
- ✅ **Validation passed:** `node scripts/validate-project.js`
- ✅ Videos: 132, Channels: 165, Scripts: 45, Documents: 98
- ✅ Thumbnails: 132 matched với video directories
- ✅ **Zero zero-byte MP4 files:** 132 total, 0 size==0

### Security Policy Compliance
- ✅ `.env` removed from git history (commit `e6dc501`, Aug 31)
- ✅ Scripts use `os.environ.get()` not file reads
- ✅ Web server blocks sensitive paths (`/.env*`, `/mcp-keys*`)

### Git History Status
- Last commit: `e6dc501` - "[Security] gỡ .env khỏi git · redact keys trong CHANGELOG"
- Commit message: properly redacted all API keys as `[REDACTED]`
- Current HEAD is clean, no uncommitted secrets

---

## 📈 xu HƯỚNG TỔNG QUAN

### Tăng trưởng nội dung
- **Video intake rate:** ~1 video/tuần (Sep 6: VIDEO-73d98a, Aug 28-30: batch uploads?)
- **Channel expansion:** Cross-market Japan+Korea focus (4/4 new channels are JP/KR)
- **Niche diversification:** Meta-niches appear ("Bán Content Ngách Cực Nhỏ")

### Production maturity
- Full transcription pipeline active (Whisper ASR for all 132 videos)
- Video insights generation at scale (Gemini batch processing)
- Validation suite running successfully before commits

### Internal knowledge building
- 2 major reports created in first week of Sep (Sep 6, Sep 8)
- Deep raw market analysis completed (95 raw records, 83 unique channels)
- Strategy documentation expanded across 6 language/regional niches

---

## 🔍 NEXT ACTIONS RECOMMENDED

### Priority 1: Clarify Ngách System
- [ ] Confirm whether "Bán Content Ngách Cực Nhỏ" should be added to `ngach-xanh.json`
- [ ] If yes, run niche classification script or manual entry
- [ ] If no, document this as special "meta-niche" type

### Priority 2: Complete Channel Resolves
- [ ] Run channel metadata extraction for 4 new channels
- [ ] Populate `channelResolve` array for VIDEO-73d98a
- [ ] Extract subscriber count, video count, growth metrics

### Priority 3: Avatar Verification
- [ ] Verify all 4 new avatar files exist
- [ ] Update `ngay_do` and `nguon_do` if missing
- [ ] Run full avatar completeness check

### Priority 4: ngach-xanh.json Audit
- [ ] Compare current catalog entries vs ngach-xanh ranks
- [ ] Determine if manual update needed for Sep 3
- [ ] Consider automated refresh script

---

## 📝 NOTES FOR FUTURE AUDITS

### How to detect data drift early
1. **Run validation daily:** `node scripts/validate-project.js`
2. **Check JSON structure:** `npx json-parser ./data-tabs/*.json`
3. **Monitor modification times:** `find . -mtime -7 -name "*.json"`
4. **Cross-reference counts:** Ensure catalog ↔ tabs ↔ manifests match

### Baseline versioning suggestion
- Tag data snapshots with date hashes (e.g., `v2026-08-20`, `v2026-09-09`)
- Store comparison diffs in `docs/NOI-BO/diff/` directory
- Auto-generate weekly summary reports via cron job

---

**Report prepared by:** Qoder Agent (automated data audit)  
**Verification command:** `node scripts/validate-project.js`  
**Timestamp:** 2026-09-10 UTC
