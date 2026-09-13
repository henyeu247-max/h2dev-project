# RULE LÀM VIỆC CHUẨN — H2DEV-Project (CodeBuddy ↔ User)

> Bản hợp nhất CUỐI — đúc từ: 187 file dự án (đọc FULL 20/08/2026) + data ngoài mới nhất (blog.youtube 10/08, SEJ 11/08, TechCrunch 20/07, AIR Media RPM).
> Vị trí: `d:\YTB\H2DEV-Project\knowledge-hub\docs\RULE-LAM-VIEC.md`
> Boot order mỗi phiên: `AGENTS.md` → `RULE-LAM-VIEC.md` → `SOUL.md` → `HUONG-DAN-MCP-CHUAN.md` → `CHANGELOG.md` → data.

---

## PHẦN 1 — QUAN HỆ & KỶ LUẬT LÀM VIỆC (evidence-first)

### 1.1 Quan hệ
- **User & Em = cộng sự.** Em làm thực chất, không advisory suông. Xưng "em", gọi user "anh", tiếng Việt là chính.
- Dự án + data + docs trên máy = **gốc sự thật** — NO_DELETE khi chưa được anh cho phép.

### 1.2 Check N/N (bắt buộc, không tượng trưng)
- Có 100 đối tượng → check 100. Có 1000 → check 1000. **CẤM check 1-2-10 cái rồi đại diện.**
- Kết quả đếm được, sai lệch từng cái phải giải thích rõ.

### 1.3 Đọc FULL (không dở dang)
- Không đọc lướt rồi khái quát. Mỗi claim verify riêng bằng nguồn gốc (file/dòng/lệnh/output).
- Bị bắt verify lại → đọc lại từ đầu, không giữ kết luận cũ.

### 1.4 Phản biện + evidence + nhận định rõ
- Tự tìm bằng chứng **PHỦ ĐỊNH** kết luận của mình TRƯỚC khi chốt.
- Mọi nhận định kèm evidence trực tiếp (path + dòng + output + số đếm). Không có evidence = KHÔNG nói.
- Nhận định chỉ 3 mức: **CÓ / KHÔNG / KHÔNG-VERIFY-ĐƯỢC** (+ lý do). Không "có thể", "chắc là".
- Cấm đoán mò, cấm bịa số liệu.

### 1.5 Nửa vời / tool lỗi
- Cấm dừng giữa chừng vì 1 hướng fail → thử ≥3 vector (tool khác).
- Blocker thật → báo thẳng + đầy đủ đã thử gì.

---

## PHẦN 2 — QUY TRÌNH VERIFY NGÁCH (bắt buộc trước khi làm)

### 2.1 Chuẩn hóa phương pháp đo
- Cùng loại keyword, cùng country, cùng thước đo. Dùng **`overall score`** (volume + competition), KHÔNG dùng competition riêng (sai lệch).

### 2.2 5 bước verify ngách
| Bước | Nội dung |
|---|---|
| 1 | Đo vidIQ `keyword_research` (mode=research, cùng country): `volume` + `overall` + `competition` |
| 2 | Phân tích đối thủ TOP 10: `incumbent` (>1M lâu đời) vs `breakout` (kênh <100K tăng nhanh) |
| 3 | Đánh giá CPM/RPM (AIR Media) × đối tượng khán giả × khả năng trả phí Premium |
| 4 | Kiểm tra "kênh con mọc" bằng `vidiq_outliers` (kênh nhỏ có video nổ = còn chỗ) |
| 5 | Đối chiếu chính sách YPP (mục 4 bên dưới) |

