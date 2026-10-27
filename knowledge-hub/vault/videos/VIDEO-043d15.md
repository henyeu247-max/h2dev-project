---
sku: "VIDEO-043d15"
title: "*Thực chiến Hướng dẫn train prompt và làm kịch bản ngách nhỏ key sức khỏe thị trường Hàn Quốc | Update 02-10-2026"
track: "h2dev"
module_id: "H2DEV-M06"
module_title: "VIP - Module 4 — Thực chiến Share key / Hướng dẫn chi tiết quy trình làm, edit, train prompt, tạo thumbnail – Nhiều thị trường (ngách nhỏ) – Cập nhật thường xuyên liên tục"
seq: "95"
niche: "Quy Trình AI & Train Prompt Kịch Bản Thực Chiến"
markets: ["🇰🇷 Hàn"]
duration: "27:58"
published_at: "2026-10-02"
toolsCount: 4
channelsCount: 3
docsCount: 9
player_url: "/player.html?sku=VIDEO-043d15&track=h2dev"
---

# VIDEO-043d15 — *Thực chiến Hướng dẫn train prompt và làm kịch bản ngách nhỏ key sức khỏe thị trường Hàn Quốc | Update 02-10-2026

> **Chuỗi Liên Kết Tri Thức (Knowledge Graph Links):**  
> - **Track:** [[tracks/TRACK-H2DEV|Nhánh H2DEV · YouTube Faceless Master (148 Videos)]]  
> - **Module:** [[modules/H2DEV-M06|H2DEV-M06 — VIP - Module 4 — Thực chiến Share key / Hướng dẫn chi tiết quy trình làm, edit, train prompt, tạo thumbnail – Nhiều thị trường (ngách nhỏ) – Cập nhật thường xuyên liên tục]] (Bài `#95`)  
> - **Ngách nội dung (Niche):** [[niches/quy-trinh-ai-train-prompt-kich-ban-thuc-chien|Quy Trình AI & Train Prompt Kịch Bản Thực Chiến]]  
> - **Thị trường:** 🇰🇷 Hàn | **Thời lượng:** `27:58` | **Ngày đăng:** `2026-10-02`  
> - **Mở trên Player:** [Xem Video & Phụ Đề Tương Tác](/player.html?sku=VIDEO-043d15&track=h2dev) · [Hồ sơ gốc README.md](../../../docs/VIDEO-043d15/README.md)

---

## 1. Chủ Đề Thực Tế & Giá Trị Cốt Lõi (`Key Takeaways`)
- **Chủ đề thực tế:** Masterclass 28 phút: Hướng dẫn thực chiến train prompt Claude Skill 3 chế độ (Gợi ý key, Viết kịch bản tự do, Bán content đối thủ); tinh chỉnh ElevenLabs Hàn Quốc tốc độ 0.96
- 📌 Quy trình thu thập dữ liệu đối thủ chuẩn mực: Chọn 2 kênh cùng trường phái ngách nhỏ sức khỏe rau củ Hàn Quốc (@건강채소연구노트 và @채소와과일건강백서, trong khi kênh thứ 3 @영양사의건강강좌 làm món ăn rộng hơn chỉ để tham khảo), copy toàn bộ tiêu đề mục Phổ biến, mô tả kênh, thẻ tag kênh/video và lấy 4 kịch bản cao view nhất lưu bằng Notepad++.
- 📌 Huấn luyện Claude Pro từng bước (Step-by-step Training): Không ép AI tạo skill ngay lập tức mà nạp dữ liệu từng bước để Claude bóc tách điểm giao thoa của ngách cực nhỏ (táo, cà rốt, khoai tây + thận/đường huyết), nhận diện 2 trường phái kịch bản (dẫn dắt nỗi sợ và câu đố nguyên tắc) cùng bộ SEO đi kèm.
- 📌 Đóng gói Claude Skill 3 Chế Độ (Brand Keyword '밥상 건강'): Chế độ 1 tự động gợi ý 10-20 đề tài chia theo nhóm bệnh học; Chế độ 2 viết kịch bản đầy đủ (~9.000 từ, kèm chữ trên thumbnail, mô tả, tag và danh sách xác minh sự thật) từ chủ đề tự chọn; Chế độ 3 Bán Content 70% từ kịch bản và tiêu đề đối thủ mà không bị AI từ chối vì lý do bản quyền.
- 📌 Nguyên tắc tạo New Chat cho mỗi kịch bản mới: Sau khi lưu skill (hoặc xuất file .zip), mỗi lần viết kịch bản cho video mới bắt buộc phải mở cửa sổ chat mới rồi gọi dấu gạch chéo (/), tuyệt đối không viết dồn nhiều kịch bản trong một đoạn chat cũ làm suy giảm chất lượng AI.
- 📌 Cấu hình ElevenLabs chuẩn xác 100% giữa Web và Tool API: Chọn giọng Hàn Quốc mục Giáo dục, kiểm tra đúng tên model trên web (ví dụ Eleven Multilingual v2; nếu chọn nhầm model tiếng Việt v3/v2 lệch nhau giọng đọc sẽ bị méo sang tiếng Thái Lan), chỉnh tốc độ Speed 0.96 và bắt buộc tích ô 'Change Voice Settings' trước khi bấm Start và Join Voice.

