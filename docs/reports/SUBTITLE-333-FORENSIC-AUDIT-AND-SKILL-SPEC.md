# BÁO CÁO KIỂM TOÁN CHUYÊN SÂU A–Z LỜI THOẠI PHỤ ĐỀ 333/333 VIDEO, BỘ 10 QUY TẮC VÀNG & KIẾN TRÚC SKILL (`h2dev-subtitle-qa`)

> **Phạm vi kiểm toán:** 100% tập trung vào thành phần **Lời thoại phụ đề** (`#ptranscript`, `.json`, `.srt`, `.txt`, `silence.json`, `asr_fixes.json`, WebVTT `<track>`) trên toàn bộ **333/333 video** (`148` H2DEV + `140` Huân Academy + `45` DGMD) và **67,268 segments**.
> **Trạng thái kiểm chứng:** `CONFIRMED` (Kiểm toán định lượng 333/333 SKU + Đọc tay từng dòng trên 29 video mẫu đại diện + Đo kiểm DOM/Runtime `#ptranscript` trên `player.html`).

---

## 1. BẢNG TỔNG HỢP ĐỊNH LƯỢNG 333/333 VIDEO (148 H2DEV · 140 HUÂN · 45 DGMD)

| Mã Quy Tắc | Hạng mục Kiểm toán Lời thoại Phụ đề | H2DEV (`N/148`) | Huân (`N/140`) | DGMD (`N/45`) | Tổng (`N/333`) | Đánh giá |
|---|---|---|---|---|---|---|
| **G1.a** | Đủ 3 tệp nguồn (`transcript.json`, `.srt`, `.txt`) & khớp 1-1 số dòng (`segments == srt == txt`) | `148/148` | `140/140` | `45/45` | **333/333** (`100%`) | `PASS` |
| **G1.b** | Đồng bộ trường nội bộ `total_segments` & `full_text` trong `transcript.json` | `148/148` | `138/140` (`2` lệch) | `45/45` | **331/333** (`2` lỗi) | `WARN` |
| **G1.c** | Tệp `transcript.txt` tương thích với `txtFallback()` trong `player-main.js:714` | `0/148` | `0/140` | `0/45` | **0/333** (`100%` chết fallback) | `FAIL` |
| **G2.a** | Khớp thời lượng `duration` với `ffprobe` & `videos*.json` (`<= 1.5s`), `0 <= start < end` | `148/148` | `140/140` | `45/45` | **333/333** (`100%`) | `PASS` |
| **G2.b** | Không chồng lấn mốc thời gian (`segments[i].end <= segments[i+1].start`) | `144/148` (`4` SKU / `14` cặp) | `140/140` | `45/45` | **329/333** (`4` SKU lỗi) | `FAIL` |
| **G3** | Có `video/<SKU>/silence.json` chạy chuẩn `"engine": "cuda_gpu"` (`STFT + Valley Split`) | `148/148` | `91/140` (`49` CPU cũ) | `45/45` | **284/333** (`49` SKU thiếu GPU) | `PARTIAL` |
| **G4.a** | Không có khoảng trống thủng lỗ `Gap >= 10.0s` khi `silent_share < 0.80` | `148/148` | `140/140` | `45/45` | **333/333** (`100%`) | `PASS` |
| **G4.b** | Không có khoảng trống thủng lỗ giáp ranh `8.5s <= Gap < 10.0s` khi `silent_share < 0.80` | `142/148` (`6` SKU / `10` lỗ) | `121/140` (`19` SKU / `21` lỗ) | `43/45` (`2` SKU / `2` lỗ) | **306/333** (`27` SKU / `33` lỗ) | `FAIL` |
| **G5.a** | Không bị băm vụn câu (`1–2 từ / 7.8s`, đứt ngoặc `[...]`) hoặc tóm tắt `300s–1200s` để lách Gate 3 | `141/148` (**`7` SKU hỏng nặng**) | `140/140` | `45/45` | **326/333** (**`7` SKU hỏng cấu trúc**) | `FAIL NGHIÊM TRỌNG` |
| **G5.b** | Không có segment "Bức tường chữ" (`dur >= 14.0s` hoặc `>= 45 từ`) & Không nén tốc độ (`wps > 10.0`) | `2,631` segs `>=14s` toàn hệ thống | `115` SKU `>25s` · `18` segs `>10 wps` | `31` SKU `>25s` · `1` seg `23.4 wps` | **2,631 segs dài · 19 segs siêu nhanh** | `WARN / FAIL` |
| **G6.a** | Không lặp segment liên tiếp (`seg[i] == seg[i-1]`) & Không lặp từ `>= 3–4` lần liên tiếp | `7` SKU lặp từ (`62x "tí"`) | `33` SKU lặp câu (`61` cặp) | `14` SKU lặp câu (`49` cặp) | **54/333 SKU bị lặp câu/từ** | `FAIL` |
| **G6.b** | Không có ký tự ngoại lai (Cyrillic/Hàn/Nhật) hoặc dịch máy vô nghĩa từ tiếng Anh demo | `142/148` (`6` SKU lỗi) | `140/140` | `45/45` | **327/333** (`6` SKU lỗi) | `FAIL` |
| **G7** | Không có câu ảo giác Whisper & Không lặp liên tiếp dòng placeholder `[Thao tác thực hành...]` | `55` SKU có `204` dòng `[...]` | `1` SKU ảo giác bác sĩ (`VIDEO-42f5cf`) | `6` SKU lặp dòng `[Thực hành...]` | **62/333 SKU cần chuẩn hóa** | `WARN / FAIL` |
| **G8.a** | Không bị **Bẫy nhân đôi hậu tố/tiền tố** do `asr_fixes.json` (`Fair Usese`, `YouTube Camppp`, `ChatGPTT`...) | `148/148` | `131/140` (`9` SKU / `33` segs) | `40/45` (`5` SKU / `13` segs) | **319/333** (**`14` SKU / `46` segs hỏng**) | `FAIL NGHIÊM TRỌNG` |
| **G8.b** | Sạch lỗi sai tên công cụ AI/YouTube/MMO & Phương ngữ Nam Trung Bộ (ASR Typos) | `62/148` (`86` SKU còn lỗi) | `114/140` (`26` SKU còn lỗi) | `19/45` (`26` SKU còn lỗi) | **195/333** (**`138` SKU còn lỗi ASR**) | `FAIL` |
| **G10** | UI Player `#ptranscript`: Click-to-seek chính xác, tải file `<SKU>.srt`/`.txt`, MIME `.srt`/`.vtt` | Lệch seek trên **45,674 / 67,268 segs (`67.90%`)** + Trùng tên `transcript.srt`/`.txt` trên **333/333 SKU** | | | **0/333 đạt trọn vẹn UI/Export** | `FAIL` |

