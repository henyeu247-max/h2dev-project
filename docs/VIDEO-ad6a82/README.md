# Các Góc Quay Khi Đặt Câu Prompt

> **SKU:** `VIDEO-ad6a82` · **Bài học:** Bài 43/45 (Module `DGMD-M10` — Đại Gia Mang Dép Academy)  
> **Thời lượng:** `06:02` (`362.18s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Prompt Engineering & Visual AI` · **Thị trường:** `🇻🇳 Việt Nam & 🇺🇸 Toàn Cầu (US / Quốc Tế)`  
> **Tài liệu thực chiến:** [`assets/docs-dgmd/VIDEO-ad6a82/master_prompt.md`](../../assets/docs-dgmd/VIDEO-ad6a82/master_prompt.md) · **Bản ghi phụ đề:** [`video/VIDEO-ad6a82/transcript.txt`](../../video/VIDEO-ad6a82/transcript.txt)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng giải quyết triệt để căn bệnh cố hữu của người mới làm video AI — để cả 10 phân cảnh cùng 1 góc máy ngang toàn thân gây nhàm chán — thông qua bộ tài liệu trực quan **`Offline Thực Chiến.pdf` (`CÁC GÓC QUAY KHI ĐẶT CÂU PROMPT` gồm 14 góc máy điện ảnh chuẩn)** và hướng dẫn thực hành trực tiếp kỹ thuật **Image-to-Image khóa nhân vật đổi góc quay** trên công cụ **`Grok Imagine` (`grok.com/imagine`)** kết hợp **`Google Flow`**. Từ 1 bức ảnh gốc toàn thân của nhân vật `Donald Trump`, giảng viên thực hành biến đổi sang **Góc nhìn trung cảnh**, **Góc nhìn qua vai** và **Góc nhìn từ trên cao** (kèm kỹ thuật điều hướng thu nhỏ tỷ lệ nhân vật giữ nguyên bối cảnh khu quân sự ở tỷ lệ `16:9`).

---

## 2. Bảng tổng hợp 14 Góc Quay Điện Ảnh từ Tài liệu `Offline Thực Chiến.pdf` (Visual Frame Evidence)

### 2.1. Bảng 14 Góc Quay Chuẩn xuất hiện trực tiếp trên màn hình (`00:15 – 02:02`)

| STT | Trang PDF | Nhãn Góc Quay Gốc Trên Màn Hình | Thuật Ngữ Prompt Tiếng Anh | Mô Tả Khung Hình Minh Họa (Người Lính Mỹ Tại Căn Cứ Quân Sự Sa Mạc) | Mốc thời gian |
| :-: | :---: | :--- | :--- | :--- | :---: |
| 01 | Trang 1/2 | **`"Góc ngang – Toàn thân"`** | `Eye-level full body shot` | Camera đặt ngang tầm mắt, lấy trọn người lính từ đỉnh mũ sắt đến mũi giày đứng trên đường sỏi | `01:11` |
| 02 | Trang 1/2 | **`"Cận mặt"`** | `Close-up / Medium close-up` | Lấy từ ngực lên đỉnh mũ, thấy rõ kính đen, bảng tên `JOHNSON / U.S. ARMY` và biểu cảm gương mặt | `01:20` |
| 03 | Trang 1/2 | **`"Trung cảnh"`** | `Medium shot (Cowboy shot)` | Lấy từ phần đùi/thắt lưng trở lên, thấy rõ hai tay cầm súng trường và xe Humvee phía sau | `01:22` |
| 04 | Trang 1/2 | **`"Toàn cảnh"`** | `Wide shot (WS)` | Nhân vật đứng ở cự ly xa hơn giữa con đường rộng, bao quát doanh trại, lá cờ Mỹ và dãy núi | `01:25` |
| 05 | Trang 1/2 | **`"Góc thấp – Toàn thân"`** | `Low-angle full body shot` | Camera đặt sát mặt đất hất ngược lên toàn thân người lính, tạo vẻ uy nghi, cao lớn trên nền trời | `01:27` |
| 06 | Trang 1/2 | **`"Góc thấp – Cận mặt"`** | `Low-angle close-up shot` | Camera đặt sát mặt sỏi đối diện gương mặt người lính đang nằm bò chiến thuật | `01:36` |
| 07 | Trang 1/2 | **`"Góc thấp – Trung cảnh"`** | `Low-angle medium shot` | Camera hất từ dưới hông lên ngực và đầu người lính trên nền trời xanh rộng | `01:40` |
| 08 | Trang 1/2 | **`"Góc thấp – Toàn cảnh"`** | `Low-angle wide shot` | Góc rộng đặt sát đất lấy cả thảm sỏi tiền cảnh và toàn thân người lính đứng giữa căn cứ | `01:42` |
| 09 | Trang 2/2 | **`"Góc qua vai"`** | `Over-the-shoulder shot (OTS)` | Nhìn từ phía sau bờ vai phải và vành mũ sắt của người lính hướng thẳng theo nòng súng | `01:44` |
| 10 | Trang 2/2 | **`"Góc nhìn từ trên cao"`** | `High-angle / Top-down view` | Camera nhìn thẳng 90 độ từ trên trời xuống đỉnh đầu người lính đứng giữa con đường | `01:50` |
| 11 | Trang 2/2 | **`"Góc rộng"`** | `Extreme wide establishing shot` | Đại cảnh từ trên cao bao quát toàn bộ căn cứ quân sự, lều bạt, dàn xe và rặng núi; người lính rất nhỏ | `01:52` |
| 12 | Trang 2/2 | **`"GÓC 3/4"`** | `3/4 profile medium shot` | Người lính đứng xoay người góc 45 độ nhìn sang phải, tạo khối chiều sâu điện ảnh | `01:53` |
| 13 | Trang 2/2 | **`"GÓC NGHIÊNG"`** | `Dutch angle (Left tilt)` | Máy quay nghiêng chéo đường chân trời sang phải (nhân vật nghiêng sang phải), tạo cảm giác kịch tính | `01:55` |
| 14 | Trang 2/2 | **`"GÓC NGHIÊNG KHUNG"`** | `Dutch angle (Right tilt)` | Máy quay nghiêng chéo khung hình theo chiều ngược lại (nhân vật nghiêng sang trái) | `01:56` |

---

## 3. Bảng đối chiếu Thực hành 4 Câu Lệnh Prompt trên Grok Imagine (`02:15 – 05:35`)

Giảng viên sử dụng trực tiếp công cụ **`Grok Imagine` (`https://grok.com/imagine`)** ở chế độ **`Hình ảnh`**, tỷ lệ **`16:9`**, nạp **1 bức ảnh gốc toàn thân của `Donald Trump`** làm ảnh tham chiếu (`@ để tham chiếu hình ảnh`) và chạy 4 câu lệnh thực tế sau:

| Lượt test | Mục tiêu góc quay | Câu lệnh Prompt gõ trực tiếp trên màn hình Grok Imagine | Kết quả hình ảnh sinh ra trên màn hình | Mốc thời gian |
| :-: | :--- | :--- | :--- | :---: |
| **Test 1** | **Góc nhìn trung cảnh** (`Medium Shot`) | `hãy tạo cho tôi hình ảnh , nhân vật này đang đứng tại 1 khu quân sự , góc nhìn trung cảnh , hình ảnh sắc nét` | Ảnh `16:9` sắc nét: Donald Trump mặc vest xanh đen cà vạt đỏ cắt từ phần đùi trở lên, đứng trước dàn xe Humvee, xe tăng Abrams và tiêm kích | `02:45 – 03:38` |
| **Test 2** | **Góc nhìn qua vai** (`Over-the-shoulder`) | `hãy tạo cho tôi 1 hình ảnh , góc nhìn qua vai nhân vật này , bối cảnh khu quân sự hình ảnh sắc nét` | Ảnh `16:9`: Máy quay đặt sát sau vai trái và mái tóc vàng của Donald Trump nhìn ra dàn xe tăng và máy bay quân sự phía trước | `03:55 – 04:29` |
| **Test 3** | **Góc nhìn từ trên cao** (`High-Angle`) | `hãy tạo cho tôi 1 hình ảnh , góc nhìn từ trên cao , bối cảnh khu quân sự , hình ảnh sắc nét` | Ảnh `16:9`: Góc máy từ trên cao nhìn xuống Donald Trump đang bước đi giữa sân bay quân sự đầy lều bạt, xe Humvee và tiêm kích | `04:33 – 05:10` |
| **Test 4** | **Tinh chỉnh kích thước** (`Iterative Edit`) | `hãy tạo lại hình ảnh này cho tôi , nhân vật bé hơn , còn lại giữ nguyên chi tiết` | Giữ nguyên bối cảnh khu quân sự từ trên cao của Test 3 nhưng thu nhỏ kích thước nhân vật Donald Trump để khung hình rộng và hùng vĩ hơn | `05:12 – 05:30` |

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Sai lầm chết người khi làm video AI: Để cả 10 phân cảnh cùng 1 góc ngang toàn thân gây nhàm chán
- **`01:11`** — Nhóm 4 góc máy ngang cơ bản (`Offline Thực Chiến.pdf`): Góc ngang – Toàn thân, Cận mặt, Trung cảnh, Toàn cảnh
- **`01:27`** — Nhóm 4 góc máy thấp (Camera đặt dưới hướng lên): Góc thấp – Toàn thân, Cận mặt, Trung cảnh, Toàn cảnh
- **`01:44`** — Nhóm 6 góc máy điện ảnh nâng cao: Góc qua vai, Góc nhìn từ trên cao, Góc rộng, Góc 3/4, Góc nghiêng & Góc nghiêng khung
- **`02:15`** — Chuẩn bị ảnh gốc nhân vật Donald Trump và mở công cụ Grok Imagine (`grok.com/imagine`) tỷ lệ `16:9`
- **`02:45`** — Thực hành Prompt 1 trên Grok: Tạo ảnh nhân vật đứng tại khu quân sự với `góc nhìn trung cảnh`
- **`03:55`** — Thực hành Prompt 2 trên Grok: Tạo ảnh `góc nhìn qua vai nhân vật này` nhìn ra bối cảnh khu quân sự
- **`04:33`** — Thực hành Prompt 3 trên Grok: Tạo ảnh `góc nhìn từ trên cao` và câu lệnh sửa trực tiếp cho nhân vật bé hơn
- **`05:37`** — Tổng kết nguyên tắc cốt lõi: Bắt buộc tạo hình ảnh tĩnh chuẩn góc quay trước rồi mới đưa vào tạo video sau

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Khắc phục triệt để lỗi '10 cảnh 1 góc máy':** Rất nhiều người mới làm video AI chỉ để duy nhất 1 `Góc ngang – Toàn thân` xuyên suốt từ đầu đến cuối khiến khán giả chán và thoát video; bắt buộc phải đan xen *Cận mặt, Trung cảnh, Toàn cảnh, Qua vai, Trên cao*.
- **Nắm vững 14 góc quay chuẩn trong tài liệu `Offline Thực Chiến.pdf`:** Gồm 4 góc ngang (*Toàn thân, Cận mặt, Trung cảnh, Toàn cảnh*), 4 góc thấp hất từ dưới lên (*Góc thấp Toàn thân, Cận mặt, Trung cảnh, Toàn cảnh*), và 6 góc điện ảnh đặc biệt (*Góc qua vai, Góc nhìn từ trên cao, Góc rộng, Góc 3/4, Góc nghiêng, Góc nghiêng khung*).
- **Quy tắc bất di bất dịch 'Tạo Ảnh Trước – Tạo Video Sau':** Muốn kiểm soát chính xác góc quay của video AI, tuyệt đối không viết thẳng từ text ra video mà phải dùng `Grok Imagine` (`grok.com/imagine`) hoặc `Google Flow` tạo ra các bức ảnh tĩnh chuẩn góc quay trước.
- **Kỹ thuật biến đổi góc quay từ 1 bức ảnh nhân vật gốc (Image-to-Image):** Chỉ cần tải lên 1 bức ảnh gốc của nhân vật (như ảnh toàn thân Donald Trump), chọn tỷ lệ `16:9` trên `Grok Imagine` và truyền câu lệnh đổi sang `góc nhìn trung cảnh` hoặc `góc nhìn qua vai nhân vật này` tại bối cảnh khu quân sự.
- **Kỹ thuật điều hướng sửa lỗi kích thước nhân vật trực tiếp (Iterative Prompting):** Khi đặt câu lệnh `góc nhìn từ trên cao` nhưng AI vẫn vẽ nhân vật hơi to so với bối cảnh khu quân sự, chỉ cần gõ tiếp câu lệnh phụ `hãy tạo lại hình ảnh này cho tôi , nhân vật bé hơn , còn lại giữ nguyên chi tiết` để thu nhỏ tỷ lệ nhân vật đúng ý đồ đạo diễn.

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Thiết Kế Hệ Thống Góc Quay Điện Ảnh Bằng Grok Imagine & Google Flow

1. **Phân bổ 14 góc quay theo kịch bản:** Tra cứu bảng 14 góc quay chuẩn trong tài liệu `Offline Thực Chiến.pdf` để phân bổ góc máy đa dạng (*Toàn cảnh, Trung cảnh, Cận mặt, Góc thấp, Qua vai, Trên cao, Góc 3/4, Góc nghiêng*) cho từng phân đoạn kịch bản.
2. **Nạp ảnh nhân vật gốc lên Grok Imagine / Google Flow:** Chuẩn bị 1 bức ảnh nhân vật gốc rõ nét và tải lên phần `Hình ảnh` (`Image`) của công cụ `Grok Imagine` (`grok.com/imagine`) hoặc `Google Flow`, thiết lập tỷ lệ khung hình chuẩn `16:9`.
3. **Đặt câu lệnh Prompt biến đổi góc quay:** Viết câu lệnh Prompt kết hợp ảnh tham chiếu: Nêu rõ bối cảnh (ví dụ `đang đứng tại 1 khu quân sự`), chỉ định chính xác tên góc quay (`góc nhìn trung cảnh`, `góc nhìn qua vai nhân vật này`, `góc nhìn từ trên cao`) và thêm cụm từ `hình ảnh sắc nét`.
4. **Điều hướng tinh chỉnh kích thước chủ thể:** Kiểm tra tỷ lệ nhân vật trong ảnh kết quả; nếu nhân vật bị quá to ở các góc rộng hoặc góc nhìn từ trên cao, gõ câu lệnh tinh chỉnh tiếp nối `hãy tạo lại hình ảnh này cho tôi , nhân vật bé hơn , còn lại giữ nguyên chi tiết`.
5. **Xuất bộ ảnh tĩnh chuẩn góc máy để làm Video:** Tải toàn bộ các bức ảnh tĩnh đã chuẩn hóa góc quay về máy tính theo thứ tự phân cảnh để làm nguyên liệu đầu vào cho bước tạo chuyển động video (*Image-to-Video*).

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Tuyệt đối không dùng duy nhất 1 `Góc ngang – Toàn thân` lặp đi lặp lại suốt 10 phân cảnh liên tiếp khiến video AI trở nên đơn điệu và mất giữ chân người xem.
- ⚠ Không nhảy cóc tạo video trực tiếp mà bỏ qua bước tạo hình ảnh tĩnh khóa góc quay trước trên `Grok Imagine` hoặc `Google Flow`.
- ⚠ Không quên chọn tỷ lệ khung hình `16:9` trước khi bấm tạo ảnh trên `Grok Imagine` cho các dự án video dài YouTube.
- ⚠ Khi ảnh góc nhìn từ trên cao hoặc toàn cảnh bị vẽ nhân vật quá lớn, không xóa đi làm lại từ đầu mà phải dùng câu lệnh điều hướng thu nhỏ nhân vật giữ nguyên chi tiết.

---

## 8. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ:** `Grok` (`Grok Imagine`), `Google Flow`, `ChatGPT`
- **Kênh mẫu:** Bài học kỹ thuật Prompt Engineering trên `Grok Imagine` & PDF `Offline Thực Chiến.pdf` (không chiếu kênh YouTube đối thủ).
- **Tài liệu đính kèm:**
  - [Bộ Tài Liệu Thực Chiến & Master Prompt: 14 Góc Quay Điện Ảnh Khi Đặt Câu Prompt Sinh Ảnh & Video AI (Bài 43)](../../assets/docs-dgmd/VIDEO-ad6a82/master_prompt.md)
  - [Bảng Tra Cứu Góc Quay Điện Ảnh Cho Prompt Sinh Ảnh AI (Bản Text Gốc)](../../assets/docs-dgmd/VIDEO-ad6a82/master_prompt.txt)
