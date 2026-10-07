@echo off
setlocal
cd /d "%~dp0"
title Maison Jawaher - Start website

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js 22 or newer is required: https://nodejs.org
    pause
    exit /b 1
)
if not exist .env.local (
    copy .env.example .env.local >nul
    echo Created .env.local. Configure it before connecting to Supabase.
)
if not exist node_modules (
    echo Installing missing project dependencies. No database operation has started.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed. Nothing was run against the database.
        pause
        exit /b 1
    )
)

node scripts\batch-runner.mjs start %*
set "run_result=%errorlevel%"
echo.
if "%run_result%"=="2" echo Cancelled before the operation started.
if not "%run_result%"=="0" if not "%run_result%"=="2" echo Please resolve the error above before trying again.
pause
exit /b %run_result%
