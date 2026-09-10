# HƯỚNG DẪN DÙNG MCP CHUẨN (H2DEV-Project)

> Ngày cập nhật: 05/09/2026
> Mục đích: chuẩn hóa cách dùng MCP để không bị lỗi, biết tool nào dùng cho việc gì, và thay thế khi tool lỗi.

## 1. NGUỒN CẤU HÌNH MCP HIỆN TẠI

- Runtime chuẩn: **9router proxy local** tại `http://127.0.0.1:20128`.
- Cấu hình và quyền truy cập nằm ở OMP/CLI ngoài project; **không lưu key trong repo**.
- `D:\YTB\.agents\mcp_config.json` hiện là file rỗng, không phải nguồn cấu hình runtime.
- MCP Pool VPS và proxy cũ `127.0.0.1:3988` là **legacy**, không dùng cho workflow mới.
- Khi runtime expose tool theo nhóm, tên chuẩn vẫn là `<nhóm>__<tên-tool>`, ví dụ `vidiq__vidiq_channel_stats`.

## 2. BẢNG TOOL MCP DÙNG CHO VIỆC GÌ

|| Việc cần làm | Tool MCP Pool (nhóm__tool) | Tool thay thế (nếu lỗi) |
||---|---|---|
|| **Xác minh kênh YouTube (sub, views, tăng trưởng)** | `vidiq__vidiq_channel_stats` | `vidiq__vidiq_channel_search` (khi handle sai) |
|| **Tìm kênh YouTube theo từ khóa** | `vidiq__vidiq_channel_search` | — |
|| **Tra cứu tin tức thị trường (US/Nhật/Hàn)** | `trends__get_top_trends` type="Google News" | `jina__jina_read_url` RSS · `firecrawl__firecrawl_scrape` RSS · `tavily__tavily_search` |
|| **Tra cứu web / tổng hợp tin** | `exa__web_search_exa` | `tavily__tavily_search` |
|| **Đọc chi tiết 1 trang web** | `firecrawl__firecrawl_scrape` | `jina__jina_read_url` |
|| **Tự động hóa trình duyệt / xem trang chặn bot** | `playwright__*` / `chrome-devtools__*` | `camoufox__*` (vượt chặn bot) |
|| **Tra cứu tài liệu thư viện code** | `context7__context7_query_docs` | — |
|| **Trend YouTube/TikTok/Reddit** | `trends__get_top_trends` type="YouTube/TikTok/Reddit" | — |
|| **Phân tích ảnh** | `agent-vision__agent_vision_analyze_image` | `vision__vision_analyze_image` |
|| **Xem/đọc file trực tiếp trên máy** | `filesystem__*` | `read_file` (built-in) |

## 3. CẢNH BÁO LỖI THƯỜNG GẶP

### ✅ MCP local qua 9router là nguồn hiện tại
- Kiểm tra runtime ở `127.0.0.1:20128` trước khi chạy workflow.
- Không đặt key, bearer token hoặc endpoint legacy trực tiếp trong script mới.

### ⚠️ MCP Pool VPS và proxy 3988 là legacy
- MCP Pool VPS từng được dùng trong các phiên cũ nhưng hiện không phải nguồn chuẩn.
- Các script còn trỏ `127.0.0.1:3988` phải được coi là script cũ, không chạy mù.

### Ghi chú lịch sử
- VidIQ, trends và các tool web từng được gom qua MCP Pool VPS trong các phiên cũ.
- Bài học giữ nguyên: luôn test runtime hiện tại trước khi kết luận tool không có.

### ⚠️ CÁCH GỌI TOOL MCP CHUẨN
- **Prefix:** `<nhóm>__<tên-tool>`
- **Ví dụ:** `vidiq__vidiq_channel_stats`, `firecrawl__firecrawl_scrape`, `exa__web_search_exa`
- **KHÔNG dùng:** format cũ như `vidIQ.channel_stats` (không có prefix nhóm)

### ⚠️ CẤU HÌNH MCP
- **Nguồn runtime:** OMP/CLI ngoài project.
- **Không dùng:** `d:/YTB/.mcp.json` hoặc các file project cũ làm nguồn duy nhất.
- **Không commit:** API key, bearer token hoặc file cấu hình máy cá nhân.

