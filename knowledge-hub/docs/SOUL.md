# SOUL.md — H2DEV-Project (chuẩn sản xuất video YouTube)

> File hướng dẫn NHẤT QUÁN toàn bộ luồng làm việc: từ ý tưởng → script → sản xuất → SEO → upload → phân tích.
> Cập nhật: 20/08/2026. Đọc cùng `RULE-LAM-VIEC.md` (verify ngách) + `HUONG-DAN-MCP-CHUAN.md` (tool).

---

## 1) Phong cách viết script (chuẩn cho mọi video)

- **Giọng**: gần gũi, nói chuyện trực tiếp với 1 người xem ("bạn"), không đọc như báo cáo.
- **Câu ngắn** (≤ 20 từ), 1 ý = 1 câu. Tránh câu dài lê thê.
- **Mở bằng câu hỏi / bất ngờ**, không mở bằng giới thiệu kênh.
- **Không spam từ khóa** vào script — viết tự nhiên, keyword chỉ nằm trong title/description.
- **Mỗi video 1 ý tưởng lớn**, triển khai bằng 3-5 luận điểm có dẫn chứng.
- **Có twist / bất ngờ** ở giữa hoặc cuối để giữ retention.
- Ngách giáo dục: dẫn nguồn, không bịa số liệu. Ngách giải trí: kể chuyện có cao trào.

## 2) Cấu trúc video chuẩn (hook → nội dung → CTA)

| Phần | Mục tiêu | Độ dài | Cách làm |
|---|---|---|---|
| **HOOK (0-15s)** | Chặn thoát | 10-15s | Câu hỏi/bất ngờ/số liệu gây tò mò. KHÔNG giới thiệu kênh. Ví dụ: "Trước khi có tiền, người ta đóng thuế bằng gì?" |
| **INTRO (15-45s)** | Giữ hứa | 30s | Nói rõ video sẽ giải đáp gì + vì sao đáng xem. |
| **BODY (45s - hết)** | Triển khai | 5-25p tùy ngách | 3-5 luận điểm, mỗi điểm có ví dụ/dẫn chứng. Có pattern hook nhỏ giữa chừng (mini cliffhanger). |
| **CTA (cuối)** | Chuyển đổi | 15-20s | 1 CTA duy nhất: "xem video tiếp theo" hoặc "subscribe". KHÔNG nhiều CTA cùng lúc. |

**Quy tắc retention:** mỗi 60-90s có 1 điểm "hứa tiếp" (cliffhanger) để giữ người xem qua đoạn kế.

## 3) Tiêu chí chọn thumbnail

1. **1 chủ thể chính** rõ ràng (không >3 đối tượng).
2. **Chữ ≤ 4 từ**, to, tương phản mạnh với nền.
3. **Gây tò mò / cảm xúc** (không chỉ "đẹp").
4. **Đúng hứa hẹn trong title** (không clickbait lệch nội dung).
5. Thử A/B nếu được (2 thumbnail cho 1 video, xem CTR).
6. **Ngoại lệ**: ngách "người xem quen thuộc tuyến" (Everyday History, senior) → thumbnail đơn giản, quen mắt vẫn CTR cao; không cần quá đẹp. Ưu tiên sự quen thuộc + rõ chủ đề hơn là đẹp cầu kỳ.

## 4) Tối ưu SEO (title – description – tags)

### Title (≤ 60 ký tự, chứa keyword chính ở đầu)
- Keyword volume cao + gây tò mò. Ví dụ: "Trước Khi Có Giấy Bạc, Người Ta Dùng Gì Để Trả Thuế?"
- KHÔNG nhồi từ khóa; KHÔNG viết HOA toàn bộ.

### Description (200-400 từ)
- 2-3 câu đầu chứa keyword + tóm tắt hấp dẫn (hiện trên kết quả tìm kiếm).
- Sau đó: chi tiết video + timestamp (nếu dài) + link kênh/video liên quan + hashtag 3-5.

### Tags (5-15 tags)
- 1-2 keyword chính + 5-10 biến thể dài (long-tail) + 2-3 tag ngách.

### SEO nâng cao
- Đặt `language` + `category` đúng ngách.
- Thêm phụ đề (subtitle) nếu ngách giáo dục (tăng SEO + reach người khiếm thính).

## 5) Quy trình đăng tải → phân tích hiệu quả (sau upload)

**Trước khi đăng:**
1. Check list: title/description/tags đã SEO, thumbnail đã chọn, end screen + card đã thêm.
2. Đăng lịch cố định (ngách nào thì giờ đó khán giả online).

**Sau upload (theo dõi theo mốc):**

| Mốc | Chỉ số theo dõi | Ngưỡng đánh giá |
|---|---|---|
| 24h | CTR + retention 30s | CTR < 3% → đổi thumbnail; retention 30s < 50% → xem lại hook |
| 7 ngày | AVD (avg view duration) + views | AVD thấp → xem lại body; views thấp → keyword sai |
| 30 ngày | RPM + revenue + lượt sub | So với trung bình ngách |

**Phân tích bằng MCP:** `vidIQ.video_stats` (từng video) + `vidIQ.channel_videos` (đối chiếu kênh đối thủ) + `trends` (xu hướng). Ghi kết quả vào CHANGELOG + cập nhật ngách nếu phát hiện mới.

**Vòng lặp cải tiến:** mỗi video → ghi lại (1) điều gì làm tốt (2) điều gì thất bại (3) bài học → áp dụng cho video sau. Không đăng rồi bỏ mặc.

## 6) Nguyên tắc nhất quán (SOUL)

- **Chủ đề = người xem tìm đến**, đừng cố tìm người xem.
- **Format = brand**: định dạng video riêng tạo thương hiệu kênh (mọi video cùng công thức).
- **Chất > số lượng**: 1 video tốt > 10 video na ná nhau (tránh bị YPP "repetitious").
- **Trung thực**: không clickbait lệch, không bịa, không AI persona (health/finance).
- **Dài hạn**: mọi video phục vụ kênh lâu dài, không chạy theo trend ngắn hạn hủy hoại kênh.
