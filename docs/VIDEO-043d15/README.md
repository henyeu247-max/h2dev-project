# VIDEO-043d15 — *Thực chiến Hướng dẫn train prompt và làm kịch bản ngách nhỏ key sức khỏe thị trường Hàn Quốc | Update 02-10-2026

## 1. Thông Tin Tổng Quan (H2DEV 7-Layer Verified)
- **Mã SKU:** `VIDEO-043d15` (Bài `#95`)
- **Tiêu đề gốc:** *Thực chiến Hướng dẫn train prompt và làm kịch bản ngách nhỏ key sức khỏe thị trường Hàn Quốc | Update 02-10-2026
- **Chủ đề thực chiến:** Masterclass 28 phút: Hướng dẫn thực chiến train prompt Claude Skill 3 chế độ (Gợi ý key, Viết kịch bản tự do, Bán content đối thủ); tinh chỉnh ElevenLabs Hàn Quốc tốc độ 0.96
- **Ngách nội dung:** Quy Trình AI & Train Prompt Kịch Bản Thực Chiến
- **Thị trường mục tiêu:** 🇰🇷 Hàn Quốc (Mã: `KR`)
- **Thời lượng:** 27:58 (`1678s`)
- **File Video:** [`video/VIDEO-043d15/VIDEO-043d15.mp4`](/video/VIDEO-043d15/VIDEO-043d15.mp4)
- **Ảnh đại diện:** [`assets/thumbs/VIDEO-043d15.png`](/assets/thumbs/VIDEO-043d15.png)
- **Phụ đề chuẩn 1:1:** [`video/VIDEO-043d15/transcript.txt`](/video/VIDEO-043d15/transcript.txt)

---

