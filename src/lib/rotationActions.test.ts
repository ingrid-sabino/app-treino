import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { moveOccurrence, skipOccurrence } from './rotationActions'
import { planSchedule } from './schedule'

const SLOTS = [1, 1, 0, 1, 1, 0, 0]
const MON = '2026-10-19'

async function plan() {
  const occurrences = await db.rotation_occurrences.toArray()
  return planSchedule({ itemCount: 6, weeklySlots: SLOTS, occurrences, today: MON, until: '2026-10-25' }).map(
    (p) => `${p.date.slice(8)} ${'ABCDEF'[p.itemIndex]}`,
  )
}

afterEach(async () => {
  await db.rotation_occurrences.clear()
  await db.outbox.clear()
})

describe('Pular e Mudar dia gravam na Agenda', () => {
  it('pular o A põe o B no lugar dele', async () => {
    await skipOccurrence({ ownerId: 'u', rotationId: 'r', occurrences: [] }, 0, MON)
    expect(await plan()).toEqual(['19 B', '20 C', '22 D', '23 E'])
    expect(await db.outbox.count()).toBe(1) // vai para a fila de sincronização
  })

  it('arrastar o C de quinta para sábado deixa a quinta livre', async () => {
    await moveOccurrence({ ownerId: 'u', rotationId: 'r', occurrences: [] }, 2, '2026-10-24')
    expect(await plan()).toEqual(['19 A', '20 B', '23 D', '24 C'])
  })

  it('mover de novo atualiza a mesma ocorrência', async () => {
    const t = { ownerId: 'u', rotationId: 'r', occurrences: [] }
    await moveOccurrence(t, 2, '2026-10-24')
    const occurrences = await db.rotation_occurrences.toArray()
    await moveOccurrence({ ...t, occurrences }, 2, '2026-10-25')
    expect(await db.rotation_occurrences.count()).toBe(1)
    expect(await plan()).toEqual(['19 A', '20 B', '23 D', '25 C'])
  })
})
