# H2DEV AI Wildlife Documentary Production Pipeline

Pipeline sản xuất video tài liệu động vật hoang dã AI siêu thực (Photoreal AI Wildlife Survival Documentaries) theo phong cách David Attenborough / Wild Bird Survival.

---

## 1. Cấu Trúc Pipeline

```
Animal + Angle → 6-Beat Script (70-90 WPM) → Flow Image Prompts → Veo 3.1 Motion Prompts → Voice & Merge
     Input                      Step 1                  Step 2                 Step 3              Step 4
```

| Bước | Script / Công cụ | Nhiệm Vụ | Đầu Ra |
|---|---|---|---|
| **1** | `scripts/generate_wildlife_script.py` | Sinh kịch bản 6 nhịp (Suffering → Escalation → Turning Point → Wonder → Relief → Meaning) | `script.md`, `shots.json` |
| **2** | Flow / Nano Banana / Imagen | Sinh ảnh siêu thực (Photoreal African Megafauna & Parasites) | `images/*.png` |
| **3** | `scripts/generate_motion_prompts.py` | Sinh prompt video Veo 3.1 / Kling / Hailuo cho chuyển động tự nhiên | `motion_prompts.json` |
| **4** | ElevenLabs & FFmpeg | Lồng tiếng trầm ấm 70-90 WPM và lắp ráp video 1080p | `final.mp4` |

---

## 2. Công Thức 6 Nhịp (6-Beat Formula)

1. **SUFFERING / DANGER:** Mở màn trực tiếp vào nỗi đau của nhân vật chính (tai, nếp gấp da, vết cắn ký sinh). Không chào hỏi, không giới thiệu kênh.
2. **ESCALATING FAILURE:** Nhân vật đã thử mọi cách nhưng vô vọng.
3. **TURNING POINT:** Vị cứu tinh bất ngờ xuất hiện (loài cộng sinh, chim bắt ve, cá dọn dẹp).
4. **WONDER:** Cảnh giải cứu ngoạn mục (climax của video, mô tả chi tiết tương tác cộng sinh).
5. **RELIEF:** Mối đe dọa biến mất; nhân vật chính tìm lại sự bình yên.
6. **MEANING:** Quy tắc bộ ba (Rule of three) giải thích ý nghĩa sinh thái của tự nhiên.

---

## 3. Cách Sử Dụng Nhanh

```bash
py -3 scripts/generate_wildlife_script.py --animal "African Elephant" --conflict "Parasite Ticks" --duration 8 --out projects/elephant-survival
py -3 scripts/generate_motion_prompts.py --project projects/elephant-survival
```
