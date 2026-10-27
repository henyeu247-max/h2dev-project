# BỘ PROMPT & TÀI LIỆU THỰC HÀNH — BÀI 14: QUY TRÌNH SẢN XUẤT VIDEO BÁN CONTENT (`VIDEO-a152a6`)

> **Nguồn đối chiếu nguyên bản:** Tài liệu Google Docs đính kèm của khóa học (`https://docs.google.com/document/d/17fkHWAzYnl-TIx7C8GyHIcJIldewQKtlmSTbogtXvJ8/edit?usp=sharing` — lưu tại `doc_1.txt` / `master_prompt.txt`), đối chiếu trực tiếp với màn hình trình duyệt **YouTube** (`@realadamrose`, `@Smartpocket-r9b`), **Google Dịch**, **Douyin** (`douyin.com`), **CapCut PC** (Dự án `0630`), **Google Gemini** (`gemini.google.com`), **Suno AI**, **Pinterest** và **Picsart** trong video bài giảng Bài 14 của **Đại Gia Mang Dép (DGMD Academy — Module 4)**.

---

## 1. Hệ Thống Kênh Tham Chiếu & Công Cụ Trong Bài Giảng (`00:00 – 02:35`)

### 1.1. Danh sách Kênh YouTube Tham khảo (Trong tài liệu Google Docs & trên màn hình)
1. **Adam Rose (`@realadamrose`)** — `https://www.youtube.com/@realadamrose/shorts` (**HTTP 200 Live**)
   - **Quy mô trên màn hình (`00:15`):** `6,26 Tr người đăng ký` • `1,6 N video`.
   - **Đặc trưng:** Diễn viên hài nổi tiếng chuyên đóng các đoạn Reaction/biểu cảm ngơ ngác trong vai kỹ sư công trường đội mũ bảo hộ vàng (*"i seriously have to find a new job..."* — `257 Tr lượt xem`, *"i'm calling in sick tomorrow..."* — `234 Tr lượt xem`), đầu bếp, cảnh sát.
2. **Smart Pocket (`@Smartpocket-r9b`)** — `https://www.youtube.com/@Smartpocket-r9b/videos` (**HTTP 200 Live**)
   - **Đặc trưng:** Kênh làm dạng Bán Content (Semi-Content) tổng hợp clip hài hước/gái xinh công trường kết hợp nhân vật biểu cảm đạt tới **2 triệu lượt xem** với thời lượng video dài hàng chục phút đến 1 tiếng (RPM rất cao).
3. **Adam-RoseFans1 (`@Adam-RoseFans1`)** — `https://www.youtube.com/@Adam-RoseFans1/videos` (**Đã ngừng hoạt động — HTTP 404**)
   - **Lưu ý thực chiến từ giảng viên (`01:05`):** Dạng kênh Bán Content có tỷ lệ tắt kiếm tiền theo đợt quét nhưng **RPM cực kỳ cao** và khâu sản xuất rất nhanh, do đó chiến thuật chuẩn là **vận hành song song 5–10 kênh (thậm chí 20–30 kênh)** để ăn doanh thu mạnh trong chu kỳ 3–5 tháng.

### 1.2. Bộ Công Cụ Sản Xuất & Link Tài Nguyên Gốc
- **Thiết kế Thumbnail:** `https://www.picsart.com/` (hoặc Canva) — chuẩn kích thước `1920 × 1080` (`16:9`).
- **Chỉnh sửa & Dựng video:** **CapCut PC** (định dạng `16:9`, phóng tỷ lệ `174%`, bật `Nền -> Mờ`).
- **Tạo nhạc nền không bản quyền:** `https://suno.com/` (**Suno AI**).
- **Phân tích video & viết câu bình luận meme (Fair Use):** `https://gemini.google.com/` (**Google Gemini Flash**).
- **Kho âm thanh hiệu ứng (Sound Effects) ngoài CapCut:** `https://www.myinstants.com/vi/index/vn/`.
- **Kho tìm nguồn video gốc:** **Douyin (`douyin.com`)** (dùng trình duyệt **Cốc Cốc** để tải trực tiếp), **TikTok**, **YouTube**, **Facebook**, **Pinterest** (tải ảnh nhân vật Adam Rose).

---

## 2. Nguyên Văn MASTER PROMPT Phân Tích Video & Viết Text Meme Cho Google Gemini (`08:25 – 10:15`)

> **Cách dùng:** Mở **Google Gemini (`gemini.google.com`)**, dán toàn bộ khối `MASTER PROMPT` dưới đây gửi cho Gemini ghi nhớ trước, sau đó **tải trực tiếp file video thô đã cắt ghép (dài 1–10 phút) lên Gemini** để AI xem từng giây và xuất bảng câu chữ chèn vào video:

