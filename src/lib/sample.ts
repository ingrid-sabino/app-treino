import type { TodayData } from './today'
import type { Modality } from './db'

// Dados de exemplo para a prévia visual e os testes: a semana do Ingrid
// (4 musculação, 2 corrida, 1 hot yoga), com o Treino A feito na segunda 19/10.

const now = '2026-10-19T00:00:00.000Z'
const owner = 'demo'
const base = { updated_at: now, deleted_at: null }

const rotationItems: { label: string; modality: Modality; notes?: string; exercises?: number }[] = [
  { label: 'Treino A', modality: 'strength', notes: 'Peito e tríceps', exercises: 6 },
  { label: 'Treino B', modality: 'strength', notes: 'Costas e bíceps', exercises: 6 },
  { label: 'Corrida leve 5 km', modality: 'run' },
  { label: 'Treino C', modality: 'strength', notes: 'Pernas', exercises: 7 },
  { label: 'Treino D', modality: 'strength', notes: 'Ombros e core', exercises: 5 },
  { label: 'Corrida longa 10 km', modality: 'run' },
  { label: 'Hot yoga', modality: 'yoga' },
]

export function sampleTodayData(): TodayData {
  const rotation = {
    ...base,
    id: 'rot',
    owner_id: owner,
    name: 'Força + corrida',
    source: 'ai_import' as const,
    program_meta: null,
    starts_on: '2026-10-19',
    is_active: true,
    archived_at: null,
    weekly_slots: [1, 1, 1, 1, 1, 2, 0], // seg a sex 1 treino, sábado 2
  }
  const templates = rotationItems
    .filter((i) => i.exercises)
    .map((i) => ({ ...base, id: `tpl-${i.label}`, owner_id: owner, name: i.label, modality: i.modality, notes: i.notes ?? null, archived_at: null }))
  const templateExercises = rotationItems.flatMap((i) =>
    Array.from({ length: i.exercises ?? 0 }, (_, n) => ({
      ...base,
      id: `te-${i.label}-${n}`,
      template_id: `tpl-${i.label}`,
      exercise_id: `ex-${n}`,
      position: n,
      target_sets: 3,
      target_reps: '8-12',
      target_weight_kg: null,
      rest_seconds: 90,
    })),
  )
  const session = {
    ...base,
    id: 'ses-a',
    owner_id: owner,
    rotation_item_id: 'item-0',
    template_id: 'tpl-Treino A',
    modality: 'strength' as const,
    started_at: '2026-10-19T10:00:00.000Z',
    ended_at: '2026-10-19T11:02:00.000Z',
    effort: 8,
    notes: null,
  }
  const weekSets = Array.from({ length: 18 }, (_, n) => ({
    ...base,
    id: `set-${n}`,
    session_id: 'ses-a',
    exercise_id: `ex-${n % 6}`,
    exercise_position: n % 6,
    set_position: Math.floor(n / 6),
    weight_kg: 40,
    reps: 10,
    rpe: null,
    status: 'done' as const,
    completed_at: null,
  }))
  return {
    rotation,
    items: rotationItems.map((i, n) => ({
      ...base,
      id: `item-${n}`,
      rotation_id: 'rot',
      position: n,
      template_id: i.exercises ? `tpl-${i.label}` : null,
      modality: i.modality,
      label: i.label,
    })),
    occurrences: [{ ...base, id: 'occ-0', owner_id: owner, rotation_id: 'rot', seq: 0, planned_on: null, resolution: 'done', resolved_on: '2026-10-19', session_id: 'ses-a' }],
    weekSessions: [session],
    weekSets,
    templates,
    templateExercises,
  }
}

