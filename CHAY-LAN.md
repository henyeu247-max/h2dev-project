# H2DEV Server — Windows Service + Tray + Auto-Reload

> Chạy trên **MÁY CHÍNH 192.168.50.216** (laptop-saxukeb).
> **Nguồn cục bộ:** `D:\YTB\H2DEV-Project`
> **Ổ mạng (máy khác map):** `Y:\YTB\` = `\\192.168.50.216\laptopshare`
> Cập nhật: 2026-09-16

## Cách server đang chạy (runtime thật)

- **Windows Service `H2DEV_Service`** (qũa NSSM) — `SERVICE_AUTO_START`, tự chạy khi bật máy, **không cần đăng nhập**.
  - NSSM: `Application = C:\Program Files\nodejs\node.exe` · `AppParameters = server.js` · `AppDirectory = D:\YTB\H2DEV-Project`.
  - Bind `0.0.0.0:8899` (`server.js:15`), CORS `*`, không auth → mọi file ở gốc là **PUBLIC** (xem `TREE.md` mục `SENSITIVE_SEGMENTS`).
- **Auto-reload không cần Admin:** task `9Router-Local-Ensure` (RunLevel Highest, mỗi 5 phút) gọi hook `scripts/windows/h2dev-service-autoreload-hook.ps1` → so `server.js` mtime với lúc process khởi động, có code mới/port chết thì `nssm restart`. Kill switch: xóa `.cache/auto-reload-enabled`.
- **Tray icon** (tuỳ chọn): mở web / restart / stop / start / xem log / thoát.

> ⚠️ `node --watch` **KHÔNG** được dùng cho service chính (chỉ chạy được trên đĩa cục bộ, không qua share/UNC). Auto-reload nằm ở hook NSSM như trên.

## Cài đặt 1 lần (chạy với Quyền Admin)

```powershell
# Trên máy 192.168.50.216, PowerShell Administrator:
cd D:\YTB\H2DEV-Project
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install-h2dev-startup.ps1
```
Script sẽ: mở firewall port 8899 + đăng ký task auto-start.

Lan / Tailscale / ổ mạng — xem bảng bên dưới.

## Kiểm tra từ máy khác

Máy trạm thấy data mới nhất ngay khi máy chính lưu file (không cần restart server — server đọc file mỗi request).

| Đường | URL / Ghi chú |
|---|---|
| LAN nội bộ | `http://192.168.50.216:8899/` |
| Tailscale | `http://100.83.146.28:8899/` |
| Ổ mạng (Explorer) | `Y:\YTB\H2DEV-Project\` (map `\\192.168.50.216\laptopshare`) |

## Update code

- Sửa `server.js` → hook auto-reload `nssm restart` trong ≤ 5 phút (hoặc chạy `RESTART-H2DEV-SERVICE-ADMIN.cmd` bằng tay nếu cần ngay).
- Sửa `data-tabs/*.json`, `index.html`, tài liệu → refresh trình duyệt là thấy mới (không cần restart).
- Kiểm tra nhanh: `CHAY-LAN.md` này · `H2DEV-OneClick.cmd` (1 nhấp: dọn + chạy lại + kiểm tra) · `CHECK_SERVERS_STATUS.bat`.

## Các file (đã dời vào `scripts\windows\` từ 11/09)

| File | Vai trò |
|---|---|
| `scripts\windows\h2dev-tray.ps1` | Tray manager (start/stop/restart server + log) |
| `scripts\windows\h2dev-watchdog.ps1` | Check port 8899 mỗi 5 phút · healthy = exit 0, không log |
| `scripts\windows\h2dev-service-autoreload-hook.ps1` | Hook auto-reload (NSSM restart, kill switch `.cache/auto-reload-enabled`) |
| `scripts\windows\install-h2dev-startup.ps1` | Cài 1 lần: mở firewall + đăng ký auto-start |
| `scripts\windows\start-lan.cmd` | (Cách cũ) chạy thủ công hiện cửa sổ |
| `h2dev-silent.vbs` | Wrapper mỏng ở gốc → `scripts\windows\` (Task Scheduler gọi) |
| `H2DEV-OneClick.cmd` | Wrapper mỏng ở gốc → `scripts\windows\H2DEV-OneClick.cmd` |

## Lưu ý

- Nếu đổi port, sửa `$script:port = 8899` trong `scripts\windows\h2dev-tray.ps1` và biến `PORT` trong `server.js`.
- Muốn gỡ auto-start: Task Scheduler → xóa `H2DEV-Server-AutoStart`.
- Log vận hành: `logs\h2dev-service-reload.log` · `logs\h2dev-tray.log` (web bị chặn — `logs` nằm trong `SENSITIVE_SEGMENTS`).
