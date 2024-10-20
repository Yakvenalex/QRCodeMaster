from pydantic import BaseModel


class QRBase(BaseModel):
    user_id: int


class QRCodeRequest(QRBase):
    qr_code_url: str


class QRCodeScaner(QRBase):
    result_scan: str
