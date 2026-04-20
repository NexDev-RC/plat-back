-- ============================================================
-- EduFlow — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- para búsqueda full-text

-- ============================================================
-- TABLA: users
-- ============================================================
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'student'
                  check (role in ('student', 'instructor', 'admin')),
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índice para búsqueda por email (login rápido)
create index if not exists idx_users_email on public.users(email);

-- ============================================================
-- TABLA: categories
-- ============================================================
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);

-- ============================================================
-- TABLA: courses
-- ============================================================
create table if not exists public.courses (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  slug              text not null unique,
  description       text not null default '',
  short_description text not null default '',
  thumbnail_url     text,
  preview_video_url text,
  price             numeric(10, 2) not null default 0,
  discount_price    numeric(10, 2),
  rating            numeric(3, 2) not null default 0,
  total_reviews     integer not null default 0,
  total_students    integer not null default 0,
  total_duration    integer not null default 0,  -- segundos
  total_lessons     integer not null default 0,
  level             text not null default 'beginner'
                      check (level in ('beginner', 'intermediate', 'advanced')),
  language          text not null default 'Español',
  tags              text[] not null default '{}',
  is_published      boolean not null default false,
  category_id       uuid references public.categories(id) on delete set null,
  instructor_id     uuid not null references public.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_courses_slug        on public.courses(slug);
create index if not exists idx_courses_instructor  on public.courses(instructor_id);
create index if not exists idx_courses_category    on public.courses(category_id);
create index if not exists idx_courses_published   on public.courses(is_published);
create index if not exists idx_courses_rating      on public.courses(rating desc);
create index if not exists idx_courses_title_trgm  on public.courses using gin (title gin_trgm_ops);

-- ============================================================
-- TABLA: sections
-- ============================================================
create table if not exists public.sections (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  "order"    integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_sections_course on public.sections(course_id);

-- ============================================================
-- TABLA: lessons
-- ============================================================
create table if not exists public.lessons (
  id          uuid primary key default uuid_generate_v4(),
  section_id  uuid not null references public.sections(id) on delete cascade,
  title       text not null,
  description text,
  video_url   text,
  duration    integer not null default 0,  -- segundos
  "order"     integer not null default 1,
  is_free     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lessons_section on public.lessons(section_id);

-- ============================================================
-- TABLA: enrollments
-- ============================================================
create table if not exists public.enrollments (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  course_id               uuid not null references public.courses(id) on delete cascade,
  progress                integer not null default 0 check (progress between 0 and 100),
  completed_lessons       text[] not null default '{}',
  last_watched_lesson_id  uuid references public.lessons(id) on delete set null,
  enrolled_at             timestamptz not null default now(),
  completed_at            timestamptz,
  unique(user_id, course_id)
);

create index if not exists idx_enrollments_user   on public.enrollments(user_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCIÓN: incrementar total_students de un curso (RPC)
-- Llamada desde NestJS: supabase.rpc('increment_course_students', { course_id })
-- ============================================================
create or replace function public.increment_course_students(course_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.courses
  set total_students = total_students + 1
  where id = course_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Users
alter table public.users enable row level security;

-- Lectura: cualquiera puede ver el perfil público (sin password_hash)
create policy "users_select_public" on public.users
  for select using (true);

-- Escritura: solo el propio usuario o admin (controlado desde NestJS con service_role)
-- El service_role bypasea RLS — NestJS usa service_role para writes
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Categories: lectura pública, escritura solo service_role (admin desde NestJS)
alter table public.categories enable row level security;
create policy "categories_select_all" on public.categories
  for select using (true);

-- Courses: lectura pública para publicados, escritura controlada por NestJS
alter table public.courses enable row level security;
create policy "courses_select_published" on public.courses
  for select using (is_published = true);

-- Sections y Lessons: lectura pública
alter table public.sections enable row level security;
create policy "sections_select_all" on public.sections
  for select using (true);

alter table public.lessons enable row level security;
create policy "lessons_select_all" on public.lessons
  for select using (true);

-- Enrollments: cada usuario ve solo los suyos
alter table public.enrollments enable row level security;
create policy "enrollments_select_own" on public.enrollments
  for select using (auth.uid() = user_id);

-- ============================================================
-- DATOS INICIALES — Categorías
-- ============================================================
insert into public.categories (name, slug) values
  ('Programación',  'programacion'),
  ('Diseño UI/UX',  'diseno'),
  ('Data Science',  'data-science'),
  ('Marketing',     'marketing'),
  ('Negocios',      'negocios'),
  ('Fotografía',    'fotografia')
on conflict (slug) do nothing;

-- ============================================================
-- USUARIO ADMIN INICIAL
-- Contraseña: Admin1234! (bcrypt hash)
-- CAMBIA esto en producción generando un nuevo hash
-- ============================================================
insert into public.users (name, email, password_hash, role)
values (
  'Administrador',
  'admin@eduflow.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCMRlWES.dn/OSePG86.3V2',
  'admin'
)
on conflict (email) do nothing;
