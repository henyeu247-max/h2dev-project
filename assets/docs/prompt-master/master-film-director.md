# MASTER PROMPT ĐẠO DIỄN PHÂN CẢNH ĐIỆN ẢNH AI 5P & KHÓA NHÂN VẬT TURNAROUND 3 GÓC

> **Tài liệu:** `assets/docs/prompt-master/master-film-director.md`  
> **Cập nhật:** 2026-10-09  
> **Ứng dụng:** Midjourney v6 · Flux.1 · Kling 3.0 · Veo 3.1 · Seedance 2.5 · Wan 2.1  
> **Mục tiêu:** Sản xuất visual điện ảnh chân thực, khóa nhân vật nhất quán 100%, vận kính 5P Camera, đạt AVD >= 50%

---

## 1. NGUYÊN TẮC ĐẠO DIỄN VISUAL ĐIỆN ẢNH AI (CINEMATIC RULES)

1. **Tuyệt đối cấm ảnh nhựa CGI:** Loại bỏ hoàn toàn phong cách hoạt hình 3D dẻo, da phát sáng vô thực hoặc mắt tròn to phi nhân bản.
2. **Ống kính thực tế (Real Optics):** Mặc định ống kính `50mm f/1.8` hoặc `85mm f/1.4` tạo độ sâu trường ảnh quang học tự nhiên (shallow depth of field).
3. **Ánh sáng kịch tính (Chiaroscuro & Natural Lighting):** Sử dụng tương phản sáng tối cao, ánh sáng tạt một bên (side lighting), ánh nắng xuyên qua cửa sổ hoặc ánh lửa bập bùng thay vì ánh sáng studio phẳng lì.

---

## 2. HỆ THỐNG VẬN KÍNH ĐIỆN ẢNH 5P CAMERA

Khi tạo motion prompt cho video AI (Veo 3.1 / Kling / Wan), bắt buộc áp dụng ngôn ngữ vận kính 5P:

| Kỹ Thuật | Tên Gọi | Mô Tả Chuyển Động | Tác Dụng Tâm Lý Khán Giả |
|:---|:---|:---|:---|
| **P1** | **Pan (Quay Ngang)** | Camera xoay ngang từ trái sang phải hoặc ngược lại trên trục cố định | Mở rộng không gian, giới thiệu bối cảnh mới, theo dõi chuyển động nhân vật |
| **P2** | **Tilt (Nghiêng Dọc)** | Camera ngửa lên (tilt up) hoặc chúi xuống (tilt down) | Thể hiện sự hùng vĩ, choáng ngợp hoặc thân phận nhỏ bé, cô độc |
| **P3** | **Zoom (Thu / Phóng)** | Ống kính zoom từ từ vào mắt nhân vật hoặc zoom chậm lùi xa (dolly zoom) | Tăng áp lực tâm lý, biểu lộ khoảnh khắc nhận ra sự thật hoặc nguy hiểm |
| **P4** | **Tracking / Dolly** | Camera di chuyển song song hoặc bám đuổi theo bước chân nhân vật | Tạo cảm giác đồng hành nhập vai, nhịp độ dồn dập, kéo người xem vào hành động |
| **P5** | **Crane / Jib (Cẩu Trục)** | Camera nâng từ góc thấp sát mặt đất lên không trung bao quát toàn cảnh | Tạo cảm giác kết thúc bi tráng, nhìn toàn cảnh số phận từ trên cao |

---

## 3. KỸ THUẬT KHÓA NHÂN VẬT TURNAROUND 3 GÓC (CHARACTER CONSISTENCY)

Để một nhân vật xuất hiện nhất quán xuyên suốt 10–20 phân cảnh mà không bị biến dạng khuôn mặt:

### Bản Thiết Kế Turnaround Sheet (Prompt Template)
```text
Full-body character model turnaround sheet, 3 viewpoints of the same person on neutral gray background:
(1) front view 0-degree, (2) three-quarter view 45-degree, (3) side profile view 90-degree.
Subject: [Mô tả chi tiết nhân vật: tuổi tác, dáng người, vết sẹo, ánh mắt, kiểu tóc].
Wardrobe: [Trang phục chi tiết: màu sắc, chất liệu vải, họa tiết, phụ kiện cố định].
Lighting: Soft directional studio light, 50mm lens photography, ultra-detailed skin pores, realistic documentary aesthetic, no CGI, no cartoon, 8k resolution --ar 16:9 --v 6.1
```

### Quy Trình Áp Dụng:
1. **Bước 1:** Sinh bản vẽ turnaround 3 góc đạt chuẩn nhận diện khuôn mặt và trang phục.
2. **Bước 2:** Cắt rời từng góc nhìn làm ảnh tham chiếu (Image Prompt / Image-to-Image / ControlNet Reference).
3. **Bước 3:** Khóa mã hạt giống (Seed) và dùng cú pháp `--cref [URL_turnaround] --cw 80` trên Midjourney.

---

## 4. CẤU TRÚC PHÂN CẢNH 5 HỒI ĐIỆN ẢNH (AVD >= 50%)

Mỗi video dài 8–15 phút được phân bổ theo 5 Hồi kịch bản:

```
[HỒI 1: HOOK NGHỊCH LÝ] (0:00 - 0:15)
  -> 3 shot cắt nhanh: Đỉnh điểm nghịch lý phá vỡ trực giác, giấu kín đáp án.
[HỒI 2: XÂY DỰNG BỐI CẢNH & THẮT NÚT] (0:15 - 3:00)
  -> Nhịp kể êm đềm, gài cắm chi tiết bí ẩn đầu tiên, giới thiệu nhân vật.
[HỒI 3: XUNG ĐỘT DÂNG CAO & KHỦNG HOẢNG] (3:00 - 6:30)
  -> Nhịp cắt dồn dập, vận kính Tracking + Zoom, biến cố lớn xảy ra.
[HỒI 4: BẺ LÁI & BẬT MÍ SỰ THẬT] (6:30 - 8:30)
  -> Cú twist bẻ cua kịch bản, giải mã nguyên nhân cốt lõi.
[HỒI 5: BÀI HỌC NHÂN SINH & KẾT ĐỌNG] (8:30 - Kết thúc)
  -> Cảnh Crane bay cao, âm hưởng lắng đọng, kêu gọi suy ngẫm và đăng ký kênh.
```

---

## 5. MASTER PROMPT TỔNG HỢP CHO VEO 3.1 & KLING

```text
Cinematic 4K scene, [P-Camera Movement]: slow tracking push-in shot.
A [Character Description with exact consistent clothing] standing in [Atmospheric Environment with volumetric fog].
Natural warm lighting cutting through dust motes, 50mm anamorphic lens, realistic depth of field, authentic documentary texture, physically accurate motion, no cartoon, 24fps --style raw
```
