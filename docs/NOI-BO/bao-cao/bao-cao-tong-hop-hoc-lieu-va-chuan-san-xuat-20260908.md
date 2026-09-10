# Tổng hợp học liệu và chuẩn sản xuất YouTube AI không lộ mặt

Ngày lập: 08/09/2026. Người đọc chính: chủ dự án H2DEV. Bản này tổng hợp phần nguồn đã đọc và đối chiếu; không phải chứng nhận mọi file trong dự án, mọi lời giảng hoặc mọi video đã chính xác.

## 1. Kết luận để quyết định

Kho học liệu có giá trị nhất ở **cách tìm mẫu nội dung, tách chủ đề nhỏ, chuyển ý tưởng thành lời kể và tổ chức ảnh–giọng–dựng**. Kho chưa chứng minh một hệ thống tự động hoàn toàn, xác suất kiếm tiền gần chắc chắn hay một ngách luôn ít cạnh tranh. Những buổi thực hành đã kiểm tra còn có nhiều thao tác chọn ảnh, sửa hình, sắp lớp, căn timeline và phụ đề bằng tay.

Hướng phù hợp để phát triển tiếp là **một kênh có lời hứa rõ với khán giả, từng tập có nghiên cứu riêng, giọng kể dễ nghe và hình ảnh phục vụ nội dung**. AI tạo nguyên liệu; người chịu trách nhiệm biên tập phải xác nhận nội dung và bản xuất. Chi phí phải tính cả thời gian kiểm chứng, sửa giọng, sửa hình và những lần sinh thất bại.

Ưu tiên thử nghiệm của em vẫn là lịch sử đời sống/đồ vật và các cơ chế tự nhiên hoặc công nghệ có phạm vi hẹp. Bible giải nghĩa và nội dung suy ngẫm cho người trưởng thành là lựa chọn có điều kiện chuyên môn/ngôn ngữ. Đây là **thứ tự phân bổ công sức đề xuất**, nối với báo cáo thị trường 06/09; không phải số đo thị trường mới ngày 08/09 hay bảng xác suất thành công.

Ba việc cần hoàn thành trước khi mở rộng sản xuất: sửa chuẩn kiểm chứng kịch bản; chặn các lỗi pipeline gây xuất thiếu/tính thiếu chi phí; thiết kế thử nghiệm một thị trường có thể kiểm ngôn ngữ thực chất. Không chọn thị trường chỉ vì một bảng RPM hay vì đã có skill cho thị trường đó.

## 2. Đã đọc đến đâu, giới hạn ở đâu

| Hạng mục | Phạm vi thực sự | Ý nghĩa / phần chưa xong |
|---|---|---|
| Lời chép video | Đã đọc đầy đủ 129/129 TXT hiện có, khoảng 271.819 đơn vị tách khoảng trắng | 131 thư mục bài; 2 bài không có transcript. Không tuyên bố nghe đối chiếu toàn bộ âm thanh. |
| SRT/JSON | So nội dung với TXT, 129 bộ khớp sau chuẩn hóa | Là các bản của cùng ASR, không xác nhận lời chép đúng lời nói. |
| Mô tả bài | Đọc 131 README; đối chiếu văn bản hiển thị và href của 98 HTML, đọc ngoại lệ | Không coi CSS/ảnh nhúng chưa xem là đã phân tích. |
| Video thiếu/yếu lời chép | Kiểm 7 MP4 và xem 114 khung hình lấy mẫu có timestamp | Chỉ xác nhận thao tác nhìn thấy; không phải xem liên tục toàn thời lượng. |
| Prompt/tài liệu nguồn | Đọc toàn văn nhóm ID263–296 và prompt nội bộ ID356–367 | Có prompt cụt và danh sách CSV mất liên kết; không tự điền phần thiếu. |
| Bảng tính | Đọc ô có dữ liệu và hyperlink của 3 XLSX | Một file Bible chỉ là pointer bài học; không phải thêm dataset kênh. |
| Skill sản xuất | Đọc bộ hoạt hình, tôn giáo, Bible, wildlife, các tham chiếu và mã sản xuất đi kèm; so bản cài/bản dự án | Đọc mã chưa phải chạy thử trả phí, chưa có chứng nhận end-to-end. |
| Báo cáo và lịch sử trao đổi | Đọc nhóm ID328–352, tài liệu nội bộ/Knowledge Hub liên quan và pilot Mirror | Log bị cắt từ lúc xuất không khôi phục được dữ liệu tool ban đầu. |
| Công cụ dự án | Đọc các script audit, phân loại, đồng bộ, sinh insight, ASR, intake và pipeline liên quan | Nhiều kiểm tra chỉ kiểm cấu trúc. Không chạy các thao tác ghi đè cũ. |
| Toàn inventory | 803 nội dung phân biệt trong lần lập inventory, 1.004 đường dẫn | Có backup, tài liệu dẫn xuất, giao diện và cấu hình. **Không tuyên bố đã đọc hiểu toàn bộ 803 nội dung.** Inventory ban đầu có nhãn UNREAD mặc định; dùng nhật ký đọc để biết tiến độ, không dùng nhãn đó như kết quả cuối. |

