# ============================================================
#  H2DEV Auto-Start Installer (NO ADMIN needed)
#  Uses Startup folder + HKCU registry — works without elevation.
#
#  What it does:
#   1. Copy shortcut to Startup folder (auto-run h2dev-silent.vbs at logon)
#   2. Add HKCU Run key (backup auto-start)
#   3. Start server NOW (hidden, via tray)
#   4. Verify port 8899
#
#  Run:  powershell -NoProfile -ExecutionPolicy Bypass -File install-h2dev-noadmin.ps1
# ============================================================
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log  = Join-Path $root "h2dev-tray.log"

function Write-Diag($msg) {
  try {
    Add-Content -Path $log -Value ("[{0}] [INSTALL] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
  } catch { }
}

Write-Host "=============================================="
Write-Host " H2DEV Auto-Start Installer (no admin)"
Write-Host " Root: $root"
Write-Host "=============================================="

# --- 1. Startup folder shortcut ---
Write-Host ""
Write-Host "[1/3] Creating Startup folder shortcut ..."
$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath  = Join-Path $startupFolder "H2DEV-Server.lnk"
$vbsPath       = Join-Path $root "h2dev-silent.vbs"

try {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = "C:\Windows\System32\wscript.exe"
  $shortcut.Arguments = "`"$vbsPath`""
  $shortcut.WorkingDirectory = $root
  $shortcut.WindowStyle = 7  # minimized
  $shortcut.IconLocation = Join-Path $root "h2dev-icon.ico"
  $shortcut.Description = "H2DEV Server auto-start (hidden tray)"
  $shortcut.Save()
  Write-Host "      OK - shortcut created: $shortcutPath"
  Write-Diag "Startup shortcut created: $shortcutPath"
} catch {
  Write-Host "      WARNING - could not create shortcut: $($_.Exception.Message)"
}

# --- 2. HKCU Run key (backup) ---
Write-Host ""
Write-Host "[2/3] Adding HKCU Run key (backup auto-start) ..."
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
try {
  Set-ItemProperty -Path $runKey -Name "H2DEV-Server" -Value "wscript.exe `"$vbsPath`"" -ErrorAction Stop
  Write-Host "      OK - HKCU Run key added."
  Write-Diag "HKCU Run key added"
} catch {
  Write-Host "      WARNING - could not add HKCU Run key: $($_.Exception.Message)"
}

# --- 3. Start server NOW ---
Write-Host ""
Write-Host "[3/3] Starting server now (hidden tray) ..."
try {
  Start-Process -FilePath "wscript.exe" -ArgumentList "`"$vbsPath`"" -WindowStyle Hidden
  Write-Host "      OK - tray launched (hidden). Waiting 4 seconds ..."
  Write-Diag "Tray launched via wscript"
  Start-Sleep -Seconds 4
} catch {
  Write-Host "      WARNING - could not launch: $($_.Exception.Message)"
}

# --- Verify ---
$listening = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host ""
  Write-Host "      OK - port 8899 LISTENING (PID $($listening.OwningProcess -join ','))"
  Write-Diag "Server alive after install PID=$($listening.OwningProcess)"
} else {
  Write-Host ""
  Write-Host "      WARNING - port 8899 not yet listening."
  Write-Host "      Tray may still be starting. Check again in 10s."
  Write-Diag "Port 8899 not listening after install"
}

Write-Host ""
Write-Host "=============================================="
Write-Host " DONE. H2DEV server now auto-starts at logon:"
Write-Host "  - Startup folder shortcut: $shortcutPath"
Write-Host "  - HKCU Run key backup: H2DEV-Server"
Write-Host "  - Runs hidden (tray icon in system tray)"
Write-Host ""
Write-Host " Access:"
Write-Host "   Local:    http://127.0.0.1:8899/"
Write-Host "   LAN:      http://192.168.50.216:8899/"
Write-Host "   Tailscale: http://100.83.146.28:8899/"
Write-Host ""
Write-Host " Manage (tray icon):"
Write-Host "   Right-click tray icon > Open Web / Restart / Stop / Exit"
Write-Host ""
Write-Host " Manual start (if needed):"
Write-Host "   Double-click: h2dev-silent.vbs"
Write-Host "   Or:           H2DEV-OneClick.cmd (clean restart)"
Write-Host ""
Write-Host " Uninstall:"
Write-Host "   Delete: $shortcutPath"
Write-Host "   Delete: HKCU\...\Run\H2DEV-Server"
Write-Host "=============================================="
