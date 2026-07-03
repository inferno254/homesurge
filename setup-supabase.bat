@echo off
echo ==========================================
echo   homesurge Supabase Setup
echo ==========================================
echo.

echo Step 1: Login to Supabase...
call supabase login
echo.

echo Step 2: Enter your Project ID (from dashboard URL: supabase.com/dashboard/project/THIS_PART/...)
set /p PROJECT_REF="Project ID: "
echo.

echo Step 3: Linking project...
call supabase link --project-ref %PROJECT_REF%
echo.

echo Step 4: Pushing schema to database...
call supabase db push
echo.

echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next: Add your credentials to .env:
echo   VITE_SUPABASE_URL=https://%PROJECT_REF%.supabase.co
echo   VITE_SUPABASE_ANON_KEY=(from Settings ^> API)
echo.
pause

