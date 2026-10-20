import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { buildProgressModel, type ProgressData } from '../lib/progress'
import { toLocalDate } from '../lib/schedule'
import ProgressView from './ProgressView'

async function loadProgressData(): Promise<ProgressData> {
  const sessions = await db.sessions.toArray()
  return {
    sessions,
    sets: await db.sets.where('session_id').anyOf(sessions.map((s) => s.id)).toArray(),
    exercises: await db.exercises.toArray(),
    bodyLogs: await db.body_logs.toArray(),
  }
}

export default function Progress() {
  const data = useLiveQuery(loadProgressData, [])
  if (!data) return null
  return <ProgressView model={buildProgressModel(data, toLocalDate(new Date()))} />
}
