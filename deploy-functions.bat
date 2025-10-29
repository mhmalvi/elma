@echo off
echo Deploying Supabase Edge Functions...
echo.

echo Deploying ai-chat function...
npx supabase functions deploy ai-chat --project-ref jqcmilxgojoanqreavml

echo.
echo Deploying voice-to-text function...
npx supabase functions deploy voice-to-text --project-ref jqcmilxgojoanqreavml

echo.
echo Done! Edge functions deployed.
pause
