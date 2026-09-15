# ============================================================
#  H2DEV Service auto-reload hook (runs ELEVATED)
#
#  Launched by: D:\9 Router\scripts\ensure-9router-local-hidden.vbs
#  (that VBS is the action of scheduled task "9Router-Local-Ensure",
#   RunLevel=Highest, every 5 minutes -> no UAC prompt needed).
#
#  Job:
#    1) Detect H2DEV_Service code drift: server.js mtime newer than
#       the running node process start time -> nssm restart service.
#    2) Detect service down (port 8899 not listening) -> nssm restart.
#
#  Guards:
#    - Kill switch: D:\YTB\H2DEV-Project\.cache\auto-reload-enabled
#      must exist, otherwise the hook does nothing.
#    - If the process start time cannot be read -> DO NOTHING (no loop).
#    - Self-stabilizing: after a successful restart the new process is
#      newer than server.js, so the next cycle is a no-op.
#    - Optional argument: -DryRun  (log decision, never restart)
#
#  ASCII only. No network. No secrets. Fail-soft.
# ============================================================
$ErrorActionPreference = 'Continue'

$root       = 'D:\YTB\H2DEV-Project'
$port       = 8899
$nssm       = 'D:\YTB\nssm.exe'
$svcName    = 'H2DEV_Service'
$sentinel   = Join-Path $root '.cache\auto-reload-enabled'
$statusFile = Join-Path $root '.cache\h2dev-service-reload.json'
$logFile    = Join-Path $root 'logs\h2dev-service-reload.log'

$dryRun = $false
foreach ($a in $args) { if ($a -eq '-DryRun') { $dryRun = $true } }

# Single instance: the task can fire while a previous hook run is still
# restarting the service. Second instance exits immediately.
try {
  $hookMutex = New-Object System.Threading.Mutex($false, 'Global\H2DEVServiceAutoreloadMutex')
  if (-not $hookMutex.WaitOne(0, $false)) { exit 0 }
} catch { }

function Write-HookLog([string]$m) {
  try {
    $dir = Split-Path $logFile
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Add-Content -Path $logFile -Value ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $m) -Encoding utf8
  } catch { }
}

function Save-Status($obj) {
  try {
    $dir = Split-Path $statusFile
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    ($obj | ConvertTo-Json -Depth 5) | Set-Content -Path $statusFile -Encoding utf8
  } catch { }
}

function To-Iso($dt) {
  if ($dt -eq $null) { return $null }
  try { return ([datetime]$dt).ToString('o') } catch { return [string]$dt }
}

$checkedAt = (Get-Date).ToString('o')

# Elevation self-report (proves the Highest-RunLevel task channel actually elevated).
$whoAmI = 'unknown'
$isAdmin = $false
try {
  $ident = [Security.Principal.WindowsIdentity]::GetCurrent()
  $whoAmI = $ident.Name
  $isAdmin = (New-Object Security.Principal.WindowsPrincipal($ident)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
} catch { }

if (-not (Test-Path $sentinel)) {
  Write-HookLog ('disabled (sentinel missing) - skip | user=' + $whoAmI + ' admin=' + $isAdmin)
  Save-Status @{ schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'disabled'; reason = 'sentinel-missing'; user = $whoAmI; admin = $isAdmin }
  exit 0
}

# --- 1) who currently listens on :8899 ---
$curPid = 0
try {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn -and $conn.OwningProcess) { $curPid = [int]$conn.OwningProcess }
} catch { }

$procStart = $null
if ($curPid -gt 0) {
  try {
    $p = Get-Process -Id $curPid -ErrorAction Stop
    $procStart = $p.StartTime
  } catch {
    try {
      $ci = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $curPid) -ErrorAction Stop
      if ($ci -and $ci.CreationDate) { $procStart = [datetime]$ci.CreationDate }
    } catch { $procStart = $null }
  }
}

$jsMtime = $null
try {
  $js = Join-Path $root 'server.js'
  if (Test-Path $js) { $jsMtime = (Get-Item $js).LastWriteTime }
} catch { }

# --- 2) decide ---
$action = 'none'
$reason = ''
if ($curPid -le 0) {
  $action = 'reload'; $reason = 'port-down'
} elseif ($jsMtime -and $procStart -and ($jsMtime -gt $procStart)) {
  $action = 'reload'; $reason = 'code-changed-after-start'
}

if ($action -ne 'reload') {
  Write-HookLog ('no-reload pid=' + $curPid + ' jsMtime=' + (To-Iso $jsMtime) + ' procStart=' + (To-Iso $procStart))
  Save-Status @{
    schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'none'
    pid = $curPid; jsMtime = (To-Iso $jsMtime); procStart = (To-Iso $procStart)
  }
  exit 0
}

Write-HookLog ('RELOAD needed reason=' + $reason + ' pid=' + $curPid + ' jsMtime=' + (To-Iso $jsMtime) + ' procStart=' + (To-Iso $procStart) + ' dryRun=' + $dryRun)

