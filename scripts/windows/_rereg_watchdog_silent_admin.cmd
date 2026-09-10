@echo off
REM One-shot: re-register H2DEV-Watchdog to use wscript hidden VBS (no console flash).
REM Run elevated.
setlocal
set "VBS=D:\YTB\H2DEV-Project\h2dev-watchdog-hidden.vbs"
set "TASK=H2DEV-Watchdog"
set "USER=%COMPUTERNAME%\%USERNAME%"

if not exist "%VBS%" (
  echo MISSING %VBS%
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$task='H2DEV-Watchdog'; $vbs='D:\YTB\H2DEV-Project\h2dev-watchdog-hidden.vbs'; $user=\"$env:COMPUTERNAME\$env:USERNAME\";" ^
  "$a=New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('/b /nologo \"'+$vbs+'\"');" ^
  "$t1=New-ScheduledTaskTrigger -AtLogOn -User $user; $t1.Delay='PT30S';" ^
  "$t2=New-ScheduledTaskTrigger -Once -At (Get-Date '2026-01-01T00:00:00') -RepetitionInterval (New-TimeSpan -Minutes 5);" ^
  "$s=New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -Hidden;" ^
  "$p=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited;" ^
  "Unregister-ScheduledTask -TaskName $task -Confirm:$false -EA SilentlyContinue;" ^
  "Register-ScheduledTask -TaskName $task -Action $a -Trigger @($t1,$t2) -Settings $s -Principal $p -Description 'H2DEV watchdog silent (wscript) - restart if port 8899 down' -Force | Out-Null;" ^
  "$t=Get-ScheduledTask -TaskName $task; $i=$t|Get-ScheduledTaskInfo;" ^
  "Write-Host ('OK action=' + $t.Actions[0].Execute + ' ' + $t.Actions[0].Arguments);" ^
  "Write-Host ('OK next=' + $i.NextRunTime + ' state=' + $t.State)"

if errorlevel 1 (
  echo FAIL register
  exit /b 1
)
echo DONE
exit /b 0
