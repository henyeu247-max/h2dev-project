# SOP THIẾT LẬP VOICE DNA (CHUẨN WPM, CLONE GIỌNG) & HÒA ÂM BGM TẦN SỐ 432HZ CHUẨN EBU R128

> **Tài liệu:** `assets/docs/SOP-AUDIO-VOICE-DNA-STANDARD.md`  
> **Cập nhật:** 2026-10-09  
> **Quy chuẩn áp dụng:** EBU R128 (-16 LUFS) · Audio Fingerprint Bypass · 100% Safe YPP Monetization  
> **Áp dụng cho:** Hệ thống sản xuất video Faceless, Bán Content, Bán Tự Động & AI Documentary H2DEV

---

## 1. NGUYÊN TẮC CỐT LÕI VỀ VOICE DNA TRONG VIDEO FACELESS

Voice DNA không đơn thuần là âm thanh đọc bài, mà là **chữ ký nhận diện thương hiệu độc bản (Brand Sonic Identity)** giúp video:
1. **Chống lỗi Inauthentic Content:** Tránh âm sắc máy móc vô hồn của text-to-speech mặc định bị thuật toán YouTube nhận diện là spam công nghiệp.
2. **Tối ưu AVD (Average View Duration) >= 50%:** Tốc độ đọc (WPM - Words Per Minute) phù hợp với nhịp thở tâm lý của tệp khán giả từng ngách.
3. **Phá vỡ Audio Fingerprint:** Hòa âm 3 tầng tách bạch ngăn chặn hệ thống Content ID quét nhầm tần số hoặc gắn cờ trùng lặp.

---

## 2. MA TRẬN TỐC ĐỘ ĐỌC (WPM) THEO TỪNG NHÓM NGÁCH NỘI DUNG

| Nhóm Ngách | WPM Chuẩn | Tông Giọng & Phong Cách | Tần Số Trầm Bổng | Thị Trường Tiêu Biểu |
|:---|:---:|:---|:---|:---|
| **Senior Wisdom / Dưỡng Sinh / Chuyện Đời** | **105 WPM** | Trầm ấm, thủ thỉ, chậm rãi, thư giãn, từ tốn | Khuyên dùng giọng nam trung niên / nữ 40+ đôn hậu | Nhật Bản (`JP`), Hàn Quốc (`KR`), Việt Nam (`VN`) |
| **Triết Lý Sống / Tâm Linh / Lịch Sử Cổ Đại** | **110 WPM** | Chiêm nghiệm, tĩnh lặng, trang nghiêm, chữa lành | Trầm sâu, nhả chữ tròn vành, ngắt nghỉ sâu (1.5s) | Nhật Bản (`JP`), US (`EN`), Việt Nam (`VN`) |
| **Lịch Sử Đồ Vật / Khoa Học Thường Nhật (Everyday)** | **120 WPM** | Tò mò, cuốn hút, hào hứng, tự nhiên, đĩnh đạc | Giọng người dẫn chuyện học thuật, phong cách David Attenborough | Hoa Kỳ (`US`), Anh (`UK`), Đức (`DE`) |
| **Quân Sự / Địa Chính Trị / Bản Đồ Chiến Lược** | **135 WPM** | Đanh thép, quyền uy, dứt khoát, khẩn cấp | Giọng nam trung vững chắc, âm lượng đều đặn, không rung | Hoa Kỳ (`US`), Toàn cầu (`EN`) |
| **Tội Phạm Kinh Tế / Dark Crime / Tài Chính Đen** | **145 WPM** | Dồn dập, căng thẳng, kịch tính, lôi cuốn, gay cấn | Nhịp đọc nhanh dồn dập, ngắt nhịp sắc lẹm | Hoa Kỳ (`US`), Châu Âu (`EU`) |

---

## 3. QUY TRÌNH CLONE GIỌNG BẢN XỨ TRÊN ELEVENLABS & MINIMAX

### Bước 1: Thu Thập & Làm Sạch Mẫu Audio Gốc (Audio Cleansing)
- **Độ dài mẫu gốc:** 5–10 phút audio đơn âm (monologue), 0 tạp âm, 0 nhạc nền.
- **Tiền xử lý:**
  - Lọc tạp âm môi trường qua Adobe Podcast AI hoặc iZotope RX De-noise.
  - Chuẩn hóa âm lượng đầu vào về `-18 LUFS RMS`.
  - Cắt bỏ các đoạn thở quá dốc hoặc click chuột.

