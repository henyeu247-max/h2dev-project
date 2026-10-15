# Project instructions

Global operating rules and shared procedures are provided by the user-level agent configuration. Keep this file limited to durable project-specific instructions.

## Commands

Chạy từ thư mục dự án; số liệu chuẩn nằm ở `data/counts-manifest.json`, không ghi tay vào docs.

- `node server.js` — chạy web (cổng 8899). Service Windows `H2DEV_Service` chỉ restart được bằng quyền admin (`D:\YTB\RESTART-H2DEV-SERVICE-ADMIN.cmd`, chạy bằng "Run as administrator"); sửa `server.js` thì service giữ code cũ tới khi restart.
- `node scripts/validate-project.js` — kiểm tổng (kèm check-ui-classes + guard inline-onclick). Mong đợi: exit 0.
- `node scripts/sync-counts.js` rồi `node scripts/sync-counts.js --check` — sinh manifest và kiểm docs khớp data. Mong đợi: exit 0.
- Gate UI: `scripts/gate-{icons,typography,p1,p2,shell}.js`, `scripts/guard-no-inline-onclick.js`, `scripts/check-ui-classes.js`. Gate mới hoặc sửa gate phải probe cả hai chiều (tiêm lỗi → FAIL, khôi phục → PASS, file byte-identical).
- Trình duyệt: `scripts/deep-ui-acceptance.js`, `scripts/playwright-g2-acceptance.js`, `scripts/find-404.js`.
- `npm run build:css` chỉ sau khi kiểm glob `content` của `tailwind.config.js`; xong chạy `node scripts/check-ui-classes.js`.

## Structure

- `data-tabs/*.json` — data sống của 9 tab; `data/` — catalog gốc và manifest dẫn xuất. Cây đầy đủ: `TREE.md`.
- `assets/app/` — JS của SPA (`tabs/content.js` render tab Tài liệu/Kênh); `assets/*.css` — style (`player.css` chỉ trang player nạp).
- `docs/<SKU>/` và `assets/docs/<SKU>/` — mô tả bài học; link tải trong `data-tabs` phải trỏ tới file có thật ở `assets/docs/`.
- Kho skill dùng chung nằm ngoài dự án (`~/.agents/source/skills/`).

## Historical lessons

Load `docs/solutions/legacy-verified-lessons-20261002.md` only when its topic is relevant; treat every historical claim as needing current verification.

## Lessons

- H2DEV-UI-001 đến H2DEV-UI-012 (UI-standard đợt 1, 2026-10-09): xem `docs/solutions/2026-10-09-ui-standard-round1.md`.
- H2DEV-UI-013 đến H2DEV-UI-037 (UI-standard đợt 2, 2026-10-09): xem `docs/solutions/2026-10-09-ui-standard-round2.md`.
- Bài học dự án `H2DEV-SCAR-006…030` (mã cũ `SCAR-006…028`): xem `docs/solutions/h2dev-scar-log.md`.
