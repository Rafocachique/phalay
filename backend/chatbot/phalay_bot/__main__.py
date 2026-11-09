import argparse
import json
from .engine import Bot
from .knowledge import load_articles

parser = argparse.ArgumentParser(description="Probar el bot PHALAY sin WhatsApp ni servidor")
parser.add_argument("message", nargs="?")
args = parser.parse_args()
bot = Bot(load_articles())
if args.message:
    print(json.dumps(bot.reply(args.message).to_dict(), ensure_ascii=False, indent=2))
else:
    print("PHALAY — escribe /salir para terminar")
    while True:
        try:
            message = input("Tú: ")
        except (EOFError, KeyboardInterrupt):
            break
        if message.strip() == "/salir":
            break
        try:
            result = bot.reply(message)
            print(f"Bot [{result.action}]: {result.answer}")
            if result.suggestions:
                print(" / ".join(result.suggestions))
        except ValueError as error:
            print(error)
