@echo off
REM ============================================================
REM  H2DEV-Project LAN server - run on host machine (<LAN_IP>)
REM  Source folder: D:\YTB\H2DEV-Project (local disk preferred)
REM  Access from other machines:
REM    LAN:       http://<LAN_IP>:8899/
REM    Tailscale: http://<TAILSCALE_IP>:8899/
REM  Optional env vars: H2DEV_LAN_IP, H2DEV_TAILSCALE_IP
REM  ASCII only - safe for cmd.exe on any Windows.
REM ============================================================
setlocal

REM --- Go to project root (this launcher lives in scripts\windows) ---
pushd "%~dp0..\.." >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot enter folder: %~dp0
  echo [ERROR] Copy project to a local drive on this machine and run again.
  pause
  exit /b 1
)

echo.
echo [H2DEV] Project folder: %CD%
echo [H2DEV] Checking node...
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js LTS then run again.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo [H2DEV] Node %%v
echo.

REM --- Open firewall port 8899 (needs Administrator, Private profile only) ---
echo [H2DEV] Opening firewall port 8899 (profile=private) ...
netsh advfirewall firewall delete rule name="H2DEV-8899" >nul 2>nul
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=private >nul 2>nul
if errorlevel 1 (
  echo [WARN] Cannot open firewall - run this file as Administrator.
) else (
  echo [H2DEV] Firewall port 8899 opened (Private profile).
)
echo.

REM --- Start server (HOST=0.0.0.0 opens LAN + Tailscale, PORT=8899) ---
echo [H2DEV] Starting server ...
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
echo [H2DEV] Press Ctrl+C to stop.
echo.
set HOST=0.0.0.0
set PORT=8899
node server.js
if errorlevel 1 (
  echo.
  echo [ERROR] Server failed to start. See error above.
  echo [ERROR] Usually port 8899 is already in use, or server.js is missing.
  pause
  exit /b 1
)
pause
endlocal
