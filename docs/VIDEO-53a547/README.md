# Quy Trình Sản Xuất Video Thể Thao Shorts

> **SKU:** `VIDEO-53a547` · **Bài học:** Bài 11 (`DGMD-M03` — Quy Trình Sản Xuất Video Ngắn)  
> **Thời lượng:** `37:42` (`2262.6s`) · **Độ phân giải:** `1080p MP4` · **Trạng thái kiểm định:** `GROUNDED_VERIFIED (Audio + Visual CUDA GPU)`  
> **Ngách nội dung:** `Thể Thao & Câu Đố Bóng Đá Tương Tác (Sports Quiz Shorts)` · **Thị trường:** `🇻🇳 Việt Nam & 🌍 Toàn Cầu (Anh, Pháp, Ý, Nhật, Hàn, Bồ Đào Nha)`  
> **Bài học gốc:** [Mở trên DGMD Academy](https://daigiamangdep.com/learn/study/quy-trinh-san-xuat-video-the-thao-shorts) · **Bản ghi phụ đề:** [`video/VIDEO-53a547/transcript.txt`](../../video/VIDEO-53a547/transcript.txt) · **Tài liệu Master Prompt:** [`assets/docs-dgmd/VIDEO-53a547/master_prompt.md`](../../assets/docs-dgmd/VIDEO-53a547/master_prompt.md)

---

## 1. Tóm tắt thực chiến (Executive Summary)

Bài giảng hướng dẫn chi tiết từ A–Z quy trình sản xuất dạng video ngắn **Câu Đố Bóng Đá Tương Tác (`Guess The Player` / `Sports Quiz Shorts` tỷ lệ `9:16`)** theo mô hình kênh mẫu `@Goat_Faceoff`. Toàn bộ quy trình vận hành trên 4 công cụ cốt lõi:
1. **`ChatGPT`**: Tạo bộ 5 câu hỏi xoay quanh 4 siêu sao (`Cristiano Ronaldo`, `Lionel Messi`, `Neymar`, `Kylian Mbappé`), trong đó 4 câu đầu chia đều mỗi người đúng 1 lần và **câu số 5 là câu hỏi mở kéo tương tác** (`Like`, `Thả tim`, `Subscribe`, `Comment`); đồng thời viết câu lệnh tiếng Anh chuyển ảnh thành video nói thoại.
2. **`Pinterest`**: Khai thác hình nền sân bóng đá dọc `9:16`, ảnh toàn thân nhân vật dẫn chuyện (`Messi`) và 4 ảnh khuôn mặt cầu thủ.
3. **`Grok (`grok.com/imagine`)`**: Tách và tái tạo ảnh nhân vật dẫn chuyện `Messi` sang phông nền xanh lá cây (`9:16`), tạo 4 ảnh khuôn mặt cầu thủ phông xanh lá cây (`1:1`), và xuất **7 video AI (`720p`)** nhân vật Messi nhép môi đọc rõ từng câu hỏi mà không dính tạp âm.
4. **`CapCut PC`**: Thiết lập bố cục `9:16`, tách nền tự động, bo **Mặt nạ Hình tròn** cho 4 khuôn mặt phía trên, đóng băng khung hình cuối câu thoại (**`Dừng hình` / `Freeze Frame`**), dùng nhãn dán làm **thước căn chuẩn `1.0 giây`**, và bật hiệu ứng **`Xóa nền -> Tô viền -> Viền trơn tru -> Cỡ 50`** đổi màu **Xanh lá** (Đúng + dấu tích `V`) / **Đỏ** (Sai + dấu `X`).

---

## 2. Bảng tổng hợp Công cụ, Thông số & Tài nguyên trên màn hình (Visual Frame Evidence)

### 2.1. Ma trận 4 Công cụ & Thông số kỹ thuật (`00:30 – 36:33`)

| STT | Công cụ sử dụng | Vai trò trong quy trình | Thông số kỹ thuật hiển thị trên màn hình | Mốc thời gian |
| :-: | :--- | :--- | :--- | :---: |
| 01 | **ChatGPT** (`chatgpt.com`) | Sinh bộ 5 câu hỏi bóng đá + Dịch đa ngôn ngữ + Viết prompt tiếng Anh tạo video cho Grok | • Tab 1: `Câu hỏi bóng đá tương tác`<br>• Nhắc lệnh: `"viết prompt không phải tạo hình ảnh"` | `00:52 – 02:50`<br>`06:58 – 11:58` |
| 02 | **Pinterest** (`pinterest.com`) | Tìm kiếm ảnh gốc chất lượng cao làm nguyên liệu đầu vào | • Từ khóa: `sân bóng đá`, `cầu thủ bóng đá`, `cr7 Cristiano Ronaldo` | `04:05 – 04:58` |
| 03 | **Grok Imagine** (`grok.com/imagine`) | Tạo ảnh nhân vật phông xanh lá (`Green Screen`) & Tạo video nhân vật nói câu thoại | • Ảnh MC Messi: Tỷ lệ **`9:16`**, phông xanh lá cây<br>• Ảnh 4 mặt cầu thủ: Tỷ lệ **`1:1`**, phông xanh lá cây<br>• Video đọc thoại: Độ phân giải **`720p`**, thời lượng **`6s – 10s`** (7 file: `1.mp4` – `7.mp4`) | `02:50 – 04:00`<br>`04:59 – 11:58` |
| 04 | **CapCut PC** (Dự án `0529`) | Ghép bố cục `9:16`, xóa nền, bo mặt nạ tròn, dừng hình, tô viền xanh/đỏ & lồng SFX | • Khung hình: **`9:16`**, `30.00fps`, `Rec. 709 SDR`<br>• Mặt cầu thủ: Tỷ lệ `20% – 25%`, `Mặt nạ -> Hình tròn`<br>• Viền đáp án: `Xóa nền -> Tô viền -> Viền trơn tru -> Cỡ 50` (Xanh lá / Đỏ) | `12:02 – 37:30` |

### 2.2. Kênh YouTube mẫu & Cấu trúc 7 File Video AI trong bài giảng

- **Kênh mẫu phân tích đầu bài (`00:08 – 00:30`):** **`@Goat_Faceoff`** (`Goat Faceoff` — video Shorts `https://www.youtube.com/shorts/F5Ja-6UP560`, tiêu đề *"Ronaldo, Messi or Neymar - GUESS THE PLAYER!"*, bố cục nhân vật đứng dưới sân vận động và 4 khuôn mặt cầu thủ xếp hàng ngang phía trên kèm dấu `X` đỏ và bộ đếm điểm). *(Ghi chú trạng thái: Kênh `@Goat_Faceoff` hiện đã ngừng hoạt động/đổi handle trên YouTube — đã gắn cờ `dead: true` trong hồ sơ dữ liệu).*
- **Danh sách 7 file video AI (`1.mp4` $\rightarrow$ `7.mp4`) tạo từ Grok Imagine đưa vào CapCut (`12:05`):**
  1. `1.mp4` (`00:05`): *"Cầu thủ nào đang giữ kỷ lục ghi nhiều bàn thắng nhất trong lịch sử bóng đá nam cấp đội tuyển quốc gia?"* $\rightarrow$ Đáp án đúng: **Ronaldo** (Viền xanh lá cỡ 50 + dấu `V`).
  2. `2.mp4` (`00:05`): *"Cầu thủ nào đã giành chức vô địch World Cup 2022 cùng đội tuyển Argentina?"* $\rightarrow$ Đáp án đúng: **Messi** (Viền xanh lá cỡ 50 + dấu `V`).
  3. `3.mp4` (`00:05`): *"Cầu thủ nào là chân sút ghi nhiều bàn thắng nhất lịch sử đội tuyển Brazil?"* $\rightarrow$ Đáp án đúng: **Neymar** (Viền xanh lá cỡ 50 + dấu `V`).
  4. `4.mp4` (`00:04`): *"Cầu thủ nào giành danh hiệu Vua phá lưới World Cup 2022?"* $\rightarrow$ Đáp án đúng: **Mbappé** (Viền xanh lá cỡ 50 + dấu `V`).
  5. `5.mp4` (`00:05`): *"Nếu được chọn một siêu sao để xây dựng đội bóng trong 10 năm tới, bạn sẽ chọn ai?"* (Câu hỏi mở).
  6. `6.mp4` (`00:05`): *"Nhấn like nếu bạn chọn Cristiano Ronaldo, thả tim nếu bạn chọn Lionel Messi."* (Gắn sticker `Like` + viền xanh 50 cho Ronaldo; sticker `Thả tim` + viền xanh 50 cho Messi).
  7. `7.mp4` (`00:05`): *"Nhấn đăng ký nếu bạn chọn Neymar, bình luận nếu bạn chọn Kylian Mbappé."* (Gắn sticker `Subscribe` + viền xanh 50 cho Neymar; sticker `Comment` + viền xanh 50 cho Mbappé).

---

## 3. Bộ 4 Master Prompt Nguyên Bản (Trích xuất từ Google Docs trên màn hình `00:52 – 07:38`)

### 3.1. Câu lệnh 1 — Tạo ra câu hỏi và trả lời (ChatGPT)
```text
- bạn là một nhà chuyên gia về bóng đá thể thao , bạn hãy tạo cho tôi 5 câu hỏi , cho 4 nhân vật , ( cầu thủ ) ronaldo , messi , neymar , mbappe , các câu hỏi liên quan đến thể thao , 4 câu đầu tiên mỗi nhân vật đúng 1 lần , câu hỏi thứ 5 sẽ trả lời bằng tư duy , ví dụ như bạn sẽ chọn cầu thủ nào , nhấn like thì chọn cầu thủ này , nhấn đăng ký kênh thì chọn cầu thủ kia , và nhấn chia sẻ , bình luận , sáng tạo cho tôi các câu hỏi phải đúng với các nhân vật mà tôi đã liệt kê ra
```

### 3.2. Câu lệnh 2 — Tạo lại hình ảnh nhân vật dẫn chuyện phông xanh `9:16` (Grok)
```text
- hãy tạo cho tôi lại hình ảnh nhân vật này , nhân vật đang thẳng người , toàn bộ người hướng về phía màn hình , góc nhìn trung cảnh , hình ảnh 9.16 , hình ảnh sắc nét , xóa bỏ các phông nền phía sau , thay bằng phông xanh lá cây , còn lại giữ nguyên chi tiết .
```

### 3.3. Câu lệnh 3 — Tạo ảnh mặt nhân vật phông xanh `1:1` (Grok)
```text
- hãy tạo lại hình ảnh này cho tôi , khuôn mặt ở giữa hình ảnh , hình ảnh sắc nét , kích thước hình ảnh 1.1 , xóa bỏ các phông nền phía sau , thay bằng phông nền xanh lá cây , còn lại giữ nguyên chi tiết
```

### 3.4. Câu lệnh 4 — Tạo ra video nhân vật đọc câu thoại (ChatGPT $\rightarrow$ Grok Imagine)
```text
- hãy tạo cho tôi 1 prompt để dùng hình ảnh này tạo ra video , nhân vật này đang nói 1 câu thoại ( điền câu thoại vào đây ) câu thoại bằng tiếng ( ngôn ngữ mà bạn muốn làm ) , không cần hiệu ứng âm thanh nhạc nền , camera cố định vị trí , camera giữ nguyên chi tiết .
```

**Mẫu Prompt tiếng Anh do ChatGPT sinh ra trên màn hình (`08:38`) để đưa sang Grok:**
```text
Use the uploaded image as the reference character. Keep 100% of the original appearance, clothing, facial features, body proportions, hairstyle, colors, and background details unchanged. The character stands naturally facing the camera and speaks clearly in Vietnamese:

"Cầu thủ nào đang giữ kỷ lục ghi nhiều bàn thắng nhất trong lịch sử bóng đá nam cấp đội tuyển quốc gia?"

The character's lips move naturally and accurately match the Vietnamese speech. Subtle natural blinking and slight facial movements only. No additional actions, no new objects, no scene changes.

Camera fixed in position at all times, no zoom, no pan, no tilt, no shake, no tracking shot. Maintain all original image details and composition exactly as provided. Natural lighting preserved. No sound effects, no background music, no ambient audio. Only the character's clear Vietnamese voice is heard. High-quality realistic motion, smooth lip sync, clean facial animation, duration 5–7 seconds, vertical 9:16 format.
```

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)

