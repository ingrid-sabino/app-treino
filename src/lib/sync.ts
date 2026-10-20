import type { SupabaseClient } from '@supabase/supabase-js'
import Dexie from 'dexie'
import { db, type SyncedTable } from './db'

// Sincronização Dexie ↔ Supabase (FR-8). Toda escrita vai primeiro para o Dexie
// e entra na fila (outbox); aqui a fila sobe e as mudanças do servidor descem.
// Enquanto uma linha tem envio pendente, a versão do aparelho vale.

// Ordem de dependência: pais antes dos filhos (chaves estrangeiras)
export const SYNC_ORDER: SyncedTable[] = [
  'exercises',
  'templates',
  'template_exercises',
  'rotations',
  'rotation_items',
  'sessions',
  'sets',
  'cardio_details',
  'body_logs',
  'rotation_occurrences',
]

const keyOf = (table: SyncedTable) => (table === 'cardio_details' ? 'session_id' : 'id')
const PAGE = 500
// Folga na leitura incremental: cobre relógio do aparelho atrasado em relação ao servidor
const PULL_OVERLAP_MS = 5 * 60 * 1000

type Cursor = Partial<Record<SyncedTable, string>>

function cursorKey(userId: string) {
  return `tonus-sync:${userId}`
}

function readCursor(userId: string): Cursor {
  try {
    return JSON.parse(localStorage.getItem(cursorKey(userId)) ?? '{}')
  } catch {
    return {}
  }
}

function writeCursor(userId: string, cursor: Cursor) {
  try {
    localStorage.setItem(cursorKey(userId), JSON.stringify(cursor))
  } catch {
    // sem armazenamento: a próxima sincronização lê tudo de novo (idempotente)
  }
}

export interface SyncResult {
  pushed: number
  pulled: number
  failed: number
}

export async function pushOutbox(client: SupabaseClient): Promise<{ pushed: number; failed: number }> {
  const entries = await db.outbox.orderBy('seq').toArray()
  let pushed = 0
  let failed = 0
  for (const table of SYNC_ORDER) {
    const forTable = entries.filter((e) => e.table === table)
    if (forTable.length === 0) continue
    const ids = [...new Set(forTable.map((e) => e.row_id))]
    const rows = (await (db[table] as Dexie.Table).bulkGet(ids)).filter(Boolean) as Record<string, unknown>[]
    const ok = new Set<string>()

    const { error } = await client.from(table).upsert(rows, { onConflict: keyOf(table) })
    if (!error) {
      ids.forEach((id) => ok.add(id))
    } else {
      // Lote recusado: tenta linha a linha para uma linha ruim não travar as outras
      for (const row of rows) {
        const res = await client.from(table).upsert(row, { onConflict: keyOf(table) })
        if (res.error) failed++
        else ok.add(String(row[keyOf(table)]))
      }
      // Linhas que sumiram do aparelho não têm o que enviar
      ids.filter((id) => !rows.some((r) => String(r[keyOf(table)]) === id)).forEach((id) => ok.add(id))
    }

    // Só sai da fila o que foi lido aqui; escritas novas durante o envio ficam para a próxima
    const done = forTable.filter((e) => ok.has(e.row_id)).map((e) => e.seq!)
    await db.outbox.bulkDelete(done)
    pushed += ok.size
  }
  return { pushed, failed }
}

export async function pullChanges(client: SupabaseClient, userId: string): Promise<number> {
  const cursor = readCursor(userId)
  const pending = new Set((await db.outbox.toArray()).map((e) => `${e.table}:${e.row_id}`))
  let pulled = 0

  for (const table of SYNC_ORDER) {
    const since = cursor[table] ? new Date(new Date(cursor[table]!).getTime() - PULL_OVERLAP_MS).toISOString() : '1970-01-01T00:00:00Z'
    let from = 0
    let maxSeen = cursor[table]
    for (;;) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .gt('updated_at', since)
        .order('updated_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      const rows = (data ?? []) as Record<string, unknown>[]
      const fresh = rows.filter((r) => !pending.has(`${table}:${String(r[keyOf(table)])}`))
      if (fresh.length) await (db[table] as Dexie.Table).bulkPut(fresh)
      pulled += fresh.length
      for (const r of rows) {
        const u = String(r.updated_at)
        if (!maxSeen || u > maxSeen) maxSeen = u
      }
      if (rows.length < PAGE) break
      from += PAGE
    }
    if (maxSeen) cursor[table] = maxSeen
  }
  writeCursor(userId, cursor)
  return pulled
}

let running: Promise<SyncResult> | null = null

// Sobe a fila e desce as mudanças; chamadas simultâneas reaproveitam a que está rodando
export function runSync(client: SupabaseClient, userId: string): Promise<SyncResult> {
  if (running) return running
  running = (async () => {
    const { pushed, failed } = await pushOutbox(client)
    const pulled = await pullChanges(client, userId)
    return { pushed, pulled, failed }
  })().finally(() => {
    running = null
  })
  return running
}
