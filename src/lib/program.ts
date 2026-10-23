import { z } from 'zod'
import { db, saveLocal, type Exercise, type Modality } from './db'
import { saveRotation } from './rotations'

// Programa (FR-10 a FR-14): um JSON que a pessoa gera numa IA com o Prompt-modelo (ou escolhe
// entre os prontos), cola no app, confere na prévia e importa como Templates + Rotação ativa.
// O mesmo schema valida a importação e vai, como JSON Schema, dentro do Prompt-modelo.

const MODALITIES = ['strength', 'run', 'ride', 'yoga', 'other'] as const
export const GOALS = ['strength', 'hypertrophy', 'running', 'general'] as const
export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Goal = (typeof GOALS)[number]
export type Level = (typeof LEVELS)[number]

export const GOAL_LABEL: Record<Goal, string> = { strength: 'Força', hypertrophy: 'Hipertrofia', running: 'Corrida', general: 'Condicionamento' }
export const LEVEL_LABEL: Record<Level, string> = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }

const ProgramExercise = z.object({
  name: z.string().trim().min(1).describe('Nome do Exercício, de preferência igual ao do catálogo'),
  sets: z.number().int().min(1).max(10).describe('Séries'),
  reps: z.union([z.string().trim().min(1), z.number().int().min(1)]).describe('Repetições, ex.: "8-12", "5" ou "30s"'),
  rest_seconds: z.number().int().min(0).max(600).optional().describe('Descanso entre Séries, em segundos'),
  notes: z.string().optional(),
})

const ProgramWorkout = z.object({
  name: z.string().trim().min(1).describe('Nome do treino, ex.: "Treino A" ou "Inferior"'),
  modality: z.enum(MODALITIES).default('strength').describe('strength = musculação; run = corrida; ride = ciclismo; yoga; other'),
  focus: z.string().optional().describe('Foco, ex.: "Costas e bíceps"'),
  notes: z.string().optional().describe('Para corrida, ciclismo e yoga: o que fazer no treino'),
  exercises: z.array(ProgramExercise).default([]),
}).refine((w) => w.modality !== 'strength' || w.exercises.length > 0, { path: ['exercises'], message: 'treino de musculação sem Exercícios' })

export const ProgramSchema = z
  .object({
    format: z.literal('tonus-programa').optional(),
    version: z.literal(1).optional(),
    name: z.string().trim().min(1).describe('Nome do Programa'),
    goal: z.enum(GOALS).optional(),
    level: z.enum(LEVELS).optional(),
    weeks: z.number().int().min(1).max(52).optional().describe('Duração sugerida, em semanas'),
    days_per_week: z.number().int().min(1).max(7).describe('Dias de treino por semana'),
    notes: z.string().optional().describe('Progressão e orientações gerais'),
    workouts: z.array(ProgramWorkout).min(1).max(14).describe('Treinos na ordem da Rotação; a sequência se repete'),
  })

export type Program = z.infer<typeof ProgramSchema>
export type ProgramInput = z.input<typeof ProgramSchema>

// Tira o JSON de dentro do texto colado: aceita resposta com ```json, prosa antes e depois ou arquivo .md
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Não encontrei um JSON no texto. Cole a resposta inteira da IA.')
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    throw new Error('O JSON está incompleto ou com erro de digitação. Peça para a IA mandar de novo, só o JSON.')
  }
}

const FIELD: Record<string, string> = {
  name: 'nome',
  days_per_week: 'dias por semana',
  workouts: 'treinos',
  exercises: 'Exercícios',
  sets: 'Séries',
  reps: 'repetições',
  rest_seconds: 'descanso',
  modality: 'Modalidade',
  format: 'formato',
  version: 'versão',
  goal: 'objetivo',
  level: 'nível',
  weeks: 'semanas',
}

function where(path: PropertyKey[], raw: unknown): string {
  const parts: string[] = []
  let node: unknown = raw
  for (const key of path) {
    node = node && typeof node === 'object' ? (node as Record<PropertyKey, unknown>)[key] : undefined
    if (typeof key === 'number') {
      const label = node && typeof node === 'object' && 'name' in node ? String((node as { name: unknown }).name) : `nº ${key + 1}`
      parts.push(label)
    } else parts.push(FIELD[String(key)] ?? String(key))
  }
  return parts.join(' › ')
}

export type ParseResult = { ok: true; program: Program } | { ok: false; errors: string[] }

