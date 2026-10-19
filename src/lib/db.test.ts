import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { TonusDB, db, saveLocal } from './db'

afterEach(async () => {
  await db.delete()
  await db.open()
})

describe('Dexie local', () => {
  it('abre com todas as tabelas do MVP', async () => {
    const local = new TonusDB('teste-tabelas')
    await local.open()
    expect(local.tables.map((t) => t.name).sort()).toEqual([
      'body_logs',
      'cardio_details',
      'exercises',
      'outbox',
      'rotation_items',
      'rotations',
      'sessions',
      'sets',
      'template_exercises',
      'templates',
    ])
    await local.delete()
  })

  it('saveLocal grava a linha e a coloca na fila de sincronização', async () => {
    const id = crypto.randomUUID()
    await saveLocal('sessions', {
      id,
      owner_id: 'u1',
      rotation_item_id: null,
      template_id: null,
      modality: 'strength',
      started_at: '2026-10-20T10:00:00.000Z',
      ended_at: null,
      effort: null,
      notes: null,
    })
    const saved = await db.sessions.get(id)
    expect(saved?.started_at).toBe('2026-10-20T10:00:00.000Z')
    expect(saved?.updated_at).toBeTruthy()
    const queued = await db.outbox.toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({ table: 'sessions', row_id: id })
  })
})