// Oito semanas de histórico: supino, agachamento e terra subindo de carga; peso semanal
export function sampleProgressData(): import('./progress').ProgressData {
  const exercises = [
    { id: 'ex-supino', name: 'Supino reto', start: 50, step: 1.25 },
    { id: 'ex-agach', name: 'Agachamento livre', start: 70, step: 2.5 },
    { id: 'ex-terra', name: 'Levantamento terra', start: 80, step: 2.5 },
  ]
  const sessions: import('./db').Session[] = []
  const sets: import('./db').WorkoutSet[] = []
  for (let w = 0; w < 8; w++) {
    const day = new Date(Date.UTC(2026, 7, 31 + w * 7, 13)) // segundas a partir de 31/08
    const id = `hist-${w}`
    sessions.push({ ...base, id, owner_id: owner, rotation_item_id: null, template_id: null, modality: 'strength', started_at: day.toISOString(), ended_at: new Date(day.getTime() + 3600e3).toISOString(), effort: 8, notes: null })
    exercises.forEach((ex, n) => {
      for (let s = 0; s < 3; s++) {
        const wobble = w === 5 ? -ex.step : 0 // uma semana mais fraca, como na vida real
        sets.push({ ...base, id: `${id}-${n}-${s}`, session_id: id, exercise_id: ex.id, exercise_position: n, set_position: s, weight_kg: ex.start + ex.step * w + wobble, reps: 5, rpe: null, status: 'done', completed_at: null })
      }
    })
  }
  const weights = [78.4, 78.1, 78.6, 78.9, 79.2, 79.0, 79.5, 79.8]
  return {
    sessions,
    sets,
    exercises: exercises.map((e) => ({ ...base, id: e.id, owner_id: null, name: e.name, muscle_group: '', equipment: null, default_rest_seconds: 120 })),
    bodyLogs: weights.map((kg, w) => ({
      ...base,
      id: `body-${w}`,
      owner_id: owner,
      logged_on: new Date(Date.UTC(2026, 7, 31 + w * 7)).toISOString().slice(0, 10),
      weight_kg: kg,
      waist_cm: null,
      chest_cm: null,
      hip_cm: null,
      arm_cm: null,
      thigh_cm: null,
      notes: null,
    })),
  }
}

