import { saveLocal, type RotationOccurrence } from './db'

// Escritas na Agenda da Rotação: pular (FR-2) e mudar o dia (FR-35).
// Cada uma grava/atualiza a ocorrência daquela posição da fila.

interface Target {
  ownerId: string
  rotationId: string
  occurrences: RotationOccurrence[]
}

async function upsert(t: Target, seq: number, patch: Partial<RotationOccurrence>) {
  const existing = t.occurrences.find((o) => o.seq === seq && !o.deleted_at)
  await saveLocal('rotation_occurrences', {
    id: existing?.id ?? crypto.randomUUID(),
    owner_id: t.ownerId,
    rotation_id: t.rotationId,
    seq,
    planned_on: existing?.planned_on ?? null,
    resolution: existing?.resolution ?? null,
    resolved_on: existing?.resolved_on ?? null,
    session_id: existing?.session_id ?? null,
    deleted_at: null,
    ...patch,
  })
}

export function skipOccurrence(t: Target, seq: number, on: string) {
  return upsert(t, seq, { resolution: 'skipped', resolved_on: on })
}

export function moveOccurrence(t: Target, seq: number, to: string) {
  return upsert(t, seq, { planned_on: to })
}
