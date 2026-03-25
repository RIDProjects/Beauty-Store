# 🌸 Vainy Bliss — eCommerce Femenino

Sistema completo de eCommerce para productos para mujeres, con panel admin, carrito de compras, checkout y notificaciones por WhatsApp.

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken + bcryptjs) |
| Estado global | Zustand |
| WhatsApp | Twilio API |
| Uploads | Multer |

---

## 🏗️ Estructura del Proyecto

```
femstore/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # Conexión PostgreSQL
│   │   ├── common/
│   │   │   ├── types.ts             # Interfaces TypeScript
│   │   │   ├── helpers.ts           # Utilidades (slugify, paginate, etc.)
│   │   │   └── guards/
│   │   │       └── auth.guard.ts    # Middlewares JWT
│   │   ├── database/
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql
│   │   └── modules/
│   │       ├── auth/                # Registro, login, perfil
│   │       ├── categories/          # CRUD categorías
│   │       ├── products/            # CRUD productos + imágenes
│   │       ├── orders/              # Creación y gestión de órdenes
│   │       └── whatsapp/            # Servicio de notificaciones
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx             # Home
    │   │   ├── layout.tsx           # Root layout
    │   │   ├── auth/
    │   │   │   ├── login/           # Página de login
    │   │   │   └── register/        # Página de registro
    │   │   ├── shop/
    │   │   │   ├── products/        # Listado y detalle de productos
    │   │   │   ├── cart/            # Carrito (drawer)
    │   │   │   ├── checkout/        # Proceso de compra
    │   │   │   └── orders/          # Mis pedidos
    │   │   └── admin/
    │   │       ├── layout.tsx       # Admin layout + sidebar
    │   │       ├── page.tsx         # Dashboard con métricas
    │   │       ├── products/        # CRUD productos + imágenes
    │   │       ├── orders/          # Gestión de pedidos
    │   │       └── categories/      # CRUD categorías
    │   ├── components/
    │   │   ├── layout/              # Header, AuthProvider
    │   │   └── shop/                # ProductCard, CartDrawer
    │   ├── store/
    │   │   ├── auth.store.ts        # Estado autenticación
    │   │   └── cart.store.ts        # Estado carrito (persistido)
    │   ├── lib/
    │   │   └── api.ts               # Axios configurado
    │   └── types/
    │       └── index.ts             # Tipos TypeScript
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

---

### 1. Clonar y preparar

```bash
# Entrar al proyecto
cd femstore
```

---

### 2. Configurar Base de Datos

```bash
# Crear la base de datos
createdb femstore

# Ejecutar el schema (crea tablas, índices, seeds)
psql femstore < backend/src/database/migrations/001_initial_schema.sql
```

Esto crea automáticamente:
- Tablas: `users`, `categories`, `products`, `product_images`, `orders`, `order_items`
- Usuario admin por defecto
- 5 categorías de ejemplo

---

### 3. Configurar Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
```

Edita `.env`:

```env
PORT=4000
NODE_ENV=development

# ─── Base de datos ────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=femstore
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui

# ─── JWT ─────────────────────────────────────────
JWT_SECRET=cambia_esto_por_algo_muy_secreto_en_produccion
JWT_EXPIRES_IN=7d

# ─── WhatsApp (Twilio) ────────────────────────────
# Crea una cuenta en https://www.twilio.com
# Activa el Sandbox de WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
VENDOR_WHATSAPP=whatsapp:+1TUNUMEROAQUI

# ─── Archivos ────────────────────────────────────
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# ─── CORS ────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
```

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

El backend estará disponible en: `http://localhost:4000`
Health check: `http://localhost:4000/health`

---

### 4. Configurar Frontend

```bash
cd ../frontend

# Copiar variables de entorno
cp .env.example .env
```

