' Hidden launcher for h2dev-watchdog.ps1
' Task Scheduler must call THIS via wscript — never powershell.exe directly
' (powershell.exe as task action flashes a console every tick even with -WindowStyle Hidden).
Option Explicit
Dim http, fso, sh, dir, ps, cmd

' Fast in-process health check: if healthy, exit immediately with 0 processes spawned
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Not http Is Nothing Then
  http.open "GET", "http://127.0.0.1:8899", False
  http.setTimeouts 1500, 1500, 1500, 1500
  http.send
  If Err.Number = 0 And http.status >= 200 And http.status < 300 Then
    WScript.Quit 0
  End If
End If
On Error GoTo 0

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists("C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe") Then
  ps = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
Else
  ps = "powershell.exe"
End If
cmd = """" & ps & """ -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & dir & "\h2dev-watchdog.ps1"""
' 0 = no window, False = don't wait (task ends immediately)
sh.Run cmd, 0, False

