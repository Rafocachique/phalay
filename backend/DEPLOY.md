# Backend independiente en Vercel

La API NestJS se despliega como un tercer proyecto Vercel del mismo repositorio.
La tienda y el panel conservan sus propios proyectos. Render no es necesario.

## API

1. Importar el repositorio en Vercel y seleccionar Root Directory `backend/api`.
2. Activar la inclusión de archivos fuera del Root Directory: Prisma utiliza
   `backend/database/prisma/schema.prisma`.
3. Seleccionar NestJS como framework y Node.js 22.x. El build definido en
   `vercel.json` genera Prisma y compila la API.
4. Configurar las variables de `api/.env.example` en Vercel. Usar el pooler de
   Supabase para `DATABASE_URL` y la conexión directa para `DIRECT_URL`.
   `CORS_ALLOWED_ORIGINS` debe contener las URLs exactas de tienda y panel,
   separadas por coma. No configurar credenciales SEED_ADMIN en producción.
5. Antes de desplegar, aplicar `database/payment-gateway-unique.sql` en la BD.
   Si falla por duplicados, revisarlos; no borrarlos automáticamente.
6. Desplegar y comprobar `https://TU-API.vercel.app/api/v1/health`.

## Tienda y panel

- Root Directory de tienda: `frontend/web`; panel: `frontend/admin`.
- En ambos: `NEXT_PUBLIC_API_URL=https://TU-API.vercel.app/api/v1`.
- En la tienda: `BACKEND_API_URL=https://TU-API.vercel.app/api/v1` para el proxy
  de compatibilidad `/api/v1/*`. Nunca apuntarlo a la propia tienda.
- Volver a desplegar ambos después de modificar variables públicas.
- La tienda todavía utiliza servicios de lectura de PostgreSQL durante el
  renderizado; conserva sus variables Supabase y de base de datos.

## Culqi

Configurar el evento `order.status.changed` hacia
`https://TU-API.vercel.app/api/v1/payments/webhook?secret=TU_SECRETO`.
El secreto debe coincidir con `CULQI_WEBHOOK_SECRET` del backend.
El servidor consulta a Culqi y comprueba importe y moneda antes de confirmar.
Los eventos repetidos no duplican la confirmación. El índice único impide
asociar el mismo pago a dos pedidos.

Probar en modo test: tarjeta, Yape, webhook repetido, rechazo, carrito con
cantidad negativa, dos compras de la última unidad y dos cuentas consultando
sus pedidos. No se realizan cobros reales como parte de las pruebas locales.

## Desarrollo

Desde la raíz: `pnpm install`, `pnpm db:generate`, `pnpm dev:api`.
La API usa el puerto 4000; tienda 3000 y panel 3001.
La API también acepta `PORT` si el proveedor lo inyecta.
