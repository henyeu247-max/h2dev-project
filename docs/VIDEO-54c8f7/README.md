# VIDEO-54c8f7 — Full quy trình thực chiến hướng dẫn dùng Claude train prompt bất kỳ chủ đề ngách nào mình muốn và cách đóng gói Skill để dùng làm viết kịch bản, tạo ảnh, tạo thumb... (video dài hơn 1 giờ) - Quy Trình dạng tự tạo làm mới chủ đề, kịch bản, hình ảnh... 

## 1. Thông Tin Tổng Quan
- **SKU:** `VIDEO-54c8f7`
- **Tiêu đề bài giảng:** Full quy trình thực chiến hướng dẫn dùng Claude train prompt bất kỳ chủ đề ngách nào mình muốn và cách đóng gói Skill để dùng làm viết kịch bản, tạo ảnh, tạo thumb... (video dài hơn 1 giờ) - Quy Trình dạng tự tạo làm mới chủ đề, kịch bản, hình ảnh... 
- **Chủ đề thực tế:** Quy trình toàn diện huấn luyện Claude AI tạo Prompt Master đa ngách & Đóng gói Custom Skill sản xuất Kịch bản - Ảnh - Thumbnail khép kín
- **Ngách nội dung:** Prompt Engineering & Đóng Gói Skill AI (Prompt AI & Nhân Bản Kịch Bản)
- **Thị trường mục tiêu:** 🌐 Toàn cầu / 🇯🇵 Nhật Bản (Mã: `GL` / `JP`)
- **Thời lượng:** 72:33 (`4353.53s`)
- **Dung lượng MP4:** 759.1 MB
- **File Video:** [`video/VIDEO-54c8f7/VIDEO-54c8f7.mp4`](/video/VIDEO-54c8f7/VIDEO-54c8f7.mp4)
- **Ảnh đại diện:** [`assets/thumbs/VIDEO-54c8f7.png`](/assets/thumbs/VIDEO-54c8f7.png)
- **File Phụ đề bóc tách:** [`video/VIDEO-54c8f7/transcript.txt`](/video/VIDEO-54c8f7/transcript.txt)
- **Nguồn bài giảng gốc:** [https://h2dev.vn/learn/study/full-quy-trinh-thuc-chien-huong-dan-dung-claude-train-prompt-bat-ky-chu-de-ngach-nao-minh-muon-va-cach-dong-goi-skill-de-dung-de-lam-viet-kich-ban-tao-anh-tao-thumb-video-dai-hon-1-gio](https://h2dev.vn/learn/study/full-quy-trinh-thuc-chien-huong-dan-dung-claude-train-prompt-bat-ky-chu-de-ngach-nao-minh-muon-va-cach-dong-goi-skill-de-dung-de-lam-viet-kich-ban-tao-anh-tao-thumb-video-dai-hon-1-gio)

---

## 2. Kiến Trúc Huấn Luyện Claude AI Toàn Diện (3 Bộ Skill Khép Kín: Kịch Bản - Hình Ảnh - Thumbnail)

### 2.1. Lựa chọn gói cước & Model trên Claude AI
- **Gói Pro ($20/tháng):** Sử dụng model **Sonnet 4.6** là hoàn toàn đủ cho nhu cầu làm kênh thông thường. Nếu dùng liên tục chạm ngưỡng giới hạn token thì tài khoản chỉ bị tạm khóa chat khoảng **2 tiếng**, sau 2 giờ sẽ mở lại làm tiếp.
- **Gói Max ($100/tháng):** Tác giả sử dụng gói này kèm model cao nhất là **Opus 4.7** vì khối lượng công việc train rất nhiều ngách mỗi ngày; Opus 4.7 xử lý nhanh và sâu hơn nhưng cũng đốt token nhiều hơn.

### 2.2. Giai đoạn 1: Train Prompt Master & Đóng gói Skill Viết Kịch Bản (`Script`)
- **Nạp dữ liệu đối thủ:** Vào tab Phổ biến của **2 đến 3 kênh đối thủ** (ví dụ ngách tâm lý học Nhật Bản mới đăng 16 video), copy toàn bộ tiêu đề kèm đường link dán vào Claude để AI phân tích chủ đề và xu hướng viral.
- **Phân tích sâu kịch bản mẫu:** Lấy toàn bộ transcript của video viral nhất gửi vào cho Claude bóc tách 4-5 lớp (cấu trúc câu hook mở đầu, nhịp điệu, giọng văn, yếu tố giữ chân và tỷ lệ CTR).
- **Xây dựng Form Prompt Kịch Bản 4 Giai đoạn:**
  1. **Giai đoạn 1:** Đề xuất chủ đề (topic) hoặc nhận tiêu đề đầu vào kèm thời lượng mục tiêu (ví dụ 20-30 phút, trung bình 25 phút).
  2. **Giai đoạn 2:** Lập dàn ý chi tiết chia theo từng phần.
  3. **Giai đoạn 3:** Viết kịch bản đầy đủ **từng phần một** (không viết gộp một lèo để đảm bảo chất lượng sâu sắc nhất) và bắt buộc viết tự nhiên như con người, loại bỏ văn phong máy móc của AI.
  4. **Giai đoạn 4 (Voice Script):** Xuất bản hoàn thiện trơn tru, xóa sạch mọi ghi chú hay ký tự đặc biệt để copy đi tạo giọng đọc ngay, kèm câu thông báo khi đã hoàn tất.
- **Đóng gói Skill:** Yêu cầu Claude đóng gói thành file Skill, tải về đổi đuôi thành `.zip` (hoặc nén thư mục chứa file `SKILL.md` thành `.zip` để nhẹ dung lượng, không bị vượt giới hạn upload) rồi tải lên mục **Customize -> Skills** của Claude.

### 2.3. Giai đoạn 2: Train Prompt Master & Đóng gói Skill Tạo Hình Ảnh (`Image`)
- **Học phong cách hình ảnh (Style):** Chụp màn hình nhiều phân cảnh khác nhau trong video đối thủ (cả cảnh trong nhà lẫn cảnh ngoài trời, từ 5-10 ảnh trở lên) gửi cho Claude phân tích kỹ màu sắc, bố cục, nét vẽ và viền khung.
- **Tạo Nhân vật thương hiệu riêng (Brand Character):** Vì mỗi kênh có một nhân vật đại diện riêng nên không được làm giống hệt nhân vật của đối thủ. Yêu cầu Claude thiết kế nhân vật thương hiệu mới (chọn kiểu dáng, độ tuổi trưởng thành, giới tính nam/nữ, trang phục...) rồi lấy 5 prompt mẫu đem qua **Google Flow** (trước đây là Whisk, bản Ultra tạo ảnh không giới hạn) để test thử.
- **Fix bổ sung đầu vào (Input) & Đóng gói:** Yêu cầu Claude cập nhật thêm phần Input cho Skill Tạo Ảnh (nhập tiêu đề + full kịch bản, hỏi số lượng ảnh muốn tạo như **80 ảnh**, tự cân bằng theo kịch bản, tùy chọn có chèn chữ hay không) rồi đóng gói thành file `.zip` upload lên Claude.

### 2.4. Giai đoạn 3: Train Prompt Master & Đóng gói Skill Tạo Thumbnail (`Thumb`)
- Chụp khoảng **4 đến 5 ảnh thumbnail** cao view nhất của kênh đối thủ gửi cho Claude phân tích bố cục, biểu cảm nhân vật và màu sắc gây chú ý.
- Đối với thị trường Nhật Bản hoặc Hàn Quốc: Nên yêu cầu tạo **ảnh thumbnail trơn (không chèn chữ sẵn bằng AI)** để tránh lỗi nét chữ tượng hình, sau đó tự chèn chữ và clone theo phông chữ của đối thủ trong phần mềm chỉnh sửa.

---

## 3. Chiến Lược Cốt Lõi & Key Takeaways
1. Video dài hơn một tiếng hướng dẫn tự train Claude cho bất kỳ chủ đề nào rồi đóng gói thành skill; nếu nhu cầu ít thì gói 20 đô với model Sonnet 4.6 là đủ, còn tác giả dùng gói Max 100 đô với Opus 4.7 vì mạnh hơn nhưng tốn token hơn và gói thấp có thể bị khóa chat khoảng 2 tiếng.
2. Ví dụ làm trên ngách tâm lý học thị trường Nhật Bản (kênh đối thủ mới 16 video): copy dữ liệu 2 đến 3 kênh đối thủ (nên khoảng 3 kênh) kèm tiêu đề và link vào Claude, gửi kịch bản của video viral nhất để nó phân tích nhiều lớp, nhịp điệu, giọng và CTR rồi viết Prompt Master.
3. Form kịch bản gồm 4 giai đoạn (topic, dàn ý, viết đầy đủ, hoàn thiện) có yêu cầu viết như người thật chứ không viết kiểu AI, viết từng phần chứ không viết một lèo, xuất ra bản trơn không chú thích để đem đi tạo giọng đọc ngay; train đi train lại nhiều lần và hỏi thêm nếu thiếu thì Claude tự bổ sung, ví dụ thiếu đầu vào là chủ đề và độ dài.
4. Khi đóng gói skill thì đặt tên rõ ràng và đồng bộ theo thị trường, tải file về, đổi đuôi thành .zip rồi upload ở mục tạo skill, sau đó gõ dấu gạch chéo để gọi; mỗi skill (kịch bản, hình ảnh, thumbnail) nên chạy ở một chat mới riêng, và với ngách triết lý hay sức khỏe chỉ cần skill kịch bản vì ảnh và video lấy nguồn tự nhiên.
5. Với hình ảnh và thumbnail, tác giả chụp nhiều cảnh từ video đối thủ để Claude học phong cách, tạo nhân vật thương hiệu riêng khác đối thủ rồi test bằng Flow của Google (tài khoản Ultra không giới hạn tạo ảnh); skill hình ảnh hỏi cấu hình như số ảnh (ví dụ 80 ảnh) và việc chèn chữ, còn chữ trên thumbnail thị trường Nhật hay Hàn thì làm ảnh trơn rồi tự clone phông chữ đối thủ.

---

## 4. Quy Trình Sản Xuất & Kỹ Thuật Edit SOP
- **Chiến lược trọng tâm:** Train Claude tạo trọn bộ 3 form prompt (kịch bản, ảnh minh họa, thumbnail) cho ngách tâm lý học Nhật Bản rồi đóng gói thành bộ Custom Skill đồng bộ.
- **Các bước thực hiện chuẩn hóa:**
  - Copy dữ liệu (tiêu đề kèm link) 2 đến 3 kênh đối thủ ở mục phổ biến, dán vào Claude kèm câu lệnh nhờ phân tích; gửi thêm kịch bản video viral nhất để phân tích sâu, rồi yêu cầu tạo form prompt kịch bản gồm các giai đoạn chủ đề, dàn ý, viết đầy đủ, ra voice script trơn tru không chú thích.
  - Test form prompt, thiếu gì (ví dụ đầu vào là độ dài video) thì yêu cầu Claude fix, rồi bảo đóng gói thành skill; file skill đổi đuôi thành `.zip` rồi upload ở mục Skills của Claude.
  - Chụp nhiều cảnh ảnh trong video đối thủ gửi cho Claude phân tích phong cách, tạo form prompt ảnh xuyên suốt kịch bản và nhân vật thương hiệu; test trên Google Flow rồi đóng gói skill ảnh. Thumbnail làm tương tự với khoảng 4 đến 5 ảnh thumb mẫu.
  - Dùng skill kịch bản: Gõ dấu sẹt (`/`) để gọi skill, mỗi skill mở một cuộc chat mới riêng; trả lời chủ đề, thời lượng (ví dụ 25 phút), duyệt dàn ý rồi cho viết từng phần, sau đó xóa chú thích để lấy kịch bản đem tạo giọng đọc.
  - Dùng skill ảnh: Dán tiêu đề cùng kịch bản hoàn chỉnh vào chat mới, chọn cấu hình (ví dụ 80 ảnh, tự cân bằng, có hoặc không chèn chữ), cho viết trọn bộ prompt vào một file rồi copy sang Google Flow tạo ảnh hàng loạt.

---

## 5. Cảnh Báo Đỏ & Rào Chắn Phòng Thủ (Avoid Flags)
- ⚠️ **Không để AI viết theo giọng văn máy móc:** Bắt buộc cài điều kiện trong prompt yêu cầu viết tự nhiên như con người; kịch bản viết kiểu AI máy móc, lặp đi lặp lại hoặc giật tít câu view rỗng tuếch không mang lại giá trị cho người xem chắc chắn sẽ bị YouTube quét.
- ⚠️ **Không chạy chung nhiều Skill trong cùng một cửa sổ Chat:** Mỗi Skill (Kịch bản, Hình ảnh, Thumbnail) phải được gọi ở một cửa sổ **New Chat mới riêng biệt** để tránh nhiễu ngữ cảnh và tràn token; đồng thời phải đặt tên Skill đồng bộ theo ngách và mã thị trường (như `_JP`, `_US`) để không bấm nhầm.
- ⚠️ **Không bắt AI viết toàn bộ kịch bản dài trong 1 lần trả lời:** Viết một lèo sẽ làm kịch bản bị cụt và giảm chất lượng; phải yêu cầu viết lần lượt từng phần theo dàn ý.
- ⚠️ **Không sao chép y hệt nhân vật thương hiệu của đối thủ:** Phong cách nét vẽ (style) có thể học theo đối thủ nhưng nhân vật đại diện bắt buộc phải biến tấu thành nhân vật thương hiệu riêng của kênh mình.

---

## 6. Mốc Thời Gian Chi Tiết (Timestamps) & Công Cụ Sử Dụng
- **Công cụ & Nền tảng đề cập:** `Claude` (`Sonnet 4.6`, `Opus 4.7`), `Google Dịch`, `Google Flow` (Google Labs / Whisk)
- **Timeline phân đoạn thực chiến:**
  - `00:00` (`0s`) — Tổng quan quy trình tự train Claude cho mọi chủ đề, phân biệt gói $20 (Sonnet 4.6) và gói Max $100 (Opus 4.7)
  - `15:10` (`910s`) — Hướng dẫn phân tích transcript kịch bản mẫu, xây dựng Form Prompt 4 giai đoạn và đặt tên đóng gói Skill Kịch bản (`.zip`)
  - `27:59` (`1679s`) — Kỹ thuật chụp cảnh đối thủ, xây dựng Prompt Master tạo hình ảnh xuyên suốt, thiết kế nhân vật thương hiệu riêng và test trực tiếp trên Google Flow
  - `41:10` (`2470s`) — Fix bổ sung Input cho Skill Tạo Ảnh, tiếp tục train Skill Tạo Thumbnail từ 4-5 mẫu thumb đối thủ và đóng gói toàn bộ thành Skill gọi lệnh 1-click
  - `53:25` (`3205s`) — Thực chiến chạy thử trọn bộ 3 Skill trên cửa sổ chat mới: xuất kịch bản sạch tạo âm thanh, xuất 80 prompt ảnh đồng bộ và tạo ảnh thumbnail
- **Ghi chú & Mô tả bài giảng từ tác giả:**
  > vì video quá dài nên nó đang còn xử lý chất lượng HD, mấy bác đợi tí xong là video nét lại nhé ạ!
  > tài nguyên em train trong video TẠI ĐÂY nhe
