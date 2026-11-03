@echo off
echo ==============================================
echo    Starting RideFlow React Frontend...
echo ==============================================
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install --no-audit --no-fund --legacy-peer-deps
)
set BROWSER=none
call npm start
pause
