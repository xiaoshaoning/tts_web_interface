@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    Edge-TTS Web Service Stopper
echo ========================================
echo.

REM Find and stop Node.js server processes
echo Checking for running Edge-TTS Web servers...

set port=3001
set /a max_port=3010
set found=0

:check_ports
if %port% gtr %max_port% goto done_check

echo Checking port %port%...
netstat -ano | findstr ":%port% " | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo Found service listening on port %port%

    REM Get PID from netstat output
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%port% " ^| findstr "LISTENING"') do (
        set pid=%%a
    )

    if defined pid (
        echo Stopping process PID: %pid%
        taskkill /PID %pid% /F >nul 2>nul
        if %ERRORLEVEL% equ 0 (
            echo Successfully stopped process %pid%
            set found=1
        ) else (
            echo Failed to stop process %pid%
        )
        set pid=
    )
)

set /a port+=1
goto check_ports

:done_check
if %found% equ 0 (
    echo No running Edge-TTS Web servers found (checked ports 3001-3010)
)

echo.
echo ========================================
echo           Stop completed!
echo ========================================
echo.
echo Tip: You can also stop the server by pressing Ctrl+C in the terminal
echo.
pause