### 2.3 Ngưỡng tối thiểu ĐẠT / KHÔNG ĐẠT
| Tiêu chí | ĐẠT | KHÔNG ĐẠT |
|---|---|---|
| Volume | ≥ 50 | < 30 (volume ~0 = "cố tìm người xem" → bỏ) |
| Overall | ≥ 60 | < 50 |
| Competition | ≤ 50 (dễ thở) | > 60 (bể cá lớn, kênh lâu đời đóng chỗ) |
| Breakout | ≥ 2 kênh nhỏ nổ | 0 breakout (chỉ incumbent) |
| CPM | ≥ $5 | < $3 |
| Policy | không vi phạm | AI persona health/finance · reused · gây sốc |

**→ Chỉ làm khi ĐẠT ≥4/6.** Ghi kết quả vào `ngach-xanh.json` kèm `overall/volume/comp/CPM/breakout` + ngày đo.

---

## PHẦN 3 — CÔNG THỨC LÀM NỘI DUNG (đã chốt trong dự án, đọc FULL từ prompt/bao-cao)

### 3.1 QUY TẮC VÀNG (mọi ngách)
> **1 video = 1 chủ đề = 1 câu chuyện có nguồn. Giọng kể chuyện, KHÔNG giả chuyên gia. Đăng 1-2/tuần đều. Nghiên cứu thật, không bịa số liệu.** → cách duy nhất qua cả 3 cửa cấm policy.

### 3.2 Công thức kiếm tiền dài hạn
> 1 chủ đề vô tận + 1 phong cách kể có bản sắc + 1 nhịp đăng đều + video dài (10-45p) + hook câu hỏi (không giật tít).

### 3.3 Biến thể AN TOÀN từng ngách (báo cáo 20/08)
| Ngách | Công thức đúng | ❌ Tránh (vi phạm) |
|---|---|---|
| Everyday History | "Trước khi có X, con người sống thế nào?" → nguồn gốc → vì sao ra đời → ảnh hưởng | — (an toàn) |
| Science/Trái Đất | "Điều gì xảy ra nếu [hiện tượng]?" → giải thích khoa học thực | AI dàn cảnh chung chung (cửa 1) |
| UFO/Roswell | **Khung tường thuật-điều tra**: "đây là lời kể, tự bạn phán đoán" | "alien CÓ THẬT" (cửa 2) |
| True Origin | "Bạn nghĩ mình biết X — đây là nguồn gốc THẬT" | — |
| Senior (KR/JP) | "Sau 70 tuổi, 3 thói quen..." (giọng wisdom) | "bác sĩ 40 năm tiết lộ" (cửa 3 AI persona) |
| Food History | 1 món → nguồn gốc → truyền thuyết → lịch sử → thương mại → văn hóa | — |

### 3.4 Cấu trúc kịch bản từng gói (prompt đã có)
- **Bản 70/30 lịch sử** (Đứa trẻ Hàn / Key Nhật / North Effect / Economy Rewind) chỉ là ghi chú workflow cũ, không phải tỷ lệ an toàn bản quyền hay bảo đảm YPP. Nếu tham khảo, phải viết lại từ nguồn hợp pháp, tạo giá trị độc lập và kiểm chính sách; không dùng tỷ lệ này làm tiêu chí PASS.
- **Phật pháp Hàn (5 bước)**: Topic → Title → Outline 8 phần → Full script ≥18.000 chữ → Rewrite khử mùi AI.
- **Combat**: Hook (đối kháng) → Principle → Application → Escalation → Integration (550-1200 từ).
- **Tiền sử Veo3**: bắt đầu trong hành động, 2 twist, climax sinh tử (600-900 từ).
- **Triết lý Alan Watts**: Hook paradox → Exploration → Reflection → Integration → Ending (2500-5000 từ).

### 3.5 Thumbnail & SEO (prompt đã có)
- Thumb: mặt nhân vật cận cảnh 60-70% khung + 1 câu thoại ≤13 chữ (JP/KR) hoặc 2-4 từ ALL CAPS (EN).
- Title drama: `[bị coi thường] + [hành động thử lòng] + [khoảnh khắc lật]`.
- Title Bible: `khoảnh khắc cụ thể + con số + cảm xúc mạnh`.

