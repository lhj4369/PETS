@echo off
chcp 65001 >nul
echo Installing dependencies (including expo-location)...
call npm install
if %ERRORLEVEL% EQU 0 (
  echo.
  echo Done. You can now run: npm start
) else (
  echo.
  echo Install failed. Check that Node.js and npm are installed.
)
pause
