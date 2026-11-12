@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Download the LTS version from https://nodejs.org then run this again. & pause & exit /b)
if not exist node_modules ( echo Installing packages, please wait... & call npm install )
start "" http://localhost:5173
call npm run dev
pause
