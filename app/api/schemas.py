from pydantic import BaseModel


class QRBase(BaseModel):
    user_id: int


class QRCodeParams(QRBase):
    qr_input: str
    qr_size: int
    color_picker: str
    bg_color_picker: str
    error_correction_level: str
    qr_logo: str | None = None


class QRCodeRequest(QRBase):
    qr_code_url: str


class QRCodeScaner(QRBase):
    result_scan: str
