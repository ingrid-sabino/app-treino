import { describe, expect, it } from 'vitest'
import { buildProgressModel } from './progress'
import { sampleProgressData, sampleTodayData } from './sample'
import { buildTrainModel } from './train'

describe('aba Treinar', () => {
  it('lista a Rotação na ordem e marca o Treino B como próximo', () => {
    const model = buildTrainModel(sampleTodayData(), '2026-10-20')
    expect(model.rotation?.items.map((i) => i.label)).toEqual([
      'Treino A', 'Treino B', 'Corrida leve 5 km', 'Treino C', 'Treino D', 'Corrida longa 10 km', 'Hot yoga',
    ])
    expect(model.rotation?.items.find((i) => i.isNext)?.label).toBe('Treino B')
    expect(model.templates.find((t) => t.name === 'Treino C')?.exerciseCount).toBe(7)
  })
})

describe('aba Evolução', () => {
  it('curva de força pelo melhor 1RM estimado de cada dia (Epley)', () => {
    const model = buildProgressModel(sampleProgressData(), '2026-10-20')
    const supino = model.strength.find((s) => s.name === 'Supino reto')!
    expect(supino.points).toHaveLength(8)
    expect(supino.points[0].value).toBeCloseTo(50 * (1 + 5 / 30), 1)
    expect(supino.change).toBeGreaterThan(0)
  })

  it('peso corporal em ordem de data', () => {
    const model = buildProgressModel(sampleProgressData(), '2026-10-20')
    expect(model.weight.map((w) => w.date)).toEqual([...model.weight.map((w) => w.date)].sort())
    expect(model.weight.at(-1)?.value).toBe(79.8)
  })
})
