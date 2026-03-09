@echo off
chcp 65001 >nul
title TG Card CRM — Backend Server

echo.
echo ╔══════════════════════════════════════════════╗
echo ║        TG Card CRM — Backend Server          ║
echo ╚══════════════════════════════════════════════╝
echo.

:: Проверяем Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    echo.
    echo Скачай Python с: https://www.python.org/downloads/
    echo При установке поставь галочку "Add Python to PATH"
    echo.
    pause
    exit /b
)

echo ✅ Python найден

:: Проверяем .env файл
if not exist .env (
    echo.
    echo ⚠️  Файл .env не найден!
    echo.
    echo Создаю .env из примера...
    copy .env.example .env >nul
    echo.
    echo ╔══════════════════════════════════════════════════════════╗
    echo ║  ВАЖНО: Открой файл backend\.env и заполни:             ║
    echo ║                                                          ║
    echo ║  TG_API_ID=12345678                                      ║
    echo ║  TG_API_HASH=твой_хеш                                   ║
    echo ║                                                          ║
    echo ║  Ключи получи на: https://my.telegram.org/apps          ║
    echo ╚══════════════════════════════════════════════════════════╝
    echo.
    echo Открываю .env для редактирования...
    notepad .env
    echo.
    echo После заполнения .env нажми любую клавишу для продолжения...
    pause >nul
)

echo ✅ Файл .env найден

:: Создаём папку sessions
if not exist sessions mkdir sessions

:: Устанавливаем зависимости
echo.
echo 📦 Проверяю зависимости...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей!
    echo Запусти вручную: pip install -r requirements.txt
    pause
    exit /b
)

echo ✅ Зависимости установлены

:: Запускаем сервер
echo.
echo 🚀 Запускаю сервер...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Сервер: http://localhost:8000
echo   Статус: http://localhost:8000/api/health
echo.
echo   Теперь открой CRM: http://localhost:5173
echo   Перейди в Настройки → Аккаунты → + Аккаунт
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   Для остановки нажми Ctrl+C
echo.

python main.py

echo.
echo Сервер остановлен.
pause
