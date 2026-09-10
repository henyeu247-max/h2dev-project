# Phân tích MCP đầy đủ cho dự án YTB — 27/07/2026

> 3 nhóm nghiên cứu song song, mọi thông tin verify từ nguồn chính chủ (GitHub API, trang pricing, docs).
> Trạng thái repo/giá kiểm tra ngày 27/07/2026.

## TÓM TẮT QUYẾT ĐỊNH

### ✅ ĐÃ CÀI (free — có trong `.mcp.json`, reload là chạy)

| MCP | Loại | Công dụng | Ghi chú |
|---|---|---|---|
| **nexlev** | HTTP + OAuth | 65 tools nghiên cứu ngách/kênh/monetization | Đã kết nối ✔ |
| **google-news-trends** | uvx, không key | Tin tức + trending keywords | |
| **reddit** (reddit-mcp-buddy) | npx, không key | Đào ý tưởng chuyện từ subreddit (Bible, folklore, senior-life). Anonymous 10 req/phút; tạo Reddit script-app free thì 60–100 req/phút | NexLev không có mảng này |
| **notion** (chính chủ) | HTTP + OAuth | Content calendar + kho kịch bản. Free plan đủ dùng solo | Lần đầu dùng cần đăng nhập OAuth qua `/mcp` |
| **canva** (chính chủ) | HTTP + OAuth | Tạo/sửa/export thumbnail, hoạt động cả Canva Free | Dùng cho text-overlay/layout; ảnh nền vẫn nên từ pipeline AI |

### 🔑 CÀI KHI CÓ KEY (đáng nhất — theo thứ tự ưu tiên)

| Ưu tiên | MCP | Key cần | Giá | Vì sao đáng |
|---|---|---|---|---|
| 1 | **felores/kie-ai-mcp-server** (`npx -y @felores/kie-ai-mcp-server`) | KIE_AI_API_KEY (cùng key pipeline) | kie.ai pay-per-use | 1 server = Veo 3 + Nano Banana Pro + **Suno V5 nhạc nền** + Kling + Flux 2 + ElevenLabs TTS... Push 4 ngày trước, rất sống. Dùng `KIE_AI_ENABLED_TOOLS` để giảm số tool. KHÔNG dùng bản andrewlwn77 (bỏ hoang 11 tháng) |
| 2 | **ElevenLabs MCP** chính chủ (`uvx elevenlabs-mcp`) | ELEVENLABS_API_KEY (cùng key pipeline) | Free 10k credits/tháng | Voice design/clone/STT/SFX ngay trong chat |
| 3 | **TrendsMCP** (`https://api.trendsmcp.ai/mcp` + Bearer key) | Key free từ trendsmcp.ai (không cần thẻ) | Free 100 req/tháng | Time-series 5 năm trên Google + **YouTube + TikTok + Reddit** — check evergreen vs tàn |
| 4 | **DataForSEO MCP** chính chủ (`npx dataforseo-mcp-server@latest`) | Nạp tối thiểu $50 (không hết hạn) | ~$0.002/YouTube SERP, ~$0.009/Trends call | YouTube SERP theo nước (KR/JP/US) + video info/comments/subtitles + Google Trends từ 2004 + search volume Google Ads. Set `ENABLED_MODULES="SERP,KEYWORDS_DATA,DATAFORSEO_LABS"` |
| 5 | **MiniMax MCP** chính chủ (`uvx minimax-mcp`) | MINIMAX_API_KEY | ~$60/1M ký tự | Voice Nhật/Hàn bản xứ, rẻ hơn ElevenLabs nhiều cho volume lớn |
| 6 | **Typecast MCP** chính chủ Neosapience | TYPECAST_API_KEY | Chưa rõ giá | Voice Hàn tốt nhất còn sống (⚠️ **Supertone API đóng cửa 31/08/2026 — TRÁNH**) |

### 🕐 SAU NÀY (khi kênh đã chạy)

