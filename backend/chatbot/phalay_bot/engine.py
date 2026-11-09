"""Decisiones del bot: contestar, aclarar o solicitar atención humana."""
from dataclasses import asdict, dataclass, field
import re
from .knowledge import Article
from .retrieval import Retriever, normalize


@dataclass
class BotReply:
    answer: str
    action: str
    reason: str
    sources: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    # Es similitud de búsqueda, nunca una probabilidad de veracidad.
    similarity: float = 0.0

    def to_dict(self):
        return asdict(self)


class Bot:
    def __init__(self, articles: list[Article]):
        self.retriever = Retriever(articles)

    def reply(self, message: str, *, human_active: bool = False) -> BotReply:
        if not isinstance(message, str) or not message.strip() or len(message) > 2000:
            raise ValueError("Escribe entre 1 y 2000 caracteres")
        if human_active:
            return BotReply("", "paused", "human_active")
        text = normalize(message)
        if re.search(r"\b(vendedor|vendedora|asesor|asesora|humano|humana|persona|reclamo|reclamar)\b", text):
            return BotReply("Gracias por escribirnos. Un integrante del equipo continuará con tu consulta.", "handoff", "human_requested")
        if re.fullmatch(r"[\s¡!¿?.,]*(hola|buenos dias|buenas tardes|buenas noches|buenas)[\s¡!¿?.,]*", text):
            return BotReply("¡Hola! Gracias por escribir a PHALAY. ¿Cómo podemos ayudarte?", "answer", "greeting")
        matches = self.retriever.search(message)
        if not matches or matches[0][1] < 0.66:
            return BotReply("Gracias por tu consulta. Un integrante del equipo la revisará para brindarte una respuesta precisa.", "handoff", "insufficient_knowledge")
        article, score = matches[0]
        if len(matches) > 1 and matches[1][1] >= 0.50 and score - matches[1][1] < 0.12:
            return BotReply("¿Sobre cuál de estos temas necesitas información?", "clarify", "ambiguous",
                            suggestions=[a.title for a, _ in matches[:2]], similarity=round(score, 3))
        return BotReply(article.answer, "answer", "knowledge_match", sources=[article.id], similarity=round(score, 3))
