@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo [H2DEV] Đang kiểm tra tiến trình đang chạy trên cổng 8899...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":8899.*LISTENING"') do (
    set PID=%%a
    set FOUND=1
    echo [H2DEV] Phát hiện PID !PID! đang lắng nghe cổng 8899. Đang dừng...
    taskkill /F /PID !PID! >nul 2>&1
    if !errorlevel! equ 0 (
        echo [H2DEV] Đã dừng thành công PID !PID!.
    ) else (
        echo [H2DEV] Không thể dừng PID !PID!, có thể cần quyền Administrator.
    )
)

if "!FOUND!"=="0" (
    echo [H2DEV] Cổng 8899 hiện tại không có tiến trình nào chạy.
)
