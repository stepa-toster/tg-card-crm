import os
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from telethon import TelegramClient
from telethon.sessions import StringSession

# Настройка приложения
app = Flask(__name__)
CORS(app)  # Разрешаем запросы с твоего сайта

# 1. Получаем настройки из переменных Render
API_ID = os.environ.get("TG_API_ID")
API_HASH = os.environ.get("TG_API_HASH")
SESSION_STRING = os.environ.get("TG_SESSION")

# Проверяем, что переменные есть
if not API_ID or not API_HASH or not SESSION_STRING:
    print("❌ ОШИБКА: Не заданы переменные окружения (TG_API_ID, TG_API_HASH, TG_SESSION)")

# 2. Инициализация Telegram клиента
# Создаем глобальный цикл событий, чтобы Flask не ругался на асинхронность
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

client = TelegramClient(
    StringSession(SESSION_STRING), 
    int(API_ID), 
    API_HASH, 
    loop=loop
)

# Функция запуска клиента
async def start_telegram():
    print("🔄 Подключение к Telegram...")
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print("❌ Ошибка: Сессия невалидна! Проверь TG_SESSION.")
        else:
            me = await client.get_me()
            print(f"✅ Бот успешно запущен как: {me.first_name} (@{me.username})")
    except Exception as e:
        print(f"❌ Критическая ошибка подключения: {e}")

# Запускаем подключение при старте сервера
if SESSION_STRING:
    loop.run_until_complete(start_telegram())


# === API МЕТОДЫ ===

@app.route('/', methods=['GET'])
def home():
    """Проверка, что сервер жив"""
    return jsonify({
        "status": "online", 
        "service": "TG CRM Backend",
        "authorized": client.is_connected()
    })

@app.route('/api/sendMessage', methods=['POST'])
def send_message():
    """
    Отправка сообщения.
    Принимает JSON: { "chatId": "@username", "message": "Текст" }
    """
    data = request.json
    chat_id = data.get('chatId')
    text = data.get('message')

    print(f"📩 Попытка отправки: {chat_id} | Текст: {text}")

    if not chat_id or not text:
        return jsonify({"success": False, "error": "Не указан chatId или message"}), 400

    async def _send():
        try:
            # Отправляем сообщение
            await client.send_message(chat_id, text)
            return {"success": True}
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            return {"success": False, "error": str(e)}

    # Запускаем асинхронную отправку
    result = loop.run_until_complete(_send())
    return jsonify(result)

if __name__ == '__main__':
    # Render сам задает PORT, если нет - используем 10000
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)