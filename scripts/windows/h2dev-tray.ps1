# ============================================================
#  H2DEV Server - Tray icon manager (ASCII only)
#  Run on MACHINE 192.168.50.216 (laptop-saxukeb)
#  - Starts `node server.js` hidden (LAN + Tailscale)
#  - Kills any previous H2DEV node before starting (no port conflict)
#  - Tray menu: Open Web / Restart / Stop / Start / Open Log / Exit
#  Launch hidden via h2dev-silent.vbs or scheduled task.
# ============================================================
param(
  [string]$Action = "tray"   # tray | start-hidden | stop
)

$ErrorActionPreference = "Continue"

$script:root    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$script:nodeExe = "node"
$script:port    = 8899
$script:log     = Join-Path $script:root "server-lan.log"
$script:err     = Join-Path $script:root "server-lan.err.log"
$script:diag    = Join-Path $script:root "h2dev-tray.log"
$script:proc    = $null

function Write-Diag($msg) {
  try {
    Add-Content -Path $script:diag -Value ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
  } catch { }
}

# Find node processes that run our server.js (match "server.js" in cmdline)
function Get-ServerPids {
  try {
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match "server\.js" } |
      Select-Object -ExpandProperty ProcessId
  } catch { @() }
}

function Start-Server {
  # Check if port 8899 already listening — if yes, DON'T kill existing server
  $listening = $null
  try {
    $listening = Get-NetTCPConnection -LocalPort $script:port -State Listen -ErrorAction SilentlyContinue
  } catch { }
  if ($listening -and $listening.Count -ge 1) {
    $existingPid = $listening.OwningProcess | Select-Object -First 1
    Write-Diag "Port $($script:port) already LISTENING (PID=$existingPid) — skip Start-Server, no kill"
    return $existingPid
  }

  # Port free — kill any stale H2DEV node first (avoid port conflict)
  $old = Get-ServerPids
  foreach ($pid2 in $old) {
    try { Stop-Process -Id $pid2 -Force -ErrorAction SilentlyContinue } catch { }
    Write-Diag "Killed stale node PID=$pid2"
  }
  Start-Sleep -Milliseconds 500
  try {
    $env:HOST = "0.0.0.0"
    $env:PORT = "$($script:port)"
    $script:proc = Start-Process -FilePath $script:nodeExe `
      -ArgumentList "server.js" `
      -WorkingDirectory $script:root `
      -WindowStyle Hidden `
      -RedirectStandardOutput $script:log `
      -RedirectStandardError  $script:err `
      -PassThru
    Write-Diag "Server started PID=$($script:proc.Id) HOST=$env:HOST PORT=$env:PORT"
    return $script:proc.Id
  } catch {
    Write-Diag "ERROR Start-Server: $($_.Exception.Message)"
    return $null
  }
}

function Stop-Server {
  $old = Get-ServerPids
  foreach ($pid2 in $old) {
    try { Stop-Process -Id $pid2 -Force -ErrorAction SilentlyContinue } catch { }
  }
}

# ---------------- Actions ----------------
if ($Action -eq "start-hidden") {
  Write-Diag "start-hidden invoked"
  $id = Start-Server
  Write-Diag "start-hidden done PID=$id URL=http://0.0.0.0:$script:port"
  exit 0
}
if ($Action -eq "stop") {
  Stop-Server
  Write-Diag "Server stopped."
  exit 0
}

# ---------------- Tray mode ----------------
try {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  Write-Diag "Assemblies loaded, entering tray mode"
} catch {
  Write-Diag "ERROR loading assemblies: $($_.Exception.Message)"
  exit 1
}

# Use custom icon (red bg + white Y) if present, else fallback to system app icon
$icon = $null
$iconFile = Join-Path $script:root "h2dev-icon.ico"
try {
  if (Test-Path $iconFile) {
    $icon = New-Object System.Drawing.Icon($iconFile)
  }
} catch { $icon = $null }
if (-not $icon) {
  try { $icon = New-Object System.Drawing.Icon ([System.Drawing.SystemIcons]::Application) } catch { }
}
$notify = New-Object System.Windows.Forms.NotifyIcon
if ($icon) { $notify.Icon = $icon } else { $notify.Icon = [System.Drawing.SystemIcons]::Application }
$notify.Text = "H2DEV Server (port $script:port)"
$notify.Visible = $true
Write-Diag "NotifyIcon created + visible (icon: $([bool]$icon))"

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$openItem = New-Object System.Windows.Forms.ToolStripMenuItem
$openItem.Text = "Open Web (127.0.0.1:$script:port)"
$openItem.Add_Click({
  try { [System.Diagnostics.Process]::Start("http://127.0.0.1:$script:port/") } catch { }
})

$restartItem = New-Object System.Windows.Forms.ToolStripMenuItem
$restartItem.Text = "Restart Server"
$restartItem.Add_Click({
  Stop-Server
  Start-Sleep -Milliseconds 800
  $id = Start-Server
  Write-Diag "Server restarted PID=$id"
  try { $notify.ShowBalloonTip(2000, "H2DEV", "Server restarted (PID $id)", [System.Windows.Forms.ToolTipIcon]::Info) } catch { }
})

$stopItem = New-Object System.Windows.Forms.ToolStripMenuItem
$stopItem.Text = "Stop Server"
$stopItem.Add_Click({
  Stop-Server
  Write-Diag "Server stopped (manual)."
  try { $notify.ShowBalloonTip(2000, "H2DEV", "Server stopped", [System.Windows.Forms.ToolTipIcon]::Info) } catch { }
})

$startItem = New-Object System.Windows.Forms.ToolStripMenuItem
$startItem.Text = "Start Server"
$startItem.Add_Click({
  $id = Start-Server
  Write-Diag "Server started (manual) PID=$id"
  try { $notify.ShowBalloonTip(2000, "H2DEV", "Server started (PID $id)", [System.Windows.Forms.ToolTipIcon]::Info) } catch { }
})

$logItem = New-Object System.Windows.Forms.ToolStripMenuItem
$logItem.Text = "Open Log Folder"
$logItem.Add_Click({
  try { [System.Diagnostics.Process]::Start("explorer.exe", "/select,`"$script:log`"") } catch { }
})

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "Exit (keep server running)"
$exitItem.Add_Click({
  $notify.Visible = $false
  [System.Windows.Forms.Application]::Exit()
})

$sep = New-Object System.Windows.Forms.ToolStripSeparator
$menu.Items.Add($openItem) | Out-Null
$menu.Items.Add($restartItem) | Out-Null
$menu.Items.Add($stopItem) | Out-Null
$menu.Items.Add($startItem) | Out-Null
$menu.Items.Add($logItem) | Out-Null
$menu.Items.Add($sep) | Out-Null
$menu.Items.Add($exitItem) | Out-Null

$notify.ContextMenuStrip = $menu

# start server on launch
$id = Start-Server
Write-Diag "Tray started. Server PID=$id URL=http://0.0.0.0:$script:port"

[System.Windows.Forms.Application]::Run()
$notify.Dispose()