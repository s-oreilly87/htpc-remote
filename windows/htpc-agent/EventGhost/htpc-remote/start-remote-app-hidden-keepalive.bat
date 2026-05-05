@echo off

:: Path to the htpc-remote Next.js app — update this for your machine
set APP_DIR=C:\Users\YOUR_USER\path\to\htpc-remote

cd "%APP_DIR%"

:START
start /B "" npm run start > NUL 2>&1

:CHECK_APP
tasklist /fi "ImageName eq node.exe" /fo csv 2>NUL | find /I "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
   timeout /t 60 /nobreak > NUL
   goto CHECK_APP
) else (
   echo "App crashed, restarting..."
   goto START
)