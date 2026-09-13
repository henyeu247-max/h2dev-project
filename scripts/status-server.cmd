@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo =======================================================
echo          H2DEV LOCAL SERVER STATUS (PORT 8899)
echo =======================================================

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":8899.*LISTENING"') do (
    set PID=%%a
    set FOUND=1
    echo Trạng thái:   [CÓ] SỐNG (ONLINE)
    echo Tiến trình:   PID !PID! (Node.js)
    echo Cổng lắng nghe: 0.0.0.0:8899
    echo.
    echo Các địa chỉ truy cập:
    echo  - Localhost: http://127.0.0.1:8899/
    echo  - Tailscale: http://100.83.146.28:8899/
    echo  - Mạng LAN:  http://192.168.50.216:8899/
    echo  - Web VPS:   https://h2dev-learn.tonymmo.com/
    echo.
    echo Thư mục log:  D:\YTB\H2DEV-Project\logs\server.log
)

if "!FOUND!"=="0" (
    echo Trạng thái:   [KHÔNG] ĐANG TẮT (OFFLINE)
    echo Cổng 8899 chưa được mở.
    echo.
    echo Để bật server ngầm, hãy chạy:
    echo   cscript //nologo "%~dp0start-server-hidden.vbs"
)
echo =======================================================
