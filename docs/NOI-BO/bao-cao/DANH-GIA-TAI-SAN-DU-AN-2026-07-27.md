# ĐÁNH GIÁ TOÀN BỘ TÀI SẢN DỰ ÁN YTB — ĐỌC / CHECK / TEST / VERIFY
*Ngày 27/07/2026. Đã đọc 100% file MD + SKILL, trích xuất 3 file Excel, test 9 script Python, và **verify kênh mẫu của TỪNG gói prompt bằng scrape thật** (trang kênh + RSS YouTube). Đối chiếu với 3 báo cáo trước: [BAO-CAO-NGACH-NHAT-HAN](BAO-CAO-NGACH-NHAT-HAN.md) · [DOI-THU-VERIFIED](DOI-THU-VERIFIED-2026-07-27.md) · [NGACH-XANH-LO-TRINH](NGACH-XANH-LO-TRINH-2026-07-27.md)*

---

## 1. PHÁT HIỆN QUAN TRỌNG NHẤT (đọc 30 giây)

Trong kho tài sản anh đang có, **3 gói trùng đúng với ngách đang NỔ THẬT — có số liệu kiểm chứng 27/7/2026:**

| Gói tài sản anh SỞ HỮU | Kênh mẫu của gói | Số liệu verify được | Kết luận |
|---|---|---|---|
| 🥇 **Bộ skill wildlife-survival + motion-prompt-master** (H2Dev, hoàn chỉnh) | **Wild Bird Survival** | Lập **18/6/2026** (5,5 tuần) → 30 video, 14.900 subs, đăng HẰNG NGÀY 12:00 UTC, video 10–12 phút. View 30 ngày: **3 video vượt 1M/744K** (1.054.641 · 1.042.100 · 744.698), thêm 559K, 208K, 194K, 169K, 136K… | **NGÁCH NÓNG NHẤT TOÀN BỘ DATA.** Thị trường tiếng Anh toàn cầu (RPM Mỹ $6,21 — gấp đôi Nhật/Hàn). Skill anh có mô tả ĐÚNG kênh này làm chuẩn |
| 🥈 **Gói PROMPT ĐỨA TRẺ THỊ TRƯỜNG HÀN** (구름야담 style) | **구름야담** | Lập 29/11/2025 → chỉ **43 video, 88.900 subs**, video top 495K/317K views. Kênh nhái 금향야담: 33 video → 18.000 subs, video 109K — công thức NHÂN BẢN ĐƯỢC | Khớp 100% với kết luận "twist-drama audiobook Hàn" ở báo cáo trước — đây là biến thể "đứa trẻ bị bỏ rơi/thân phận ẩn" của cùng meta |
| 🥉 **Bộ skill Bible Explainer V2.1** (3 skill: script/image/thumb) | **Deep Made Simple** | Lập **28/2/2026** → 5 tháng đạt 162 video, **228.000 subs**; video top 212K views; đang đăng ~2 video/ngày, view mỗi video 1,6K–14K trong vài ngày | Ngách Anh ngữ RPM cao, khán giả Mỹ sùng đạo trung thành. Skill V2.1 viết kịch bản GỐC (copy công thức, không copy script) = an toàn policy |

**Ba gói này + 2 pipeline sản xuất (hoạt hình AI, video tôn giáo) là tài sản thật. Phần còn lại có vấn đề — xem mục 4 (phân loại đỏ/vàng/xanh).**

---

## 2. KIỂM KÊ TOÀN BỘ (86 file)

