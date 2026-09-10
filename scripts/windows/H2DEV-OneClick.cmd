@echo off
REM ============================================================
REM  H2DEV ONE-CLICK - clean restart (ASCII only)
REM  Double-click ONCE. It will:
REM   1) Kill every old H2DEV tray (powershell h2dev-tray)
REM   2) Kill every old H2DEV node (node server.js)
REM   3) Start the scheduled task exactly ONE time
REM   4) Verify port 8899 is listening on 0.0.0.0
REM  Run on MACHINE CHINH 192.168.50.216 (D:\YTB\H2DEV-Project).
REM  May khac truy cap qua: http://100.83.146.28:8899/ (Tailscale)
REM                        hoac map o mang Y: (\\192.168.50.216\laptopshare)
REM ============================================================
setlocal EnableDelayedExpansion

pushd "%~dp0" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot enter folder: %~dp0
  echo [ERROR] Copy project to a LOCAL drive on this machine, then run again.
  pause
  exit /b 1
)

echo.
echo [H2DEV] ==============================
echo [H2DEV]  CLEAN RESTART (one-click)
echo [H2DEV]  Folder: %CD%
echo [H2DEV] ==============================
echo.

REM --- 1) kill old trays ---
echo [H2DEV] (1/4) Killing old trays...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'h2dev-tray' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

REM --- 2) kill old nodes + anything listening on 8899 ---
echo [H2DEV] (2/4) Killing old server nodes + freeing port 8899...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'server\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 4) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 1 /nobreak >nul

REM --- 3) open firewall (needs admin; if blocked, ignore) ---
echo [H2DEV] (3/4) Opening firewall 8899 (best with Administrator)...
netsh advfirewall firewall delete rule name="H2DEV-8899" >nul 2>nul
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=any >nul 2>nul

REM --- 4) start task exactly ONCE ---
echo [H2DEV] (4/4) Starting task H2DEV-Server-AutoStart...
schtasks /run /tn "H2DEV-Server-AutoStart" >nul 2>nul
if errorlevel 1 (
  echo [WARN] Task not found - try install-h2dev-startup.ps1 first,
  echo        or run h2dev-silent.vbs instead.
) else (
  echo [H2DEV] Task started.
)

echo.
echo [H2DEV] Waiting 4 seconds for server...
timeout /t 4 /nobreak >nul

echo.
echo [H2DEV] Verifying port 8899 ...
netstat -ano | findstr :8899
echo.
echo [H2DEV] Done. If you see  "0.0.0.0:8899  LISTENING", you are good.
echo [H2DEV] Access:  http://192.168.50.216:8899/   or   http://100.83.146.28:8899/
echo.
pause
endlocal