@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo [H2DEV] Đang khởi động lại H2DEV Local Server (Port 8899)...

call "%~dp0stop-server.cmd"
timeout /t 1 /nobreak >nul

echo [H2DEV] Đang khởi chạy server ngầm...
cscript //nologo "%~dp0start-server-hidden.vbs"

timeout /t 2 /nobreak >nul
call "%~dp0status-server.cmd"
