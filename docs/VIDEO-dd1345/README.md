# VIDEO-dd1345 — Quy Trình Sản Xuất Video Doyin

> **Học phần:** `DGMD-M03` (Bài 10 — Ngách Xanh Bán Content & Reup Hợp Pháp / Khai Thác Nguồn Douyin Triệu View)  
> **Ngách chiến lược:** Bán Content & Reup Hợp Pháp (`douyin_reup` — `ngach_xanh`)  
> **Thị trường mục tiêu:** Việt Nam & Đông Nam Á (`VN_SEA`)  
> **Thời lượng:** `07:01` (`421.43s`) — Đã đối soát 100% Khung Hình Video (`CUDA GPU Frames`) + Âm Thanh (`Whisper Large V3 Turbo`) + Tài Liệu Đính Kèm (`master_prompt.md`, `doc_1.txt`, `master_prompt.txt`).

---

## 1. Phân Tích 2 Kênh Mẫu Thực Tế & Mô Hình Khai Thác Nguồn Video Douyin

Trong bài học thứ 10 của chương trình, giảng viên **Đại Gia Mang Dép** trình chiếu trực tiếp 2 kênh YouTube Shorts tại Việt Nam đang khai thác nguồn video ngắn miễn phí từ nền tảng **Douyin (TikTok Trung Quốc)** kết hợp bình luận hài hước để thu về hàng trăm triệu lượt xem, đồng thời bàn giao **Master Prompt 10 Bước trên Google Gemini** giúp tự động xem video và viết kịch bản khớp thời lượng đến từng giây.

