# QUY CHUẨN HOÀN THIỆN & NGHIỆM THU VIDEO TOÀN DIỆN (7 LỚP H2DEV GOLD STANDARD & 10 GATES A–Z)

> **Phạm vi áp dụng:** Toàn bộ **333 Video Bài Giảng Thực Chiến** trên 3 Track của hệ thống H2DEV (`148 Video H2DEV Main Track` + `140 Video Huân Academy` + `45 Video Đại Gia Mang Dép DGMD`).  
> **Cập nhật lần cuối:** `2026-10-24`  
> **Trạng thái nghiệm thu:** `333/333 Video Đạt Chuẩn 10/10 Gates (PC 1440px & Mobile 390x844)`

---

## 1. KIẾN TRÚC 7 LỚP DỮ LIỆU ĐỒNG BỘ TỪ NGOÀI VÀO TRONG (7-LAYER OUTSIDE-TO-INSIDE ARCHITECTURE)

Mọi bài học (`VIDEO-xxxxxx` / `ZOOM-xx`) bắt buộc phải đồng bộ tuyệt đối qua **7 lớp dữ liệu** không được thiếu hoặc lệch bất kỳ trường nào:

| Lớp | Tệp / Thành Phần | Trường Bắt Buộc & Quy Chuẩn |
|---|---|---|
| **Lớp 1 — Lộ Trình Học (`Modules`)** | `data/modules.json`<br>`data/modules_huan.json`<br>`data/modules_dgmd.json` | `id`, `title`, `count`, `totalDuration`, `items[]` với đầy đủ `seq` (`"01"`, `"02"`...), `sku`, `title`, `duration`, `badge`, `contentNiche`, `market`, `published_at`, `docs`, `docsCount`, `channels`. |
| **Lớp 2 — Thẻ Video Ngoài (`Videos Tab`)** | `data-tabs/videos.json`<br>`data/videos.json`<br>`data/videos_huan.json`<br>`data/videos_dgmd.json` | Hiển thị trên lưới thẻ bài học ngoài trang chủ: bắt buộc có `seq`, `sku`, `title`, `image`/`thumb`, `contentNiche`, `market[]`, `published_at`, `docs[]`, `docsCount`, `channels[]`, `free`/`is_free`, `size`/`size_mb`. |
| **Lớp 3 — Danh Mục Đầy Đủ (`Catalog`)** | `data/catalog.json`<br>`data/catalog_full.json`<br>`data/catalog_huan.json`<br>`data/catalog_dgmd.json` | Nguồn dữ liệu chính cho `player.html`: đồng bộ 1-1 với Lớp 1 & Lớp 2 về `mp4`/`file`, `thumb`/`image`, `duration_sec`, `actual_topic`, `docs[]`, `channels[]`, `tools_mentioned[]`. |
| **Lớp 4 — Media & Thumbnail (`Video Assets`)** | `video/<SKU>/<SKU>.mp4` (hoặc `.webm`)<br>`assets/thumbs*/<SKU>.png` | File Media `> 1MB`, đầy đủ 2 luồng `video` + `audio`, giải mã phần cứng GPU NVDEC (`h264_cuvid` / `vp8_cuvid` / `vp9_cuvid`) thành công tại 3 điểm (`1s`, `mid`, `end - 3s`). |
| **Lớp 5 — Phụ Đề 3 Định Dạng & Cắt Thung Lũng GPU (`Transcripts`)** | `video/<SKU>/transcript.json`<br>`video/<SKU>/transcript.srt`<br>`video/<SKU>/transcript.txt`<br>`video/<SKU>/silence.json` | Bóc tách bằng `whisper-large-v3-turbo` theo điểm cắt thung lũng năng lượng âm thanh (`gpu_chunk_bounds` từ `silence_scan.py` trên CUDA GPU): 3 file `.json/.srt/.txt` khớp 1-1 số phân đoạn, `0` lỗ thủng `>= 10s` có tiếng nói, `0` đoạn sập cửa sổ `30s` (`dur >= 14s` mà `wps < 1.3`), `0` dòng nén chữ rớt nguyên âm, `0` câu ảo giác Whisper. |
| **Lớp 6 — Phân Tích Thực Chiến AI (`Insights`)** | `video/<SKU>/insight.json`<br>`data/video_insights*.json` | `actual_topic` (`>= 15` ký tự), `key_takeaways` (`>= 4`), `edit_sop.additional` (`>= 3`, không đánh số đầu dòng), `avoid_flags` (`>= 2`), `key_timestamps` (`>= 5`, tăng dần nghiêm ngặt, `< duration`, khớp giây bắt đầu segment thật), `tools_mentioned` và `channels_mentioned` bám 100% lời thoại/tài liệu gốc (`0 ungrounded`). |
| **Lớp 7 — Hồ Sơ Bài Giảng & Tài Liệu Đọc Trực Tiếp (`Course Docs`)** | `docs/<SKU>/README.md`<br>`assets/docs*/<SKU>/*`<br>`docs/<SKU>/description.txt` | Mỗi video có tối thiểu `>= 2` tài liệu đính kèm có `readFile` (`docs/<SKU>/README.md` và `video/<SKU>/transcript.txt` + tài liệu chuyên sâu `SOP-*.md` / `master_prompt.md`), bấm nút **"Đọc trực tiếp"** mở `#docModal` hiển thị toàn văn cả trên PC và Mobile (Bottom-Sheet). |

---

## 2. QUY TRÌNH 10 CỔNG KIỂM ĐỊNH CỨNG A–Z (`scripts/verify_sku_az.js`)

