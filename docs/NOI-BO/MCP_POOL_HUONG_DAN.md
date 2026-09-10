# 🧠 MCP POOL — Hướng dẫn chuẩn toàn diện

> **Note tri thức** — dùng lại cho các phiên sau. Mọi thứ về MCP Pool VPS: cài đặt, tools, API keys, cách gọi chuẩn.
> *Cập nhật: 2026-08-23*

---

## 1. TỔNG QUAN

MCP Pool là một **MCP server tập trung** chạy trên VPS, gộp **17 nhóm / 194 tools** MCP về một endpoint duy nhất. Nhiều máy/IDE/CLI cùng kết nối dùng chung.

| Thông số | Giá trị |
|----------|---------|
| **Endpoint** | `https://mcp-pool.tonymmo.com/mcp` |
| **Auth** | `Authorization: [REDACTED-MCP-POOL-2026-08-31]` HOẶC `X-API-Key: mcp-pool-[REDACTED]` |
| **Transport** | MCP Streamable HTTP (JSON-RPC) |
| **Tools** | 194 tools / 17 nhóm |
| **Server (VPS)** | `103.249.201.164` (aaPanel, Nginx, PM2) |
| **Code (local)** | `G:\Hermes - Agent\mcp-pool\` |

**Cơ chế:** MCP Pool spawn/forward tới các MCP server gốc:
- **stdio servers** (npx): exa, firecrawl, jina, chrome-devtools, playwright, context7, agent-vision, tavily(mcp-remote)
- **HTTP servers** (JSON-RPC): vidiq, trends, context-dev, ui-skills
- **Python venv**: camoufox (anti-detect browser)
- **Internal**: filesystem, memory, sequential-thinking, vision

---

## 2. 17 NHÓM TOOLS — CHỨC NĂNG & CÁCH DÙNG

| # | Nhóm | Tools | Chức năng | Nguồn |
|---|------|-------|-----------|-------|
| 1 | **vidiq** | 57 | Phân tích YouTube/IG: search, trending, stats, keyword, tạo thumbnail | HTTP MCP |
| 2 | **chrome-devtools** | 29 | Browser automation qua Chrome CDP | npx |
| 3 | **firecrawl** | 29 | Scrape/search/extract/crawl web | npx |
| 4 | **playwright** | 25 | Browser automation (navigate, click, screenshot...) | npx |
| 5 | **camoufox** | 14 | Browser **vượt chặn bot** (webdriver=false) | Python venv |
| 6 | **filesystem** | 7 | Đọc/ghi/list file (sandbox /data) | internal |
| 7 | **tavily** | 7 | Search + extract web | mcp-remote |
| 8 | **memory** | 6 | Knowledge graph (entity/relation/observe) | internal |
| 9 | **trends** | 5 | Google/X/YouTube/Reddit/TikTok trends + time-series | HTTP MCP |
| 10 | **exa** | 4 | AI semantic search + fetch | npx |
| 11 | **context7** | 2 | Tra cứu docs thư viện | npx |
| 12 | **context-dev** | 2 | Tìm SDK method + execute code sandbox | HTTP MCP |
| 13 | **sequential-thinking** | 2 | Suy luận từng bước (chain-of-thought) | internal |
| 14 | **ui-skills** | 2 | List/get ~130 UI design skill (frontend, web-clone...) | HTTP MCP |
| 15 | **agent-vision** | 1 | Phân tích ảnh (Combo-Gemini) | npx |
| 16 | **jina** | 1 | Đọc URL thành text sạch | npx |
| 17 | **vision** | 1 | Nhận diện/đọc ảnh | internal |

### Cách dùng tool (prefix nhóm):
```
<tên-nhóm>__<tên-tool>
Ví dụ: vidiq__vidiq_youtube_search, firecrawl__firecrawl_scrape, ui-skills__list_skills
```

---

## 3. API KEYS — ĐÃ CÓ / CÒN THIẾU

> ⚠️ Key thật nằm trong file `G:\Hermes - Agent\mcp-pool\API_KEYS_MCP_REFERENCE.md` (đã sync lên Obsidian `notes/API_KEYS_MCP_REFERENCE.md`).

| Service | Đã có key? | Ghi chú |
|---------|-----------|---------|
| exa | ✅ CÓ | |
| tavily | ✅ CÓ | |
| firecrawl | ✅ CÓ | |
| jina | ✅ CÓ | |
| agent-vision | ✅ CÓ | qua tonymmo proxy (Combo-Gemini) |
| vidiq | ✅ CÓ | |
| trends | ✅ CÓ | |
| context-dev | ✅ CÓ | |
| github | ✅ CÓ | (trong ZCode cũ) |
| 9router-gateway | ✅ CÓ | |
| **camoufox** | Không cần | free MPL-2.0 |
| **ui-skills** | Không cần | free |
| **context7** | Không cần | free |
| **playwright/chrome-devtools** | Không cần | cần Chrome trên VPS |

**Key nằm trong:** `.env` trên VPS (`/opt/mcp-pool/.env`, chmod 600) + `.env` local (`G:\Hermes - Agent\mcp-pool\.env`).

---

## 4. CÁCH KẾT NỐI TỪ IDE/CLI (CHUẨN)

### CodeBuddy / VSCode / Claude / Pi — cấu hình mcp.json:
```json
{
  "mcpServers": {
    "mcp-pool": {
      "type": "http",
      "url": "https://mcp-pool.tonymmo.com/mcp",
      "headers": {
        "Authorization": "[REDACTED-MCP-POOL-2026-08-31]",
        "X-API-Key": "mcp-pool-[REDACTED]"
      }
    }
  }
}
```

### Đã cấu hình sẵn trên PC này (8 file):
- `.codebuddy\mcp.json`, `.vscode\mcp.json`, `.pi\agent\mcp.json`
- `AppData\Roaming\Code\User\mcp.json`, `CodeBuddy CN\User\mcp.json`
- `.claude.json`, `.zcode\cli\config.json`, `.config\opencode\opencode.json`

---

## 5. CÁCH GỌI TOOL CHUẨN (JSON-RPC)

```bash
curl -sk -X POST https://mcp-pool.tonymmo.com/mcp \
  -H "Authorization: [REDACTED-MCP-POOL-2026-08-31]" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"ui-skills__list_skills","arguments":{"query":"web-clone"}},"id":1}'
