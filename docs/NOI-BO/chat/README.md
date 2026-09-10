# Lịch sử chat — dự án YTB

Cập nhật: 2026-08-19

| Thứ tự | File | Nội dung |
|---|---|---|
| 1 | [phien-1-khoi-dong-du-an.md](phien-1-khoi-dong-du-an.md) | Khởi động dự án, cài 5 MCP đầu tiên |
| 2 | [phien-2-nghien-cuu-ngach.md](phien-2-nghien-cuu-ngach.md) | Nghiên cứu + verify đối thủ ngách Nhật-Hàn |
| 3 | [phien-3-khoi-phuc-lich-su-va-mo-rong-mcp.md](phien-3-khoi-phuc-lich-su-va-mo-rong-mcp.md) | Khôi phục lịch sử chat, phân tích 40+ MCP, cài Reddit/Notion/Canva |
| 4 | [phien-4-verify-ngach-chot-us-2-tru.md](phien-4-verify-ngach-chot-us-2-tru.md) | Verify ngách, chốt hướng US 2 trụ |
| 5 | [2026-07-30_6c4ddd63.md](2026-07-30_6c4ddd63.md) | Quét ngách xanh faceless AI cho US + Nhật + Hàn bằng NexLev + RSS YouTube |
| 6 | [phien-6-audit-toan-dien-mcp-chinh-sach.md](phien-6-audit-toan-dien-mcp-chinh-sach.md) | **Mới nhất** — 9/9 MCP CodeBuddy · audit toàn diện data theo báo cáo 17/08 + vidIQ 131 kênh + mở URL gốc (23 dead) · "Prompt / AI" về META · verify chính sách Halprin 16/07/2026 qua nguồn độc lập |

## Phiên mới nhất đã xong gì (18–19/08/2026, phiên 6)

- **MCP:** cài uv 0.12.5 → google-news-trends chạy (uvx đường dẫn tuyệt đối trong `.mcp.json`) · nexlev xoá sạch → **9/9 server hoạt động**.
- **Audit data:** sửa market 4 video · niche 18 video · kenh-mau chuẩn hóa 50+ kênh (16 lỗi sửa qua vidIQ, quy trình URL gốc `@handle` → channel ID từ link Posts) · 23 kênh 404 đánh dấu `dead` + UI ẩn · tai-lieu-full 77→90 card · ngach-xanh tái cấu trúc 29 ngách + 5 meta, skus 129/129, "Prompt / AI" về META.
- **Chính sách:** verify 7 điểm Halprin qua transcript Creator Insider 16/07/2026 + YouTube Help + 5 báo độc lập → thongTinChinhSach2026 3→6 dòng (thêm: flag đối thủ vô ích · kháng cáo 21/90 ngày · trẻ em đau khổ nhóm 2 · YPP 2027 đầy đủ).
- **CHANGELOG mục (3)(4)(5)(6)** · backup `_backup/2026-08-18-audit/` · Validation PASSED.

Việc còn chờ: **23 kênh dead 404** cần tự tìm handle mới trên YouTube rồi sửa `handle` + `url` + bỏ `dead` trong `data-tabs/kenh-mau.json`.

## Phiên cũ dở (30/07/2026, session 6c4ddd63)

- Đã có bảng 24 kênh với median/max view, tỷ lệ outlier, P25, % video dưới 1K, cadence.
- Cụm Bible/Christianity (Paths of the Bible, BibleResolve, Time Routes, Beyond The Verses) phân bố view đều nhất, RPM 9-11. Cụm history (Primohistory ratio 629, History Uncovered 228) là dạng "xổ số" — vài video trúng lớn, phần lớn dưới 1K.
- Lỗi phương pháp đã tự phát hiện: so sánh 5 video cũ vs 5 video mới để suy xu hướng là sai vì video mới chưa kịp tích view. RSS chỉ trả 15 video gần nhất nên kết luận "17/24 kênh DOWN" không đáng tin.

3 việc đã được duyệt nhưng **chưa chạy**:

1. Chuẩn hóa view theo tuổi video rồi tính lại xu hướng.
2. Scrape dữ liệu thị trường JP/KR (NexLev không có).
3. Check policy YouTube mới nhất tháng 7/2026. *(✔ Mục 3 đã hoàn tất ở phiên 6 — xem thongTinChinhSach2026)*

## Xuất lại

Script: [../export_chat.py](../export_chat.py) — parse jsonl trong `C:\Users\zray9td\.claude\projects\z--aming-YTB\` ra markdown. Chạy lại nếu cần các phiên khác.
