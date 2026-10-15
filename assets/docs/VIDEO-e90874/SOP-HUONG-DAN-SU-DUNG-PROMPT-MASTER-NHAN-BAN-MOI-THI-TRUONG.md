# Cẩm Nang Thực Chiến: Hướng Dẫn Sử Dụng Bộ Prompt Master Tự Động Nhân Bản Kịch Bản Sang Mọi Thị Trường

> **Mã bài học:** `VIDEO-e90874`  
> **Chủ đề thực tế:** Hướng dẫn dùng form prompt nhân bản thị trường: dán dữ liệu kênh đối thủ, trả lời bộ câu hỏi cấu hình để nhận về một Prompt Master, rồi dùng nó viết lại kịch bản video cho thị trường đích (ví dụ Nhật sang Việt, Việt sang Hoa Kỳ, Hoa Kỳ sang Hàn).  
> **Thời lượng bài giảng:** 18 phút 19 giây  
> **Thị trường mục tiêu:** 🌐 Ngoại (Global) / Đa Thị Trường  
> **Nhóm nội dung:** Prompt AI & Nhân Bản Kịch Bản  

---

## 1. NGUYÊN LÝ HOẠT ĐỘNG CỦA BỘ "PROMPT MASTER"

Form prompt nhân bản thị trường (đính kèm trong mô tả video, dạng file văn bản) dùng được cho bất kỳ thị trường nào, và dùng chung cho mọi ngách:
- **Vai trò:** Từ dữ liệu kênh đối thủ và mong muốn của người dùng, form prompt tạo ra format video / Prompt Master để nhân bản kịch bản sang thị trường đích.
- **Không dịch cứng:** Nó viết lại theo ngôn ngữ và văn hóa của thị trường đích: nhân vật, bối cảnh, cách xưng hô, giọng điệu kể chuyện. Ví dụ đem kịch bản Hàn sang Việt Nam thì giọng điệu kể chuyện phải đúng kiểu người Việt, chứ không đơn thuần dịch từ Hàn sang Việt.
- Tác giả đã train form prompt này rất kỹ và đang dùng cho các kênh của bạn mình; người dùng có thể lấy về sửa lại theo ý mình.

---

## 2. QUY TRÌNH THỰC CHIẾN

### Bước 1: Đưa dữ liệu kênh đối thủ vào form prompt
1. Copy toàn bộ thông tin kênh đối thủ (thông số...) và dán vào chỗ "dán tại đây" của form prompt. Làm 2-3 kênh đối thủ thì cứ copy hết vào để AI phân tích và học.
2. Mở một chat mới trong Claude, chạy form prompt. Có thể chụp thêm ảnh tiêu đề các video phổ biến của kênh đối thủ cho AI phân tích sâu hơn (tác giả chụp tầm 2 ảnh, mỗi ảnh khoảng 6 video).
3. Cần thêm kịch bản gốc của video đối thủ để AI học: nếu thiếu, AI sẽ nhắc và phân tích trước rồi chờ bổ sung. Lấy kịch bản của 2 video cao view nhất (hoặc mỗi kênh đối thủ 1 video). Nên bỏ chung hình ảnh và kịch bản vào chạy một lần cho đỡ tốn token.

### Bước 2: Trả lời bộ câu hỏi cấu hình (giai đoạn 2)
AI hỏi lần lượt, người dùng trả lời theo số thứ tự:
1. **Thị trường đích** muốn làm (ví dụ Việt Nam, Hoa Kỳ, Nhật).
2. **Khán giả đích**: độ tuổi cụ thể, hoặc mở rộng thêm.
3. **Giọng điệu theo vùng miền** (Nam, Bắc). Tác giả chọn từ vựng ai cũng hiểu, ví dụ dùng "dưa chuột" thay vì "dưa leo".
4. **Tên kênh và câu chào mở đầu**: đã có thì ghi vào; chưa có thì lấy phương án AI đưa ra.
5. **Đầu ra kèm theo** ngoài kịch bản: tiêu đề viral, tiêu đề trong thumbnail, form prompt ảnh.
6. **Cách viết số**: giữ nguyên số hay ghi thành chữ. AI hiện nay đọc số cứng (ví dụ 1954) được nên tác giả giữ số; riêng thị trường Nhật thì nên cân nhắc, vì giọng đọc của ElevenLabs đọc số tiếng Nhật có thể sai.

Trả lời xong bấm Enter, chờ AI tạo ra Prompt Master (trong video là bản kịch bản sức khỏe rau củ cho người Việt).

### Bước 3: Dùng Prompt Master để nhân bản kịch bản
1. Tải form Prompt Master về, mở Notepad, xóa phần "chủ đề cần viết mới" (mục đích chính là nhân bản nên không cần phần này).
2. Dán kịch bản gốc của video đối thủ vào phần kịch bản gốc, copy toàn bộ, tạo chat mới rồi chạy.
3. AI viết theo từng phần: xong phần 1 thì bấm "tiếp tục" để viết phần tiếp theo. Không thể viết cả kịch bản một lần vì chất lượng sẽ kém. Khi hoàn thành AI sẽ báo, rồi viết tiếp tiêu đề, thumbnail.
4. Chưa nhập tên nhân vật thì AI chọn ngẫu nhiên; đã có tên thì nhập vào form.

---

## 3. LƯU Ý KHI DÙNG PROMPT AI

- ❌ **Lỗi 1 — Dịch cứng:** Chỉ dịch từ ngôn ngữ này sang ngôn ngữ khác mà không đổi nhân vật, bối cảnh, cách xưng hô và giọng điệu theo thị trường đích.
- ❌ **Lỗi 2 — Thiếu kịch bản gốc:** Chỉ đưa thông tin kênh mà không đưa kịch bản video gốc thì AI chưa phân tích đầy đủ, chưa sang được giai đoạn 2.
- ❌ **Lỗi 3 — Bắt AI viết cả kịch bản một lần:** Phải chia ra nhiều phần và bấm tiếp tục, nếu không kịch bản sẽ không đạt yêu cầu.
- ⚠️ **Tốn token:** Train và yêu cầu nhiều thì AI đốt token rất nhanh; bỏ form prompt, hình ảnh và kịch bản vào chạy một lần sẽ đỡ tốn hơn.