- **`00:00`** — Mở đầu: Xem video mẫu Thể Thao Shorts (`@Goat_Faceoff`) & 4 công cụ cốt lõi (`ChatGPT`, `Pinterest`, `Grok`, `CapCut`)
- **`00:52`** — Câu lệnh 1 trên `ChatGPT`: Tạo 5 câu hỏi bóng đá cho 4 cầu thủ (`Ronaldo`, `Messi`, `Neymar`, `Mbappé`) & tư duy đa ngôn ngữ
- **`02:50`** — Câu lệnh 2 trên `Grok`: Biến ảnh Messi thành nhân vật MC đứng thẳng phông nền xanh lá cây tỷ lệ `9:16`
- **`04:05`** — Tìm ảnh sân bóng đá trên `Pinterest` & Câu lệnh 3 trên `Grok`: Tạo 4 ảnh khuôn mặt cầu thủ phông xanh tỷ lệ `1:1`
- **`06:58`** — Câu lệnh 4 (`ChatGPT` sang `Grok Imagine`): Tạo 7 video AI `720p` nhân vật Messi đọc 5 câu hỏi & lời kêu gọi tương tác
- **`12:02`** — Đưa nguyên liệu vào `CapCut PC`: Dựng khung `9:16`, xóa nền tự động & bo Mặt nạ Hình tròn cho 4 mặt cầu thủ
- **`16:32`** — Kỹ thuật Dừng hình (`Freeze Frame`), dùng nhãn dán làm thước căn 1 giây & Tô viền trơn tru cỡ `50` (Xanh Đúng / Đỏ Sai)
- **`32:00`** — Hoàn thiện Câu số 5 kéo tương tác (Gắn nhãn dán `Like`, `Thả tim`, `Subscribe`, `Comment` + Tô viền xanh cỡ `50`) & Gộp Clip

