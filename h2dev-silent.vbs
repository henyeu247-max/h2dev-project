Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
target = fso.BuildPath(scriptDir, "scripts\windows\h2dev-silent.vbs")
shell.Run "wscript.exe """ & target & """", 0, False