// Catálogo global (o mesmo das migrations 0001 e 0004) para prévias e testes
export const CATALOG: [string, string, string, number?][] = [
  ['Supino reto', 'peito', 'barra'],
  ['Supino inclinado com halteres', 'peito', 'halteres'],
  ['Crucifixo na máquina', 'peito', 'máquina'],
  ['Desenvolvimento militar', 'ombros', 'barra'],
  ['Elevação lateral', 'ombros', 'halteres'],
  ['Barra fixa', 'costas', 'peso corporal'],
  ['Remada curvada', 'costas', 'barra'],
  ['Puxada frontal', 'costas', 'polia'],
  ['Remada baixa', 'costas', 'polia'],
  ['Rosca direta', 'bíceps', 'barra'],
  ['Rosca martelo', 'bíceps', 'halteres'],
  ['Tríceps na polia', 'tríceps', 'polia'],
  ['Tríceps francês', 'tríceps', 'halter'],
  ['Agachamento livre', 'pernas', 'barra'],
  ['Leg press 45°', 'pernas', 'máquina'],
  ['Levantamento terra', 'posterior', 'barra'],
  ['Stiff', 'posterior', 'barra'],
  ['Cadeira extensora', 'quadríceps', 'máquina'],
  ['Mesa flexora', 'posterior', 'máquina'],
  ['Elevação pélvica', 'glúteos', 'barra'],
  ['Panturrilha em pé', 'panturrilhas', 'máquina'],
  ['Prancha', 'core', 'peso corporal'],
  // 0004: catálogo ampliado
  ['Supino inclinado com barra', 'peito', 'barra', 120],
  ['Supino declinado', 'peito', 'barra', 120],
  ['Supino reto com halteres', 'peito', 'halteres', 90],
  ['Crucifixo com halteres', 'peito', 'halteres', 60],
  ['Crossover', 'peito', 'polia', 60],
  ['Flexão de braço', 'peito', 'peso corporal', 90],
  ['Desenvolvimento com halteres', 'ombros', 'halteres', 90],
  ['Elevação frontal', 'ombros', 'halteres', 60],
  ['Crucifixo invertido', 'ombros', 'halteres', 60],
  ['Remada alta', 'ombros', 'barra', 90],
  ['Encolhimento', 'ombros', 'halteres', 60],
  ['Face pull', 'ombros', 'polia', 60],
  ['Remada unilateral com halter', 'costas', 'halter', 90],
  ['Pulldown com braços estendidos', 'costas', 'polia', 90],
  ['Remada cavalinho', 'costas', 'barra', 120],
  ['Hiperextensão lombar', 'costas', 'banco', 90],
  ['Rosca alternada', 'bíceps', 'halteres', 60],
  ['Rosca Scott', 'bíceps', 'barra', 60],
  ['Rosca na polia', 'bíceps', 'polia', 60],
  ['Rosca concentrada', 'bíceps', 'halter', 60],
  ['Tríceps testa', 'tríceps', 'barra', 60],
  ['Tríceps corda', 'tríceps', 'polia', 60],
  ['Mergulho no banco', 'tríceps', 'peso corporal', 90],
  ['Mergulho nas paralelas', 'tríceps', 'peso corporal', 120],
  ['Tríceps coice', 'tríceps', 'halter', 60],
  ['Supino fechado', 'tríceps', 'barra', 120],
  ['Agachamento sumô', 'pernas', 'halter', 90],
  ['Agachamento búlgaro', 'pernas', 'halteres', 120],
  ['Afundo', 'pernas', 'halteres', 90],
  ['Agachamento hack', 'pernas', 'máquina', 120],
  ['Agachamento goblet', 'pernas', 'halter', 90],
  ['Agachamento no Smith', 'pernas', 'máquina', 120],
  ['Cadeira adutora', 'pernas', 'máquina', 60],
  ['Cadeira abdutora', 'glúteos', 'máquina', 60],
  ['Subida no banco', 'pernas', 'halteres', 90],
  ['Cadeira flexora', 'posterior', 'máquina', 90],
  ['Bom dia', 'posterior', 'barra', 120],
  ['Glúteo na polia', 'glúteos', 'polia', 60],
  ['Ponte de glúteo', 'glúteos', 'peso corporal', 90],
  ['Panturrilha sentada', 'panturrilhas', 'máquina', 60],
  ['Panturrilha no leg press', 'panturrilhas', 'máquina', 60],
  ['Abdominal supra', 'core', 'peso corporal', 60],
  ['Abdominal infra', 'core', 'peso corporal', 60],
  ['Elevação de pernas na barra', 'core', 'peso corporal', 60],
  ['Prancha lateral', 'core', 'peso corporal', 60],
  ['Abdominal oblíquo', 'core', 'halter', 60],
  ['Abdominal na polia', 'core', 'polia', 60],
  ['Roda abdominal', 'core', 'roda', 60],
  ['Escalador', 'core', 'peso corporal', 60],
]

export function sampleCatalog(): import('./db').Exercise[] {
  return CATALOG.map(([name, muscle_group, equipment, rest], i) => ({
    ...base,
    id: `cat-${i}`,
    owner_id: null,
    name,
    muscle_group,
    equipment,
    default_rest_seconds: rest ?? 90,
  }))
}

export function sampleTemplateDraft(): import('./templates').TemplateDraft {
  const pick = (name: string, sets: number, reps: string, rest: number) => {
    const ex = sampleCatalog().find((e) => e.name === name)!
    return { key: `d-${ex.id}`, exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscle_group, sets, reps, restSeconds: rest }
  }
  return {
    id: 'tpl-b',
    isNew: false,
    name: 'Treino B',
    modality: 'strength',
    notes: 'Costas e bíceps',
    exercises: [
      pick('Barra fixa', 4, '6-8', 120),
      pick('Remada curvada', 4, '8-10', 120),
      pick('Puxada frontal', 3, '10-12', 90),
      pick('Rosca direta', 3, '10-12', 60),
    ],
  }
}

