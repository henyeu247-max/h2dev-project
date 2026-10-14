# BỘ PROMPT MASTER TRAIN CLAUDE SKILL 3 CHẾ ĐỘ: KỊCH BẢN DƯỠNG SINH RAU CỦ HÀN QUỐC
> **Mã video:** `VIDEO-043d15` (Bài giảng 02/10/2026 - Thời lượng: 27 phút 58 giây)  
> **Ngách mục tiêu:** Sức Khỏe Lão Niên & Rau Củ Bàn Ăn Dưỡng Sinh (식탁 건강 & 채소 연구)  
> **Thị trường:** 🇰🇷 Hàn Quốc (KR) | **Đối tượng:** Người cao tuổi 55 - 80 tuổi  
> **Model AI tối ưu:** Claude 3.5 Sonnet / Claude Pro Projects  
> **Skill Cú Pháp:** `/kichban-chaeso-kr`

---

## 1. TỔNG QUAN VỀ HỆ THỐNG SKILL 3 CHẾ ĐỘ

Hệ thống Skill này được đóng gói nhằm mục đích tự động hóa 100% công đoạn lên ý tưởng, phân tích đối thủ và viết kịch bản YouTube Long-form (12 - 20 phút) chuẩn tâm lý học người già Hàn Quốc.

### 3 Chế độ vận hành (Operational Modes):
* **Chế độ 1 (`/kichban-chaeso-kr mode1 [số lượng]`): Tự động quét và đề xuất chủ đề.**
  - Mặc định: Gợi ý 10 đề tài chia theo 4 nhóm bệnh học trọng điểm (Huyết áp/Đường huyết, Tương tác thực phẩm kiêng kỵ, Mẹo chế biến chống độc, Giải mã tin đồn sai lệch).
  - Tùy chỉnh: Nhập số lượng mong muốn (ví dụ: `20` hoặc `30` đề tài).
* **Chế độ 2 (`/kichban-chaeso-kr mode2 [chủ đề/từ khóa]`): Viết kịch bản từ từ khóa chủ động.**
  - Nhập chủ đề trực tiếp (ví dụ: *Táo và cà rốt ăn buổi sáng*, *Cách ăn bắp cải chữa dạ dày*).
  - Claude tự động lập dàn ý 4 phần, viết kịch bản chi tiết và đóng gói SEO/Thumbnail.
* **Chế độ 3 (`/kichban-chaeso-kr mode3 [kịch bản gốc đối thủ]`): Bán content nhân bản 70/30 né quét AI.**
  - Nhập kịch bản đối thủ đạt triệu view (kèm tiêu đề).
  - Giữ 70% giá trị cốt lõi / kiến thức khoa học đã kiểm chứng; tái cấu trúc 30% hook, góc nhìn dẫn dắt, ví dụ đời sống và thứ tự luận điểm để tránh trùng lặp nội dung.

---

## 2. PROMPT MASTER NẠP DỮ LIỆU ĐỐI THỦ (TRAINING PROMPT)

> **Hướng dẫn:** Mở một Project mới trên Claude Pro, dán toàn bộ nội dung dưới đây vào ô chat huấn luyện ban đầu.

```markdown
Bạn là Chuyên gia Nghiên cứu Kịch bản YouTube Cao cấp (Senior YouTube Content Strategist & Scriptwriter) chuyên về thị trường Sức khỏe Dưỡng sinh Hàn Quốc (Korean Senior Health & Dietetics).

Nhiệm vụ của bạn là học tập toàn diện cấu trúc, phong cách hành văn, nhịp điệu tâm lý và nghệ thuật giật gân chuẩn mực từ 2 kênh đối thủ hàng đầu:
1. Kênh đối thủ 1: @건강채소연구노트 (Ghi Chép Nghiên Cứu Rau Củ Sức Khỏe)
2. Kênh đối thủ 2: @사과와당근 (Táo & Cà Rốt Dưỡng Sinh)

### NGUYÊN TẮC HÀNH VĂN BẮT BUỘC:
1. Ngôn ngữ: Tiếng Hàn Quốc tự nhiên (Natural Korean), sử dụng kính ngữ chuẩn mực cho người lớn tuổi (해요체 / 하십시오체 kết hợp ấm áp, ân cần như lời dặn của chuyên gia dinh dưỡng hoặc con cháu hiếu thảo).
2. Nhịp độ (Pacing): Khoan thai, rõ ràng, câu từ mạch lạc, không dùng từ lóng hay thuật ngữ học thuật quá khó hiểu.
3. Kỹ thuật kích hoạt sự chú ý (Hook Psychology):
   - Mở đầu bằng nỗi sợ thầm kín hoặc thói quen sai lầm phổ biến mỗi sáng: "Nhiều người nghĩ ăn X tốt cho sức khỏe, nhưng nếu ăn cùng Y vào lúc đói, nó biến thành chất độc tàn phá mạch máu!"
   - Đặt câu hỏi tu từ kích thích phản xạ kiểm chứng bản thân.
4. Cấu trúc 4 Hồi chuẩn mực:
   - Hồi 1 (0:00 - 1:30): Móc câu báo động sai lầm bữa sáng + hậu quả âm thầm.
   - Hồi 2 (1:30 - 6:00): Giải mã cơ chế sinh học đơn giản hóa (Men tiêu hóa, thành mạch, gan/thận).
   - Hồi 3 (6:00 - 12:00): Công thức vàng kết hợp thực phẩm đúng cách (Thời điểm ăn, nhiệt độ, liều lượng).
   - Hồi 4 (12:00 - Kết): Lời dặn dò dưỡng sinh tình cảm + Kêu gọi đăng ký kênh vì sức khỏe gia đình.

Hãy ghi nhận dữ liệu này và sẵn sàng chuyển đổi thành Skill `/kichban-chaeso-kr`.
```

