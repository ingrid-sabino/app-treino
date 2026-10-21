import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db, type WorkoutSet } from './db'
import { saveRotation, emptyRotation } from './rotations'
import { nextWorkout } from './schedule'
import {
  activeSession,
  addSet,
  elapsedSeconds,
  finishSession,
  findRecords,
  formatClock,
  restRemaining,
  sessionStats,
  startSession,
  toggleSetDone,
} from './session'

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

const set = (p: Partial<WorkoutSet>): WorkoutSet => ({
  id: crypto.randomUUID(),
  session_id: 's',
  exercise_id: 'supino',
  exercise_position: 0,
  set_position: 0,
  weight_kg: 50,
  reps: 10,
  rpe: null,
  status: 'done',
  completed_at: null,
  updated_at: '',
  deleted_at: null,
  ...p,
})

async function seedTemplate() {
  await db.exercises.put({ id: 'supino', owner_id: null, name: 'Supino reto', muscle_group: 'peito', equipment: 'barra', default_rest_seconds: 90, updated_at: '', deleted_at: null })
  await db.templates.put({ id: 'tA', owner_id: 'u', name: 'Treino A', modality: 'strength', notes: null, archived_at: null, updated_at: '', deleted_at: null })
  await db.template_exercises.put({ id: 'te1', template_id: 'tA', exercise_id: 'supino', position: 0, target_sets: 3, target_reps: '8-12', target_weight_kg: null, rest_seconds: 120, updated_at: '', deleted_at: null })
}

describe('cálculos da Sessão', () => {
  it('FR-26: 3 Séries de 10 × 50 kg = 1.500 kg e 30 reps; puladas não contam', () => {
    const sets = [set({}), set({}), set({}), set({ status: 'skipped', weight_kg: 100 })]
    expect(sessionStats(sets)).toMatchObject({ volumeKg: 1500, reps: 30, setsDone: 3 })
  })

  it('FR-25: Duração vem do horário de início (10 min de tela bloqueada contam)', () => {
    const start = '2026-10-21T10:00:00.000Z'
    expect(elapsedSeconds(start, new Date('2026-10-21T10:10:00.000Z').getTime())).toBe(600)
    expect(formatClock(600)).toBe('10:00')
    expect(formatClock(3725)).toBe('1:02:05')
  })

  it('FR-6: descanso restante pelo horário em que a Série foi feita', () => {
    const done = '2026-10-21T10:00:00.000Z'
    expect(restRemaining(done, 90, new Date('2026-10-21T10:01:00.000Z').getTime())).toBe(30)
    expect(restRemaining(done, 90, new Date('2026-10-21T10:02:00.000Z').getTime())).toBeLessThan(0)
  })

  it('FR-9: recorde de peso e de 1RM estimado contra o histórico', () => {
    const history = [set({ weight_kg: 50, reps: 10 })]
    const current = [set({ weight_kg: 55, reps: 8 })]
    const records = findRecords(current, history)
    expect(records.map((r) => r.kind)).toEqual(['weight', 'oneRepMax'])
    expect(records[0]).toMatchObject({ value: 55, previous: 50 })
  })

  it('primeira vez no Exercício não conta como recorde', () => {
    expect(findRecords([set({ weight_kg: 80 })], [])).toEqual([])
  })
})

describe('Sessão no Dexie', () => {
  it('começa com as Séries do Template e pré-preenche com a última Sessão (FR-5)', async () => {
    await seedTemplate()
    const first = await startSession({ ownerId: 'u', templateId: 'tA', rotationItemId: null, modality: 'strength' })
    const sets1 = await db.sets.where('session_id').equals(first).toArray()
    expect(sets1).toHaveLength(3)
    expect(sets1[0].reps).toBe(8) // sem histórico: o primeiro número da faixa
    for (const s of sets1) await db.sets.put({ ...s, weight_kg: 40, reps: 10, status: 'done' })
    await finishSession(first, 'u')

    const second = await startSession({ ownerId: 'u', templateId: 'tA', rotationItemId: null, modality: 'strength' })
    const sets2 = await db.sets.where('session_id').equals(second).toArray()
    expect(sets2.map((s) => [s.weight_kg, s.reps])).toEqual([[40, 10], [40, 10], [40, 10]])
  })

  it('só uma Sessão em andamento por vez', async () => {
    const a = await startSession({ ownerId: 'u', templateId: null, rotationItemId: null, modality: 'strength' })
    const b = await startSession({ ownerId: 'u', templateId: null, rotationItemId: null, modality: 'strength' })
    expect(b).toBe(a)
    expect((await activeSession())?.id).toBe(a)
  })

  it('concluir pula o que não foi feito e devolve o resumo (FR-27)', async () => {
    await seedTemplate()
    const id = await startSession({ ownerId: 'u', templateId: 'tA', rotationItemId: null, modality: 'strength' })
    const sets = (await db.sets.where('session_id').equals(id).toArray()).sort((a, b) => a.set_position - b.set_position)
    await db.sets.put({ ...sets[0], weight_kg: 50, reps: 10 })
    await toggleSetDone((await db.sets.get(sets[0].id))!)
    await addSet(id, 'supino', 0) // uma Série a mais, sem fazer
    const summary = await finishSession(id, 'u')
    expect(summary).toMatchObject({ volumeKg: 500, reps: 10, setsDone: 1 })
    const after = await db.sets.where('session_id').equals(id).toArray()
    expect(after.filter((s) => s.status === 'skipped')).toHaveLength(3)
    expect(await activeSession()).toBeNull()
  })

  it('FR-1: concluir o Treino A faz o Próximo treino ser o B', async () => {
    await seedTemplate()
    const rot = { ...emptyRotation(), name: 'R', weeklySlots: [1, 1, 1, 1, 1, 1, 1], items: ['A', 'B', 'C'].map((l) => ({ key: `item-${l}`, templateId: l === 'A' ? 'tA' : null, modality: 'strength' as const, label: `Treino ${l}` })) }
    await saveRotation(rot, 'u', true)
    const id = await startSession({ ownerId: 'u', templateId: 'tA', rotationItemId: 'item-A', modality: 'strength' })
    await finishSession(id, 'u')
    const occurrences = await db.rotation_occurrences.toArray()
    const next = nextWorkout({ itemCount: 3, weeklySlots: rot.weeklySlots, occurrences, today: '2026-10-21' })
    expect(next?.itemIndex).toBe(1)
  })
})
