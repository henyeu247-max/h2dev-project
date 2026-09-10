# ============================================================
#  H2DEV Server - Installer (run ONCE on machine 192.168.50.216)
#  ASCII only - safe for cmd/powershell on any Windows.
#
#  What it does:
#   1. Open firewall port 8899 (needs Administrator)
#   2. Register a Logon task that auto-starts the tray icon (hidden)
#   3. Creates start-lan.cmd fallback (manual run)
#
#  Run:  Right-click > Run with PowerShell  (or from admin console)
#        powershell -ExecutionPolicy Bypass -File install-h2dev-startup.ps1
# ============================================================
$ErrorActionPreference = "Stop"

$script:root = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskName = "H2DEV-Server-AutoStart"

Write-Host "=============================================="
Write-Host " H2DEV Server Installer"
Write-Host " Root: $script:root"
Write-Host "=============================================="

# --- 1. Firewall ---
Write-Host ""
Write-Host "[1/3] Opening firewall port 8899 ..."
netsh advfirewall firewall delete rule name="H2DEV-8899" | Out-Null
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=any | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host "      OK - firewall port 8899 opened."
} else {
  Write-Host "      WARNING - could not open firewall (need Administrator)."
}

# --- 2. Register logon task (auto start tray icon hidden) ---
Write-Host ""
Write-Host "[2/3] Registering auto-start task '$taskName' ..."

$vbsPath = Join-Path $script:root "h2dev-silent.vbs"
$wscript  = Join-Path $env:windir "System32\wscript.exe"
$action   = New-ScheduledTaskAction -Execute $wscript -Argument "`"$vbsPath`""
$trigger  = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Auto start H2DEV server (hidden) + tray icon" -Force | Out-Null
  Write-Host "      OK - task '$taskName' registered (starts at logon)."
} catch {
  Write-Host "      WARNING - could not register task: $($_.Exception.Message)"
  Write-Host "      Fallback: run h2dev-silent.vbs manually after login."
}

# --- 3. Verify ---
Write-Host ""
Write-Host "[3/3] Verify"
Write-Host "      Task exists: $((Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) -ne $null)"
Write-Host ""
Write-Host "=============================================="
Write-Host " DONE. Next time you log in, H2DEV server"
Write-Host " starts hidden with a tray icon."
Write-Host ""
Write-Host " Access from other machines:"
Write-Host "   LAN:       http://192.168.50.216:8899/"
Write-Host "   Tailscale: http://100.83.146.28:8899/"
Write-Host ""
Write-Host " You can also start NOW (tray):"
Write-Host "   double-click:  h2dev-silent.vbs"
Write-Host "=============================================="
pause