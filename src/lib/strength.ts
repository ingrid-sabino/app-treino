// 1RM estimado pela fórmula de Epley (FR-9, FR-22): peso × (1 + reps / 30).
// Com 1 rep o 1RM é o próprio peso. Acima de ~12 reps a estimativa perde precisão.
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}
