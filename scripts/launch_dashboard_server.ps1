# launch_dashboard_server.ps1: Bounded idempotent hidden launcher for AGV Dashboard Server
$port = 18765
$serverScript = "D:\YTB\H2DEV-Project\scripts\dashboard_server.py"
$pythonExe = "C:\Users\SaxukeB\AppData\Local\Programs\Python\Python313\python.exe"
$logDir = "D:\YTB\H2DEV-Project\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$stdoutPath = Join-Path $logDir "dashboard_server.out.log"
$stderrPath = Join-Path $logDir "dashboard_server.err.log"

# 1. Check if already running and healthy
try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -TimeoutSec 1 -ErrorAction Stop
    if ($resp.app -eq "agv_commands_skills_dashboard") {
        Write-Host "Dashboard server is already running and healthy (version $($resp.version))."
        exit 0
    }
} catch {
    # Port either closed or not healthy
}

# 2. Check if port is held by foreign process
$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Error "Port $port is bound by a foreign process (PID $($conn.OwningProcess)). Aborting."
    exit 1
}

# 3. Spawn background process with explicit log redirection
$p = Start-Process -FilePath $pythonExe -ArgumentList "`"$serverScript`"" -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru

# 4. Bounded startup health check (up to 10s, 200ms interval)
$deadline = (Get-Date).AddSeconds(10)
$healthy = $false

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 200
    if ($p.HasExited) {
        Write-Error "Dashboard server process exited prematurely with code $($p.ExitCode). Check log: $stderrPath"
        exit 1
    }
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -TimeoutSec 1 -ErrorAction Stop
        if ($resp.app -eq "agv_commands_skills_dashboard") {
            $healthy = $true
            break
        }
    } catch {
        # Retry
    }
}

if ($healthy) {
    Write-Host "Dashboard server successfully started and verified on http://127.0.0.1:$port/ (PID $($p.Id), version $($resp.version))."
    exit 0
} else {
    Write-Error "Timed out waiting for dashboard server health probe."
    exit 1
}