### 3.6 4 pipeline sản xuất đã có
1. `ton-giao` — video tôn giáo EN học thuật (4 bước: script 3-tầng → voice+ảnh → merge FFmpeg → report).
2. `hoat-hinh-ai` — story→animation Pixar 3D (5 skill: logline → characters → images → shots → composite+video).
3. `wildlife` — kịch bản 70-90 từ/phút, 6-beat.
4. `bible-explainer` — script 3-layer voiceover-ready, 6 phases.

---

## PHẦN 4 — CHÍNH SÁCH YPP 2027 (data ngoài MỚI NHẤT, cập nhật 20/08)

### 4.1 YPP 2027 entry (hiệu lực 01/02/2027)
- **Kênh MỚI**: 1.000 sub + **8.000 giờ/365 ngày** HOẶC **20M Shorts/90 ngày** (gấp đôi hiện tại 4.000h/10M).
- **Kênh CŨ (đã YPP)**: giữ nguyên, chỉ cần chấp nhận terms mới trước **31/01/2027**.

### 4.2 Shorts (mới)
- Cần **10M Shorts views/90 ngày** để chia Shorts pool; dưới ngưỡng vẫn kiếm long-form.

### 4.3 Channel "active" (mới)
- ≥1.000 giờ/năm HOẶC ≥1M Shorts/90 ngày HOẶC upload 2 long-form / 5 Shorts mỗi 90 ngày. Không đạt → inactive, 90 ngày gia hạn.

### 4.4 Premium & Premium Lite
- Standard Premium: pool **30%** net revenue. **Premium Lite: pool 60%** (mở rộng toàn cầu 2027).
- Chia: **55% long-form / 45% Shorts** (theo member watch time/views).

### 4.5 Inauthentic content (3 nhóm cấm monetize — từ 16/07/2026)
1. **Generic/repetitive/template** (AI/CGI/template na ná nhau).
2. **Off-putting/distressing** (animal rescue giả, dàn cảnh đau khổ, thao túng cảm xúc).
3. **AI personas bàn chủ đề nhạy cảm**: health/finance/legal.

### 4.6 RPM chuẩn 2026 (đa nguồn AIR Media + OutlierKit + Virvid)
| Ngách | RPM | Ngách | RPM |
|---|---|---|---|
| Finance/Business | $5-20 | Health/Medical | $7-22 |
| Education & Science | $10.22 median | Insurance | $7-17 |
| Tech | $4-12 | Legal | $5-15 |
| Health/Beauty | $2-6 | Lifestyle | $1-3.5 |
| Gaming/Entertainment | $0.5-2 | Music | $1-3 |

**→ RPM cao nhất = finance/insurance/health/legal/education. Entertainment/meme = RPM thấp + nguy cơ "limited ads".**

---

## PHẦN 5 — KHUNG THAM CHIẾU & ĐÁNH GIÁ NGÁCH (KHUNG MỞ)

### 5.1 Các hướng ứng viên đã qua kiểm chứng (Snapshot tham chiếu — Luôn đo lại sống)
- **Tôn giáo / Kinh Thánh học thuật EN** (educational storytelling) — RPM $6-7, tính bền vững cao. Tiếp cận bằng WEDGE (giải nghĩa từ gốc Hebrew/Hy Lạp).
- **Lịch sử / Văn minh cổ đại & Nguồn gốc đồ vật EN** — nhu cầu lớn, cạnh tranh thấp ở các chủ đề hẹp.
- **Khoa học vũ trụ / Đại dương ru ngủ (Sleep Science / Calm Documentary)** — nhu cầu tăng trưởng mạnh, thời lượng xem AVD rất cao.
- **Triết lý / Phật pháp Nhật Bản (JP)** — mức cạnh tranh từ khóa thấp hiếm có, khán giả trung thành.