Hai bài chưa có lời chép: **VIDEO-3a38f9, VIDEO-61ad94**. Năm bài lời chép chủ yếu nhạc/câu đăng ký: **VIDEO-8e0275, VIDEO-a348a5, VIDEO-b559c8, VIDEO-b96929, VIDEO-ed1be9**. Chúng có bằng chứng khung hình riêng. Muốn khẳng định hiểu trọn thao tác từng giây của cả 131 bài vẫn phải bổ sung audio/video cho các khoảng này.

Sáu ZIP tool tại VIDEO-d20744 và sáu bản sao đều là trang HTML kiểm tra truy cập, không phải ZIP sử dụng được. Hai bản prompt cùng kết thúc ở `reflection ripples like water, dis`; chưa có phần cuối. Danh sách “kênh 1…11” trong CSV không có URL nên không đủ định danh. Đây là khoảng thiếu nguồn thật, không phải nội dung được phép suy ra.

## 3. Cơ chế thực tế rút ra từ học liệu

### Từ raw đến ý tưởng

Chuỗi thường gặp là phát hiện một video có view → tìm kênh gần giống → tách nhân vật/chủ đề/tình huống → dịch từ khóa để tìm thị trường khác → dựng lại. Điểm nên giữ là **quan sát một nhu cầu cụ thể và tìm nhiều đối chứng**. Điểm phải thay là lấy một hit, số doanh thu extension hoặc lời bán kênh làm bằng chứng một mô hình ổn định.

Một raw hợp lệ cho nghiên cứu cần định danh kênh/video, ngày đăng, ngày lấy số, loại nội dung, ngôn ngữ, độ dài, lượt xem và nguồn số liệu. Ảnh chụp không đủ các trường này chỉ là đầu mối. Tên hiển thị gần giống không được tự gộp; link tìm kiếm không được gọi là channel ID đã xác minh.

Khi so đối thủ, tách long-form/Shorts, truyện hư cấu/giải thích kiến thức, kênh cũ/kênh mới. So ở tuổi video tương đương. Tổng view chia tuổi kênh chỉ là trung bình lịch sử, không phải tốc độ hiện tại. Video nhiều view sau nhiều năm chưa chứng minh vẫn có view mới; cần hai lần đo cùng video.

### Từ ý tưởng đến kịch bản

Học liệu có nhiều chuỗi outline → từng phần → continue → clean TTS. Cách chia việc này hữu ích khi mạch câu chuyện được kiểm. Nhưng 10–15 phần × 900–1.100 từ là một quy mô hoàn toàn khác video 10–12 phút. Không lấy timestamp do AI viết làm độ dài thật.

Prompt “giữ 70%/đổi 30%” xuất hiện nhiều nơi. Nó không chứng minh bản quyền, tính nguyên bản, chất lượng nghiên cứu hay điều kiện YPP. Chuẩn mới bắt đầu bằng câu hỏi người xem, ngân hàng sự kiện có nguồn và góc giải thích riêng; dùng transcript đối thủ để phân tích cách kể, không làm bản gốc để thay từ theo tỷ lệ.