```text
BẠN LÀ CHUYÊN GIA PHÂN TÍCH VIDEO NGẮN VIRAL, BIÊN TẬP VIÊN CAPTION HÀI HƯỚC VÀ ĐẠO DIỄN NHỊP DỰNG CHO TIKTOK / YOUTUBE SHORTS / REELS.

Tôi sẽ gửi cho bạn một video đã được tôi ghép sẵn từ nhiều đoạn ngắn khác nhau.

NHIỆM VỤ CỦA BẠN:
Hãy xem toàn bộ video và phân tích thật kỹ nội dung hình ảnh, biểu cảm nhân vật, hành động, bối cảnh, nhịp chuyển cảnh, yếu tố gây cười hoặc gây bất ngờ trong video.

MỤC TIÊU:
1. Hiểu chính xác video đang diễn ra chuyện gì theo từng đoạn thời gian.
2. Tạo ra các câu chữ (on-screen text / phụ đề chèn vào video) bằng TIẾNG ANH thật tự nhiên, ngắn gọn, hài hước, đúng ngữ cảnh từng cảnh trong video.
3. Gợi ý thời điểm chèn chữ theo mốc giây cụ thể, ví dụ:
   - 00:00 - 00:03
   - 00:03 - 00:06
   - 00:06 - 00:09
   ...
4. Mỗi mốc thời gian phải ghi rõ:
   - Cảnh đó đang diễn ra gì
   - Câu text tiếng Anh nên chèn vào là gì
   - Giải thích ngắn bằng tiếng Việt vì sao câu đó hợp cảnh
   - Gợi ý vị trí đặt chữ hoặc kiểu xuất hiện nếu cần (ví dụ: chữ mở đầu gây tò mò, chữ phản ứng hài hước, chữ kết bất ngờ)

YÊU CẦU QUAN TRỌNG VỀ PHONG CÁCH CHỮ:
- Phải viết bằng TIẾNG ANH đơn giản, dễ hiểu với người xem quốc tế
- Ngắn gọn, súc tích, dễ đọc nhanh trên màn hình
- Ưu tiên mỗi câu từ 3 đến 10 từ
- Phong cách hài hước, duyên dáng, hơi meme nhẹ, tự nhiên như người bản xứ dùng trên TikTok / Shorts / Reels
- Không viết dài dòng, không dùng từ quá học thuật
- Không bịa nội dung không có trong video
- Câu chữ phải khớp với hành động, biểu cảm hoặc tình huống thật trong từng đoạn
- Nếu video có đoạn chuyển sang nhân vật phản ứng / đứng nhìn / bất ngờ / ngơ ngác / phán xét / cạn lời thì phải tạo câu chữ làm nổi bật sự hài hước của khoảnh khắc đó
- Nếu có nhiều cảnh liên tiếp cùng một kiểu nội dung, hãy tạo mạch chữ có cảm giác tăng dần độ hài hước

CẤU TRÚC KẾT QUẢ BẠN PHẢI TRẢ VỀ:

PHẦN 1: TỔNG QUAN VIDEO
- Tóm tắt ngắn gọn nội dung tổng thể của video
- Xác định kiểu nội dung chính của video
- Xác định điểm hài hước / điểm hút người xem chính

PHẦN 2: PHÂN TÍCH THEO TỪNG MỐC GIÂY VÀ GỢI Ý TEXT CHÈN VIDEO
Trình bày rõ theo từng đoạn:
- Mốc thời gian: [00:00 - 00:03]
  + Mô tả cảnh: ...
  + Text tiếng Anh gợi ý: "..."
  + Dịch nghĩa tiếng Việt: "..."
  + Lý do hợp cảnh: ...
  + Gợi ý hiển thị: (trên đầu / giữa màn hình / dưới màn hình / chữ nhảy nhanh / chữ nhấn mạnh...)

(Tiếp tục chia đầy đủ cho đến hết toàn bộ thời lượng video, không được bỏ sót đoạn quan trọng)

PHẦN 3: BẢNG TEXT CHỐT NHANH ĐỂ COPY DÙNG NGAY
Liệt kê gọn theo dạng:
- 00:00 - 00:03: "..."
- 00:03 - 00:06: "..."
- 00:06 - 00:09: "..."
...
(Dạng ngắn gọn để tôi chỉ việc copy và dán vào phần mềm dựng video)

PHẦN 4: 5 PHƯƠNG ÁN HOOK MỞ ĐẦU THAY THẾ
- Viết thêm 5 câu tiếng Anh cực cuốn cho 3 giây đầu tiên để tăng tỷ lệ giữ chân người xem

PHẦN 5: 5 CÂU KẾT CUỐI VIDEO GÂY BẤT NGỜ / HÀI HƯỚC
- Viết thêm 5 câu tiếng Anh cho đoạn cuối để tăng cảm giác trọn vẹn và dễ khiến người xem bình luận

LƯU Ý BẮT BUỘC:
- Phải chia thời gian sát với diễn biến thật trong video
- Nếu một cảnh kéo dài lâu nhưng có 2 nhịp cảm xúc khác nhau, hãy tách thành 2 mốc thời gian riêng
- Nếu có cảnh phản ứng của nhân vật phụ / nhân vật chèn thêm, phải viết câu text làm rõ sự đối lập hoặc hài hước giữa 2 cảnh
- Toàn bộ kết quả giải thích cho tôi bằng TIẾNG VIỆT, nhưng phần chữ chèn vào video phải là TIẾNG ANH (kèm dịch nghĩa tiếng Việt bên dưới để tôi dễ hiểu).

Bây giờ hãy ghi nhớ toàn bộ hướng dẫn trên. Khi tôi gửi video, hãy bắt đầu phân tích ngay theo đúng cấu trúc này.
```