---

## 2. PHÂN TÍCH SÂU 7 NHÓM LỖI GỐC RỄ (ROOT CAUSES) TỪ FILE NGUỒN ĐẾN UI PLAYER

### 2.1. Lỗi Cấu trúc Nghiêm trọng Nhất ở Nhánh H2DEV: 7 SKU Bị "Băm Vụn Câu" hoặc "Tóm Tắt 20 Phút/Câu" Để Lách Gate 3
1. **`VIDEO-8e0275` (Bài giảng dài `5294.06s` ~ 88 phút nhưng chỉ có đúng 7 segments!):**
   - Toàn bộ 88 phút bài giảng chỉ có 7 dòng tóm tắt cấp chương, mỗi segment kéo dài từ **`300s` đến `1200s` (20 phút/câu)**:
     - `#1 [0.0 -> 300.0]`: `[Phần 1: Khởi động] Mở Photopea (Web Photoshop) -> Thiết lập canvas 16:9 chuẩn YouTube Thumbnail.`
     - `#2 [300.0 -> 900.0]`: `[Phần 2: Thiết kế khung Nonagon]...`
     - `#3 [900.0 -> 1800.0]` · `#4 [1800.0 -> 2700.0]` · `#5 [2700.0 -> 3900.0]` (`1200s`) · `#6 [3900.0 -> 4800.0]` · `#7 [4800.0 -> 5294.06]`.
   - **Vì sao Gate 3 (`verify_sku_az.js`) bỏ lọt?** Do `silence.json` đo `silence_total_sec = 5266.2s / 5294.1s`, nên `talk = dur * (1 - sil) < 10.0s`, lọt qua điều kiện `if (talk >= 10.0 && wps < 1.3)`.