---

## 5. Mấu chốt bài giảng (Key Takeaways)

- **Cấu trúc kịch bản 5 câu hỏi cho 4 siêu sao (`Ronaldo`, `Messi`, `Neymar`, `Mbappé`) được thiết kế có chủ đích:** 4 câu đầu tiên chia đều mỗi cầu thủ đúng 1 lần, còn câu thứ 5 bắt buộc là câu hỏi tư duy mở (*"Nếu được chọn 1 siêu sao xây dựng đội bóng trong 10 năm tới..."*) để gắn liền 4 lựa chọn với 4 hành động `Like`, `Thả tim`, `Đăng ký kênh (Subscribe)` và `Bình luận (Comment)`.
- **Tư duy nhân bản đa thị trường (Global Scaling):** Không giới hạn ở tiếng Việt mà dùng `ChatGPT` chuyển đổi toàn bộ câu hỏi và lời thoại sang tiếng Anh, Pháp, Ý, Nhật, Hàn, Bồ Đào Nha để khai thác RPM ngoại từ cùng một bộ tài nguyên hình ảnh cầu thủ.
- **Chuẩn hóa tài nguyên xanh lá (Green Screen Asset Library) bằng `Pinterest` + `Grok`:** Chỉ cần tạo 1 ảnh toàn thân nhân vật dẫn chuyện phông xanh tỷ lệ `9:16` và 4 ảnh khuôn mặt cầu thủ phông xanh tỷ lệ `1:1` một lần duy nhất để lưu trữ và tái sử dụng cho hàng trăm video tiếp theo.
- **Kỹ thuật tạo video nhân vật nói câu thoại trên `Grok` (`720p`, `6s–10s`):** Dùng `ChatGPT` sinh prompt tiếng Anh ép cố định vị trí camera 100%, giữ nguyên chi tiết khuôn mặt và tắt hoàn toàn nhạc nền/hiệu ứng âm thanh để về `CapCut` chủ động chèn sound effect.
- **Mẹo dựng `CapCut PC` chính xác từng giây:** Sau khi nhân vật hỏi xong, dùng tính năng **`Dừng hình` (`Freeze Frame`)** rồi lấy 1 nhãn dán dài đúng `1.0 giây` làm "thước kẻ" để cắt (`Ctrl + B`) nhịp kiểm tra từng cầu thủ; kết hợp tính năng **`Xóa nền -> Tô viền -> Viền trơn tru -> Cỡ 50`** đổi màu Đỏ (kèm dấu `X` + âm thanh `Wrong`) và màu Xanh lá (kèm dấu tích `V` + âm thanh `Correct`).
- **Tăng tốc sản xuất từ Câu 2 đến Câu 4:** Nhân bản (`Copy/Paste`) cụm layer mặt cầu thủ, dấu `X`/`V` và hiệu ứng âm thanh từ Câu 1 sang, chỉ cần đổi vị trí viền xanh lá cỡ `50` sang cầu thủ đúng của câu đó (Câu 1: `Ronaldo`, Câu 2: `Messi`, Câu 3: `Neymar`, Câu 4: `Mbappé`).

