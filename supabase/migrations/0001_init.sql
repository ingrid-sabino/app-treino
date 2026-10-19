-- app-treino · schema inicial do MVP (PRD §7)
-- Rode no SQL Editor do Supabase ou com `supabase db push`.
-- IDs são uuid e podem ser gerados no app (Dexie) para funcionar offline.

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  hormone_tracking_enabled boolean not null default false, -- PRD §8: oculto por padrão
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente no primeiro login
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catálogo de Exercícios (owner_id nulo = catálogo global)
-- ---------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  equipment text,
  default_rest_seconds integer not null default 90,
  created_at timestamptz not null default now()
);
create index exercises_owner_idx on public.exercises (owner_id);

-- ---------------------------------------------------------------------------
-- Templates, Rotações e Programas
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  modality text not null default 'strength'
    check (modality in ('strength', 'run', 'ride', 'yoga', 'other')),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index templates_owner_idx on public.templates (owner_id);

create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null,
  target_sets integer not null default 3,
  target_reps text not null default '8-12', -- texto para aceitar faixas
  target_weight_kg numeric(6, 2),
  rest_seconds integer,
  unique (template_id, position)
);

create table public.rotations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  source text not null default 'manual' check (source in ('manual', 'ai_import', 'preset')),
  program_meta jsonb, -- objetivo, nível, semanas e o JSON original do Programa importado
  starts_on date not null default current_date,
  is_active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
-- Só uma Rotação ativa por pessoa (FR-13)
create unique index rotations_one_active_idx on public.rotations (owner_id) where is_active;

create table public.rotation_items (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null references public.rotations (id) on delete cascade,
  position integer not null,
  template_id uuid references public.templates (id),
  modality text not null default 'strength'
    check (modality in ('strength', 'run', 'ride', 'yoga', 'other')),
  label text not null, -- ex.: "Treino A", "Corrida leve 5 km"
  unique (rotation_id, position)
);

-- ---------------------------------------------------------------------------
-- Sessões e Séries
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  rotation_item_id uuid references public.rotation_items (id) on delete set null,
  template_id uuid references public.templates (id) on delete set null,
  modality text not null
    check (modality in ('strength', 'run', 'ride', 'yoga', 'other')),
  started_at timestamptz not null, -- Duração sempre derivada daqui (FR-25)
  ended_at timestamptz,
  duration_seconds integer generated always as
    (extract(epoch from (ended_at - started_at))::integer) stored,
  effort smallint check (effort between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_owner_started_idx on public.sessions (owner_id, started_at desc);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  exercise_position integer not null,
  set_position integer not null,
  weight_kg numeric(6, 2),
  reps integer,
  rpe numeric(3, 1),
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  completed_at timestamptz
);
create index sets_session_idx on public.sets (session_id);
create index sets_exercise_idx on public.sets (exercise_id);

create table public.cardio_details (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  distance_km numeric(6, 2),
  moving_seconds integer,
  source text not null default 'manual' check (source in ('manual', 'strava')),
  external_id text -- id da atividade no Strava (v1.1), evita duplicar (FR-17)
);

-- Volume, reps e número de Séries por Sessão (FR-26, FR-27).
-- security_invoker faz a view respeitar a RLS de quem consulta.
create view public.session_stats
with (security_invoker = true) as
select
  s.id as session_id,
  s.owner_id,
  s.started_at,
  s.duration_seconds,
  coalesce(sum(st.weight_kg * st.reps) filter (where st.status = 'done'), 0) as volume_kg,
  coalesce(sum(st.reps) filter (where st.status = 'done'), 0) as total_reps,
  count(st.id) filter (where st.status = 'done') as sets_done
from public.sessions s
left join public.sets st on st.session_id = s.id
group by s.id;