export function parseProgram(text: string): ParseResult {
  let raw: unknown
  try {
    raw = extractJson(text)
  } catch (err) {
    return { ok: false, errors: [(err as Error).message] }
  }
  const res = ProgramSchema.safeParse(raw)
  if (res.success) return { ok: true, program: res.data }
  const errors = res.error.issues.slice(0, 6).map((i) => {
    const at = i.path.length ? `${where(i.path, raw)}: ` : ''
    if (i.code === 'invalid_type' && i.input === undefined) return `${at}campo obrigatório faltando`
    if (i.code === 'custom') return `${at}${i.message}`
    if (i.code === 'too_small') return `${at}valor abaixo do mínimo`
    if (i.code === 'too_big') return `${at}valor acima do máximo`
    if (i.code === 'invalid_value') return `${at}valor não aceito`
    return `${at}formato inválido`
  })
  return { ok: false, errors }
}

// --- Casamento com o catálogo (FR-12) ---

export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9°]+/g, ' ')
    .trim()

// Nomes comuns que as IAs usam para Exercícios do catálogo
const ALIASES: Record<string, string> = {
  'supino reto com barra': 'Supino reto',
  'supino plano': 'Supino reto',
  'supino inclinado': 'Supino inclinado com halteres',
  'leg press': 'Leg press 45°',
  'leg press 45': 'Leg press 45°',
  'puxada alta': 'Puxada frontal',
  'puxada na frente': 'Puxada frontal',
  'pulldown': 'Puxada frontal',
  'agachamento': 'Agachamento livre',
  'agachamento com barra': 'Agachamento livre',
  'agachamento livre com barra': 'Agachamento livre',
  'terra': 'Levantamento terra',
  'levantamento terra romeno': 'Stiff',
  'terra romeno': 'Stiff',
  'peck deck': 'Crucifixo na máquina',
  'voador': 'Crucifixo na máquina',
  'voador invertido': 'Crucifixo invertido',
  'barra fixa pronada': 'Barra fixa',
  'triceps pulley': 'Tríceps na polia',
  'triceps na polia alta': 'Tríceps na polia',
  'triceps frances com halter': 'Tríceps francês',
  'extensora': 'Cadeira extensora',
  'flexora': 'Mesa flexora',
  'mesa flexora deitada': 'Mesa flexora',
  'hip thrust': 'Elevação pélvica',
  'elevacao de quadril': 'Elevação pélvica',
  'panturrilha em pe na maquina': 'Panturrilha em pé',
  'gemeos em pe': 'Panturrilha em pé',
  'prancha abdominal': 'Prancha',
  'prancha frontal': 'Prancha',
  'avanco': 'Afundo',
  'passada': 'Afundo',
  'serrote': 'Remada unilateral com halter',
  'remada serrote': 'Remada unilateral com halter',
  'remada unilateral': 'Remada unilateral com halter',
  'remada t': 'Remada cavalinho',
  'crucifixo reto': 'Crucifixo com halteres',
  'crucifixo': 'Crucifixo com halteres',
  'cross over': 'Crossover',
  'flexao': 'Flexão de braço',
  'flexoes': 'Flexão de braço',
  'abdominal': 'Abdominal supra',
  'abdominal crunch': 'Abdominal supra',
  'russian twist': 'Abdominal oblíquo',
  'mountain climber': 'Escalador',
  'abdutora': 'Cadeira abdutora',
  'adutora': 'Cadeira adutora',
  'stiff com barra': 'Stiff',
  'good morning': 'Bom dia',
  'ponte': 'Ponte de glúteo',
  'kickback': 'Glúteo na polia',
  'triceps testa com barra': 'Tríceps testa',
  'paralelas': 'Mergulho nas paralelas',
  'mergulho': 'Mergulho nas paralelas',
  'desenvolvimento': 'Desenvolvimento com halteres',
  'desenvolvimento com barra': 'Desenvolvimento militar',
  'elevacao lateral com halteres': 'Elevação lateral',
}

const STOP = new Set(['com', 'de', 'na', 'no', 'em', 'a', 'o', 'e', 'da', 'do'])
const tokens = (s: string) => new Set(normalizeName(s).split(' ').filter((t) => t && !STOP.has(t)))

function similarity(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  const inter = [...ta].filter((t) => tb.has(t)).length
  return inter / (ta.size + tb.size - inter || 1)
}

export interface ExerciseMatch {
  exercise: Exercise | null // casou com certeza
  suggestion: Exercise | null // parecido: a pessoa confirma
}

export function matchExercise(name: string, catalog: Exercise[]): ExerciseMatch {
  const n = normalizeName(name)
  const byName = new Map(catalog.map((e) => [normalizeName(e.name), e]))
  const exact = byName.get(n) ?? (ALIASES[n] ? byName.get(normalizeName(ALIASES[n])) : undefined)
  if (exact) return { exercise: exact, suggestion: null }
  let best: Exercise | null = null
  let score = 0
  for (const e of catalog) {
    const s = similarity(name, e.name)
    if (s > score) [best, score] = [e, s]
  }
  return { exercise: null, suggestion: score >= 0.3 ? best : null }
}