### Từ kịch bản đến video

Bằng chứng thực hành cho thấy các công thức khác nhau: tranh dầu + pan/zoom; watercolor giải nghĩa; hình photoreal có chuyển động; hoạt hình nhân vật; stick figure cắt ghép; avatar/lip-sync; reup dịch lồng tiếng. Chúng không có cùng chi phí, yêu cầu kiểm hình hay rủi ro nội dung.

Các bài edit Stoic/Chill Dude/Nonagon cho thấy phần dựng bao gồm xóa nền, sửa nét, sắp lớp, đặt chữ, ghép giọng và căn phụ đề. Nút tạo ảnh hay một script ghép MP4 không thay thế các bước này. Không dùng số phút xử lý API làm tổng thời gian làm một tập.

## 4. Khán giả: chọn tình huống sử dụng trước khi chọn tuổi

“Trung niên và đang già hóa” chưa đủ để viết một video. Dữ liệu công khai đã đọc không xác nhận toàn bộ người xem các kênh đều neo đơn, dư thời gian hay chỉ muốn nghe nền. Tuổi thật, địa lý và nguồn doanh thu của đối thủ thường không truy cập được. Các nhóm dưới đây là **giả thuyết thiết kế sản phẩm cần thử**, không phải kết quả khảo sát dân số.

| Tình huống người xem | Nhu cầu cần phục vụ | Cách viết/dựng nên thử | Dấu hiệu cần thu thập |
|---|---|---|---|
| Nghe lúc làm việc nhà | Theo được câu chuyện dù rời mắt | Câu rõ, chuyển ý bằng lời, hạn chế thông tin chỉ nằm trên ảnh | Bình luận nói nghe nền; phản hồi đoạn khó theo; retention và lượt quay lại của kênh mình |
| Thư giãn buổi tối | Nhịp dễ chịu nhưng có điều đáng khám phá | Một câu hỏi chính, âm lượng ổn định, tránh cao trào giả liên tục | Phàn nàn về nhạc/giọng; phần nào được nhắc nhớ hoặc nghe lại |
| Thích tìm hiểu quá khứ | Hiểu con người từng sống ra sao | Chi tiết vật dụng, đời sống, nguyên nhân–hệ quả có nguồn | Câu hỏi tiếp theo, đính chính, nhu cầu chủ đề liền kề |
| Tìm suy ngẫm tinh thần | Được tôn trọng niềm tin và hoàn cảnh | Phân biệt kinh văn/chú giải/ứng dụng, không hứa chữa lành hay giàu lên | Tranh luận về trường phái, ngôn từ, độ đúng nguồn |
| Xem để thưởng thức hình ảnh | Chuyển động/hành động đáng xem | Mỗi cảnh có việc diễn ra, đúng vật lý/sinh học | Phản hồi lỗi AI, lặp cảnh, không khớp lời |

Nguyên tắc nghe thử: đóng màn hình, nghe toàn tập như một người chưa biết chủ đề. Nếu cần nhìn hình mới hiểu thì bổ sung lời dẫn hoặc xác định đây là video ưu tiên xem. Tiếp đó xem không tiếng để kiểm hình có thật sự minh họa lời kể. Đây là phép kiểm biên tập, không thay số liệu người xem thật.

## 5. Lựa chọn ngách, thị trường và cách làm

Thứ tự sau dựa trên mức phù hợp giữa yêu cầu của anh và năng lực/tài liệu đã đọc. Bằng chứng thị trường chi tiết nằm trong [báo cáo raw 06/09](bao-cao-chien-luoc-raw-thi-truong-20260906.md). Các điểm số/thu nhập cũ không được làm mới chỉ bằng ngày báo cáo này.

