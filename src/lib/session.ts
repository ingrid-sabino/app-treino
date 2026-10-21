import { db, saveLocal, type Modality, type Session, type WorkoutSet } from './db'
import { toLocalDate } from './schedule'
import { estimateOneRepMax } from './strength'

// Sessão em andamento (FR-5 a FR-9, FR-25 a FR-27). Toda mudança vai direto para o
// Dexie (saveLocal), então a Sessão sobrevive a fechar o app ou ficar sem rede (FR-8).

const DEFAULT_REST = 90
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Cálculos puros
// ---------------------------------------------------------------------------

// Volume = peso × reps das Séries feitas; puladas não contam (FR-26)
export function sessionStats(sets: Pick<WorkoutSet, 'status' | 'weight_kg' | 'reps' | 'deleted_at'>[]) {
  const done = sets.filter((s) => s.status === 'done' && !s.deleted_at)
  return {
    volumeKg: Math.round(done.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0) * 10) / 10,
    reps: done.reduce((sum, s) => sum + (s.reps ?? 0), 0),
    setsDone: done.length,
    setsTotal: sets.filter((s) => !s.deleted_at && s.status !== 'skipped').length,
  }
}

// Duração sempre pelo horário de início salvo, nunca por timer em memória (FR-25)
export function elapsedSeconds(startedAt: string, nowMs = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000))
}

