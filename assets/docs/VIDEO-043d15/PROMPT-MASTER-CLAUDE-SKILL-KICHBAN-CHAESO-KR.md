# BỘ PROMPT MASTER TRAIN CLAUDE SKILL 3 CHẾ ĐỘ: KỊCH BẢN DƯỠNG SINH RAU CỦ HÀN QUỐC
> **Mã video:** `VIDEO-043d15` (Bài giảng 02/10/2026 - Thời lượng: 27 phút 58 giây)  
> **Ngách mục tiêu:** Sức Khỏe Lão Niên & Rau Củ Bàn Ăn Dưỡng Sinh (식탁 건강 & 채소 연구)  
> **Thị trường:** 🇰🇷 Hàn Quốc (KR) | **Đối tượng:** Người cao tuổi  
> **Model AI tối ưu:** Claude (khuyên dùng gói Pro)  
> **Skill Cú Pháp:** `/kichban-chaeso-kr`

---

## 1. TỔNG QUAN VỀ HỆ THỐNG SKILL 3 CHẾ ĐỘ

Hệ thống Skill này được đóng gói nhằm mục đích tự động hóa các công đoạn lên ý tưởng, phân tích đối thủ và viết kịch bản YouTube cho người già Hàn Quốc.

### 3 Chế độ vận hành (Operational Modes):
* **Chế độ 1 (`/kichban-chaeso-kr mode1 [số lượng]`): Tự động quét và đề xuất chủ đề.**
  - Mặc định: Gợi ý 10 đề tài, chia theo nhóm chủ đề (ví dụ nhóm đường huyết - mạch máu, nhóm mẹo thực hành).
  - Tùy chỉnh: Nhập số lượng mong muốn (ví dụ: `20` hoặc `30` đề tài).
* **Chế độ 2 (`/kichban-chaeso-kr mode2 [chủ đề/từ khóa]`): Viết kịch bản từ từ khóa chủ động.**
  - Nhập chủ đề trực tiếp (ví dụ: *Táo và cà rốt ăn buổi sáng*, *Cách ăn bắp cải chữa dạ dày*).
  - Claude tự động viết kịch bản, kèm tiêu đề, chữ trên thumbnail, mô tả và từ khóa.
* **Chế độ 3 (`/kichban-chaeso-kr mode3 [kịch bản gốc đối thủ]`): Bán content theo video cao view của đối thủ.**
  - Sao chép kịch bản của video cao view của đối thủ, dán kèm tiêu đề của video đó.
  - Theo kiểu bán content lấy khoảng 70%, Claude viết ra kịch bản mới.

---

## 2. PROMPT MASTER NẠP DỮ LIỆU ĐỐI THỦ (TRAINING PROMPT)

> **Hướng dẫn:** Mở một Project mới trên Claude Pro, dán toàn bộ nội dung dưới đây vào ô chat huấn luyện ban đầu.

```markdown
Bạn là Chuyên gia Nghiên cứu Kịch bản YouTube chuyên về thị trường sức khỏe dưỡng sinh cho người lớn tuổi Hàn Quốc.

Nhiệm vụ của bạn là học tập toàn diện cấu trúc, phong cách hành văn, nhịp điệu tâm lý và nghệ thuật giật gân chuẩn mực từ 2 kênh đối thủ hàng đầu:
1. Kênh đối thủ 1: @건강채소연구노트 (ghi chép nghiên cứu rau củ sức khỏe)
2. Kênh đối thủ 2: @사과와당근 (táo & cà rốt dưỡng sinh)

### NGUYÊN TẮC HÀNH VĂN BẮT BUỘC:
1. Ngôn ngữ: Tiếng Hàn Quốc tự nhiên, sử dụng kính ngữ phù hợp với người lớn tuổi, ấm áp, ân cần như lời dặn của chuyên gia dinh dưỡng hoặc con cháu hiếu thảo.
2. Nhịp độ: Khoan thai, rõ ràng, câu từ mạch lạc, không dùng từ lóng hay thuật ngữ học thuật quá khó hiểu.
3. Kỹ thuật mở đầu thu hút sự chú ý:
   - Mở đầu bằng nỗi sợ thầm kín hoặc thói quen sai lầm phổ biến mỗi sáng: "Nhiều người nghĩ ăn X tốt cho sức khỏe, nhưng nếu ăn cùng Y vào lúc đói, nó biến thành chất độc tàn phá mạch máu!"
   - Đặt câu hỏi tu từ kích thích phản xạ kiểm chứng bản thân.

Hãy ghi nhận dữ liệu này và sẵn sàng chuyển đổi thành Skill `/kichban-chaeso-kr`.
```

