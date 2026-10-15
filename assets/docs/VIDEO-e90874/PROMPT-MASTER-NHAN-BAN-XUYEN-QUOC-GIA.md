# Cẩm Nang Thực Chiến: Hướng Dẫn Sử Dụng Bộ Prompt Master Tự Động Nhân Bản Kịch Bản Sang Mọi Thị Trường

> **Mã bài học:** `VIDEO-e90874`  
> **Tiêu đề gốc:** Tặng Prompt Master Tự Nhân Bản Sang Mọi Thị Trường (bất kỳ mong muốn) | Hướng Dẫn Thực Chiến  
> **Chủ đề thực tế:** Hướng dẫn toàn diện quy trình ứng dụng bộ Prompt Master để tự động dịch thuật, chuyển ngữ văn hóa và nhân bản kịch bản video triệu view từ bất kỳ quốc gia nào sang thị trường mong muốn (Mỹ, Nhật, Hàn, Việt); công thức kết hợp tool lấy phụ đề và AI prompt.  
> **Thời lượng bài giảng:** 18 phút 19 giây  
> **Thị trường mục tiêu:** 🌐 Ngoại (Global) / Đa Thị Trường  
> **Nhóm nội dung:** Prompt AI & Nhân Bản Kịch Bản / Tự Động Hóa Sản Xuất  

---

## 1. NGUYÊN LÝ HOẠT ĐỘNG CỦA BỘ "PROMPT MASTER"

Bộ form prompt nhân bản thị trường (đính kèm dưới dạng file `.txt` trong phần mô tả video) dùng để nhân bản video, kịch bản từ thị trường này sang bất kỳ thị trường nào mong muốn, ví dụ từ Nhật về Việt Nam, từ Việt Nam sang Hoa Kỳ, từ Hoa Kỳ sang Hàn.
- **Vai trò của form prompt:** Tạo ra format cho video theo mong muốn của mình. Form prompt sẽ hỏi người dùng thị trường đích và các lựa chọn khác, người dùng nhập vào thì nó sinh ra Prompt Master. Form dùng chung cho tất cả các lần, ngách mới hay ngách khác đều được.
- **Không phải dịch cứng:** Prompt Master không dịch đơn thuần mà dịch theo ngôn ngữ và văn hóa của thị trường đích:
  - Nhân vật và bối cảnh phù hợp thị trường đích.
  - Cách xưng hô và giọng điệu kể chuyện đúng như người bản xứ. Ví dụ đem từ Hàn sang Việt Nam thì giọng kể chuyện phải đúng kiểu người Việt Nam, không phải chỉ dịch từ Hàn sang Việt.

---

## 2. QUY TRÌNH 3 BƯỚC NHÂN BẢN KỊCH BẢN THỰC CHIẾN

### Bước 1: Nạp dữ liệu kênh đối thủ để Claude phân tích
1. Mở chat mới trong Claude, dán vào form prompt toàn bộ thông tin kênh đối thủ (tên kênh, thông số...). Làm 2-3 kênh đối thủ thì cứ copy hết vào.
2. Chụp ảnh phần tiêu đề của kênh đối thủ (bấm vào tab Phổ biến), khoảng 2 ảnh, mỗi ảnh khoảng 6 video, để nó phân tích kỹ hơn.
3. Nếu thiếu kịch bản gốc, Claude sẽ nhắc; nó vẫn phân tích trước rồi chờ bổ sung. Lấy kịch bản của 2 video cao view nhất (hoặc nếu có 2 kênh đối thủ thì mỗi kênh 1 video), copy dán vào. File prompt gợi ý dùng youtube-transcript.io để lấy transcript video.
4. Có thể bỏ chung form prompt, hình ảnh và kịch bản vào chạy một lần để đỡ tốn token.

### Bước 2: Trả lời 6 câu hỏi cấu hình
Sau khi phân tích, Claude hỏi cấu hình, người dùng trả lời theo số:
1. Thị trường đích muốn làm (ghi tên thị trường, ví dụ Việt Nam).
2. Khán giả đích: cụ thể là bao nhiêu tuổi hoặc mở rộng thêm.
3. Giọng điệu theo miền nào (Nam hay Bắc); tác giả ví dụ chọn từ "dưa chuột" vì ai cũng biết.
4. Tên kênh và câu chào, phần mở đầu; có rồi thì ghi vào, chưa có thì lấy phương án nó đề xuất.
5. Output kèm theo: kịch bản, tiêu đề viral, text trong thumbnail theo từng tầng, prompt ảnh.
6. Cách xử lý số khi AI đọc: giữ số hay ghi thành chữ. AI hiện nay đọc số cứng như 1954 được rồi; nhưng với thị trường Nhật thì ElevenLabs đọc số có thể sai.

Trả lời xong bấm enter và chờ nó tạo ra Prompt Master.

### Bước 3: Dùng Prompt Master để nhân bản kịch bản
- Tải form Prompt Master về, ở phần cuối dán toàn bộ kịch bản gốc ở thị trường gốc vào để nhân bản. Ô chủ đề cần viết mới có thể xóa vì mục đích chính là nhân bản chứ không viết mới.
- Mở chat mới, dán toàn bộ rồi cho chạy. Nếu có tên nhân vật hoặc yêu cầu riêng thì nhập vào, không thì nó tự chọn tên ngẫu nhiên.
- Nó viết kịch bản theo từng phần; bấm "tiếp tục" để nó viết phần tiếp theo, cho tới khi có thông báo hoàn thành. Sau đó nó viết tiếp tiêu đề, thumbnail... nếu đã chọn ở bước 2.

---

## 3. CHECKLIST 4 LỖI PHỔ BIẾN KHI DÙNG PROMPT AI

- ❌ **Lỗi 1 — Dịch cứng:** Chỉ dịch từ ngôn ngữ này sang ngôn ngữ kia mà không đổi nhân vật, bối cảnh, xưng hô, giọng điệu theo văn hóa thị trường đích.
- ❌ **Lỗi 2 — Thiếu kịch bản gốc:** Chỉ nạp thông tin kênh mà không có kịch bản video gốc thì Claude chưa phân tích đầy đủ và chưa qua được giai đoạn 2; hãy lấy kịch bản video cao view bổ sung.
- ❌ **Lỗi 3 — Bắt viết cả kịch bản một lần:** Phải để nó chia ra nhiều phần rồi bấm tiếp tục, viết một lần cả kịch bản thì kịch bản không hay, không đạt yêu cầu.
- ❌ **Lỗi 4 — Không chốt cách xử lý số cho giọng đọc AI:** Phải chọn giữ số hay ghi thành chữ để khi tạo giọng không bị ảnh hưởng; làm thị trường Nhật mà để số thì giọng đọc có thể đọc sai.
