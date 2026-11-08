# PHALAY

Plataforma de comercio electrónico de moda con tienda pública, panel de administración y API independiente.

## Arquitectura

- `frontend/web`: tienda del cliente en Next.js.
- `frontend/admin`: panel de administración en Next.js.
- `backend/api`: API NestJS.
- `backend/database`: esquema Prisma para PostgreSQL/Supabase.

## Desarrollo local

1. Copia `.env.example` como `.env` y completa las variables sólo en tu equipo.
2. Instala dependencias con `pnpm install`.
3. Genera Prisma con `pnpm db:generate`.
4. Inicia los servicios con `pnpm dev`.

Puertos locales: tienda `3000`, administración `3001`, API `4000`.

## Seguridad

- No guardes llaves, contraseñas ni contenido de correos en este repositorio.
- Las variables privadas pertenecen únicamente a los entornos de servidor.
- La clave pública de Supabase y la llave pública de Culqi pueden ser usadas por el navegador cuando corresponda; las claves privadas nunca.
- Las tablas de negocio de Supabase usan RLS y se acceden por la API autenticada.

## Despliegue

Tienda, panel y API se despliegan como tres proyectos Vercel. Consulta [backend/DEPLOY.md](backend/DEPLOY.md) antes de publicar.

## Licencia

Código cerrado y de uso comercial exclusivo de PHALAY.
