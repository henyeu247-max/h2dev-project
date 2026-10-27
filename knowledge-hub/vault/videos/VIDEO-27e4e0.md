---
sku: "VIDEO-27e4e0"
title: "Quy Trình Tạo Ra Tool Tự Động Nhất Quán Nhân Vật"
track: "dgmd"
module_id: "DGMD-M10"
module_title: "TƯ DUY CẦN NHỚ KHI XÂY DỰNG KÊNH YOUTUBE"
seq: "12"
niche: "Tooling & Tự Động Hóa YouTube"
markets: ["🇻🇳 Việt Nam", "🌍 View Ngoại"]
duration: "07:27"
published_at: "2026-10-12"
toolsCount: 4
channelsCount: 0
docsCount: 6
player_url: "/player.html?sku=VIDEO-27e4e0&track=dgmd"
---

# VIDEO-27e4e0 — Quy Trình Tạo Ra Tool Tự Động Nhất Quán Nhân Vật

> **Chuỗi Liên Kết Tri Thức (Knowledge Graph Links):**  
> - **Track:** [[tracks/TRACK-DGMD|Nhánh Đại Gia Mang Dép (DGMD) · Thực Chiến Đa Kênh (45 Videos)]]  
> - **Module:** [[modules/DGMD-M10|DGMD-M10 — TƯ DUY CẦN NHỚ KHI XÂY DỰNG KÊNH YOUTUBE]] (Bài `#12`)  
> - **Ngách nội dung (Niche):** [[niches/tooling-tu-dong-hoa-youtube|Tooling & Tự Động Hóa YouTube]]  
> - **Thị trường:** 🇻🇳 Việt Nam · 🌍 View Ngoại | **Thời lượng:** `07:27` | **Ngày đăng:** `2026-10-12`  
> - **Mở trên Player:** [Xem Video & Phụ Đề Tương Tác](/player.html?sku=VIDEO-27e4e0&track=dgmd) · [Hồ sơ gốc README.md](../../../docs/VIDEO-27e4e0/README.md)

---

## 1. Chủ Đề Thực Tế & Giá Trị Cốt Lõi (`Key Takeaways`)
- **Chủ đề thực tế:** Quy trình dùng Master Prompt dựng Tool tự động tạo ảnh hàng loạt và khóa nhân vật tham chiếu ngay trong Trình tạo công cụ của Google Flow (Nano Banana)
- Người làm nội dung không cần biết lập trình (code tool) vẫn có thể tự tạo phần mềm tự động hóa riêng bằng tính năng 'Công cụ' (Trình tạo công cụ) tích hợp sẵn trên Google Flow (labs.google).
- Chỉ cần dán bản Master Prompt đặc tả 8 khu vực giao diện và logic hoạt động vào Trình tạo công cụ, Google Flow sẽ tự động sinh mã nguồn (tab Mã) và giao diện Dashboard (tab Xem trước) trong 5–10 phút.
- Trên giao diện tool vừa tạo, sau khi tải ảnh nhân vật gốc lên mục 'Ảnh tham chiếu', bắt buộc phải bấm tích chọn nhãn 'Nhân vật' để hệ thống tự động đính kèm ảnh đó vào toàn bộ các câu lệnh trong hàng đợi.
- Khi dùng ChatGPT sinh danh sách 20–200 Prompt để nạp vào tool, cần dặn rõ 'các prompt liền mạch, không cần đánh dấu các prompt' để tool tách dòng chính xác mỗi dòng là 1 Prompt.
- Tool hỗ trợ chạy đa luồng 5–8 Prompt cùng lúc (mỗi Prompt 1–4 ảnh, tùy chọn tỷ lệ 16:9 hoặc 9:16), tự động đánh số thứ tự phân cảnh (prompt_001_image_01.png) và tự động chạy cuốn chiếu đến hết danh sách.

## 2. Quy Trình Sản Xuất & Dựng Video (`Edit SOP`)
- **Trọng tâm:** Quy trình 5 bước khởi tạo và vận hành Tool tự động tạo ảnh nhân vật nhất quán trên Google Flow
1. Truy cập Google Flow (labs.google/fx/vi/tools/flow), bấm Dự án mới -> chọn mục Công cụ ở thanh bên trái -> bấm Tạo công cụ.
2. Sao chép toàn bộ câu lệnh Master Prompt tạo tool từ file tài liệu đính kèm (có thể đổi tên 'ĐẠI GIA MANG DÉP' thành tên riêng) rồi dán vào Trình tạo công cụ và chờ 5–10 phút để AI dựng xong Dashboard.
3. Tại mục 'Ảnh tham chiếu' của tool, bấm '+ Thêm mới' để tải ảnh nhân vật gốc lên và bấm tích chọn xác nhận nhãn 'Nhân vật ✓'.
4. Mở ChatGPT, tải ảnh nhân vật gốc lên kèm câu lệnh yêu cầu viết 20–200 Prompt tiếng Anh thay đổi bối cảnh và góc quay, dặn rõ 'các prompt liền mạch, không cần đánh dấu các prompt'.
5. Sao chép toàn bộ danh sách Prompt từ ChatGPT dán vào ô 'Danh sách Prompt' của tool, bấm 'Cập nhật danh sách', chọn tỷ lệ khung hình (16:9), số ảnh/prompt (2 ảnh), số luồng song song (5 prompt) rồi nhấn 'Bắt đầu chạy'.

