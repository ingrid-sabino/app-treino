import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { emptyRotation, loadRotation, moveItem, saveRotation, type DraftItem, type RotationDraft } from './rotations'

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

const item = (label: string, modality: 'strength' | 'run' = 'strength'): DraftItem => ({ key: crypto.randomUUID(), templateId: null, modality, label })

describe('montagem da Rotação', () => {
  it('salva os treinos na ordem e os Dias de treino', async () => {
    let draft: RotationDraft = { ...emptyRotation(), name: 'Força + corrida', weeklySlots: [1, 1, 0, 1, 1, 2, 0], items: [item('Treino A'), item('Corrida leve', 'run'), item('Treino B')] }
    draft = moveItem(draft, 2, -1) // B antes da corrida
    await saveRotation(draft, 'u1', true)
    const back = await loadRotation(draft.id)
    expect(back?.items.map((i) => i.label)).toEqual(['Treino A', 'Treino B', 'Corrida leve'])
    expect(back?.weeklySlots).toEqual([1, 1, 0, 1, 1, 2, 0])
    expect(back?.isActive).toBe(true)
  })

  it('ativar uma Rotação nova arquiva a anterior (FR-13)', async () => {
    const first = { ...emptyRotation(), name: 'Antiga', items: [item('A')] }
    await saveRotation(first, 'u1', true)
    const second = { ...emptyRotation(), name: 'Nova', items: [item('X')] }
    await saveRotation(second, 'u1', true)
    const active = await db.rotations.filter((r) => r.is_active).toArray()
    expect(active.map((r) => r.name)).toEqual(['Nova'])
    expect((await db.rotations.get(first.id))?.archived_at).toBeTruthy()
    // a desativação entra na fila antes da ativação (uma só ativa no Supabase)
    const order = (await db.outbox.toArray()).filter((e) => e.table === 'rotations').map((e) => e.row_id)
    expect(order.lastIndexOf(first.id)).toBeLessThan(order.lastIndexOf(second.id))
  })

  it('remover um treino marca a linha como removida', async () => {
    const draft = { ...emptyRotation(), name: 'R', items: [item('A'), item('B')] }
    await saveRotation(draft, 'u1', true)
    await saveRotation({ ...draft, items: draft.items.slice(0, 1) }, 'u1', false)
    expect((await loadRotation(draft.id))?.items).toHaveLength(1)
    expect((await db.rotation_items.toArray()).filter((r) => r.deleted_at)).toHaveLength(1)
  })
})
