import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useNavigate, useParams } from 'react-router'
import { db } from '../lib/db'
import { summarizeSession } from '../lib/session'
import SessionSummaryView from './SessionSummaryView'

export default function SessionSummary() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(id)
    if (!session?.ended_at) return null
    const template = session.template_id ? await db.templates.get(session.template_id) : undefined
    const summary = await summarizeSession(id)
    const exercises = await db.exercises.bulkGet(summary.records.map((r) => r.exerciseId))
    return { title: template?.name ?? 'Treino livre', summary, names: Object.fromEntries(exercises.filter(Boolean).map((e) => [e!.id, e!.name])) }
  }, [id])
  if (data === undefined) return null
  if (data === null) return <Navigate to="/" replace />
  return <SessionSummaryView title={data.title} summary={data.summary} exerciseName={(eid) => data.names[eid] ?? 'Exercício'} onDone={() => navigate('/')} />
}
