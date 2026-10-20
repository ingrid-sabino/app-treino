import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '../lib/db'
import { useAuth } from '../lib/auth'
import { moveOccurrence, skipOccurrence } from '../lib/rotationActions'
import { addDays, startOfWeek, toLocalDate } from '../lib/schedule'
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

  const target =
    data.rotation && session
      ? { ownerId: session.user.id, rotationId: data.rotation.id, occurrences: data.occurrences }
      : null

  return (
    <TodayView
      model={model}
      onSkip={target ? (seq) => skipOccurrence(target, seq, today) : undefined}
      onMove={target ? (seq, date) => moveOccurrence(target, seq, date) : undefined}
      onImport={() => navigate('/treinar')}
      onCreateTemplate={() => navigate('/treinar/template/novo')}
    />
  )
}