2. **4 SKU (`VIDEO-ed1be9`, `VIDEO-b559c8`, `VIDEO-b96929`, `VIDEO-a348a5`) bị hàm `patch_existing` trong `retranscribe_clean_turbo.py` (dòng 419–433 & 475–485) băm nát câu chú thích dài thành 566 segments chỉ có 1–2 chữ (mỗi mảnh `~7.8s`):**
   - Khi gặp câu mô tả thao tác màn hình dài (bị dính `dur >= 14.0s`), thuật toán cũ đã chia thời lượng cho `7.5s` để tạo ra hàng chục mảnh `~7.8s` (`< 14.0s` để qua mặt Gate 3) rồi chia đều từng từ vào mỗi mảnh, cắt đứt đôi cả dấu ngoặc vuông `[...]`:
     - **`VIDEO-ed1be9`** (`253` segments 1 từ, `22` ngoặc đứt đôi): `#30 [91.87 -> 99.73]: "[Thực"` | `#31 [99.73 -> 107.60]: "hành"` | `#32 [107.60 -> 115.47]: "Photopea]"` | `#33: "Mở"` | `#34: "Photopea"`.
     - **`VIDEO-b559c8`** (`144` segments 1 từ, `12` ngoặc đứt đôi): `#5: "[Thực"` | `#6: "hành"` | `#7: "tạo ảnh"` | `#8: "AI]"`.
     - **`VIDEO-b96929`** (`119` segments 1 từ, `10` ngoặc đứt đôi): `#9: "[Thực"` | `#10: "hành"` | `#11: "CapCut"` | `#12: "Bước"` | `#13: "1]"`.
     - **`VIDEO-a348a5`** (`50` segments 2–3 từ, `12` ngoặc đứt đôi): `#5: "[Thực hành Bước"` | `#6: "1] Truy cập"`.
3. **2 SKU (`VIDEO-ba3904` seg `#66–68` và `VIDEO-c1bd51` seg `#325–328`) bị cắt vụn câu placeholder `[Đoạn nói nhanh — phụ đề không bóc tách được rõ nghĩa, mời nghe trực tiếp]` thành 3–4 mảnh rời rạc.**

### 2.2. Bẫy Nhân đôi Hậu tố / Tiền tố (`Prefix/Suffix Double-Replacement Corruption`) trên 14 SKU (9 Huân + 5 DGMD — 46 Segments)
- **Nguyên nhân:** Trong `video/<SKU>/asr_fixes.json`, các cặp thay thế như `("Fair U", "Fair Use")`, `("YouTube Cam", "YouTube Camp")`, `("ChatGP", "ChatGPT")`, `("nền tả", "nền tảng")`, `("nhạy cả", "nhạy cảm")`, `("xếp hạ", "xếp hạng")`, `("ợp lý", "hợp lý")` có vế trái nằm trong vế phải. Khi chạy `--fix-only` nhiều lần, `.replace(w, r)` nhân đôi hậu tố/tiền tố:
  - **9 SKU Huân (33 segments):**
    - `VIDEO-fb7e44` (17 segs): `"YouTube Camppp"` / `"YouTube Campp"` (`#340, 341, 361, 403, 416, 417, 420, 423, 559, 572, 584, 677, 678, 689, 692, 832`), `"Nối vào con GAA"` (`#492`).
    - `VIDEO-277335` (5 segs): `"Fair Usese"` (`#6, 176`), `"nhạy cảmmm"` (`#47, 57, 194`).
    - `VIDEO-ebc8ea` (3 segs): `"nền tảngng"` (`#210, 270, 271`).
    - `VIDEO-966059` (1 seg): `"nền tảngngng"` (`#504`).
    - `VIDEO-6a7a0e` (2 segs): `"Premieree"` (`#439, 456`).
    - `VIDEO-840a95` (2 segs): `"4444 phút"` (`#47`), `"444 phút"` (`#49`).
    - `VIDEO-2167d7` (1 seg): `"Fair Usese"` (`#117`).
    - `VIDEO-b267fe` (1 seg): `"Chọn Individuall"` (`#224`).
    - `VIDEO-7ff327` (1 seg): `"GPMLoginLogin"` (`#775`).
  - **5 SKU DGMD (13 segments):**
    - `VIDEO-23723f` (6 segs): `"ChatGPTT"` (`#6, 18, 19, 79, 188, 212`).
    - `VIDEO-54dd2a` (4 segs): `"xếp hạngng"` (`#1, 111, 123`), `"hhợp lý"` (`#91`).
    - `VIDEO-ca7ecf` (2 segs): `"sản xuất Reelss"` (`#1`), `"bị bỏ hoangng"` (`#36`).
    - `VIDEO-5a4861` (1 seg): `"tương tác khủngng"` (`#3`).
    - `VIDEO-53a547` (1 seg): `"nhấn ttô viền này"` (`#238`).

