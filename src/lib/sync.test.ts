import 'fake-indexeddb/auto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it } from 'vitest'
import { db, saveLocal } from './db'
import { pullChanges, pushOutbox } from './sync'

// Supabase de mentira, em memória: upsert por chave e leitura incremental por updated_at
function fakeSupabase(rejectIds: string[] = []) {
  const tables: Record<string, Map<string, Record<string, unknown>>> = {}
  const t = (name: string) => (tables[name] ??= new Map())
  const client = {
    from(name: string) {
      return {
        async upsert(rows: Record<string, unknown> | Record<string, unknown>[], opts: { onConflict: string }) {
          const list = Array.isArray(rows) ? rows : [rows]
          if (list.some((r) => rejectIds.includes(String(r.id)))) return { error: { message: 'recusada' } }
          list.forEach((r) => t(name).set(String(r[opts.onConflict]), r))
          return { error: null }
        },
        select() {
          let since = ''
          const q = {
            gt(_col: string, v: string) {
              since = v
              return q
            },
            order() {
              return q
            },
            async range(a: number, b: number) {
              const rows = [...t(name).values()]
                .filter((r) => String(r.updated_at) > since)
                .sort((x, y) => (String(x.updated_at) < String(y.updated_at) ? -1 : 1))
              return { data: rows.slice(a, b + 1), error: null }
            },
          }
          return q
        },
      }
    },
  }
  return { client: client as unknown as SupabaseClient, tables: t }
}

const exercise = (id: string, name: string) => ({
  id,
  owner_id: 'u1',
  name,
  muscle_group: 'costas',
  equipment: null,
  default_rest_seconds: 90,
  deleted_at: null,
})

afterEach(async () => {
  await Promise.all(db.tables.map((tb) => tb.clear()))
  globalThis.localStorage?.clear()
})

describe('sincronização', () => {
  it('envia a fila para o Supabase e esvazia a fila', async () => {
    const { client, tables } = fakeSupabase()
    await saveLocal('exercises', exercise('e1', 'Remada unilateral'))
    const res = await pushOutbox(client)
    expect(res).toEqual({ pushed: 1, failed: 0 })
    expect(tables('exercises').get('e1')?.name).toBe('Remada unilateral')
    expect(await db.outbox.count()).toBe(0)
  })

  it('uma linha recusada fica na fila sem travar as outras', async () => {
    const { client, tables } = fakeSupabase(['ruim'])
    await saveLocal('exercises', exercise('boa', 'Puxada'))
    await saveLocal('exercises', exercise('ruim', 'Quebrada'))
    const res = await pushOutbox(client)
    expect(res.failed).toBe(1)
    expect(tables('exercises').has('boa')).toBe(true)
    expect((await db.outbox.toArray()).map((e) => e.row_id)).toEqual(['ruim'])
  })

  it('puxa o catálogo do servidor para o aparelho', async () => {
    const { client, tables } = fakeSupabase()
    tables('exercises').set('g1', { ...exercise('g1', 'Supino reto'), owner_id: null, updated_at: '2026-10-19T00:00:00Z' })
    const pulled = await pullChanges(client, 'u1')
    expect(pulled).toBe(1)
    expect((await db.exercises.get('g1'))?.name).toBe('Supino reto')
  })

  it('não sobrescreve uma edição local que ainda não subiu', async () => {
    const { client, tables } = fakeSupabase()
    await saveLocal('exercises', exercise('e1', 'Nome novo no aparelho'))
    tables('exercises').set('e1', { ...exercise('e1', 'Nome velho no servidor'), updated_at: '2026-10-19T00:00:00Z' })
    await pullChanges(client, 'u1')
    expect((await db.exercises.get('e1'))?.name).toBe('Nome novo no aparelho')
  })
})
