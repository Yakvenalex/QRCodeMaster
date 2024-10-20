from PIL import Image
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.api.schemas import QRCodeParams, QRCodeRequest, QRCodeScaner
from app.api.utils import create_qr_code, process_logo, save_qr_code_image
from app.bot.create_bot import bot
from app.bot.keyboards.kbs import main_keyboard
from app.config import settings

router = APIRouter(prefix='/api', tags=['АПИ'])


@router.post("/generate-qr/")
async def generate_qr(params: QRCodeParams):
    img = create_qr_code(params)

    if params.qr_logo:
        logo = await process_logo(params.qr_logo, params.qr_size)
        if logo:
            # Рассчитываем позицию для вставки логотипа в центр QR-кода
            pos = ((params.qr_size - logo.size[0]) // 2, (params.qr_size - logo.size[1]) // 2)

            # Создаем новое изображение с прозрачным фоном
            combined = Image.new('RGBA', img.size, (0, 0, 0, 0))

            # Преобразуем QR-код в RGBA, если это необходимо
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # Накладываем QR-код и логотип
            combined.paste(img, (0, 0))
            combined.paste(logo, pos, logo)

            img = combined.convert('RGB')  # Преобразуем обратно в RGB для сохранения

    # Сохраняем изображение и возвращаем URL
    qr_code_url = await save_qr_code_image(img, params.user_id, settings.QR_CODES_DIR)

    return JSONResponse(content={"qr_code_url": qr_code_url})


@router.post("/send-qr/", response_class=JSONResponse)
async def send_qr_code(request: QRCodeRequest):
    try:
        caption = (
            "🎉 Ваш QR-код успешно создан и отправлен!\n\n"
            "🔍 Вы можете отсканировать его, чтобы проверить содержимое.\n"
            "📤 Поделитесь этим QR-кодом с другими или сохраните его для дальнейшего использования.\n\n"
            "Что бы вы хотели сделать дальше? 👇"
        )
        await bot.send_photo(chat_id=request.user_id, photo=request.qr_code_url, caption=caption,
                             reply_markup=main_keyboard())
        return JSONResponse(content={"message": "QR-код успешно отправлен"}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