### 2.3. Lỗi Chồng lấn Mốc thời gian (`Overlap`) & Khoảng trống Giáp ranh (`8.5s <= Gap < 10.0s`)
- **4 SKU H2DEV có 14 cặp segment chồng lấn (`segments[i].end > segments[i+1].start`):**
  - `VIDEO-0be6c9` (7 cặp chồng `0.94s–1.50s` tại seg `#6/#7`, `#13/#14`, `#23/#24`, `#27/#28`, `#46/#47`, `#61/#62`, `#79/#80` kèm lặp chữ ở ranh giới).
  - `VIDEO-a85eac` (5 cặp chồng `0.76s–1.50s` tại seg `#3/#4`, `#13/#14`, `#59/#60`, `#83/#84`, `#87/#88`).
  - `VIDEO-cb907b` (1 cặp tại seg `#460/#461`), `VIDEO-8bc3ce` (1 cặp tại seg `#9/#10`).
- **27 SKU (6 H2DEV + 19 Huân + 2 DGMD) có 33 khoảng trống từ `8.50s` đến `9.96s` (`silent_share < 0.80`):**
  - Bị bỏ lọt do `fill_transcript_gaps.py` đặt `MIN_GAP_SEC = 8.5s` nhưng `retranscribe_clean_turbo.py` và `verify_sku_az.js` chỉ quét từ `>= 10.0s` (và `audit_videos_v2.py` quét từ `>= 20.0s`).
- **49/140 SKU Huân Academy vẫn dùng `silence.json` CPU thế hệ cũ** (chưa có `"engine": "cuda_gpu"` và `"gpu_chunk_bounds"`).

### 2.4. Lỗi Lặp Câu, Lặp Từ, Ký tự Ngoại lai & Dịch máy Vô nghĩa
- **Lặp từ / Lặp câu:**
  - `VIDEO-e0e9cd` seg `#166–167` (`927.99s -> 941.32s`): Whisper kẹt vòng lặp từ `"tí"` **62 lần liên tiếp** suốt 13.3 giây; seg `#240–242` xuất hiện 3 dòng rác `"Cállu, v"`, `"Cállu,"`, `"v"`.
  - `33` SKU Huân (`61` cặp) và `14` SKU DGMD (`49` cặp) có 2–6 segments liên tiếp giống hệt nhau (`"ừ ừ"` 6 lần ở `VIDEO-9607ea` & `VIDEO-0963e3`; `"Huy hồi"` 6 lần ở `VIDEO-a152a6`; `"Má"` 5 lần ở `VIDEO-af2c29`; lặp 3–5 lần liên tiếp câu chú thích `[Thực hành thao tác...]` ở `VIDEO-d19b55`, `VIDEO-f2ebfb`).
- **Ký tự ngoại lai & Dịch máy vô nghĩa khi phát video mẫu tiếng Anh:**
  - `VIDEO-e0e9cd` seg `#247`: chữ Cyrillic `аб` trong `"tабlet"`; seg `#208–229` dịch máy tiếng Anh sang tiếng Việt vô nghĩa (`"Các bạn giết chân Jake như một lửa bóng"`).
  - `VIDEO-0c72ab` seg `#482–489`: dịch máy vô nghĩa (`"Dạng lửa, phát triển, cửa sổ nở lên một chỗ"`).
  - `VIDEO-8b69c9` seg `#78–80`: lặp 3 lần câu trộn chữ Hàn `"Quan절 염 là ẩm gối đáy."`.
  - `VIDEO-5d54d0` seg `#1099–1101`: lặp 3 lần nguyên đoạn tiếng Nhật suốt 20 giây.
  - `VIDEO-42f5cf` (Huân) seg `#155–156`: lặp 2 lần câu ảo giác `"Các bác sĩ đã tìm ra những bác sĩ có thể giúp đỡ nguy hiểm của bệnh nhân."`.

