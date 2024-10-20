from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from app.bot.keyboards.kbs import main_keyboard

user_router = Router()


@user_router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    welcome_text = (
        "👋 Привет! Добро пожаловать в мир QR-кодов! 🌟\n\n"
        "Я ваш помощник по работе с QR-кодами. Вот что я умею:\n\n"
        "📷 Сканировать QR-коды в реальном времени\n"
        "📤 Распознавать QR-коды на загруженных фото\n"
        "✨ Создавать новые QR-коды\n\n"
        "Выберите нужную функцию в меню ниже и начните работу! 🚀"
    )
    await message.answer(welcome_text, reply_markup=main_keyboard())