> 💡 **Nguyên tắc không đóng băng:** Không có ngách nào là "chốt vĩnh viễn". Mỗi đợt làm việc phải dùng vidIQ/dữ liệu sống đo lại volume, competition, và tìm kênh con mới mọc (outliers). Quyết định chọn ngách thuộc về người dùng và dữ liệu thực tế tại thời điểm triển khai.

### 5.2 Chuẩn hóa theo `overall score` (Snapshot vidIQ tham chiếu)
| Hạng | Ngách | Overall | Ghi chú |
|---|---|---|---|
| 1 | Phật pháp Nhật (ブッダの教え) | **74.1** | volume 76.2, comp 29.2, 41.8K tìm/tháng |
| 2 | Kinh Thánh EN (bible explained) | 69.1 | volume 80.2, comp 47.5 |
| 3 | Everyday Nhật (昔の暮らし) | 68.8 | comp 11 — dễ thở nhất |
| 4 | Food History EN | 68.6 | volume 80.3 |
| 5 | Sức khỏe Nhật (長生き) | 67.7 | comp 28.5 |
| 6 | Science/Trái Đất | 67.4 | RPM cao nhất nhưng comp cao |
| 7 | Everyday History EN | 63.6 | comp 34.9, format=brand |

### 5.3 Bằng chứng "kênh con mọc" (outliers 20/08)
- `こころの道しるべ` (13.2K sub) → video 369K views (28x sub) — Phật pháp Nhật còn chỗ.
- `History Vs Myths` (1.190 sub) → 151K views — history EN vẫn cho kênh siêu nhỏ.
- `Past Perfect` (2.8K sub) → 139K views.

---

## PHẦN 6 — NGUYÊN TẮC LINH HOẠT (không khuôn mẫu cứng)

| Loại ngách | Ưu tiên #1 | Cách làm |
|---|---|---|
| **SEO-driven** (người xem chủ động tìm: bible, ブッダの教え, 長生き) | SEO | keyword volume cao vào title/desc/tags; thumbnail rõ chữ |
| **Content-driven** (Everyday, Food, True Origin) | Giữ chân + tò mò | hook câu hỏi; format=brand; thumbnail ít quan trọng hơn ý tưởng |
| **Retention-driven** (senior, tài liệu dài) | Watch time | video 15-30p, mid-roll, mạch chậm |

- Mỗi quyết định dựa trên số liệu đã đo + mục tiêu, không rập khuôn.
- Cùng ngách 2 thị trường có thể ưu tiên khác nhau (Everyday: US content-driven, Nhật SEO-driven).
- Luôn tự hỏi: **"ngách này người xem tìm đến hay mình tìm người xem?"** → quyết định chiến lược.

---

## PHẦN 7 — BỘ 10 TIÊU CHUẨN VÀNG NGHIỆM THU CHECK PASS 1 VIDEO (CHECK TAY & GROUNDED 100%)

> **Nguyên tắc bất di bất dịch:** Tuyệt đối không ỷ y vào bất kỳ dữ liệu có sẵn nào. Dù là video mới làm xong hay cũ, mỗi khi yêu cầu kiểm tra là bắt buộc phải mổ xẻ lại từ đầu bằng tay 100%: trích xuất khung hình thật, nghe lại lời giảng thật, soát từng câu phụ đề và kiểm tra từng đường dẫn file. Video chỉ được coi là PASS khi thỏa mãn đồng thời đủ 10 tiêu chí:

| STT | Hạng mục | Tiêu chuẩn bắt buộc | Cách kiểm chứng thực tế |
| :---: | :--- | :--- | :--- |
| **1** | **File Media & Thumbnail** | MP4/WEBM > 0 bytes, ffprobe xác nhận đủ cả luồng video + audio; thumbnail hiển thị đúng bài. | Chạy lệnh `ffprobe` kiểm tra luồng; kiểm tra kích thước file > 0 trên cả Local và VPS. |
| **2** | **Subtitle (3 định dạng)** | Có đủ `transcript.json`, `.srt`, `.txt` đồng bộ 1-1; 0 ảo giác Whisper, 0 nén chữ rớt nguyên âm. | Đọc trực tiếp nội dung file; chạy script kiểm tra lặp từ và thời lượng phủ > 90%. |
| **3** | **Kênh đối thủ (`channels`)** | Không để mảng rỗng `[]` nếu video có mở kênh; handle `@...` phải chính xác 100%. | Trích xuất khung hình video mổ xẻ avatar/handle; kiểm tra nút mở YouTube & copy handle trên web. |
| **4** | **Tài liệu đính kèm (`docs`)** | Có ít nhất 1 cẩm nang SOP chuyên sâu (`assets/docs/<SKU>/...md`) hoặc kịch bản/prompt đính kèm. | Kiểm tra link trả về HTTP 200; bấm nút "Đọc trực tiếp" trên web xem modal mở mượt mà. |
| **5** | **Mốc tua nhanh (`key_timestamps`)** | Đủ 4-5 mốc thời gian chuyển đoạn chính, số giây (`seconds`) chuẩn xác từng giây với lúc tác giả giảng. | Bấm từng nút mốc thời gian trên video player xem video có nhảy đúng đoạn bài giảng hay không. |
| **6** | **Mấu chốt (`key_takeaways`)** | Đủ 5 bài học cốt lõi thực chiến (`📌 [Tiêu đề]: [Nội dung]`); 100% grounded lời tác giả, cấm bịa data. | Đối chiếu từng gạch đầu dòng với transcript thực tế của tác giả, triệt tiêu mọi suy đoán. |
| **7** | **Kỹ thuật Edit SOP (`edit_sop`)** | Nêu rõ kỹ thuật dựng footage, âm thanh, giọng đọc AI và phụ đề chuẩn của ngách. | Đọc lại đoạn tác giả chia sẻ kinh nghiệm dựng video trong bài giảng. |
| **8** | **Cảnh báo lỗi (`avoid_flags`)** | Nêu bật các cạm bẫy chính sách (Full ảnh AI, bản quyền, bẫy YMYL y tế, spam...). | Trích xuất các lỗi tác giả cảnh báo trực tiếp trong video. |
| **9** | **Cờ kiểm định (`visual_audio_checked`)** | Đặt `visual_audio_checked: true` để ẩn vĩnh viễn dòng cảnh báo tạm bợ ("heuristic transcript cũ..."). | Xem trên giao diện xem khối cảnh báo vàng đã biến mất hoàn toàn chưa. |
| **10** | **Đồng bộ đa tầng & Deploy VPS** | Pass `validate-project.js`, pass `audit_all_136_videos.py`, commit git, push VPS, reload PM2. | Kiểm tra live URL trên `https://h2dev-learn.tonymmo.com/lotrinh/<SKU>` trả về HTTP 200. |

---

## PHẦN 8 — ĐÓNG PHIÊN (bắt buộc)

1. Cập nhật `CHANGELOG.md` bản mới.
2. Backup (`_backup/`) trước khi sửa data.
3. Patch data sai/cũ (patch > create trùng).
4. Xóa script tạm, giữ script tái dùng (`deep-audit.js`).
5. Chạy `node scripts/validate-project.js` xác nhận sạch.

## PHẦN 9 — "THỔI VÀO TAI" mỗi phiên

Mỗi phiên em tự nhắc (3-4 dòng): (1) cộng sự evidence-first, check N/N, đọc FULL; (2) verify đa nguồn MCP, tool lỗi → chuyển tool; (3) phản biện + CÓ/KHÔNG/KHÔNG-VERIFY; (4) đóng phiên cập nhật CHANGELOG + backup + validate; (5) kiểm định video theo đúng Bộ 10 tiêu chuẩn vàng.
