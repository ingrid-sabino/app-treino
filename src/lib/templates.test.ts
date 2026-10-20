import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addExercise, emptyDraft, loadDraft, moveExercise, saveDraft } from './templates'

const ex = (id: string, name: string) => ({ id, owner_id: null, name, muscle_group: 'costas', equipment: null, default_rest_seconds: 120, updated_at: '', deleted_at: null })

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('editor de Template', () => {
  it('salva o Template com os Exercícios na ordem escolhida e lê de volta', async () => {
    await db.exercises.bulkPut([ex('a', 'Puxada frontal'), ex('b', 'Remada baixa')])
    let draft = { ...emptyDraft(), name: 'Treino B', notes: 'Costas e bíceps' }
    draft = addExercise(addExercise(draft, ex('a', 'Puxada frontal')), ex('b', 'Remada baixa'))
    draft = moveExercise(draft, 1, -1) // remada primeiro
    await saveDraft(draft, 'u1')
    const back = await loadDraft(draft.id)
    expect(back?.name).toBe('Treino B')
    expect(back?.exercises.map((e) => e.name)).toEqual(['Remada baixa', 'Puxada frontal'])
    expect(back?.exercises[0].restSeconds).toBe(120) // descanso padrão do Exercício
  })

  it('remover um Exercício marca a linha como removida (vai para o Supabase)', async () => {
    await db.exercises.bulkPut([ex('a', 'Puxada frontal'), ex('b', 'Remada baixa')])
    const draft = addExercise(addExercise({ ...emptyDraft(), name: 'B' }, ex('a', 'Puxada frontal')), ex('b', 'Remada baixa'))
    await saveDraft(draft, 'u1')
    await saveDraft({ ...draft, exercises: draft.exercises.slice(0, 1) }, 'u1')
    const rows = await db.template_exercises.toArray()
    expect(rows.filter((r) => r.deleted_at).length).toBe(1)
    expect((await loadDraft(draft.id))?.exercises).toHaveLength(1)
  })
})
