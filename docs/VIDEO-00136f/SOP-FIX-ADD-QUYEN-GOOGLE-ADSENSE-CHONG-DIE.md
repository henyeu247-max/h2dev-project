# SOP HƯỚNG DẪN FIX & ADD QUYỀN CHO TÀI KHOẢN GOOGLE ADSENSE CHỐNG DIE
> **Mã SKU:** `VIDEO-00136f` | **Module:** M02 - Kỹ thuật dựng & Tút ngách nâng cao | **Thời lượng:** 04 phút 24 giây
> **Mục tiêu:** Thiết lập cấu trúc phân quyền tài khoản Google AdSense đa tầng để bảo vệ dòng tiền và quyền truy cập khi tài khoản quản trị gặp sự cố.

---

## 1. NGUYÊN TẮC QUẢN TRỊ TÀI KHOẢN GOOGLE ADSENSE
- **Hiểm họa mất quyền truy cập độc quyền:** Nếu chỉ có duy nhất 1 email nắm quyền Quản trị viên (Admin) của Google AdSense, khi email đó bị khóa do vi phạm chính sách Gmail hoặc bảo mật thì toàn bộ tài khoản AdSense và số dư sẽ bị đóng băng vĩnh viễn.
- **Mô hình Phân quyền Đa Tầng:**
  1. **Tài khoản Admin Chính (Owner):** Chỉ dùng để tạo AdSense ban đầu, cất giữ an toàn trên thiết bị bảo mật cao và không dùng để đăng nhập hàng ngày.
  2. **Tài khoản Admin Dự phòng (Backup Admin):** Email độc lập đã bật 2FA trên thiết bị khác để có thể can thiệp ngay lập tức khi mail chính gặp sự cố.
  3. **Tài khoản Standard User:** Dùng để kiểm tra báo cáo doanh thu hàng ngày trên các thiết bị làm việc.

---

## 2. QUY TRÌNH THỰC HIỆN 4 BƯỚC CHUẨN
- **Bước 1:** Đăng nhập vào Google AdSense chính thức tại `adsense.google.com`.
- **Bước 2:** Truy cập mục **Tài khoản (Account)** -> **Quyền truy cập và ủy quyền (Access and authorization)** -> **Quản lý người dùng (User management)**.
- **Bước 3:** Nhập địa chỉ Gmail dự phòng của bạn vào ô mời người dùng và chọn quyền **Quản trị viên (Administrator)**.
- **Bước 4:** Mở hộp thư Gmail dự phòng, chấp nhận lời mời và hoàn tất liên kết tài khoản trong vòng 24 giờ.

---

## 3. CẢNH BÁO TỬ HUYỆT CẦN TRÁNH
- **Tuyệt đối không cấp quyền Admin** cho các email không do bạn toàn quyền kiểm soát mật khẩu và số điện thoại 2FA.
- **Tránh dùng chung số điện thoại khôi phục** giữa email Admin chính và email Admin dự phòng.
- **Không thực hiện thao tác chuyển quyền** ngay khi tài khoản AdSense vừa có thông báo xác minh danh tính hoặc đang trong kỳ thanh toán (ngày 21-26 hàng tháng).