### 2.5. Lỗi Từ điển ASR Phương ngữ Nam Trung Bộ (H2DEV) & Thuật ngữ MMO/AI (Huân + DGMD) trên 138/333 SKU
- **Nhánh H2DEV (`86/148` SKU):** Giảng viên phát âm phương ngữ Nam Trung Bộ (`a->e`, `ê->ơ`, `o/ô->u`, `ư->ơ`), sinh ra hàng trăm lỗi đồng âm:
  - `cái cơn / 2 cơn` -> `cái kênh / 2 kênh` (`127` segs / `60` SKUs)
  - `cơ loan / cờ lon / cộng loan` -> `clone` (`62` segs / `26` SKUs)
  - `từ khó chính / từ khó phụ` -> `từ khóa chính / từ khóa phụ` (`49` segs / `19` SKUs)
  - `trên con / tự trên / trên form` -> `train con / tự train / train form` (`47` segs / `26` SKUs)
  - `con Cloud / con Clock / con Claw / con Caleo / Cloud Code` -> `con Claude / Claude AI / Claude Code` (`44` segs / `11` SKUs)
  - `11lab / Eleven Lab` -> `ElevenLabs` (`42` segs / `24` SKUs)
  - `cái ngắt / chủ đề ngắt` -> `cái ngách / chủ đề ngách` (`35` segs / `22` SKUs)
  - `tỷ lợi` -> `tỷ lệ` (`35` segs / `27` SKUs) · `phô mô` -> `FOMO` (`19` segs) · `ngách sức khỉ / sức khí` -> `ngách sức khỏe` (`17` segs) · `người quê` -> `người que` (`9` segs) · `họp hình` -> `hoạt hình` (`9` segs) · `sao chip` -> `sao chép` (`8` segs) · `thông bờ / ảnh thương mụn / âm thâm` -> `thumbnail` (`8` segs).
- **Nhánh Huân & DGMD (`52/185` SKU):**
  - `câu form / một form / copy form / tạo ra form` -> `prompt` (`10` SKUs)
  - `16.9` / `9.16` -> `16:9` / `9:16` (`35` segs / `12` SKUs)
  - `nhạc nền solo` -> `nhạc nền Suno` · `Từ khóa Slope` -> `Slop` · `từ khóa Contact` -> `Context` · `triệu sắp` -> `triệu sub` · `thẻ tác` -> `thẻ tag` · `bắt chen` -> `bắt trend`.

### 2.6. 6 Lỗi Giao diện, Tương tác & Tải xuống tại `#ptranscript` (`player.html`, `player-main.js`, `server.js`)
1. **Lỗi toán học làm nhảy lùi câu trước khi bấm vào dòng phụ đề trên `45,674 / 67,268` segments (`67.90%`):**
   - `player-main.js:750` gán `const start = Math.floor(s.start || 0);` vào `data-seek="${start}"`.
   - Trong khi đó, `timeupdate` (`player-main.js:890`) kiểm tra `if (t >= (s.start - 0.3) && t < nextStart)`.
   - Với mọi segment có phần thập phân của `s.start > 0.300` (**chiếm 67.90% toàn bộ câu thoại**), khi người học bấm vào dòng `i`, video bị tua về `Math.floor(s.start) < s.start - 0.3`, rơi vào miền của câu `i - 1` và **tô sáng nhầm câu phía trước** trong `0.3s–0.7s`!
2. **`txtFallback()` trong `player-main.js:714-729` là Dead Code trên `333/333` video (`100%`):**
   - Regex `/^\[(\d{2}):(\d{2}):(\d{2}).../` đòi hỏi tiền tố `[HH:MM:SS - HH:MM:SS]`, nhưng `333/333` file `transcript.txt` hiện tại là plain text không có timestamp -> nếu `.json` lỗi, fallback trả về `null` trên cả 333 bài.
