#!/bin/bash
# Скрипт быстрой настройки бэкенда TG Card CRM
# Запуск: bash setup.sh

set -e
echo "========================================"
echo "  TG Card CRM — Настройка бэкенда"
echo "========================================"

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установи с https://python.org"
    exit 1
fi

PYTHON_VER=$(python3 -c "import sys; print(sys.version_info.minor)")
if [ "$PYTHON_VER" -lt "10" ]; then
    echo "❌ Нужен Python 3.10+. Текущая версия: $PYTHON_VER"
    exit 1
fi

echo "✅ Python3 найден"

# Создаём виртуальное окружение
if [ ! -d "venv" ]; then
    echo "📦 Создаём виртуальное окружение..."
    python3 -m venv venv
fi

# Активируем
source venv/bin/activate

# Устанавливаем зависимости
echo "📥 Устанавливаем зависимости..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Создаём .env если нет
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "========================================"
    echo "  ⚠️  НУЖНА НАСТРОЙКА!"
    echo "========================================"
    echo ""
    echo "1. Открой https://my.telegram.org/apps"
    echo "2. Войди со своим номером телефона"
    echo "3. Создай приложение (любое название)"
    echo "4. Скопируй App api_id и App api_hash"
    echo "5. Вставь в файл backend/.env:"
    echo ""
    echo "   TG_API_ID=12345678"
    echo "   TG_API_HASH=abcdef..."
    echo ""
    echo "Потом запусти: bash setup.sh снова или python main.py"
    echo "========================================"
else
    echo "✅ .env файл найден"
    echo ""
    echo "🚀 Запускаем сервер..."
    echo "   WebSocket: ws://localhost:8000/ws"
    echo "   API:       http://localhost:8000"
    echo ""
    python main.py
fi