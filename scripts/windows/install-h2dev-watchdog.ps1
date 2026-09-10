# ============================================================
#  H2DEV Watchdog Installer - run ONCE on machine 192.168.50.216
#  Creates Scheduled Task "H2DEV-Watchdog" that runs every 5 min,
#  checks port 8899, starts server if down.
#  Also updates main task "H2DEV-Server-AutoStart" with restart policy.
#
#  Run:  powershell -ExecutionPolicy Bypass -File install-h2dev-watchdog.ps1
#  Needs Administrator (for scheduled task + firewall).
# ============================================================
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$watchdogTask = "H2DEV-Watchdog"
$autoStartTask = "H2DEV-Server-AutoStart"

Write-Host "=============================================="
Write-Host " H2DEV Watchdog Installer"
Write-Host " Root: $root"
Write-Host "=============================================="

# --- 1. Firewall (ensure open) ---
Write-Host ""
Write-Host "[1/4] Ensuring firewall port 8899 open ..."
netsh advfirewall firewall delete rule name="H2DEV-8899" | Out-Null
netsh advfirewall firewall add rule name="H2DEV-8899" dir=in action=allow protocol=TCP localport=8899 profile=any | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host "      OK - firewall port 8899 opened."
} else {
  Write-Host "      WARNING - could not open firewall (need Administrator)."
}

# --- 2. Register watchdog task (every 5 min) ---
Write-Host ""
Write-Host "[2/4] Registering watchdog task '$watchdogTask' (every 5 min) ..."

$watchdogVbs = Join-Path $root "h2dev-watchdog-hidden.vbs"
$wscriptExe = Join-Path $env:windir "System32\wscript.exe"
if (-not (Test-Path $watchdogVbs)) { throw "missing $watchdogVbs - create h2dev-watchdog-hidden.vbs first" }
# CRITICAL: never use powershell.exe as task action — flashes console every 5 min.
# Gold standard = wscript //b + VBS WshShell.Run style 0 (same as 9Router-Local-Ensure).
$wdAction   = New-ScheduledTaskAction -Execute $wscriptExe -Argument "/b /nologo `"$watchdogVbs`""
$wdTrigger  = New-ScheduledTaskTrigger -AtLogOn
$wdTrigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
$wdSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

try {
  Unregister-ScheduledTask -TaskName $watchdogTask -Confirm:$false -ErrorAction SilentlyContinue
  Register-ScheduledTask -TaskName $watchdogTask -Action $wdAction -Trigger @($wdTrigger, $wdTrigger2) -Settings $wdSettings -Description "H2DEV watchdog - restart server if port 8899 down" -Force | Out-Null
  Write-Host "      OK - watchdog task registered (runs every 5 min + at logon)."
} catch {
  Write-Host "      WARNING - could not register watchdog: $($_.Exception.Message)"
}

# --- 3. Update main auto-start task with restart policy ---
Write-Host ""
Write-Host "[3/4] Updating auto-start task '$autoStartTask' with restart policy ..."

$vbsPath = Join-Path $root "h2dev-silent.vbs"
$wscript = Join-Path $env:windir "System32\wscript.exe"

try {
  $existing = Get-ScheduledTask -TaskName $autoStartTask -ErrorAction SilentlyContinue
  if ($existing) {
    # Re-register with restart policy
    $action   = New-ScheduledTaskAction -Execute $wscript -Argument "`"$vbsPath`""
    $trigger  = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
    Register-ScheduledTask -TaskName $autoStartTask -Action $action -Trigger $trigger -Settings $settings -Description "Auto start H2DEV server (hidden) + tray icon + restart on failure" -Force | Out-Null
    Write-Host "      OK - auto-start task updated with restart policy."
  } else {
    Write-Host "      WARNING - task '$autoStartTask' not found. Run install-h2dev-startup.ps1 first."
  }
} catch {
  Write-Host "      WARNING - could not update auto-start task: $($_.Exception.Message)"
}

# --- 4. Start server NOW ---
Write-Host ""
Write-Host "[4/4] Starting server now ..."
schtasks /run /tn $autoStartTask > $null 2>&1
Start-Sleep -Seconds 3
# Also run watchdog immediately to ensure server is up
schtasks /run /tn $watchdogTask > $null 2>&1
Start-Sleep -Seconds 3

$listening = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host "      OK - port 8899 LISTENING (PID $($listening.OwningProcess -join ','))"
} else {
  Write-Host "      WARNING - port 8899 not yet listening. Watchdog will retry in 5 min."
}

Write-Host ""
Write-Host "=============================================="
Write-Host " DONE. H2DEV server now:"
Write-Host "  - Auto-starts at logon (tray icon, hidden)"
Write-Host "  - Restarts on failure (up to 999 times, 1 min apart)"
Write-Host "  - Watchdog checks every 5 min, restarts if down"
Write-Host ""
Write-Host " Access:"
Write-Host "   LAN:       http://192.168.50.216:8899/"
Write-Host "   Tailscale: http://100.83.146.28:8899/"
Write-Host ""
Write-Host " Manage:"
Write-Host "   Restart now:  schtasks /run /tn H2DEV-Watchdog"
Write-Host "   Stop server:  node -e `"require('child_process').execSync('taskkill /f /im node.exe')`""
Write-Host "   Tray icon:    double-click h2dev-silent.vbs"
Write-Host "=============================================="
