# Conexión WhatsApp de PHALAY

Estado: implementación preparada en código. No se aplicó SQL a Supabase, no se desplegó,
no se enviaron mensajes reales y no se activó un scheduler. Se conecta un número por
instalación de la API; la bandeja no es todavía multiempresa ni multicuenta.

## 1. Base de datos

Aplicar `backend/database/whatsapp.sql` en Supabase SQL Editor, antes de habilitar el
webhook. Se crean conversaciones, mensajes e índices con RLS sin acceso anon/authenticated.
No se borra información. Los modelos también están en Prisma para que `db:sync` no interprete
esas tablas como ajenas al proyecto. La cuenta de conexión del servidor necesita permisos
de lectura/escritura; no exponer sus credenciales a clientes.

## 2. Variables del proyecto API en Vercel

| Variable | De dónde obtenerla |
| --- | --- |
| WHATSAPP_PHONE_NUMBER_ID | «Identificador de número de teléfono» en Configuración de la API de Meta. NO es el número +51 ni el WABA ID. |
| WHATSAPP_ACCESS_TOKEN | Token temporal generado en Meta para la primera prueba; sustituir por credencial de producción antes de clientes reales. |
| WHATSAPP_APP_SECRET | Secreto de la app PHALAY Atención, en su configuración básica. No es el token de acceso. |
| WHATSAPP_VERIFY_TOKEN | Secreto aleatorio propio de 32+ caracteres. Se escribe igual en Meta y en Vercel. |
| WHATSAPP_GRAPH_VERSION | Versión que aparece en el ejemplo de Meta, como `v25.0`. |
| WHATSAPP_BOT_ENABLED | Mantener `false` durante configuración; `true` sólo después de probar recepción y conocimiento. |
| CRON_SECRET | Otro secreto aleatorio de 32+ caracteres para autenticar el worker. |
| CHATBOT_SERVICE_URL / CHATBOT_API_KEY | URL HTTPS y secreto del motor Python. Son necesarios para respuestas del bot, no para recibir ni responder manualmente. |

En local, `node scripts/prepare-whatsapp-env.cjs` genera verify token y cron secret en
`backend/api/.env.local` sin imprimirlos. No reemplaza secretos ya definidos con contenido.
Copiar los valores correspondientes a Vercel mediante su interfaz de variables privadas;
nunca enviarlos en capturas o chat, ni usar NEXT_PUBLIC_. Reiniciar API local o redesplegar API.

## 3. Configuración del webhook en Meta

La URL es la del **backend NestJS**, con esta ruta:

```text
https://TU-API.vercel.app/api/v1/whatsapp/webhook
```

Pegar como token de verificación exactamente `WHATSAPP_VERIFY_TOKEN`. Pulsar «Verificar y
guardar», y después suscribirse al campo `messages` de WhatsApp Business Account.
No activar certificado de cliente: esta implementación valida la firma HMAC de Meta sobre
los bytes originales de cada POST. Probar primero el webhook desde el panel de Meta y luego
un mensaje real al número de prueba autorizado. Respetar las condiciones de modo de app
que Meta muestre: si indica que requiere publicar para eventos reales, completarlo antes.

GET valida `hub.mode`, `hub.verify_token` y devuelve `hub.challenge` como texto sin JSON.
POST valida `X-Hub-Signature-256` con WHATSAPP_APP_SECRET, acepta sólo el phone ID configurado,
guarda mensajes y responde sin esperar a la IA. Notificaciones de estado se reconocen pero
todavía no actualizan entregado/leído. Textos vacíos, de más de 2000 caracteres y adjuntos
requieren atención humana; no se descargan imágenes/audio.

## 4. Primera prueba y bandeja

Abrir Configuración → WhatsApp (`/whatsapp`) con ADMIN o SUPER_ADMIN. El resumen muestra
si hay variables y tablas; no certifica que las credenciales sean válidas. Pulsar Actualizar
para leer los últimos 100 chats y últimos 100 mensajes del chat seleccionado. No hay
suscripción en tiempo real en esta primera versión.

1. Con bot desactivado, recibir un mensaje y comprobarlo en la bandeja.
2. Pulsar Tomar conversación y responder manualmente. El backend valida quién la tomó y
   el plazo de 24 horas. «Aceptado por Meta» no implica entregado o leído.
3. Probar `/chatbot` con FAQs reales activas y el servicio Python desplegado.
4. Habilitar WHATSAPP_BOT_ENABLED=true. Devolver la conversación al bot y enviar un mensaje
   **nuevo**. Los mensajes anteriores no se reproducen al devolver al bot.
5. Como SUPER_ADMIN, usar «Procesar un pendiente» para probar el worker. Cada invocación
   procesa un solo mensaje. Si no conoce la respuesta, marca «Espera vendedor».

Un fallo de IA pasa a revisión y pausa la conversación. Un envío con timeout/error de Meta
queda UNKNOWN: revisar recepción antes de repetirlo. No reintentar automáticamente mensajes
SENDING/UNKNOWN/REVIEW. Evita duplicados a costa de requerir revisión si hay incertidumbre.
Si el proceso cae, su concesión vence tras 90 segundos; un envío renueva a 45 segundos.
El siguiente worker marca trabajos interrumpidos para revisión. El bot y vendedor usan el
mismo bloqueo en BD. No se promete entrega exactamente una vez ante fallos distribuidos.

## 5. Atención automática sin mantener abierto el panel

Hace falta un scheduler que invoque periódicamente:

```text
GET https://TU-API.vercel.app/api/v1/whatsapp/process
Authorization: Bearer VALOR_DE_CRON_SECRET
```

Usar un scheduler de servidor, por ejemplo Supabase Cron o Vercel Cron compatible con el plan.
Configurar una duración máxima de función de al menos 35 segundos para el worker; ajustar
a los límites del plan. La API de recepción no espera ese procesamiento.
No llamar a este endpoint desde el navegador ni poner el secreto en URLs. No se creó ningún
cron automáticamente. Un cron por minuto tiene una capacidad inicial de un pendiente/minuto
y agrega espera; para mayor volumen o menor latencia migrar a un consumidor de cola continuo.
No se usa trabajo «fire and forget» después de responder en Vercel.

El prototipo permite atención con cuentas ADMIN/SUPER_ADMIN existentes. No incorpora un nuevo
rol de vendedor. Tampoco envía campañas, plantillas fuera de ventana, historial del WhatsApp
anterior a la conexión ni sincronización con WhatsApp Web. Antes de vincular el número comercial,
comprobar elegibilidad de coexistencia/migración y completar las exigencias de Meta.

Referencias primarias:
- https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/
- https://business.whatsapp.com/policy
- https://vercel.com/docs/cron-jobs/usage-and-pricing
