import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { defaultSlots, extractJson, importProgram, matchExercise, parseProgram, ProgramSchema, unmatchedNames } from './program'
import { buildPrompt, PRESET_PROGRAMS } from './programPrompts'
import { sampleCatalog } from './sample'

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

const catalog = sampleCatalog()

const program = {
  name: 'Teste A/B',
  days_per_week: 3,
  workouts: [
    { name: 'Treino A', exercises: [{ name: 'supino reto', sets: 3, reps: '8-12' }, { name: 'Remada serrote', sets: 3, reps: 10, rest_seconds: 60 }] },
    { name: 'Treino B', focus: 'Pernas', exercises: [{ name: 'Leg press', sets: 4, reps: '10' }, { name: 'Afundo búlgaro no smith', sets: 3, reps: '8' }] },
    { name: 'Corrida leve', modality: 'run', notes: '30 min leve' },
  ],
}

describe('formato do Programa (FR-11)', () => {
  it('acha o JSON dentro da resposta da IA, com texto e bloco ```json', () => {
    const text = `Claro! Aqui está:\n\n\`\`\`json\n${JSON.stringify(program)}\n\`\`\`\n\nBons treinos!`
    expect(extractJson(text)).toEqual(program)
  })

  it('valida e explica o erro em português, apontando onde', () => {
    const bad = { ...program, days_per_week: undefined, workouts: [{ name: 'Treino A', exercises: [] }] }
    const res = parseProgram(JSON.stringify(bad))
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.errors).toContain('dias por semana: campo obrigatório faltando')
    expect(res.errors).toContain('treinos › Treino A › Exercícios: treino de musculação sem Exercícios')
  })

  it('texto sem JSON dá uma mensagem clara', () => {
    const res = parseProgram('não sei')
    expect(res.ok).toBe(false)
  })

  it('Programas prontos seguem o formato e só usam Exercícios do catálogo (FR-14)', () => {
    for (const p of PRESET_PROGRAMS) {
      const parsed = ProgramSchema.parse(p)
      expect(unmatchedNames(parsed, catalog), p.name).toEqual([])
    }
  })
})

describe('casamento com o catálogo (FR-12)', () => {
  it('casa sem acento, com caixa diferente e por apelido', () => {
    expect(matchExercise('SUPINO RETO', catalog).exercise?.name).toBe('Supino reto')
    expect(matchExercise('Remada serrote', catalog).exercise?.name).toBe('Remada unilateral com halter')
    expect(matchExercise('Leg press', catalog).exercise?.name).toBe('Leg press 45°')
  })

  it('o que não casa vem sinalizado, com sugestão parecida', () => {
    const m = matchExercise('Afundo búlgaro no smith', catalog)
    expect(m.exercise).toBeNull()
    expect(m.suggestion).not.toBeNull()
    expect(unmatchedNames(ProgramSchema.parse(program), catalog)).toEqual(['Afundo búlgaro no smith'])
  })
})

describe('Prompt-modelo (FR-10)', () => {
  it('leva o JSON Schema, o objetivo e o catálogo', () => {
    const text = buildPrompt({ goal: 'hypertrophy', level: 'beginner', daysPerWeek: 4, minutes: 60, context: '', catalog: catalog.map((e) => e.name) })
    expect(text).toContain('"days_per_week"')
    expect(text).toContain('hipertrofia')
    expect(text).toContain('Agachamento búlgaro')
  })
})

describe('importação (FR-13)', () => {
  it('cria Templates, Exercício novo e a Rotação ativa na data escolhida, arquivando a anterior', async () => {
    await db.exercises.bulkPut(catalog)
    await db.rotations.put({
      id: 'old', owner_id: 'u1', name: 'Antiga', source: 'manual', program_meta: null, starts_on: '2026-10-01',
      is_active: true, archived_at: null, weekly_slots: [1, 1, 1, 1, 1, 0, 0], updated_at: '', deleted_at: null,
    })
    const parsed = ProgramSchema.parse(program)
    const id = await importProgram(parsed, {
      ownerId: 'u1',
      catalog,
      resolutions: { 'afundo bulgaro no smith': { kind: 'create', muscleGroup: 'pernas' } },
      startsOn: '2026-10-26',
      weeklySlots: defaultSlots(3),
      source: 'ai_import',
    })
    const rotation = await db.rotations.get(id)
    expect(rotation).toMatchObject({ name: 'Teste A/B', is_active: true, starts_on: '2026-10-26', source: 'ai_import', weekly_slots: [1, 0, 1, 0, 1, 0, 0] })
    expect((await db.rotations.get('old'))?.is_active).toBe(false)

    const items = (await db.rotation_items.where('rotation_id').equals(id).sortBy('position')).map((i) => [i.label, i.modality])
    expect(items).toEqual([['Treino A', 'strength'], ['Treino B', 'strength'], ['Corrida leve', 'run']])

    const created = await db.exercises.filter((e) => e.owner_id === 'u1').toArray()
    expect(created.map((e) => [e.name, e.muscle_group])).toEqual([['Afundo búlgaro no smith', 'pernas']])

    const templates = await db.templates.toArray()
    expect(templates).toHaveLength(3)
    const b = templates.find((t) => t.name === 'Treino B')!
    const rows = await db.template_exercises.where('template_id').equals(b.id).sortBy('position')
    expect(rows.map((r) => [r.target_sets, r.target_reps])).toEqual([[4, '10'], [3, '8']])
    expect(await db.outbox.count()).toBeGreaterThan(0) // tudo vai para o Supabase na próxima sincronização
  })
})
