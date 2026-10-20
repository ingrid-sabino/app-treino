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
