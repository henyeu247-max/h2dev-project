# HƯỚNG DẪN DÙNG MCP CHUẨN (H2DEV-Project & D:\Mcp-Pool-Vps)

> Ngày cập nhật: 12/09/2026  
> Mục đích: Chuẩn hóa kiến trúc MCP nội bộ, phân định rõ ràng giữa **MCP Tool Server** và **AI Chat Model Gateway**, nắm bắt cách vận hành công cụ thực chiến 100% Local.

---

## 1. PHÂN ĐỊNH HẠ TẦNG: TRÁNH NHẦM LẪN GIỮA MODEL PROXY VÀ MCP TOOLS

Hệ thống trên máy tính gồm 2 dịch vụ độc lập với vai trò hoàn toàn khác nhau:

| Dịch vụ | Địa chỉ / Cổng | Bản chất & Vai trò | Vị trí mã nguồn |
|---|---|---|---|
| 🛠️ **MCP Pool v2 Local** | `http://127.0.0.1:3988/mcp` | **MCP Tool Server chuẩn cho công việc**<br>• Cung cấp **168–234 công cụ thực chiến** (vidIQ, Trends, Firecrawl, Exa, Tavily, Jina, Playwright, Camoufox, Filesystem, Memory...).<br>• Healthcheck: `http://127.0.0.1:3988/health`<br>• Giao thức: Streamable HTTP (JSON-RPC) của MCP SDK. | `D:\Mcp-Pool-Vps\` |
| 🧠 **9Router** | `http://127.0.0.1:20128` | **AI Chat Model Gateway / Proxy**<br>• Chuyên điều hướng các LLM chat model (Claude, GPT, Gemini, DeepSeek...) qua cổng `/v1/chat/completions` hoặc `/v1/messages` để AI suy nghĩ và giao tiếp.<br>• **KHÔNG PHẢI là MCP Tool Server**. | App quản lý model AI |

⚠️ **LƯU Ý CỐT LÕI CHO MỌI AGENT:**  
- 9Router (:20128) chỉ là nơi cấp API "não" (LLM) để chat.
- **Toàn bộ công cụ "tay chân"** để quét YouTube, đo từ khoá, cào web, duyệt web đều chạy từ **MCP Pool Local tại `D:\Mcp-Pool-Vps` (cổng :3988)**.
- Trước đây MCP Pool từng chạy trên VPS `mcp-pool.tonymmo.com`, nhưng hiện tại đã được chuyển đổi thành công sang **chạy 100% Local độc lập trên máy Windows** tại `D:\Mcp-Pool-Vps`.

---

## 2. KIỂM TRA & VẬN HÀNH MCP POOL LOCAL (:3988)

### Kiểm tra sức khỏe (Healthcheck)
```bash
curl -s http://127.0.0.1:3988/health
# Kết quả kỳ vọng: {"status":"ok","version":"2.0.0","tools":168,...}
```

### Khởi động khi cổng 3988 chưa chạy
- Chạy file: `D:\Mcp-Pool-Vps\start.cmd`
- Hoặc PowerShell: `powershell -File D:\Mcp-Pool-Vps\start-pool.ps1`
- File cấu hình Key/Token nằm tại: `D:\Mcp-Pool-Vps\.env`

---

## 3. BẢNG TRA CỨU CÔNG CỤ MCP CHO CÔNG VIỆC YOUTUBE

| Việc cần làm | Tên Tool MCP Pool chuẩn (`nhóm__tool`) | Tool thay thế (Fallback) |
|---|---|---|
| **Phân tích chỉ số kênh YouTube** (Sub, view, tăng trưởng 30 ngày) | `vidiq__vidiq_channel_stats` | `vidiq__channel_stats` |
| **Tìm video bùng nổ view (Outliers)** | `vidiq__vidiq_outliers` | `vidiq__trending_videos` |
| **Nghiên cứu từ khoá** (Volume, Competition, Overall) | `vidiq__vidiq_keyword_research` | `vidiq__keyword_research` |
| **Tìm kiếm kênh đối thủ theo ngách** | `vidiq__vidiq_channel_search` | `vidiq__youtube_search` |
| **Xem danh sách video của một kênh** | `vidiq__vidiq_channel_videos` | `vidiq__youtube_search` |
| **Đo xu hướng thị trường (Google/YouTube Trends)** | `trends__get_top_trends` | `trends__get_time_series` |
| **Cào nội dung bài viết / báo cáo web** | `firecrawl__firecrawl_scrape` | `jina__read_url` · `tavily__tavily_extract` |
| **Tìm kiếm web chuyên sâu** | `exa__web_search_exa` | `tavily__tavily_search` |
| **Tự động hoá trình duyệt / Vượt chặn bot** | `camoufox__*` | `playwright__*` · `chrome-devtools__*` |
| **Đọc / Ghi file dữ liệu** | `filesystem__*` | Tools built-in IDE |

---

## 4. QUY TRÌNH THẨM ĐỊNH DỮ LIỆU SỐNG QUA MCP

1. **Kiểm tra kết nối:** Gọi `vidiq_balance` hoặc `curl http://127.0.0.1:3988/health` xác nhận server hoạt động.
2. **Quét từ khoá ngách:** Dùng `vidiq_keyword_research` với `mode: "research"`, `country: "US"` hoặc `"JP"` để lấy điểm Volume và Competition.
3. **Bắt video bùng nổ (Outlier Scan):** Dùng `vidiq_outliers` với `publishedWithin: "threeMonths"`, `maxSubscribers: 100000` để tìm video của kênh nhỏ đạt view đột biến.
4. **Kiểm tra sức khoẻ kênh đối thủ:** Dùng `vidiq_channel_stats` truyền ID hoặc handle kênh để xem tốc độ tăng trưởng sub và view thật trong 30 ngày qua (`growth.viewsGained`, `growth.subscribersGained`).
5. **Đối chiếu chéo:** Kết hợp `trends__get_top_trends` để kiểm tra độ nóng chủ đề trên Google News hoặc YouTube Search.

---

## 5. NGUYÊN TẮC XỬ LÝ LỖI (FAILBACK RULES)

1. **Tool lỗi 1 lần → Đổi sang tool dự phòng ngay**, không spam gọi lại nhiều lần gây timeout.
2. **Không commit API keys vào Git repo:** Mọi secret/token quản lý tập trung tại `D:\Mcp-Pool-Vps\.env`.
3. **Đối chiếu chéo ít nhất 2 nguồn dữ liệu** trước khi kết luận một ngách là tiềm năng.