3. **Tải file `.SRT` và `.TXT` bị trùng tên `transcript.srt` / `transcript.txt` trên cả 333 bài & Thiếu MIME `.srt`/`.vtt`:**
   - `player-main.js:708-709` chưa gán `.setAttribute('download', resolvedSku + '.srt')` / `'.txt'`.
   - `server.js:46-75` thiếu `.srt` và `.vtt` trong bảng `MIME` và `COMPRESSIBLE_EXTS`.
4. **Thiếu `srclang="vi"` trên `<track kind="captions">` (`player-main.js:695-700`).**
5. **Chiều cao nút `#btnDownloadSrt` / `#btnDownloadTxt` trên Desktop chỉ đạt `28px` (`< 36px` chuẩn nút hành động).**

---

## 3. ĐÁNH GIÁ HỆ THỐNG SKILL & QUY TRÌNH PHỐI HỢP 5 SKILL CHUẨN (`h2dev-subtitle-qa`)

### 3.1. Nhận định Kho Skill Hiện tại
- Qua rà soát toàn bộ `100` skill sẵn có trong hệ thống (`~/.agents/source/skills/`), **chưa có skill nào bao phủ trọn vẹn quy trình QA Lời thoại phụ đề tiếng Việt pha thuật ngữ MMO/AI**.
- Em đã thiết kế, kiểm định `lint_skills.py` (`0 lỗi, 0 cảnh báo`) và đồng bộ thành công skill mới **`h2dev-subtitle-qa`** (`~/.agents/source/skills/h2dev-subtitle-qa/SKILL.md`) ra toàn bộ 8 nền tảng agent (`793/793` bản sao khớp byte-level).

### 3.2. Ma trận Phối hợp 5 Skill Khi Thực thi Tối ưu Lời thoại Phụ đề

| Thứ tự | Tên Skill | Vai trò trong Chuỗi Kiểm toán & Sửa chữa Lời thoại Phụ đề | Công cụ / Script Thực thi |
|---|---|---|---|
| **Bước 1** | **`agency-video-streaming-engineer`** | Kiểm tra container MP4, `ffprobe` thời lượng thực (`real_dur`), phát hiện lệch gói âm thanh trước khi giải mã GPU | `ffprobe`, `silence_scan.py` (`NVDEC h264_cuvid` + `PyTorch CUDA STFT`) |
| **Bước 2** | **`h2dev-subtitle-qa`** *(Skill trung tâm mới)* | Thực thi **10 Quy tắc Vàng (`G1`–`G10`)**: quét `silence.json` GPU, vá lỗ `>= 8.5s`, chống băm vụn câu lách Gate, khử nhân đôi hậu tố ASR, nạp từ điển Phương ngữ Nam Trung Bộ + MMO/AI, đồng bộ `.json`/`.srt`/`.txt`/WebVTT | `silence_scan.py`, `fill_transcript_gaps.py`, `retranscribe_clean_turbo.py`, `verify_sku_az.js` |
| **Bước 3** | **`bulk-classify`** | Phân loại ngữ nghĩa đa luồng trên hàng chục nghìn segment bằng `TypeSafe Jev 1.14` (`classifier__classify_dimensions` / `classifier__review_uncertain`) để lọc nhanh câu dịch máy vô nghĩa, câu lắp bắp hoặc từ đồng âm sai ngữ cảnh | `mcp-pool` -> `classifier__classify_dimensions`, `classifier__score_and_critic` |
| **Bước 4** | **`content-review`** | Đọc tay từng dòng (Manual Line-by-Line Review) trên các đoạn nghi vấn, chuẩn hóa thuật ngữ chuyên ngành và đối soát chống bịa đặt công cụ ngoài lời thoại (`H2DEV-SCAR-030`) | Đọc tay trực tiếp + `check-grounding.py` + `video/<SKU>/asr_fixes.json` |
| **Bước 5** | **`agency-reality-checker` + `ui-ux-standard`** | Kiểm định độc lập cả lớp **SOURCE** (4 file trên đĩa) lẫn lớp **RUNTIME DOM** (`#ptranscript` trên PC `1440x900` & Mobile `390x844`): click-to-seek chính xác mili-giây, auto-scroll, tải `<SKU>.srt`/`.txt` | Playwright thật + `verify_sku_az.js` + `validate-project.js` |
