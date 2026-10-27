@echo off
title Winamp YTM - Full-Stack Launcher
echo ========================================================
echo   Launching Winamp YTM (Classic Winamp + YouTube Music)
echo ========================================================
echo.
echo 1. Starting Backend Audio Stream Proxy (:4000)...
start "Winamp YTM - Backend Server" cmd /k "cd /d %~dp0server && npm start"

timeout /t 2 /nobreak >nul

echo 2. Starting Frontend Client Dev Server (:5173)...
start "Winamp YTM - Frontend Webamp" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul
echo.
echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/
echo.
echo ========================================================
echo  All services started! Keep backend and client windows open.
echo ========================================================
pause
