# LIVE RUNTIME STATE — D:\YTB\H2DEV-Project
# Context Hierarchy Layer 4 | Single Source of Runtime Truth
# Cập nhật lúc: 2026-10-14 (mục 1 và mục 3 đo lại ngày này; mục 2 đo 2026-09-30; mục 4 nghiệm thu 2026-10-09)

> **Bản chất kỹ thuật:** File này ghi nhận trạng thái thực tế đang chạy (Live Reality) của hệ sinh thái `D:\YTB\H2DEV-Project`.
> Mọi Agent khi bắt đầu phiên làm việc đọc file này để nắm ngay thực trạng runtime mà không cần quét lại từ đầu.
>
> **Kỷ luật số liệu:** mọi con số trong file này phải **đo được** và ghi rõ nguồn chứng thực.
> Đã hiệu chỉnh 2026-09-24 sau khi đối chiếu chéo Local ↔ VPS (3 số cũ bị lệch, xem mục 1.1).

---

## 1. TỔNG QUAN TÀI NGUYÊN HỆ THỐNG (SSoT MANIFEST)

> **Nguồn chân lý:** `data/counts-manifest.json` (sinh tự động bằng `node scripts/sync-counts.js`;
> kiểm tra đồng bộ bằng `node scripts/sync-counts.js --check`). Các file JSON dữ liệu gốc tại `data-tabs/`.

- **Tập tin chân lý số liệu:** `data/counts-manifest.json` (tự động cập nhật qua `node scripts/sync-counts.js`).
- **Tổng kho bài học (`videos.json`):** **148 bài** (144 Video bài giảng PRO + 4 Buổi Zoom Masterclass; 27 Free · 121 Pro) — thuộc hệ thống **97yo-dev** tổng **333 bài học** (148 H2DEV + 140 Huân Academy + 45 DGMD; 35 module).
  → nguồn: `data-tabs/videos.json` (148) + `data/videos_huan.json` (140) + `data/videos_dgmd.json` (45) = **333** bài học toàn hệ thống.
- **Kiểm định media toàn vẹn:** **333/333 file** mp4/webm tồn tại (148 H2DEV + 140 Huân + 45 DGMD), 0 file 0 byte (`counts-manifest.mediaFiles`, dung lượng ~89.26 GB / 83.13 GiB). `audit_videos_v2.py` (đo lại 2026-10-14→25): **148/148 H2DEV + 185/185 Huân & DGMD clean · 0 issues · 0 standards_gaps · 0 A8d**. Lệnh đo: `py -3 scripts/audit_videos_v2.py`.
  - `VIDEO-f59aa7`: ĐÃ PHỤC HỒI đủ tiếng — giải mã Widevine CENC (pipeline `scripts/download_full_drm_audio.cjs` + `scripts/get_drm_key.py`), 108.5 MB, mean_volume -22.0 dB; phụ đề 397 đoạn phủ toàn thời lượng 43:08.
  - `VIDEO-8e0275`: video thao tác màn hình KHÔNG micro từ tác giả gốc → `content_kind=silent_screen_tutorial`, không phải lỗi.
  - Còn **36 review_flags** kiểm tay (không phải data hỏng): A10 19 (thumbnail ≠ nội dung theo vision) · S6 19 (takeaway neo transcript thấp) · S9 15 (xác nhận hình/tiếng bằng heuristic). Hàng đợi: `data/media-review-queue.json` (36 open · 5 resolved).
  → nguồn: `counts-manifest.mediaFiles` + `py -3 scripts/audit_videos_v2.py` + `data/media-review-queue.json`.
- **Danh bạ kênh mẫu (`kenh-mau.json`):** **261 kênh** (189 live · 72 dead).
  → nguồn: `data-tabs/kenh-mau.json` (đo thực tế N/N: 256/256 có `ngay_do`; 184 sống · 59 DIE 404 · 10 kênh rỗng · 3 dead khác; chạy `scripts/probe-kenh-mau.py` rồi `scripts/classify-kenh-mau.py`, bằng chứng `_audit/20261014-kenh-mau-probe.jsonl`). Kênh dead = 404 / bị chấm dứt / kênh rỗng 0 video; GIỮ NGUYÊN trong kho làm case study dẫn chứng bài học, không xóa.