// Descanso restante a partir do horário em que a Série foi concluída (FR-6)
export function restRemaining(completedAt: string, restSeconds: number, nowMs = Date.now()): number {
  return Math.ceil(restSeconds - (nowMs - new Date(completedAt).getTime()) / 1000)
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export interface PersonalRecord {
  exerciseId: string
  kind: 'weight' | 'oneRepMax'
  value: number
  previous: number | null
}

// Recordes pessoais da Sessão: maior peso e maior 1RM estimado por Exercício (FR-9)
export function findRecords(current: WorkoutSet[], history: WorkoutSet[]): PersonalRecord[] {
  const done = (sets: WorkoutSet[]) => sets.filter((s) => s.status === 'done' && !s.deleted_at && (s.weight_kg ?? 0) > 0 && (s.reps ?? 0) > 0)
  const best = (sets: WorkoutSet[], exerciseId: string) => {
    const mine = done(sets).filter((s) => s.exercise_id === exerciseId)
    if (mine.length === 0) return null
    return {
      weight: Math.max(...mine.map((s) => s.weight_kg!)),
      oneRepMax: Math.max(...mine.map((s) => estimateOneRepMax(s.weight_kg!, s.reps!))),
    }
  }
  const records: PersonalRecord[] = []
  for (const exerciseId of new Set(done(current).map((s) => s.exercise_id))) {
    const now = best(current, exerciseId)!
    const before = best(history, exerciseId)
    // Primeira vez no Exercício não é recorde: não há com o que comparar
    if (!before) continue
    if (now.weight > before.weight) records.push({ exerciseId, kind: 'weight', value: now.weight, previous: before.weight })
    if (now.oneRepMax > before.oneRepMax + 0.05)
      records.push({ exerciseId, kind: 'oneRepMax', value: Math.round(now.oneRepMax * 10) / 10, previous: Math.round(before.oneRepMax * 10) / 10 })
  }
  return records
}

// "8-12" → 8; "10" → 10; texto livre → null
export function firstReps(target: string): number | null {
  const m = target.match(/\d+/)
  return m ? Number(m[0]) : null
}

// ---------------------------------------------------------------------------
// Dexie
// ---------------------------------------------------------------------------

export async function activeSession(): Promise<Session | null> {
  return (await db.sessions.filter((s) => !s.ended_at && !s.deleted_at).first()) ?? null
}

// Séries feitas da última Sessão concluída com este Exercício (pré-preenchimento, FR-5)
export async function lastSetsFor(exerciseId: string, excludeSessionId?: string): Promise<WorkoutSet[]> {
  const sets = (await db.sets.where('exercise_id').equals(exerciseId).toArray()).filter(
    (s) => s.status === 'done' && !s.deleted_at && s.session_id !== excludeSessionId,
  )
  if (sets.length === 0) return []
  const sessions = await db.sessions.bulkGet([...new Set(sets.map((s) => s.session_id))])
  const finished = sessions.filter((s): s is Session => Boolean(s?.ended_at && !s.deleted_at))
  const last = finished.sort((a, b) => (a.started_at < b.started_at ? 1 : -1))[0]
  if (!last) return []
  return sets.filter((s) => s.session_id === last.id).sort((a, b) => a.set_position - b.set_position)
}

async function prefilledSets(sessionId: string, exerciseId: string, exercisePosition: number, count: number, targetReps: string, targetWeight: number | null) {
  const last = await lastSetsFor(exerciseId, sessionId)
  for (let i = 0; i < count; i++) {
    const ref = last[i] ?? last[last.length - 1]
    await saveLocal('sets', {
      id: crypto.randomUUID(),
      session_id: sessionId,
      exercise_id: exerciseId,
      exercise_position: exercisePosition,
      set_position: i,
      weight_kg: ref?.weight_kg ?? targetWeight,
      reps: ref?.reps ?? firstReps(targetReps),
      rpe: null,
      status: 'pending',
      completed_at: null,
      deleted_at: null,
    })
  }
}

export interface StartInput {
  ownerId: string
  templateId: string | null
  rotationItemId: string | null
  modality: Modality
}

// Começa a Sessão: horário de início salvo e Séries criadas a partir do Template
export async function startSession(input: StartInput): Promise<string> {
  const existing = await activeSession()
  if (existing) return existing.id // uma Sessão em andamento por vez
  const id = crypto.randomUUID()
  await saveLocal('sessions', {
    id,
    owner_id: input.ownerId,
    rotation_item_id: input.rotationItemId,
    template_id: input.templateId,
    modality: input.modality,
    started_at: now(),
    ended_at: null,
    effort: null,
    notes: null,
    deleted_at: null,
  })
  if (input.templateId) {
    const rows = (await db.template_exercises.where('template_id').equals(input.templateId).toArray())
      .filter((r) => !r.deleted_at)
      .sort((a, b) => a.position - b.position)
    for (const [position, r] of rows.entries()) {
      await prefilledSets(id, r.exercise_id, position, r.target_sets, r.target_reps, r.target_weight_kg)
    }
  }
  return id
}

export async function updateSet(set: WorkoutSet, patch: Partial<Pick<WorkoutSet, 'weight_kg' | 'reps' | 'rpe'>>) {
  await saveLocal('sets', { ...set, ...patch })
}

// Um toque: feita ↔ por fazer. O horário salvo alimenta o timer de descanso (FR-6)
export async function toggleSetDone(set: WorkoutSet) {
  const done = set.status !== 'done'
  await saveLocal('sets', { ...set, status: done ? 'done' : 'pending', completed_at: done ? now() : null })
}

// Pular ↔ voltar a fazer
export async function skipSet(set: WorkoutSet) {
  await saveLocal('sets', { ...set, status: set.status === 'skipped' ? 'pending' : 'skipped', completed_at: null })
}

export async function removeSet(set: WorkoutSet) {
  await saveLocal('sets', { ...set, deleted_at: now() })
}

// Nova Série copiando a última do Exercício (FR-7)
export async function addSet(sessionId: string, exerciseId: string, exercisePosition: number) {
  const sets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter(
    (s) => s.exercise_position === exercisePosition && !s.deleted_at,
  )
  const last = sets.sort((a, b) => a.set_position - b.set_position).at(-1)
  await saveLocal('sets', {
    id: crypto.randomUUID(),
    session_id: sessionId,
    exercise_id: exerciseId,
    exercise_position: exercisePosition,
    set_position: (last?.set_position ?? -1) + 1,
    weight_kg: last?.weight_kg ?? null,
    reps: last?.reps ?? null,
    rpe: null,
    status: 'pending',
    completed_at: null,
    deleted_at: null,
  })
}

export async function addExerciseToSession(sessionId: string, exerciseId: string) {
  const sets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter((s) => !s.deleted_at)
  const position = sets.length ? Math.max(...sets.map((s) => s.exercise_position)) + 1 : 0
  await prefilledSets(sessionId, exerciseId, position, 3, '8-12', null)
}

export async function removeExerciseFromSession(sessionId: string, exercisePosition: number) {
  const sets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter(
    (s) => s.exercise_position === exercisePosition && !s.deleted_at,
  )
  for (const s of sets) await removeSet(s)
}

// Troca a posição de dois Exercícios na Sessão, sem mexer no Template (FR-7)
export async function swapExercises(sessionId: string, a: number, b: number) {
  const sets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter((s) => !s.deleted_at)
  for (const s of sets) {
    if (s.exercise_position === a) await saveLocal('sets', { ...s, exercise_position: b })
    else if (s.exercise_position === b) await saveLocal('sets', { ...s, exercise_position: a })
  }
}

export async function discardSession(sessionId: string) {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  const t = now()
  const sets = await db.sets.where('session_id').equals(sessionId).toArray()
  for (const s of sets.filter((x) => !x.deleted_at)) await saveLocal('sets', { ...s, deleted_at: t })
  await saveLocal('sessions', { ...session, deleted_at: t })
}

export interface SessionSummary {
  durationSeconds: number
  volumeKg: number
  reps: number
  setsDone: number
  records: PersonalRecord[]
}

// Conclui: Séries não feitas viram puladas, fim salvo, recordes e Rotação (FR-1, FR-9, FR-27)
export async function finishSession(sessionId: string, ownerId: string): Promise<SessionSummary> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Sessão não encontrada')
  const endedAt = session.ended_at ?? now()
  const sets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter((s) => !s.deleted_at)
  for (const s of sets.filter((x) => x.status === 'pending')) await saveLocal('sets', { ...s, status: 'skipped', completed_at: null })
  await saveLocal('sessions', { ...session, ended_at: endedAt })

  if (session.rotation_item_id) await markRotationDone(session, ownerId)
  return summarizeSession(sessionId)
}

