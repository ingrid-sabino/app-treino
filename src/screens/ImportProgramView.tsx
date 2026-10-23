import { useState, type ReactNode } from 'react'
import { ExerciseThumb } from '../components/ExerciseMedia'
import Sheet from '../components/Sheet'
import TrainingDays from '../components/TrainingDays'
import { Button, Card, Label, ModalityTag, SectionHeader, TextButton } from '../components/ui'
import type { Exercise, Modality } from '../lib/db'
import { GOAL_LABEL, LEVEL_LABEL, matchExercise, normalizeName, type Goal, type Level, type Program, type ProgramInput, type Resolution } from '../lib/program'
import { ExercisePicker } from './TemplateEditorView'

// Importar Programa (FR-10 a FR-14), só apresentação: estado e gravação em ImportProgram.tsx.

function Chips<T extends string | number>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={`h-10 rounded-md px-3 text-xs font-bold uppercase tracking-wide ${value === o ? 'bg-inverse text-on-inverse' : 'bg-surface-2 text-ink'}`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  )
}

function TopBar({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <TextButton className="whitespace-nowrap" onClick={onBack}>
        ← Voltar
      </TextButton>
      <Label className="text-muted">{title}</Label>
      <span className="min-w-14">{action}</span>
    </div>
  )
}

const Step = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-lime font-display text-lg font-bold text-on-lime">{n}</span>
    <h2 className="text-2xl">{title}</h2>
  </div>
)

export interface PromptForm {
  goal: Goal
  level: Level
  daysPerWeek: number
  minutes: number
  context: string
}

