import base64
import os
import time
import logging
from io import BytesIO
from qrcode import constants
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.main import QRCode
from PIL import Image, ImageDraw
from app.api.schemas import QRCodeParams

logger = logging.getLogger(__name__)


async def save_qr_code_image(img: Image.Image, user_id: int, save_dir: str) -> str:
    """
    Сохраняет изображение QR-кода и возвращает URL для доступа к нему.
    """
    try:
        # Убедимся, что директория существует
        os.makedirs(save_dir, exist_ok=True)

        # Генерация имени файла с временной меткой
        timestamp = int(time.time() * 1000)
        filename = f"qr_code_{user_id}_{timestamp}.png"
        save_path = os.path.join(save_dir, filename)

        # Удаляем старые файлы для этого пользователя
        for old_file in os.listdir(save_dir):
            if old_file.startswith(f"qr_code_{user_id}_"):
                os.remove(os.path.join(save_dir, old_file))

        # Сохраняем новое изображение QR-кода
        img.save(save_path, 'PNG')

        # Формируем URL для доступа к файлу
        qr_code_url = f"/static/qr_codes/{filename}"
        return qr_code_url

    except Exception as e:
        logger.error(f"Ошибка при сохранении QR-кода: {e}")
        raise


async def process_logo(logo_base64: str, qr_size: int) -> Image.Image:
    try:
        logo_data = base64.b64decode(logo_base64)
        logo_buffer = BytesIO(logo_data)
        logo = Image.open(logo_buffer)

        # Убедимся, что логотип имеет прозрачный фон
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')

        # Изменяем размер логотипа
        logo_size = int(qr_size * 0.15)  # Увеличим размер логотипа до 25% от размера QR-кода
        logo = logo.resize((logo_size, logo_size))

        # Создаем маску для скругления углов логотипа
        mask = Image.new('L', logo.size, 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), logo.size], radius=int(logo_size * 0.15), fill=255)

        # Применяем маску к логотипу
        output = Image.new('RGBA', logo.size, (0, 0, 0, 0))
        output.paste(logo, (0, 0), mask)

        return output

    except Exception as e:
        logger.error(f"Ошибка при обработке логотипа: {e}")


def create_qr_code(params: QRCodeParams) -> Image.Image:
    try:
        qr = QRCode(
            version=None,
            error_correction=getattr(constants, f"ERROR_CORRECT_{params.error_correction_level}"),
            box_size=10,
            border=4,
        )
        qr.add_data(params.qr_input)
        qr.make(fit=True)

        # Используем StyledPilImage для создания QR-кода с закругленными углами
        img = qr.make_image(fill_color=params.color_picker, back_color=params.bg_color_picker,
                            image_factory=StyledPilImage, module_drawer=RoundedModuleDrawer())
        img = img.resize((params.qr_size, params.qr_size))

        return img

    except Exception as e:
        logger.error(f"Ошибка при создании QR-кода: {e}")
        raise