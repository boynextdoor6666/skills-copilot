@echo off
echo ================================================
echo    Запуск Movie Aggregator Backend (NestJS)
echo ================================================
echo.

cd /d "%~dp0movie-aggregator-backend-nest"

echo Проверка установки зависимостей...
if not exist "node_modules\" (
    echo Node modules отсутствуют. Установка...
    call npm install
)

echo.
echo Проверка .env файла...
if not exist ".env" (
    echo ВНИМАНИЕ: .env файл не найден!
    echo Создайте .env файл со следующим содержимым:
    echo.
    echo DB_HOST=127.0.0.1
    echo DB_PORT=3306
    echo DB_USER=root
    echo DB_PASS=your_password
    echo DB_NAME=warehouse
    echo JWT_SECRET=your-secret-key-here
    echo.
    pause
    exit /b 1
)

echo.
echo Запуск backend сервера...
echo Backend будет доступен на: http://localhost:8080
echo Swagger UI: http://localhost:8080/swagger
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

call npm run start:dev
