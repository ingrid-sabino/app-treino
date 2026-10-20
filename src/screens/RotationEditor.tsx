import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../lib/auth'
import { db } from '../lib/db'
import { emptyRotation, loadRotation, saveRotation, type RotationDraft } from '../lib/rotations'
import RotationEditorView from './RotationEditorView'

export default function RotationEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [draft, setDraft] = useState<RotationDraft | null>(id === 'nova' ? emptyRotation() : null)
  const [activate, setActivate] = useState(true)
  const templates = useLiveQuery(() => db.templates.filter((t) => !t.deleted_at && !t.archived_at).toArray(), []) ?? []

  useEffect(() => {
    if (id && id !== 'nova') loadRotation(id).then((d) => (d ? setDraft(d) : navigate('/treinar', { replace: true })))
  }, [id, navigate])

  if (!draft || !session) return null
  const back = () => navigate('/treinar')

  return (
    <RotationEditorView
      draft={draft}
      templates={templates.map((t) => ({ id: t.id, name: t.name, modality: t.modality, notes: t.notes }))}
      activate={activate}
      onChange={setDraft}
      onActivateChange={setActivate}
      onCancel={back}
      onCreateTemplate={() => navigate('/treinar/template/novo')}
      onSave={async () => {
        await saveRotation(draft, session.user.id, activate && !draft.isActive)
        back()
      }}
    />
  )
}