### A. Bộ skill / pipeline sản xuất (đã test)
| Tài sản | Nội dung | Trạng thái test |
|---|---|---|
| `hoat-hinh-ai/` | Pipeline 5 bước: logline → story → nhân vật/nền (kie.ai gpt-image-2) → shot list → video (flux-2 + grok-imagine) → merge FFmpeg | ✅ 6 script compile OK. ❌ Thiếu `.env` (KIE_API_TOKEN + IMGBB_API_KEY), ❌ FFmpeg CHƯA cài |
| `skill-tao-video-Youtube-ton-giao/` | Pipeline video tôn giáo EN học thuật: script 3-layer → ElevenLabs voice → ảnh devotional (kie.ai) → auto-merge 1080p, có quy tắc iconography từng tôn giáo (rất kỹ) | ✅ 3 script compile OK. ❌ Thiếu `.env` (ELEVENLABS_API_KEY + KIE_API_KEY), ❌ FFmpeg |
| `wildlife-survival-H2dev/` | 2 SKILL: viết kịch bản wildlife 70–90 từ/phút (công thức 6-beat) + motion prompt Veo 3.1 (5-layer, chống AI-melt, chiến lược credit Lite/Fast/Quality) | ✅ Chất lượng cao, dùng được ngay với Flow/Veo |
| `Bible Explainer/` (3 zip) | Script V2.1 (voiceover-ready, 6 phases) + image (màu nước) + thumbnail; kèm 24 ảnh mẫu | ✅ Skill gốc-sáng-tác, chuẩn |
| Deps môi trường | Python 3.13 ✅ · requests+dotenv ✅ (em vừa cài) · openpyxl ✅ (vừa cài) · **FFmpeg ❌ (cần `winget install ffmpeg`)** | |

