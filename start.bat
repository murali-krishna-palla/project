@echo off
REM Start both server and client in development mode for Windows

echo Starting VocalFlow Web Application...
echo.

REM Start server in new window
echo Starting backend server...
start cmd /k "cd server && npm install && npm run dev"

REM Wait for server to start
timeout /t 3 /nobreak

REM Start client in new window
echo Starting frontend client...
start cmd /k "cd client && npm install && npm start"

echo.
echo ======================================
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo ======================================
echo.
echo Press Ctrl+C in each window to stop services.
