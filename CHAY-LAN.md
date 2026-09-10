# H2DEV Server — Auto Start + Tray Icon + Auto Update

> Chạy trên **MÁY CHÍNH 192.168.50.216** (laptop-saxukeb).
> **Nguồn cục bộ:** `D:\YTB\H2DEV-Project`
> **Ổ mạng (may khac map):** `Y:\YTB\` = `\\192.168.50.216\laptopshare`
> Cập nhật: 2026-08-18

## Tính năng
- **Tự chạy khi mở máy** (ẩn, không cửa sổ) — đăng ký qua Task Scheduler lúc đăng nhập.
- **Tray icon** ở góc dưới phải: mở web / restart / stop / start / xem log / thoát.
- **Tự update code**: server chạy bằng `node --watch server.js` → **sửa `server.js` tự restart**. Data JSON/HTML sửa xong là lần request tiếp theo thấy ngay (server đọc file mỗi request).

## 1 lần đầu trên MÁY CHÍNH (quan trọng)

### Bước 1 — Cài đặt (chỉ 1 lần, chạy với Quyền Admin)
```powershell
# Trên máy 192.168.50.216, mở PowerShell với Administrator:
cd <đường dẫn cục bộ tới H2DEV-Project trên máy đó>
powershell -ExecutionPolicy Bypass -File .\install-h2dev-startup.ps1
```
Script sẽ:
1. Mở firewall port 8899.
2. Đăng ký task `H2DEV-Server-AutoStart` → **tự mở tray + server khi đăng nhập**.

### Bước 2 — Chạy ngay (không cần restart máy)
Nhấn đúp **`h2dev-silent.vbs`** (chạy ẩn, có tray icon). Hoặc mở Task Scheduler → run task `H2DEV-Server-AutoStart`.

## Kiểm tra từ máy khác

Máy trạm tự động đồng bộ: mở trình duyệt truy cập URL bên dưới là thấy data mới nhất (không cần restart server).

| Đường | URL / Ghi chú |
|---|---|
| LAN nội bộ | `http://192.168.50.216:8899/` |
| Tailscale | `http://100.83.146.28:8899/` |
| Ổ mạng (Explorer) | `Y:\YTB\H2DEV-Project\` (map `\\192.168.50.216\laptopshare`) |

> **Lưu ý:** `node --watch` và autoplay chỉ hoạt động trên **đĩa cục bộ D:** của máy chính.
> Các máy trạm truy cập qua Web hoặc ổ mạng chỉ đọc được data + file nhưng không chạy server được.

## Hướng dẫn sửa/update code (tự động)
- Sửa `server.js` → `--watch` tự restart, không cần làm gì.
- Sửa `data-tabs/*.json`, `index.html`, tài liệu → refresh trình duyệt là thấy mới.
- Muốn dừng: tray icon → Stop/Exit (Exit chỉ tắt tray, server vẫn chạy nếu chưa Stop).

## Các file
| File | Vai trò |
|---|---|
| `h2dev-tray.ps1` | Tray manager (start/stop/restart server + log) |
| `h2dev-silent.vbs` | Chạy tray ẩn (không cửa sổ) — dùng khi đăng nhập |
| `install-h2dev-startup.ps1` | Cài 1 lần: mở firewall + đăng ký auto-start |
| `start-lan.cmd` | (Cách cũ) chạy thủ công hiện cửa sổ |

## Lưu ý
- `node --watch` chỉ hoạt động trên **đĩa cục bộ** của máy chính — KHÔNG chạy trên đường dẫn share/UNC.
- Nếu đổi port, sửa `$script:port = 8899` trong `h2dev-tray.ps1`.
- Muốn gỡ auto-start: Task Scheduler → xóa `H2DEV-Server-AutoStart`.