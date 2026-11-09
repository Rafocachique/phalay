"""Búsqueda léxica TF-IDF con variantes aprobadas. No es un modelo generativo."""
import math
import re
import unicodedata
from collections import Counter
from .knowledge import Article

STOP = set("a al de del el la las los un una unos unas por para que me mi mis tu tus su sus y o es son se en con como cual cuales cuanto cuesta tienen tiene hay puedo puedes podrian quisiera quiero saber favor porfa hola buenos buenas dias tardes noches gracias".split())
STOP.update({"mandan", "enviame", "mandame", "muestrame", "ver"})
ALIASES = {"envian": "envio", "envios": "envio", "enviar": "envio",
           "mandar": "envio", "entregan": "envio", "entrega": "envio", "entregas": "envio",
           "catalogos": "catalogo", "horarios": "horario", "abren": "horario",
           "pagos": "pago", "pagar": "pago", "tallas": "talla", "cambios": "cambio",
           "devoluciones": "devolucion"}


def normalize(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", text.lower()) if not unicodedata.combining(c))


def tokens(text: str) -> list[str]:
    return [ALIASES.get(w, w) for w in re.findall(r"[a-z0-9]+", normalize(text)) if w not in STOP]


class Retriever:
    def __init__(self, articles: list[Article]):
        self.documents = [(a, q, tokens(q)) for a in articles for q in a.questions]
        counts = Counter(w for _, _, words in self.documents for w in set(words))
        self.idf = {w: math.log((1 + len(self.documents)) / (1 + n)) + 1 for w, n in counts.items()}

    def search(self, query: str) -> list[tuple[Article, float]]:
        words = tokens(query)
        if not words:
            return []
        def vector(items):
            return {w: n * self.idf.get(w, math.log(1 + len(self.documents)) + 1)
                    for w, n in Counter(items).items()}
        qv = vector(words)
        qnorm = math.sqrt(sum(v*v for v in qv.values()))
        scores = {}
        for article, _, doc in self.documents:
            dv = vector(doc)
            norm = math.sqrt(sum(v*v for v in dv.values()))
            score = sum(v * dv.get(w, 0) for w, v in qv.items()) / (qnorm * norm) if norm else 0
            previous = scores.get(article.id)
            if previous is None or score > previous[1]:
                scores[article.id] = (article, score)
        return sorted(scores.values(), key=lambda pair: pair[1], reverse=True)
