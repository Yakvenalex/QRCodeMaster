import os
from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    BOT_TOKEN: str
    BASE_SITE: str
    ADMIN_ID: int

    BASE_DIR: ClassVar[Path] = Path(__file__).resolve().parent
    STATIC_DIR: ClassVar[Path] = BASE_DIR / "static"
    QR_CODES_DIR: ClassVar[Path] = STATIC_DIR / "qr_codes"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    )

    def get_webhook_url(self) -> str:
        """Возвращает URL вебхука с кодированием специальных символов."""
        return f"{self.BASE_SITE}/webhook"


settings = Settings()
