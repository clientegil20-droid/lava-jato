-- Lava Jato Redenção - Schema Inicial
-- Agendamentos armazenados como JSONB (espelha a interface Appointment do app)
create table if not exists public.appointments (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'agendado',
  data jsonb not null
);

-- Configurações da loja (single row por chave)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_appointments_status on public.appointments (status);
create index if not exists idx_appointments_created on public.appointments (created_at);

-- RLS habilitado com políticas públicas (app sem autenticação)
alter table public.appointments enable row level security;
alter table public.settings enable row level security;

drop policy if exists "allow_all_appointments" on public.appointments;
create policy "allow_all_appointments"
  on public.appointments for all
  using (true)
  with check (true);

drop policy if exists "allow_all_settings" on public.settings;
create policy "allow_all_settings"
  on public.settings for all
  using (true)
  with check (true);
