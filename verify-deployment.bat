@echo off
echo ========================================
echo Elma Deployment Verification Script
echo ========================================
echo.

echo Checking local environment...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

echo [OK] .env file exists
echo.

REM Read Qdrant config from .env
findstr "QDRANT_URL" .env >nul
if %errorlevel% equ 0 (
    echo [OK] QDRANT_URL configured
) else (
    echo [WARNING] QDRANT_URL not found in .env
)

findstr "QDRANT_APIKEY" .env >nul
if %errorlevel% equ 0 (
    echo [OK] QDRANT_APIKEY configured
) else (
    echo [WARNING] QDRANT_APIKEY not found in .env
)

findstr "VITE_SUPABASE_URL" .env >nul
if %errorlevel% equ 0 (
    echo [OK] VITE_SUPABASE_URL configured
) else (
    echo [ERROR] VITE_SUPABASE_URL not found in .env
)

findstr "VITE_SUPABASE_ANON_KEY" .env >nul
if %errorlevel% equ 0 (
    echo [OK] VITE_SUPABASE_ANON_KEY configured
) else (
    echo [ERROR] VITE_SUPABASE_ANON_KEY not found in .env
)

echo.
echo ========================================
echo Opening Supabase Dashboard...
echo ========================================
echo.
echo Complete these 3 steps in the dashboard:
echo.
echo 1. SQL Editor - Run profile creation SQL
echo 2. Edge Functions - Verify environment variables
echo 3. Settings - Set up GitHub integration for auto-deploy
echo.

REM Open Supabase Dashboard URLs
start https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/editor/sql
timeout /t 2 /nobreak >nul
start https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/functions
timeout /t 2 /nobreak >nul
start https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/settings/integrations

echo.
echo Dashboard pages opened in your browser!
echo.
pause
