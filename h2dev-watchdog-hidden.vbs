Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
target = fso.BuildPath(scriptDir, "scripts\windows\h2dev-watchdog-hidden.vbs")
shell.Run "wscript.exe /b /nologo """ & target & """", 0, False
