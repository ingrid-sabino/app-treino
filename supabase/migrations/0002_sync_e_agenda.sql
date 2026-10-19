-- app-treino · 0002: base de sincronização e Agenda da Rotação
-- Rode no SQL Editor do Supabase depois da 0001.
--
-- 1. updated_at + deleted_at em todas as tabelas que sincronizam com o Dexie (FR-7, FR-8).
--    deleted_at é remoção lógica: apagar uma Série offline chega ao Supabase como
--    uma linha com deleted_at preenchido, em vez de sumir sem aviso.
-- 2. Dias de treino na Rotação (FR-34) e Ocorrências da Rotação (FR-2, FR-35):
--    pular e mudar o dia de um treino.

-- ---------------------------------------------------------------------------
-- 1. updated_at e deleted_at
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column updated_at timestamptz not null default now();

alter table public.exercises
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.templates
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.template_exercises
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.rotations
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.rotation_items
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.sessions
  add column deleted_at timestamptz; -- updated_at já existe desde a 0001

alter table public.sets
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.cardio_details
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.body_logs
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

alter table public.progress_photos
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz;

-- Mesma função da 0001 (touch_updated_at) em todas as tabelas
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger exercises_touch before update on public.exercises
  for each row execute function public.touch_updated_at();
create trigger templates_touch before update on public.templates
  for each row execute function public.touch_updated_at();
create trigger template_exercises_touch before update on public.template_exercises
  for each row execute function public.touch_updated_at();
create trigger rotations_touch before update on public.rotations
  for each row execute function public.touch_updated_at();
create trigger rotation_items_touch before update on public.rotation_items
  for each row execute function public.touch_updated_at();
create trigger sets_touch before update on public.sets
  for each row execute function public.touch_updated_at();
create trigger cardio_details_touch before update on public.cardio_details
  for each row execute function public.touch_updated_at();
create trigger body_logs_touch before update on public.body_logs
  for each row execute function public.touch_updated_at();
create trigger progress_photos_touch before update on public.progress_photos
  for each row execute function public.touch_updated_at();

-- Índices para a sincronização buscar "o que mudou desde X"
create index exercises_updated_idx on public.exercises (owner_id, updated_at);
create index templates_updated_idx on public.templates (owner_id, updated_at);
create index rotations_updated_idx on public.rotations (owner_id, updated_at);
create index sessions_updated_idx on public.sessions (owner_id, updated_at);
create index body_logs_updated_idx on public.body_logs (owner_id, updated_at);
create index progress_photos_updated_idx on public.progress_photos (owner_id, updated_at);

-- Volume e reps ignoram Séries e Sessões removidas (FR-26)
create or replace view public.session_stats
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
left join public.sets st on st.session_id = s.id and st.deleted_at is null
where s.deleted_at is null
group by s.id;

-- ---------------------------------------------------------------------------
-- 2. Dias de treino (FR-34)
-- ---------------------------------------------------------------------------
-- Quantos treinos da Rotação cabem em cada dia da semana, de segunda [1] a domingo [7].
-- Ex.: '{1,1,0,1,1,2,0}' = seg, ter, qui e sex com 1 treino; sábado com 2; qua e dom livres.
alter table public.rotations
  add column weekly_slots smallint[] not null default '{1,1,1,1,1,0,0}'
    check (
      array_length(weekly_slots, 1) = 7
      and 0 <= all (weekly_slots)
      and 3 >= all (weekly_slots)
    );

-- ---------------------------------------------------------------------------
-- Ocorrências da Rotação (FR-2, FR-35)
-- ---------------------------------------------------------------------------
-- A Rotação é uma fila infinita: a ocorrência seq = n é o item (n mod nº de itens).
-- Só ocorrências com algo diferente do padrão viram linha aqui:
--   resolution = 'done'    → feita (session_id aponta a Sessão)
--   resolution = 'skipped' → pulada: sai da fila e o sucessor ocupa o lugar dela
--   planned_on preenchido  → movida para outro dia (o dia original fica livre)
create table public.rotation_occurrences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  rotation_id uuid not null references public.rotations (id) on delete cascade,
  seq integer not null check (seq >= 0),
  planned_on date,
  resolution text check (resolution in ('done', 'skipped')),
  resolved_on date,
  session_id uuid references public.sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (rotation_id, seq),
  check ((resolution is null) = (resolved_on is null))
);
create index rotation_occurrences_owner_idx on public.rotation_occurrences (owner_id, updated_at);

create trigger rotation_occurrences_touch before update on public.rotation_occurrences
  for each row execute function public.touch_updated_at();

alter table public.rotation_occurrences enable row level security;

create policy "dono" on public.rotation_occurrences
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