### Kết Quả Thực Tế Gemini Xuất Ra Cho Video Mẫu Trong Bài Giảng (`09:30 – 11:50`)
- **Cảnh 1 (`00:00 – 00:03`):**
  - **English Text:** `"When you accidentally apply for construction but dressed for a party."`
  - **Vietnamese Text:** *"Khi bạn lên đồ đi tiệc nhưng vũ trụ đưa đẩy đi phụ hồ."*
- **Cảnh 2 (`00:03 – 00:06`):**
  - **English Text:** `"Work hard, stay glamorous."`
  - **Vietnamese Text:** *"Khổ mấy thì khổ, thần thái vẫn phải đỉnh."*
- **Transition Text (`00:06 – 00:07` — Cảnh cắt sang kỹ sư Adam Rose):**
  - **English Text:** `"Meanwhile, the site manager..."`
- **Các câu tiếp theo được giảng viên chèn lên timeline CapCut (`11:00 – 12:30`):**
  - `"Is this even legal?"` • `"DIY but make it fashion."` • `"Professional tool juggling"` • `"Bro is questioning his whole career"` • `"Just another normal day at work."`

---

## 3. Nguyên Văn Bộ 10 Prompt Tạo Nhạc Nền Hài Hước Không Bản Quyền Trên Suno AI (`12:45 – 14:10`)

> **Cách dùng trên Suno AI (`suno.com`):** Chọn chế độ **Simple** -> bật **Instrumental** -> dán 1 trong 10 câu lệnh dưới đây vào ô mô tả (trong bài giảng, giảng viên dùng Prompt số 1 tạo ra bài **`Mischief in Pocket.wav`**):

1. `Create a funny, upbeat, quirky instrumental background music track with playful pizzicato strings, light marimba, bouncy bass, cheeky woodwinds, and subtle cartoon percussion, fast-medium tempo, cheerful and mischievous mood, clean modern mix, loop-friendly, no vocals.`
2. `Make a comedic instrumental background track for short funny videos, featuring sneaky plucked strings, whimsical xylophone, funky bassline, light acoustic drums, and playful brass accents, humorous and lighthearted vibe, crisp production, no singing, easy to loop.`
3. `Generate a lighthearted, meme-style instrumental background music piece with bouncy ukulele, quirky synth plucks, upright bass, handclaps, and silly percussive hits, upbeat tempo, fun and carefree energy, bright mix, no vocals, suitable for viral comedy edits.`
4. `Compose a playful and slightly awkward instrumental comedy track with tiptoe pizzicato strings, bassoon stabs, marimba melodies, soft snare brushes, and comedic timing pauses, medium tempo, goofy and curious atmosphere, clean sound, no vocals.`
5. `Create an energetic, funny instrumental background beat with funky slap bass, cheerful piano riffs, lively drums, quirky horn stabs, and cartoon-like rhythmic accents, upbeat and humorous tone, modern polished mix, no vocals, great for reaction and fail videos.`
6. `Produce a whimsical, cheerful instrumental track for comedy clips using acoustic guitar, xylophone, upright bass, light shaker percussion, and playful whistling-style synth lead, warm and funny vibe, medium-fast tempo, seamless loop feel, no vocals.`
7. `Make a mischievous, comedic background instrumental with sneaky strings, quirky clave rhythm, bouncy tuba bass, playful woodwinds, and subtle slapstick percussion, fun and ironic mood, clear mix that leaves space for sound effects, no vocals.`
8. `Generate a bright, modern funny background music track with tropical marimba, funky guitar muted strums, bouncy bass, light clap beat, and humorous synth accents, upbeat tempo, viral short-video feel, clean and catchy, instrumental only, no vocals.`
9. `Create a silly and charming instrumental comedy tune with ragtime-inspired piano, pizzicato strings, upright bass, light brush drums, and cheeky brass hits, lively tempo, playful old-school cartoon energy with modern clarity, no vocals.`
10. `Compose a loopable funny reaction background instrumental with groovy bass, pluck synths, marimba, light hip-hop comedy drums, and expressive quirky intervals, medium-upbeat tempo, ironic and entertaining mood, clean mix, no vocals.`
