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
try { $r=Invoke-WebRequest -Uri "http://192.168.50.216:8899/" -UseBasicParsing -TimeoutSec 5; Write-Output "HTTP LAN: $($r.StatusCode)" } catch { Write-Output "HTTP LAN: FAIL" }
try { $r=Invoke-WebRequest -Uri "http://100.83.146.28:8899/" -UseBasicParsing -TimeoutSec 5; Write-Output "HTTP Tailscale: $($r.StatusCode)" } catch { Write-Output "HTTP Tailscale: FAIL" }
