# Quy Trình Sản Xuất Video Lời Phật Dạy (Kịch Bản 18 Phần Dài 60–120 Phút)

> **SKU:** `VIDEO-3b377d` · **Bài học:** Bài 27 (`DGMD-M08` — Quy Trình Sản Xuất Các Ngách Thực Chiến)  
> **Thời lượng:** `22:22` (`1342.52s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Tâm Linh & Lời Phật Dạy (Video Dài 60–120 Phút)` · **Thị trường:** `🇻🇳 Việt Nam & Cộng Đồng Phật Tử Hải Ngoại`  
> **Tài liệu Google Docs gốc:** [Mở Tài Liệu Master Prompt Gốc](https://docs.google.com/document/d/1oET2aujhYDfCpmQUTFFQv-Knxy_hH6zkI1FnD3Z2y38/edit?usp=sharing) · **Bản ghi phụ đề:** [`video/VIDEO-3b377d/transcript.txt`](../../video/VIDEO-3b377d/transcript.txt) · **Master Prompt:** [`assets/docs-dgmd/VIDEO-3b377d/master_prompt.md`](../../assets/docs-dgmd/VIDEO-3b377d/master_prompt.md)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng hướng dẫn thực chiến từ A-Z quy trình sản xuất dòng video **Phật Pháp & Lời Phật Dạy thời lượng dài (60 – 120 phút)** — một ngách có lượng người nghe thụ động bền vững và số giờ xem cực khủng (kênh đối thủ `@PhậtPhápLinhỨng-v7z` đạt `137 N người đăng ký`, video dài `2:04:30` thu hút **`505.000 lượt xem` sau 1 tháng**; kênh `@loiphatdaymoinhat` đạt **`637 N người đăng ký`**).

Toàn bộ dây chuyền sản xuất được chuẩn hóa thành 5 mắt xích tự động hóa cao:
1. **Bóc tách kịch bản & Nhân bản 100 ý tưởng:** Vào tab **Phổ biến** của kênh đối thủ, mở phần Mô tả $\rightarrow$ bấm **`Hiện bản chép lời` (Show transcript)** để lấy toàn bộ lời thoại gốc, đưa vào **ChatGPT** chạy **Prompt 1** sinh ra 100 chủ đề Phật pháp chiều sâu, rồi nạp vào **Master Prompt 18 Phần** để viết kịch bản dài `15.000 – 20.000 chữ`.
2. **Clone giọng đọc Phật pháp bằng MiniMax Audio:** Tải mẫu giọng đọc trầm ấm (~1 phút) bằng trình duyệt **Cốc Cốc**, đưa lên **`MiniMax Audio` (`minimax.io/audio/voices-cloning`)** để nhân bản giọng **`Phật pháp`** và chuyển văn bản thành giọng nói (*Text to Speech 2.8*).
3. **Tạo nhạc nền thiền định độc quyền bằng Suno AI:** Yêu cầu **ChatGPT** viết câu lệnh Style Prompt nhạc thiền không lời (*Dharma background music, no drums, no EDM...*) và đưa sang **`Suno AI v5.5`** (bật chế độ **`Nhạc cụ`**) tạo các bản nhạc nền tĩnh tâm (*`Hoa sen bình minh`* / *`Lotus at Dawn.wav`*).
4. **Tái tạo ảnh tượng Phật bằng Google Flow AI & Tải video nền Pexels:** Lấy ảnh mẫu tượng Phật trên **Pinterest**, dùng **ChatGPT** viết prompt chi tiết không phông nền rồi sinh ảnh mới trên **`Google Flow AI`** (`labs.google/fx/vi/tools/flow`); kết hợp tải hàng loạt video quay cận cảnh **`hoa`** miễn phí trên **`Pexels`** (`pexels.com/vi-vn/`).
5. **Dựng đa tầng & Thiết kế Thumbnail ngay trên CapCut PC:** Xếp chuỗi video hoa làm nền (tắt tiếng gốc, áp dụng chuyển cảnh **`Mờ`** cho tất cả), đặt ảnh tượng Phật đã **`Xóa nền` $\rightarrow$ `Xóa tự động`** ở bên trái, ghép Voice MiniMax + nhạc nền Suno AI, tạo **Phụ đề tự động**, tách nền nút Like/Sub bằng **`Phông xanh` (Chroma Key)**, phủ hiệu ứng **`Khói / Bokeh thiên đường`** và làm Thumbnail chữ **`Anton`** đỏ/vàng tô viền trắng trước khi xuất **`1080p`**.

---

## 2. Bảng Dữ Liệu Thực Chiến Bóc Tách Từ Màn Hình Video (Visual Frame Evidence)

### 2.1. Khảo sát Kênh YouTube Đối Thủ Ngách "Phật Pháp Lời Phật Dạy" (`00:10 – 05:45`)

| STT | Tên kênh & Handle | Quy mô kênh trên màn hình | Các video tiêu biểu xuất hiện trên màn hình (`00:15 – 01:40`) | Trạng thái & Link kênh |
| :-: | :--- | :---: | :--- | :--- |
| 01 | **Phật Pháp Linh Ứng** (`@PhậtPhápLinhỨng-v7z`) | `137 N người đăng ký` • `380 video` | • *LỜI PHẬT DẠY: SỐ PHẬN LÀ DO NGHIỆP TẠO RA – Nghe 1 Lần Để Thức Tỉnh Cả Đời* (`505 N view • 1 tháng trước`, dài `2:04:30`)<br>• *Lời Phật Dạy: Sống Giữa Cõi Tạm – Đừng Nặng Lòng, Buông Bỏ Để Tâm An Và Đời Bình Yên* (`61 N view • 3 tháng trước`, dài `2:14:50`)<br>• *LỜI PHẬT DẠY: CỨ SỐNG TỐT, ĐỜI SẼ TỰ THAY ĐỔI* (`69 N view • 1 tháng trước`, dài `1:59:14`)<br>• *Video dùng để lấy Bản chép lời (`01:35`):* `youtube.com/watch?v=Lj54lJhImHA` | `HTTP 200 LIVE` · [Mở kênh](https://www.youtube.com/@Ph%E1%BA%ADtPh%C3%A1pLinh%E1%BB%A8ng-v7z) |
| 02 | **Lời Phật Dạy** (`@loiphatdaymoinhat`) | `637 N người đăng ký` | Kênh lớn đầu ngành hiện ngay trang nhất khi tìm từ khóa `phật pháp lời phật dạy` (`00:15`). | `HTTP 200 LIVE` · [Mở kênh](https://www.youtube.com/@loiphatdaymoinhat) |

### 2.2. Bảng Thông Số Công Cụ & Tài Nguyên Trên Màn Hình (`00:36 – 22:20`)

| Công đoạn | Công cụ / Website trên màn hình | Thông số / Câu lệnh thực tế trên màn hình | File đầu ra / Kết quả thực tế |
| :--- | :--- | :--- | :--- |
| **1. Ý tưởng & Kịch bản** | Google Docs + ChatGPT | Prompt 1 (Phân tích transcript + 100 ý tưởng) & Master Prompt 2 (Kịch bản 18 phần, `15.000 – 20.000 chữ`) | Kịch bản 18 phần về chủ đề *"Vì sao mình sống tốt, hay giúp người nhưng vẫn cô đơn, bị hiểu lầm"* |
| **2. Clone Voice AI** | Cốc Cốc + `minimax.io/audio/voices-cloning` | Tải mẫu audio từ Short `youtube.com/shorts/I2iPJ4tInBo` (`Phật dạy học cách buông bỏ để tâm bình an - YouTube.mp3`, `0.94 MB`, `1'01"`) $\rightarrow$ `Voice Clone` đặt tên **`Phật pháp`** | File giọng đọc TTS: `MiniMax_2026-06-24_08_33_07_Phật_pháp.mp3` |
| **3. Nhạc nền Thiền AI** | ChatGPT + `suno.com/create` (`v5.5`) | Bật chế độ **`Nhạc cụ`** (*Instrumental*), dán Style Prompt: `healing and reflective mood, compassionate Buddhist wisdom... no drums, no EDM...` | 4 track nhạc nền tĩnh tâm: *`Hoa sen bình minh`*, *`Lotus at Dawn.wav`* |
| **4. Ảnh Tượng Phật AI** | Pinterest + ChatGPT + `labs.google/fx/vi/tools/flow` | Lấy ảnh mẫu tượng Phật cầm hoa sen trên Pinterest $\rightarrow$ ChatGPT tạo prompt chi tiết không nền $\rightarrow$ Dán vào **Google Flow AI** | Ảnh tượng Phật chất lượng cao: `Golden_Buddha_statue_holding_lotus_202606240843.jpeg` |
| **5. Video nền Hoa nở** | `pexels.com/vi-vn/` & `pixabay.com` | Chuyển sang mục **Video**, tìm từ khóa **`hoa`**, tải miễn phí các clip hoa nở `18s – 60s` (`1080p` / `UHD 4K`) | Các file nền: `16143840_3840_2160...mp4`, `1136560-hd_1920_1080_30fps.mp4`, `4073700-hd...mp4` |
| **6. Hậu kỳ & Thumbnail** | CapCut PC (`Dự án 0624`) | • Tượng Phật: `Xóa nền` $\rightarrow$ `Xóa tự động`<br>• Chuyển cảnh giữa các clip hoa: `Mờ` (*Áp dụng cho tất cả*)<br>• Nút Like/Sub: `Xóa nền` $\rightarrow$ `Phông xanh` (*Chroma Key*)<br>• Hiệu ứng phủ: `Bokeh thiên đường` / `Khói`<br>• Thumbnail: Phông **`Anton`** đỏ & vàng tô viền trắng | Video hoàn chỉnh `1080p` (`H.264`, `30fps`) + Thumbnail **`LỜI PHẬT DẠY - AN NHIÊN MỖI NGÀY`** |

---

## 3. Bộ 4 Master Prompt Thực Chiến Trong Bài Giảng

### 3.1. Prompt 1 — Phân tích bản chép lời đối thủ & Đề xuất 100 ý tưởng (`doc_1.txt` — Mốc `02:32`)
```text
Bạn hãy phân tích toàn bộ tệp văn bản mà tôi đã gửi , Hãy xây dựng cho tôi một cấu trúc chuẩn để viết kịch bản video Phật pháp và đề xuất 100 ý tưởng nội dung có chiều sâu về nhân quả, nghiệp báo, hiếu đạo, buông bỏ và chánh niệm.
```

### 3.2. Prompt 2 — Master Prompt 18 Phần Viết Bài Phật Pháp 15.000 – 20.000 Chữ (`doc_1.txt` — Mốc `03:04`)
*(Xem toàn văn 18 phần chi tiết trong [`assets/docs-dgmd/VIDEO-3b377d/master_prompt.md`](../../assets/docs-dgmd/VIDEO-3b377d/master_prompt.md) và [`assets/docs-dgmd/VIDEO-3b377d/doc_1.txt`](../../assets/docs-dgmd/VIDEO-3b377d/doc_1.txt))*
- **Cấu trúc 18 phần bắt buộc:**
  - `Phần 1:` Hook cực mạnh (`1.000 chữ`)
  - `Phần 2:` Câu chuyện mở đầu (`1.500 chữ`)
  - `Phần 3:` Đức Phật dạy gì về vấn đề này? (`1.000 chữ`)
  - `Phần 4:` Góc nhìn Nhân quả (`1.000 chữ`)
  - `Phần 5:` Góc nhìn Nghiệp báo (`1.000 chữ`)
  - `Phần 6:` Góc nhìn Phúc báo (`1.000 chữ`)
  - `Phần 7:` Góc nhìn Tâm lý con người (`1.000 chữ`)
  - `Phần 8:` Góc nhìn Tướng mạo (`1.000 chữ`)
  - `Phần 9:` Góc nhìn Sức khỏe (`1.000 chữ`)
  - `Phần 10:` Góc nhìn Gia đình (`1.000 chữ`)
  - `Phần 11:` Góc nhìn Tuổi già (`1.000 chữ`)
  - `Phần 12:` Câu chuyện nhân quả thứ hai (`1.500 chữ`)
  - `Phần 13:` Câu chuyện nhân quả thứ ba (`1.500 chữ`)
  - `Phần 14:` Những dấu hiệu nhận biết (`1.000 chữ`)
  - `Phần 15:` Cách thực hành hằng ngày (`1.000 chữ`)
  - `Phần 16:` Lời nhắn nhủ của Đức Phật (`1.000 chữ`)
  - `Phần 17:` Tổng kết toàn bộ (`1.000 chữ`)
  - `Phần 18:` Kết thúc gây xúc động (`1.000 chữ`)

### 3.3. Prompt 3 — Tạo Style Nhạc Thiền Định Trên Suno AI (`08:55`)
- **Câu lệnh gõ vào ChatGPT:**
```text
dựa vào lời phật dạy trên , bạn hãy tạo cho tôi 1 styles để tạo nhạc trên suno ai
```
- **Style Prompt dán vào Suno AI (`09:28`):**
```text
healing and reflective mood, compassionate Buddhist wisdom, themes of karma, kindness, compassion, letting go, gratitude, inner peace, mindfulness, cinematic YouTube Dharma background music, no drums, no EDM, no aggressive beat, soothing, sacred, emotional, peaceful ending.
```

### 3.4. Prompt 4 — Tạo Prompt Tái Tạo Ảnh Tượng Phật Sắc Nét (`10:50`)
Đính kèm ảnh tượng Phật lấy từ Pinterest vào ChatGPT và nhập câu lệnh:
```text
hãy tạo cho tôi 1 prompt chi tiết để tạo lại hình ảnh này , hình ảnh sắc nét , không cần phông nền
```

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Mở đầu & Khảo sát thị trường: Ngách Phật Pháp & Lời Phật Dạy dài trên 1 tiếng (`@PhậtPhápLinhỨng-v7z` 505N view, `@loiphatdaymoinhat` 637N sub)
- **`01:15`** — Bước 1 - Lấy mẫu kịch bản đối thủ: Vào tab Phổ biến của kênh đối thủ, mở `'Hiện bản chép lời'` (*Show transcript*) để sao chép toàn bộ nội dung viral
- **`02:32`** — Bước 2 - Phân tích & Sinh 100 ý tưởng: Dùng Prompt 1 trên ChatGPT bóc tách cấu trúc và tạo 100 chủ đề Phật pháp chiều sâu
- **`03:04`** — Bước 3 - Triển khai Master Prompt 18 Phần: Nạp chủ đề vào Master Prompt `15.000 - 20.000 chữ` để viết kịch bản dài `60 - 120 phút`
- **`04:59`** — Bước 4 - Clone giọng & Tạo Voice AI: Tải mẫu giọng trầm ấm bằng Cốc Cốc, đưa vào MiniMax Audio (`Voice Clone` $\rightarrow$ `Text to Speech`) tạo file thoại Phật pháp
- **`08:23`** — Bước 5 - Tạo nhạc nền thiền định không bản quyền: Dùng ChatGPT viết Style Prompt và đưa sang Suno AI `v5.5` (chế độ Nhạc cụ) tạo nhạc `'Hoa sen bình minh'`
- **`09:46`** — Bước 6 - Tạo ảnh tượng Phật sắc nét: Tìm ảnh mẫu trên Pinterest, dùng ChatGPT viết Prompt chi tiết rồi đưa sang Google Flow AI tạo ảnh tượng Phật cầm hoa sen
- **`11:54`** — Bước 7 - Tải kho video nền miễn phí: Vào Pexels / Pixabay mục Video tìm từ khóa `'hoa'` để tải hàng loạt clip hoa nở nhẹ nhàng
- **`13:46`** — Bước 8 - Dựng video trên CapCut PC: Ghép nền hoa, Xóa nền tự động ảnh tượng Phật, chèn Voice MiniMax, nhạc nền Suno AI, Phụ đề tự động, nút Like/Sub phông xanh (`Chroma Key`) & hiệu ứng Khói/Bokeh
- **`19:11`** — Bước 9 - Thiết kế Thumbnail & Xuất video `1080p`: Tạo ảnh bìa trực tiếp trên CapCut (phông chữ `Anton` đỏ/vàng tô viền trắng: `'LỜI PHẬT DẠY - AN NHIÊN MỖI NGÀY'`) và xuất file `1080p`

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Ngách Phật Pháp & Lời Phật Dạy sở hữu tệp khán giả nghe thụ động cực lớn với thời lượng video dài từ 60 đến 120 phút:** Kênh mẫu `@PhậtPhápLinhỨng-v7z` (`137N sub`, `380 video`) có video dài hơn 2 tiếng đạt `505.000 view` sau 1 tháng; kênh `@loiphatdaymoinhat` đạt `637.000 người đăng ký` dù cách dựng hình ảnh rất đơn giản.
- **Kỹ thuật nhân bản 100 kịch bản từ video đối thủ đã viral:** Vào tab `'Phổ biến'` của kênh mẫu, mở phần Mô tả bấm `'Hiện bản chép lời'` (*Show transcript*), sao chép toàn bộ văn bản đưa vào `ChatGPT` kèm Prompt 1 để phân tích công thức và lập danh sách 100 ý tưởng về nhân quả, nghiệp báo, hiếu đạo, buông bỏ và chánh niệm.
- **Công thức Master Prompt 18 phần (`15.000 – 20.000 chữ`):** Nạp từng ý tưởng vào Master Prompt 18 phần (từ Hook 1.000 chữ, Câu chuyện mở đầu 1.500 chữ, Góc nhìn Nhân quả - Nghiệp báo - Phúc báo - Tâm lý - Tướng mạo - Sức khỏe - Gia đình - Tuổi già đến 3 câu chuyện nhân quả và Kết thúc gây xúc động); yêu cầu `ChatGPT` viết nối tiếp từng phần cho đến khi hoàn chỉnh.
- **Quy trình tạo Voice AI trầm ấm bằng MiniMax Audio và nhạc nền riêng bằng Suno AI:** Dùng trình duyệt `Cốc Cốc` tải đoạn âm thanh mẫu (~1 phút) từ video Phật pháp có giọng đọc truyền cảm, đưa vào mục `Voice Clone` của `MiniMax Audio` (`minimax.io`) để nhân bản giọng `'Phật pháp'`; đồng thời dùng `ChatGPT` tạo đoạn mô tả style nhạc thiền định (`no drums, no EDM, compassionate Buddhist wisdom...`) đưa sang `Suno AI v5.5` (chế độ Nhạc cụ) tạo nhạc nền độc quyền (`Hoa sen bình minh` / `Lotus at Dawn`).
- **Tái tạo hình ảnh tượng Phật sắc nét bằng Pinterest + ChatGPT + Google Flow AI & Kho video Pexels:** Lấy ảnh tượng Phật mẫu trên `Pinterest`, nhờ `ChatGPT` viết prompt tái tạo chi tiết không phông nền rồi sinh ảnh mới trên `Google Flow AI` (`labs.google`); kết hợp tải hàng loạt video quay cận cảnh hoa nở miễn phí trên `Pexels` (`pexels.com`) hoặc `Pixabay`.
- **Kỹ thuật lắp ráp đa tầng trên CapCut PC & Thiết kế Thumbnail trực tiếp:** Xếp chuỗi video hoa làm nền (tắt tiếng gốc, thêm chuyển cảnh `'Mờ'` cho tất cả), đặt ảnh tượng Phật đã `'Xóa nền -> Xóa tự động'` ở góc trái, lồng file thoại MiniMax + nhạc nền Suno AI (hạ nhỏ âm lượng), bật Phụ đề tự động, chèn nút Like/Sub phông xanh bằng công cụ `'Phông xanh'` (`Chroma Key`), phủ hiệu ứng `'Khói / Bokeh thiên đường'` và tạo Thumbnail ngay trong `CapCut` với phông chữ `Anton` (dòng trên màu đỏ, dòng dưới màu vàng, tô viền trắng) trước khi xuất `1080p`.

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Lời Phật Dạy Trường Đoạn (60–120 Phút) Bằng ChatGPT, MiniMax, Suno AI, Flow AI & CapCut PC

1. Vào tab Phổ biến của kênh Phật pháp đối thủ (`@PhậtPhápLinhỨng-v7z`), mở phần Mô tả chọn `'Hiện bản chép lời'` (*Show transcript*), sao chép toàn bộ lời thoại đưa vào `ChatGPT` chạy Prompt 1 để lấy 100 ý tưởng, sau đó nạp từng chủ đề vào Master Prompt 18 phần để viết kịch bản `15.000 – 20.000 chữ`.
2. Dùng `Cốc Cốc` tải một đoạn audio giọng đọc Phật pháp truyền cảm (~1 phút), đưa vào mục `Voice Clone` của `MiniMax Audio` (`minimax.io`) để tạo giọng mẫu `'Phật pháp'`, rồi chuyển toàn bộ kịch bản thành file âm thanh qua mục `Text to Speech`.
3. Yêu cầu `ChatGPT` viết câu lệnh Style Prompt nhạc thiền định không lời dựa trên bài giảng vừa viết, dán vào `Suno AI` (`suno.com/create`, bật chế độ `Nhạc cụ`) để tạo và tải về 4 bản nhạc nền tĩnh tâm (`Hoa sen bình minh` / `Lotus at Dawn`).
4. Tìm ảnh tượng Phật trên `Pinterest`, dùng `ChatGPT` viết prompt mô tả chi tiết không cần phông nền rồi đưa sang `Google Flow AI` tạo ảnh tượng Phật mới sắc nét; đồng thời lên `Pexels` / `Pixabay` mục Video tìm từ khóa `'hoa'` để tải các clip hoa nở miễn phí.
5. Đưa toàn bộ tài nguyên vào `CapCut PC`: ghép chuỗi video hoa làm nền (tắt âm gốc, áp dụng chuyển tiếp `'Mờ'` cho tất cả), chèn ảnh tượng Phật và bấm `'Xóa nền -> Xóa tự động'`, lắp voice MiniMax cùng nhạc nền Suno AI (hạ nhỏ tiếng nhạc), tạo Phụ đề tự động, tách nền nút Like/Sub bằng công cụ `'Phông xanh'`, thêm hiệu ứng Khói/Bokeh, thiết kế ảnh bìa phông chữ `Anton` tô viền trắng và xuất file `1080p`.

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Nếu `ChatGPT` chỉ mới viết Phần 1 – Phần 3 rồi dừng lại, không được lấy ngay bản ngắn đó mà phải gõ lệnh yêu cầu viết tiếp từng phần cho đến khi đủ toàn bộ 18 phần (`15.000 – 20.000 chữ`).
- ⚠ Khi đưa các video hoa từ `Pexels`/`Pixabay` vào `CapCut`, bắt buộc phải tắt toàn bộ âm thanh gốc của các clip hoa và kéo nhỏ âm lượng nhạc nền `Suno AI` xuống để không làm ồn hoặc đè lên giọng đọc Phật pháp.
- ⚠ Khi tách nền nút Like/Subscribe màu xanh lá, không được bấm `'Xóa tự động'` mà phải chuyển sang tab `'Phông xanh'` (`Chroma Key`) dùng bút chấm màu xanh, và phải đặt vị trí nút Like/Sub lệch lên trên để không đè vào dòng chữ phụ đề.
- ⚠ Không cần xuất video Phật pháp ở độ phân giải `2K` hay `4K` gây nặng dung lượng và tốn thời gian render, vì tệp khán giả ngách này chủ yếu bật để nghe audio nên chuẩn `1080p` là tối ưu nhất.

---

## 8. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ sử dụng:** `ChatGPT`, `MiniMax`, `ElevenLabs`, `Suno AI`, `Flow AI`, `CapCut`, `Pinterest`, `Pexels`, `Pixabay`, `Cốc Cốc`, `YouTube`
- **Kênh đối thủ mẫu (2 kênh đã xác thực HTTP 200):** `@PhậtPhápLinhỨng-v7z` (`Phật Pháp Linh Ứng`), `@loiphatdaymoinhat` (`Lời Phật Dạy`)
- **Tài liệu đính kèm:**
  - [`assets/docs-dgmd/VIDEO-3b377d/master_prompt.md`](../../assets/docs-dgmd/VIDEO-3b377d/master_prompt.md) — Tài liệu thực chiến & Bộ 4 Master Prompt đầy đủ (Kịch bản 18 phần + Suno AI + Flow AI)
  - [`assets/docs-dgmd/VIDEO-3b377d/doc_1.txt`](../../assets/docs-dgmd/VIDEO-3b377d/doc_1.txt) — File Master Prompt 18 phần gốc của giảng viên
  - [`docs/VIDEO-3b377d/README.md`](./README.md) — Hồ sơ phân tích 7 lớp H2DEV Gold Standard
  - [`video/VIDEO-3b377d/transcript.txt`](../../video/VIDEO-3b377d/transcript.txt) — Bản ghi phụ đề đầy đủ đã kiểm định 212 phân đoạn
