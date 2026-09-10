# ============================================================
#  H2DEV Watchdog - check port 8899, start server if down
#  Scheduled every 5 min via h2dev-watchdog-hidden.vbs (wscript style 0).
#  NEVER register powershell.exe as the task action (console flash).
#  Healthy path: exit 0, no log, no console.
# ============================================================
$ErrorActionPreference = "Continue"

$root   = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$port   = 8899
$log    = Join-Path $root "h2dev-tray.log"
$lanLog = Join-Path $root "server-lan.log"
$lanErr = Join-Path $root "server-lan.err.log"

function Write-Diag($msg) {
  try {
    Add-Content -Path $log -Value ("[{0}] [WATCHDOG] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
  } catch { }
}

function Get-ServerPids {
  try {
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match "server\.js" } |
      Select-Object -ExpandProperty ProcessId
  } catch { @() }
}

function Test-Port {
  param([int]$Port)
  try {
    $conn = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.OwningProcess -and $_.OwningProcess -ne 0 })
    return ($conn.Count -ge 1)
  } catch { return $false }
}

function Start-Server {
  $node = "C:\Program Files\nodejs\node.exe"
  if (-not (Test-Path -LiteralPath $node)) {
    $c = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($c) { $node = $c.Source } else {
      Write-Diag "ERROR node.exe not found"
      return $null
    }
  }

  $env:HOST = "0.0.0.0"
  $env:PORT = "$port"

  # CreateNoWindow + start /b so node detaches without console flash.
  try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c cd /d `"$root`" && set HOST=0.0.0.0&& set PORT=$port&& start `"`" /b `"$node`" server.js >>`"$lanLog`" 2>>`"$lanErr`""
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.WorkingDirectory = $root
    $p = [System.Diagnostics.Process]::Start($psi)
    if ($p) { [void]$p.WaitForExit(15000) }
    Write-Diag "Server start issued (silent)"
    return 1
  } catch {
    Write-Diag "ERROR Start-Server: $($_.Exception.Message)"
    return $null
  }
}

# --- Main ---
if (Test-Port -Port $port) {
  exit 0
}

Write-Diag "Port $port DOWN - checking for stale node processes..."
foreach ($procId in @(Get-ServerPids)) {
  try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch { }
  Write-Diag "Killed stale node PID=$procId"
}
Start-Sleep -Milliseconds 500

$null = Start-Server
Start-Sleep -Seconds 2

if (Test-Port -Port $port) {
  Write-Diag "Server restored OK"
} else {
  Write-Diag "Server STILL DOWN after restart attempt"
}
