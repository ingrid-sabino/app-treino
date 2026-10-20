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
