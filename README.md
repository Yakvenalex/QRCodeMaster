# QRCodeMaster

QRCodeMaster — это MiniApp + Telegram-бот, который позволяет:
- 📷 Сканировать QR-коды в реальном времени через камеру.
- 📤 Распознавать QR-коды на загруженных изображениях.
- ✨ Создавать новые QR-коды с возможностью кастомизации.

## Стек технологий

- **FastAPI** — для бэкенда и обработки запросов.
- **Aiogram** — для работы с Telegram-ботом.
- **Uvicorn** — сервер для запуска FastAPI.
- **Pydantic** — для валидации данных.
- **Jinja2** — для шаблонизации.

## Переменные окружения

Проект использует файл `.env` для хранения конфиденциальных данных. Пример содержимого файла:

```ini
BOT_TOKEN=7702023022:FAKEfaketokenFAKE
BASE_SITE=https://fake-url.amvera.io
ADMIN_ID=5027801744
```

- BOT_TOKEN — токен вашего Telegram-бота.
- BASE_SITE — адрес вашего сайта для использования в вебхуках и MiniApp.
- ADMIN_ID — Telegram ID администратора.

## Установка проекта

1. Склонируйте репозиторий:

```bash
git clone https://github.com/Yakvenalex/QRCodeMaster.git
cd QRCodeMaster
```

2. Установите зависимости:

```bash
pip install -r requirements.txt
```

3. Создайте файл .env с вашими настройками (см. раздел "Переменные окружения").
4. Запустите приложение:

```bash
uvicorn app.main:app --reload
```

## Зависимости

Проект использует следующие зависимости:

```txt
aiogram==3.13.1
fastapi==0.115.0
pydantic==2.9.2
uvicorn==0.31.0
jinja2==3.1.4
pydantic_settings==2.5.2
```