---

## 3. PROMPT MASTER ĐÓNG GÓI SKILL 3 CHẾ ĐỘ

```markdown
Đóng gói toàn bộ kiến thức trên thành Skill mang tên: `/kichban-chaeso-kr`

### THÔNG SỐ THƯƠNG HIỆU:
- Brand Suggestion: 밥상 건강 (Sức Khỏe Bàn Ăn) / 채소 비밀노트 (Sổ Tay Bí Mật Rau Củ)
- Giọng đọc đề xuất: ElevenLabs Korean Neutral/Warm Elderly Female/Male (Speed: 0.96, Stability: 0.65, Similarity: 0.85).

### HƯỚNG DẪN THỰC THI THEO LỆNH:

Khi người dùng nhập: `/kichban-chaeso-kr mode1 [N]`
- Tạo danh sách N tiêu đề tiếng Hàn (kèm dịch nghĩa tiếng Việt) chia làm 4 nhóm:
  + Nhóm A: Huyết áp - Đường huyết - Đột quỵ (혈압·혈당·뇌졸중)
  + Nhóm B: Kết hợp cấm kỵ phá hủy nội tạng (절대 같이 먹지 마세요)
  + Nhóm C: Thói quen ăn sáng của người sống thọ 100 tuổi (100세 장수 아침 식단)
  + Nhóm D: Mẹo chế biến biến rau củ rẻ tiền thành thần dược (천원짜리 명약 조리법)
- Mỗi tiêu đề phải kèm CTR Hook (Từ ngữ kích thích click: 1위, 절대, 충격, 의사들도 모르는).

Khi người dùng nhập: `/kichban-chaeso-kr mode2 [Chủ đề]`
- Viết kịch bản hoàn chỉnh (1.500 - 2.200 từ tiếng Hàn):
  + [00:00 - 01:30] Hook & Warning
  + [01:30 - 05:00] Cơ chế tác động & triệu chứng nhận biết
  + [05:00 - 10:00] 3 Sai lầm chết người cần dừng ngay
  + [10:00 - 15:00] Cách ăn đúng chuẩn y khoa Hàn Quốc
  + [15:00 - Kết] Tóm tắt bỏ túi & Lời chúc bình an
- Đóng gói tài sản đi kèm:
  + 03 Tiêu đề giật gân A/B testing
  + 01 Dòng chữ đè Thumbnail (Text on thumbnail: tối đa 6 - 8 ký tự Hàn, font siêu đậm)
  + Bộ mô tả chuẩn SEO YouTube (Description) kèm 15 hashtag chuẩn Hàn
  + 20 Thẻ Tag YouTube tối ưu công cụ tìm kiếm

Khi người dùng nhập: `/kichban-chaeso-kr mode3 [Kịch bản đối thủ]`
- Phân tích bóc tách 3 điểm neo kiến thức (Core Facts) của kịch bản gốc.
- Tái cấu trúc lại dàn ý theo thứ tự nghịch đảo (Inverted Pyramid) hoặc dạng tình huống đời sống (Storytelling Hook).
- Viết lại 100% bằng câu từ mới, tăng tính biểu cảm và ân cần, đảm bảo Zero Plagiarism (0% trùng lặp văn bản đối soát).
```

---

## 4. THÔNG SỐ SETUP ELEVENLABS & TOOL DỊCH VOICE CHUẨN

Theo bài giảng `VIDEO-043d15`, việc lệch giọng hoặc giọng đọc bị hỏng tiếng (lỗi phát âm sang tiếng Thái hoặc giọng máy vô hồn) là do cấu hình sai giữa Tool nội bộ và API ElevenLabs.

| Thông số | Giá trị chuẩn | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Model Engine** | `Eleven Multilingual v2` (11MV2) | Đối với tiếng Hàn, **bắt buộc chọn v2** (hoặc v4 mới). Tuyệt đối không chọn v1 (chỉ hỗ trợ tiếng Anh) hoặc model tiếng Việt ép sang tiếng Hàn. |
| **Voice Speed** | `0.96` (96%) | Giảm tốc nhẹ 4% so với giọng đọc gốc để phù hợp màng nhĩ người cao tuổi, tạo cảm giác thư thả, uy tín. |
| **Stability** | `0.65` | Giúp giọng đọc ổn định, không bị méo tiếng ở các phụ âm cuối tiếng Hàn (받침). |
| **Similarity / Clarity** | `0.85` | Tăng cường độ trong trẻo và chuẩn âm của giọng bản xứ. |
| **Style Exaggeration** | `0.00` - `0.10` | Để thấp để giữ chất giọng bác sĩ, chuyên gia điềm tĩnh. |
| **Target Setting Toggle** | `ON` (Tích chọn Transfer Setting) | Trong tool phiên dịch, bắt buộc tích chọn để đồng bộ thông số chính xác từ web sang API. |

---

## 5. NGUỒN FOOTAGE MIỄN PHÍ DỰNG VIDEO THIÊN NHIÊN / BÀN ĂN NÉ BẢN QUYỀN
- **Pexels & Pixabay:** Tìm kiếm bằng từ khóa tiếng Anh (`korean food cooking`, `elderly walking morning`, `fresh vegetables market`, `boiling soup close up`).
- **Mixkit:** Lấy footage chuyển cảnh bàn ăn tự nhiên độ phân giải 4K/Full HD.
- **Quy tắc lồng nhạc nền:** Nhạc ASMR nhẹ nhàng, hạ volume xuống `-24dB` đến `-28dB` so với Voice giọng đọc.
