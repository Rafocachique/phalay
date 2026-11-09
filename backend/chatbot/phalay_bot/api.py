"""Canal HTTP autenticado. No recibe instrucciones ni contexto arbitrario del cliente."""
import hmac
import logging
import os
import threading
import time
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StrictBool
from .engine import Bot
from .knowledge import load_articles, parse_articles

app = FastAPI(title="PHALAY Chatbot", docs_url=None, redoc_url=None, openapi_url=None)
logger = logging.getLogger(__name__)


def authenticate(authorization: Annotated[str | None, Header()] = None):
    secret = os.environ.get("CHATBOT_API_KEY", "")
    if len(secret) < 32 or secret.startswith("replace"):
        raise HTTPException(503, "Configura el secreto del chatbot")
    expected = f"Bearer {secret}"
    if not authorization or not hmac.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(401, "No autorizado")


class KnowledgeEntry(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    questions: list[Annotated[str, Field(min_length=1, max_length=500)]] = Field(min_length=1, max_length=30)
    answer: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)
    human_active: StrictBool = False
    # Sólo lo establece el backend autenticado con datos aprobados de su BD.
    articles: list[KnowledgeEntry] | None = Field(default=None, max_length=500)


_lock = threading.Lock()
_bot = None
_expires_at = 0.0


def get_bot(force: bool = False):
    global _bot, _expires_at
    with _lock:
        if force or _bot is None or time.monotonic() >= _expires_at:
            candidate = Bot(load_articles())
            _bot = candidate
            _expires_at = time.monotonic() + 30
        return _bot


@app.get("/health")
def health():
    return {"status": "ok", "mode": "retrieval"}


@app.post("/chat", dependencies=[Depends(authenticate)])
def chat(body: ChatRequest):
    try:
        bot = Bot(parse_articles([a.model_dump() for a in body.articles])) if body.articles is not None else get_bot()
        return bot.reply(body.message, human_active=body.human_active).to_dict()
    except Exception:
        logger.exception("No se pudo procesar la consulta")
        raise HTTPException(503, "Asistente temporalmente no disponible") from None


@app.post("/knowledge/reload", dependencies=[Depends(authenticate)])
def reload_knowledge():
    # Validar primero: una configuración rota no sustituye el índice funcional.
    try:
        bot = get_bot(force=True)
    except Exception:
        logger.exception("No se pudo cargar la base de conocimiento")
        raise HTTPException(503, "Base de conocimiento no disponible") from None
    # Otras instancias/funciones renuevan su caché en un máximo de 30 segundos.
    return {"loaded": len({a.id for a, _, _ in bot.retriever.documents})}
