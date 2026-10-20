import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { db } from '../lib/db'
import { useAuth } from '../lib/auth'
import { archiveTemplate, createExercise, emptyDraft, loadDraft, saveDraft, type TemplateDraft } from '../lib/templates'
import TemplateEditorView from './TemplateEditorView'

export default function TemplateEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [draft, setDraft] = useState<TemplateDraft | null>(id === 'novo' ? emptyDraft() : null)
  // Catálogo global + Exercícios da pessoa
  const catalog = useLiveQuery(() => db.exercises.filter((e) => !e.deleted_at).toArray(), []) ?? []

  useEffect(() => {
    if (id && id !== 'novo') loadDraft(id).then((d) => (d ? setDraft(d) : navigate('/treinar', { replace: true })))
  }, [id, navigate])

  if (!draft || !session) return null
  const ownerId = session.user.id
  const back = () => navigate('/treinar')

  return (
    <TemplateEditorView
      draft={draft}
      catalog={catalog}
      onChange={setDraft}
      onCancel={back}
      onSave={async () => {
        await saveDraft(draft, ownerId)
        back()
      }}
      onArchive={
        draft.isNew
          ? undefined
          : async () => {
              await archiveTemplate(draft.id)
              back()
            }
      }
      onCreateExercise={(name, group) => createExercise(ownerId, name, group)}
    />
  )
}