| Tầng ưu tiên | Ngách và cách tiếp cận | Thị trường nên cân nhắc | Điều kiện quyết định |
|---|---|---|---|
| A1 | Lịch sử đời sống, vật dụng, thói quen: một câu hỏi đời thường, một câu chuyện có bằng chứng | EN nếu kiểm được tiếng Anh; VN nếu cần vòng học biên tập nhanh | Phải sửa lỗi fact kiểu pilot Mirror. Không kể truyền thuyết như lịch sử. |
| A2 | Cơ chế tự nhiên/khoa học hoặc cơ chế vật dụng hẹp, dễ minh họa | Chọn một ngôn ngữ có người kiểm; EN là phương án thử, không đồng nghĩa người xem Mỹ | Hình và lời phải giải thích đúng; giới hạn chủ đề theo khả năng kiểm nguồn. |
| B1 | Bible giải nghĩa một đoạn/câu hỏi cụ thể | EN khi kiểm được văn bản, bản dịch, chú giải và giọng | Bộ skill khá đầy đủ nhưng cần bỏ quota câu chữ cứng, kiểm hình cổ đại và nguồn. |
| B2 | Lịch sử món ăn/văn hóa địa phương | VN hoặc một thị trường có hiểu biết văn hóa thực chất | Tách giai thoại với lịch sử; không suy quốc gia kênh là quốc gia khán giả. |
| B3 | Chuyện đời/suy ngẫm cho người trưởng thành | VN; JP/KR chỉ khi có QA ngôn ngữ và văn hóa | Truyện hư cấu phải rõ là hư cấu; không giả danh nhân vật thật hoặc chuyên gia. |
| C1 | Wildlife bằng AI | Thị trường có nhu cầu hình ảnh, kiểm riêng khi chọn | Chi phí clip/sửa lỗi cao; không phóng đại ký sinh trùng hoặc dựng cứu trợ giả. |
| C2 | Hoạt hình nguyên bản | Chọn theo khán giả thật của chuyện, không tự gắn 13+ | Cần sửa pipeline, kiểm nhân vật/âm thanh/liên tục cảnh, tính đủ số clip. |
| Không ưu tiên vốn hiện tại | Reup phim/dịch đơn thuần; avatar bác sĩ/tài chính; drama lặp cú sốc | Không dùng RPM hoặc một case bán kênh để đổi quyết định | Không phù hợp mục tiêu nguyên bản, kiểm chứng và kiểm soát rủi ro dài hạn của dự án. |

Không mở EN/JP/KR/VN đồng thời để “phủ thị trường”. Chọn một nơi có thể xác nhận lời thoại và hiểu phản hồi trước. Chuyển ngữ sau khi một format đã cho thấy người xem hiểu lời hứa và muốn xem tiếp. Dịch lại tên người/địa danh không phải bản địa hóa.

Lợi thế dài hạn cần xây là thư viện câu hỏi, hồ sơ nguồn, phong cách kể có thể nhận ra, tài sản hình có quyền, từ điển phát âm và khả năng đọc phản hồi. Kho prompt dùng chung dễ sao chép; chất lượng biên tập từng tập mới là phần dự án phải tích lũy.

## 6. Quy trình chuẩn từ raw đến bản xuất

### Bước 1 — Hồ sơ người xem và lời hứa

Mỗi dự án tập ghi: người xem đang ở tình huống nào; câu hỏi họ muốn giải; sau tập họ hiểu/cảm nhận thêm điều gì; điều gì làm tập khác một bản đọc bách khoa. Chỉ chốt một lời hứa chính. Không mở bài bằng số gây sốc chưa kiểm chứng.

### Bước 2 — Hồ sơ đối chứng thị trường

Lưu các video cùng format và cùng ngôn ngữ, gồm cả kết quả bình thường/kém trong tập dữ liệu đã chọn. Định nghĩa tiêu chí lấy mẫu trước khi xem kết quả. Ghi mẫu thiếu hay truy cập lỗi; không gọi kênh chết chỉ vì handle không tải được. Tách nhận xét của người bán, ước tính công cụ và số đo công khai.

### Bước 3 — Ngân hàng sự kiện