- **anwerj/youtube-uploader-mcp** — upload + hẹn giờ đăng + thumbnail + phụ đề. Installer 1 lệnh cho Windows (Go binary). Cần Google Cloud OAuth client. Quota free ~6 video/ngày. Lưu ý: OAuth app chưa verify thì video upload bị khóa private — test 1 video trước.
- **kinocut FFmpeg MCP** (`uvx --from kinocut kino`) — 161 tools dựng phim agent-driven, free local, rất sống (push 3 ngày trước). **Chờ cài FFmpeg trước** (chưa có trên máy).
- **VOICEVOX MCP** (`npx -y @kajidog/mcp-tts-voicevox`) — TTS Nhật FREE local (tương thích cả AivisSpeech engine). Khi làm kênh Nhật. Nhớ ghi credit "VOICEVOX:tên nhân vật".
- **Vling API** (open.apix.vling.net) — data kênh Hàn chuyên sâu, B2B phải email hỏi giá.
- **Phân tích kênh CỦA MÌNH**: NexLev đã có sẵn nhóm `get_my_*` (revenue, retention, demographics) — chỉ cần connect kênh vào NexLev dashboard. Không cần MCP thêm.

### ⛔ LOẠI (đã check kỹ — đừng mất thời gian)

| Nền tảng | Lý do loại |
|---|---|
| TubeLab / vidIQ MCP | Cần gói trả phí Pro/Max, trùng NexLev |
| Semrush / Ahrefs MCP | $139–999/tháng |
| Keywords Everywhere | $84/năm trả trước, DataForSEO rẻ hơn nhiều |
| Social Blade API | $0.50/lượt tra — NexLev đã có analytics |
| Playboard.co | Không API — cần thì scrape bằng firecrawl |
| Google Keyword Planner MCP | Setup Google Ads MCC + dev token nhiều ngày, DataForSEO có cùng data |
| Quora | Không MCP free — dùng exa/tavily `site:quora.com` |
| Buffer / Hootsuite | Buffer KHÔNG hỗ trợ video dài (chỉ Shorts <3 phút); Hootsuite $99/tháng |
| Zapier MCP | Free chỉ ~50 lượt gọi/tháng |
| n8n | Phải nuôi server riêng cho 6–9 sự kiện/tuần — Python script đủ |
| Figma MCP | Free chỉ 6 lượt gọi/THÁNG |
| ThumbnailTest / TubeBuddy | API sau $49/tháng / không có API. Dùng "Test & Compare" free của YouTube Studio (3 thumbnail) |
| Midjourney MCP riêng | Không có API chính thức, mọi đường đều vi phạm ToS/reseller — nếu cần MJ thì qua kie.ai (chấp nhận rủi ro) |
| Suno MCP riêng | Chưa có API chính thức (7/2026 mới "exploring") — dùng Suno V5 qua kie.ai MCP |
| json2video / Creatomate / Remotion MCP | Watermark free plan / không có MCP thật / MCP đã deprecated (thành skill) |
| ComfyUI | Máy không GPU, cloud trả phí — kie.ai đủ |
| Shotstack | Có MCP chính chủ + 10 credit free nhưng FFmpeg+Vrew đã đủ — chỉ thử khi cần render cloud hàng loạt |
| andrewlwn77/kie-ai-mcp | Bỏ hoang 11 tháng — dùng bản felores |
| dannySubsense/youtube-mcp | 100% trùng NexLev |
| Freesound/Pixabay MCP | Không có bản đáng tin — dùng web trực tiếp |

## Lịch đăng video: KHÔNG cần MCP scheduler nào

YouTube Data API có sẵn `videos.insert` với `status.publishAt` (hẹn giờ đăng native) + `thumbnails.set` — viết 1 script Python là xong, free, 10.000 quota units/ngày (~6 uploads).

## Điểm chưa verify được (minh bạch)

- MiniMax có free tier hay không; giá API Typecast; giá Comfy Cloud
- Tools YouTube trong DataForSEO MCP verify qua Glama listing (không phải README) — sau khi nạp tiền nên test 1 call $0.002 trước
- Hootsuite "3 MCP servers" chỉ có nguồn phụ (blog đối thủ) xác nhận
