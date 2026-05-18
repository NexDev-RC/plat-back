-- ============================================================
-- Migración: Soft delete para usuarios
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna deleted_at a la tabla users
alter table public.users
add column if not exists deleted_at timestamptz;

-- 2. Índice para consultas que filtran por deleted_at
create index if not exists idx_users_deleted_at on public.users(deleted_at)
where deleted_at is null;

-- 3. Actualizar políticas RLS para excluir usuarios eliminados
drop policy if exists "users_select_public" on public.users;
create policy "users_select_public" on public.users
  for select using (deleted_at is null);

-- 4. Política de actualización: solo el propio usuario (no eliminado)
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id and deleted_at is null);
