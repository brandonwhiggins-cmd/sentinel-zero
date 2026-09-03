@echo off
title Sentinel Zero | Cloud Sync Updater
cls
echo ========================================================
echo    SENTINEL ZERO ^| 1-CLICK CLOUD SYNC ACTIVATION
echo ========================================================
echo.
echo Connecting to live cloud servers at sentinelzero.gg...
echo.

set "TARGET_DIR=%~dp0resources\app"
if not exist "%TARGET_DIR%" (
    if exist "%~dp0Sentinel_Zero_Client_App\resources\app" (
        set "TARGET_DIR=%~dp0Sentinel_Zero_Client_App\resources\app"
    ) else (
        echo [ERROR] Could not find resources\app folder.
        echo Please ensure this script is inside your Sentinel_Zero_Client_App folder.
        echo.
        pause
        exit /b 1
    )
)

echo Downloading latest live Cloud Sync launcher engine...
curl -sL --max-time 15 "https://www.sentinelzero.gg/main.js" -o "%TARGET_DIR%\main.js"

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Direct curl failed. Trying PowerShell fallback...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://www.sentinelzero.gg/main.js' -OutFile '%TARGET_DIR%\main.js' -UseBasicParsing"
)

if exist "%TARGET_DIR%\main.js" (
    echo.
    echo ========================================================
    echo  [SUCCESS] Cloud Sync Engine installed successfully!
    echo ========================================================
    echo.
    echo From now on:
    echo  * Every update Brandon pushes to Sentinel Zero updates your client instantly!
    echo  * PROD and TEST environments are 100%% synchronized in real-time.
    echo  * Launch PROD: Double-click 'Launch_PROD_Environment.bat'
    echo  * Launch TEST: Double-click 'Launch_TEST_Environment.bat'
    echo  * Hit F5 or Ctrl+R anytime inside the app to hot-reload!
    echo.
) else (
    echo.
    echo [ERROR] Failed to download main.js. Please check your internet connection.
    echo.
)

pause
