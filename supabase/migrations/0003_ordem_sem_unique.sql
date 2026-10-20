-- app-treino · 0003: ordem de Exercícios e itens da Rotação sem unique
-- Rode no SQL Editor do Supabase depois da 0002.
--
-- Reordenar troca as posições entre linhas, e um item removido (deleted_at)
-- continua com a posição dele. Com unique (pai, position), a sincronização
-- do Dexie falharia nesses casos. A ordem continua vindo de position.

alter table public.template_exercises
  drop constraint if exists template_exercises_template_id_position_key;

alter table public.rotation_items
  drop constraint if exists rotation_items_rotation_id_position_key;

create index if not exists template_exercises_template_idx on public.template_exercises (template_id, position);
create index if not exists rotation_items_rotation_idx on public.rotation_items (rotation_id, position);
