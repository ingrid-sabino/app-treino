import { z } from 'zod'
import { ProgramSchema, LEVEL_LABEL, type Goal, type Level, type ProgramInput } from './program'

// Prompts-modelo (FR-10) e Programas prontos (FR-14). O app não chama IA nenhuma:
// a pessoa copia o Prompt-modelo, cola no Claude ou no ChatGPT e traga o JSON de volta.

export interface PromptOptions {
  goal: Goal
  level: Level
  daysPerWeek: number
  minutes: number
  context: string // equipamento, limitações, preferências
  catalog: string[] // nomes do catálogo, para a IA usar os mesmos
}

const GOAL_GUIDE: Record<Goal, string[]> = {
  strength: [
    'Objetivo: ganhar força nos movimentos básicos (agachamento, supino, levantamento terra, desenvolvimento, remada).',
    'Priorize Exercícios compostos no início de cada treino, de 3 a 6 repetições e descanso de 2 a 3 minutos.',
    'Inclua poucos acessórios (8 a 12 repetições) e explique a progressão de carga em "notes".',
  ],
  hypertrophy: [
    'Objetivo: hipertrofia (ganho de massa muscular).',
    'Distribua o volume para cada grupo muscular ser trabalhado cerca de 2 vezes por semana, de 10 a 20 Séries semanais por grupo.',
    'Use de 6 a 15 repetições, descanso de 60 a 120 segundos, e explique a progressão em "notes".',
  ],
  running: [
    'Objetivo: performance de corrida.',
    'Os treinos de corrida usam "modality": "run", sem "exercises", e descrevem o treino em "notes" (aquecimento, blocos, ritmo ou esforço, desaquecimento).',
    'Se fizer sentido, inclua 1 ou 2 treinos de musculação para corredores ("modality": "strength") com Exercícios do catálogo.',
  ],
  general: ['Objetivo: condicionamento geral e saúde, com equilíbrio entre força e resistência.'],
}

export function buildPrompt(o: PromptOptions): string {
  const schema = JSON.stringify(z.toJSONSchema(ProgramSchema, { io: 'input' }), null, 1)
  const example: ProgramInput = {
    format: 'tonus-programa',
    version: 1,
    name: 'Exemplo A/B',
    goal: o.goal,
    level: o.level,
    weeks: 8,
    days_per_week: 3,
    notes: 'Aumente a carga quando completar todas as Séries no topo da faixa de repetições.',
    workouts: [
      { name: 'Treino A', modality: 'strength', focus: 'Peito e costas', exercises: [{ name: 'Supino reto', sets: 3, reps: '8-12', rest_seconds: 90 }] },
      { name: 'Corrida leve', modality: 'run', notes: '5 min caminhando, 20 min de corrida em ritmo de conversa, 5 min caminhando.' },
    ],
  }
  return [
    'Atue como profissional de educação física e monte um Programa de treino para mim.',
    '',
    '## Sobre mim',
    `- Nível: ${LEVEL_LABEL[o.level]}`,
    `- Dias de treino por semana: ${o.daysPerWeek}`,
    `- Tempo por treino: cerca de ${o.minutes} minutos`,
    `- Equipamento, limitações e preferências: ${o.context.trim() || 'academia completa, sem limitações'}`,
    '',
    '## O que eu quero',
    ...GOAL_GUIDE[o.goal].map((l) => `- ${l}`),
    '- Os treinos formam uma Rotação: a lista "workouts" é a ordem em que faço os treinos, e ela se repete. Não precisa ter um treino por dia da semana.',
    '- Use os nomes de Exercício exatamente como estão no catálogo abaixo sempre que possível. Se precisar de um que não está lá, use o nome mais comum em português do Brasil.',
    '- "reps" é texto: uma faixa ("8-12"), um número ("5") ou tempo ("30s").',
    '',
    '## Formato da resposta',
    'Responda só com um bloco ```json contendo um objeto que siga este JSON Schema, sem texto antes ou depois:',
    '',
    '```json',
    schema,
    '```',
    '',
    'Exemplo (curto) do formato:',
    '```json',
    JSON.stringify(example, null, 1),
    '```',
    '',
    '## Catálogo de Exercícios do app',
    o.catalog.join('; ') + '.',
  ].join('\n')
}

// --- Programas prontos (FR-14), no mesmo formato da importação ---

type Ex = [name: string, sets: number, reps: string, rest: number]
const strength = (name: string, focus: string, list: Ex[]) => ({
  name,
  modality: 'strength' as const,
  focus,
  exercises: list.map(([n, sets, reps, rest_seconds]) => ({ name: n, sets, reps, rest_seconds })),
})

