@echo off
echo ========================================
echo Elma Post-Deployment Test Suite
echo ========================================
echo.

echo This will test your Elma deployment locally.
echo Make sure you've completed all deployment steps!
echo.
pause

echo.
echo [1/4] Testing local dev server...
curl -s http://localhost:8080 >nul
if %errorlevel% equ 0 (
    echo [OK] Dev server is running on port 8080
) else (
    echo [ERROR] Dev server not responding!
    echo Run: npm run dev
    pause
    exit /b 1
)

echo.
echo [2/4] Testing Supabase connection...
curl -s -o nul -w "%%{http_code}" https://jqcmilxgojoanqreavml.supabase.co/rest/v1/ | findstr "200" >nul
if %errorlevel% equ 0 (
    echo [OK] Supabase API is accessible
) else (
    echo [WARNING] Supabase API connection issue
)

echo.
echo [3/4] Testing Qdrant connection...
curl -s -o nul -w "%%{http_code}" -H "api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.N72wLky7_bzMR1w3t1PU26WGttyXah2MJFjO7_8Wagw" https://b25ed547-2a16-440a-b596-687c268b1995.eu-central-1-0.aws.cloud.qdrant.io/collections | findstr "200" >nul
if %errorlevel% equ 0 (
    echo [OK] Qdrant vector database is accessible
) else (
    echo [WARNING] Qdrant connection issue - check API key
)

echo.
echo [4/4] Testing Edge Functions...
echo Note: Edge functions require authentication, test manually in browser.
echo.

echo ========================================
echo Manual Testing Checklist:
echo ========================================
echo.
echo Open http://localhost:8080 in your browser and verify:
echo.
echo [ ] Login works without errors
echo [ ] Profile loads (check browser console - no 400 errors)
echo [ ] Can create a new conversation
echo [ ] Can send a message to AI
echo [ ] AI responds to your message
echo [ ] Voice input works (click microphone icon)
echo [ ] No CORS errors in browser console
echo.
echo ========================================
echo Browser Console Check:
echo ========================================
echo.
echo Open DevTools (F12) and check for:
echo   - No red errors
echo   - No CORS policy errors
echo   - No 400 Bad Request errors
echo.
echo If you see errors, check DEPLOYMENT_GUIDE.md troubleshooting section.
echo.

pause

echo.
echo Opening application in browser...
start http://localhost:8080

echo.
echo Press F12 to open DevTools and check console!
echo.
pause
