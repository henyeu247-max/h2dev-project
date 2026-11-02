' Windowless launcher for H2DEV-Auto-Ingest-Watcher (Scheduled Task)
' Invokes node.exe directly without spawning an intermediate cmd.exe shell
Option Explicit
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "D:\YTB\H2DEV-Project"
cmd = """C:\Program Files\nodejs\node.exe"" ""D:\YTB\H2DEV-Project\scripts\auto_ingest_pipeline.js"" --run --quiet"
sh.Run cmd, 0, True
