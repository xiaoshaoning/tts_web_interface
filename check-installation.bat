@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    Edge-TTS Web Installation Test Tool
echo ========================================
echo.

set error_count=0

REM 1. Check directory structure
echo [1/5] Checking project directory structure...
if exist "package.json" (
    echo   ✓ package.json exists
) else (
    echo   ✗ Error: package.json does not exist!
    set /a error_count+=1
)

if exist "server.js" (
    echo   ✓ server.js exists
) else (
    echo   ✗ Error: server.js does not exist!
    set /a error_count+=1
)

if exist "public\index.html" (
    echo   ✓ Web files exist
) else (
    echo   ✗ Error: Web files do not exist!
    set /a error_count+=1
)

REM 2. Check Node.js
echo [2/5] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do (
        echo   ✓ Node.js installed: %%i
    )
) else (
    echo   ✗ Error: Node.js not installed!
    set /a error_count+=1
)

REM 3. Check edge-tts
echo [3/5] Checking edge-tts installation...
where edge-tts >nul 2>nul
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%i in ('edge-tts --version 2^>nul') do (
        echo   ✓ edge-tts installed: %%i
    )
) else (
    echo   ✗ Warning: edge-tts not installed (conversion function will not work)
    echo     Solution: run pip install edge-tts
)

REM 4. Check Node.js dependencies
echo [4/5] Checking Node.js dependencies...
if exist "node_modules" (
    echo   ✓ node_modules directory exists
) else (
    echo   ✗ Warning: dependencies not installed
    echo     Solution: run npm install
    set /a error_count+=1
)

REM 5. Check port availability
echo [5/5] Checking port 3001...
netstat -ano | findstr :3001 >nul
if %ERRORLEVEL% equ 0 (
    echo   ✗ Warning: port 3001 is already in use
    echo     Solution: modify port number in server.js
    set /a error_count+=1
) else (
    echo   ✓ Port 3001 is available
)

echo.
echo ========================================
echo           Test Results Summary
echo ========================================
echo.

if %error_count% equ 0 (
    echo ✓ All checks passed! System ready
    echo.
    echo Next steps:
    echo   1. Run start-server.bat
    echo   2. Open browser and go to http://localhost:3001
    echo   3. Test with sample file wave_vejle.txt
) else (
    echo ✗ Found %error_count% issues to resolve
    echo.
    echo Please resolve the issues above and try again
)

echo.
echo Documentation resources:
echo   - Quick start: QUICKSTART.md
echo   - Detailed instructions: README.md
echo   - English documentation: README.md
echo.

pause