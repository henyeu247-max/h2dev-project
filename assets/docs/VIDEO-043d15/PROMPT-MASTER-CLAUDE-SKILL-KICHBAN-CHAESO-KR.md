# BỘ PROMPT MASTER TRAIN CLAUDE SKILL 3 CHẾ ĐỘ: KỊCH BẢN DƯỠNG SINH RAU CỦ HÀN QUỐC
> **Mã video:** `VIDEO-043d15` (Bài giảng 02/10/2026 - Thời lượng: 27 phút 58 giây)  
> **Ngách mục tiêu:** Sức khỏe thực phẩm — rau củ bàn ăn (táo, cà rốt, khoai tây)  
> **Thị trường:** 🇰🇷 Hàn Quốc (KR)  
> **Model AI tối ưu:** Claude (khuyên dùng gói Pro)  
> **Cách gọi skill:** bấm dấu `/` rồi gọi skill (tên lệnh skill không được nêu trong bài giảng)

---

## 1. TỔNG QUAN VỀ HỆ THỐNG SKILL 3 CHẾ ĐỘ

Hệ thống Skill này được đóng gói nhằm mục đích tự động hóa các công đoạn lên ý tưởng, phân tích đối thủ và viết kịch bản YouTube.

### 3 Chế độ vận hành (Operational Modes):
* **Chế độ 1 (gọi skill, để trống hoặc ghi "gợi ý đề tài"): tự động gợi ý chủ đề.**
  - Mặc định: gợi ý 10 đề tài, chia theo nhóm chủ đề (ví dụ nhóm đường huyết - mạch máu, nhóm mẹo thực hành).
  - Tùy chỉnh: nhập số lượng mong muốn (ví dụ 20 hoặc 30 đề tài).
* **Chế độ 2 (gọi skill rồi ghi từ khóa chủ đề): viết kịch bản từ từ khóa.**
  - Nhập chủ đề trực tiếp; Claude tự động viết kịch bản, kèm tiêu đề, chữ trên thumbnail, mô tả và từ khóa.
* **Chế độ 3 (gọi skill, dán kịch bản + tiêu đề video cao view của đối thủ): bán content.**
  - Theo kiểu bán content lấy khoảng 70%, Claude viết ra kịch bản mới.

---

## 2. HUẤN LUYỆN CLAUDE VỚI DỮ LIỆU ĐỐI THỦ (TRAINING PROMPT)

> **Hướng dẫn:** Mở một chat mới trên Claude gói Pro, cung cấp dữ liệu của 2–3 kênh đối thủ (mô tả kênh, danh sách video, thẻ từ khóa) rồi cho Claude học. Mỗi kịch bản mới làm trong một chat mới.

```markdown
Bạn đang học dữ liệu của 2–3 kênh YouTube đối thủ để phân tích cách làm.
Với mỗi kênh: phân tích kênh làm về gì, từ khó, ngách chính xác, cách viết kịch bản.
Sau khi phân tích xong, hãy ghi nhận dữ liệu này và sẵn sàng chuyển đổi thành Skill.
```

---

## 3. PROMPT MASTER ĐÓNG GÓI SKILL 3 CHẾ ĐỘ

```markdown
Đóng gói toàn bộ kiến thức trên thành một skill.

### THÔNG SỐ THƯƠNG HIỆU:
- Tên kênh và từ khóa thương hiệu: nếu chưa có, yêu cầu Claude đề xuất rồi chọn phương án 1 (mặc định, để lưu nhanh).
- Giọng đọc: ElevenLabs, tốc độ 0.96.

### HƯỚNG DẪN THỰC THI THEO LỆNH:

Khi gọi skill để trống hoặc ghi "gợi ý đề tài" (chế độ 1):
- Tạo danh sách N tiêu đề (mặc định 10), chia theo nhóm chủ đề (ví dụ nhóm đường huyết - mạch máu, nhóm mẹo thực hành).

Khi gọi skill kèm chủ đề (chế độ 2):
- Viết kịch bản hoàn chỉnh theo phong cách 2 kênh đối thủ đã học.
- Đóng gói tài sản đi kèm:
  + Tiêu đề
  + Chữ đè trên thumbnail
  + Mô tả YouTube
  + Từ khóa (thẻ) của video
  + Danh sách các điểm cần xác minh trong kịch bản (đúng sự thật hay không)

Khi gọi skill kèm kịch bản đối thủ (chế độ 3):
- Nhập kịch bản của video cao view của đối thủ kèm tiêu đề của video đó.
- Viết ra kịch bản mới theo kiểu bán content (lấy khoảng 70%).
```

---

## 4. THÔNG SỐ SETUP ELEVENLABS & TOOL DỊCH VOICE CHUẨN

Theo bài giảng, việc lệch giọng hoặc giọng đọc bị hỏng tiếng (có khi ra tiếng Thái) là do cấu hình tool không khớp với thông số trên web ElevenLabs.

| Thông số | Giá trị chuẩn | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Model** | Chọn đúng model giống trên web (ví dụ `Eleven Multilingual v2`) | Model trong tool phải khớp với model trên web; chọn sai model thì giọng có thể bị sai, nhiều lúc ra tiếng Thái. |
| **Tốc độ** | `0.96` | Đặt giống thông số tốc độ trên web. |
| **Độ ổn định âm thanh và các thông số khác** | Giống hệt trên web | Tool lấy thông số từ web qua API nên phải đặt giống 100%. |
| **Ô chuyển thông số trong tool** | Tích chọn | Phải tích vào ô cài đặt này thì tool mới nhận các thông số; không tích thì tool không nhận. |

---

## 5. NGUỒN FOOTAGE MIỄN PHÍ DỰNG VIDEO THIÊN NHIÊN / BÀN ĂN
- Nguồn video tự nhiên miễn phí (link để trong mô tả của bài giảng).
- Chủ đề táo hay cà rốt thì lấy video tự nhiên của chính sản phẩm đó rồi edit vào.