### Bước 2: Thiết Lập Tham Số ElevenLabs / Minimax
- **ElevenLabs Voice Lab:**
  - `Stability`: **0.45 – 0.55** (cho phép biến thiên ngữ điệu tự nhiên, tránh đều đều đơn điệu).
  - `Clarity + Similarity Enhancement`: **0.75 – 0.82** (độ trung thực cao mà không bị méo tiếng rít kim loại).
  - `Style Exaggeration`: **0.05 – 0.10** (giữ cảm xúc ổn định không bị hét/thì thầm đột ngột).
  - `Speaker Boost`: **Enabled** (tăng cường độ dày của giải tần trung và trầm).
- **Minimax TTS:**
  - Sử dụng model HD Voice, điều chỉnh `Speed: 0.95x` cho Senior hoặc `1.1x` cho Crime.

---

## 4. QUY CHUẨN HÒA ÂM 3 TẦNG EBU R128 (-16 LUFS)

$$\mathbf{Master\ Audio} = \mathbf{Voiceover\ (-16\ \text{LUFS})} + \mathbf{SFX\ (-24\ \text{dBTP})} + \mathbf{BGM\ 432Hz\ (-28\ \text{LUFS})}$$

```
+-----------------------------------------------------------+
| TẦNG 1: VOICEOVER (Lớp Tiếng Nói Chủ Đạo)                |
| Target: -16 LUFS Integrated · True Peak: -1.0 dBTP        |
| EQ: High-pass cut dưới 80Hz · Boost nhẹ 2.5kHz - 5kHz     |
+-----------------------------------------------------------+
| TẦNG 2: SOUND EFFECTS - SFX (Hiệu Ứng Hành Động & Chuyển Cảnh)|
| Target: Peak -24 dBTP · Dynamics: Punchy · Panning stereo |
| Tác dụng: Attention Reset mỗi 60–90s giữ AVD >= 50%       |
+-----------------------------------------------------------+
| TẦNG 3: NHẠC NỀN BGM TẦN SỐ 432Hz (Nền Cảm Xúc Sâu)      |
| Target: -28 LUFS · Auto-ducking: -8dB khi có Voice        |
| Tác dụng: Chữa lành, giảm căng thẳng, giữ khán giả ngủ sâu|
+-----------------------------------------------------------+
```

### Chi Tiết Cài Đặt Bộ Lọc (EQ & Dynamic Processing):
1. **Low-Cut Filter (Cắt tần số thấp):** Cắt sạch giải tần `< 80Hz` trên track BGM để loại bỏ xung đột ù rền (muddy) với giọng đọc.
2. **Auto-Ducking Sidechain:**
   - Cài đặt compressor trên track Nhạc nền (BGM) nhận tín hiệu Sidechain từ Voiceover.
   - `Threshold`: `-22 dB`.
   - `Ratio`: `3:1`.
   - `Attack`: `20 ms` (giảm êm dịu, không giật cục).
   - `Release`: `800 ms` (khi dứt câu, nhạc từ từ nâng lên tạo khoảng thở cảm xúc).
3. **Nhạc nền BGM Tần Số 432Hz:**
   - Pitch-shift BGM từ chuẩn chuẩn A=440Hz sang A=432Hz (chênh lệch -31.76 cents).
   - Tần số 432Hz tạo sóng âm thư giãn não bộ, phù hợp đặc biệt cho ngách Triết lý, Dưỡng sinh, Thiền định và Lịch sử.

---

## 5. CHECKLIST 5 BƯỚC XUẤT AUDIO MASTER TRƯỚC KHI RENDER VIDEO

- [x] **1. Kiểm tra LUFS:** Chạy lufs meter đo toàn bài đạt chuẩn `-16.0 ± 0.5 LUFS`.
- [x] **2. Kiểm tra True Peak:** Không vượt quá `-1.0 dBTP` (tránh méo tiếng khi YouTube nén AAC/Opus).
- [x] **3. Kiểm tra Audio Fingerprint:** Waveform sạch, không dùng nhạc thương mại chưa cấp phép.
- [x] **4. Kiểm tra ngắt nghỉ (Pacing):** Khoảng lặng giữa các đoạn không quá 2.5s và không dưới 0.4s.
- [x] **5. Đồng bộ phụ đề (Subtitle Sync):** Mốc thời gian phụ đề khớp từng frame với âm tiết phát ra.
