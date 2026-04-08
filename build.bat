@echo off
REM Production build script for Windows

echo Building VocalFlow Web Application for production...
echo.

REM Build client
echo 📦 Building frontend...
cd client
call npm install
call npm run build

if errorlevel 1 (
  echo ✗ Frontend build failed
  exit /b 1
)

echo ✓ Frontend build complete
cd ..

REM Package server
echo.
echo 📦 Installing server dependencies...
cd server
call npm install --production

if errorlevel 1 (
  echo ✗ Server setup failed
  exit /b 1
)

echo ✓ Server ready for production
cd ..

echo.
echo ✓ Production build complete!
echo.
echo To start the production server:
echo   cd server && set NODE_ENV=production && npm start
echo.
echo Or with custom port:
echo   set PORT=8000 && set NODE_ENV=production && npm start