Edita `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

---

## 🔑 Credenciales por Defecto

| Campo | Valor |
|---|---|
| Email | `admin@femstore.com` |
| Contraseña | `Admin123!` |
| Rol | Administrador |

> ⚠️ **Cambia estas credenciales antes de subir a producción.**

Para cambiar la contraseña del admin, en la base de datos:
```sql
-- Genera un hash nuevo con bcrypt (12 rounds) y actualiza
UPDATE users SET password = 'nuevo_hash_bcrypt' WHERE email = 'admin@femstore.com';
```

---

## 📱 Configuración de WhatsApp (Twilio)

1. Crea cuenta gratuita en [twilio.com](https://www.twilio.com)
2. Ve a **Messaging > Try it out > Send a WhatsApp message**
3. Activa el sandbox escaneando el QR con tu WhatsApp
4. Copia tu `Account SID` y `Auth Token` del Dashboard
5. El número del sandbox es: `+14155238886`
6. Configura `VENDOR_WHATSAPP` con tu número (formato: `whatsapp:+1234567890`)

> **Nota:** En modo sandbox, el vendedor debe enviar primero el mensaje de activación al número de Twilio. Para producción se necesita aprobación de Meta Business.

**Sin Twilio configurado:** El sistema funciona igual pero los mensajes se loguean en la consola del backend en lugar de enviarse.

---

## 🌐 API Endpoints

### Autenticación
```
POST   /api/auth/register       Registro de usuario
POST   /api/auth/login          Login
GET    /api/auth/me             Perfil del usuario autenticado
PUT    /api/auth/profile        Actualizar perfil
```

### Categorías
```
GET    /api/categories          Listar categorías activas (público)
GET    /api/categories/admin    Listar todas (admin)
POST   /api/categories          Crear categoría (admin)
PUT    /api/categories/:id      Actualizar (admin)
PATCH  /api/categories/:id/toggle  Activar/desactivar (admin)
DELETE /api/categories/:id      Eliminar (admin)
```

### Productos
```
GET    /api/products            Listar productos activos (público)
GET    /api/products/admin      Listar todos (admin)
GET    /api/products/:id        Detalle de producto (público)
POST   /api/products            Crear producto (admin)
PUT    /api/products/:id        Actualizar (admin)
PATCH  /api/products/:id/toggle Activar/desactivar (admin)
DELETE /api/products/:id        Eliminar (admin)
POST   /api/products/:id/images Subir imagen (admin, multipart)
DELETE /api/products/:id/images/:imageId Eliminar imagen (admin)
```

### Órdenes
```
POST   /api/orders              Crear orden (auth opcional)
GET    /api/orders/my           Mis pedidos (cliente autenticado)
GET    /api/orders/stats        Estadísticas (admin)
GET    /api/orders              Listar todas (admin)
GET    /api/orders/:id          Detalle de orden
PATCH  /api/orders/:id/status   Actualizar estado (admin)
```

---

## 🔄 Flujo de Estados de Orden

```
pending → confirmed → processing → shipped → delivered
   ↓           ↓           ↓
cancelled   cancelled   cancelled
```

---

## 🎨 Funcionalidades Implementadas

### Tienda Pública
- ✅ Home con hero, categorías y productos destacados
- ✅ Listado de productos con filtros por categoría y búsqueda
- ✅ Paginación
- ✅ Página de detalle de producto con galería de imágenes
- ✅ Carrito persistido en localStorage (drawer lateral)
- ✅ Ajuste de cantidades en carrito
- ✅ Checkout con datos del cliente
- ✅ Selección de entrega (domicilio / retiro)
- ✅ Confirmación de pedido con resumen
- ✅ Mis pedidos (usuario autenticado)

### Autenticación
- ✅ Registro con nombre, email, contraseña, teléfono
- ✅ Login con JWT
- ✅ Persistencia de sesión (localStorage)
- ✅ Logout
- ✅ Pre-llenado de checkout con datos del usuario

### Admin Panel
- ✅ Dashboard con métricas (total pedidos, pendientes, ingresos, pedidos hoy)
- ✅ CRUD completo de productos con imágenes
- ✅ Upload de múltiples imágenes por producto
- ✅ Activar/desactivar productos
- ✅ CRUD completo de categorías
- ✅ Listado de pedidos con filtro por estado
- ✅ Expansión de detalle de pedido
- ✅ Cambio de estado de pedido
- ✅ Indicador de notificación WhatsApp enviada

### WhatsApp
- ✅ Notificación automática al crear una orden
- ✅ Formato de mensaje completo con todos los datos
- ✅ Modo simulado si Twilio no está configurado (logs en consola)

---

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev        # Desarrollo con hot-reload
npm run build      # Compilar TypeScript
npm run start      # Producción
npm run lint       # ESLint
```

### Frontend
```bash
npm run dev        # Desarrollo Next.js
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run lint       # ESLint
```

---

## 🚢 Despliegue en Producción

### Backend
```bash
npm run build
NODE_ENV=production npm start
```

Recuerda:
- Cambiar `JWT_SECRET` por una clave larga y aleatoria
- Configurar `FRONTEND_URL` con el dominio real
- Usar un servicio de almacenamiento de archivos (S3, Cloudinary) para imágenes en producción

### Frontend
```bash
npm run build
npm start
```

O despliega en **Vercel** con un click:
- Conecta el repositorio
- Configura `NEXT_PUBLIC_API_URL` como variable de entorno
- Deploy automático

---

## 📝 Decisiones de Arquitectura

| Decisión | Razonamiento |
|---|---|
| Express sobre NestJS | Menor overhead, más directo para este tamaño de proyecto |
| Zustand sobre Redux | API simple, sin boilerplate, soporte para `persist` |
| Carrito en localStorage | No requiere backend, se sincroniza automáticamente |
| Twilio sobre Meta API directa | Setup más rápido, sandbox gratuito para desarrollo |
| PostgreSQL con pg puro | Sin ORM para mayor control y performance |
| Next.js App Router | Server components para SEO en home/productos |

---

## 🔐 Seguridad Implementada

- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT con expiración configurable
- Helmet.js para headers HTTP seguros
- CORS configurado por dominio
- Validación de tipos de archivo en uploads
- Límite de tamaño de archivo (5MB)
- Sanitización de inputs en queries PostgreSQL (parameterized queries)

---

## 📞 Soporte

Para reportar bugs o solicitar features, documenta el problema con:
1. Pasos para reproducir
2. Comportamiento esperado vs actual
3. Logs del backend y frontend