export const PRESET_PROGRAMS: ProgramInput[] = [
  {
    format: 'tonus-programa',
    version: 1,
    name: 'Corpo inteiro A/B',
    goal: 'general',
    level: 'beginner',
    weeks: 8,
    days_per_week: 3,
    notes: 'Alterne A e B. Quando fizer todas as Séries no topo da faixa, aumente um pouco a carga na próxima Sessão.',
    workouts: [
      strength('Corpo inteiro A', 'Pernas, peito e costas', [
        ['Leg press 45°', 3, '10-12', 90],
        ['Supino reto com halteres', 3, '10-12', 90],
        ['Puxada frontal', 3, '10-12', 90],
        ['Mesa flexora', 2, '12-15', 60],
        ['Elevação lateral', 2, '12-15', 60],
        ['Prancha', 3, '30s', 45],
      ]),
      strength('Corpo inteiro B', 'Glúteos, ombros e braços', [
        ['Agachamento goblet', 3, '10-12', 90],
        ['Remada baixa', 3, '10-12', 90],
        ['Desenvolvimento com halteres', 3, '10-12', 90],
        ['Elevação pélvica', 3, '10-12', 90],
        ['Rosca direta', 2, '12-15', 60],
        ['Tríceps na polia', 2, '12-15', 60],
      ]),
    ],
  },
  {
    format: 'tonus-programa',
    version: 1,
    name: 'Superior / Inferior',
    goal: 'hypertrophy',
    level: 'intermediate',
    weeks: 10,
    days_per_week: 4,
    notes: 'Quatro treinos em sequência. Busque terminar cada Série a 1 ou 2 repetições da falha.',
    workouts: [
      strength('Superior A', 'Peito e costas', [
        ['Supino reto', 4, '6-8', 120],
        ['Remada curvada', 4, '6-8', 120],
        ['Supino inclinado com halteres', 3, '8-12', 90],
        ['Puxada frontal', 3, '8-12', 90],
        ['Elevação lateral', 3, '12-15', 60],
        ['Rosca alternada', 3, '10-12', 60],
      ]),
      strength('Inferior A', 'Quadríceps', [
        ['Agachamento livre', 4, '6-8', 150],
        ['Leg press 45°', 3, '10-12', 90],
        ['Cadeira extensora', 3, '12-15', 60],
        ['Mesa flexora', 3, '10-12', 60],
        ['Panturrilha em pé', 4, '10-15', 60],
      ]),
      strength('Superior B', 'Ombros e braços', [
        ['Desenvolvimento militar', 4, '6-8', 120],
        ['Barra fixa', 3, '6-10', 120],
        ['Crucifixo na máquina', 3, '10-12', 60],
        ['Remada unilateral com halter', 3, '10-12', 90],
        ['Face pull', 3, '12-15', 60],
        ['Tríceps corda', 3, '10-12', 60],
      ]),
      strength('Inferior B', 'Posterior e glúteos', [
        ['Levantamento terra', 3, '5', 180],
        ['Elevação pélvica', 4, '8-12', 90],
        ['Agachamento búlgaro', 3, '8-10', 90],
        ['Cadeira flexora', 3, '10-12', 60],
        ['Panturrilha sentada', 3, '12-15', 60],
        ['Abdominal infra', 3, '12-15', 45],
      ]),
    ],
  },
  {
    format: 'tonus-programa',
    version: 1,
    name: 'Força 5×5',
    goal: 'strength',
    level: 'intermediate',
    weeks: 12,
    days_per_week: 3,
    notes: 'Alterne A e B. Comece com cargas confortáveis e some 2,5 kg (pernas: 5 kg) a cada Sessão em que completar todas as Séries.',
    workouts: [
      strength('5×5 A', 'Agachamento, supino e remada', [
        ['Agachamento livre', 5, '5', 180],
        ['Supino reto', 5, '5', 180],
        ['Remada curvada', 5, '5', 150],
      ]),
      strength('5×5 B', 'Agachamento, desenvolvimento e terra', [
        ['Agachamento livre', 5, '5', 180],
        ['Desenvolvimento militar', 5, '5', 180],
        ['Levantamento terra', 1, '5', 180],
      ]),
    ],
  },
  {
    format: 'tonus-programa',
    version: 1,
    name: 'Empurrar / Puxar / Pernas',
    goal: 'hypertrophy',
    level: 'intermediate',
    weeks: 10,
    days_per_week: 6,
    notes: 'Faça a sequência duas vezes por semana, ou uma vez em 3 dias de treino.',
    workouts: [
      strength('Empurrar', 'Peito, ombros e tríceps', [
        ['Supino reto', 4, '6-10', 120],
        ['Supino inclinado com halteres', 3, '8-12', 90],
        ['Desenvolvimento com halteres', 3, '8-12', 90],
        ['Elevação lateral', 3, '12-15', 60],
        ['Tríceps testa', 3, '10-12', 60],
      ]),
      strength('Puxar', 'Costas e bíceps', [
        ['Barra fixa', 4, '6-10', 120],
        ['Remada baixa', 3, '8-12', 90],
        ['Pulldown com braços estendidos', 3, '12-15', 60],
        ['Crucifixo invertido', 3, '12-15', 60],
        ['Rosca Scott', 3, '10-12', 60],
      ]),
      strength('Pernas', 'Pernas e core', [
        ['Agachamento livre', 4, '6-10', 150],
        ['Stiff', 3, '8-10', 120],
        ['Cadeira extensora', 3, '12-15', 60],
        ['Cadeira flexora', 3, '12-15', 60],
        ['Panturrilha no leg press', 4, '12-15', 45],
        ['Abdominal na polia', 3, '12-15', 45],
      ]),
    ],
  },
  {
    format: 'tonus-programa',
    version: 1,
    name: 'Primeiros 5 km',
    goal: 'running',
    level: 'beginner',
    weeks: 8,
    days_per_week: 3,
    notes: 'Corra em ritmo de conversa. A cada semana, aumente 1 minuto em cada bloco de corrida. Na semana 8, tente 30 minutos seguidos.',
    workouts: [
      { name: 'Intervalado leve', modality: 'run', notes: '5 min caminhando; 8× (1 min correndo + 1 min 30 s caminhando); 5 min caminhando.' },
      strength('Força para corrida', 'Pernas e core', [
        ['Agachamento goblet', 3, '10-12', 60],
        ['Afundo', 3, '10', 60],
        ['Ponte de glúteo', 3, '12-15', 45],
        ['Panturrilha em pé', 3, '15', 45],
        ['Prancha', 3, '30s', 45],
      ]),
      { name: 'Corrida contínua', modality: 'run', notes: '5 min caminhando; 15 a 20 min correndo devagar, com pausas curtas se precisar; 5 min caminhando.' },
    ],
  },
]
