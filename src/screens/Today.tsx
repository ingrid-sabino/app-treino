import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db, saveLocal } from '../lib/db'
import { useAuth } from '../lib/auth'
import { addDays, nextWorkout, startOfWeek, toLocalDate } from '../lib/schedule'
import { buildTodayModel, type TodayData } from '../lib/today'
import TodayView from './TodayView'

async function loadTodayData(today: string): Promise<TodayData> {
  const rotation = (await db.rotations.filter((r) => r.is_active && !r.deleted_at).first()) ?? null
  const monday = startOfWeek(today)
  // Um dia de folga antes e depois cobre a diferença de fuso entre UTC e o horário local
  const weekSessions = await db.sessions
    .where('started_at')
    .between(addDays(monday, -1), addDays(monday, 8))
    .toArray()
  const weekSets = await db.sets.where('session_id').anyOf(weekSessions.map((s) => s.id)).toArray()
  if (!rotation) {
    return { rotation, items: [], occurrences: [], weekSessions, weekSets, templates: [], templateExercises: [] }
  }
  const items = await db.rotation_items.where('rotation_id').equals(rotation.id).toArray()
  const templateIds = items.map((i) => i.template_id).filter((id): id is string => Boolean(id))
  return {
    rotation,
    items,
    occurrences: await db.rotation_occurrences.where('rotation_id').equals(rotation.id).toArray(),
    weekSessions,
    weekSets,
    templates: await db.templates.bulkGet(templateIds).then((t) => t.filter((x) => x != null)),
    templateExercises: await db.template_exercises.where('template_id').anyOf(templateIds).toArray(),
  }
}

export default function Today() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const today = toLocalDate(new Date())
  const data = useLiveQuery(() => loadTodayData(today), [today])
  if (!data) return null

  const model = buildTodayModel(data, today)

  // Pular (FR-2): a ocorrência sai da fila e o sucessor ocupa o lugar dela
  async function skipNext() {
    if (!data?.rotation || !session) return
    const items = data.items.filter((i) => !i.deleted_at)
    const next = nextWorkout({
      itemCount: items.length,
      weeklySlots: data.rotation.weekly_slots,
      occurrences: data.occurrences.filter((o) => !o.deleted_at),
      today,
    })
    if (!next) return
    const existing = data.occurrences.find((o) => o.seq === next.seq)
    await saveLocal('rotation_occurrences', {
      id: existing?.id ?? crypto.randomUUID(),
      owner_id: session.user.id,
      rotation_id: data.rotation.id,
      seq: next.seq,
      planned_on: existing?.planned_on ?? null,
      resolution: 'skipped',
      resolved_on: next.date ?? today,
      session_id: null,
      deleted_at: null,
    })
  }

  return (
    <TodayView
      model={model}
      onSkip={model.next ? skipNext : undefined}
      onImport={() => navigate('/treinar')}
      onCreateTemplate={() => navigate('/treinar')}
    />
  )
}