// Resumo de uma Sessão concluída (também ao reabrir a tela de resumo)
export async function summarizeSession(sessionId: string): Promise<SessionSummary> {
  const session = await db.sessions.get(sessionId)
  if (!session?.ended_at) throw new Error('Sessão não concluída')
  const endedAt = session.ended_at
  const finalSets = (await db.sets.where('session_id').equals(sessionId).toArray()).filter((s) => !s.deleted_at)
  const exerciseIds = [...new Set(finalSets.map((s) => s.exercise_id))]
  const history = (await db.sets.where('exercise_id').anyOf(exerciseIds).toArray()).filter((s) => s.session_id !== sessionId)
  const finishedIds = new Set(
    (await db.sessions.bulkGet([...new Set(history.map((s) => s.session_id))])).filter((s) => s?.ended_at && !s.deleted_at).map((s) => s!.id),
  )
  const stats = sessionStats(finalSets)
  return {
    durationSeconds: elapsedSeconds(session.started_at, new Date(endedAt).getTime()),
    volumeKg: stats.volumeKg,
    reps: stats.reps,
    setsDone: stats.setsDone,
    records: findRecords(finalSets, history.filter((s) => finishedIds.has(s.session_id))),
  }
}

// O treino feito resolve a primeira ocorrência ainda aberta daquele item da Rotação (FR-1)
async function markRotationDone(session: Session, ownerId: string) {
  const item = await db.rotation_items.get(session.rotation_item_id!)
  if (!item) return
  const items = (await db.rotation_items.where('rotation_id').equals(item.rotation_id).toArray())
    .filter((i) => !i.deleted_at)
    .sort((a, b) => a.position - b.position)
  const index = items.findIndex((i) => i.id === item.id)
  if (index < 0) return
  const occurrences = (await db.rotation_occurrences.where('rotation_id').equals(item.rotation_id).toArray()).filter((o) => !o.deleted_at)
  const resolved = new Set(occurrences.filter((o) => o.resolution).map((o) => o.seq))
  let seq = index
  while (resolved.has(seq)) seq += items.length
  const existing = occurrences.find((o) => o.seq === seq)
  await saveLocal('rotation_occurrences', {
    id: existing?.id ?? crypto.randomUUID(),
    owner_id: ownerId,
    rotation_id: item.rotation_id,
    seq,
    planned_on: existing?.planned_on ?? null,
    resolution: 'done',
    resolved_on: toLocalDate(new Date(session.started_at)),
    session_id: session.id,
    deleted_at: null,
  })
}

