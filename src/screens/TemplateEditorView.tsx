import { useState } from 'react'
import Sheet from '../components/Sheet'
import { Button, Card, Input, Label, SectionHeader, TextButton, modalityStyle } from '../components/ui'
import type { Exercise, Modality } from '../lib/db'
import { addExercise, moveExercise, type DraftExercise, type TemplateDraft } from '../lib/templates'

// Editor de Template, só apresentação: o rascunho vive no container (TemplateEditor.tsx).

const MODALITIES: Modality[] = ['strength', 'run', 'ride', 'yoga', 'other']

function Stepper({ label, value, onChange, step, min, max, format }: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
  min: number
  max: number
  format?: (v: number) => string
}) {
  return (
    <div>
      <Label className="mb-1 text-muted">{label}</Label>
      <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-line">
        <button aria-label={`Menos ${label}`} className="w-10 bg-surface-2 text-xl font-bold" onClick={() => onChange(Math.max(min, value - step))}>
          −
        </button>
        <span className="flex flex-1 items-center justify-center font-display text-xl font-bold">{format ? format(value) : value}</span>
        <button aria-label={`Mais ${label}`} className="w-10 bg-surface-2 text-xl font-bold" onClick={() => onChange(Math.min(max, value + step))}>
          +
        </button>
      </div>
    </div>
  )
}