Với mỗi khẳng định factual: câu dự kiến → URL/tài liệu gốc → đoạn hỗ trợ → ngày kiểm → giới hạn → quyết định giữ/sửa/bỏ. Nguồn thứ hai chỉ hữu ích nếu độc lập hoặc bổ sung kiểm chứng; nhiều báo đăng lại cùng thông cáo là một gốc. Tư liệu đủ để viết câu hẹp không tự đủ cho câu tuyệt đối.

Ví dụ Mirror: hiện vật gương đồng cổ bác bỏ câu “trước đó chỉ soi nước và obsidian”. Nguồn Saint-Gobain/Versailles xác nhận mốc sản xuất và Phòng Gương, không tự chứng minh chuyện hàng ngàn thợ chết trước tuổi 30. Sửa bằng cách thu hẹp câu, tìm nguồn chuyên biệt hoặc bỏ; không làm mềm bằng “người ta nói” rồi giữ nội dung sai.

### Bước 4 — Outline và script riêng

Xếp câu chuyện theo câu hỏi → bối cảnh cần thiết → các bước giải thích → điều thay đổi → kết luận trả lời. Twist chỉ dùng khi dữ kiện có thật hoặc truyện đã xác định hư cấu. Không ép mọi tập đủ 8 twist, 60 chữ “you” hay một số nhân vật tối thiểu.

Giữ hai bản: bản biên tập có nguồn/ghi chú và bản clean chỉ có lời đọc. Ước lượng thời lượng từ số từ và nhịp đọc thử; chốt bằng audio thật. Không nhân số phần cho đủ thời lượng nếu nội dung bắt đầu lặp.

### Bước 5 — Kiểm lời và bản địa hóa

Kiểm tên riêng, số, năm, đơn vị, lời trích, cách phát âm và sắc thái. So từng claim giữa bản gốc và bản dịch. Bản dịch không được nâng “một số” thành “đa số”, thêm “hàng ngàn”, biến giả thuyết thành kết luận. Nếu chưa kiểm được tiếng đích, chưa nhân bản sang thị trường đó.

### Bước 6 — Voice và bảng cảnh

Tạo giọng thử một đoạn trước; kiểm nhịp/ngữ điệu/phát âm rồi tạo toàn bài. Mỗi cảnh cần ID, đoạn lời bắt đầu/kết thúc, thời lượng, mục đích minh họa, nhân vật/bối cảnh, nguồn tham chiếu, prompt ảnh, prompt chuyển động nếu có, file đầu ra và trạng thái QA.

Thời lượng timeline phải cộng đủ audio. Ví dụ 8 phút ở clip 8 giây cần 60 clip trước điều chỉnh chuyển cảnh; 45 clip chỉ có 6 phút. 30 ảnh cho 25 phút là 50 giây/ảnh trung bình; không gọi đó là nhịp 30–45 giây. Không dùng phép tính này như chuẩn số cảnh cho mọi format.

### Bước 7 — Tạo hình và chuyển động

Hình lịch sử: đúng đồ vật, phục trang, niên đại trong giới hạn tài liệu. Hình khoa học: đúng cơ chế, tỷ lệ và diễn biến. Hình tôn giáo: theo truyền thống đã xác định. Hình AI là minh họa/tái dựng, không phải chứng cứ sự kiện được quay thật.

Kiểm file giải mã được trước đánh dấu thành công. Lưu engine, tham số, job ID, chi phí, reference và bản được chọn. Khi thất bại, tiếp tục đúng cảnh; không tạo lại cả lô chỉ vì script không lưu trạng thái. Với chuyển động, kiểm từng clip: hình thể, tiếp xúc, trọng lực, hướng chuyển động và tính liên tục.

### Bước 8 — Dựng và đóng gói

Căn cảnh theo audio thực; đừng chỉ chia theo số từ rồi mặc định khớp. Kiểm nhạc không che lời, phụ đề đúng tên/số, không cắt cuối câu, không thiếu cảnh. Tiêu đề và thumbnail cùng hứa điều video thực sự giải đáp. Kiểm thumbnail nhỏ và trên thiết bị xem; nhận xét AI về CTR chỉ là gợi ý thiết kế.

