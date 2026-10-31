@echo off
setlocal EnableExtensions
title AI Full Course - Setup and Run
cd /d "%~dp0"
echo.
echo  ============================================
echo       AI FULL COURSE - INSTALLER
echo  ============================================
echo.
where python >nul 2>nul
if errorlevel 1 (
  echo [XATO] Python topilmadi. Python 3.11 yoki 3.12 o'rnating.
  echo https://www.python.org/downloads/
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo [XATO] Node.js topilmadi. Node.js LTS o'rnating.
  echo https://nodejs.org/
  pause
  exit /b 1
)
if not exist ".env" copy ".env.example" ".env" >nul
if not exist ".venv\Scripts\python.exe" (
  echo [1/5] Python virtual muhit yaratilmoqda...
  python -m venv .venv
  if errorlevel 1 goto failed
)
echo [2/5] Backend kutubxonalari o'rnatilmoqda...
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 goto failed
echo [3/5] Bot kutubxonalari o'rnatilmoqda...
".venv\Scripts\python.exe" -m pip install -r bot\requirements.txt
if errorlevel 1 goto failed
echo [4/5] Frontend kutubxonalari o'rnatilmoqda...
cd frontend
if not exist "node_modules" call npm install
if errorlevel 1 goto failed_front
cd ..
echo [5/5] Xizmatlar ishga tushirilmoqda...
start "AI Full Course API" /D "%~dp0backend" cmd /k ""%~dp0.venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "AI Full Course Frontend" /D "%~dp0frontend" cmd /k "npm run dev"
if exist ".env" (
  findstr /R /C:"^BOT_TOKEN=.[^ ]" .env >nul
  if not errorlevel 1 (
    echo Bot token topildi. Bot ham ishga tushirilmoqda...
    start "AI Full Course Telegram Bot" /D "%~dp0bot" cmd /k ""%~dp0.venv\Scripts\python.exe" bot.py"
  ) else (
    echo BOT_TOKEN kiritilmagan. Telegram bot hozircha ishga tushmaydi.
  )
) else (
  echo .env fayli yo'q. Telegram bot uchun .env.example nusxasini .env qilib, token kiriting.
)
echo.
echo Tayyor! Brauzerda quyidagi manzilni oching:
echo http://localhost:3000
echo Backend API:
echo http://127.0.0.1:8000/docs
echo.
echo Eslatma: Telegram Mini App uchun frontend HTTPS domen orqali deploy qilinishi kerak.
pause
exit /b 0

:failed_front
cd ..
:failed
echo.
echo [XATO] O'rnatish jarayonida muammo yuz berdi. Yuqoridagi xabarlarni tekshiring.
pause
exit /b 1