// ---------------------------------------------------------------------------
// O que a tela da Sessão mostra
// ---------------------------------------------------------------------------

export interface SessionExerciseView {
  position: number
  exerciseId: string
  name: string
  muscleGroup: string
  restSeconds: number
  sets: WorkoutSet[]
  previous: { weight: number | null; reps: number | null }[] // "Anterior", por posição da Série
}

export interface SessionView {
  session: Session
  title: string
  exercises: SessionExerciseView[]
  lastDone: { completedAt: string; restSeconds: number } | null // alimenta o timer de descanso
}

export interface SessionData {
  session: Session
  templateName: string | null
  sets: WorkoutSet[]
  exercises: { id: string; name: string; muscle_group: string; default_rest_seconds: number }[]
  templateRest: Record<string, number | null> // exercise_id → descanso do Template
  previous: Record<string, WorkoutSet[]> // exercise_id → Séries da última vez
}

export function buildSessionView(d: SessionData): SessionView {
  const live = d.sets.filter((s) => !s.deleted_at)
  const positions = [...new Set(live.map((s) => s.exercise_position))].sort((a, b) => a - b)
  const exercises = positions.map((position) => {
    const sets = live.filter((s) => s.exercise_position === position).sort((a, b) => a.set_position - b.set_position)
    const exerciseId = sets[0].exercise_id
    const ex = d.exercises.find((e) => e.id === exerciseId)
    return {
      position,
      exerciseId,
      name: ex?.name ?? 'Exercício',
      muscleGroup: ex?.muscle_group ?? '',
      restSeconds: d.templateRest[exerciseId] ?? ex?.default_rest_seconds ?? DEFAULT_REST,
      sets,
      previous: (d.previous[exerciseId] ?? []).map((s) => ({ weight: s.weight_kg, reps: s.reps })),
    }
  })
  const lastDoneSet = live
    .filter((s) => s.status === 'done' && s.completed_at)
    .sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1))[0]
  return {
    session: d.session,
    title: d.templateName ?? 'Treino livre',
    exercises,
    lastDone: lastDoneSet
      ? { completedAt: lastDoneSet.completed_at!, restSeconds: exercises.find((e) => e.exerciseId === lastDoneSet.exercise_id)?.restSeconds ?? DEFAULT_REST }
      : null,
  }
}

export async function loadSessionData(sessionId: string): Promise<SessionData | null> {
  const session = await db.sessions.get(sessionId)
  if (!session || session.deleted_at) return null
  const sets = await db.sets.where('session_id').equals(sessionId).toArray()
  const exerciseIds = [...new Set(sets.map((s) => s.exercise_id))]
  const exercises = (await db.exercises.bulkGet(exerciseIds)).filter((e) => e != null)
  const template = session.template_id ? await db.templates.get(session.template_id) : undefined
  const templateRows = session.template_id ? await db.template_exercises.where('template_id').equals(session.template_id).toArray() : []
  const previous: Record<string, WorkoutSet[]> = {}
  for (const id of exerciseIds) previous[id] = await lastSetsFor(id, sessionId)
  return {
    session,
    templateName: template?.name ?? null,
    sets,
    exercises,
    templateRest: Object.fromEntries(templateRows.filter((r) => !r.deleted_at).map((r) => [r.exercise_id, r.rest_seconds])),
    previous,
  }
}
