@echo off
cd /d "%~dp0"
echo Starting Concert Cost Tracker...
echo.
if not exist ".env.local" (
  echo ERROR: .env.local is missing. Copy .env.local.example and add your Supabase keys.
  pause
  exit /b 1
)
echo Clearing old build cache...
if exist ".next" rmdir /s /q ".next"
echo.
echo Keep this window open while you use the app.
echo Open: http://127.0.0.1:3000/signup
echo.
call npm run dev
pause
