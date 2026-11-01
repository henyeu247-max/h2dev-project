# Kế Hoạch Triển Khai & Bàn Giao 6 Finding Kỹ Thuật (AGV Implementer)
**Ngày tạo:** 2026-11-02  
**Người thực hiện:** AGV Implementer (Reviewer độc lập: Lead ChatGPT)  
**Quy chuẩn áp dụng:** `workflow-11-phase`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `agents-directive-sync`.

---

## 1. Baseline Receipt (Hiện Trạng Trước Thi Công)
- **Sync / Validator:** `py -3 ~/.agents/sync/verify_independent.py` trả về `FAIL: unknown skill exclusion for zcode: atk-core,atk-corpus` (Exit 1) và `BAD skills:codex 129/130` (thiếu `doc`).
- **Dashboard & Server 18765:** Port 18765 `ECONNREFUSED`. File tĩnh nằm tạm trong ephemeral brain (`~/.gemini/antigravity-cli/brain/86ed.../agv_commands_skills_dashboard.html`). Chưa có canonical source git-backed, thiếu 36 skills, builder không phân loại GUI slash command vs CLI flag.
- **Skill Audit:** `~/.agents/source/skills/h2dev-project-audit/SKILL.md` chứa số tĩnh `333 SKU = 148 + 140 + 45`, lệch với DB/manifest live 345.
- **Scheduler H2DEV-Auto-Ingest-Watcher:** `0x41303` (SCHED_S_TASK_HAS_NOT_RUN), `StartBoundary=00:06:00`, `next=06:06:06`, `StartWhenAvailable=false`. Cần cơ chế test an toàn (dry-run/check) không kích hoạt download/upload VPS.
- **Git Working Tree:** 1108 porcelain lines gộp 9 subsystem (knowledge-hub 704, video 199, assets 105, docs 57, data 16, scripts 13, data-tabs 5...). `git diff --check` có 515 dòng markdown hard breaks có chủ đích. Bảo lưu 100% dirty baseline, không reset, không clean, không mass-format.

---

## 2. Kế Hoạch 6 Gói Công Việc (Scope A - F)

### Gói A: Chuẩn Hóa Dashboard & Khôi Phục Server 18765
1. Tạo thư mục canonical bền vững: `D:\YTB\H2DEV-Project\docs\dashboard\`.
2. Chép và tinh chỉnh file `agv_commands_skills_dashboard.html`:
   - Cập nhật danh mục kỹ năng động: nạp đủ 145 packages gốc + 5 sub-skills lồng (150 files), giữ nguyên phân nhóm Builtin & Plugin với nguồn gốc rõ ràng.
   - Sửa logic **Builder**: Phân định rạch ròi context:
     - GUI Advertised Commands: `/plan`, `/boost`, `/goal`, `/teamwork`, `/grill-me`, `/browser`, `/compact`, `/learn`.
     - Không ghép cờ CLI (`agy --...`) vào GUI slash commands.
     - Giữ nguyên anchor `#sec-builder`.
3. Viết script dedicated server `scripts/dashboard_server.py`:
   - Bind duy nhất `127.0.0.1:18765`.
   - Chỉ serve duy nhất thư mục `docs/dashboard/` (bảo vệ quyền riêng tư, tuyệt đối không serve cả `~` hay `brain`).
   - Idempotent launcher trên Windows (kiểm tra trước khi start).
4. Kiểm thử Playwright / browser headless: đổi platform, chọn skill, sinh prompt, không có lỗi console, chụp ảnh bằng chứng.

### Gói B: Khử Drift SSoT `h2dev-project-audit`
1. Sửa DUY NHẤT file SSoT: `C:\Users\SaxukeB\.agents\source\skills\h2dev-project-audit\SKILL.md`.
2. Thay các số tĩnh `333 SKU`, `148 H2DEV`, `45 DGMD` bằng quy tắc tham chiếu động tới `counts-manifest.json` và `sync-counts.js --check`.
3. Lưu snapshot dự phòng trước khi sửa. Không sửa các bản copy tự sinh.

### Gói C: Sửa Bộ Đồng Bộ Sync & Validator (Codex & ZCode)
1. Trong `~/.agents/sync/manifest.json`:
   - Tách bạch cấu hình ZCode: chuyển `atk-core`, `atk-corpus` từ `exclude_names` sang thuộc tính `target_only_names` (hoặc `preserve_names`).
   - Giữ nguyên `exclude_names` cho 15 superpowers của Codex.
2. Trong `~/.agents/sync/agents_sync.py` & `~/.agents/sync/verify_independent.py`:
   - Hỗ trợ `target_only_names`: không quét trong `source/skills`, không coi là lỗi `unknown skill exclusion`, không xóa hoặc đánh dấu `excluded_left` khi chúng tồn tại ở target.
   - Duy trì kiểm tra nghiêm ngặt: bất kỳ tên nào trong `exclude_names` không thuộc `source/skills` vẫn bị FAIL (chống typo).
3. Chạy `agents_sync.py apply --yes`:
   - Đảm bảo `~/.codex/skills/doc` được cài đặt đầy đủ từ nguồn.
   - Tài sản `atk-*` của ZCode giữ nguyên byte-identical.
4. Kiểm thử độc lập: `py -3 ~/.agents/sync/verify_independent.py` phải đạt 18/18 rule targets và 8/8 skill targets OK (Exit 0).

### Gói D: Xác Minh & Bổ Sung Check Safe-Mode Cho Scheduler
1. Lưu snapshot XML cấu hình hiện tại của task `H2DEV-Auto-Ingest-Watcher`.
2. Kiểm tra `scripts/auto_ingest_pipeline.js`:
   - Bổ sung cờ `--dry-run` hoặc `--check` an toàn: chạy qua luồng kiểm tra logic/môi trường/db/watcher mà KHÔNG tải video, không upload VPS, không ghi đè dữ liệu prod.
   - Thử nghiệm action với tài khoản runtime của scheduler và cờ an toàn, ghi nhận log.
   - Giữ nguyên cadence `PT6H` và cấu hình nguồn điện.

### Gói E: Rà Soát Phân Nhóm Git Dirty
1. Phân loại 1108 porcelain lines theo 9 subsystem:
   - `knowledge-hub` (704)
   - `video` (199)
   - `assets` (105)
   - `docs` (57)
   - `data` (16)
   - `scripts` (13)
   - `data-tabs` (5)
   - Gốc / Khác (9)
2. Không thực hiện reset, clean, hay bulk commit dọn dẹp.
3. Chạy `validate-project.js` và `sync-counts.js --check` để bảo đảm không có regression.

### Gói F: Nghiệm Thu & Kiểm Chứng Độc Lập
1. Chạy test Red-Green cho validator sync.
2. Kiểm chứng Server 18765 và bảo mật boundary path.
3. Chạy toàn bộ bộ kiểm tra dự án H2DEV.
4. Ghi biên bản nghiệm thu tại `D:\YTB\H2DEV-Project\docs\plans\2026-11-02-agv-scoped-fixes-receipt.md`.