## 2. Quy Trình Sản Xuất & Dựng Video (`Edit SOP`)
- **Trọng tâm:** Quy trình train Claude Pro đóng gói Skill viết kịch bản 3 chế độ ngách sức khỏe Hàn Quốc và đồng bộ thông số Voice API ElevenLabs.
1. Vào tab Phổ biến của 2 kênh đối thủ cùng ngách (@건강채소연구노트, @채소와과일건강백서), copy danh sách tiêu đề dán vào Claude để phân tích bước 1.
2. Dùng web lấy transcript miễn phí rút 4 kịch bản cao view nhất lưu qua Notepad++, tải lên Claude kèm mô tả video, thẻ tag kênh và thẻ tag video.
3. Yêu cầu Claude thiết kế Skill tích hợp 3 chế độ (1: Gợi ý 10-20 đề tài; 2: Viết từ chủ đề nhập vào; 3: Bán content 70% từ kịch bản đối thủ), chốt Brand Keyword '밥상 건강' và bấm Lưu Skill.
4. Mở New Chat mới cho mỗi bài, gõ '/' gọi Skill, chọn đề tài để AI xuất kịch bản ~9.000 từ kèm text thumbnail, mô tả, thẻ tag và bảng kiểm chứng thông tin.
5. Trên ElevenLabs, lọc giọng Hàn Quốc (mục Giáo dục), copy Voice ID sang tool API, chọn đúng model Eleven Multilingual v2, đặt Speed 0.96, tích chọn 'Change Voice Settings' rồi bấm Start -> Join Voice.

## 3. Cảnh Báo Rủi Ro & Lỗi Cần Tránh (`Avoid Flags`)
- ⚠️ Không dùng tài khoản Claude miễn phí (Free) để train skill dài vì bị giới hạn ngữ cảnh; tối thiểu nên dùng gói Claude Pro (hoặc Max khi làm nhiều kênh).
- ⚠️ Không viết tiếp kịch bản thứ 2, thứ 3 trong cùng một cửa sổ chat cũ vì làm loãng bộ nhớ ngữ cảnh; bắt buộc tạo New Chat cho mỗi video mới.
- ⚠️ Không ra lệnh thô 'viết lại 70% kịch bản đối thủ' trực tiếp khi chưa train skill vì các model AI mới sẽ từ chối vì lý do bản quyền.
- ⚠️ Không chọn lệch model ElevenLabs giữa Web và Tool (ví dụ web là Eleven Multilingual v2 nhưng tool chọn sai model sẽ khiến giọng Hàn đọc méo sang tiếng Thái Lan) và không quên tích ô 'Change Voice Settings'.