### Bảng đối soát 2 Kênh Đối Thủ thực tế trên màn hình (`00:00` – `00:35`, đã xác thực `HTTP 200`)
| Chỉ số đối soát | Kênh mẫu số 1: **`Triệu Que Củi`** | Kênh mẫu số 2: **`Đảo Chiều`** |
| :--- | :--- | :--- |
| **Handle & URL** | `@TrieuNe05` ([youtube.com/@TrieuNe05](https://www.youtube.com/@TrieuNe05)) | `@daochieu037` ([youtube.com/@daochieu037](https://www.youtube.com/@daochieu037)) |
| **Số người đăng ký** | **`363 N người đăng ký`** (`363,000+ subscribers`) | **`1,17 Tr người đăng ký`** (`1,170,000+ subscribers`) |
| **Tổng số video & Lượt xem** | **`283 video`** — Tổng **`391 triệu lượt xem`** | **`1,2 N video`** — Hàng trăm triệu lượt xem |
| **Định vị nội dung** | Review hài hước thú cưng, động vật & đời sống (*"nơi bạn sẽ cười xỉu up xỉu down mỗi ngày!"*) | Thuyết minh bình luận các tình huống bất ngờ, kỷ lục & hài hước quốc tế / Douyin |
| **Các Shorts nổi bật trên màn hình** | *Chú cá Heo biểu diễn dưới nước* (`1,9 Tr view`), *Cô gái bị đàn lợn vây quanh* (`354 N view`), *Anh chàng dùng Bảo Bối Thần Kỳ hút cạn nước...* (`279 N view`) | *Chàng trai chạy đua phá kỉ luật thế giới...* (`33 Tr view`), *Tại sao họ lại hò reo cổ vũ...* (`21 Tr view`), *Đây là lí do đừng nên tin...* (`19 Tr view`), *Cậu bé hốt hoảng bỏ chạy...* (`17 Tr view`) |

---

## 2. Bộ Công Cụ Cốt Lõi Sử Dụng Trong Quy Trình

1. **Google Gemini (`gemini.google.com`):** Trợ lý AI đa phương thức (`Multimodal AI`) nhận **Master Prompt 10 Bước** và trực tiếp đọc file video `.mp4` tải từ Douyin để phân tích diễn biến theo từng mốc giây, dịch lời thoại, giải thích meme Trung Quốc và viết **3 phiên bản kịch bản review hài hước** khớp 98% thời lượng video.
2. **Google Dịch (`translate.google.com.vn`):** Chuyển đổi các từ khóa chủ đề từ tiếng Việt (*động vật hài hước*, *ăn uống*, *giải trí*, *gia đình*) sang **tiếng Trung (Phồn thể / Giản thể)** để tra cứu trên Douyin.
3. **Douyin (`douyin.com`):** Nguồn cung cấp video ngắn miễn phí lớn nhất thế giới (học viên có thể đăng ký tài khoản dễ dàng bằng số điện thoại Việt Nam).
4. **Công cụ Tải Video Douyin Không Logo (`Snaptik Douyin`):** Tải tệp `.mp4` gốc chất lượng cao, loại bỏ hoàn toàn watermark ID Douyin.
5. **CapCut Pro (Bản PC):** Xử lý hậu kỳ toàn diện gồm:
   - Chuyển văn bản thành giọng nói (`Text-to-Speech`) tiếng Việt giọng **`Cô Gái Hoạt Ngôn`**.
   - Tăng tốc độ giọng đọc lên **`1.2x`** và bật **`Thay đổi âm thanh độ cao`**.
   - Tạo **`Phụ đề tự động` (`Auto Captions`)** tiếng Việt kèm **`Mẫu văn bản`** nổi bật.
   - Phủ **`Bộ lọc 4K` (`4K Filter`)** làm nét hình ảnh và thay đổi ma trận điểm ảnh.

---

## 3. Toàn Văn Master Prompt 10 Bước Phân Tích Video Ngắn & Viết Kịch Bản Review (`doc_1.txt`)

Toàn bộ nội dung **Master Prompt** trong tài liệu Google Docs *"Phân tích shorts"* của giảng viên (đã lưu tại [master_prompt.md](/assets/docs-dgmd/VIDEO-dd1345/master_prompt.md) và [doc_1.txt](/assets/docs-dgmd/VIDEO-dd1345/doc_1.txt)) như sau:

```text
MASTER PROMPT - AI CHUYÊN GIA PHÂN TÍCH VIDEO NGẮN & VIẾT KỊCH BẢN REVIEW HÀI HƯỚC

Bạn là một chuyên gia phân tích nội dung video ngắn trên các nền tảng như:
- TikTok
- Douyin
- YouTube Shorts
- Facebook Reels

Đồng thời bạn cũng là:
- Biên kịch nội dung triệu view
- Chuyên gia dịch thuật đa ngôn ngữ
- Chuyên gia bắt trend mạng xã hội Việt Nam
- Chuyên gia viết kịch bản lồng tiếng khớp thời lượng video

Nhiệm vụ của bạn là phân tích toàn bộ video được cung cấp và tạo kịch bản thuyết minh hài hước nhưng phải khớp chính xác với thời lượng của video gốc.

==================================================

QUY TRÌNH PHÂN TÍCH VIDEO

BƯỚC 1: PHÂN TÍCH TỔNG QUAN VIDEO
Hãy mô tả chi tiết:
- Thời lượng video (bao nhiêu giây)
- Bối cảnh trong video
- Nhân vật xuất hiện
- Nội dung chính của video
- Điểm gây chú ý hoặc yếu tố bất ngờ
- Cảm xúc chính của video (hài hước, bất ngờ, cảm động, kịch tính...)

--------------------------------------------------

BƯỚC 2: PHÂN TÍCH DIỄN BIẾN VIDEO THEO TIMELINE
Chia video thành từng đoạn nhỏ theo mốc thời gian:
Ví dụ:
- 00:00 - 00:03
- 00:03 - 00:06
- 00:06 - 00:10
- 00:10 - kết thúc

Ở mỗi mốc thời gian hãy mô tả:
- Hành động của nhân vật
- Biểu cảm đáng chú ý
- Tình huống quan trọng
- Chi tiết gây cười hoặc cao trào

--------------------------------------------------

BƯỚC 3: NHẬN DIỆN 100% LỜI THOẠI TRONG VIDEO
Hãy ghi lại đầy đủ:
- Tất cả câu nói của nhân vật
- Giọng thuyết minh trong video (nếu có)
- Chữ phụ đề xuất hiện trên màn hình

Yêu cầu:
- Không bỏ sót câu nào
- Ghi theo đúng thứ tự thời gian

--------------------------------------------------

BƯỚC 4: DỊCH LỜI THOẠI SANG TIẾNG VIỆT
Dịch toàn bộ lời thoại sang tiếng Việt theo 2 cách:
1. Dịch sát nghĩa (Hiểu đúng 100% nội dung gốc)
2. Dịch tự nhiên theo văn phong mạng xã hội Việt Nam (Câu từ ngắn gọn, tự nhiên, dễ nghe khi lồng tiếng).

--------------------------------------------------

BƯỚC 5: GIẢI THÍCH NGỮ CẢNH & MEME (NẾU CÓ)
Nếu video có tiếng lóng, meme Trung Quốc / quốc tế, văn hóa địa phương, trò đùa ẩn ý -> Hãy giải thích ngắn gọn để người Việt hiểu được vì sao tình huống đó gây cười.

--------------------------------------------------

BƯỚC 6: VIẾT KỊCH BẢN REVIEW HÀI HƯỚC
Viết lại nội dung video thành kịch bản thuyết minh tiếng Việt theo phong cách: hài hước, duyên dáng, hơi cà khịa nhẹ, bắt trend TikTok / Shorts, câu từ ngắn gọn dễ đọc voice.
Cấu trúc kịch bản:
1. Câu mở đầu gây tò mò trong 2-3 giây đầu
2. Dẫn dắt tình huống theo diễn biến video
3. Nhấn mạnh khoảnh khắc bất ngờ / gây cười
4. Kết thúc bằng một câu bình luận hài hước hoặc câu hỏi tăng tương tác.

--------------------------------------------------

BƯỚC 7: ĐỒNG BỘ THỜI LƯỢNG VOICE VỚI VIDEO (QUAN TRỌNG)
Kịch bản thuyết minh phải khớp với thời lượng thật của video.
Quy tắc tính tốc độ đọc tiếng Việt:
- Tốc độ đọc tự nhiên: khoảng 2.5 - 3 từ / 1 giây
Ví dụ:
- Video 10 giây -> kịch bản khoảng 25 - 30 từ
- Video 15 giây -> kịch bản khoảng 38 - 45 từ
- Video 20 giây -> kịch bản khoảng 50 - 60 từ
- Video 30 giây -> kịch bản khoảng 75 - 90 từ
- Video 60 giây -> kịch bản khoảng 150 - 180 từ

--------------------------------------------------

BƯỚC 8: CHIA KỊCH BẢN THEO TIMELINE ĐỂ DỄ LỒNG TIẾNG
Trình bày kịch bản theo dạng:
- [00:00 - 00:03] Nội dung câu đọc khớp cảnh mở đầu (số từ: ...)
- [00:03 - 00:07] Nội dung câu đọc khớp diễn biến tiếp theo (số từ: ...)
- [00:07 - 00:12] Nội dung câu đọc khớp đoạn cao trào (số từ: ...)
- [00:12 - Hết] Câu chốt hài hước (số từ: ...)

--------------------------------------------------

BƯỚC 9: TẠO 3 PHIÊN BẢN KỊCH BẢN
1. Phiên bản hài hước giải trí
2. Phiên bản cà khịa mạng xã hội
3. Phiên bản kể chuyện cuốn hút

--------------------------------------------------

BƯỚC 10: KIỂM TRA ĐỘ KHỚP THỜI LƯỢNG
- Thời lượng video gốc: ... giây
- Tổng số từ của kịch bản: ... từ
- Thời lượng đọc ước tính: ... giây
- Độ khớp với video: (Chuẩn / Cần rút gọn / Cần thêm từ)
```

---

## 4. Case Study Thực Chiến Trên Màn Hình: Video Mèo Béo Đốt Pháo & Chó Poodle (`15 Giây`)

Tại mốc `01:11 – 06:45`, giảng viên thực hành trực tiếp từ khâu tìm video trên Douyin đến khi xuất thành phẩm trên CapCut PC:

### 4.1. Tìm kiếm trên Douyin bằng từ khóa tiếng Trung (`01:11` – `02:34`)
- Mở **Google Dịch**, gõ cụm từ `động vật hài hước` và dịch sang tiếng Trung (`搞笑笑到肚子疼视频`).
- Dán từ khóa tiếng Trung vào ô tìm kiếm của **Douyin**, chọn video chú mèo béo màu vàng châm pháo rồi cùng chú chó Poodle màu nâu lấy chiếc chậu inox úp lên quả pháo (video đạt **`7.7万` = `77.000 lượt thả tim`**, `4.165 bình luận`, `73.000 lượt chia sẻ`).
- Nhấn vào mũi tên chia sẻ -> sao chép đường link -> dán vào trang web **Tải video Douyin (`Snaptik Douyin`)** để tải file `.mp4` dài **15 giây** không logo về máy.

### 4.2. Tải trực tiếp file `.mp4` lên Google Gemini để lấy kịch bản (`02:35` – `03:07`)
Sau khi gửi Master Prompt cho **Google Gemini**, giảng viên nhấn biểu tượng dấu cộng (`+`) tải thẳng file video `15 giây` vừa tải từ Douyin lên Gemini. Chỉ sau vài giây, Gemini nhận diện chính xác từng khung hình và xuất ra 3 kịch bản (`~42 từ`, khớp chuẩn `13.5s / 15s` với độ khớp **98%**):

| Mốc Timeline | Kịch bản Phiên bản 1 (Cà khịa hài hước — Dùng lồng tiếng trong video) | Kịch bản Phiên bản 3 (Kể chuyện cuốn hút — Hiển thị trên màn hình) |
| :--- | :--- | :--- |
| **`00:00 - 00:04`** | *"Đầu năm đầu tháng, hai thanh niên báo thủ rủ nhau chơi lớn xem thiên hạ có trầm trồ."* | *"Một ngày rảnh rỗi, mèo béo đốt pháo rồi cùng chó Poodle lấy chậu úp lại."* |
| **`00:04 - 00:08`** | *"Nghe lời xúi dại của 'Hoàng thượng', chú chó ngây thơ liền đi kiểm tra hiện trường."* | *"Tưởng pháo đã xịt, chú chó tò mò chạy ra hóng chuyện mà không biết nguy hiểm."* |
| **`00:08 - 00:12`** | *"Bùm! Đúng là không cái dại nào bằng cái dại nghe lời kẻ thích ăn vụng."* | *"Chiếc chậu bất ngờ bay vút lên trời, để lại bài học nhớ đời cho kẻ cả tin."* |

*(Lưu ý: 3 giây cuối từ `00:12 - 00:15` được Gemini chủ động chừa trống lời đọc để giữ tiếng nổ "Bùm!" của chiếc chậu bay lên trời và hiệu ứng âm thanh gây cười).*

---

## 5. Quy Trình Thực Thi 6 Bước Chuẩn (SOP)

1. **Bước 1 — Thiết lập Trợ lý Biên kịch trên Google Gemini:** Mở tài liệu `Master Prompt` (`doc_1.txt` / `master_prompt.md`), sao chép toàn bộ quy trình 10 bước gửi vào **Google Gemini** để AI ghi nhớ vai trò.
2. **Bước 2 — Săn video nguồn Douyin bằng Google Dịch:** Dùng **Google Dịch** chuyển từ khóa chủ đề (*động vật hài hước*, *ăn uống*, *giải trí*, *gia đình*...) sang tiếng Trung, dán vào **Douyin**, chọn video có tương tác cao và tải file `.mp4` không logo qua trang tải video Douyin.
3. **Bước 3 — Tải file video trực tiếp lên Gemini:** Trong cuộc trò chuyện Gemini đã nạp sẵn Master Prompt, nhấn tải tệp `.mp4` vừa tải từ Douyin lên. Gemini sẽ phân tích toàn bộ video và trả về 3 kịch bản thuyết minh chia sẵn theo từng mốc giây (`0–4s`, `4–8s`, `8–12s`).
4. **Bước 4 — Lồng tiếng AI theo từng mốc giây trên CapCut PC:**
   - Mở **CapCut PC**, tạo dự án mới và đưa video Douyin vào timeline.
   - Lần lượt sao chép từng câu thoại ở mốc `00:00-00:04`, `00:04-00:08`, `00:08-00:12` từ Gemini dán vào công cụ **`Văn bản` -> `Chuyển văn bản thành lời nói` -> `Tiếng Việt` -> chọn giọng `Cô Gái Hoạt Ngôn`**.
5. **Bước 5 — Chỉnh tốc độ Voice `1.2x` & Thay đổi độ cao âm thanh:**
   - Chọn các đoạn audio giọng đọc vừa tạo trên timeline -> vào tab **`Tốc độ` (`Speed`)** chỉnh lên **`1.2x`**.
   - Tích chọn bật **`Thay đổi âm thanh độ cao`** (`Pitch`) và đặt đúng vị trí tương ứng với mốc giây `0s`, `4s`, `8s` trên timeline.
6. **Bước 6 — Tạo Phụ đề tự động, Đổi mẫu chữ & Phủ Bộ lọc `4K`:**
   - Vào **`Văn bản` -> `Phụ đề tự động`** (chọn Tiếng Việt) để sinh phụ đề chạy theo giọng đọc.
   - Bôi đen toàn bộ phụ đề -> vào **`Mẫu văn bản`** chọn kiểu chữ nổi bật, đổi phông chữ đậm dễ đọc và kéo vị trí chữ lên trên hoặc xuống sát đáy màn hình để **không che mất quả pháo và cái chậu**.
   - Vào mục **`Bộ lọc` (`Filters`)** -> chọn bộ lọc **`4K`** kéo phủ kín từ đầu đến cuối video rồi nhấn **`Xuất` (`Export`)**.

---

## 6. Mốc Thời Gian Trọng Yếu Đã Đối Soát (`key_timestamps`)

| Mốc Thời Gian | Giây (`seconds`) | Nội dung chi tiết trên màn hình & lời giảng |
| :--- | :--- | :--- |
| **`00:00`** | `0s` | Phân tích 2 kênh mẫu làm Shorts từ nguồn Douyin: *Triệu Que Củi* (`@TrieuNe05` - 391M views) và *Đảo Chiều* (`@daochieu037` - 1,17M sub) |
| **`00:27`** | `27s` | Giới thiệu bộ 3 công cụ cốt lõi (Gemini, Douyin, CapCut Pro) và tài liệu Master Prompt phân tích video ngắn |
| **`00:59`** | `59s` | Sao chép toàn bộ Master Prompt 10 bước gửi lên Google Gemini để thiết lập trợ lý phân tích và viết kịch bản |
| **`01:11`** | `71s` | Dùng Google Dịch chuyển từ khóa chủ đề (`động vật hài hước`, `ăn uống`, `giải trí`, `gia đình`) sang tiếng Trung |
| **`01:32`** | `92s` | Dán từ khóa tiếng Trung tìm video trên Douyin (mèo béo đốt pháo úp chậu cùng chó Poodle) và tải video không logo |
| **`02:35`** | `155s` | Tải trực tiếp file video 15 giây lên Google Gemini để tự động phân tích và nhận 3 kịch bản review chia theo timeline |
| **`03:08`** | `188s` | Đưa video vào CapCut PC, tạo giọng đọc Tiếng Việt `Cô gái hoạt ngôn`, tăng tốc độ `1.2x` và bật `Thay đổi âm thanh độ cao` |
| **`05:08`** | `308s` | Tạo `Phụ đề tự động` tiếng Việt, chọn mẫu chữ nổi bật và căn vị trí tránh che mất quả pháo trong khung hình |
| **`06:03`** | `363s` | Thêm bộ lọc màu `4K` phủ toàn bộ timeline và xuất file MP4 hoàn chỉnh đăng lên kênh YouTube Shorts |

---

## 7. Các Lưu Ý Quan Trọng Cần Tránh (`avoid_flags`)

1. **Không dùng video còn dính logo/ID tài khoản Douyin gốc;** bắt buộc phải tải qua công cụ xóa watermark trước khi đưa vào CapCut PC.
2. **Không tự viết kịch bản cảm tính quá dài hoặc quá ngắn gây lệch hình;** luôn tải file video lên để Gemini tự tính toán theo chuẩn `2.5 - 3 từ/giây` khớp đúng từng mốc timeline (`0–4s`, `4–8s`, `8–12s`).
3. **Không để nguyên tốc độ giọng đọc AI `1.0x` mặc định;** luôn tăng tốc độ giọng `Cô gái hoạt ngôn` lên **`1.2x`** và bật **`Thay đổi âm thanh độ cao`** để nhịp video cuốn hút như các kênh triệu view.
4. **Không đặt phụ đề tự động nằm đè lên vật thể chính hoặc chi tiết gây cười ở giữa màn hình** (như quả pháo, cái chậu hay biểu cảm của thú cưng).

---

## 8. Tài Liệu & Hồ Sơ Đính Kèm Trong Bài Học

- **Master Prompt Phân Tích Video Ngắn & Kịch Bản Mẫu (Markdown):** [assets/docs-dgmd/VIDEO-dd1345/master_prompt.md](/assets/docs-dgmd/VIDEO-dd1345/master_prompt.md)
- **Tài Liệu Gốc Google Docs (TXT):** [assets/docs-dgmd/VIDEO-dd1345/doc_1.txt](/assets/docs-dgmd/VIDEO-dd1345/doc_1.txt) · [assets/docs-dgmd/VIDEO-dd1345/master_prompt.txt](/assets/docs-dgmd/VIDEO-dd1345/master_prompt.txt)
- **Hồ Sơ Phân Tích Chuẩn Hóa (Insight JSON):** [video/VIDEO-dd1345/insight.json](/video/VIDEO-dd1345/insight.json)
- **Bản Ghi Phụ Đề Đã Chuẩn Hóa Chính Tả:** [video/VIDEO-dd1345/transcript.json](/video/VIDEO-dd1345/transcript.json) · [video/VIDEO-dd1345/transcript.srt](/video/VIDEO-dd1345/transcript.srt) · [video/VIDEO-dd1345/transcript.txt](/video/VIDEO-dd1345/transcript.txt)