---

## 3. PROMPT MASTER ĐÓNG GÓI SKILL 3 CHẾ ĐỘ

```markdown
Đóng gói toàn bộ kiến thức trên thành Skill mang tên: `/kichban-chaeso-kr`

### THÔNG SỐ THƯƠNG HIỆU:
- Tên kênh và từ khóa thương hiệu: nếu chưa có, yêu cầu Claude đề xuất rồi chọn một phương án (mặc định chọn 1 để lưu nhanh).
- Giọng đọc: ElevenLabs, tốc độ 0.96.

### HƯỚNG DẪN THỰC THI THEO LỆNH:

Khi người dùng nhập: `/kichban-chaeso-kr mode1 [N]`
- Tạo danh sách N tiêu đề tiếng Hàn (kèm dịch nghĩa tiếng Việt), chia theo nhóm chủ đề (ví dụ nhóm đường huyết - mạch máu, nhóm mẹo thực hành).

Khi người dùng nhập: `/kichban-chaeso-kr mode2 [Chủ đề]`
- Viết kịch bản hoàn chỉnh bằng tiếng Hàn theo phong cách 2 kênh đối thủ đã học.
- Đóng gói tài sản đi kèm:
  + Tiêu đề
  + Chữ đè trên thumbnail
  + Mô tả YouTube
  + Từ khóa (thẻ) của video
  + Danh sách các điểm cần xác minh trong kịch bản (đúng sự thật hay không)

Khi người dùng nhập: `/kichban-chaeso-kr mode3 [Kịch bản đối thủ]`
- Nhập kịch bản của video cao view của đối thủ kèm tiêu đề của video đó.
- Viết ra kịch bản mới theo kiểu bán content (lấy khoảng 70%).
```

---

## 4. THÔNG SỐ SETUP ELEVENLABS & TOOL DỊCH VOICE CHUẨN

Theo bài giảng, việc lệch giọng hoặc giọng đọc bị hỏng tiếng (có khi ra tiếng Thái) là do cấu hình tool không khớp với thông số trên web ElevenLabs.

| Thông số | Giá trị chuẩn | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Model** | Chọn đúng model giống trên web (ví dụ `11MV2`) | Model trong tool phải khớp với model trên web; chọn sai model thì giọng có thể bị sai, nhiều lúc ra tiếng Thái. |
| **Tốc độ** | `0.96` | Đặt giống thông số tốc độ trên web. |
| **Độ ổn định âm thanh và các thông số khác** | Giống hệt trên web | Tool lấy thông số từ web qua API nên phải đặt giống 100%. |
| **Ô chuyển thông số trong tool** | Tích chọn | Phải tích vào ô cài đặt này thì tool mới nhận các thông số; không tích thì tool không nhận. |

---

## 5. NGUỒN FOOTAGE MIỄN PHÍ DỰNG VIDEO THIÊN NHIÊN / BÀN ĂN NÉ BẢN QUYỀN
- Nguồn video tự nhiên miễn phí / không bản quyền (link để trong mô tả của bài giảng): Pexels, Vecteezy, Coverr, Freepik Videos, Pixabay.
- Chủ đề táo hay cà rốt thì lấy video tự nhiên của chính sản phẩm đó rồi edit vào.