## 4. QUY TRÌNH XÁC MINH KÊNH MẪU NGÁCH (chuẩn MCP hiện tại)
1. `vidiq__vidiq_channel_stats` với channelId → ghi sub, +sub/30d, views/30d, video/30d.
2. Nếu NOT FOUND → `vidiq__vidiq_channel_search` fuzzy.
3. Đánh giá: `+sub/30d > 0` = còn tăng (XANH), `+0 video/30d` = đứng (note).
4. Cập nhật vào `kenh-mau.json` với note ngày đo.

## 5. ĐỘI AGENT MCP CHUẨN — ƯU TIÊN + FAILBACK + NHIỀU LỚP NHIỀU LUỒNG

Thiết kế này dùng cho **nghiên cứu ngách/kênh/tin tức** (nhiệm vụ chính của dự án). Mỗi việc có 1 tool "đầu tiên" (nhanh/chuẩn) + failback; chạy song song nhiều luồng rồi đối chiếu chéo.

### A. ĐỘI XÁC MINH KÊNH YOUTUBE (vidIQ là lõi)
|| Bậc | Tool MCP | Vai trò |
||---|---|---|
|| 1. Lõi | `vidiq__vidiq_channel_stats` | Số liệu sub/views/tăng trưởng chính xác |
|| 2. Failback | `vidiq__vidiq_channel_search` (fuzzy) | Handle sai / đổi tên → tìm kênh thật |
|| 3. Bổ trợ | `playwright__*` / `chrome-devtools__*` | Vào thẳng trang kênh khi cần bằng chứng trực quan |
|| Luồng song song | `vidiq__vidiq_channel_videos` | Xem chi tiết video của kênh mẫu (chất lượng nội dung) |

### B. ĐỘI TÌM TIN / TREND THỊ TRƯỜNG
|| Bậc | Tool MCP | Vai trò |
||---|---|---|
|| 1. Lõi | `trends__get_top_trends` (type="Google News") | Top news nhanh theo vùng |
|| 2. Failback | `jina__jina_read_url` RSS `news.google.com/rss?hl=...&gl=...` | Chi tiết tin Nhật/Hàn/US/VN |
|| 3. Failback | `firecrawl__firecrawl_scrape` (cùng RSS) | Khi jina chậm/bị chặn |
|| 4. Failback | `tavily__tavily_search` / `exa__web_search_exa` | Tổng hợp tin chủ đề cụ thể |

### C. ĐỘI ĐỌC WEB CHI TIẾT
|| Bậc | Tool MCP | Vai trò |
||---|---|---|
|| 1. Lõi | `firecrawl__firecrawl_scrape` | Đọc chi tiết 1 trang (markdown) |
|| 2. Failback | `jina__jina_read_url` | Đọc nhanh |
|| 3. Failback | `tavily__tavily_extract` / `web_fetch` (built-in) | Khi cần đơn giản |

### D. ĐỘI TỰ ĐỘNG HÓA TRÌNH DUYỆT (trang chặn bot / cần tương tác)
|| Bậc | Tool MCP | Vai trò |
||---|---|---|
|| 1. Lõi | `playwright__*` | Tương tác trình duyệt đầy đủ |
|| 2. Failback | `chrome-devtools__*` | Debug/inspect thay thế |
|| Lưu ý | — | Dùng khi web search/chỉ đọc không vào được (YouTube, trang login) |

### E. ĐỘI TRA CỨU CODE / TÀI LIỆU
|| Bậc | Tool MCP | Vai trò |
||---|---|---|
|| 1. Lõi | `context7__context7_query_docs` | Tài liệu thư viện code |
|| 2. Bổ trợ | `read_file` (built-in) | Đọc code trực tiếp |

### QUY TẮC VẬN HÀNH (áp dụng mọi nhiệm vụ)
1. **Ưu tiên tool lõi** đúng mục đích trước.
2. **Lỗi 1 lần → chuyển failback ngay**, không cố lại 2-3 lần (tránh lặp/timeout).
3. **Chạy song song nhiều luồng** (vidIQ + trends + jina cùng lúc) rồi **đối chiếu chéo** → kết luận chắc chắn.
4. **Kết hợp 2+ nguồn** cho số liệu quan trọng (vd sub từ vidIQ + biến động từ trends).
5. Ghi tool đã dùng vào note để tái kiểm tra được.

## 6. GHI CHÚ PHÒNG TÁI DIỄN
- Khi 1 tool lỗi, **không dùng đi dùng lại** → chuyển failback ngay.
- Luôn backup (`_backup/...`) trước khi sửa file data.
- Cập nhật CHANGELOG khi đổi cấu hình/script.
- Nguồn MCP runtime = proxy local 9router; cấu hình nằm ngoài project.
