"""Fuentes de conocimiento independientes de los canales y del motor de búsqueda."""
import json
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class Article:
    id: str
    title: str
    questions: tuple[str, ...]
    answer: str


def parse_articles(rows: list) -> list[Article]:
    if not isinstance(rows, list) or len(rows) > 1000:
        raise ValueError("La base debe ser una lista de hasta 1000 artículos")
    articles = []
    ids = set()
    for row in rows:
        if row.get("enabled", True) is not True:
            continue
        article_id, title, answer = (row.get(key) for key in ("id", "title", "answer"))
        questions = row.get("questions")
        if not all(isinstance(s, str) and s.strip() for s in (article_id, title, answer)):
            raise ValueError("Artículo sin id, título o respuesta")
        if article_id in ids or len(answer) > 4000:
            raise ValueError("ID repetido o respuesta demasiado larga")
        if not isinstance(questions, list) or not 1 <= len(questions) <= 30:
            raise ValueError("Cada artículo requiere entre 1 y 30 preguntas")
        if not all(isinstance(q, str) and 0 < len(q.strip()) <= 500 for q in questions):
            raise ValueError("Pregunta inválida")
        ids.add(article_id)
        articles.append(Article(article_id, title, tuple(questions), answer))
    return articles


def load_articles() -> list[Article]:
    source = os.environ.get("CHATBOT_KNOWLEDGE_SOURCE", "json")
    if source == "json":
        root = Path(__file__).resolve().parent.parent
        path = Path(os.environ.get("CHATBOT_KNOWLEDGE_FILE", "knowledge/base.json"))
        if not path.is_absolute():
            path = root / path
        return parse_articles(json.loads(path.read_text(encoding="utf-8")))
    if source != "supabase":
        raise ValueError("Fuente de conocimiento desconocida")
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    store = os.environ["CHATBOT_STORE_ID"]
    if not url.startswith("https://") or not store.strip():
        raise ValueError("Configura HTTPS y una tienda para Supabase")
    query = urlencode({"select": "id,title,questions,answer,enabled", "enabled": "eq.true",
                       "store_id": f"eq.{store}", "order": "id", "limit": "1001"})
    request = Request(f"{url}/rest/v1/chatbot_knowledge?{query}",
                      headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urlopen(request, timeout=8) as response:
        data = response.read(2_000_001)
    if len(data) > 2_000_000:
        raise ValueError("Base de conocimiento demasiado grande")
    return parse_articles(json.loads(data))
