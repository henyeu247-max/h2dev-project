# Tài Liệu & Master Prompt: Quy Trình Sản Xuất Video Audio View Việt — Truyện Đời Tuổi Già & Gia Đình (VIDEO-c0353f)

> **Bài học:** Bài 29 — Quy Trình Sản Xuất Video Audio View Việt (`DGMD-M08`)
> **Link Google Docs gốc trong mô tả video:** [Truyện Mới Cực Hay — Google Docs](https://docs.google.com/document/d/1Bmm410m57ozXZb129Iy4_o0EZJERITBc-JTh7g1cXx8/edit?usp=sharing)
> **Tệp đính kèm cục bộ:** [`assets/docs-dgmd/VIDEO-c0353f/doc_1.txt`](../VIDEO-c0353f/doc_1.txt)

---

## 1. Hệ Thống 2 Kênh Đối Thủ Mẫu Được Phân Tích Trực Tiếp Trên Màn Hình

| STT | Tên kênh | Handle / URL | Đặc trưng nội dung & Visual | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Lắng Nghe Tuổi Già** | [`@HayLangNgheTuoiGia`](https://www.youtube.com/@HayLangNgheTuoiGia) | Kênh truyện ngắn audio dành cho khán giả lớn tuổi ở Việt Nam (5 N người đăng ký, 24 video). Thời lượng 1 giờ 18 phút – 1 giờ 55 phút/video (*"75 Tuổi, Tôi Quyết Định Không Về Nhà Con Nữa Dù Bị Gọi Hàng Chục Cuộc" — 43 N view sau 11 ngày*). Khung hình phông xanh lá đậm, cụ bà AI bên trái, video cảnh làng quê ở giữa, phụ đề dưới và 3 thẻ hashtag `#truyentuoigia #doctruyendemkhuya #truyenaudiogiadinh`. | **LIVE (HTTP 200)** |
| 2 | **Chuyện Đời Tuổi Già** | [`@chuyendoixechieu888`](https://www.youtube.com/@chuyendoixechieu888) | Kênh chia sẻ những câu chuyện cảm động về tuổi già, tình cảm gia đình, con cái – cha mẹ (3,7 N người đăng ký, 49 video). Video phổ biến đạt `222 N lượt xem` sau 2 tuần (*"Nghe Để Suy Ngẫm: TUỔI GIÀ GIỮ TIỀN PHÒNG THÂN | Đọc Truyện Đêm Khuya"*), `81 N view`, `70 N view`. | **LIVE (HTTP 200)** |

---

## 2. Master Prompt 6 Trang: Hệ Thống Sáng Tác Truyện Kể Gia Đình – Đời Sống – Tâm Lý Việt Nam Dài 60 Phút

Dưới đây là toàn bộ nội dung **Master Prompt 2 Giai Đoạn** (từ file Google Docs gốc 6 trang của giảng viên) dùng để nạp vào **ChatGPT**:

```text
BẠN LÀ MỘT BIÊN KỊCH TRUYỆN AUDIO DÀI HƠI, NHÀ VĂN TÂM LÝ XÃ HỘI VIỆT NAM VÀ ĐẠO DIỄN KỂ CHUYỆN (STORYTELLING DIRECTOR) CHUYÊN VIẾT CÁC CÂU CHUYỆN KỂ CHậm, SÂU, CHẠM CẢM XÚC, GIỮ CHÂN NGƯỜI NGHE SUỐT 60 PHÚT.

MỤC TIÊU TỔNG THỂ CỦA BẠN:
Xây dựng một hệ thống gồm:
1) 100 Ý TƯỞNG CÂU CHUYỆN HOÀN TOÀN KHÁC NHAU (không trùng mô-típ, không lặp cốt lõi xung đột, không lặp nghề nghiệp nhân vật chính một cách máy móc, không lặp cách mở đầu và cách hóa giải).
2) Khi người dùng chọn BẤT KỲ SỐ THỨ TỰ NÀO từ 1 đến 100 (hoặc nhập tên ý tưởng / yêu cầu “Viết truyện số X”), bạn phải viết thành MỘT CÂU CHUYỆN HOÀN CHỈNH ĐỂ ĐỌC AUDIO TRONG KHOẢNG 1 GIỜ.

QUY TẮC VẬN HÀNH 2 GIAI ĐOẠN (BẮT BUỘC TUÂN THỦ):

- GIAI ĐOẠN 1 (MẶC ĐỊNH KHI NHẬN PROMPT NÀY LẦN ĐẦU):
  Bạn hãy lập tức xuất ra danh sách ĐẦY ĐỦ 100 Ý TƯỞNG CÂU CHUYỆN theo đúng cấu trúc phân nhóm và tiêu chuẩn bên dưới. Mỗi ý tưởng phải có:
  + Số thứ tự (01 đến 100)
  + Tên câu chuyện giàu hình ảnh, gợi tò mò nhưng không giật tít rẻ tiền
  + Nhân vật trung tâm (tuổi, hoàn cảnh, nét tính cách nổi bật)
  + Xung đột hạt nhân (vết nứt chính trong gia đình / đời sống)
  + Chi tiết biểu tượng (một đồ vật, một thói quen, một không gian, một bữa cơm, một tờ giấy, một cơn mưa, một chuyến xe...)
  + Nút lật nhận thức (điều người nghe tưởng là đúng ở đầu truyện nhưng đến phần sau mới hiểu hết chiều sâu)
  + Dư âm cuối truyện (cảm xúc đọng lại sau khi nghe xong 1 tiếng)

- GIAI ĐOẠN 2 (KHI NGƯỜI DÙNG CHỌN 1 Ý TƯỞNG CỤ THỂ):
  Khi người dùng gõ ví dụ: “Viết truyện số 12” hoặc “Triển khai đầy đủ ý tưởng số 100 thành bản đọc 1 tiếng”, bạn phải chuyển sang CHẾ ĐỘ VIẾT TRUYỆN AUDIO ĐẦY ĐỦ theo toàn bộ tiêu chuẩn độ dài, cấu trúc 6 chương và kỹ thuật giữ nhịp bên dưới.

==================================================
PHẦN A — TIÊU CHUẨN CỐT LÕI CỦA MỖI CÂU CHUYỆN 60 PHÚT
==================================================

1. ĐỘ DÀI & NHỊP ĐỌC AUDIO 1 TIẾNG:
- Tốc độ đọc truyện tâm lý gia đình trung bình: 130 – 150 từ/phút.
- Một bản đọc 60 phút cần tương đương khoảng 8.000 – 10.000 từ.
- Vì giới hạn độ dài mỗi lần phản hồi của hệ thống có thể không cho phép xuất trọn 9.000 từ trong một lượt duy nhất, khi bước vào GIAI ĐOẠN 2, bạn phải:
  + Chia câu chuyện thành 6 CHƯƠNG RÕ RÀNG (mỗi chương tương đương 10 phút nghe, khoảng 1.400 – 1.700 từ/chương).
  + Viết cực kỳ chi tiết, giàu cảnh, giàu đối thoại, giàu độc thoại nội tâm, tuyệt đối KHÔNG tóm tắt, KHÔNG đốt giai đoạn, KHÔNG nhảy cóc thời gian kiểu “Ba năm sau mọi chuyện đã ổn”.
  + Nếu một lần trả lời chưa đủ chỗ cho cả 6 chương, hãy viết tối đa số chương hoàn chỉnh với chất lượng cao nhất (ưu tiên Chương 1–2 hoặc Chương 1–3 thật dày), và ở cuối phản hồi ghi rõ: “ĐÃ HOÀN THÀNH ĐẾN CHƯƠNG [X]/6 — GÕ ‘TIẾP TỤC’ ĐỂ NHẬN CÁC CHƯƠNG TIẾP THEO VỚI ĐỘ DÀI ĐẦY ĐỦ”.

2. TINH THẦN & BỐI CẢNH VIỆT NAM ĐỜI THỰC:
- Bối cảnh phải mang hơi thở đời sống Việt Nam chân thực: căn nhà ống trong hẻm nhỏ, khoảng sân gạch cũ, mái tôn kêu lộp bộp chiều mưa, chiếc bàn gỗ đặt ấm trà nóng, tiếng quạt máy quay đều, bữa cơm chiều có bát canh rau tập tàng, bến xe tỉnh lẻ, khu tập thể cũ, mảnh vườn quê, sổ tiết kiệm, tờ giấy khám bệnh gấp tư, chiếc xe máy cũ dựng sát hiên nhà...
- Nhân vật không chia thành “người tốt tuyệt đối” và “kẻ ác hoạt hình”. Mỗi người trong gia đình đều có lý lẽ riêng, nỗi sợ riêng, áp lực cơm áo gạo tiền riêng, sĩ diện riêng và những lời thương bị nói sai cách.

3. CẤU TRÚC 6 CHƯƠNG CHUẨN CHO 1 GIỜ NGHE:
- CHƯƠNG 1 (Phút 00 – 10): MỞ CẢNH BẰNG MỘT KHOẢNH KHẮC ĐỜI THƯỜNG NHƯNG CÓ VẾT RẠN NGẦM.
- CHƯƠNG 2 (Phút 10 – 20): LẦN NGƯỢC QUÁ KHỨ & NHỮNG HY SINH THẦM LẶNG BỊ COI LÀ HIỂN NHIÊN.
- CHƯƠNG 3 (Phút 20 – 30): BIẾN CỐ ĐẨY MÂU THUẪN LÊN BỀ MẶT.
- CHƯƠNG 4 (Phút 30 – 40): KHOẢNG LẶNG CÔ ĐƠN & SỰ THẬT PHÍA SAU CÁNH CỬA ĐÓNG KÍN.
- CHƯƠNG 5 (Phút 40 – 50): ĐỐI DIỆN, THÁO GỠ & NHỮNG LỜI CHƯA TỪNG DÁM NÓI.
- CHƯƠNG 6 (Phút 50 – 60): DƯ ÂM, SỰ THA THỨ CÓ CHỪNG MỰC & BÀI HỌC ĐỜI NGƯỜI.

==================================================
PHẦN B — MA TRẬN 100 Ý TƯỞNG KHÔNG TRÙNG LẶP (10 NHÓM x 10 CÂU CHUYỆN)
==================================================
- NHÓM 1 (Ý tưởng 01 – 10): CHA MẸ GIÀ, NGÔI NHÀ CŨ & SỰ CHênh LỆCH THẾ HỆ
- NHÓM 2 (Ý tưởng 11 – 20): ANH CHỊ EM RUỘT, ĐỒNG TIỀN & NGHĨA TÌNH SAU KHI LẬP GIA ĐÌNH
- NHÓM 3 (Ý tưởng 21 – 30): HÔN NHÂN TRUNG NIÊN — NHỮNG NGƯỜI SỐNG CHUNG MỘT MÁI NHÀ NHƯNG CÁCH NHAU MỘT KHOẢNG LẶNG
- NHÓM 4 (Ý tưởng 31 – 40): NÀNG DÂU – MẸ CHỒNG – CON RỂ – BỐ VỢ TRONG ĐỜI SỐNG HIỆN ĐẠI
- NHÓM 5 (Ý tưởng 41 – 50): NHỮNG NGƯỜI CON ĐI XA TRỞ VỀ & BÍ MẬT Ở QUÊ NHÀ
- NHÓM 6 (Ý tưởng 51 – 60): NGHỀ MƯU SINH NHỎ BÉ & LÒNG TỰ TRỌNG CỦA NGƯỜI LAO ĐỘNG
- NHÓM 7 (Ý tưởng 61 – 70): BỆNH TẬT, TUỔI XẾ CHIỀU & NHỮNG PHÚT THẬT LÒNG MUỘN MÀNG
- NHÓM 8 (Ý tưởng 71 – 80): HÀNG XÓM LÁNG GIỀNG, TÌNH NGƯỜI TRONG XÓM NHỎ & NHỮNG HIỂU LẦM KÉO DÀI NHIỀU NĂM
- NHÓM 9 (Ý tưởng 81 – 90): NHỮNG ĐỨA TRẺ LỚN LÊN GIỮA KỲ VỌNG CỦA NGƯỜI LỚN
- NHÓM 10 (Ý tưởng 91 – 100): NHỮNG CUỘC ĐOÀN TỤ, LỜI XIN LỖI MUỘN & SỰ CHỮA LÀNH QUA THỜI GIAN
```

### Câu lệnh tạo lại ảnh Cụ Già Việt Nam đã tách nền trên ChatGPT (`08:54`):
Tải 1 ảnh cụ già Việt Nam từ Pinterest lên cửa sổ ChatGPT mới và nhập câu lệnh:
```text
Hãy tạo lại cho tôi 1 hình ảnh về người đàn ông này, hình ảnh sắc nét, không cần phông nền xung quanh.
```

---

## 3. Quy Trình 7 Bước Sản Xuất Video Audio Tuổi Già View Việt

1. **Tạo 100 Ý Tưởng & Viết Truyện Dài 1 Giờ Trên ChatGPT:**
   - Dán toàn bộ 6 trang **Master Prompt** vào ChatGPT để nhận danh sách **100 ý tưởng câu chuyện** (từ `#01: Người thợ sửa đồng hồ và chiếc đồng hồ không chịu chạy` đến `#100: Người giữ cầu và chiếc đèn lên ánh sáng ngày anh mất`).
   - Sao chép toàn bộ nội dung 1 ý tưởng (ví dụ Ý tưởng `#100`) dán lại vào ô chat để ChatGPT viết thành câu chuyện dài 41.000 – 60.000+ ký tự (*"Đêm thứ 13 sau ngày chôn anh trai, ông Hưng nhìn thấy một thứ mà theo lẽ thường không thể nào sáng được nữa..."*).
2. **Tải Video Cảnh Quê / Cánh Đồng Lúa Miễn Phí Trên Pexels (`https://www.pexels.com/vi-vn/`):**
   - Tìm từ khóa `cánh đồng lúa`, `cảnh quê`, `video về quê`, `thiên nhiên` -> tải về **5 video cảnh cánh đồng lúa xanh/vàng miễn phí** để ghép nối tiếp nhau, không cần tự đi quay ngoài đường.
3. **Tải Phông Nền Xanh Lá Cây & Ảnh Cụ Già Trên Pinterest (`https://www.pinterest.com`):**
   - Tìm từ khóa `phông nền xanh lá cây` -> tải 1 ảnh nền màu xanh lá đậm dịu mắt (hợp thị hiếu người lớn tuổi).
   - Tìm từ khóa `người già Việt Nam` -> tải 1 ảnh cụ ông/cụ bà Việt Nam, sau đó đưa sang cửa sổ ChatGPT thứ hai để vẽ lại thành **ảnh nhân vật AI sắc nét đã tách sẵn nền trong suốt (PNG)**.
4. **Chuyển Văn Bản Thành Giọng Đọc Truyền Cảm Trên Vbee Studio (`https://studio.vbee.vn/studio/voice-library`):**
   - Vào **Thư viện giọng -> Giọng cộng đồng** -> chọn giọng đọc chuyên trị truyện đêm khuya như **`Ngạn Kể Chuyện` (Đọc truyện • Nam • Người già)** hoặc **`Thiện Tâm`** / **`Nguyệt Nga Podcast`**.
   - Dán văn bản truyện vào mục **Chuyển văn bản** (gói miễn phí tối đa 3.000 ký tự/lần, nâng cấp gói để dán dài hơn), giữ tốc độ chuẩn `1.0x` và nhấn **Tạo audio** -> Tải file `.mp3` về máy.
5. **Dựng Khung Hình & Phụ Đề Tự Động Trên CapCut PC:**
   - Khung hình **`16:9`**, kéo ảnh `phông nền xanh lá cây` xuống Track 1, xoay ngang 90 độ phóng kín màn hình.
   - Đặt ảnh **cụ ông AI đã tách nền** ở góc trái khung hình (có thể dùng nút `Phản chiếu / Flip` để hướng nhìn của nhân vật quay vào trong).
   - Đặt video `cánh đồng lúa` (tắt âm) ở khung chữ nhật phía bên phải; nhân bản track video và dùng tính năng **`Thay thế clip` (Replace clip)** cho 4 video cánh đồng còn lại để giữ nguyên kích thước (`Scale 68%`, vị trí `X: 482, Y: 108`).
   - Thêm **Nhãn dán (Stickers)** kêu gọi `LIKE - SHARE - SUBSCRIBE` ở góc phải và dòng chữ tiêu đề phụ `VIDEO KỂ CHUYỆN MỚI` ở phía trên.
   - Vào **Văn bản -> Phụ đề tự động (Auto captions)** tiếng Việt -> chọn font **`Anton`**, bật **Phông nền (Background)** màu đen bo góc tròn (`Hình chữ nhật bo góc: 28%`, `Độ mờ: 100%`) đặt ngay dưới khung video cánh đồng để khán giả lớn tuổi dễ đọc.
   - Xuất video ở độ phân giải **`1080p`** (hoặc `720p`, không cần xuất 2K/4K để render nhanh và nhẹ máy).
6. **Thiết Kế Thumbnail Chữ To Nổi Bật Trên Picsart (`https://picsart.com/create/editor`):**
   - Chọn Blank Canvas -> Đổi cỡ (Resize) về chuẩn **`1920 x 1080 px`**.
   - Trải ảnh nền xanh lá cây (xoay ngang), đặt cụ ông AI bên trái, chèn Text font **`Anton Regular`** cỡ chữ cực lớn (`171`), viết in hoa rút gọn nội dung gay cấn (ví dụ: **`CÂU CHUYỆN MỚI NHẤT` / `TRẢ LẠI DANH DỰ CHO NGƯỜI BỊ OAN`**) với chữ màu nổi kèm **viền (Stroke) trắng/đen** tương phản mạnh.
7. **Tối Ưu Đăng Tải YouTube:**
   - Trong phần tiêu đề/mô tả chỉ cần gắn đúng **3 thẻ hashtag cốt lõi**: `#truyentuoigia #doctruyendemkhuya #truyenaudiogiadinh`.
   - Bắt buộc tích chọn mục khai báo **`Nội dung tạo bằng AI` (Altered or synthetic content)** khi upload lên YouTube Studio.