### Bước 9 — Duyệt bản xuất

Người duyệt xem/nghe toàn bộ MP4 cuối. Đánh dấu theo lỗi cụ thể: claim thiếu nguồn; hình sai; giọng sai; cảnh thiếu; subtitle sai; lời hứa thumbnail không được trả. Còn lỗi factual trọng yếu thì chưa đạt. File có trên ổ hoặc script báo Done không đủ.

Lưu nguồn/quyền sử dụng, quyết định khai báo AI và phân loại khán giả theo nội dung thực. Có nhãn AI không miễn mọi điều kiện khác. Nội dung nguyên bản vẫn phải đáp ứng chính sách hiện hành.

### Bước 10 — Đo và quyết định tập kế

Theo dõi cùng cửa sổ tuổi video, traffic source và độ dài. Ghi impression, CTR, retention đầu, AVD, watch time, lượt quay lại khi có và chi phí thực. Tách lỗi đóng gói với lỗi nội dung: ít click cần kiểm lời hứa; click rồi rời sớm cần kiểm việc trả lời hứa; xem tốt nhưng ít phân phối chưa đủ để kết luận ngách chết.

Không đổi đồng thời chủ đề, độ dài, giọng và thumbnail rồi khẳng định biết nguyên nhân. Mỗi vòng ghi giả thuyết, thay đổi và kết quả. Khi mẫu còn ít, giữ trạng thái chưa đủ kết luận.

## 7. Bản đồ skill và mức sẵn sàng

| Bộ | Đầu vào → đầu ra | Giữ | Phải kiểm/sửa trước dùng quy mô |
|---|---|---|---|
| Bible script V2.1 | Topic/research → 6 phần → clean TTS | Truy nguyên verse, phân biệt giải nghĩa/ứng dụng | Bỏ quota “you”, triple-negation, nhân vật bắt buộc; kiểm ví dụ prompt |
| Bible image V4.1 | Script → prompt theo đoạn/reference | Ánh xạ lời–ảnh, style nhất quán | 5 ảnh không phủ tối thiểu 1 ảnh cho 6 phần; kiểm số ảnh và nhịp thực |
| Bible thumbnail V2 | Ý chính → các bố cục | 3 hướng thực sự khác, bản không chữ, kiểm kích thước nhỏ | Không dùng tỷ lệ CTR/AI chữ sạch chưa đo; không sai câu Kinh Thánh |
| Tôn giáo tổng quát | Script có === → voice/ảnh → MP4 | Ba tầng nguyên văn–chú giải–ứng dụng | Chia cảnh theo từ chỉ ước lượng; không tự có subtitle/nhạc/thumb/QA; file clean phải riêng |
| Wildlife script + motion | Câu chuyện → shot/image/motion | Một hành động rõ mỗi shot, reference và ambient | Mapping scene/shot/variant, ngân sách engine mâu thuẫn; kiểm sinh học và tổng thời lượng |
| Hoạt hình 5 bước | Story → character/background → references → shots → composite/video → ghép | ID tài sản, cảnh tự đủ nghĩa, quy trình từng bước | Resume không đúng mô tả, tồn tại file bị coi là thành công, ghép bỏ cảnh thiếu, retry/fallback chưa như tài liệu |
| Prompt lịch sử/triết lý/drama | Outline từng phần → lời đọc → ảnh | Cấu trúc kể, câu hỏi, giọng điệu | Không lấy 70/30 làm chuẩn; không gán lời/giọng người nổi tiếng; xác định fiction/factual |
| ASR/insight/catalog | Media → transcript/notes/metadata | Hỗ trợ tìm và tổ chức nguồn | ASR có lỗi; note sinh template không thay đọc; fallback module có thể gán nhầm bài |

Chi tiết lỗi, tên script và mức kiểm chứng nằm trong các nhật ký kèm theo. **Bản tổng hợp này chưa sửa các skill gốc hoặc chứng nhận đã chạy thử pipeline trả phí.** Không tự động gọi skill cũ là chuẩn mới chỉ vì đã đọc nó.