// Decisão para cada Exercício que não casou
export type Resolution = { kind: 'existing'; exerciseId: string } | { kind: 'create'; muscleGroup: string }

// Nomes (normalizados) dos Exercícios do Programa que não casaram com o catálogo
export function unmatchedNames(program: Program, catalog: Exercise[]): string[] {
  const seen = new Map<string, string>()
  for (const w of program.workouts) {
    if (w.modality !== 'strength') continue
    for (const e of w.exercises) {
      const key = normalizeName(e.name)
      if (!seen.has(key) && !matchExercise(e.name, catalog).exercise) seen.set(key, e.name)
    }
  }
  return [...seen.values()]
}

// Dias de treino padrão para N dias por semana (FR-34); a pessoa ajusta na prévia
export function defaultSlots(days: number): number[] {
  const table: Record<number, number[]> = {
    1: [0, 0, 1, 0, 0, 0, 0],
    2: [1, 0, 0, 1, 0, 0, 0],
    3: [1, 0, 1, 0, 1, 0, 0],
    4: [1, 1, 0, 1, 1, 0, 0],
    5: [1, 1, 1, 1, 1, 0, 0],
    6: [1, 1, 1, 1, 1, 1, 0],
    7: [1, 1, 1, 1, 1, 1, 1],
  }
  return table[Math.min(7, Math.max(1, days))]
}

// Gravação: Exercícios novos, um Template por treino e a Rotação ativa a partir de `startsOn` (FR-13)
export async function importProgram(
  program: Program,
  opts: { ownerId: string; catalog: Exercise[]; resolutions: Record<string, Resolution>; startsOn: string; weeklySlots: number[]; source: 'ai_import' | 'preset' },
): Promise<string> {
  const { ownerId, catalog, resolutions } = opts
  const created = new Map<string, Exercise>()

  const exerciseFor = async (name: string, restSeconds: number): Promise<Exercise> => {
    const match = matchExercise(name, catalog)
    if (match.exercise) return match.exercise
    const key = normalizeName(name)
    const r = resolutions[key]
    if (r?.kind === 'existing') {
      const ex = catalog.find((e) => e.id === r.exerciseId)
      if (ex) return ex
    }
    if (created.has(key)) return created.get(key)!
    const ex = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      name: name.trim(),
      muscle_group: r?.kind === 'create' ? r.muscleGroup : 'outro',
      equipment: null,
      default_rest_seconds: restSeconds,
      deleted_at: null,
    }
    await saveLocal('exercises', ex)
    const full = { ...ex, updated_at: new Date().toISOString() }
    created.set(key, full)
    return full
  }

  const items = []
  for (const w of program.workouts) {
    const templateId = crypto.randomUUID()
    await saveLocal('templates', {
      id: templateId,
      owner_id: ownerId,
      name: w.name.trim(),
      modality: w.modality as Modality,
      notes: (w.modality === 'strength' ? w.focus : [w.focus, w.notes].filter(Boolean).join(' · ')) || null,
      archived_at: null,
      deleted_at: null,
    })
    if (w.modality === 'strength') {
      for (const [position, e] of w.exercises.entries()) {
        const rest = e.rest_seconds ?? 90
        const ex = await exerciseFor(e.name, rest)
        await saveLocal('template_exercises', {
          id: crypto.randomUUID(),
          template_id: templateId,
          exercise_id: ex.id,
          position,
          target_sets: e.sets,
          target_reps: String(e.reps),
          target_weight_kg: null,
          rest_seconds: rest,
          deleted_at: null,
        })
      }
    }
    items.push({ key: crypto.randomUUID(), templateId, modality: w.modality as Modality, label: w.name.trim() })
  }

  const rotationId = crypto.randomUUID()
  await saveRotation({ id: rotationId, isNew: true, name: program.name, items, weeklySlots: opts.weeklySlots, isActive: false }, ownerId, true, {
    startsOn: opts.startsOn,
    source: opts.source,
    programMeta: {
      goal: program.goal ?? null,
      level: program.level ?? null,
      weeks: program.weeks ?? null,
      days_per_week: program.days_per_week,
      notes: program.notes ?? null,
      original: program,
    },
  })
  return rotationId
}

export async function activeRotationName(): Promise<string | null> {
  const r = await db.rotations.filter((x) => x.is_active && !x.deleted_at).first()
  return r?.name ?? null
}