### B. Gói prompt ngách (12 file MD gốc)
| Gói | Thị trường | Cơ chế | Kênh mẫu → số verify |
|---|---|---|---|
| ĐỨA TRẺ Hàn (구름야담) | KR | ⚠️ 70% giữ cốt truyện đối thủ / 30% "재창작" | 구름야담 88.9K subs/43 video ✅ NÓNG |
| KINH TẾ Hàn (부자의경제학) | KR | ✅ Tự tạo chủ đề + kịch bản gốc | 부자의경제학 64.6K subs/190 video, view mới chỉ 237–1.5K → **nguội dần** |
| PHẬT PHÁP Hàn (말년운/법정스님) | KR | ✅ Kịch bản gốc, quy trình 5 bước + khử mùi AI | Không nêu kênh mẫu; ⚠️ title mẫu dùng tên sư thật "법정 스님의 경고" |
| TRIẾT LÝ (Alan Watts) | EN | ✅ Kịch bản gốc "as Alan Watts" | ⚠️ mạo danh giọng người thật đã mất |
| Kiểm soát sinh học/combat | EN | ✅ Kịch bản gốc, art 2D | Zero2Kombat: **15 video → 68.3K subs**, video 1.07M views ✅ NÓNG |
| TIỀN SỬ (Veo 3) | EN | ✅ Kịch bản gốc | Không nêu kênh mẫu |
| NHÀ MÁY SẢN XUẤT (How It's Made) | EN | ✅ Tạo chủ đề gốc; ⚠️ thumbnail "surreal" con vật bị lột da trên băng chuyền | — |
| QUY LUẬT KINH TẾ (Economy Rewind) | EN | ⚠️ 70/30 rewrite từ script đối thủ | Kênh gốc khó xác định; các clone đang 8–19 views → **ngách nhái đã bão hòa** |
| The North Effect (địa-chính-trị) | EN | ⚠️ 70/30 rewrite | — |
| Prompt Key Nhật (drama-doc) | JP | ⚠️ 70/30 rewrite | — |
| THUMB+SEO senior-health Mỹ | EN | 🔴 Title kiểu "Doctors Warn:/Harvard Says:" | — |
| Douyin/Bilibili reup (2 xlsx) | — | 🔴 Reup thuần (nomad Iran, 恶魔进化…) | — |

---

## 3. KẾT QUẢ TEST KỸ THUẬT (việc cần làm để pipeline chạy)

1. ✅ 9/9 script Python compile sạch, code viết tốt (re-run safe, ép UTF-8 cho Windows, retry logic).
2. ❌ **FFmpeg chưa có trên PATH** (cả Git Bash lẫn PowerShell) → bước merge của cả 2 pipeline sẽ fail. Fix: `winget install ffmpeg` rồi mở terminal mới.
3. ❌ Chưa có file `.env` nào → cần 3 key: `KIE_API_TOKEN`/`KIE_API_KEY` (kie.ai), `IMGBB_API_KEY` (free), `ELEVENLABS_API_KEY`.
4. ✅ Em đã cài bổ sung `python-dotenv`, `openpyxl` vào Python hệ thống.
5. File `README.md` gốc anh mở trong IDE **chưa được lưu vào ổ đĩa** (trên Z:\aming\YTB không tồn tại).

---

## 4. PHÂN LOẠI TÀI SẢN THEO RỦI RO POLICY (đối chiếu policy đã verify từ YouTube Help)

### 🟢 XANH — dùng ngay, an toàn
- **Bộ wildlife** (kịch bản gốc, hình AI gốc) — chỉ cần tự viết chuyện, không dùng chức năng "paste competitor script for rewrite" trong skill.
- **Bible Explainer V2.1** (copy công thức "Every X Explained", tự viết nội dung — hợp lệ).
- **Pipeline tôn giáo** + **pipeline hoạt hình** (công cụ sản xuất trung tính, output gốc).
- **Gói combat** (Zero2Kombat style) — kịch bản gốc, art gốc.
- **Gói PHẬT PHÁP Hàn** & **KINH TẾ Hàn** phần tạo-chủ-đề/kịch-bản-gốc.

### 🟡 VÀNG — dùng được NHƯNG phải đổi cách dùng
- **Gói ĐỨA TRẺ Hàn (구름야담)**: ngách đã verify là nóng, NHƯNG cơ chế "giữ 70% cốt truyện đối thủ" là đúng thứ YouTube dò "script identity" (16 kênh bị xóa 1/2026 vì pattern này). **Cách dùng an toàn: giữ CÔNG THỨC (đứa trẻ bị bỏ rơi → thân phận ẩn → lật), tự sáng tác 100% cốt truyện mới** — kho 야담/dã sử Triều Tiên là public domain, không thiếu chất liệu.
- **Tất cả prompt 70/30 rewrite** (North Effect, Key Nhật, Economy Rewind): chuyển thành "phân tích cấu trúc đối thủ → viết mới hoàn toàn". Thêm bằng chứng: các kênh clone Economy Rewind hiện chỉ 8–19 views/video — nhái muộn không còn ăn.
- **Alan Watts**: giọng văn triết học OK, nhưng đừng ghi "— Alan Watts" lên title/thumb như prompt gợi ý (mạo danh người thật + tranh chấp estate). Làm "triết học phương Đông" chung chung thì sạch.
- **Gói PHẬT PHÁP Hàn**: bỏ cụm "법정 스님의 경고" (sư Beopjeong thật, đã viên tịch) — báo chí Hàn đang đánh đúng dạng giả danh sư; luật AI Hàn hiệu lực 1/2026.
- **Thumbnail NHÀ MÁY**: kiểu "con vật bị lột da nằm băng chuyền" dễ dính gore/misleading thumbnail — làm mềm lại.

### 🔴 ĐỎ — khuyên bỏ
- **2 file Excel reup Douyin/Bilibili**: reup thuần = "reused content" (mục cấm nguyên văn: *"tải từ nguồn khác, không thay đổi thực chất"*) + Content ID + chủ gốc report. Đây là mô hình chết về dài hạn, chỉ nên coi các kênh Douyin đó là **nguồn ý tưởng để làm lại bằng AI của mình**.
- **Gói THUMB+SEO senior-health Mỹ**: title "Doctors Warn:/Harvard Says:" = **AI persona giả chuyên gia y tế — mục cấm kiếm tiền riêng trong policy (verified)**, thêm YMYL + fake citation "Harvard". Ngách senior-health Mỹ cũng là biển đỏ bị càn.

---

## 5. SUY LUẬN CHIẾN LƯỢC — GHÉP TÀI SẢN VỚI DATA

**So sánh 3 hướng khả thi nhất (tất cả số đều verify):**

| Tiêu chí | 🐘 Wildlife EN | 👶 야담 đứa trẻ KR | ✝️ Bible Explainer EN |
|---|---|---|---|
| Kênh mẫu tăng trưởng | 14.9K subs/5,5 tuần; 3 video 1M/744K views | 88.9K subs/8 tháng; video 495K | 228K subs/5 tháng |
| Kênh nhái có ăn theo được? | Ngách mới, chưa thấy clone lớn | ✅ 금향야담 18K/33 video | Bible Made Simple 9.3K, Plain Truth 6K — người đến sau vẫn sống |
| RPM thị trường | **$6,21 (Mỹ) + global EN** | $3,31 | $6,21 (Mỹ, khán giả sùng đạo lớn tuổi = CPM tốt) |
| Tài sản sẵn có | 2 SKILL hoàn chỉnh | Gói prompt (cần sửa 70/30 → gốc) | 3 SKILL hoàn chỉnh + pipeline tôn giáo chạy máy |
| Chi phí/video | CAO nhất (Veo 3.1 ~20–100 credit/clip ×20–30 clip) | Thấp (ảnh tĩnh + TTS) | Thấp (2–8 ảnh + ElevenLabs) |
| Kỹ năng đòi hỏi | Prompt Veo + kiên nhẫn retry | Tiếng Hàn (cần người soát) | Tiếng Anh tốt (TTS lo giọng) |
| Rủi ro | Chi phí đốt trước khi nổ; Veo lỗi ~20-30% | Policy nếu giữ 70/30; báo chí Hàn | Ngách hẹp hơn, cần đúng tông tôn kính |

**Khuyến nghị của em (dựa data, không đoán):**
1. **Kênh #1 — Wildlife EN (bắt đầu ngay):** ngách có bằng chứng nổ mạnh nhất (video 1M views khi kênh mới 4 tuần tuổi), RPM gấp đôi Nhật/Hàn, và anh có sẵn skill chuẩn nhất. Chấp nhận chi phí Veo cao — dùng đúng chiến lược credit trong skill (test Lite → Fast 90% → Quality 2-3 clip). Nhịp mẫu: 1 video/ngày 10–12 phút như Wild Bird Survival, nhưng khởi động 1 video/2 ngày để giữ chất lượng.
2. **Kênh #2 — Bible Explainer EN (song song, chi phí thấp):** dùng bộ 3 skill + pipeline tôn giáo → gần như tự động hóa được khâu sản xuất; ngách chứng minh người đến sau vẫn sống; cân bằng rủi ro với kênh #1 (một kênh đốt tiền – một kênh rẻ).
3. **Kênh #3 (sau 1–2 tháng) — 야담 Hàn:** khi 2 kênh trên vào guồng, làm theo kết luận báo cáo trước (twist-drama audiobook) + gói 구름야담 ĐÃ SỬA thành sáng tác gốc.
4. **Hủy/không mở:** reup Douyin, senior-health Mỹ, mọi kênh chạy 70/30 rewrite nguyên bản.

**Việc kỹ thuật cần làm trước khi sản xuất (30 phút):**
```
winget install ffmpeg          # rồi mở terminal mới
# Tạo .env cho 2 pipeline từ .env.example, điền:
#   KIE_API_TOKEN / KIE_API_KEY   (kie.ai)
#   IMGBB_API_KEY                  (api.imgbb.com — free)
#   ELEVENLABS_API_KEY             (elevenlabs.io)
```

---

## 6. GHI CHÚ TRUNG THỰC
- Số subs là số làm tròn YouTube công bố; view từng video là số thật thời điểm quét (RSS chính thức).
- Doanh thu các kênh mẫu là ƯỚC TÍNH từ view × RPM thị trường (Dynamoi 7/2026) — không có số AdSense thật của họ.
- Kênh 한국전통민담 (kênh 2 của gói 야담) và 2 kênh workout VN trong gói combat không resolve được handle (có thể đã đổi tên/xóa) — 3 kênh mẫu khác của các gói đó đã verify đủ.
- Em chưa test THỰC (gọi API tốn tiền) 2 pipeline — mới test syntax + deps; sẵn sàng chạy end-to-end 1 video thử khi anh điền key.