## 4. Liên Kết Công Cụ AI & Phần Mềm (`Tools Mentioned`)
- [[tools/claude|Claude]]
- [[tools/elevenlabs|ElevenLabs]]
- [[tools/chatgpt|ChatGPT]]
- [[tools/notepad|Notepad++]]

## 5. Liên Kết Kênh Mẫu & Đối Thủ (`Competitor Channels`)
- [[channels/건강채소연구노트|@건강채소연구노트]]
- [[channels/채소와과일건강백서|@채소와과일건강백서]]
- [[channels/영양사의건강강좌|@영양사의건강강좌]]

## 6. Tài Liệu Đính Kèm Bài Học (`Course Docs`)
- **Hồ sơ phân tích & SOP thực chiến: *Thực chiến Hướng dẫn train prompt và làm kịch bản ngách nhỏ key sức khỏe thị trường Hàn Quốc | Update 02-10-2026 (README.md):** `docs/VIDEO-043d15/README.md`
- **WEB NGUỒN VIDEO TỰ NHIÊN MIỄN PHÍ / KHÔNG BẢN QUYỀN (Pexels, Vecteezy, Coverr, Freepik, Pixabay):** `assets/docs/VIDEO-043d15/195NXjEWBarcA8_gl2OFoQB3jT1FPRUDakGHCyJGW4eo.csv`
- **WEB LẤY KỊCH BẢN VIDEO YTB (youtube-transcript.io):** `https://www.youtube-transcript.io/`
- **Skill đã train mẫu trong video (kichban-bapsang-kr.zip):** `assets/docs/VIDEO-043d15/1DOSPEUUwZbsor6VAxvmmb906peyYHB8T.zip`
- **Claude Skill: Kịch bản kênh sức khỏe tiếng Hàn 밥상 건강 연구소 (SKILL.md):** `assets/docs/VIDEO-043d15/SKILL-kichban-bapsang-kr.md`
- **Phân tích đối thủ 2 kênh sức khỏe Hàn Quốc (건강 채소 연구노트 & 채소와 과일 건강백서):** `assets/docs/VIDEO-043d15/PHAN-TICH-DOI-THU-KR.md`
- **SOP Master Train Prompt Claude Skill 3 Chế Độ & Chuẩn Hóa Voice ElevenLabs Hàn Quốc:** `assets/docs/VIDEO-043d15/SOP-TRAIN-PROMPT-CLAUDE-SKILL-3-CHE-DO-KICH-BAN-SUC-KHOE-HAN.md`
- **Tài liệu thực chiến đính kèm: PROMPT-MASTER-CLAUDE-SKILL-KICHBAN-CHAESO-KR.md:** `assets/docs/VIDEO-043d15/PROMPT-MASTER-CLAUDE-SKILL-KICHBAN-CHAESO-KR.md`
- **Bản ghi phụ đề đầy đủ (Transcript timestamped .txt):** `video/VIDEO-043d15/transcript.txt`

## 7. Mốc Thời Gian Trọng Tâm (`Key Timestamps`)
- `00:00` (0s) — Mở đầu: Mục tiêu đóng gói Claude Skill tái sử dụng lâu dài và phân biệt 3 kênh đối thủ
- `02:41` (161s) — Bước 1: Copy danh sách video phổ biến của 2 kênh cùng ngách nạp vào Claude phân tích
- `06:15` (375s) — Bước 2: Lấy 4 kịch bản cao view nhất bằng Notepad++ kèm mô tả và thẻ tag kênh/video
- `10:17` (617s) — Bước 3: Thiết lập Brand Keyword (밥상 건강) và cấu trúc Claude Skill 3 chế độ (kèm Bán Content 70%)
- `18:54` (1134s) — Thực hành gọi Skill trên New Chat: Gợi ý 20 chủ đề và xuất kịch bản 9.000 từ kèm SEO
- `23:08` (1388s) — Cấu hình ElevenLabs chuẩn: Chọn giọng Hàn Giáo dục, model Multilingual v2, Speed 0.96 và Change Voice Settings
