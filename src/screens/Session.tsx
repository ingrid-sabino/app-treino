import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../lib/auth'
import { db } from '../lib/db'
import {
  addExerciseToSession,
  addSet,
  buildSessionView,
  discardSession,
  finishSession,
  loadSessionData,
  removeExerciseFromSession,
  removeSet,
  skipSet,
  swapExercises,
  toggleSetDone,
  updateSet,
} from '../lib/session'
import SessionView from './SessionView'

export default function Session() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { session: auth } = useAuth()
  const data = useLiveQuery(() => loadSessionData(id), [id])
  const catalog = useLiveQuery(() => db.exercises.filter((e) => !e.deleted_at).toArray(), []) ?? []
  if (data === undefined || !auth) return null
  if (data === null) return <Navigate to="/" replace />
  if (data.session.ended_at) return <Navigate to={`/sessao/${id}/resumo`} replace />
  const model = buildSessionView(data)

  return (
    <SessionView
      model={model}
      catalog={catalog}
      actions={{
        onChangeSet: (set, patch) => updateSet(set, patch),
        onToggleDone: (set) => toggleSetDone(set),
        onSkipSet: (set) => skipSet(set),
        onRemoveSet: (set) => removeSet(set),
        onAddSet: (exerciseId, position) => addSet(id, exerciseId, position),
        onAddExercise: (ex) => addExerciseToSession(id, ex.id),
        onRemoveExercise: (position) => removeExerciseFromSession(id, position),
        onMoveExercise: (position, delta) => {
          const positions = model.exercises.map((e) => e.position)
          const other = positions[positions.indexOf(position) + delta]
          if (other != null) swapExercises(id, position, other)
        },
        onFinish: async () => {
          await finishSession(id, auth.user.id)
          navigate(`/sessao/${id}/resumo`, { replace: true })
        },
        onDiscard: async () => {
          if (!window.confirm('Descartar esta Sessão? As Séries registradas serão apagadas.')) return
          await discardSession(id)
          navigate('/', { replace: true })
        },
        onMinimize: () => navigate('/'),
      }}
    />
  )
}
