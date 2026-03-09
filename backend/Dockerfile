FROM python:3.11-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Создаём папку для сессий
RUN mkdir -p sessions

# Порт
EXPOSE 8000

# Запуск
CMD ["python", "main.py"]