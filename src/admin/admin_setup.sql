-- ─── Columna suspended en profiles ────────────────────────────────────────────
alter table public.profiles add column if not exists suspended boolean default false;

-- ─── Columna is_admin en profiles ─────────────────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean default false;

-- ─── Marcar tu cuenta como admin (pon tu email) ───────────────────────────────
-- update public.profiles set is_admin = true where handle = 'tu_handle';