## 3. Cảnh Báo Rủi Ro & Lỗi Cần Tránh (`Avoid Flags`)
- ⚠️ Tải ảnh tham chiếu lên tool nhưng quên bấm tích chọn nút xác nhận 'Nhân vật', khiến tool không tự động đính kèm ảnh nhân vật gốc vào từng Prompt khi chạy hàng loạt.
- ⚠️ Để ChatGPT đánh số thứ tự hoặc chèn dòng tiêu đề ('Prompt 1:', 'Prompt 2:') xen kẽ khi tạo danh sách khiến ô nhập theo dòng của tool nhận diện nhầm dòng tiêu đề là một câu lệnh vẽ ảnh.
- ⚠️ Dán danh sách Prompt vào ô văn bản nhưng quên nhấn nút 'Cập nhật danh sách' trước khi bấm 'Bắt đầu chạy', làm hàng đợi thực thi không nạp được các câu lệnh.
- ⚠️ Hoang mang khi thấy giao diện tool sinh ra có bố cục màu sắc hơi khác lần trước — mỗi lần AI biên dịch code giao diện có thể khác nhau đôi chút nhưng các nút chức năng cốt lõi vẫn giữ nguyên.

## 4. Liên Kết Công Cụ AI & Phần Mềm (`Tools Mentioned`)
- [[tools/google-flow|Google Flow]]
- [[tools/nano-banana|Nano Banana]]
- [[tools/chatgpt|ChatGPT]]
- [[tools/google-docs|Google Docs]]

## 5. Liên Kết Kênh Mẫu & Đối Thủ (`Competitor Channels`)
- *(Bài học tập trung vào tư duy/kỹ thuật nền tảng, không gắn kênh đối thủ cụ thể)*

## 6. Tài Liệu Đính Kèm Bài Học (`Course Docs`)
- **Hồ sơ phân tích & SOP thực chiến: Quy Trình Tạo Ra Tool Tự Động Nhất Quán Nhân Vật (README.md):** `docs/VIDEO-27e4e0/README.md`
- **Cẩm Nang Thực Chiến & Master Prompt Tạo Tool Tự Động Hóa (Markdown):** `assets/docs-dgmd/VIDEO-27e4e0/master_prompt.md`
- **Master Prompt Gốc Tạo Tool Tự Động Nhất Quán Nhân Vật (doc_1.txt):** `assets/docs-dgmd/VIDEO-27e4e0/doc_1.txt`
- **Bản Sao Master Prompt Tạo Tool (master_prompt.txt):** `assets/docs-dgmd/VIDEO-27e4e0/master_prompt.txt`
- **Tài Liệu Google Docs Export (master_prompt.html):** `assets/docs-dgmd/VIDEO-27e4e0/master_prompt.html`
- **Bản ghi phụ đề đầy đủ (Transcript .txt):** `video/VIDEO-27e4e0/transcript.txt`

## 7. Mốc Thời Gian Trọng Tâm (`Key Timestamps`)
- `00:00` (0s) — Giới thiệu phương pháp tự động hóa tạo hình ảnh nhân vật nhất quán hàng loạt ngay trên Google Flow
- `00:25` (25s) — Truy cập giao diện labs.google, bấm Tạo dự án mới -> chọn mục Công cụ -> bấm Tạo công cụ riêng
- `00:46` (46s) — Sao chép toàn bộ bản Master Prompt tạo tool từ Google Docs (Tạo ra tool veo3) và tùy biến tên thương hiệu
- `01:44` (104s) — Dán Master Prompt vào Trình tạo công cụ trên Google Flow để AI tự động viết mã code và dựng Dashboard trong 5-10 phút
- `02:37` (157s) — Tải hình ảnh người que (Stickman) lên mục Ảnh tham chiếu của tool và tích chọn nhãn xác nhận Nhân vật
- `03:08` (188s) — Chuyển sang ChatGPT nhập lệnh tạo 20 Prompt cuộc sống hàng ngày liền mạch, không đánh dấu tiêu đề từng Prompt
- `04:37` (277s) — Dán 20 Prompt vào tool, bấm Cập nhật danh sách, chọn tỷ lệ 16:9, 2 ảnh/prompt, chạy song song 5 prompt và bấm Bắt đầu chạy
- `05:26` (326s) — Kiểm chứng hàng loạt ảnh Stickman tự động render trên Google Flow và tổng kết tư duy dùng Master Prompt để tạo công cụ