function ExerciseCard({ ex, index, count, onChange, onMove, onRemove }: {
  ex: DraftExercise
  index: number
  count: number
  onChange: (ex: DraftExercise) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-lime font-display text-lg font-bold text-on-lime">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold uppercase leading-tight">{ex.name}</p>
          <p className="text-xs capitalize text-muted">{ex.muscleGroup}</p>
        </div>
        <div className="flex gap-1">
          <button aria-label="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="h-8 w-8 rounded-sm border border-line text-lg disabled:opacity-25">
            ↑
          </button>
          <button aria-label="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="h-8 w-8 rounded-sm border border-line text-lg disabled:opacity-25">
            ↓
          </button>
          <button aria-label="Remover" onClick={onRemove} className="h-8 w-8 rounded-sm border border-line text-lg text-danger">
            ×
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stepper label="Séries" value={ex.sets} step={1} min={1} max={10} onChange={(sets) => onChange({ ...ex, sets })} />
        <div>
          <Label className="mb-1 text-muted">Reps</Label>
          <input
            aria-label="Reps"
            value={ex.reps}
            onChange={(e) => onChange({ ...ex, reps: e.target.value })}
            className="h-11 w-full rounded-md border border-line bg-surface text-center font-display text-xl font-bold outline-none focus:border-ink"
          />
        </div>
        <Stepper
          label="Descanso"
          value={ex.restSeconds}
          step={15}
          min={0}
          max={600}
          format={(s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`)}
          onChange={(restSeconds) => onChange({ ...ex, restSeconds })}
        />
      </div>
    </Card>
  )
}

// Catálogo de Exercícios: busca, filtro por grupo e criação do que faltar
export function ExercisePicker({ catalog, onPick, onCreate }: {
  catalog: Exercise[]
  onPick: (ex: Exercise) => void
  onCreate?: (name: string, muscleGroup: string) => void
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const groups = [...new Set(catalog.map((e) => e.muscle_group))].sort()
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const list = catalog
    .filter((e) => !group || e.muscle_group === group)
    .filter((e) => norm(e.name).includes(norm(query)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const exact = catalog.some((e) => norm(e.name) === norm(query.trim()))

  return (
    <div className="flex max-h-[70dvh] flex-col">
      <Input className="shrink-0" placeholder="Buscar Exercício" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="-mx-1 mt-2 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1">
        {[null, ...groups].map((g) => (
          <button
            key={g ?? 'todos'}
            onClick={() => setGroup(g)}
            className={`shrink-0 rounded-sm px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
              group === g ? 'bg-inverse text-on-inverse' : 'bg-surface-2 text-ink'
            }`}
          >
            {g ?? 'Todos'}
          </button>
        ))}
      </div>
      <ul className="mt-2 flex-1 divide-y divide-line overflow-y-auto">
        {query.trim() && !exact && onCreate && (
          <li>
            <button className="flex w-full items-center justify-between py-3 text-left" onClick={() => onCreate(query, group ?? 'outro')}>
              <span>
                <span className="font-display text-lg font-bold uppercase">Criar “{query.trim()}”</span>
                <span className="block text-xs text-muted">Novo Exercício no seu catálogo · {group ?? 'outro'}</span>
              </span>
              <span className="rounded-sm bg-lime px-2 py-1 text-xs font-bold uppercase text-on-lime">Criar</span>
            </button>
          </li>
        )}
        {list.map((e) => (
          <li key={e.id}>
            <button className="flex w-full items-center justify-between py-3 text-left" onClick={() => onPick(e)}>
              <span>
                <span className="font-display text-lg font-bold uppercase">{e.name}</span>
                <span className="block text-xs capitalize text-muted">
                  {[e.muscle_group, e.equipment].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink text-xl font-bold">+</span>
            </button>
          </li>
        ))}
        {list.length === 0 && !query.trim() && <li className="py-6 text-center text-sm text-muted">O catálogo ainda está sincronizando.</li>}
      </ul>
    </div>
  )
}

export default function TemplateEditorView({
  draft,
  catalog,
  onChange,
  onSave,
  onCancel,
  onArchive,
  onCreateExercise,
  initialPickerOpen = false,
}: {
  draft: TemplateDraft
  catalog: Exercise[]
  onChange: (d: TemplateDraft) => void
  onSave?: () => void
  onCancel?: () => void
  onArchive?: () => void
  onCreateExercise?: (name: string, muscleGroup: string) => Promise<Exercise>
  initialPickerOpen?: boolean
}) {
  const [picker, setPicker] = useState(initialPickerOpen)
  const isStrength = draft.modality === 'strength'

  return (
    <main className="mx-auto max-w-lg px-4 pb-32">
      {/* Barra do editor: voltar e salvar sempre à mão */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <TextButton className="whitespace-nowrap" onClick={onCancel}>
          ← Voltar
        </TextButton>
        <Label className="text-muted">{draft.isNew ? 'Novo Template' : 'Editar Template'}</Label>
        <Button size="sm" className="!w-auto px-5" onClick={onSave} disabled={!onSave || !draft.name.trim()}>
          Salvar
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        <input
          aria-label="Nome do Template"
          placeholder="Nome do Template"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          className="w-full bg-transparent font-display text-5xl font-extrabold uppercase leading-none outline-none placeholder:text-line"
        />
        <Input placeholder="Foco (ex.: Costas e bíceps)" value={draft.notes} onChange={(e) => onChange({ ...draft, notes: e.target.value })} />

        <div>
          <Label className="mb-1.5 text-muted">Modalidade</Label>
          <div className="flex flex-wrap gap-1.5">
            {MODALITIES.map((m) => (
              <button
                key={m}
                onClick={() => onChange({ ...draft, modality: m })}
                className={`h-10 rounded-md px-3 text-xs font-bold uppercase tracking-wide ${
                  draft.modality === m ? modalityStyle[m].className + ' ring-2 ring-ink ring-offset-2 ring-offset-bg' : 'bg-surface-2 text-muted'
                }`}
              >
                {modalityStyle[m].label}
              </button>
            ))}
          </div>
        </div>

        {isStrength ? (
          <section className="space-y-2 pt-2">
            <SectionHeader
              title="Exercícios"
              action={<p className="font-display text-lg font-bold uppercase text-muted">{draft.exercises.reduce((n, e) => n + e.sets, 0)} Séries</p>}
            />
            {draft.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.key}
                ex={ex}
                index={i}
                count={draft.exercises.length}
                onChange={(next) => onChange({ ...draft, exercises: draft.exercises.map((e) => (e.key === ex.key ? next : e)) })}
                onMove={(delta) => onChange(moveExercise(draft, i, delta))}
                onRemove={() => onChange({ ...draft, exercises: draft.exercises.filter((e) => e.key !== ex.key) })}
              />
            ))}
            {draft.exercises.length === 0 && (
              <Card className="border-dashed text-center text-sm text-muted">Nenhum Exercício ainda. Adicione do catálogo.</Card>
            )}
            <Button variant="dark" size="md" onClick={() => setPicker(true)}>
              + Adicionar Exercício
            </Button>
          </section>
        ) : (
          <Card className="text-sm text-muted">
            Templates de {modalityStyle[draft.modality].label.toLowerCase()} não têm Exercícios: na Sessão você registra distância, tempo
            ou duração e esforço.
          </Card>
        )}

        {onArchive && (
          <TextButton className="!text-danger" onClick={onArchive}>
            Arquivar Template
          </TextButton>
        )}
      </div>

      {picker && (
        <Sheet title="Adicionar Exercício" onClose={() => setPicker(false)}>
          <ExercisePicker
            catalog={catalog}
            onPick={(ex) => {
              onChange(addExercise(draft, ex))
              setPicker(false)
            }}
            onCreate={
              onCreateExercise &&
              (async (name, group) => {
                const ex = await onCreateExercise(name, group)
                onChange(addExercise(draft, ex))
                setPicker(false)
              })
            }
          />
        </Sheet>
      )}
    </main>
  )
}
