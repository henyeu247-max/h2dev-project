Option Explicit
Dim http, shell, fso, scriptDir, target

' Fast in-process health check: if port 8899 is healthy, exit in 2ms with 0 child processes spawned
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Not http Is Nothing Then
  http.open "GET", "http://127.0.0.1:8899", False
  http.setTimeouts 1000, 1000, 1000, 1000
  http.send
  If Err.Number = 0 And http.status >= 200 And http.status < 400 Then
    WScript.Quit 0
  End If
End If
On Error GoTo 0

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
target = fso.BuildPath(scriptDir, "scripts\windows\h2dev-silent.vbs")
shell.Run "wscript.exe """ & target & """", 0, False
