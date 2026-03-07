@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    Edge-TTS Web Service Launcher
echo ========================================
echo.

REM Check if running in correct directory
if not exist "package.json" (
    echo Error: Please run this script in the project directory!
    echo Current directory: %~dp0
    pause
    exit /b 1
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js not found!
    echo Please install Node.js v14 or higher
    pause
    exit /b 1
)

REM Check edge-tts
where edge-tts >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Warning: edge-tts not found!
    echo Conversion function may not work properly
    echo Please run: pip install edge-tts
    echo.
    set /p continue="Continue? (Y/N): "
    if /i not "%continue%"=="Y" (
        exit /b 1
    )
)

echo Starting Edge-TTS Web service...
echo Service URL: http://localhost:3001
echo Press Ctrl+C to stop the service
echo.

REM Create necessary directories
if not exist "uploads" mkdir "uploads"
if not exist "outputs" mkdir "outputs"

REM Start service
npm start

echo.
echo Service stopped
pause