Option Explicit

Dim fso, sh, rootDir, logDir, logFile, nodeExe, cmdLine, http, isRunning

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

rootDir = "D:\YTB\H2DEV-Project"
logDir = rootDir & "\logs"
logFile = logDir & "\server.log"

' Create logs dir if not exists
If Not fso.FolderExists(logDir) Then
  fso.CreateFolder(logDir)
End If

' Check if server is already running on port 8899
isRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 800, 800, 800, 800
http.Open "GET", "http://127.0.0.1:8899/", False
http.Send
If Err.Number = 0 Then
  If http.Status = 200 Or http.Status = 304 Or http.Status = 404 Then
    isRunning = True
  End If
End If
On Error GoTo 0

If isRunning Then
  ' Already running, exit gracefully
  WScript.Quit 0
End If

' Locate Node.js executable
If fso.FileExists("C:\Program Files\nodejs\node.exe") Then
  nodeExe = """C:\Program Files\nodejs\node.exe"""
Else
  nodeExe = "node.exe"
End If

sh.CurrentDirectory = rootDir
cmdLine = "cmd.exe /c " & nodeExe & " server.js >> """ & logFile & """ 2>&1"
sh.Run cmdLine, 0, False