- **Kênh mẫu canonical (`raw-kenh-mau.json`):** **156 hồ sơ** (149 kênh unique, 12 nhóm lớn + 3 nhóm đặc nhiệm).
  → nguồn: `counts-manifest.canonicalRaw` / `canonicalRawUniqueChannels`.
- **Kho tài liệu & Master Prompts (`tai-lieu-full.json`):** **300 tài liệu**.
  → nguồn: `data-tabs/tai-lieu-full.json` (đo lại 2026-10-14: **300**).
  Phân bố theo trường `kind` (đo 2026-10-14): 77 prompt · 21 report · 28 tool · 14 list · 8 other · 5 internal-doc · 14 sop · 49 guide · 40 transcript · 4 sheet · 40 chưa gán `kind` (giao diện suy ra loại từ tên/tệp, xem `classifyPrompt` trong `assets/app/tabs/content.js`).
- **Ma trận ngách YouTube (`ngach-xanh.json`):** **34 ngách** (`xanh:true` **10** ngách).
  → nguồn: `data-tabs/ngach-xanh.json` (đo lại 2026-10-14: 34).
- **Kho nhạc nền:** **49 tracks** đã audit Gemini Multimodal & FFprobe (36 SAFE YPP · 9 REVIEW · 4 COPYRIGHTED cấm dùng).
  → nguồn: rule workspace SSoT + `data/music_catalog.json`. *(Số cũ ghi 38 là SAI — đã sửa 2026-09-24.)*
- **Master SQLite Database:** **2.540 entries** FTS5 trong `h2dev_master.db`.
  → nguồn: đo trực tiếp `SELECT COUNT(*) FROM search_fts` trên VPS = **2540**. *(Số cũ ghi 2.003 là SAI — đã sửa 2026-09-24.)*
  Bảng kèm theo: `lessons` 333 · `lesson_timestamps` 2456 · `competitor_channels` 391 · `competitor_top_videos` 1421 · `documents` 300 · `reup_sources` 27 · `niches` 311 · `policies` 12 · `checklists` 12.

### 1.1. NHẬT KÝ HIỆU CHỈNH SỐ LIỆU (2026-09-24)

Phát hiện khi audit `gate-icons.js` chặng P3.6: 3 số trong file này **lệch so với runtime thật**.
Đã đo 2 đầu (Local `D:\YTB\H2DEV-Project` + VPS `103.249.201.164`) để chốt số đúng — không suy đoán:

| Mục | Số cũ (sai) | Số thật (đã sửa) | Cách chứng thực |
|---|---|---|---|
| Kho tài liệu | 153 | **157** | `node -e` đếm `data-tabs/tai-lieu-full.json` trên **cả 2 môi trường** = 157 |
| Master SQLite FTS5 | 2.003 | **2.014** | `sqlite3 h2dev_master.db "SELECT COUNT(*) FROM search_fts"` = 2014 |
| Kho nhạc nền | 38 | **49** | rule workspace SSoT (49 tracks) + `data/music_catalog.json` |

**Nguyên nhân gốc:** số được viết tay, không sinh tự động → trôi theo thời gian khi dữ liệu tăng.
**Cách phòng ngừa:** luôn lấy từ `counts-manifest.json` (sinh tự động) và chạy `sync-counts.js --check` trước khi push.

---

## 2. HẠ TẦNG DỊCH VỤ & MẠNG NỘI BỘ
> Đo lại 2026-09-30 bằng `Get-NetTCPConnection -State Listen` + `Get-Service`. PID đổi sau mỗi lần khởi động — đừng dùng PID làm bằng chứng lâu dài.
- **Cổng 8899:** `H2DEV_Service` (NSSM, Running) $\rightarrow$ `[CÓ] LISTENING`. Runtime Playwright: `/`, `/player.html`, `/learn.html` 0 console error.
- **Cổng 3988:** `MCP_Pool_Service` (NSSM, Running) $\rightarrow$ `[CÓ] LISTENING`.
- **Cổng 20128:** 9Router Gateway $\rightarrow$ `[CÓ] LISTENING`.
- **Cổng 20140:** Claude gateway (`~/.claude/gateway`) $\rightarrow$ `[CÓ] LISTENING`.
- **VPS production:** `103.249.201.164` — deploy qua `git push vps main` (post-receive: `sync-counts --check` → rebuild SQLite → PM2 reload `h2dev-learn`). Lưu ý: thư mục `video/` KHÔNG nằm trong git — media đổi phải rsync riêng.
- **Chính sách credit vidIQ:** Tài khoản còn 75 Add-on credits, 0 renewable. Đóng băng 100% các tool tính phí.

