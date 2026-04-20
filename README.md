# EduFlow API — Backend NestJS + Supabase

API REST para la plataforma de cursos EduFlow.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | NestJS 10 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT + bcrypt |
| Documentación | Swagger / OpenAPI |
| Validación | class-validator |

---

## Configuración inicial (paso a paso)

### 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto (ej: `eduflow`)
3. En **Settings → API** copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Crear las tablas en Supabase

1. Ve a **SQL Editor → New Query**
2. Pega el contenido de `supabase/schema.sql`
3. Ejecuta con **Run**

Esto crea:
- Tablas: `users`, `categories`, `courses`, `sections`, `lessons`, `enrollments`
- Índices para búsquedas rápidas
- Row Level Security (RLS)
- Función `increment_course_students`
- Categorías iniciales
- Usuario admin (`admin@eduflow.com` / `Admin1234!`)

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar variables de entorno

Edita el archivo `.env`:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

JWT_SECRET=una-cadena-muy-larga-y-segura-minimo-32-caracteres
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 5. Levantar el servidor

```bash
# Desarrollo (con hot reload)
npm run start:dev

# Producción
npm run build && npm run start:prod
```

La API estará en: `http://localhost:3001/api`
Swagger UI en:   `http://localhost:3001/api/docs`

---

## Endpoints

### Auth — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Registrar usuario |
| POST | `/auth/login` | Público | Iniciar sesión |
| GET | `/auth/me` | Autenticado | Ver perfil propio |
| POST | `/auth/logout` | Autenticado | Cerrar sesión |

### Users — `/api/users`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/users` | Admin | Listar todos los usuarios |
| GET | `/users/me` | Autenticado | Mi perfil |
| PATCH | `/users/me` | Autenticado | Actualizar mi perfil |
| GET | `/users/:id` | Admin | Ver usuario por ID |
| PATCH | `/users/:id/role` | Admin | Cambiar rol |
| DELETE | `/users/:id` | Admin | Eliminar usuario |

### Courses — `/api/courses`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/courses` | Público | Listar cursos con filtros |
| GET | `/courses/featured` | Público | Cursos destacados |
| GET | `/courses/:slug` | Público | Detalle de un curso |
| GET | `/courses/manage/my` | Instructor/Admin | Mis cursos |
| GET | `/courses/manage/:id` | Instructor/Admin | Curso sin importar estado |
| POST | `/courses` | Instructor/Admin | Crear curso |
| PATCH | `/courses/:id` | Instructor/Admin | Actualizar curso |
| PATCH | `/courses/:id/publish` | Instructor/Admin | Publicar/despublicar |
| DELETE | `/courses/:id` | Instructor/Admin | Eliminar curso |

#### Filtros disponibles en `GET /courses`:
```
?search=react
?level=beginner|intermediate|advanced
?categoryId=uuid
?minPrice=0&maxPrice=50
?sortBy=newest|popular|rating|price-asc|price-desc
?page=1&limit=12
```

### Categories — `/api/categories`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/categories` | Público | Listar categorías |
| POST | `/categories` | Admin | Crear categoría |
| DELETE | `/categories/:id` | Admin | Eliminar categoría |

### Enrollments — `/api/enrollments`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/enrollments/me` | Student/Admin | Mis inscripciones |
| GET | `/enrollments/:courseId` | Student/Admin | Progreso en un curso |
| POST | `/enrollments` | Student/Admin | Inscribirse en un curso |
| POST | `/enrollments/:courseId/complete-lesson` | Student/Admin | Completar lección |

---

## Autenticación

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <access_token>
```

El token se obtiene en `/auth/login` o `/auth/register`.

---

## Roles

| Rol | Descripción |
|---|---|
| `student` | Puede inscribirse y ver cursos |
| `instructor` | Puede crear y gestionar sus propios cursos |
| `admin` | Acceso total — gestiona usuarios, cursos y categorías |

---

## Estructura del proyecto

```
src/
├── main.ts                    # Bootstrap con guards globales
├── app.module.ts              # Módulo raíz
│
├── common/
│   ├── supabase/              # Cliente Supabase compartido
│   ├── decorators/
│   │   ├── current-user.ts    # @CurrentUser()
│   │   ├── public.ts          # @Public()
│   │   └── roles.ts           # @Roles('admin', ...)
│   ├── guards/
│   │   ├── jwt-auth.guard.ts  # Guard JWT global
│   │   └── roles.guard.ts     # Guard de roles
│   ├── filters/
│   │   └── all-exceptions.ts  # Errores consistentes
│   └── interceptors/
│       └── response.ts        # Wrapper { data, statusCode }
│
├── auth/                      # Login, registro, JWT
├── users/                     # Gestión de usuarios
├── courses/                   # CRUD de cursos
├── categories/                # Categorías
└── enrollments/               # Inscripciones y progreso
```

---

## Ejemplos de uso con curl

### Registrar usuario
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"password123","role":"student"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eduflow.com","password":"Admin1234!"}'
```

### Crear curso (como instructor)
```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primer curso",
    "description": "Descripción completa...",
    "shortDescription": "Descripción corta",
    "price": 29,
    "level": "beginner",
    "language": "Español",
    "categoryId": "<uuid-categoria>"
  }'
```

### Listar cursos con filtros
```bash
curl "http://localhost:3001/api/courses?level=beginner&sortBy=popular&page=1&limit=6"
```

---

## Integración con el frontend Next.js

El frontend en `eduflow/` ya tiene los servicios configurados en `src/services/`.
Solo necesitas asegurarte de que en el `.env.local` del frontend esté:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Los servicios del frontend llaman a:
- `POST /api/auth/login` → `auth.service.ts`
- `GET /api/courses` → `courses.service.ts`
- `GET /api/enrollments/me` → `enrollments.service.ts`
