@echo off
REM edge.bat - Convert text file to speech using edge-tts
REM Usage: edge <textfile>
REM Example: edge english.txt

if "%~1"=="" (
    echo Error: Please provide a text file name.
    echo Usage: edge ^<textfile^>
    exit /b 1
)

set INPUT_FILE=%~1
set OUTPUT_FILE=%~n1.wav

echo Converting %INPUT_FILE% to %OUTPUT_FILE% using voice en-US-MichelleNeural...
edge-tts -f "%INPUT_FILE%" --write-media "%OUTPUT_FILE%" -v en-US-MichelleNeural

if %ERRORLEVEL% equ 0 (
    echo Conversion successful: %OUTPUT_FILE%
) else (
    echo Conversion failed.
    exit /b %ERRORLEVEL%
)