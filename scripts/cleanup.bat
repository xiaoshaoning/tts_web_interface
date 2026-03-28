@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    Edge-TTS Web Temporary Files Cleanup Tool
echo ========================================
echo.

REM 安全确认
echo Warning: This operation will delete all temporary files and generated audio files!
echo.
echo The following directories will be cleared:
echo   - uploads\    (uploaded temporary files)
echo   - outputs\    (generated audio files)
echo.
set /p confirm="Are you sure you want to clean up? (Enter Y to confirm): "

if /i not "%confirm%"=="Y" (
    echo Operation cancelled
    pause
    exit /b 0
)

REM 清理 uploads 目录
if exist "uploads\*" (
    echo Cleaning uploads directory...
    del "uploads\*" /q
    echo Deleted temporary files in uploads directory
) else (
    echo uploads directory is empty
)

REM 清理 outputs 目录
if exist "outputs\*" (
    echo Cleaning outputs directory...
    del "outputs\*" /q
    echo Deleted audio files in outputs directory
) else (
    echo outputs directory is empty
)

REM 检查是否有子目录需要清理
dir "uploads" /ad /b >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Warning: Subdirectories found in uploads directory, please check manually
)

dir "outputs" /ad /b >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Warning: Subdirectories found in outputs directory, please check manually
)

echo.
echo ========================================
echo           Cleanup completed!
echo ========================================
echo.
echo Tip: To keep certain audio files, move them to another location first.
echo.

pause