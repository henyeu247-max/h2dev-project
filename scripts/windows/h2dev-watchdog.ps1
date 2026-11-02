# ============================================================
#  H2DEV Watchdog - check port 8899, start server if down
#  Scheduled every 5 min via h2dev-watchdog-hidden.vbs (wscript style 0).
#  NEVER register powershell.exe as the task action (console flash).
#  Healthy path: exit 0, no log, no console.
# ============================================================
$ErrorActionPreference = "Continue"

# This file lives in <project>\scripts\windows; server.js is at the project
# root, not in <project>\scripts.
$root   = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$port   = 8899
$logDir = Join-Path $root "logs"
$log    = Join-Path $logDir "h2dev-tray.log"
$lanLog = Join-Path $logDir "server-lan.log"
$lanErr = Join-Path $logDir "server-lan.err.log"

# Single-instance mutex to prevent overlapping recovery runs
try {
  $wdMutex = New-Object System.Threading.Mutex($false, "Global\H2DevWatchdogMutex")
  if (-not $wdMutex.WaitOne(0, $false)) { exit 0 }
} catch { }

function Rotate-LogIfLarge([string]$path, [long]$maxBytes = 1048576) {
  try {
    if (Test-Path -LiteralPath $path) {
      $item = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
      if ($item -and $item.Length -gt $maxBytes) {
        Move-Item -LiteralPath $path -Destination ($path + ".1") -Force -ErrorAction SilentlyContinue
      }
    }
  } catch { }
}

function Write-Diag($msg) {
  try {
    if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
    Rotate-LogIfLarge -path $log
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
    $req = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/health")
    $req.Method = "GET"
    $req.Timeout = 1500
    $req.Proxy = $null
    $resp = $req.GetResponse()
    $code = [int]$resp.StatusCode
    $resp.Close()
    if ($code -ge 200 -and $code -lt 400) { return $true }
  } catch { }
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

  if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
  Rotate-LogIfLarge -path $lanLog
  Rotate-LogIfLarge -path $lanErr

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
