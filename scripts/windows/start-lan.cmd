@echo off
REM ============================================================
REM  H2DEV-Project LAN server - run on MACHINE CHINH 192.168.50.216
REM  Source folder: D:\YTB\H2DEV-Project (local disk preferred)
REM  Access from other machines:
REM    LAN:       http://192.168.50.216:8899/
REM    Tailscale: http://100.83.146.28:8899/
REM  o mang: map \\192.168.50.216\laptopshare as Y:
REM  ASCII only - safe for cmd.exe on any Windows.
REM ============================================================
setlocal

REM --- Go to script folder (works with local path) ---
pushd "%~dp0" >nul 2>nul
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

REM --- Open firewall port 8899 (needs Administrator) ---
echo [H2DEV] Opening firewall port 8899 ...
netsh advfirewall firewall delete rule name="H2DEV-8899" >nul 2>nul
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=any >nul 2>nul
if errorlevel 1 (
  echo [WARN] Cannot open firewall - run this file as Administrator.
) else (
  echo [H2DEV] Firewall port 8899 opened.
)
echo.

REM --- Start server (HOST=0.0.0.0 opens LAN + Tailscale, PORT=8899) ---
echo [H2DEV] Starting server ...
echo [H2DEV] LAN:       http://192.168.50.216:8899/
echo [H2DEV] Tailscale: http://100.83.146.28:8899/
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