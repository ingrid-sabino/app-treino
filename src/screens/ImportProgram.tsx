import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { db } from '../lib/db'
import { useAuth } from '../lib/auth'
import { activeRotationName, defaultSlots, importProgram, parseProgram, ProgramSchema, type Program, type Resolution } from '../lib/program'
import { buildPrompt, PRESET_PROGRAMS } from '../lib/programPrompts'
import { toLocalDate } from '../lib/schedule'
import { ImportStartView, ProgramPreviewView, type PromptForm } from './ImportProgramView'

export default function ImportProgram() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const catalog = useLiveQuery(() => db.exercises.filter((e) => !e.deleted_at).toArray(), []) ?? []
  const activeName = useLiveQuery(activeRotationName, []) ?? null

  const [form, setForm] = useState<PromptForm>({ goal: 'hypertrophy', level: 'beginner', daysPerWeek: 3, minutes: 60, context: '' })
  const [copied, setCopied] = useState(false)
  const [promptFallback, setPromptFallback] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const [preview, setPreview] = useState<{ program: Program; source: 'ai_import' | 'preset' } | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({})
  const [startsOn, setStartsOn] = useState(toLocalDate(new Date()))
  const [slots, setSlots] = useState<number[]>(defaultSlots(3))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = (program: Program, source: 'ai_import' | 'preset') => {
    setPreview({ program, source })
    setResolutions({})
    setSlots(defaultSlots(program.days_per_week))
    setError(null)
    window.scrollTo(0, 0)
  }

  if (preview && session) {
    return (
      <ProgramPreviewView
        program={preview.program}
        catalog={catalog}
        resolutions={resolutions}
        onResolve={(key, r) =>
          setResolutions((prev) => {
            const next = { ...prev }
            if (r) next[key] = r
            else delete next[key]
            return next
          })
        }
        startsOn={startsOn}
        onStartsOn={setStartsOn}
        slots={slots}
        onSlots={setSlots}
        activeName={activeName}
        busy={busy}
        error={error}
        onBack={() => setPreview(null)}
        onImport={async () => {
          setBusy(true)
          try {
            await importProgram(preview.program, { ownerId: session.user.id, catalog, resolutions, startsOn, weeklySlots: slots, source: preview.source })
            navigate('/', { replace: true })
          } catch (err) {
            console.error(err)
            setError(`Não deu para importar: ${err instanceof Error ? err.message : String(err)}`)
            setBusy(false)
          }
        }}
      />
    )
  }

  const validate = (value: string) => {
    const res = parseProgram(value)
    if (res.ok) {
      setErrors([])
      open(res.program, 'ai_import')
    } else setErrors(res.errors)
  }

  return (
    <ImportStartView
      form={form}
      onForm={(f) => {
        setForm(f)
        setCopied(false)
      }}
      copied={copied}
      promptFallback={promptFallback}
      onCopyPrompt={async () => {
        const prompt = buildPrompt({ ...form, catalog: catalog.filter((e) => !e.owner_id).map((e) => e.name).sort((a, b) => a.localeCompare(b, 'pt-BR')) })
        try {
          await navigator.clipboard.writeText(prompt)
          setCopied(true)
          setPromptFallback(null)
        } catch {
          setPromptFallback(prompt)
        }
      }}
      text={text}
      onText={(t) => {
        setText(t)
        setErrors([])
      }}
      onFile={async (file) => {
        const content = await file.text()
        setText(content)
        validate(content)
      }}
      onPreview={() => validate(text)}
      errors={errors}
      presets={PRESET_PROGRAMS}
      onPickPreset={(p) => open(ProgramSchema.parse(p), 'preset')}
      onBack={() => navigate('/treinar')}
    />
  )
}
