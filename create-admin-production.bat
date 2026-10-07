@echo off
setlocal
cd /d "%~dp0"
title Maison Jawaher - Create secure production admin

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js 22 or newer is required: https://nodejs.org
    pause
    exit /b 1
)
if not exist node_modules (
    echo Installing missing dependencies. No database operation has started.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed. No admin was created.
        pause
        exit /b 1
    )
)

node scripts\batch-runner.mjs admin-production %*
set "run_result=%errorlevel%"
echo.
if "%run_result%"=="2" echo Cancelled before the operation started.
if not "%run_result%"=="0" if not "%run_result%"=="2" echo Resolve the error above before retrying.
pause
exit /b %run_result%