// Variante: terça com 2 treinos, o Treino B já feito hoje e a corrida ainda planejada
export function sampleTodayTwoToday(): TodayData {
  const d = sampleTodayData()
  const slots = [...d.rotation!.weekly_slots]
  slots[1] = 2
  return {
    ...d,
    rotation: { ...d.rotation!, weekly_slots: slots },
    occurrences: [
      ...d.occurrences,
      { ...base, id: 'occ-1', owner_id: owner, rotation_id: 'rot', seq: 1, planned_on: null, resolution: 'done', resolved_on: '2026-10-20', session_id: 'ses-b' },
    ],
    weekSessions: [
      ...d.weekSessions,
      { ...d.weekSessions[0], id: 'ses-b', rotation_item_id: 'item-1', template_id: 'tpl-Treino B', started_at: '2026-10-20T10:00:00.000Z', ended_at: '2026-10-20T11:00:00.000Z' },
    ],
  }
}

// Sessão em andamento do Treino B (prévia): 32 min, remada curvada com 3 de 4 Séries feitas
export function sampleSessionData(nowMs: number): import('./session').SessionData {
  const cat = sampleCatalog()
  const ex = (name: string) => cat.find((e) => e.name === name)!
  const iso = (msAgo: number) => new Date(nowMs - msAgo).toISOString()
  const plan: [string, number, number, number][] = [
    // nome, Séries, peso, reps
    ['Remada curvada', 4, 50, 10],
    ['Barra fixa', 4, 0, 8],
    ['Puxada frontal', 3, 45, 12],
    ['Rosca direta', 3, 25, 12],
  ]
  const sets: import('./db').WorkoutSet[] = []
  const previous: Record<string, import('./db').WorkoutSet[]> = {}
  plan.forEach(([name, count, kg, reps], position) => {
    const e = ex(name)
    previous[e.id] = []
    for (let i = 0; i < count; i++) {
      const done = position === 0 && i < 3
      const weight = name === 'Barra fixa' ? null : kg
      sets.push({ ...base, id: `s-${position}-${i}`, session_id: 'ses', exercise_id: e.id, exercise_position: position, set_position: i, weight_kg: weight, reps, rpe: null, status: done ? 'done' : 'pending', completed_at: done ? iso((3 - i) * 150_000 - 110_000) : null })
      previous[e.id].push({ ...sets[sets.length - 1], id: `p-${position}-${i}`, weight_kg: weight == null ? null : weight - 2.5, reps: reps - (i === count - 1 ? 2 : 0), status: 'done' })
    }
  })
  return {
    session: { ...base, id: 'ses', owner_id: owner, rotation_item_id: 'item-1', template_id: 'tpl-Treino B', modality: 'strength', started_at: iso(32 * 60_000 + 14_000), ended_at: null, effort: null, notes: null },
    templateName: 'Treino B',
    sets,
    exercises: cat,
    templateRest: { [ex('Remada curvada').id]: 120, [ex('Barra fixa').id]: 120, [ex('Puxada frontal').id]: 90, [ex('Rosca direta').id]: 60 },
    previous,
  }
}

export function sampleSessionSummary(): import('./session').SessionSummary {
  const cat = sampleCatalog()
  return {
    durationSeconds: 58 * 60 + 12,
    volumeKg: 7240,
    reps: 142,
    setsDone: 14,
    records: [
      { exerciseId: cat.find((e) => e.name === 'Remada curvada')!.id, kind: 'weight', value: 52.5, previous: 50 },
      { exerciseId: cat.find((e) => e.name === 'Remada curvada')!.id, kind: 'oneRepMax', value: 70, previous: 66.7 },
    ],
  }
}
