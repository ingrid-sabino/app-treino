import { useEffect, useState } from 'react'
import { ExerciseSheetContent, ExerciseThumb } from '../components/ExerciseMedia'
import Sheet from '../components/Sheet'
import { Button, Label, TextButton } from '../components/ui'
import type { Exercise, WorkoutSet } from '../lib/db'
import { elapsedSeconds, formatClock, restRemaining, sessionStats, type SessionView as Model } from '../lib/session'
import { ExercisePicker } from './TemplateEditorView'

// Sessão em andamento, só apresentação (dados em lib/session.ts).
// Tempos sempre derivados dos horários salvos: o relógio de 1 s só redesenha a tela.

export interface SessionActions {
  onChangeSet: (set: WorkoutSet, patch: Partial<Pick<WorkoutSet, 'weight_kg' | 'reps'>>) => void
  onToggleDone: (set: WorkoutSet) => void
  onSkipSet: (set: WorkoutSet) => void
  onRemoveSet: (set: WorkoutSet) => void
  onAddSet: (exerciseId: string, position: number) => void
  onAddExercise: (exercise: Exercise) => void
  onRemoveExercise: (position: number) => void
  onMoveExercise: (position: number, delta: -1 | 1) => void
  onFinish: () => void
  onDiscard: () => void
  onMinimize: () => void
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    // Ao voltar da tela bloqueada, atualiza na hora
    const onVisible = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
  return now
}

const kgText = (v: number | null) => (v == null ? '' : String(v).replace('.', ','))
const parseKg = (t: string) => {
  const v = Number(t.replace(',', '.'))
  return t.trim() === '' || Number.isNaN(v) ? null : v
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  )
}

function SetRow({ set, index, previous, actions, onMenu }: {
  set: WorkoutSet
  index: number
  previous?: { weight: number | null; reps: number | null }
  actions: SessionActions
  onMenu: () => void
}) {
  const done = set.status === 'done'
  const skipped = set.status === 'skipped'
  const [kg, setKg] = useState(kgText(set.weight_kg))
  const [reps, setReps] = useState(set.reps == null ? '' : String(set.reps))
  useEffect(() => setKg(kgText(set.weight_kg)), [set.weight_kg])
  useEffect(() => setReps(set.reps == null ? '' : String(set.reps)), [set.reps])

  const field = `h-12 w-full rounded-md border text-center font-display text-2xl font-bold outline-none placeholder:text-sm placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-lime ${
    done ? 'border-transparent bg-transparent text-on-lime' : 'border-line bg-surface text-ink'
  }`
  return (
    <div className={`grid grid-cols-[2.25rem_1fr_4.5rem_4rem_3rem] items-center gap-1.5 rounded-md px-1.5 py-1 ${done ? 'bg-lime' : ''} ${skipped ? 'opacity-40' : ''}`}>
      <button aria-label={`Opções da Série ${index + 1}`} onClick={onMenu} className={`h-12 font-display text-xl font-bold ${done ? 'text-on-lime' : 'text-muted'}`}>
        {index + 1}
      </button>
      <span className={`truncate text-sm ${done ? 'text-on-lime/70' : 'text-muted'}`}>
        {skipped ? 'Pulada' : previous && previous.weight != null ? `${kgText(previous.weight)} × ${previous.reps ?? '–'}` : '—'}
      </span>
      <input
        aria-label={`Peso da Série ${index + 1} (kg)`}
        inputMode="decimal"
        placeholder="PC"
        value={kg}
        disabled={skipped}
        onChange={(e) => setKg(e.target.value)}
        onBlur={() => parseKg(kg) !== set.weight_kg && actions.onChangeSet(set, { weight_kg: parseKg(kg) })}
        className={field}
      />
      <input
        aria-label={`Reps da Série ${index + 1}`}
        inputMode="numeric"
        value={reps}
        disabled={skipped}
        onChange={(e) => setReps(e.target.value.replace(/\D/g, ''))}
        onBlur={() => {
          const v = reps === '' ? null : Number(reps)
          if (v !== set.reps) actions.onChangeSet(set, { reps: v })
        }}
        className={field}
      />
      <button
        aria-label={done ? `Desfazer Série ${index + 1}` : `Concluir Série ${index + 1}`}
        aria-pressed={done}
        disabled={skipped}
        onClick={() => {
          // Garante que o valor digitado e ainda não confirmado entre antes de concluir
          const patch: Partial<Pick<WorkoutSet, 'weight_kg' | 'reps'>> = {}
          if (parseKg(kg) !== set.weight_kg) patch.weight_kg = parseKg(kg)
          const r = reps === '' ? null : Number(reps)
          if (r !== set.reps) patch.reps = r
          actions.onToggleDone({ ...set, ...patch })
        }}
        className={`flex h-12 w-12 items-center justify-center rounded-md ${done ? 'bg-inverse text-lime' : 'border-2 border-ink text-ink'}`}
      >
        <Check />
      </button>
    </div>
  )
}

