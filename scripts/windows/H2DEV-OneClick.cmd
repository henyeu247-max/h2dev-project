@echo off
REM ============================================================
REM  H2DEV ONE-CLICK - clean restart (ASCII only)
REM  Double-click ONCE. It will:
REM   1) Kill every old H2DEV tray (powershell h2dev-tray)
REM   2) Kill every old H2DEV node (node server.js)
REM   3) Start the scheduled task exactly ONE time
REM   4) Verify port 8899 is listening on 0.0.0.0
REM  Run on host machine (<LAN_IP>) in local project folder.
REM  Access from other machines: http://<TAILSCALE_IP>:8899/ (Tailscale)
REM                              or http://<LAN_IP>:8899/ (LAN)
REM  Optional env vars: H2DEV_LAN_IP, H2DEV_TAILSCALE_IP
REM ============================================================
setlocal EnableDelayedExpansion

pushd "%~dp0..\.." >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot enter folder: %~dp0..\..
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

REM --- 3) open firewall (needs admin; Private profile only) ---
echo [H2DEV] (3/4) Opening firewall 8899 (profile=private, best with Administrator)...
netsh advfirewall firewall delete rule name="H2DEV-8899" >nul 2>nul
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=private >nul 2>nul

REM --- 4) start task exactly ONCE ---
echo [H2DEV] (4/4) Starting task H2DEV-Server-AutoStart...
schtasks /run /tn "H2DEV-Server-AutoStart" >nul 2>nul
if errorlevel 1 (
  echo [WARN] Task not found - try scripts\windows\install-h2dev-startup.ps1 first,
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
echo [H2DEV] Done. If you see port 8899 LISTENING, you are good.
echo [H2DEV] Local:     http://127.0.0.1:8899/
if defined H2DEV_LAN_IP (
  echo [H2DEV] LAN:       http://%H2DEV_LAN_IP%:8899/
) else (
  echo [H2DEV] LAN:       http://^<LAN_IP^>:8899/
)
if defined H2DEV_TAILSCALE_IP (
  echo [H2DEV] Tailscale: http://%H2DEV_TAILSCALE_IP%:8899/
) else (
  echo [H2DEV] Tailscale: http://^<TAILSCALE_IP^>:8899/
)
echo.
pause
popd >nul 2>nul
endlocal