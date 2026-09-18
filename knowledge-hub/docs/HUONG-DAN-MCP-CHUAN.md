# HƯỚNG DẪN DÙNG MCP CHUẨN (H2DEV-Project & D:\Mcp-Pool-Vps)

> Cập nhật: **2026-09-16**  
> Mục đích: Chuẩn hóa kiến trúc MCP nội bộ + **routing thực chiến theo evidence live** (benchmark Check-Pass trên máy anh).  
> Proof: `_audit/mcp-bench-*.json`, `_audit/mcp-web-bench-*.json`, `_audit/mcp-web-fair-*.json`  
> Backup bản cũ: `_backup/20260916-mcp-guide/HUONG-DAN-MCP-CHUAN.md`

---

## 1. PHÂN ĐỊNH HẠ TẦNG (KHÔNG NHẦM MODEL PROXY VỚI MCP TOOLS)

| Dịch vụ | Địa chỉ | Bản chất | Mã nguồn |
|---|---|---|---|
| **MCP Pool v2 Local** | `http://127.0.0.1:3988/mcp` | Tool server thực chiến (**188 tools live** — 20 namespace, đo 18/09/2026) | `D:\Mcp-Pool-Vps\` |
| Healthcheck | `http://127.0.0.1:3988/health` | Kỳ vọng: `{"status":"ok","version":"2.0.0","tools":188,...}` (182 nếu bridge tavily fail do mạng) | Windows Service `MCP_Pool_Service` AUTO |
| **9Router** | `http://127.0.0.1:20128` | **AI Chat Model Gateway** — chỉ LLM chat | **KHÔNG phải MCP tool server** |
| H2DEV Web | `http://127.0.0.1:8899` | App học liệu / Mission Control | `D:\YTB\H2DEV-Project\` |

**Cốt lõi:** 9Router = “não” chat. Mọi tay chân (YouTube / web / browser) = MCP Pool `:3988`. Auth: header `X-API-Key` từ `MCP_POOL_API_KEY` trong `D:\Mcp-Pool-Vps\.env` (không hardcode vào repo).

**Reload mềm `.env` (không cần restart service — thêm 18/09/2026):**
```bash
# Chỉ làm mới token/header HTTP (trends/vidiq/keenable/monid/tinyfish/ydc/context-dev) — 0 spawn tiến trình
curl -X POST "http://127.0.0.1:3988/admin/reload-env" -H "X-API-Key: <MCP_POOL_API_KEY>"
# Thêm ?stdio=1 để respawn CẢ bridge stdio (exa/firecrawl/jina/tavily/context7) — CHỈ respawn bridge có config đổi
curl -X POST "http://127.0.0.1:3988/admin/reload-env?stdio=1" -H "X-API-Key: <MCP_POOL_API_KEY>"
```
Trả về `{ok, changedKeys, httpUpdated, stdioRespawned, stdioUnchanged}`. Mặc định **không spawn** process nào.

Khởi động khi chết cổng: `D:\Mcp-Pool-Vps\start.cmd` hoặc `start-pool.ps1`.

---

## 2. CHECK-PASS TỐI THIỂU TRƯỚC MỌI PHIÊN

1. `curl -s http://127.0.0.1:3988/health` → `status:ok`, `tools` > 0  
2. `Get-Service MCP_Pool_Service` → Running / Automatic  
3. Gọi thử 1 tool nhẹ: `youtube_intelligence__keyword_suggest` hoặc `keenable__search_web_pages`  
4. Đọc `inputSchema` trước khi gọi — **sai tên tham số = lỗi giả** (vd. `latest_videos` bắt buộc `channelId`, không phải handle)

---

## 3. TẦNG A — YOUTUBE INTELLIGENCE ($0, ĐƯỜNG CHÍNH STREAM B)

Ưu tiên tuyệt đối khi làm ngách / đối thủ / YPP / outlier. Live bench 2026-09-16:

| Tool | Latency tham chiếu | Ghi chú schema |
|---|---:|---|
| `youtube_intelligence__niche_rpm_predictor` | ~51ms | `nicheKey` enum + `monthlyViews` |
| `youtube_intelligence__query_database` | ~72ms | view: breakouts / all_channels / recent_edges |
| `youtube_intelligence__breakout_finder` | ~157ms | |
| `youtube_intelligence__latest_videos` | ~183ms | **required `channelId` (UC...)** |
| `youtube_intelligence__keyword_suggest` | ~288ms | |
| `youtube_intelligence__search_channels` | ~428ms | |
| `youtube_intelligence__channel_dossier` | ~450ms | `channel: "@Handle"` hoặc URL |
| `youtube_intelligence__outlier_scanner` | ~461ms | |
| `youtube_intelligence__check_monetization` | ~1.3s | |
| `youtube_intelligence__video_details` | ~1.8s | `videoId` |
| `youtube_intelligence__transcript` | ~2.3s | `videoId` |
| `youtube_intelligence__spider_niche` | ~8.7s | `seedVideoId` — co-watch 2-hop |

Fallback script local (không MCP): `scripts/free_yt_engine.py` (`py -3`).  
`vidiq__*`: chỉ fallback khi cần; hay `ROUTED_ERR` khi quota/API lỗi — **không** đặt làm đường chính.

`trends__*`: **ĐÃ HOẠT ĐỘNG** (18/09/2026 — pool restart nạp `TRENDS_ACCESS_TOKEN` + `TRENDS_KEYS` từ `.env`; `trends__get_top_trends` trả data thật). Lưu ý: pool chỉ đọc `.env` **lúc boot** ⇒ đổi token phải restart service.

---

## 4. TẦNG B — WEB GROUNDING (ROUTING CÔNG BẰNG THEO BENCH LIVE)

Query chuẩn đối soát: *YouTube YPP reused/inauthentic policy 2026* + URL Help YouTube.  
Hai vòng: `mcp-web-bench` + `mcp-web-fair` (2026-09-16).

### 4.1 Bảng xếp hạng thực chiến (máy anh)

| Việc | Hạng 1 | Hạng 2 | Hạng 3 / dự phòng |
|---|---|---|---|
| **Search / discovery** | **Exa** (`exa__web_search_exa` ~1.8s q8) **hoặc Keenable** (`keenable__search_web_pages` ~0.8s q8) | Firecrawl search (~2.4s) · YDC discover (~3.0s) | Tavily search (~4.4s) · TinyFish search (~3.2s) |
| **Fetch / đọc URL đã biết** | **Keenable fetch** (~0.4s q9) **hoặc Exa fetch** (~0.27s q7) | **Firecrawl scrape** (~1.0s q9, markdown dày) · Jina (~0.8s) | YDC contents (~2.0s) · TinyFish fetch (~1.7s) |
| **Scrape sâu / JS / map site** | **Firecrawl scrape** (chất lượng cao nhất) | Firecrawl map (~7.6s, chậm hơn) | Tavily map/crawl hiện yếu / 429 / schema lệch |
| **Docs thư viện code** | `context-dev__search_docs` | Context7 (cần đúng schema `query`) | Không dùng Exa/Tavily trừ blog |

### 4.2 Kết luận cân bằng (không có 1 tool thắng mọi việc)

1. **Nhanh + đủ dùng khi search:** Keenable hoặc Exa  
2. **Search semantic / nghiên cứu:** Exa (theo định vị sản phẩm + bench)  
3. **Scrape markdown đầy đủ từ URL:** Firecrawl scrape  
4. **Fetch siêu nhanh:** Exa fetch / Keenable fetch / Jina  
5. **Tavily:** search được nhưng chậm hơn trên cùng query; extract/map/crawl lần đo **WEAK / 429 / schema** → không ưu tiên  
6. **YDC (You.com) / TinyFish:** lớp dự phòng search/fetch ổn, latency ~2–3s  

### 4.3 Inventory web MCP đang có trong pool