## 2. Kênh Đối Thủ Trong Video & Mô Tả Gốc
### Danh sách kênh đối thủ xuất hiện trong bài giảng:
- `@건강채소연구노트` (https://www.youtube.com/@건강채소연구노트)
- `@채소와과일건강백서` (https://www.youtube.com/@채소와과일건강백서)
- `@영양사의건강강좌` (https://www.youtube.com/@영양사의건강강좌)

### Nội dung mô tả gốc (description.txt):
```text
WEB NGUỒN VIDEO TỰ NHI&Ecirc;N MIỄN PH&Iacute; / KH&Ocirc;NG BẢN QUYỀN
WEB LẤY KỊCH BẢN VIDEO YTB
Skill đ&atilde; train mẫu trong video
c&aacute;c k&ecirc;nh đối thủ trong video, (để tr&aacute;nh hạn chế mn bấm qua link nhiều qu&aacute; spam k&ecirc;nh tội họ th&igrave; em để id k&ecirc;nh nh&eacute; ạ, mấy b&aacute;c copy qua ytb search nha)
@건강채소연구노트
@채소와과일건강백서
@영양사의건강강좌
```

---

## 3. Mấu Chốt Bài Giảng (Key Takeaways)
- 📌 Quy trình thu thập dữ liệu đối thủ chuẩn mực: Chọn 2 kênh cùng trường phái ngách nhỏ sức khỏe rau củ Hàn Quốc (@건강채소연구노트 và @채소와과일건강백서, trong khi kênh thứ 3 @영양사의건강강좌 làm món ăn rộng hơn chỉ để tham khảo), copy toàn bộ tiêu đề mục Phổ biến, mô tả kênh, thẻ tag kênh/video và lấy 4 kịch bản cao view nhất lưu bằng Notepad++.
- 📌 Huấn luyện Claude Pro từng bước (Step-by-step Training): Không ép AI tạo skill ngay lập tức mà nạp dữ liệu từng bước để Claude bóc tách điểm giao thoa của ngách cực nhỏ (táo, cà rốt, khoai tây + thận/đường huyết), nhận diện 2 trường phái kịch bản (dẫn dắt nỗi sợ và câu đố nguyên tắc) cùng bộ SEO đi kèm.
- 📌 Đóng gói Claude Skill 3 Chế Độ (Brand Keyword '밥상 건강'): Chế độ 1 tự động gợi ý 10-20 đề tài chia theo nhóm bệnh học; Chế độ 2 viết kịch bản đầy đủ (~9.000 từ, kèm chữ trên thumbnail, mô tả, tag và danh sách xác minh sự thật) từ chủ đề tự chọn; Chế độ 3 Bán Content 70% từ kịch bản và tiêu đề đối thủ mà không bị AI từ chối vì lý do bản quyền.
- 📌 Nguyên tắc tạo New Chat cho mỗi kịch bản mới: Sau khi lưu skill (hoặc xuất file .zip), mỗi lần viết kịch bản cho video mới bắt buộc phải mở cửa sổ chat mới rồi gọi dấu gạch chéo (/), tuyệt đối không viết dồn nhiều kịch bản trong một đoạn chat cũ làm suy giảm chất lượng AI.
- 📌 Cấu hình ElevenLabs chuẩn xác 100% giữa Web và Tool API: Chọn giọng Hàn Quốc mục Giáo dục, kiểm tra đúng tên model trên web (ví dụ Eleven Multilingual v2; nếu chọn nhầm model tiếng Việt v3/v2 lệch nhau giọng đọc sẽ bị méo sang tiếng Thái Lan), chỉnh tốc độ Speed 0.96 và bắt buộc tích ô 'Change Voice Settings' trước khi bấm Start và Join Voice.

---

## 4. Kỹ Thuật Edit & SOP Né Quét AI
- **Quy trình cốt lõi:** Quy trình train Claude Pro đóng gói Skill viết kịch bản 3 chế độ ngách sức khỏe Hàn Quốc và đồng bộ thông số Voice API ElevenLabs.
- **Các bước triển khai chi tiết:**
  - Vào tab Phổ biến của 2 kênh đối thủ cùng ngách (@건강채소연구노트, @채소와과일건강백서), copy danh sách tiêu đề dán vào Claude để phân tích bước 1.
  - Dùng web lấy transcript miễn phí rút 4 kịch bản cao view nhất lưu qua Notepad++, tải lên Claude kèm mô tả video, thẻ tag kênh và thẻ tag video.
  - Yêu cầu Claude thiết kế Skill tích hợp 3 chế độ (1: Gợi ý 10-20 đề tài; 2: Viết từ chủ đề nhập vào; 3: Bán content 70% từ kịch bản đối thủ), chốt Brand Keyword '밥상 건강' và bấm Lưu Skill.
  - Mở New Chat mới cho mỗi bài, gõ '/' gọi Skill, chọn đề tài để AI xuất kịch bản ~9.000 từ kèm text thumbnail, mô tả, thẻ tag và bảng kiểm chứng thông tin.
  - Trên ElevenLabs, lọc giọng Hàn Quốc (mục Giáo dục), copy Voice ID sang tool API, chọn đúng model Eleven Multilingual v2, đặt Speed 0.96, tích chọn 'Change Voice Settings' rồi bấm Start -> Join Voice.

---

## 5. Cảnh Báo & Lỗi Cần Tránh (Avoid Flags)
- ⚠️ Không dùng tài khoản Claude miễn phí (Free) để train skill dài vì bị giới hạn ngữ cảnh; tối thiểu nên dùng gói Claude Pro (hoặc Max khi làm nhiều kênh).
- ⚠️ Không viết tiếp kịch bản thứ 2, thứ 3 trong cùng một cửa sổ chat cũ vì làm loãng bộ nhớ ngữ cảnh; bắt buộc tạo New Chat cho mỗi video mới.
- ⚠️ Không ra lệnh thô 'viết lại 70% kịch bản đối thủ' trực tiếp khi chưa train skill vì các model AI mới sẽ từ chối vì lý do bản quyền.
- ⚠️ Không chọn lệch model ElevenLabs giữa Web và Tool (ví dụ web là Eleven Multilingual v2 nhưng tool chọn sai model sẽ khiến giọng Hàn đọc méo sang tiếng Thái Lan) và không quên tích ô 'Change Voice Settings'.

---

## 6. Mốc Thời Gian Trọng Tâm (Key Timestamps)
- **[00:00]** Mở đầu: Mục tiêu đóng gói Claude Skill tái sử dụng lâu dài và phân biệt 3 kênh đối thủ (`0s`)
- **[02:41]** Bước 1: Copy danh sách video phổ biến của 2 kênh cùng ngách nạp vào Claude phân tích (`161s`)
- **[06:15]** Bước 2: Lấy 4 kịch bản cao view nhất bằng Notepad++ kèm mô tả và thẻ tag kênh/video (`375s`)
- **[10:17]** Bước 3: Thiết lập Brand Keyword (밥상 건강) và cấu trúc Claude Skill 3 chế độ (kèm Bán Content 70%) (`617s`)
- **[18:54]** Thực hành gọi Skill trên New Chat: Gợi ý 20 chủ đề và xuất kịch bản 9.000 từ kèm SEO (`1134s`)
- **[23:08]** Cấu hình ElevenLabs chuẩn: Chọn giọng Hàn Giáo dục, model Multilingual v2, Speed 0.96 và Change Voice Settings (`1388s`)

---

## 7. Công Cụ Sử Dụng Trong Bài
- **Công cụ & Nền tảng:** `Claude`, `ElevenLabs`, `ChatGPT`, `Notepad++`
