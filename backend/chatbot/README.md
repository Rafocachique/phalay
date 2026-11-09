# PHALAY — Chatbot Python

Servicio independiente para recuperar respuestas aprobadas. Funciona sin GPU, API de IA,
Torch o acceso al equipo del trabajo. No entrena un modelo desde cero. Incluye un
experimento generativo opcional y separado en `models/`.

## Organización

```text
backend/chatbot/
  phalay_bot/       # Decisiones, recuperación, fuentes y API HTTP
  knowledge/       # Base editable JSON; artículos pendientes desactivados
  migrations/      # Tabla opcional Supabase, aislada de Prisma
  models/          # Experimento Qwen3-0.6B y sus dependencias, NO importado por el bot
  tests/           # Pruebas de recuperación, seguridad y contrato HTTP
  app.py           # Entrada FastAPI para Vercel/Uvicorn
```

La integración NestJS vive únicamente en `backend/api/src/modules/chatbot`.
La prueba del panel está en `/chatbot`; requiere sesión ADMIN o SUPER_ADMIN al consultar
la API. No se han cambiado los módulos de pedidos, productos, pagos o autenticación.

**La prueba integrada toma automáticamente las FAQs activas de la tabla existente `faqs`.**
Se administran desde Configuración → Preguntas Frecuentes. NestJS las consulta en Supabase
mediante Prisma y las envía al servicio Python por el canal autenticado. El navegador no puede
enviar artículos al endpoint de vista previa. No hace falta migración ni otra clave Supabase
en Python para esta modalidad. Se admiten hasta 500 FAQs de 500 caracteres por pregunta y
4000 por respuesta; si se exceden, el servicio falla sin publicar respuestas parciales.
JSON y la tabla opcional descritos abajo sirven para ejecutar el bot independientemente de PHALAY.

## Probar primero sin dependencias

Desde `backend/chatbot`, Python 3.11+:

```powershell
python -m phalay_bot "Qué vende PHALAY"
python -m phalay_bot
python -m unittest discover -s tests -v
```

Las pruebas HTTP requieren instalar las dependencias de pruebas descritas más abajo.
El ejemplo sólo tiene habilitada información general de PHALAY. No inventa tarifas,
horarios, stock o enlaces. Editar `knowledge/base.json`, reemplazar las respuestas de
ejemplo por información confirmada y cambiar `enabled` a `true` para habilitarlas.
Agregar distintas formas de preguntar a `questions`.

## Ejecutar el servicio local

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
# Generar un secreto y guardarlo en ambos servicios, sin publicarlo en Git:
python -c "import secrets; print(secrets.token_urlsafe(32))"
$env:CHATBOT_API_KEY = "TU_SECRETO_GENERADO"
.venv/Scripts/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Los comandos PowerShell usan variables de sesión. `.env.example` documenta las opciones;
el servicio no carga automáticamente un archivo `.env`. Uvicorn permite `--env-file .env`
si se instala `python-dotenv`. Linux: usar `.venv/bin/python` y `export VARIABLE=valor`.

En el entorno del backend NestJS:

```dotenv
CHATBOT_SERVICE_URL=http://localhost:8000
CHATBOT_API_KEY=EL_MISMO_SECRETO
```

Reiniciar NestJS. Entrar al panel con una cuenta administradora y abrir `/chatbot`.
La prueba usa `POST /api/v1/chatbot/preview`; nunca expone el secreto del servicio Python
al navegador. El guard existente valida sesión y rol; se conserva el rate limiting global.

## Desplegar en la infraestructura actual

Se puede crear un **proyecto Vercel adicional**, Root Directory `backend/chatbot`, usando
su soporte FastAPI. No cambiar los tres proyectos actuales. Entrada `app.py`, dependencias
`requirements.txt`. `.vercelignore` excluye experimentos y pesos. No se ha desplegado ni
creado ningún proyecto automáticamente.

1. Configurar `CHATBOT_API_KEY` en el proyecto Python.
2. En la integración PHALAY no configurar una fuente adicional: las FAQs se envían en cada
   consulta desde NestJS. Si se usa Python por separado, para JSON los cambios se publican
   al redesplegar. Para una base independiente editable sin despliegue,
   ejecutar manualmente `migrations/001_knowledge.sql` en Supabase y configurar
   `CHATBOT_KNOWLEDGE_SOURCE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y
   `CHATBOT_STORE_ID`. Usar el identificador real de la tienda.
3. Cargar artículos mediante el SQL Editor/Table Editor de Supabase. `questions` es un array
   JSON de preguntas. `enabled` comienza en false. El bot tiene acceso de lectura, no CRUD.
4. Configurar en el proyecto de la API NestJS `CHATBOT_SERVICE_URL=https://TU-BOT.vercel.app`
   y el mismo secreto. Volver a desplegar la API y el panel.
5. Comprobar `/health` y probar `/chatbot` con sesión administradora.

No poner secretos en variables `NEXT_PUBLIC_`. La tabla tiene RLS sin políticas para
clientes y se filtra por tienda del servicio, nunca por una tienda enviada desde el cliente.
Para tiendas independientes, usar instancias/configuraciones separadas. La vista previa actual
es para administradores de la instalación; no es una bandeja multiempresa con aislamiento por usuario.
La caché de artículos dura 30 segundos por instancia. `POST /knowledge/reload`, con el secreto,
recarga la instancia que recibe la petición; las demás se renuevan al vencer su caché.
La infraestructura sigue sujeta a cuotas del plan: no se promete servicio ilimitado gratuito.

## Contrato y límites

`POST /chat` necesita `Authorization: Bearer SECRETO`. Cuerpo:

```json
{"message":"Qué vende PHALAY","human_active":false}
```

Devuelve `answer`, `action`, `reason`, `sources`, `suggestions`, `similarity`.
Acciones: `answer`, `clarify`, `handoff`, `paused`. `similarity` es un valor de búsqueda,
no una probabilidad de veracidad. El umbral inicial necesita evaluación con consultas reales.
El motor es TF-IDF léxico con normalización y algunos sinónimos españoles, no un LLM.
Preguntas complejas, errores ortográficos y contexto entre mensajes pueden requerir un vendedor.

`handoff` **solicita** derivación: todavía no asigna vendedor ni guarda una conversación.
`human_active` lo debe establecer el backend del canal a partir de estado persistido, nunca
confiando en un cliente público. Este prototipo es sin estado y no conserva mensajes ni datos
personales. No conecta aún WhatsApp, consulta stock en vivo ni atiende pedidos privados.
No abrir `/chat` al navegador: sólo al backend autenticado. Antes de habilitar un canal público,
agregar verificación de webhooks, rate limiting en el ingreso, persistencia de asignaciones,
idempotencia y exclusión mutua entre vendedor y bot. No integrar la generación experimental
sin evaluar su calidad; los borradores no tienen garantía de fidelidad.

## Pruebas HTTP

```powershell
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m unittest discover -s tests -v
```

Fuentes: [FastAPI en Vercel](https://vercel.com/docs/frameworks/backend/fastapi),
[Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B),
[Sentence Transformers multilingüe](https://sbert.net/docs/sentence_transformer/pretrained_models.html).
La investigación y el ensayo generativo están documentados en `models/README.md`.
