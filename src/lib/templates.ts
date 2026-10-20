import { db, saveLocal, type Exercise, type Modality } from './db'

// Editor de Template: rascunho em memória e gravação no Dexie (FR-4).

export interface DraftExercise {
  key: string // id da linha template_exercises (novo ou existente)
  exerciseId: string
  name: string
  muscleGroup: string
  sets: number
  reps: string
  restSeconds: number
}

export interface TemplateDraft {
  id: string
  isNew: boolean
  name: string
  modality: Modality
  notes: string
  exercises: DraftExercise[]
}

export function emptyDraft(): TemplateDraft {
  return { id: crypto.randomUUID(), isNew: true, name: '', modality: 'strength', notes: '', exercises: [] }
}

export async function loadDraft(templateId: string): Promise<TemplateDraft | null> {
  const t = await db.templates.get(templateId)
  if (!t || t.deleted_at) return null
  const rows = (await db.template_exercises.where('template_id').equals(templateId).toArray())
    .filter((r) => !r.deleted_at)
    .sort((a, b) => a.position - b.position)
  const exercises = await db.exercises.bulkGet(rows.map((r) => r.exercise_id))
  return {
    id: t.id,
    isNew: false,
    name: t.name,
    modality: t.modality,
    notes: t.notes ?? '',
    exercises: rows.map((r, i) => ({
      key: r.id,
      exerciseId: r.exercise_id,
      name: exercises[i]?.name ?? 'Exercício',
      muscleGroup: exercises[i]?.muscle_group ?? '',
      sets: r.target_sets,
      reps: r.target_reps,
      restSeconds: r.rest_seconds ?? exercises[i]?.default_rest_seconds ?? 90,
    })),
  }
}

export function addExercise(draft: TemplateDraft, ex: Exercise): TemplateDraft {
  return {
    ...draft,
    exercises: [
      ...draft.exercises,
      {
        key: crypto.randomUUID(),
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscle_group,
        sets: 3,
        reps: '8-12',
        restSeconds: ex.default_rest_seconds,
      },
    ],
  }
}

export function moveExercise(draft: TemplateDraft, index: number, delta: -1 | 1): TemplateDraft {
  const to = index + delta
  if (to < 0 || to >= draft.exercises.length) return draft
  const list = [...draft.exercises]
  ;[list[index], list[to]] = [list[to], list[index]]
  return { ...draft, exercises: list }
}

// Exercício novo no catálogo da pessoa (quando não existe no global)
export async function createExercise(ownerId: string, name: string, muscleGroup: string): Promise<Exercise> {
  const ex = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    name: name.trim(),
    muscle_group: muscleGroup,
    equipment: null,
    default_rest_seconds: 90,
    deleted_at: null,
  }
  await saveLocal('exercises', ex)
  return { ...ex, updated_at: new Date().toISOString() }
}

export async function saveDraft(draft: TemplateDraft, ownerId: string): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.templates.get(draft.id)
  await saveLocal('templates', {
    id: draft.id,
    owner_id: ownerId,
    name: draft.name.trim() || 'Template sem nome',
    modality: draft.modality,
    notes: draft.notes.trim() || null,
    archived_at: existing?.archived_at ?? null,
    deleted_at: null,
  })
  const exercises = draft.modality === 'strength' ? draft.exercises : []
  for (const [position, e] of exercises.entries()) {
    await saveLocal('template_exercises', {
      id: e.key,
      template_id: draft.id,
      exercise_id: e.exerciseId,
      position,
      target_sets: e.sets,
      target_reps: e.reps.trim() || '8-12',
      target_weight_kg: null,
      rest_seconds: e.restSeconds,
      deleted_at: null,
    })
  }
  // Removidos do rascunho: remoção lógica, para a exclusão chegar ao Supabase
  const keep = new Set(exercises.map((e) => e.key))
  const old = await db.template_exercises.where('template_id').equals(draft.id).toArray()
  for (const row of old.filter((r) => !keep.has(r.id) && !r.deleted_at)) {
    await saveLocal('template_exercises', { ...row, deleted_at: now })
  }
}

export async function archiveTemplate(templateId: string): Promise<void> {
  const t = await db.templates.get(templateId)
  if (t) await saveLocal('templates', { ...t, archived_at: new Date().toISOString() })
}
