@echo off
echo ===================================================
echo   LVMH VOICE COCKPIT - DEMARRAGE AUTOMATIQUE
echo ===================================================
echo.

echo 1. Lancement du Backend AI (Python / Whisper)...
start "LVMH Backend AI (Port 8001)" cmd /k "call .venv\Scripts\activate & python backend_ai.py"

echo 2. Lancement du Frontend (Next.js)...
start "LVMH Frontend (Port 3002)" cmd /k "cd frontend-app & npm run dev"

echo.
echo ===================================================
echo   TOUT EST LANCE !
echo   Acces : http://localhost:3002/voice-cockpit
echo ===================================================
pause
