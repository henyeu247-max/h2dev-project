# H2DEV Everyday History & True Origin Production Pipeline

Pipeline sản xuất video tài liệu lịch sử đồ vật đời thường (Everyday History & True Origin Stories) cho thị trường US/UK.
Cấu trúc 3 Hồi chống thoát view, đối soát bảo tàng thật (British Museum, Smithsonian, Anatolian) và lắp ráp MP4 với hiệu ứng chuyển động Ken Burns.

---

## 1. Cấu Trúc Pipeline

```
Object Name → Script (3 Hồi) → Voiceover (130-145 WPM) → Images/B-Roll → Ken Burns Pan/Zoom → final.mp4
  Input          Step 1                 Step 2                    Step 3                Step 4
```

| Bước | Script | Nhiệm Vụ | Đầu Ra |
|---|---|---|---|
| **1** | `scripts/generate_everyday_history.py` | Sinh kịch bản 3 Hồi + trích dẫn bảo tàng | `script.md`, `prompts.json` |
| **2** | Voice AI | Thu giọng đọc nam/nữ trầm ấm Anh-Mỹ chuẩn EBU R128 (-16 LUFS) | `voice/voice.mp3` |
| **3** | Image/B-Roll AI | Sinh ảnh chiaroscuro 16:9 hoặc thu thập B-roll công cộng | `images/*.png` |
| **4** | `scripts/assemble_history_video.py` | Lắp ráp video tự động bằng FFmpeg với Ken Burns mượt mà | `final.mp4` |

---

## 2. Yêu Cầu Kỹ Thuật

- Python 3.8+
- FFmpeg đã cài đặt trong PATH hệ thống (`ffmpeg -version`)

```bash
pip install -r requirements.txt
```

---

## 3. Hướng Dẫn Sử Dụng Nhanh

### Bước 1: Sinh kịch bản đồ vật
```bash
py -3 scripts/generate_everyday_history.py --object "mirror" --duration 10 --out projects/the-mirror
```

### Bước 2: Chuẩn bị âm thanh và hình ảnh
- Đặt file âm thanh lồng tiếng vào `projects/the-mirror/voice/voice.mp3`.
- Đặt các ảnh hiện vật/bối cảnh tương ứng vào `projects/the-mirror/images/01.png`, `02.png`,...

### Bước 3: Lắp ráp video hoàn chỉnh
```bash
py -3 scripts/assemble_history_video.py --project projects/the-mirror
```