Mọi video trước khi được công nhận hoàn thành bắt buộc phải chạy qua script kiểm định tự động kết hợp trình duyệt thật Playwright + GPU NVDEC:

```powershell
node scripts/verify_sku_az.js <SKU_1> [SKU_2 ...]
```

1. **Gate 1 — Media & 3-Point CUDA GPU NVDEC Stream Integrity:** Kiểm tra file `.mp4`/`.webm` tồn tại `> 1MB`, có đủ stream video + audio qua `ffprobe`, và giải mã phần cứng bằng `ffmpeg -hwaccel cuda` tại 3 mốc thời gian (`1s`, giữa video, cuối video).
2. **Gate 2 — Thumbnail & Playback trên DOM:** Mở `http://127.0.0.1:8899/player.html?sku=<SKU>` trên Playwright, kiểm tra thẻ `<video id="pv">` có `poster` hợp lệ và gọi `.play()` phát thành công.
3. **Gate 3 — Độ Phủ Phụ Đề & Chống Thủng Lỗ:** Đối chiếu số dòng `.json` = `.srt` = `.txt`, kiểm tra với `silence.json` đảm bảo `0` khoảng trống `>= 10s` có tiếng nói và `0` phân đoạn `>= 14s` bị sập mật độ từ (`wps < 1.3`).
4. **Gate 4 — Chống Nén Chữ, Ảo Giác & Lỗi ASR trên DOM `#transcriptList`:** Quét 100% dòng phụ đề render trên giao diện: `0` dòng rớt nguyên âm (`isCompressed`), `0` mẫu ảo giác Whisper, `0` lỗi chính tả tên riêng ASR (`vidIQ`, `1of10`, `Social Blade`, `Tháp Maslow`, `Dream 100`, `RPM`, `Fair Use`).
5. **Gate 5 — Grounding 100% Công Cụ & Chống Slop:** Mọi công cụ trong `tools_mentioned` phải xuất hiện trong lời thoại hoặc hồ sơ gốc của bài giảng; `0` câu văn mẫu rỗng (Slop Template).
6. **Gate 6 — Mốc Thời Gian & Tua Thật trên Player:** Kiểm tra `key_timestamps >= 5`, tăng dần nghiêm ngặt, khớp giây bắt đầu phân đoạn phụ đề thật, và bấm trực tiếp nút mốc thời gian trên DOM `#insightTimeline` kiểm chứng `video.currentTime` nhảy đúng mốc.
7. **Gate 7 — Chuẩn Định Dạng UI DOM Insight:** Kiểm tra `key_takeaways >= 4`, `#insightEditSop li >= 3` (không đánh số thừa `1. ` bên trong thẻ `<ul>`), `avoid_flags >= 2`.
8. **Gate 8 — Hồ Sơ `README.md` & Đọc Trực Tiếp Tài Liệu (`#pdocs` / `#docModal`):** Kiểm tra `docs/<SKU>/README.md` tồn tại đầy đủ, khối `#pdocs` hiển thị `>= 2` nút `[data-doc-file]`, bấm **"Đọc trực tiếp"** mở `#docModal` render nội dung `>= 200` ký tự và đóng lại mượt mà.
9. **Gate 9 — Đồng Bộ 7 Lớp Outside-to-Inside & Kênh Mẫu HTTP 200:** Đối chiếu SKU có mặt đồng nhất trong `catalog`, `videos`, `modules`; nếu bài học có kênh đối thủ (`channels`), khối `#pchannels` phải hiển thị đủ số kênh và kiểm tra mạng trực tiếp từng URL kênh đảm bảo trả về `HTTP 200` (hoặc đã gắn nhãn `DIE` / `dead: true`).
10. **Gate 10 — Nghiệm Thu Giao Diện PC (`1440x1200`) & Mobile (`390x844`):**
    - Xuất ảnh chụp toàn trang PC tại `_audit/screenshots_<track>/<SKU>.png`.
    - Chuyển viewport sang điện thoại `390x844`, kiểm tra `docOverflow <= 1px` (không tràn ngang), chiều cao nút cảm ứng `>= 36px`, `#docModal` hiển thị chuẩn Bottom-Sheet (`width 370–390px`), và xuất ảnh `_audit/screenshots_<track>/<SKU>_mobile.png`.

---

## 3. BỘ LỆNH VẬN HÀNH CHUẨN HÓA THEO TỪNG TRACK

```powershell
# 1. Quét khoảng lặng & điểm cắt thung lũng năng lượng âm thanh trên CUDA GPU
py -3 scripts/silence_scan.py --all

# 2. Bóc tách mới hoặc vá phẫu thuật các phân đoạn phụ đề lỗi bằng whisper-large-v3-turbo
py -3 scripts/retranscribe_clean_turbo.py --patch <SKU_1> <SKU_2> ...
py -3 scripts/retranscribe_clean_turbo.py --fix-only <SKU_1> <SKU_2> ...

# 3. Đồng bộ dữ liệu 7 lớp cho từng Track
node scripts/build_h2dev_data.js   # Track chính H2DEV (148 videos)
node scripts/build_huan_data.js    # Track Huân Academy (140 videos)
node scripts/build_dgmd_data.js    # Track Đại Gia Mang Dép DGMD (45 videos)

# 4. Kiểm tra Grounding & Toàn vẹn dự án
py -3 scripts/check-grounding.py --live
py -3 scripts/check-grounding-md.py --live
node scripts/sync-counts.js
node scripts/validate-project.js

# 5. Kiểm định cứng 10 Cổng A-Z trên trình duyệt thật + GPU NVDEC
node scripts/verify_sku_az.js <SKU_1> <SKU_2> ...
```