## 8. Những nhận định cũ phải ngừng dùng như sự thật

| Nhận định trong kho | Kết luận sử dụng |
|---|---|
| Có ads / có hội viên / extension báo tiền = doanh thu được xác minh | Không đủ. Tách dấu hiệu giao diện, ước tính và số liệu Studio được chủ kênh cung cấp. |
| Tỷ lệ rewrite, số cảnh hoặc stock giúp chắc chắn qua YPP | Không có căn cứ bảo đảm như vậy. |
| Tiếng Anh = khán giả Mỹ; chọn quốc gia kênh = phân phối ngoại | Không được dùng làm giả định doanh thu. |
| Người già đông = sức khỏe senior dễ thắng | Không chứng minh nhu cầu cụ thể, cạnh tranh, khả năng đáp ứng hay kiếm tiền. |
| Kênh nhỏ có một hit = ngách còn xanh lâu dài | Chỉ là tín hiệu cần kiểm thêm kết quả nhiều tập và cùng thời gian quan sát. |
| Kênh biến mất = bị policy quét | Handle lỗi/đổi tên/ẩn không xác định nguyên nhân. |
| PASS audit = toàn bộ dự án đúng | Chỉ đúng phạm vi phép kiểm, nhiều script còn chỉ kiểm tồn tại/regex. |
| Một ngày tăng view suy ra cả tháng; total view/tuổi là tốc độ hiện tại | Không dùng thay số đo qua nhiều thời điểm. |
| RPM bảng ngành là RPM của tập sắp làm | Chỉ dùng làm đầu vào kịch bản giả định có nhãn, không dự báo chắc chắn. |
| “100% AI” = không có giờ biên tập | Bằng chứng thực hành không hỗ trợ; phải tính công sửa và kiểm. |

Báo cáo cũ có lỗi cụ thể như 150.000 view × $2,90/1.000 = $435, không phải $500; đếm danh sách và phân nhóm không khớp; so kênh tuổi khác nhau; nguồn cùng gốc được tính độc lập. Chi tiết từng báo cáo được giữ trong historical-report-review.md để không lặp lỗi.

## 9. Chính sách và nguồn hiện hành