---

## 6. Quy trình triển khai (SOP Thực Chiến)

**Chủ đề chính:** SOP 5 Bước Sản Xuất Video Thể Thao Shorts Tương Tác (`Guess The Player 9:16`) Với `ChatGPT`, `Grok` & `CapCut PC`

1. **Tạo kịch bản 5 câu hỏi bằng ChatGPT:** Sử dụng Câu lệnh 1 để sinh 4 câu hỏi kiến thức chia đều đáp án đúng cho 4 siêu sao (`Ronaldo`, `Messi`, `Neymar`, `Mbappé`) và 1 câu hỏi mở số 5 điều hướng khán giả nhấn `Like`, `Thả tim`, `Subscribe`, `Comment`.
2. **Chuẩn bị bộ ảnh phông xanh bằng Pinterest & Grok:** Tải ảnh nền sân bóng đá, ảnh Messi toàn thân và 4 ảnh mặt cầu thủ từ `Pinterest`; đưa lên `Grok` chạy Câu lệnh 2 (tạo ảnh MC Messi phông xanh `9:16`) và Câu lệnh 3 (tạo 4 ảnh mặt cầu thủ phông xanh `1:1`).
3. **Tạo 7 video AI nhân vật đọc thoại trên Grok (720p):** Dùng Câu lệnh 4 trên `ChatGPT` để xuất prompt tiếng Anh cho từng câu hỏi (và 3 câu kêu gọi tương tác ở mục 5), đưa vào `Grok Imagine` cùng ảnh Messi phông xanh để xuất 7 video MP4 không nhạc nền.
4. **Thiết lập bố cục 9:16 & Dừng hình trên CapCut PC:** Đặt nền sân bóng dưới cùng, xếp 4 ảnh mặt cầu thủ đã xóa nền tự động (bo Mặt nạ Hình tròn) thành hàng ngang phía trên, đặt video Messi hỏi ở giữa và bấm **`Dừng hình` (`Freeze Frame`)** ngay khi kết thúc câu hỏi.
5. **Cắt nhịp thước 1 giây & Tô viền cỡ 50:** Dùng nhãn dán 1 giây làm thước căn cắt 4 nhịp kiểm tra đáp án; bật **`Xóa nền -> Tô viền -> Viền trơn tru -> Cỡ 50`** gán màu Đỏ (dấu `X` + âm thanh Sai) và màu Xanh lá (dấu `V` + âm thanh Đúng), gắn sticker `Like`/`Tim`/`Sub`/`Comment` cho câu số 5 rồi Gộp Clip xuất bản.