# Safety gate: never reload a server.js that fails the syntax check.
# A broken file would make the service flap every 5 minutes; we prefer
# to keep the old (working) process running instead.
$nodeExe = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path $nodeExe)) { $nodeExe = 'node' }
$syntaxOk = $true
try {
  $chk = & $nodeExe --check (Join-Path $root 'server.js') 2>&1
  $syntaxOk = ($LASTEXITCODE -eq 0)
} catch { $syntaxOk = $false }
if (-not $syntaxOk) {
  Write-HookLog ('server.js FAILED node --check - reload SKIPPED (keeping old process). detail=' + (($chk | Out-String).Trim() -replace '\s+', ' '))
  Save-Status @{
    schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'skipped'; reason = 'syntax-error'
    pid = $curPid; user = $whoAmI; admin = $isAdmin
  }
  exit 0
}

if ($dryRun) {
  Save-Status @{ schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'would-reload'; reason = $reason; pid = $curPid }
  exit 0
}

# --- 3) restart service (elevated) and verify ---
# Pause the user-level watchdog for the duration of the nssm call only
# (~1-3s): it fires every 5 minutes and would race us by starting a rogue
# node on :8899 while the service is briefly down.
$wdTask   = 'H2DEV-Watchdog'
$wdPaused = $false
$oldPid   = $curPid
$rc       = -1

# Pre-flight: confirm the service exists (fast, read-only).
$svcExists = $false
try {
  $q = & sc.exe query $svcName 2>&1
  $svcExists = ($LASTEXITCODE -eq 0)
} catch { }

if (-not $svcExists) {
  Write-HookLog ('service ' + $svcName + ' not found - cannot reload')
  Save-Status @{ schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'error'; reason = 'service-missing'; user = $whoAmI; admin = $isAdmin }
  exit 0
}

try {
  $out = & schtasks.exe /Change /TN $wdTask /DISABLE 2>&1
  $wdPaused = ($LASTEXITCODE -eq 0)
} catch { $wdPaused = $false }

try {
  if (Test-Path $nssm) {
    $nssmOut = & $nssm restart $svcName 2>&1
    $rc = $LASTEXITCODE
  } else {
    Write-HookLog 'nssm.exe MISSING - cannot restart service'
  }
} catch {
  Write-HookLog ('nssm error: ' + $_.Exception.Message)
} finally {
  # Re-enable IMMEDIATELY after nssm returns so the disabled window is minimal.
  if ($wdPaused) {
    try { & schtasks.exe /Change /TN $wdTask /ENABLE 2>&1 | Out-Null } catch { }
    Write-HookLog ('watchdog task re-enabled right after nssm (paused=' + $wdPaused + ')')
  }
}

$newPid = 0
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 2
  try {
    $c2 = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c2 -and $c2.OwningProcess) { $newPid = [int]$c2.OwningProcess; break }
  } catch { }
}

$ok = ($newPid -gt 0)

# Post-restart denylist probe (end-to-end proof the new code is live).
$denyProbe = 'skipped'
$dataProbe = 'skipped'
if ($ok) {
  Start-Sleep -Seconds 2
  try {
    $r1 = [System.Net.HttpWebRequest]::Create('http://127.0.0.1:' + $port + '/_private/mcp-keys-h2dev.md')
    $r1.Method = 'GET'; $r1.Timeout = 8000; $r1.Proxy = $null
    try { $resp = $r1.GetResponse(); $denyProbe = [int]$resp.StatusCode; $resp.Close() }
    catch [System.Net.WebException] {
      if ($_.Exception.Response) { $denyProbe = [int]$_.Exception.Response.StatusCode } else { $denyProbe = 'err' }
    }
  } catch { $denyProbe = 'err' }
  try {
    $r2 = [System.Net.HttpWebRequest]::Create('http://127.0.0.1:' + $port + '/data-tabs/raw-kenh-mau.json')
    $r2.Method = 'GET'; $r2.Timeout = 8000; $r2.Proxy = $null
    try { $resp2 = $r2.GetResponse(); $dataProbe = [int]$resp2.StatusCode; $resp2.Close() }
    catch [System.Net.WebException] {
      if ($_.Exception.Response) { $dataProbe = [int]$_.Exception.Response.StatusCode } else { $dataProbe = 'err' }
    }
  } catch { $dataProbe = 'err' }
}

Write-HookLog ('RELOAD done rc=' + $rc + ' ok=' + $ok + ' oldPid=' + $oldPid + ' newPid=' + $newPid + ' denyProbe=' + $denyProbe + ' dataProbe=' + $dataProbe)
Save-Status @{
  schema = 'h2dev-autoreload/1'; checkedAt = $checkedAt; action = 'reloaded'; reason = $reason
  oldPid = $oldPid; newPid = $newPid; nssmExit = $rc; ok = $ok; wdPaused = $wdPaused
  user = $whoAmI; admin = $isAdmin; denyProbe = $denyProbe; dataProbe = $dataProbe
}
exit 0