Mở lại nguồn chính thức ngày 08/09/2026: YouTube thông báo từ 01/02/2027 ngưỡng mới cho người vào YPP là 1.000 sub cùng 8.000 giờ đủ điều kiện/365 ngày hoặc 20 triệu Shorts/90 ngày; trạng thái kênh đã vào YPP không bị thay đổi bởi ngưỡng này. Không đánh đồng ngưỡng vào chương trình với doanh thu thực nhận. [Thông báo YPP](https://support.google.com/youtube/answer/12843009).

Chính sách yêu cầu giá trị riêng giữa các tập, xử lý nội dung lặp/tái sử dụng thiếu giá trị, công thức thao túng cảm xúc và AI persona tự thể hiện như chuyên gia ở chủ đề nhạy cảm. Quyền sử dụng và xét reused content là hai vấn đề khác nhau. [Chính sách kiếm tiền](https://support.google.com/youtube/answer/1311392?hl=en).

Nội dung AI tạo/chỉnh cảnh chân thực thuộc trường hợp yêu cầu phải khai báo; hỗ trợ outline/script và các chỉnh sửa nhỏ không mặc nhiên thuộc diện đó. Khai báo tự nó không làm mất điều kiện kiếm tiền. [Hướng dẫn GenAI](https://support.google.com/youtube/answer/14328491?hl=en).

Các mốc/giá tool, giọng, schema và điều kiện tài khoản trong bài cũ cần kiểm lại ngay trước dùng. Không dùng ngày của tài liệu này để chứng nhận mọi giá/quota cũ đều hiện hành.

## 10. Cách kiểm soát vốn và học từ thử nghiệm

Đề xuất bắt đầu với một format, một ngôn ngữ, hai nhánh chủ đề gần nhau. Làm ba tập đầu để đo quy trình, rồi thêm ba tập sau khi đã sửa lỗi. Sáu tập là một đợt học được giới hạn công sức, **không phải cỡ mẫu đủ chứng minh thị trường**. Chưa mở nhiều kênh khi thời gian/chi phí mỗi tập chưa đo được.

Ghi chi phí mỗi tập gồm: nghiên cứu, biên tập, dịch/QA, TTS, ảnh/clip thành công và thất bại, dựng, nhạc/tài sản, đóng gói. Phân bổ phí thuê bao và giờ lao động nhất quán. View hòa vốn quảng cáo = tổng chi phí / RPM giả định × 1.000; phép tính chỉ dùng khi có chia tiền và RPM phù hợp. Trước kiếm tiền, theo dõi khoản đầu tư thử nghiệm riêng.

Quyết định tiếp tục khi đội làm ra bản đúng và hoàn chỉnh trong giới hạn vốn, người xem hiểu lời hứa, các tập sau cho thấy phản hồi có thể học được. Sửa định dạng nếu người xem rời ở cùng kiểu đoạn hoặc thường phàn nàn giọng/hình. Dừng mở rộng khi nội dung chỉ hoàn thành bằng bịa, thiếu quyền, lỗi AI lặp hoặc chi phí vượt giới hạn đã đặt. Không bù thiếu bằng chứng bằng tăng số lượng đăng.

## 11. Hồ sơ bắt buộc cho một tập

| Hồ sơ | Nội dung tối thiểu |
|---|---|
| Brief | Tệp/tình huống nghe, câu hỏi, lời hứa, format, ngôn ngữ, giới hạn công sức |
| Sources | Claim, nguồn, đoạn hỗ trợ, ngày kiểm, quyết định giữ/sửa/bỏ |
| Script editorial / clean | Bản có nguồn và bản chỉ có lời đọc, số phiên bản |
| Shot manifest | ID cảnh, lời/audio time, mục đích hình, reference, file, thời lượng, QA |
| Cost log | Job/file, phí, lần lỗi, giờ công, tổng thực tế |
| Publish pack | MP4 đã xem hết, subtitle, tiêu đề/thumb, mô tả nguồn, quyết định AI/quyền |
| Review | Cửa sổ đo, nguồn traffic, chỉ số có thật, phản hồi, thay đổi tiếp theo |

## 12. Tài liệu đối chiếu và phần chưa đóng

Nhật ký dưới đây nằm tại `D:/YTB/H2DEV-Project/_audit/20260906-learning-corpus/`:

- [Ghi chú từng video](../../../_audit/20260906-learning-corpus/reading-notes.md): 131 vị trí, nội dung 129 transcript và bài thiếu.
- [Skill và mã sản xuất](../../../_audit/20260906-learning-corpus/skill-code-notes.md).
- [Khung hình và tài liệu đính kèm](../../../_audit/20260906-learning-corpus/visual-and-attachment-notes.md).
- [Nguồn gốc insight cũ](../../../_audit/20260906-learning-corpus/legacy-insight-provenance.md).
- [Phản biện từng báo cáo cũ](../../../_audit/20260906-learning-corpus/historical-report-review.md).
- [Lịch sử trao đổi, Knowledge Hub và pilot Mirror](../../../_audit/20260906-learning-corpus/continuation-source-notes.md).
- [Đối chiếu công cụ nội bộ](../../../_audit/20260906-learning-corpus/source-tools-review.md).
- [Chi tiết chính sách kiểm ngày 07/09](../../../_audit/20260906-learning-corpus/policy-verification-20260907.md), các trang cốt lõi đã mở lại 08/09 như mục 9.

Chưa đóng: phục hồi hai lời chép và các đoạn ASR yếu; xem liên tục phần thao tác còn thiếu; lấy sáu bộ ZIP hợp lệ và prompt/danh sách mất nội dung; đọc hết những nội dung inventory chưa có xác nhận semantic; sửa và chạy nghiệm thu pipeline trước sản xuất. Bản tổng hợp đã có thể dùng để ra quyết định và tránh lặp lỗi, nhưng **không thay lời cam kết đã đọc/xem toàn bộ mọi tài sản của dự án**.
