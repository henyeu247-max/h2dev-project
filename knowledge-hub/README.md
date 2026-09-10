# Knowledge Hub — NotebookLM + lưu bền (YTB / research)

Mục tiêu: **phân tích sâu nhiều nguồn** (đa kênh YT, hàng trăm video, PDF, link) mà **không mất data cũ**, không phụ thuộc chỉ cloud NotebookLM.

## Kiến trúc 3 lớp

```
[1] RAW ARCHIVE (local — source of truth)
    Y:\YTB\H2DEV-Project\knowledge-hub\
      channels\<channel_id>\meta.json
      channels\<channel_id>\videos\<video_id>\meta.json
      channels\<channel_id>\videos\<video_id>\transcript.txt
      batches\<YYYYMMDD-topic>\manifest.json   # danh sách source đưa vào 1 notebook
      exports\                                 # PDF/sheet kéo từ NotebookLM Studio

[2] NOTEBOOKLM (lab phân tích — theo batch, có limit)
    1 notebook = 1 chủ đề / 1 cụm nguồn (không nhét cả kho)
    Pro ~300 sources/notebook · ~500 notebooks · 500k words/source
    Input: link YT, PDF, web, Drive folder (upload/sync)
    Output: chat + citation + chart/PDF/sheet (Pro agentic)

[3] OBSIDIAN / AGENT (trí nhớ làm việc + MCP sau)
    Kết luận, prompt ngách, quyết định → vault
    Hermes/AG đọc vault; (tuỳ chọn) MCP NotebookLM query notebook đang mở
```

## Vì sao không chỉ NotebookLM?

| Rủi ro | Thực tế |
|---|---|
| Limit source/notebook | Free ~50 · Pro ~300 · Ultra ~500–600 |
| Mất / đổi product | Cloud Google; rename Gemini Notebook |
| Hàng nghìn video đa kênh | **Vượt 1 notebook** → phải chia batch + archive local |
| Agent code/ops | Cần file local / Obsidian / MCP |

→ NotebookLM = **máy phân tích theo đợt**.  
→ `knowledge-hub` local = **kho không mất**.

## Chiến lược đa kênh / hàng trăm video

1. **Archive local trước** (script `scripts/archive_yt_channel.py`):
   - meta kênh + từng video (id, title, date, views, url)
   - transcript (yt-dlp `--write-auto-sub` / VTT→txt)
2. **Gom batch** ≤ limit notebook (khuyến nghị **≤80–150 source/batch** để chất lượng, dù Pro 300):
   - theo kênh, theo tháng, theo ngách (Bible / wildlife / JP…)
3. **Tạo notebook NotebookLM** tên: `YTB | <ngách> | <kênh|period> | <date>`
4. Add sources = URL list từ `batches\...\urls.txt` (hoặc PDF gộp transcript nếu cần offline)
5. Phân tích sâu → export Studio → `exports\` + note Obsidian 5–15 dòng chốt
6. Batch sau **không xóa** archive local; notebook cũ giữ hoặc archive PDF

## NotebookLM input tiện

- YouTube URL (từng video; playlist cẩn thận limit)
- Google Drive folder (sync tài liệu)
- PDF / Doc / web
- **Không** mount nguyên ổ N: — phải chọn file/link có chủ đích

## MCP (bước sau — khi cần agent query notebook)

Community (cookie Google, risk ToS/API đổi):

- `notebooklm-mcp` (npm pleaseprompto)
- `notebooklm-mcp-cli` (GitHub jacob-bd) — nhiều tool nhất
- Gắn Antigravity / Hermes giống vision MCP

**Ưu tiên phase 1:** archive local + batch + NotebookLM web.  
MCP khi workflow tay đã ổn.

## Map thư mục

```
knowledge-hub/
  README.md                 (file này)
  channels/                 raw theo kênh
  batches/                  manifest đưa vào NLM
  exports/                  output Studio
  notebooks-index.md        danh bạ notebook + batch trỏ đâu
  scripts/                  (symlink/copy từ ../scripts nếu cần)
```

## Lệnh nhanh

```bat
python Y:\YTB\H2DEV-Project\knowledge-hub\scripts\archive_yt_channel.py --channel-url "https://www.youtube.com/@HANDLE" --max 30
python Y:\YTB\H2DEV-Project\knowledge-hub\scripts\make_nlm_batch.py --channel UC... --limit 50 --name "wildlife-2026-08"
```

Mở `batches\<name>\urls.txt` → dán/import NotebookLM.
