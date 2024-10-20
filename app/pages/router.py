from fastapi import APIRouter
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse

router = APIRouter(prefix='', tags=['Фронтенд'])
templates = Jinja2Templates(directory='app/templates')


@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("pages/generate.html",
                                      {"request": request,
                                       'active_tab': 'generate'})


@router.get("/scan", response_class=HTMLResponse)
async def upload_qr(request: Request):
    return templates.TemplateResponse("pages/scan.html", {"request": request, 'active_tab': 'scan'})


@router.get("/upload", response_class=HTMLResponse)
async def upload_qr(request: Request):
    return templates.TemplateResponse("pages/upload.html", {"request": request, 'active_tab': 'upload'})
