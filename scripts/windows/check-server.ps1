# Check H2DEV server state — run from file to avoid self-matching
$trays = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like "*H2DEV*tray.ps1*" }
$servers = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match "server\.js" }
$port = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue

Write-Output "=== H2DEV SERVER STATE ==="
Write-Output ""
Write-Output "Tray: $($trays.Count)"
foreach($t in $trays){ Write-Output "  PID=$($t.ProcessId)" }
Write-Output ""
Write-Output "Server: $($servers.Count)"
foreach($s in $servers){ Write-Output "  PID=$($s.ProcessId) ParentPID=$($s.ParentProcessId)" }
Write-Output ""
Write-Output "Port 8899: $(if($port){'LISTEN PID '+$port.OwningProcess}else{'DOWN'})"
Write-Output ""
try { $r=Invoke-WebRequest -Uri "http://127.0.0.1:8899/" -UseBasicParsing -TimeoutSec 5; Write-Output "HTTP Local: $($r.StatusCode)" } catch { Write-Output "HTTP Local: FAIL" }
$lanIp = $env:H2DEV_LAN_IP
$tsIp  = $env:H2DEV_TAILSCALE_IP
if ($lanIp) {
  try { $r=Invoke-WebRequest -Uri "http://${lanIp}:8899/" -UseBasicParsing -TimeoutSec 5; Write-Output "HTTP LAN ($lanIp): $($r.StatusCode)" } catch { Write-Output "HTTP LAN ($lanIp): FAIL" }
} else {
  Write-Output "HTTP LAN: SKIP (set H2DEV_LAN_IP)"
}
if ($tsIp) {
  try { $r=Invoke-WebRequest -Uri "http://${tsIp}:8899/" -UseBasicParsing -TimeoutSec 5; Write-Output "HTTP Tailscale ($tsIp): $($r.StatusCode)" } catch { Write-Output "HTTP Tailscale ($tsIp): FAIL" }
} else {
  Write-Output "HTTP Tailscale: SKIP (set H2DEV_TAILSCALE_IP)"
}
