# PHALAY - Plataforma SaaS E-commerce de Moda Femenina

PHALAY es una plataforma de comercio electrónico SaaS premium y moderna, diseñada específicamente para el sector de moda femenina de alta costura. Cuenta con una arquitectura monorepo robusta, un portal web enfocado en la experiencia del cliente y un completo panel administrativo para el control estratégico del negocio.

---

## 🚀 Arquitectura y Tecnologías

El proyecto está construido bajo una arquitectura de monorepo gestionada con **Turborepo** y **pnpm workspaces**:

* **Storefront Client (`apps/web`):** Aplicación en **Next.js (App Router)** orientada al cliente. Utiliza traducciones con `next-intl` y un diseño minimalista de alto contraste inspirado en las principales firmas de moda internacional.
* **Portal de Administración (`apps/admin`):** Panel de control en **Next.js (App Router)** para la gestión de productos, colecciones, pedidos, estadísticas comerciales y mantenimiento de usuarios.
* **Backend API (`apps/api`):** Servicio REST construido sobre **NestJS** que expone endpoints seguros y eficientes.
* **Base de Datos & Auth (`packages/database`):** Modelado con **Prisma ORM** sobre una base de datos **PostgreSQL** alojada en **Supabase**, utilizando además **Supabase Auth** para el flujo seguro de sesiones y usuarios.

---

## ✨ Características Principales

### 🛍️ Experiencia del Cliente (Storefront)
* **Diseño Edge-to-Edge:** Pantalla de inicio a lo ancho completo sin restricciones de grilla que maximiza el impacto visual de los banners y colecciones.
* **Carrusel de Tiras Giratorias (Marquee):** Cinta de anuncios dinámicos infinitos de novedades y políticas de la marca.
* **Nuestra Selección / Novedades:** Visualización tipo grilla de retratos de moda (`aspect-[3/4]`) con un **selector de tallas interactivo en hover** para una preselección ágil sin salir del inicio.
* **Flujo de Autenticación Premium:** Formularios de inicio de sesión y registro de usuario con la integración del botón de inicio de sesión con Google ordenado al pie para mejor conversión.

### 📊 Panel de Administración (Analytics & Gestión)
* **KPis de Conversión Avanzados:** Métrica de ratio de conversión global de clientes registrados a compradores reales (ej: *"3 de 5 clientes"*).
* **Ticket Promedio y Conversiones con Tendencia:** Comparativas automáticas porcentuales contra el mes pasado (ej. `↑ 4% vs mes pasado`) para evaluar el rendimiento de las campañas.
* **Gráficos Interactivos de Ingresos:** Gráficos de barras interactivos que permiten alternar al instante entre vista **Mensual** (últimos 7 meses) y **Anual** (últimos 5 años), con soporte para meses sin ventas (altura 0%) y globos de valor al hover.
* **Preferencias de Clientes (BI):** Módulo de estadísticas comerciales automáticas que agrupa ventas para mostrar el **Top 3 de Colores Preferidos**, **Tallas más Vendidas** y **Categorías/Colecciones Destacadas**.
* **Gestión de Despachos:** Gráfico SVG de anillo de progreso circular para pedidos entregados y barras de progreso detalladas por estados (Pendientes, En Preparación, Enviados, Cancelados).
* **Limpieza Segura de Datos (Eliminar Pedidos):** Sistema transaccional en cascada que permite a los administradores limpiar pedidos falsos o de prueba borrando registros huérfanos sin romper la integridad referencial.

### 🔒 Seguridad y WAF (Capa 7)
* **Protección contra ataques de denegación:** Rate limiting integrado en endpoints críticos del backend.
* **Cabeceras de Seguridad:** Configuración robusta de Content Security Policy (CSP), CORS restringido a dominios de producción y bloqueo de scripts externos no autorizados.
* **Hash de Contraseñas & Doble Verificación:** Almacenamiento seguro y flujos de verificación mediante códigos únicos.

---

## 🛠️ Instalación y Configuración Local

### Requisitos Previos
* Node.js >= 20.0.0
* pnpm >= 9.0.0
* Cuenta activa en Supabase (PostgreSQL y Auth)
* Token de Resend (para el envío de correos)

### Pasos para iniciar el proyecto

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/phalay.git
   cd phalay
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` en la raíz y en cada aplicación (`apps/web`, `apps/admin`, `apps/api`), llénalos con tus credenciales reales:
   ```bash
   cp .env.example .env
   ```

3. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

4. **Preparar y Sembrar la Base de Datos (Prisma):**
   ```bash
   pnpm db:generate  # Genera el cliente de Prisma
   pnpm db:push      # Sube el esquema actual a Supabase
   pnpm db:seed      # Siembra datos iniciales de prueba (categorías, etc.)
   ```

5. **Iniciar el entorno de desarrollo:**
   ```bash
   pnpm dev
   ```
   * La tienda del cliente correrá en: `http://localhost:3000`
   * El panel de administración correrá en: `http://localhost:3001`
   * El servidor API NestJS correrá en: `http://localhost:4000`

---

## 📝 Licencia
Este proyecto es de código cerrado y de uso exclusivo comercial de la marca PHALAY.
