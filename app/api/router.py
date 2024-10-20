import base64
from io import BytesIO

from aiogram.types import InputFile, BufferedInputFile
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.api.schemas import QRCodeRequest, QRCodeScaner
from app.bot.create_bot import bot
from app.bot.keyboards.kbs import main_keyboard

router = APIRouter(prefix='/api', tags=['АПИ'])


@router.post("/send-qr/", response_class=JSONResponse)
async def send_qr_code(request: QRCodeRequest):
    try:
        # Получаем base64 строку из запроса
        base64_data = request.qr_code_url

        # Удаляем префикс MIME, если он есть
        if base64_data.startswith('data:image/'):
            base64_data = base64_data.split(',', 1)[1]

        # Декодируем base64 изображение в байты
        image_data = base64.b64decode(base64_data)

        # Создаем BufferedInputFile для отправки изображения
        image_file = BufferedInputFile(file=image_data, filename="qr_code.png")

        caption = (
            "🎉 Ваш QR-код успешно создан и отправлен!\n\n"
            "🔍 Вы можете отсканировать его, чтобы проверить содержимое.\n"
            "📤 Поделитесь этим QR-кодом с другими или сохраните его для дальнейшего использования.\n\n"
            "Что бы вы хотели сделать дальше? 👇"
        )

        # Используем BufferedInputFile для отправки изображения
        await bot.send_photo(
            chat_id=request.user_id,
            photo=image_file,  # Передаем BufferedInputFile
            caption=caption,
            reply_markup=main_keyboard()
        )

        return JSONResponse(content={"message": "QR-код успешно отправлен"}, status_code=200)
    except Exception as e:
        print(f"Ошибка при отправке QR-кода: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при отправке QR-кода: {str(e)}")


@router.post("/send-scaner-info/", response_class=JSONResponse)
async def send_qr_code(request: QRCodeScaner):
    try:
        text = (
            f"🎉 QR-код успешно отсканирован!\n\n"
            f"📄 Результат сканирования:\n\n"
            f"<code><b>{request.result_scan}</b></code>\n\n"
            f"🔗 Если это ссылка, вы можете перейти по ней.\n"
            f"📝 Если это текст, вы можете скопировать его для дальнейшего использования.\n\n"
            f"Что бы вы хотели сделать дальше? 👇"
        )
        await bot.send_message(chat_id=request.user_id, text=text, reply_markup=main_keyboard())
        return JSONResponse(content={"message": "QR-код успешно просканирован, а данные отправлены в Telegram"},
                            status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