---

## 3. TRẠM VŨ KHÍ TÁC CHIẾN (SKILLS & PIPELINES)
- **Skill chuyên dụng `h2dev-*`:** nằm trong kho skill chung `~/.agents/source/skills/` (đồng bộ ra mọi tool bằng `~/.agents/sync/agents_sync.py`); thư mục `D:\YTB\.agents\skills\` không còn tồn tại (đo 2026-10-14). Các script sinh nội dung vẫn được `scripts/h2dev_master_producer.py` điều phối.
- **5 thư mục pipeline** tại `D:\YTB\H2DEV-Project\pipelines\` — mức độ sẵn sàng THẬT (đo 2026-09-30):
  | Pipeline | Có script chạy được | Ghi chú |
  |---|---|---|
  | `hoat-hinh-ai` | CÓ (`generate_images.py`, `generate_videos.py`, `merge_clips.py`) | cần `KIE_API_TOKEN` + `IMGBB_API_KEY` |
  | `ton-giao` | CÓ (`generate_voice.py`, `generate_image.py`, `merge_video.py`) | cần `ELEVENLABS_API_KEY` + `KIE_API_KEY` |
  | `wildlife` | CÓ — mới là khung (`generate_wildlife_script.py` sinh từ 3 case mẫu, `generate_motion_prompts.py`) | kịch bản sinh theo template, CHƯA gọi LLM; chưa có bước voice/merge |
  | `everyday-history` | CÓ — mới là khung (`generate_everyday_history.py` template 3 đồ vật, `assemble_history_video.py` ghép tĩnh) | câu narration lặp theo template → KHÔNG dùng làm bản đọc; chưa có Ken Burns thật |
  | `bible-explainer` | KHÔNG — chỉ zip skill + ảnh mẫu | dùng kèm `ton-giao` để có voice/merge |
- **Pilot `PILOT-01-THE-MIRROR`:** `paused` (Phương án B, anh chốt 2026-09-30). Kịch bản EN 1.927 từ đã đủ; không làm media cho pilot này đến khi anh mở lại.
- **8 Repo Reverse-Engineering:** Sẵn sàng tại `D:\YTB\research-repos\` (Tencent BrowserSkill, ainovel-cli, drama-skills, make-prompt-seedance2, dola-render-gateway, YouTube.js LuanRT, yt-fts, FckSignups NoSignups).

---

## 4. KẾT QUẢ KIỂM TOÁN & NGHIỆM THU E2E TOÀN BỘ 144 VIDEO (PART 1 – PART 8)
> Ngày hoàn tất nghiệm thu: **2026-10-09**.  
> Phương thức kiểm toán: **Subagent Độc lập (Independent QA & E2E Reality Auditor)** chạy Playwright Chromium thật (1440x900) + FFmpeg inspection + HTTP probes.

### 4.1. Thống Kê Nghiệm Thu Theo Phân Đoạn (100% ALL PASS)
| Phân đoạn | Phạm vi bài học | Số lượng | Tỷ lệ E2E | Kênh DIE xác thực | Console Errors | Bằng chứng thị giác | Biên bản nghiệm thu |
|---|---|---|---|---|---|---|---|
| **Part 1** | Bài 01 – 20 | 20 | 20/20 PASS | 0 | 0 | 20 ảnh | `docs/reports/2026-10-09-part1-acceptance-report-v2.json` |
| **Part 2** | Bài 21 – 40 | 20 | 20/20 PASS | 12 | 0 | 20 ảnh | `docs/reports/2026-10-09-part2-acceptance-report.json` |
| **Part 3** | Bài 41 – 60 | 20 | 20/20 PASS | 14 | 0 | 20 ảnh | `docs/reports/2026-10-09-part3-acceptance-report.json` |
| **Part 4** | Bài 61 – 80 | 20 | 20/20 PASS | 7 | 0 | 20 ảnh | `docs/reports/2026-10-09-part4-independent-subagent-acceptance.json` |
| **Part 5** | Bài 81 – 100 | 20 | 20/20 PASS | 9 | 0 | 20 ảnh | `docs/reports/2026-10-09-part5-independent-subagent-acceptance.json` |
| **Part 6** | Bài 101 – 120 | 20 | 20/20 PASS | 14 | 0 | 20 ảnh | `docs/reports/2026-10-09-part6-independent-subagent-acceptance.json` |
| **Part 7** | Bài 121 – 140 | 20 | 20/20 PASS | 7 | 0 | 20 ảnh | `docs/reports/2026-10-09-part7-independent-subagent-acceptance.json` |
| **Part 8** | Bài 141 – 144 | 4 | 4/4 PASS | 1 | 0 | 4 ảnh | `docs/reports/2026-10-09-part7-and-8-independent-subagent-acceptance.json` |
| **TỔNG CỘNG** | **Bài 01 – 144** | **144** | **144/144 PASS (100%)** | **68 (Khảo sát HTTP)** | **0 Errors** | **144+ ảnh PNG** | **Biên bản độc lập từng Part** |

### 4.2. Các Trụ Cột Nâng Cấp Kỹ Thuật Đạt Chuẩn Sản Xuất
1. **Chuẩn hóa Thumbnail PNG HD:** Đã trích xuất FFmpeg toàn bộ video dùng ảnh `.jpeg` cũ, 100% 144 video hiện trỏ về `assets/thumbs/<sku>.png` sắc nét.
2. **Khảo sát Thực Nghiệm Kênh Đối Thủ (HTTP 200 vs 404):** Đã rà soát HTTP toàn bộ các kênh đối thủ trong 144 video, phân loại 188 kênh LIVE và 68 kênh DEAD 404 tại thời điểm 2026-10-09 (đo thực tế lại 2026-10-14: 187 sống · 69 dead = 59 DIE 404 + 10 rỗng; trong đó có `@gyakkyoyori_risukatsu` ở Bài 140 và `@HopeGarden-KR` ở Bài 144), gắn cờ `dead: true` render badge đỏ `DIE` và gạch ngang tên kênh trên DOM.
3. **Chuẩn hóa Insights & SOP Né Quét AI:** 144/144 video đều có đủ:
   - $\ge 5$ Mấu chốt thực chiến (Key Takeaways).
   - Đủ 5 bước Kỹ thuật Edit & SOP né quét AI chi tiết (> 500 – 1.385 ký tự), không có chuỗi fallback ngắn.
   - $\ge 3$ Rào chắn phòng thủ & Tránh gậy bản quyền (Avoid Flags).
4. **Đồng bộ Master SQLite WAL & Nexus Dual-Layer Graph:**
   - Master database `data/h2dev_master.db` đã rebuild đầy đủ **333 lessons** (148 H2DEV · 140 Huân · 45 DGMD), **2.456 lesson timestamps**, **391 competitor channels**, **1.421 top videos**, **300 documents**, **27 reup sources**, **311 niches**, **12 policies**, **12 checklists** và **2.540 FTS5 search index entries**.
   - Nexus Dual-Layer Graph (`data/h2dev_knowledge_graph.db` + `data/knowledge_graph.json` + Obsidian Vault `knowledge-hub/vault/` + Web Explorer `/graph`) đã lập chỉ mục toàn diện **3.007 nodes** và **5.780 edges** qua 2 lớp (1.695 Knowledge nodes + 1.312 Infra nodes trên 17 dự án).
5. **Quality Gates:** Toàn bộ Core Gates (`validate-project.js`, `sync-counts.js --check`, `gate-icons.js`, `gate-typography.js`, `gate-p1.js`, `gate-p2.js`, `gate-shell.js`, `check-ui-classes.js`, `guard-no-inline-onclick.js`) đều **PASS 100%**.
