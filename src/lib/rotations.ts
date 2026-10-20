import { db, saveLocal, type Modality } from './db'
import { toLocalDate } from './schedule'

// Montagem da Rotação: rascunho em memória e gravação no Dexie (FR-4, FR-13, FR-34).

export interface DraftItem {
  key: string // id da linha rotation_items
  templateId: string | null // null = dia de cardio/yoga sem Template
  modality: Modality
  label: string
}

export interface RotationDraft {
  id: string
  isNew: boolean
  name: string
  items: DraftItem[]
  weeklySlots: number[]
  isActive: boolean
}

export function emptyRotation(): RotationDraft {
  return { id: crypto.randomUUID(), isNew: true, name: '', items: [], weeklySlots: [1, 1, 1, 1, 1, 0, 0], isActive: false }
}

export async function loadRotation(id: string): Promise<RotationDraft | null> {
  const r = await db.rotations.get(id)
  if (!r || r.deleted_at) return null
  const items = (await db.rotation_items.where('rotation_id').equals(id).toArray())
    .filter((i) => !i.deleted_at)
    .sort((a, b) => a.position - b.position)
  return {
    id: r.id,
    isNew: false,
    name: r.name,
    weeklySlots: r.weekly_slots,
    isActive: r.is_active,
    items: items.map((i) => ({ key: i.id, templateId: i.template_id, modality: i.modality, label: i.label })),
  }
}

export function moveItem(draft: RotationDraft, index: number, delta: -1 | 1): RotationDraft {
  const to = index + delta
  if (to < 0 || to >= draft.items.length) return draft
  const items = [...draft.items]
  ;[items[index], items[to]] = [items[to], items[index]]
  return { ...draft, items }
}

// Salva; com `activate`, esta vira a Rotação ativa a partir de hoje e a anterior é arquivada (FR-13)
export async function saveRotation(draft: RotationDraft, ownerId: string, activate: boolean): Promise<void> {
  const now = new Date().toISOString()
  const today = toLocalDate(new Date())
  if (activate) {
    // Desativar as outras primeiro: só pode haver uma ativa, e a fila de sincronização sobe nesta ordem
    const others = await db.rotations.filter((r) => r.is_active && r.id !== draft.id && !r.deleted_at).toArray()
    for (const r of others) await saveLocal('rotations', { ...r, is_active: false, archived_at: now })
  }
  const existing = await db.rotations.get(draft.id)
  const becomesActive = activate || (existing?.is_active ?? false)
  await saveLocal('rotations', {
    id: draft.id,
    owner_id: ownerId,
    name: draft.name.trim() || 'Rotação sem nome',
    source: existing?.source ?? 'manual',
    program_meta: existing?.program_meta ?? null,
    starts_on: activate && !existing?.is_active ? today : (existing?.starts_on ?? today),
    is_active: becomesActive,
    archived_at: becomesActive ? null : (existing?.archived_at ?? null),
    weekly_slots: draft.weeklySlots,
    deleted_at: null,
  })
  for (const [position, item] of draft.items.entries()) {
    await saveLocal('rotation_items', {
      id: item.key,
      rotation_id: draft.id,
      position,
      template_id: item.templateId,
      modality: item.modality,
      label: item.label.trim() || 'Treino',
      deleted_at: null,
    })
  }
  const keep = new Set(draft.items.map((i) => i.key))
  const old = await db.rotation_items.where('rotation_id').equals(draft.id).toArray()
  for (const row of old.filter((r) => !keep.has(r.id) && !r.deleted_at)) {
    await saveLocal('rotation_items', { ...row, deleted_at: now })
  }
}