function RestBar({ completedAt, restSeconds, now, onDismiss }: { completedAt: string; restSeconds: number; now: number; onDismiss: () => void }) {
  const [extra, setExtra] = useState(0)
  useEffect(() => setExtra(0), [completedAt])
  const total = restSeconds + extra
  const left = restRemaining(completedAt, total, now)
  const over = left <= 0
  useEffect(() => {
    if (left < -15) onDismiss() // some sozinha 15 s depois de acabar
  }, [left, onDismiss])
  return (
    <div className={`fixed inset-x-0 bottom-0 z-20 border-t px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${over ? 'border-ink bg-lime text-on-lime' : 'border-white/10 bg-inverse text-on-inverse'}`}>
      <div className="mx-auto max-w-lg">
        {!over && (
          <div className="mb-2 h-1.5 overflow-hidden rounded-sm bg-white/15">
            <div className="h-full bg-lime" style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="opacity-70">{over ? 'Descanso acabou' : 'Descanso'}</Label>
            <p className="font-display text-4xl font-extrabold leading-none">{over ? 'Próxima Série' : formatClock(left)}</p>
          </div>
          {!over && (
            <>
              <button onClick={() => setExtra(extra - 15)} className="h-11 w-14 rounded-md border border-white/25 font-display text-lg font-bold">
                −15
              </button>
              <button onClick={() => setExtra(extra + 15)} className="h-11 w-14 rounded-md border border-white/25 font-display text-lg font-bold">
                +15
              </button>
            </>
          )}
          <button onClick={onDismiss} className={`h-11 rounded-md px-3 font-display text-lg font-bold uppercase ${over ? 'bg-inverse text-on-inverse' : 'bg-lime text-on-lime'}`}>
            {over ? 'Ok' : 'Pular'}
          </button>
        </div>
      </div>
    </div>
  )
}

type Menu = { kind: 'set'; set: WorkoutSet } | { kind: 'exercise'; position: number; index: number } | { kind: 'info'; name: string } | { kind: 'add' } | { kind: 'finish' } | null

export default function SessionView({
  model,
  catalog,
  actions,
  nowOverride,
  initialMenu = null,
}: {
  model: Model
  catalog: Exercise[]
  actions: SessionActions
  nowOverride?: number
  initialMenu?: Menu
}) {
  const tick = useNow()
  const now = nowOverride ?? tick
  const [menu, setMenu] = useState<Menu>(initialMenu)
  const [dismissedRest, setDismissedRest] = useState<string | null>(null)
  const allSets = model.exercises.flatMap((e) => e.sets)
  const stats = sessionStats(allSets)
  const pending = allSets.filter((s) => s.status === 'pending').length
  const showRest = model.lastDone && model.lastDone.completedAt !== dismissedRest

  return (
    <main className="mx-auto max-w-lg pb-44">
      {/* Cabeçalho fixo: Duração, Volume e Séries sempre à vista (FR-25, FR-26) */}
      <header className="sticky top-0 z-10 bg-inverse px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-on-inverse">
        <div className="flex items-center justify-between gap-2">
          <button onClick={actions.onMinimize} className="text-sm font-semibold opacity-80">
            ↓ Hoje
          </button>
          <p className="truncate font-display text-xl font-bold uppercase">{model.title}</p>
          <Button size="sm" className="!w-auto px-4" onClick={() => setMenu({ kind: 'finish' })}>
            Concluir
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <Label className="opacity-60">Duração</Label>
            <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{formatClock(elapsedSeconds(model.session.started_at, now))}</p>
          </div>
          <div>
            <Label className="opacity-60">Volume</Label>
            <p className="font-display text-3xl font-extrabold leading-none">
              {stats.volumeKg.toLocaleString('pt-BR')}
              <span className="ml-1 text-base opacity-60">kg</span>
            </p>
          </div>
          <div>
            <Label className="opacity-60">Séries</Label>
            <p className="font-display text-3xl font-extrabold leading-none">
              {stats.setsDone}
              <span className="text-base opacity-60">/{stats.setsTotal}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {model.exercises.map((ex, i) => (
          <section key={ex.position} className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center gap-3">
              <button aria-label={`Ver ficha: ${ex.name}`} onClick={() => setMenu({ kind: 'info', name: ex.name })}>
                <ExerciseThumb name={ex.name} muscleGroup={ex.muscleGroup} className="h-12 w-12" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold uppercase leading-tight">{ex.name}</p>
                <p className="text-xs text-muted">Descanso {formatClock(ex.restSeconds)}</p>
              </div>
              <button aria-label={`Opções de ${ex.name}`} onClick={() => setMenu({ kind: 'exercise', position: ex.position, index: i })} className="h-10 w-10 rounded-md border border-line text-xl font-bold">
                ⋯
              </button>
            </div>
            <div className="mt-3 grid grid-cols-[2.25rem_1fr_4.5rem_4rem_3rem] gap-1.5 px-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <span>Série</span>
              <span>Anterior</span>
              <span className="text-center">kg</span>
              <span className="text-center">Reps</span>
              <span />
            </div>
            <div className="mt-1 space-y-1">
              {ex.sets.map((set, j) => (
                <SetRow key={set.id} set={set} index={j} previous={ex.previous[j]} actions={actions} onMenu={() => setMenu({ kind: 'set', set })} />
              ))}
            </div>
            <TextButton className="mt-2 px-1.5" onClick={() => actions.onAddSet(ex.exerciseId, ex.position)}>
              + Série
            </TextButton>
          </section>
        ))}

        <Button variant="dark" size="md" onClick={() => setMenu({ kind: 'add' })}>
          + Adicionar Exercício
        </Button>
        <TextButton className="block w-full py-2 text-center !text-danger" onClick={actions.onDiscard}>
          Descartar Sessão
        </TextButton>
      </div>

      {showRest && model.lastDone && (
        <RestBar completedAt={model.lastDone.completedAt} restSeconds={model.lastDone.restSeconds} now={now} onDismiss={() => setDismissedRest(model.lastDone!.completedAt)} />
      )}

      {menu?.kind === 'set' && (
        <Sheet title={`Série ${(model.exercises.find((e) => e.sets.some((s) => s.id === menu.set.id))?.sets.findIndex((s) => s.id === menu.set.id) ?? 0) + 1}`} onClose={() => setMenu(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={() => { actions.onSkipSet(menu.set); setMenu(null) }}>
              {menu.set.status === 'skipped' ? 'Voltar a fazer' : 'Pular Série'}
            </Button>
            <Button variant="secondary" size="md" className="!border-danger !text-danger" onClick={() => { actions.onRemoveSet(menu.set); setMenu(null) }}>
              Remover
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">Série pulada não entra no Volume.</p>
        </Sheet>
      )}

      {menu?.kind === 'exercise' && (
        <Sheet title={model.exercises[menu.index]?.name ?? 'Exercício'} onClose={() => setMenu(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" disabled={menu.index === 0} onClick={() => { actions.onMoveExercise(menu.position, -1); setMenu(null) }}>
              ↑ Subir
            </Button>
            <Button variant="secondary" size="md" disabled={menu.index === model.exercises.length - 1} onClick={() => { actions.onMoveExercise(menu.position, 1); setMenu(null) }}>
              ↓ Descer
            </Button>
          </div>
          <Button variant="secondary" size="md" className="mt-2 !border-danger !text-danger" onClick={() => { actions.onRemoveExercise(menu.position); setMenu(null) }}>
            Remover da Sessão
          </Button>
          <p className="mt-3 text-xs text-muted">Muda só esta Sessão; o Template continua igual.</p>
        </Sheet>
      )}

      {menu?.kind === 'info' && (
        <Sheet title={menu.name} onClose={() => setMenu(null)}>
          <ExerciseSheetContent name={menu.name} />
        </Sheet>
      )}

      {menu?.kind === 'add' && (
        <Sheet title="Adicionar Exercício" onClose={() => setMenu(null)}>
          <ExercisePicker catalog={catalog} onPick={(ex) => { actions.onAddExercise(ex); setMenu(null) }} />
        </Sheet>
      )}

      {menu?.kind === 'finish' && (
        <Sheet title="Concluir treino?" onClose={() => setMenu(null)}>
          <p className="text-sm text-muted">
            {pending > 0
              ? `${pending} ${pending === 1 ? 'Série ainda não foi feita e vai contar' : 'Séries ainda não foram feitas e vão contar'} como pulada${pending === 1 ? '' : 's'}.`
              : 'Todas as Séries foram registradas.'}
          </p>
          <Button className="mt-4" onClick={() => { setMenu(null); actions.onFinish() }}>
            Concluir
          </Button>
          <Button variant="secondary" size="md" className="mt-2" onClick={() => setMenu(null)}>
            Continuar treinando
          </Button>
        </Sheet>
      )}
    </main>
  )
}