- `exa__*` — search/fetch  
- `tavily__*` — 8 tool: `search`/`extract` (native, gọi thẳng `api.tavily.com`) + `tavily_search|extract|crawl|map|research|feedback` (bridge `npx mcp-remote`)
  - ⚠️ **Cảnh báo mạng (18/09/2026):** hạ tầng Tavily (`mcp.tavily.com` + `api.tavily.com`, AWS) **rất chậm từ VN** — connect 12–15s, ~33% timeout (đối chứng `mcp.exa.ai`/`mcp.firecrawl.dev` < 1s). Bridge `npx mcp-remote` đã được nâng timeout **15s → 45s** trong `mcp_bridge.js` (trước đó mất cả 5–6 tool bridge lúc boot). ⇒ **Không đặt Tavily làm đường chính** — dùng Exa/Firecrawl/Keenable.
- `firecrawl__*` — scrape/search/map/crawl/agent/monitor/research… (bộ lớn nhất)  
- `jina__read_url`  
- `ydc__you-search|you-contents|you-discover|you-balance`  
- `tinyfish__search|fetch_content|…automation…`  
- `keenable__search_web_pages|fetch_page_content`  
- `context7__*` · `context-dev__*` — docs lib  
- Lưu ý: `firecrawl_extract` **deprecated** qua MCP → dùng `firecrawl_scrape` + formats json nếu cần structured

### 4.4 Routing bắt buộc khi làm H2DEV

```
[Cần tìm trên web]
  → keenable__search_web_pages  OR  exa__web_search_exa
  → fallback: firecrawl__firecrawl_search → ydc__you-search → tavily__tavily_search → tinyfish__search

[Đã có URL, cần đọc]
  → keenable__fetch_page_content  OR  exa__web_fetch_exa
  → nếu cần markdown/JS đầy đủ: firecrawl__firecrawl_scrape
  → fallback: jina__read_url → ydc__you-contents → tinyfish__fetch_content

[Crawl / map site / agent extract]
  → firecrawl__firecrawl_map / crawl / agent
  → (Tavily crawl/map: tránh cho đến khi hết 429 + đúng schema)

[Docs code/lib]
  → context-dev__search_docs / context7__* (đúng inputSchema)
```

---

## 5. TẦNG C — BROWSER / E2E (KHI CẦN UI THẬT)

- `playwright__*` · `camoufox__*` · `chrome-devtools__*`  
- Dùng cho nghiệm thu UI H2DEV / trang động; **không** thay YouTube Intelligence cho số liệu kênh.

---

## 6. FAILBACK & KỶ LUẬT GỌI TOOL

1. Tool lỗi **1 lần** → đổi tool dự phòng ngay (không spam).  
2. Phân biệt: lỗi schema/args vs lỗi quota/429 vs lỗi mạng.  
3. Đối chiếu **≥ 2 nguồn** trước khi kết luận ngách / chính sách.  
4. Không commit API key; secrets chỉ trong `D:\Mcp-Pool-Vps\.env`.  
5. Truth hierarchy: **Runtime MCP response > Script local > Docs hướng dẫn này > Giả định**.  
6. Sau thay đổi routing quan trọng: ghi `CHANGELOG.md` + giữ proof trong `_audit/`.

---

## 7. QUY TRÌNH THẨM ĐỊNH DỮ LIỆU SỐNG (STREAM B)

1. Health `:3988`  
2. `youtube_intelligence__channel_dossier` + `latest_videos` (`channelId`) + `outlier_scanner`  
3. `check_monetization` + `video_details` / `transcript` cho video bão view  
4. `spider_niche` khi cần co-watch / blue ocean  
5. Web grounding chính sách (routing mục 4) khi đụng YPP / reused / inauthentic  
6. Ghi nhận vào `data-tabs` / master DB qua quy trình dự án (backup trước khi sửa)

---

## 8. TÓM TẮT “NHỚ KỸ” CHO AGENT

- MCP Pool = tay chân; 9Router = não chat.  
- YouTube: `youtube_intelligence__*` trước, vidIQ sau.  
- Web search: **Keenable / Exa** trước.  
- Web scrape sâu: **Firecrawl scrape**.  
- Web fetch nhanh: **Exa fetch / Keenable fetch / Jina**.  
- Tavily = dự phòng search, không phải mặc định.  
- Trends = chưa dùng được đến khi có token.  
- Luôn đọc schema · Check N/N · bằng chứng 3 mức CÓ / KHÔNG / KHÔNG-VERIFY-ĐƯỢC.
