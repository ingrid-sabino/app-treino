import { describe, expect, it } from 'vitest'
import { sampleTodayData } from './sample'
import { buildTodayModel } from './today'

const TUE = '2026-10-20'

describe('tela Hoje', () => {
  it('mostra o Treino B hoje, depois que o A foi feito na segunda', () => {
    const model = buildTodayModel(sampleTodayData(), TUE, new Date('2026-10-20T12:00:00'))
    expect(model.next).toMatchObject({ label: 'Treino B', notes: 'Costas e bíceps', exerciseCount: 6, setCount: 18 })
    expect(model.next?.dateLabel).toBe('Hoje · ter 20/10')
  })

  it('semana: A feito na segunda e o resto planejado na ordem da Rotação', () => {
    const model = buildTodayModel(sampleTodayData(), TUE, new Date('2026-10-20T12:00:00'))
    expect(model.week[0].items).toEqual([{ modality: 'strength', status: 'done' }])
    expect(model.week[2].items).toEqual([{ modality: 'run', status: 'planned' }]) // qua: corrida leve
    expect(model.week[5].items.map((i) => i.modality)).toEqual(['run', 'yoga']) // sáb: 2 treinos
    expect(model.doneThisWeek).toBe(1)
    expect(model.plannedThisWeek).toBe(7)
  })

  it('Volume da semana soma peso × reps das Séries feitas (FR-26)', () => {
    const model = buildTodayModel(sampleTodayData(), TUE, new Date('2026-10-20T12:00:00'))
    expect(model.volumeKg).toBe(18 * 40 * 10)
  })

  it('sem Rotação ativa não há Próximo treino', () => {
    const data = { ...sampleTodayData(), rotation: null, items: [], occurrences: [] }
    const model = buildTodayModel(data, TUE)
    expect(model.next).toBeNull()
    expect(model.hasRotation).toBe(false)
  })
})
