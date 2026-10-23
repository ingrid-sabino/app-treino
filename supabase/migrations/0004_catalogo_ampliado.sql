-- Catálogo ampliado: Exercícios comuns de academia que faltavam no catálogo inicial (0001).
-- Globais (owner_id nulo), leitura para qualquer pessoa logada pela RLS já existente.
-- Idempotente: não duplica se um Exercício global com o mesmo nome já existir.

insert into public.exercises (name, muscle_group, equipment, default_rest_seconds)
select v.name, v.muscle_group, v.equipment, v.default_rest_seconds
from (values
  ('Supino inclinado com barra', 'peito', 'barra', 120),
  ('Supino declinado', 'peito', 'barra', 120),
  ('Supino reto com halteres', 'peito', 'halteres', 90),
  ('Crucifixo com halteres', 'peito', 'halteres', 60),
  ('Crossover', 'peito', 'polia', 60),
  ('Flexão de braço', 'peito', 'peso corporal', 90),
  ('Desenvolvimento com halteres', 'ombros', 'halteres', 90),
  ('Elevação frontal', 'ombros', 'halteres', 60),
  ('Crucifixo invertido', 'ombros', 'halteres', 60),
  ('Remada alta', 'ombros', 'barra', 90),
  ('Encolhimento', 'ombros', 'halteres', 60),
  ('Face pull', 'ombros', 'polia', 60),
  ('Remada unilateral com halter', 'costas', 'halter', 90),
  ('Pulldown com braços estendidos', 'costas', 'polia', 90),
  ('Remada cavalinho', 'costas', 'barra', 120),
  ('Hiperextensão lombar', 'costas', 'banco', 90),
  ('Rosca alternada', 'bíceps', 'halteres', 60),
  ('Rosca Scott', 'bíceps', 'barra', 60),
  ('Rosca na polia', 'bíceps', 'polia', 60),
  ('Rosca concentrada', 'bíceps', 'halter', 60),
  ('Tríceps testa', 'tríceps', 'barra', 60),
  ('Tríceps corda', 'tríceps', 'polia', 60),
  ('Mergulho no banco', 'tríceps', 'peso corporal', 90),
  ('Mergulho nas paralelas', 'tríceps', 'peso corporal', 120),
  ('Tríceps coice', 'tríceps', 'halter', 60),
  ('Supino fechado', 'tríceps', 'barra', 120),
  ('Agachamento sumô', 'pernas', 'halter', 90),
  ('Agachamento búlgaro', 'pernas', 'halteres', 120),
  ('Afundo', 'pernas', 'halteres', 90),
  ('Agachamento hack', 'pernas', 'máquina', 120),
  ('Agachamento goblet', 'pernas', 'halter', 90),
  ('Agachamento no Smith', 'pernas', 'máquina', 120),
  ('Cadeira adutora', 'pernas', 'máquina', 60),
  ('Cadeira abdutora', 'glúteos', 'máquina', 60),
  ('Subida no banco', 'pernas', 'halteres', 90),
  ('Cadeira flexora', 'posterior', 'máquina', 90),
  ('Bom dia', 'posterior', 'barra', 120),
  ('Glúteo na polia', 'glúteos', 'polia', 60),
  ('Ponte de glúteo', 'glúteos', 'peso corporal', 90),
  ('Panturrilha sentada', 'panturrilhas', 'máquina', 60),
  ('Panturrilha no leg press', 'panturrilhas', 'máquina', 60),
  ('Abdominal supra', 'core', 'peso corporal', 60),
  ('Abdominal infra', 'core', 'peso corporal', 60),
  ('Elevação de pernas na barra', 'core', 'peso corporal', 60),
  ('Prancha lateral', 'core', 'peso corporal', 60),
  ('Abdominal oblíquo', 'core', 'halter', 60),
  ('Abdominal na polia', 'core', 'polia', 60),
  ('Roda abdominal', 'core', 'roda', 60),
  ('Escalador', 'core', 'peso corporal', 60)
) as v (name, muscle_group, equipment, default_rest_seconds)
where not exists (
  select 1 from public.exercises e where e.owner_id is null and e.name = v.name
);
