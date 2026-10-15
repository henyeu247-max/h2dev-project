# Phân tích 2 kênh đối thủ (tham chiếu cho skill kichban-bapsang-kr)

Nguồn: hai kênh đối thủ ngách nhỏ sức khỏe thực phẩm thị trường Hàn Quốc là 건강 채소 연구노트 và 채소와 과일 건강백서 (cùng nhau nói chủ yếu về táo, cà rốt), cộng 4 kịch bản gốc cao view nhất đã bóc tách để cho AI học.

## Ngách và từ khóa
- Key chung là sức khỏe thực phẩm, nhưng đi sâu vào một ngách nhỏ, cực kỳ nhỏ: từ khóa nổi bật trong video của hai kênh là táo, cà rốt, khoai (từ khóa dạng củ), khoai tây.
- Kênh thứ 3 tác giả lọc thêm có cùng key sức khỏe thực phẩm nhưng đi vào ngách nhỏ khác: video cao view xoay quanh hành tây, đậu xanh. Kênh này không dùng để train, chỉ để tham khảo.
- Hai kênh đầu cùng trường phái, nên được dùng chung để train AI.

## Hai kiểu kịch bản AI nhận ra
- Kiểu xếp nỗi sợ (xếp hạng thực phẩm / thói quen gây hại).
- Kiểu câu đố, phân tích và nhân vật.
- Kịch bản xuất ra kèm sẵn tiêu đề, chữ trong thumbnail, mô tả, từ khóa (thẻ tag) để khỏi phải làm thêm bước nào.

## Ví dụ tiêu đề video đối thủ
- 신장이 약해졌다면 꼭 보세요! 4가지와 4가지
- 아침 사과 이렇게 먹으면 달라집니다! 65세 이후
- 사과 끊지 마세요! 신장을 힘들게 하는 진짜 음식
- 여름 감자 딱 3분만 데치세요
- Cụm táo, cà rốt buổi sáng được cả hai kênh khai thác nhiều biến thể.

## Dữ liệu đối thủ cần đưa cho AI học
- Copy toàn bộ thông tin kênh (từ trang video phổ biến), thẻ tag kênh, mô tả video và thẻ từ khóa video của các video cao view nhất.
- Nên dùng khoảng 2 đến 3 kênh đối thủ; 3 kênh là ổn nhất để AI có đủ dữ liệu phân tích.
- Lấy kịch bản của 2 video cao view nhất của mỗi kênh (tổng 4 kịch bản) bằng web lấy kịch bản miễn phí.
- Train từ từ, không thể train một lần cho xong.

## Mô tả và tag của đối thủ
- Mô tả video đi kèm từ khóa thương hiệu (brand keyword) của kênh; AI học cả mô tả và thẻ tag để sinh ra bộ mô tả, từ khóa kèm theo kịch bản.
- Tag chung của hai kênh: 채소건강, 건강식재료, 노인건강, 혈당관리, 건강 채소, 건강 음식, 신장에 좋은 음식, 건강 관리, 노인 건강, 채소 효능, 채소 영양, 시니어 건강, 건강한 식습관, 60대 건강, 건강 정보, 건강한 식단, 중년 건강.

## Số liệu trong kịch bản đối thủ
- Các số liệu y khoa, dinh dưỡng xuất hiện trong kịch bản đối thủ đều cần tự kiểm chứng trước khi dùng. Kịch bản AI viết ra có kèm danh sách mục cần xác minh để kiểm tra lại độ đúng sự thật.