```

### Các method MCP:
| Method | Mục đích |
|--------|----------|
| `initialize` | Bắt đầu session, nhận protocolVersion |
| `tools/list` | Liệt kê 194 tools |
| `tools/call` | Gọi tool cụ thể |
| `notifications/initialized` | Báo đã sẵn sàng |

---

## 6. CÁCH CÀI ĐẶT MCP POOL TỪ ĐẦU (ĐỂ AGENT CÀI THEO)

> Hướng dẫn này để bất kỳ agent nào cũng cài lại được.

### Bước 1 — Chuẩn bị code
```
Source: G:\Hermes - Agent\mcp-pool\  (toàn bộ thư mục)
```

### Bước 2 — Deploy lên VPS
```bash
scp -r mcp-pool/* root@103.249.201.164:/opt/mcp-pool/
cd /opt/mcp-pool && npm install --production
```

### Bước 3 — Cài Camoufox (Python venv riêng, không phá hệ thống)
```bash
python3 -m venv /opt/camoufox-mcp/venv
/opt/camoufox-mcp/venv/bin/pip install fastmcp camoufox
/opt/camoufox-mcp/venv/bin/python -m camoufox fetch
```

### Bước 4 — Cài Chrome (cho chrome-devtools)
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -i google-chrome-stable_current_amd64.deb
```

### Bước 5 — Cấu hình `.env` (API keys)
Tạo `/opt/mcp-pool/.env` với các key (xem mục 3), `chmod 600`.

### Bước 6 — Cấu hình Nginx (aaPanel)
Proxy `/mcp` → `127.0.0.1:3988`, `/health`, `/tools`. Kèm header `X-API-Key`, `MCP-Session-Id`.

### Bước 7 — Chạy PM2
```bash
cd /opt/mcp-pool && pm2 start ecosystem.config.cjs
```

### Bước 8 — Kiểm tra
```bash
curl https://mcp-pool.tonymmo.com/health   # → {"tools":194,"status":"ok"}
```

---

## 7. CÁCH LÀM CHUẨN 1 MCP SERVER MỚI (KHI THÊM NHÓM MỚI)

> Ví dụ cách UI Skills làm (nguồn chuẩn): endpoint + tools + docs rõ ràng.

### Để thêm 1 MCP server vào pool:
1. **Nếu là HTTP MCP server** → thêm vào `HTTP_SERVERS` trong `tools/mcp_bridge.js`:
   ```js
   HTTP_SERVERS.push({ name: "tên-nhóm", url: "https://.../mcp", headers: {} });
   ```
2. **Nếu là stdio (npx)** → thêm vào `STDIO_SERVERS`:
   ```js
   { name: "tên-nhóm", command: "npx", args: ["-y", "package-mcp"], env: {API_KEY: process.env.X} }
   ```
3. Deploy lại + test `tools/list` xác nhận nhóm mới xuất hiện.

### Tiêu chuẩn 1 MCP server tốt (theo chuẩn UI Skills):
- Có endpoint rõ ràng (`.well-known/mcp/server-card.json` nếu public)
- Tools có `name`, `description`, `inputSchema` đầy đủ
- Docs hướng dẫn: cách cài, cách gọi, ví dụ
- Không cần key (hoặc key qua header chuẩn)

---

## 8. CÁC ĐIỂM QUAN TRỌNG

- **Key mặc định hiện tại**: `mcp-pool-[REDACTED]` → **KHÔNG nên giữ lâu**, đổi thành key mạnh hơn nếu cần.
- **Camoufox** cần proxy cho site khó (đặt `CAMOUFOX_PROXY` trong `.env`).
- **Trends** free 100 req/tháng.
- **Local test** (Windows): 181 tools (thiếu camoufox vì không có venv Linux) — là bình thường.
- **Chrome-devtools** trên VPS kết nối qua `--browserUrl http://127.0.0.1:9222` (do chạy root cần no-sandbox).

---

*File này là note tri thức chuẩn. Muốn chi tiết kỹ thuật → `G:\Hermes - Agent\mcp-pool\README.md` + code nguồn.*
