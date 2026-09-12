# Story-to-Animation Pipeline

Biến một câu chuyện ý tưởng thành video hoạt hình AI hoàn chỉnh trong 5 bước,
chạy trực tiếp với Claude + kie.ai.

---

## Pipeline Overview

```
Logline → story.md → characters.json / backgrounds.json → images → shots.json → video clips → final_animation.mp4
  Step 1     Step 2            Step 3 (script)            Step 4      Step 5 (script)
```

| Bước | Skill | Công cụ | Output |
|------|-------|---------|--------|
| 1 | `generating-story-from-logline` | Claude | `story.md` |
| 2 | `extracting-characters-and-backgrounds` | Claude | `characters.json`, `backgrounds.json` |
| 3 | `generating-character-and-background-images` | Script + kie.ai (`gpt-image-2`) | `./characters/*.png`, `./backgrounds/*.png` |
| 4 | `creating-shot-list` | Claude | `shots.json` |
| 5 | `generating-composite-and-video` | Script + kie.ai (`flux-2` + `grok-imagine`) | `./clips/*.mp4` → `final_animation.mp4` |

> **Mỗi project sống trong 1 thư mục riêng dưới `projects/`** (vd: `projects/my-story/`).
> Chạy script từ trong thư mục project đó. `.env` và toàn bộ output nằm gọn trong project.

---

## Yêu cầu

- Python 3.8+
- FFmpeg (cho bước merge)
- API keys: [kie.ai](https://kie.ai) + [imgbb](https://api.imgbb.com)

```bash
pip install -r requirements.txt
```

FFmpeg:
```bash
# Mac
brew install ffmpeg

# Windows
winget install ffmpeg

# Linux
sudo apt install ffmpeg
```

---

## Cài đặt

```bash
# 1. Clone repo
git clone https://github.com/your-username/story-to-animation.git
cd story-to-animation

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Tạo .env
cp .env.example .env
# Mở .env và điền KIE_API_TOKEN + IMGBB_API_KEY

# 4. Cài skills vào Claude
# Copy thư mục skills/ vào ~/.claude/skills/
```

---

## Sử dụng

### Bước 1–2: Dùng Claude

Paste SKILL.md tương ứng vào Claude, cung cấp logline và để Claude viết story + extract characters/backgrounds.

Mỗi bước Claude sẽ dừng lại và chờ bạn duyệt trước khi tiếp tục.

### Bước 3: Generate ảnh

```bash
cd /path/to/your/project
python ~/.claude/skills/generating-character-and-background-images/scripts/generate_images.py
```

### Bước 4: Dùng Claude

Paste SKILL.md Step 4 vào Claude để tạo shots.json.

### Bước 5: Generate video

```bash
# Bulk mode — tất cả shot cùng lúc
python ~/.claude/skills/generating-composite-and-video/scripts/generate_videos.py

# Per-shot mode — từng shot một (để duyệt từng clip)
python ~/.claude/skills/generating-composite-and-video/scripts/generate_videos.py --shot shot_001
python ~/.claude/skills/generating-composite-and-video/scripts/generate_videos.py --shot shot_002

# Merge thành video cuối
python ~/.claude/skills/generating-composite-and-video/scripts/merge_clips.py
```

---

## Cấu trúc thư mục project

```
my-animation-project/
├── .env                    # API keys (không commit)
├── story.md                # Kịch bản (Step 1)
├── characters.json         # Character prompts + image_url (Step 2-3)
├── backgrounds.json        # Background prompts + image_url (Step 2-3)
├── shots.json              # Shot list + veo_prompts (Step 4)
├── characters/             # Reference images 1:1 (Step 3)
├── backgrounds/            # Background images 16:9 (Step 3)
├── composites/             # Composited scene images (Step 5)
├── clips/                  # Video clips per shot (Step 5)
└── final_animation.mp4     # Output cuối (Step 5)
```

---

## Tips

- **Voice/dialogue (QUAN TRỌNG)**: Quyết định voice strategy NGAY ở Bước 1. Nếu story
  không có dialogue + veo_prompt không ghi rõ lời thoại → video sẽ **chỉ có ambient,
  không có voice**. Muốn nhân vật nói: viết dialogue vào shots.json VÀ nhúng câu thoại
  vào veo_prompt với clause `Audio: ... says in English: "..."`. Tiếng Anh cho voice
  chuẩn nhất trên Grok Imagine.
- **Consistency**: Mô tả nhân vật thật chi tiết trong mọi veo_prompt (màu sắc, trang phục, đặc điểm nổi bật)
- **Reuse backgrounds**: Dùng lại cùng bg_id cho nhiều scene → tiết kiệm thời gian generate
- **Per-shot mode**: Dùng `--shot` để duyệt từng clip trước khi tiếp tục
- **Image model**: Mặc định `gpt-image-2` (chất lượng cao). Đổi sang `nano-banana-pro`
  bằng cách sửa 1 dòng `IMAGE_MODEL` đầu `generate_images.py`.
- **Transient errors**: Grok Imagine thỉnh thoảng trả `Internal Error` ở vài shot —
  cứ re-run, script skip clip đã xong và làm lại cái fail. Dự trù chi phí +20-30% cho retry.
- **Re-run safe**: Script bỏ qua file đã tồn tại — re-run an toàn bất cứ lúc nào.
- **Windows**: Script đã ép UTF-8 stdout nên emoji/mũi tên in không lỗi cp1252.

---