export function ImportStartView({
  form,
  onForm,
  onCopyPrompt,
  copied,
  promptFallback,
  text,
  onText,
  onFile,
  onPreview,
  errors,
  presets,
  onPickPreset,
  onBack,
}: {
  form: PromptForm
  onForm: (f: PromptForm) => void
  onCopyPrompt?: () => void
  copied: boolean
  promptFallback?: string | null // quando o navegador não deixa copiar, o texto aparece para copiar à mão
  text: string
  onText: (t: string) => void
  onFile?: (file: File) => void
  onPreview?: () => void
  errors: string[]
  presets: ProgramInput[]
  onPickPreset?: (p: ProgramInput) => void
  onBack?: () => void
}) {
  return (
    <main className="mx-auto max-w-lg px-4 pb-32">
      <TopBar title="Importar Programa" onBack={onBack} />
      <div className="space-y-6 pt-4">
        <header>
          <h1 className="text-5xl">Programa por IA</h1>
          <p className="mt-1 text-sm text-muted">Copie o Prompt-modelo, cole no Claude ou no ChatGPT e traga a resposta de volta. Leva uns 3 minutos.</p>
        </header>

        <section className="space-y-3">
          <Step n={1} title="Copie o Prompt-modelo" />
          <div>
            <Label className="mb-1.5 text-muted">Objetivo</Label>
            <Chips options={['strength', 'hypertrophy', 'running'] as Goal[]} value={form.goal} onChange={(goal) => onForm({ ...form, goal })} label={(g) => GOAL_LABEL[g]} />
          </div>
          <div>
            <Label className="mb-1.5 text-muted">Nível</Label>
            <Chips options={['beginner', 'intermediate', 'advanced'] as Level[]} value={form.level} onChange={(level) => onForm({ ...form, level })} label={(l) => LEVEL_LABEL[l]} />
          </div>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 text-muted">Dias por semana</Label>
              <Chips options={[2, 3, 4, 5, 6]} value={form.daysPerWeek} onChange={(daysPerWeek) => onForm({ ...form, daysPerWeek })} label={String} />
            </div>
            <div>
              <Label className="mb-1.5 text-muted">Minutos por treino</Label>
              <Chips options={[30, 45, 60, 90]} value={form.minutes} onChange={(minutes) => onForm({ ...form, minutes })} label={String} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 text-muted">Equipamento, limitações e preferências</Label>
            <textarea
              rows={2}
              value={form.context}
              onChange={(e) => onForm({ ...form, context: e.target.value })}
              placeholder="Ex.: academia completa; dor no ombro direito; quero focar em glúteos"
              className="w-full rounded-md border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-lime"
            />
          </div>
          <Button variant="dark" onClick={onCopyPrompt} disabled={!onCopyPrompt}>
            {copied ? 'Copiado ✓' : 'Copiar Prompt-modelo'}
          </Button>
          {promptFallback && (
            <div>
              <p className="mb-1 text-sm text-muted">Não deu para copiar automaticamente. Toque no texto, selecione tudo e copie:</p>
              <textarea readOnly rows={6} value={promptFallback} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-md border border-line bg-surface-2 p-3 font-mono text-xs" />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <Step n={2} title="Cole a resposta" />
          <textarea
            aria-label="Resposta da IA"
            rows={6}
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Cole aqui a resposta inteira, com o bloco ```json"
            className={`w-full rounded-md border bg-surface p-3 font-mono text-xs outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-lime ${errors.length ? 'border-danger' : 'border-line'}`}
          />
          {errors.length > 0 && (
            <div role="alert" className="rounded-md border border-danger p-3 text-sm text-danger">
              <p className="font-semibold">O Programa não passou na conferência:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted">Dica: mande o erro para a IA e peça para corrigir o JSON.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md border border-ink font-display text-base font-bold uppercase tracking-wide">
              Enviar arquivo
              <input
                type="file"
                accept=".json,.md,.txt,application/json,text/markdown,text/plain"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onFile?.(f)
                  e.target.value = ''
                }}
              />
            </label>
            <Button size="md" onClick={onPreview} disabled={!onPreview || !text.trim()}>
              Ver prévia
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <SectionHeader title="Ou comece por um pronto" />
          {presets.map((p) => (
            <button key={p.name} className="block w-full text-left" onClick={() => onPickPreset?.(p)} disabled={!onPickPreset}>
              <Card className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-xl font-bold uppercase leading-tight">{p.name}</p>
                  {p.goal && <span className="shrink-0 rounded-sm bg-lilac px-1.5 py-0.5 text-[11px] font-bold uppercase text-on-lilac">{GOAL_LABEL[p.goal]}</span>}
                </div>
                <p className="text-sm text-muted">
                  {[p.level && LEVEL_LABEL[p.level], `${p.days_per_week}× por semana`, p.weeks && `${p.weeks} semanas`].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 text-sm">{p.workouts.map((w) => w.name).join(' → ')}</p>
              </Card>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}

type Row = { name: string; sets: number; reps: string | number; match: Exercise | null; key: string }

export function ProgramPreviewView({
  program,
  catalog,
  resolutions,
  onResolve,
  startsOn,
  onStartsOn,
  slots,
  onSlots,
  activeName,
  onImport,
  onBack,
  busy = false,
  error,
  initialResolve,
}: {
  program: Program
  catalog: Exercise[]
  resolutions: Record<string, Resolution>
  onResolve: (key: string, r: Resolution | null) => void
  startsOn: string
  onStartsOn: (d: string) => void
  slots: number[]
  onSlots: (s: number[]) => void
  activeName: string | null
  onImport?: () => void
  onBack?: () => void
  busy?: boolean
  error?: string | null
  initialResolve?: { key: string; name: string; mode: 'pick' | 'create' }
}) {
  const [resolving, setResolving] = useState<{ key: string; name: string; mode: 'pick' | 'create' } | null>(initialResolve ?? null)
  const byId = new Map(catalog.map((e) => [e.id, e]))
  const groups = [...new Set(catalog.map((e) => e.muscle_group))].sort()

  const workouts = program.workouts.map((w) => ({
    ...w,
    rows: w.exercises.map((e): Row => ({ name: e.name, sets: e.sets, reps: e.reps, match: matchExercise(e.name, catalog).exercise, key: normalizeName(e.name) })),
  }))
  const pendingKeys = new Set(workouts.flatMap((w) => (w.modality === 'strength' ? w.rows : [])).filter((r) => !r.match && !resolutions[r.key]).map((r) => r.key))
  const totalSets = workouts.reduce((n, w) => n + w.rows.reduce((m, r) => m + r.sets, 0), 0)

  return (
    <main className="mx-auto max-w-lg px-4 pb-40">
      <TopBar title="Prévia" onBack={onBack} />
      <div className="space-y-4 pt-4">
        <header>
          <Label className="text-muted">
            {[program.goal && GOAL_LABEL[program.goal], program.level && LEVEL_LABEL[program.level], program.weeks && `${program.weeks} semanas`].filter(Boolean).join(' · ') ||
              'Programa'}
          </Label>
          <h1 className="text-5xl leading-none">{program.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {workouts.length} treinos na Rotação · {totalSets} Séries no ciclo · {program.days_per_week}× por semana
          </p>
          {program.notes && <p className="mt-2 text-sm">{program.notes}</p>}
        </header>

        {pendingKeys.size > 0 && (
          <Card tone="lilac" className="text-sm">
            <p className="font-display text-xl font-bold uppercase">
              {pendingKeys.size} {pendingKeys.size === 1 ? 'Exercício fora' : 'Exercícios fora'} do catálogo
            </p>
            <p>Para cada um, use um parecido do catálogo ou crie um novo.</p>
          </Card>
        )}

        {workouts.map((w, wi) => (
          <Card key={wi} className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-inverse font-display text-lg font-bold text-on-inverse">{wi + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-bold uppercase leading-tight">{w.name}</p>
                {w.focus && <p className="text-sm text-muted">{w.focus}</p>}
              </div>
              <ModalityTag modality={w.modality as Modality} />
            </div>
            {w.modality !== 'strength' && w.notes && <p className="text-sm">{w.notes}</p>}
            {w.modality === 'strength' && (
              <ul className="divide-y divide-line">
                {w.rows.map((r, ri) => {
                  const res = resolutions[r.key]
                  const mapped = r.match ?? (res?.kind === 'existing' ? byId.get(res.exerciseId) ?? null : null)
                  const suggestion = !r.match && !res ? matchExercise(r.name, catalog).suggestion : null
                  return (
                    <li key={ri} className="py-2">
                      <div className="flex items-center gap-3">
                        <ExerciseThumb name={mapped?.name ?? r.name} muscleGroup={mapped?.muscle_group ?? ''} className="h-11 w-11" />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-lg font-bold uppercase leading-tight">{mapped?.name ?? r.name}</p>
                          {!r.match && res?.kind === 'existing' && <p className="text-xs text-muted">No Programa: {r.name}</p>}
                          {!r.match && res?.kind === 'create' && <p className="text-xs text-muted">Novo no seu catálogo · {res.muscleGroup}</p>}
                        </div>
                        <span className="shrink-0 font-display text-lg font-bold">
                          {r.sets}×{r.reps}
                        </span>
                      </div>
                      {!r.match && !res && (
                        <div className="mt-2 rounded-md border border-lilac-strong p-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-lilac-strong">Não está no catálogo</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {suggestion && (
                              <Button size="sm" className="!w-auto px-3 normal-case" onClick={() => onResolve(r.key, { kind: 'existing', exerciseId: suggestion.id })}>
                                Usar {suggestion.name}
                              </Button>
                            )}
                            <Button variant="secondary" size="sm" className="!w-auto px-3" onClick={() => setResolving({ key: r.key, name: r.name, mode: 'pick' })}>
                              Escolher
                            </Button>
                            <Button variant="secondary" size="sm" className="!w-auto px-3" onClick={() => setResolving({ key: r.key, name: r.name, mode: 'create' })}>
                              Criar novo
                            </Button>
                          </div>
                        </div>
                      )}
                      {!r.match && res && (
                        <TextButton className="mt-1 text-xs" onClick={() => onResolve(r.key, null)}>
                          Mudar
                        </TextButton>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        ))}

        <Card className="space-y-4">
          <div>
            <Label className="mb-1.5 text-muted">Começar em</Label>
            <input
              type="date"
              value={startsOn}
              onChange={(e) => e.target.value && onStartsOn(e.target.value)}
              className="h-12 w-full rounded-md border border-line bg-surface px-3 font-display text-xl font-bold outline-none focus:border-ink"
            />
          </div>
          <TrainingDays slots={slots} onChange={onSlots} />
          {activeName && <p className="text-sm text-muted">A Rotação ativa ({activeName}) vai para o arquivo. Seu histórico continua.</p>}
        </Card>
        {error && (
          <p role="alert" className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Button onClick={onImport} disabled={!onImport || busy || pendingKeys.size > 0}>
            {pendingKeys.size > 0 ? `Falta decidir ${pendingKeys.size}` : busy ? 'Importando…' : 'Importar e ativar'}
          </Button>
        </div>
      </div>

      {resolving?.mode === 'pick' && (
        <Sheet title={`No lugar de "${resolving.name}"`} onClose={() => setResolving(null)}>
          <ExercisePicker
            catalog={catalog}
            onPick={(ex) => {
              onResolve(resolving.key, { kind: 'existing', exerciseId: ex.id })
              setResolving(null)
            }}
          />
        </Sheet>
      )}
      {resolving?.mode === 'create' && (
        <Sheet title="Criar Exercício" onClose={() => setResolving(null)}>
          <p className="font-display text-2xl font-bold uppercase">{resolving.name}</p>
          <Label className="mb-1.5 mt-3 text-muted">Grupo muscular</Label>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => {
                  onResolve(resolving.key, { kind: 'create', muscleGroup: g })
                  setResolving(null)
                }}
                className="h-10 rounded-md bg-surface-2 px-3 text-xs font-bold uppercase tracking-wide"
              >
                {g}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </main>
  )
}
