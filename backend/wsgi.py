# PythonAnywhere WSGI konfiguratsiyasi uchun.
# FastAPI ASGI ilova bo'lgani uchun a2wsgi orqali o'raymiz.
import sys
from pathlib import Path

PROJECT = "/home/<PYTHONANYWHERE_USERNAME>/ai-full-course/backend"
if PROJECT not in sys.path:
    sys.path.insert(0, PROJECT)

from a2wsgi import ASGIMiddleware
from main import app as fastapi_app

application = ASGIMiddleware(fastapi_app)
