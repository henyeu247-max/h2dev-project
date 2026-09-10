' ============================================================
' H2DEV Server - silent launcher (no console window)
' Runs h2dev-tray.ps1 hidden. Used by startup / scheduled task.
' ASCII only - safe for wscript.
' GUARD: if port 8899 already listening, exit immediately (no duplicate tray).
' ============================================================
Option Explicit

Dim fso, scriptDir, psPath, vbsPath, args, shell, portInUse

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' --- GUARD: check if port 8899 already listening ---
' Use in-process HTTP check (100% silent, no cmd.exe window flash)
Dim httpCheck
On Error Resume Next
Set httpCheck = CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Not httpCheck Is Nothing Then
  httpCheck.open "GET", "http://127.0.0.1:8899", False
  httpCheck.setTimeouts 1000, 1000, 1000, 1000
  httpCheck.send
  If Err.Number = 0 And httpCheck.status >= 200 And httpCheck.status < 400 Then
    ' Port 8899 already listening and healthy — exit immediately without duplicate tray
    WScript.Quit(0)
  End If
End If
On Error GoTo 0

' --- Port free — launch tray ---
' Tray must run in -STA mode (NotifyIcon requirement).
' Locate powershell.exe with absolute fallback chain.
psPath = ""
If fso.FileExists("C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe") Then
  psPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
ElseIf fso.FileExists("C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe") Then
  psPath = "C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"
Else
  psPath = "powershell.exe"
End If

vbsPath = """" & scriptDir & "\h2dev-tray.ps1"""
args = """" & psPath & """ -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File " & vbsPath

Set shell = CreateObject("WScript.Shell")
shell.Run args, 0, False
