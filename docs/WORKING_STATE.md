# LIVE RUNTIME STATE — D:\YTB\H2DEV-Project
# Context Hierarchy Layer 4 | Single Source of Runtime Truth
# Cập nhật lúc: 2026-09-30T22:30:00+07:00

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
- **Tổng kho bài học (`videos.json`):** **140 bài** (136 Video bài giảng PRO + 4 Buổi Zoom Masterclass; 27 Free · 113 Pro).
  → nguồn: `data-tabs/videos.json` (Local = VPS = 140).
- **Kiểm định media toàn vẹn:** **140/140 file** mp4/webm tồn tại, 0 file 0 byte. `audit_videos_v2.py` (đo lại 2026-09-30): **140/140 clean · 0 issues · 0 standards_gaps · 0 A8d**.
  - `VIDEO-f59aa7`: ĐÃ PHỤC HỒI đủ tiếng — giải mã Widevine CENC (pipeline `scripts/download_full_drm_audio.cjs` + `scripts/get_drm_key.py`), 108.5 MB, mean_volume -22.0 dB; phụ đề 397 đoạn phủ toàn thời lượng 43:08.
  - `VIDEO-8e0275`: video thao tác màn hình KHÔNG micro từ tác giả gốc → `content_kind=silent_screen_tutorial`, không phải lỗi.
  - Còn **36 review_flags** kiểm tay (không phải data hỏng): A10 19 (thumbnail ≠ nội dung theo vision) · S6 19 (takeaway neo transcript thấp) · S9 15 (xác nhận hình/tiếng bằng heuristic). Hàng đợi: `data/media-review-queue.json` (36 open · 5 resolved).
  → nguồn: `counts-manifest.mediaFiles` + `py -3 scripts/audit_videos_v2.py` + `data/media-review-queue.json`.
- **Danh bạ kênh mẫu (`kenh-mau.json`):** **165 kênh** (126 live · 39 dead).
  → nguồn: `data-tabs/kenh-mau.json` (Local = VPS = 165). Kênh dead = 404 / bị chấm dứt / kênh rỗng 0 video (kiểm bằng mắt qua Chromium 2026-09-30); GIỮ NGUYÊN trong kho làm case study dẫn chứng bài học, không xóa.
- **Kênh mẫu canonical (`raw-kenh-mau.json`):** **156 hồ sơ** (149 kênh unique, 12 nhóm lớn + 3 nhóm đặc nhiệm).
  → nguồn: `counts-manifest.canonicalRaw` / `canonicalRawUniqueChannels`.
- **Kho tài liệu & Master Prompts (`tai-lieu-full.json`):** **157 tài liệu**.
  → nguồn: `data-tabs/tai-lieu-full.json` (Local = VPS = **157**). *(Số cũ ghi 153 là SAI — đã sửa 2026-09-24.)*
  Phân bố: 78 Prompts · 20 Reports · 23 Tools · 16 Lists · 11 Other · 5 Internal-doc · 4 khác.
- **Ma trận ngách YouTube (`ngach-xanh.json`):** **34 ngách** (`xanh:true` **11** ngách).
  → nguồn: `data-tabs/ngach-xanh.json` (Local = VPS = 34).
- **Kho nhạc nền:** **49 tracks** đã audit Gemini Multimodal & FFprobe (36 SAFE YPP · 9 REVIEW · 4 COPYRIGHTED cấm dùng).
  → nguồn: rule workspace SSoT + `data/music_catalog.json`. *(Số cũ ghi 38 là SAI — đã sửa 2026-09-24.)*
- **Master SQLite Database:** **2.014 entries** FTS5 trong `h2dev_master.db`.
  → nguồn: đo trực tiếp `SELECT COUNT(*) FROM search_fts` trên VPS = **2014**. *(Số cũ ghi 2.003 là SAI — đã sửa 2026-09-24.)*
  Bảng kèm theo: `lessons` 140 · `lesson_timestamps` 718 · `competitor_channels` 296 · `competitor_top_videos` 1421 · `documents` 157 · `reup_sources` 27 · `niches` 151.

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
- **13 Agent Skills chuyên dụng:** Sẵn sàng tại `D:\YTB\.agents\skills\` và tích hợp vào `scripts/h2dev_master_producer.py`.
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
