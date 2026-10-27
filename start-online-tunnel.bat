@echo off
title Winamp YTM - Online Public Tunnel
echo ========================================================
echo   Winamp YTM - Public Online Tunnel for Mobile APK
echo ========================================================
echo.
echo Connecting local port 4000 to public HTTPS internet...
echo.
echo Copy the URL shown below and paste it into Winamp on your phone
echo (Help ^> About Winamp ^> Backend Server IP)
echo.
npx --yes localtunnel --port 4000
pause