---

## 7. Cảnh báo & Lỗi cần tránh (Avoid Flags)

- ⚠ Không bỏ qua câu hỏi tư duy số 5 kèm lời kêu gọi nhấn `Like` (Ronaldo), `Thả tim` (Messi), `Subscribe` (Neymar), `Comment` (Mbappé), vì nếu thiếu câu kéo tương tác này tỷ lệ view và sub sẽ sụt giảm mạnh.
- ⚠ Khi nhờ `ChatGPT` tạo prompt làm video cho `Grok`, tuyệt đối không để `ChatGPT` tự sinh ra bức ảnh mới mà phải nhắc rõ *"viết prompt không phải tạo hình ảnh"* và bắt buộc cài điều kiện không có nhạc nền/hiệu ứng âm thanh.
- ⚠ Trong `CapCut PC`, không quên bấm **`Dừng hình` (`Freeze Frame`)** ở cuối mỗi câu thoại của nhân vật Messi; nếu không dừng hình, nhân vật sẽ biến mất trong lúc 4 khuôn mặt phía trên lần lượt hiện đáp án đúng/sai.
- ⚠ Không chọn bừa các nhãn dán (`Sticker`) Like, Tim, Subscribe, Comment kém thẩm mỹ hoặc lệch kích thước; phải đồng bộ cỡ viền trơn tru ở mức `50` cho cả 4 khuôn mặt để tổng thể video cân đối, chuyên nghiệp.

---

## 8. Công cụ, Kênh mẫu & Tài liệu đính kèm

- **Công cụ:** `ChatGPT`, `Pinterest`, `Grok`, `CapCut`, `Google Docs`, `YouTube`, `Cốc Cốc`
- **Kênh đối thủ mẫu:** `@Goat_Faceoff` (*Goat Faceoff* — đã kiểm tra trạng thái HTTP và ghi nhận `dead: true`)
- **Tài liệu đính kèm:**
  - [`assets/docs-dgmd/VIDEO-53a547/master_prompt.md`](../../assets/docs-dgmd/VIDEO-53a547/master_prompt.md) (Bộ 4 Master Prompt gốc + Prompt tiếng Anh Grok Video + Bảng thông số hậu kỳ CapCut PC)
  - [`docs/VIDEO-53a547/README.md`](README.md) (Hồ sơ phân tích chuẩn 7 lớp H2DEV Gold Standard)
  - [`video/VIDEO-53a547/transcript.txt`](../../video/VIDEO-53a547/transcript.txt) (Bản ghi phụ đề sạch 380 phân đoạn đã vá lỗ thủng & chuẩn hóa chính tả)
