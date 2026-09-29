@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install
)

call npm run dev

echo.
echo Сервер остановился с кодом %errorlevel%. Чтобы запустить снова - нажмите любую клавишу...
pause
