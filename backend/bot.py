import asyncio
import os
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()

dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Kursni boshlash", web_app=WebAppInfo(url=WEBAPP_URL))],
            [InlineKeyboardButton(text="AI Chat", url="https://ai-plan.onrender.com/chat")],
        ]
    )
    await message.answer(
        "AI Full Course ga xush kelibsiz! Kursni boshlash uchun tugmani bosing.",
        reply_markup=keyboard,
    )


async def main():
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN .env faylida yo'q.")
    if not WEBAPP_URL.startswith("https://"):
        raise SystemExit("WEBAPP_URL https:// bilan boshlanishi kerak (Telegram talabi).")
    bot = Bot(BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
