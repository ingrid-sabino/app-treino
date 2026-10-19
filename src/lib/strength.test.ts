import { describe, expect, it } from 'vitest'
import { estimateOneRepMax } from './strength'

describe('1RM estimado (Epley)', () => {
  it('100 kg × 5 reps ≈ 116,7 kg', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2)
  })
  it('1 rep é o próprio peso', () => {
    expect(estimateOneRepMax(80, 1)).toBe(80)
  })
  it('sem peso ou sem reps não há estimativa', () => {
    expect(estimateOneRepMax(0, 10)).toBe(0)
    expect(estimateOneRepMax(50, 0)).toBe(0)
  })
})
