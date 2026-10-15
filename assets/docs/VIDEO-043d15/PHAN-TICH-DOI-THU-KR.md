# Phân tích 2 kênh đối thủ (tham chiếu cho skill kichban-bapsang-kr)

Nguồn: hai kênh đối thủ ngách nhỏ sức khỏe thực phẩm thị trường Hàn Quốc (cùng nhau nói chủ yếu về táo, cà rốt), cộng 4 kịch bản gốc cao view nhất đã bóc tách để cho AI học.

## Ngách và từ khóa
- Key chung là sức khỏe thực phẩm, nhưng đi sâu vào một ngách nhỏ, cực kỳ nhỏ: từ khóa nổi bật trong video của hai kênh là táo, cà rốt, khoai, khoai tây.
- Kênh thứ 3 tác giả lọc thêm có cùng key sức khỏe thực phẩm nhưng đi vào ngách nhỏ khác: video cao view xoay quanh hành tây, đậu xanh. Kênh này không dùng để train, chỉ để tham khảo.
- Hai kênh đầu cùng trường phái, nên được dùng chung để train AI.

## Hai kiểu kịch bản AI nhận ra
- Kiểu xếp nỗi sợ.
- Kiểu câu đố, phân tích và nhân vật.
- Kịch bản xuất ra kèm sẵn tiêu đề, chữ trong thumbnail, mô tả, từ khóa (thẻ tag) để khỏi phải làm thêm bước nào.

## Ví dụ tiêu đề video đối thủ
- Cụm táo, cà rốt được cả hai kênh khai thác.

## Dữ liệu đối thủ cần đưa cho AI học
- Copy toàn bộ thông tin kênh (từ trang video phổ biến), thẻ tag kênh, mô tả video và thẻ từ khóa video của các video cao view nhất.
- Nên dùng khoảng 2 đến 3 kênh đối thủ; 3 kênh là ổn nhất để AI có đủ dữ liệu phân tích.
- Lấy kịch bản của 2 video cao view nhất của mỗi kênh (tổng 4 kịch bản) bằng web lấy kịch bản miễn phí.
- Train từ từ, không thể train một lần cho xong.

## Mô tả và tag của đối thủ
- AI học cả mô tả và thẻ tag để sinh ra bộ mô tả, từ khóa kèm theo kịch bản.

## Số liệu trong kịch bản đối thủ
- Kịch bản AI viết ra có kèm danh sách mục cần xác minh để kiểm tra lại độ đúng sự thật.
