import Dexie, { type EntityTable } from 'dexie'

// Banco local (IndexedDB). Toda escrita da Sessão vai primeiro para cá e
// sincroniza com o Supabase quando há rede (FR-8). Os campos seguem os nomes
// das colunas em supabase/migrations para a sincronização ser 1:1.

export type Modality = 'strength' | 'run' | 'ride' | 'yoga' | 'other'
export type SetStatus = 'pending' | 'done' | 'skipped'

// Campos de controle locais, presentes em toda linha sincronizável
interface Syncable {
  id: string // uuid gerado no app (crypto.randomUUID), igual ao do Postgres
  updated_at: string
  deleted_at?: string | null // remoção lógica, para a exclusão chegar ao Supabase
}

export interface Exercise extends Syncable {
  owner_id: string | null // null = catálogo global
  name: string
  muscle_group: string
  equipment: string | null
  default_rest_seconds: number
}

export interface Template extends Syncable {
  owner_id: string
  name: string
  modality: Modality
  notes: string | null
  archived_at: string | null
}

export interface TemplateExercise extends Syncable {
  template_id: string
  exercise_id: string
  position: number
  target_sets: number
  target_reps: string
  target_weight_kg: number | null
  rest_seconds: number | null
}

export interface Rotation extends Syncable {
  owner_id: string
  name: string
  source: 'manual' | 'ai_import' | 'preset'
  program_meta: unknown
  starts_on: string
  is_active: boolean
  archived_at: string | null
  weekly_slots: number[] // Dias de treino: treinos por dia, de segunda [0] a domingo [6] (FR-34)
}

export interface RotationItem extends Syncable {
  rotation_id: string
  position: number
  template_id: string | null
  modality: Modality
  label: string
}

export interface Session extends Syncable {
  owner_id: string
  rotation_item_id: string | null
  template_id: string | null
  modality: Modality
  started_at: string // Duração sempre derivada daqui (FR-25)
  ended_at: string | null
  effort: number | null
  notes: string | null
}

export interface WorkoutSet extends Syncable {
  session_id: string
  exercise_id: string
  exercise_position: number
  set_position: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  status: SetStatus
  completed_at: string | null
}

export interface CardioDetail {
  session_id: string
  updated_at: string
  deleted_at?: string | null
  distance_km: number | null
  moving_seconds: number | null
  source: 'manual' | 'strava'
  external_id: string | null
}

export interface BodyLog extends Syncable {
  owner_id: string
  logged_on: string
  weight_kg: number | null
  waist_cm: number | null
  chest_cm: number | null
  hip_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  notes: string | null
}

// Ocorrência da Rotação: a seq-ésima vez na fila (item = seq mod nº de itens).
// Só existe linha quando a ocorrência foi feita, pulada ou movida (FR-2, FR-35).
export interface RotationOccurrence extends Syncable {
  owner_id: string
  rotation_id: string
  seq: number
  planned_on: string | null // AAAA-MM-DD para onde foi movida
  resolution: 'done' | 'skipped' | null
  resolved_on: string | null
  session_id: string | null
}

// Fila de envio: cada escrita local entra aqui até o Supabase confirmar
export interface OutboxEntry {
  seq?: number
  table: SyncedTable
  row_id: string
  queued_at: string
}

export type SyncedTable =
  | 'exercises'
  | 'templates'
  | 'template_exercises'
  | 'rotations'
  | 'rotation_items'
  | 'rotation_occurrences'
  | 'sessions'
  | 'sets'
  | 'cardio_details'
  | 'body_logs'

export class TonusDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  templates!: EntityTable<Template, 'id'>
  template_exercises!: EntityTable<TemplateExercise, 'id'>
  rotations!: EntityTable<Rotation, 'id'>
  rotation_items!: EntityTable<RotationItem, 'id'>
  rotation_occurrences!: EntityTable<RotationOccurrence, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<WorkoutSet, 'id'>
  cardio_details!: EntityTable<CardioDetail, 'session_id'>
  body_logs!: EntityTable<BodyLog, 'id'>
  outbox!: EntityTable<OutboxEntry, 'seq'>

  constructor(name = 'tonus') {
    super(name)
    // Só campos indexados aqui; o resto da linha é guardado igual.
    this.version(1).stores({
      exercises: 'id, owner_id, name, muscle_group',
      templates: 'id, owner_id',
      template_exercises: 'id, template_id, [template_id+position]',
      rotations: 'id, owner_id, is_active',
      rotation_items: 'id, rotation_id, [rotation_id+position]',
      sessions: 'id, owner_id, started_at, ended_at, rotation_item_id',
      sets: 'id, session_id, exercise_id, [session_id+exercise_position+set_position]',
      cardio_details: 'session_id',
      body_logs: 'id, owner_id, logged_on',
      outbox: '++seq, table, row_id',
    })
    // 0002: Ocorrências da Rotação (pular e mudar o dia de um treino)
    this.version(2).stores({
      rotation_occurrences: 'id, rotation_id, [rotation_id+seq]',
    })
  }
}

export const db = new TonusDB()

interface RowByTable {
  exercises: Exercise
  templates: Template
  template_exercises: TemplateExercise
  rotations: Rotation
  rotation_items: RotationItem
  rotation_occurrences: RotationOccurrence
  sessions: Session
  sets: WorkoutSet
  cardio_details: CardioDetail
  body_logs: BodyLog
}

// Grava uma linha e a coloca na fila de sincronização, numa só transação.
export async function saveLocal<T extends SyncedTable>(
  table: T,
  row: Omit<RowByTable[T], 'updated_at'>,
): Promise<void> {
  const now = new Date().toISOString()
  const withStamp = { ...row, updated_at: now }
  // cardio_details usa session_id como chave; as demais, id
  const keyed = row as { id?: string; session_id?: string }
  const rowId = String(table === 'cardio_details' ? keyed.session_id : keyed.id)
  await db.transaction('rw', db[table], db.outbox, async () => {
    await (db[table] as Dexie.Table).put(withStamp)
    await db.outbox.add({ table, row_id: rowId, queued_at: now })
  })
}