-- ---------------------------------------------------------------------------
-- Registro corporal
-- ---------------------------------------------------------------------------
create table public.body_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null default current_date,
  weight_kg numeric(5, 2),
  waist_cm numeric(5, 1),
  chest_cm numeric(5, 1),
  hip_cm numeric(5, 1),
  arm_cm numeric(5, 1),
  thigh_cm numeric(5, 1),
  notes text,
  created_at timestamptz not null default now()
);
create index body_logs_owner_idx on public.body_logs (owner_id, logged_on desc);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  body_log_id uuid references public.body_logs (id) on delete set null,
  storage_path text not null, -- {owner_id}/{arquivo} no bucket privado
  taken_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §8): cada pessoa só vê e altera o que é seu
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.rotations enable row level security;
alter table public.rotation_items enable row level security;
alter table public.sessions enable row level security;
alter table public.sets enable row level security;
alter table public.cardio_details enable row level security;
alter table public.body_logs enable row level security;
alter table public.progress_photos enable row level security;

create policy "perfil próprio" on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "catálogo global e exercícios próprios: leitura" on public.exercises
  for select using (owner_id is null or owner_id = (select auth.uid()));
create policy "exercícios próprios: escrita" on public.exercises
  for insert with check (owner_id = (select auth.uid()));
create policy "exercícios próprios: edição" on public.exercises
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "exercícios próprios: remoção" on public.exercises
  for delete using (owner_id = (select auth.uid()));

-- Tabelas com owner_id direto
create policy "dono" on public.templates
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dono" on public.rotations
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dono" on public.sessions
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dono" on public.body_logs
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dono" on public.progress_photos
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Tabelas filhas: herdam o dono do pai
create policy "dono do template" on public.template_exercises
  for all using (exists (select 1 from public.templates t
                         where t.id = template_id and t.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.templates t
                      where t.id = template_id and t.owner_id = (select auth.uid())));

create policy "dono da rotação" on public.rotation_items
  for all using (exists (select 1 from public.rotations r
                         where r.id = rotation_id and r.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.rotations r
                      where r.id = rotation_id and r.owner_id = (select auth.uid())));

create policy "dono da sessão" on public.sets
  for all using (exists (select 1 from public.sessions s
                         where s.id = session_id and s.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.sessions s
                      where s.id = session_id and s.owner_id = (select auth.uid())));

create policy "dono da sessão" on public.cardio_details
  for all using (exists (select 1 from public.sessions s
                         where s.id = session_id and s.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.sessions s
                      where s.id = session_id and s.owner_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para Fotos de progresso (pasta = id da pessoa)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "fotos próprias" on storage.objects
  for all to authenticated
  using (bucket_id = 'progress-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'progress-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Catálogo inicial (pode crescer pela importação de Programas, FR-12)
-- ---------------------------------------------------------------------------
insert into public.exercises (name, muscle_group, equipment) values
  ('Supino reto', 'peito', 'barra'),
  ('Supino inclinado com halteres', 'peito', 'halteres'),
  ('Crucifixo na máquina', 'peito', 'máquina'),
  ('Desenvolvimento militar', 'ombros', 'barra'),
  ('Elevação lateral', 'ombros', 'halteres'),
  ('Barra fixa', 'costas', 'peso corporal'),
  ('Remada curvada', 'costas', 'barra'),
  ('Puxada frontal', 'costas', 'polia'),
  ('Remada baixa', 'costas', 'polia'),
  ('Rosca direta', 'bíceps', 'barra'),
  ('Rosca martelo', 'bíceps', 'halteres'),
  ('Tríceps na polia', 'tríceps', 'polia'),
  ('Tríceps francês', 'tríceps', 'halter'),
  ('Agachamento livre', 'pernas', 'barra'),
  ('Leg press 45°', 'pernas', 'máquina'),
  ('Levantamento terra', 'posterior', 'barra'),
  ('Stiff', 'posterior', 'barra'),
  ('Cadeira extensora', 'quadríceps', 'máquina'),
  ('Mesa flexora', 'posterior', 'máquina'),
  ('Elevação pélvica', 'glúteos', 'barra'),
  ('Panturrilha em pé', 'panturrilhas', 'máquina'),
  ('Prancha', 'core', 'peso corporal');
