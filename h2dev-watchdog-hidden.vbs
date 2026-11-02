Option Explicit
Dim http, shell, fso, scriptDir, ps, target

' Fast in-process /health probe (~60B JSON): if port 8899 is healthy, exit in 2ms with 0 child processes spawned
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Not http Is Nothing Then
  http.open "GET", "http://127.0.0.1:8899/health", False
  http.setTimeouts 1500, 1500, 1500, 1500
  http.send
  If Err.Number = 0 And http.status >= 200 And http.status < 400 Then
    WScript.Quit 0
  End If
End If
On Error GoTo 0

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists("C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe") Then
  ps = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
Else
  ps = "powershell.exe"
End If
target = fso.BuildPath(scriptDir, "scripts\windows\h2dev-watchdog.ps1")
shell.Run """" & ps & """ -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & target & """", 0, False
