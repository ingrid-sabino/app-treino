import { EXERCISE_INFO, MUSCLE_NAMES, highlightFor } from './exerciseInfo'
import { describe, expect, it } from 'vitest'
import { PICTOGRAMS } from './pictograms'
import { sampleCatalog } from './sample'

describe('pictogramas', () => {
  it('todo Exercício do catálogo inicial tem pictograma', () => {
    const missing = sampleCatalog().filter((e) => !PICTOGRAMS[e.name]).map((e) => e.name)
    expect(missing).toEqual([])
  })

  it('início e fim têm os mesmos elementos (a animação interpola um no outro)', () => {
    for (const [name, def] of Object.entries(PICTOGRAMS)) {
      for (const key of ['plates', 'weights', 'pads', 'lines', 'cables'] as const) {
        expect(def.start[key]?.length ?? 0, `${name}: ${key}`).toBe(def.end[key]?.length ?? 0)
      }
      for (const key of ['farElbow', 'farHand', 'farKnee', 'farFoot'] as const) {
        expect(Boolean(def.start[key]), `${name}: ${key}`).toBe(Boolean(def.end[key]))
      }
    }
  })
})


describe('ficha do Exercício', () => {
  it('todo Exercício do catálogo tem ficha com músculo principal e passos', () => {
    for (const e of sampleCatalog()) {
      const info = EXERCISE_INFO[e.name]
      expect(info, e.name).toBeDefined()
      expect(info.primary.length, e.name).toBeGreaterThan(0)
      expect(info.howTo.length, e.name).toBeGreaterThanOrEqual(3)
    }
  })

  it('todo músculo tem nome em português e acende alguma parte da figura', () => {
    for (const [name, info] of Object.entries(EXERCISE_INFO)) {
      for (const m of [...info.primary, ...info.secondary]) expect(MUSCLE_NAMES[m], `${name}: ${m}`).toBeDefined()
      expect(Object.values(highlightFor(info)), name).toContain('primary')
    }
  })
})
