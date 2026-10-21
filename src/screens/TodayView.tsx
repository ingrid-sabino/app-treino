import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Sheet from '../components/Sheet'
import { Button, Card, Label, ModalityTag, SectionHeader, Stat, modalityStyle } from '../components/ui'
import type { Modality } from '../lib/db'
import { addDays, weekdayIndex } from '../lib/schedule'
import { elapsedSeconds, formatClock } from '../lib/session'

// Tela Hoje, só apresentação (os dados vêm de buildTodayModel em lib/today.ts).

export interface WeekDayItem {
  modality: Modality
  status: 'done' | 'planned'
  seq: number | null // posição na fila da Rotação (só nos planejados)
  label: string | null
}

export interface WeekDayModel {
  date: string
  weekday: string // seg, ter...
  dayNumber: number
  isToday: boolean
  items: WeekDayItem[]
}

export interface NextWorkoutModel {
  seq: number
  label: string
  notes: string | null
  modality: Modality
  dateLabel: string // "Hoje · ter 20/10"
  exerciseCount: number | null
  setCount: number | null
  estimatedMinutes: number | null
}

export interface UpcomingModel {
  key: string
  label: string
  modality: Modality
  dateLabel: string
}

export interface ActiveSessionModel {
  title: string
  startedAt: string
}

export interface TodayModel {
  today: string
  dateLabel: string
  hasRotation: boolean
  week: WeekDayModel[]
  next: NextWorkoutModel | null
  upcoming: UpcomingModel[]
  doneThisWeek: number
  plannedThisWeek: number
  volumeKg: number
}

interface Actions {
  onStart?: () => void
  onResume?: () => void
  onSkip?: (seq: number) => void // FR-2
  onMove?: (seq: number, date: string) => void // FR-35
  onImport?: () => void
  onCreateTemplate?: () => void
}

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

const barColor: Record<Modality, string> = {
  strength: 'bg-lime',
  run: 'bg-lilac',
  ride: 'bg-lilac',
  yoga: 'bg-inverse',
  other: 'bg-muted',
}

function Check({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? 'h-3.5 w-3.5' : 'h-5 w-5'} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  )
}

interface Drag {
  seq: number
  label: string
  modality: Modality
  from: string
  x: number
  y: number
  over: string | null
  moved: boolean
}

// Semana com toque (abre as ações do dia) e arrastar (muda o treino de dia)
function WeekStrip({
  week,
  today,
  done,
  planned,
  onOpenDay,
  onMove,
}: {
  week: WeekDayModel[]
  today: string
  done: number
  planned: number
  onOpenDay: (day: WeekDayModel) => void
  onMove?: (seq: number, date: string) => void
}) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  function dateAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-date]')
    return el?.dataset.date ?? null
  }

  function onPointerDown(e: ReactPointerEvent, day: WeekDayModel) {
    const item = day.items.find((i) => i.status === 'planned')
    start.current = { x: e.clientX, y: e.clientY }
    if (!item || item.seq == null || !onMove) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ seq: item.seq, label: item.label ?? '', modality: item.modality, from: day.date, x: e.clientX, y: e.clientY, over: day.date, moved: false })
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!drag || !start.current) return
    const moved = drag.moved || Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: dateAt(e.clientX, e.clientY), moved })
  }

  function onPointerUp(day: WeekDayModel) {
    if (drag?.moved) {
      // Só dá para mover para hoje ou depois
      if (drag.over && drag.over !== drag.from && drag.over >= today) onMove?.(drag.seq, drag.over)
    } else if (day.items.some((i) => i.status === 'planned')) {
      onOpenDay(day)
    }
    setDrag(null)
    start.current = null
  }

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <Label className="text-muted">Esta semana</Label>
        {planned > 0 && (
          <p className="font-display text-lg font-bold uppercase">
            {done} <span className="text-muted">de {planned} treinos</span>
          </p>
        )}
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const doneItem = day.items.find((i) => i.status === 'done')
          const plannedItems = day.items.filter((i) => i.status === 'planned')
          const isDropTarget = drag?.moved && drag.over === day.date && day.date !== drag.from
          const canDrop = day.date >= today
          // Dois treinos ou mais no dia: o quadrado se divide em colunas (feito / falta)
          const split = day.items.length > 1
          const doneCount = day.items.length - plannedItems.length
          const tile = split
            ? 'bg-surface-2 text-ink'
            : doneItem
              ? modalityStyle[doneItem.modality].className
              : day.isToday
                ? 'bg-surface text-ink'
                : 'bg-surface-2 text-ink'
          return (
            <li key={day.date} className="flex flex-col items-center gap-1">
              <span className={`text-[11px] font-bold uppercase ${day.isToday ? 'text-ink' : 'text-muted'}`}>
                {day.weekday}
              </span>
              <div
                data-date={day.date}
                onPointerDown={(e) => onPointerDown(e, day)}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(day)}
                onPointerCancel={() => setDrag(null)}
                className={`relative flex h-12 w-full touch-none select-none items-center justify-center overflow-hidden rounded-md font-display text-xl font-bold transition ${tile}  ${isDropTarget ? (canDrop ? 'scale-105 ring-2 ring-lime' : 'opacity-40') : ''} ${
                  drag?.moved && drag.from === day.date ? 'opacity-40' : ''
                }`}
              >
                {split ? (
                  <div className="absolute inset-0 flex gap-0.5">
                    {day.items.map((item, i) =>
                      item.status === 'done' ? (
                        <span key={i} className={`flex flex-1 items-center justify-center ${modalityStyle[item.modality].className}`}>
                          <Check small />
                        </span>
                      ) : (
                        <span key={i} className={`relative flex-1 ${day.isToday ? 'bg-surface' : 'bg-surface-2'}`}>
                          <span className={`absolute inset-x-0 bottom-0 h-1.5 ${barColor[item.modality]}`} />
                        </span>
                      ),
                    )}
                    {doneCount === 0 && <span className="absolute inset-0 flex items-center justify-center">{day.dayNumber}</span>}
                  </div>
                ) : doneItem ? (
                  <Check />
                ) : (
                  day.dayNumber
                )}
                {/* Hoje: moldura por cima das colunas e faixas */}
                {day.isToday && <span className="pointer-events-none absolute inset-0 z-10 rounded-md border-2 border-ink" />}
                {/* Um treino planejado: faixa na cor da Modalidade */}
                {!split && !doneItem && plannedItems.length > 0 && (
                  <span className={`absolute inset-x-0 bottom-0 h-1.5 ${barColor[plannedItems[0].modality]}`} />
                )}
              </div>
              {split && (
                <span className="font-display text-xs font-bold leading-none text-muted" aria-label={`${doneCount} de ${day.items.length} treinos feitos`}>
                  {doneCount}/{day.items.length}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {onMove && <p className="mt-3 text-xs text-muted">Toque num dia para pular ou mudar o treino. Arraste para trocar de dia.</p>}

      {/* Treino sendo arrastado acompanha o dedo */}
      {drag?.moved && (
        <div
          className={`pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-[130%] rounded-md px-3 py-2 font-display text-lg font-bold uppercase shadow-lg ${modalityStyle[drag.modality].className}`}
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.label}
        </div>
      )}
    </Card>
  )
}

// Escolha de dia para mudar um treino (FR-35): esta semana e a que vem, de segunda a domingo
function DayPicker({ today, current, onPick }: { today: string; current: string | null; onPick: (date: string) => void }) {
  const monday = addDays(today, -weekdayIndex(today))
  const weeks = [0, 7].map((offset) => Array.from({ length: 7 }, (_, i) => addDays(monday, offset + i)))
  return (
    <div className="space-y-3">
      {weeks.map((days, w) => (
        <div key={w}>
          <Label className="mb-1.5 text-muted">{w === 0 ? 'Esta semana' : 'Semana que vem'}</Label>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => onPick(d)}
                disabled={d < today || d === current}
                className={`flex h-14 flex-col items-center justify-center rounded-md border font-display font-bold uppercase disabled:opacity-25 ${
                  d === today ? 'border-ink bg-lime text-on-lime' : 'border-line bg-surface-2 text-ink'
                }`}
              >
                <span className="text-[11px]">{WEEKDAYS[weekdayIndex(d)]}</span>
                <span className="text-xl leading-none">{Number(d.slice(8))}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type SheetState = { kind: 'day'; day: WeekDayModel } | { kind: 'move'; seq: number; label: string; from: string | null } | null

function NextWorkoutCard({ next, startLabel = 'Começar', onStart, onSkip, onMoveClick }: { next: NextWorkoutModel; startLabel?: string; onStart?: () => void; onSkip?: () => void; onMoveClick?: () => void }) {
  const stats = [
    next.exerciseCount != null && { label: 'Exercícios', value: String(next.exerciseCount) },
    next.setCount != null && { label: 'Séries', value: String(next.setCount) },
    next.estimatedMinutes != null && { label: 'Duração', value: String(next.estimatedMinutes), unit: 'min' },
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  return (
    <Card tone="inverse" className="p-5">
      <div className="flex items-center justify-between">
        <Label className="opacity-70">{next.dateLabel}</Label>
        <ModalityTag modality={next.modality} />
      </div>
      <p className="mt-3 font-display text-6xl font-extrabold uppercase leading-[0.9]">{next.label}</p>
      {next.notes && <p className="mt-1 font-display text-2xl font-semibold uppercase opacity-80">{next.notes}</p>}
      {stats.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} unit={s.unit} />
          ))}
        </div>
      )}
      <Button className="mt-5" onClick={onStart} disabled={!onStart}>
        {startLabel}
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="dark" size="md" className="border border-white/20" onClick={onSkip} disabled={!onSkip}>
          Pular
        </Button>
        <Button variant="dark" size="md" className="border border-white/20" onClick={onMoveClick} disabled={!onMoveClick}>
          Mudar dia
        </Button>
      </div>
    </Card>
  )
}

function EmptyRotation({ onImport, onCreateTemplate }: Actions) {
  return (
    <Card tone="inverse" className="p-5">
      <Label className="opacity-70">Próximo treino</Label>
      <p className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9]">Monte sua Rotação</p>
      <p className="mt-3 text-sm opacity-80">
        Importe um Programa gerado pela IA ou crie seus Templates. O Tönus mostra aqui o treino de cada dia, na ordem.
      </p>
      <Button className="mt-5" onClick={onImport}>
        Importar Programa
      </Button>
      <Button variant="dark" size="md" className="mt-2 border border-white/20" onClick={onCreateTemplate}>
        Criar Template
      </Button>
    </Card>
  )
}

function ActiveSessionCard({ active, onResume }: { active: ActiveSessionModel; onResume?: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <Card tone="lime" className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <Label className="opacity-70">Sessão em andamento</Label>
        <p className="truncate font-display text-3xl font-extrabold uppercase leading-none">{active.title}</p>
        <p className="mt-1 font-display text-xl font-bold tabular-nums">{formatClock(elapsedSeconds(active.startedAt, now))}</p>
      </div>
      <Button variant="dark" size="md" className="!w-auto px-5" onClick={onResume}>
        Continuar
      </Button>
    </Card>
  )
}

export default function TodayView({
  model,
  initialSheet = null,
  active = null,
  ...actions
}: { model: TodayModel; initialSheet?: SheetState; active?: ActiveSessionModel | null } & Actions) {
  const [sheet, setSheet] = useState<SheetState>(initialSheet)
  const { next } = model
  const nextDate = model.week.find((d) => d.items.some((i) => i.seq === next?.seq))?.date ?? null

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <Label className="text-muted first-letter:uppercase">{model.dateLabel}</Label>
        <h1 className="mt-1 text-6xl">Hoje</h1>
      </header>

      {active && <ActiveSessionCard active={active} onResume={actions.onResume} />}

      <WeekStrip
        week={model.week}
        today={model.today}
        done={model.doneThisWeek}
        planned={model.plannedThisWeek}
        onOpenDay={(day) => setSheet({ kind: 'day', day })}
        onMove={actions.onMove}
      />

      {next ? (
        <NextWorkoutCard
          next={next}
          startLabel={active ? 'Continuar' : 'Começar'}
          onStart={active ? actions.onResume : actions.onStart}
          onSkip={actions.onSkip && (() => actions.onSkip!(next.seq))}
          onMoveClick={actions.onMove && (() => setSheet({ kind: 'move', seq: next.seq, label: next.label, from: nextDate }))}
        />
      ) : (
        <EmptyRotation {...actions} />
      )}

      {model.upcoming.length > 0 && (
        <section className="space-y-2 pt-2">
          <SectionHeader title="Próximos" />
          {model.upcoming.map((u) => (
            <Card key={u.key} className="flex items-center gap-3 py-3">
              <div className={`h-10 w-1.5 rounded-sm ${barColor[u.modality]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold uppercase">{u.label}</p>
                <p className="text-sm text-muted first-letter:uppercase">{u.dateLabel}</p>
              </div>
              <ModalityTag modality={u.modality} />
            </Card>
          ))}
        </section>
      )}

      {model.hasRotation && (
        <section className="grid grid-cols-2 gap-2 pt-2">
          <Card tone="lime">
            <Stat label="Volume na semana" value={model.volumeKg.toLocaleString('pt-BR')} unit="kg" />
          </Card>
          <Card tone="lilac">
            <Stat label="Treinos feitos" value={`${model.doneThisWeek}/${model.plannedThisWeek}`} />
          </Card>
        </section>
      )}

      {sheet?.kind === 'day' && (
        <Sheet title={`${sheet.day.weekday} ${sheet.day.dayNumber}`} onClose={() => setSheet(null)}>
          <div className="space-y-3">
            {sheet.day.items
              .filter((i) => i.status === 'planned' && i.seq != null)
              .map((item) => (
                <div key={item.seq} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-2xl font-bold uppercase">{item.label}</p>
                    <ModalityTag modality={item.modality} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        actions.onSkip?.(item.seq!)
                        setSheet(null)
                      }}
                    >
                      Pular
                    </Button>
                    <Button
                      variant="dark"
                      size="md"
                      onClick={() => setSheet({ kind: 'move', seq: item.seq!, label: item.label ?? '', from: sheet.day.date })}
                    >
                      Mudar dia
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Sheet>
      )}

      {sheet?.kind === 'move' && (
        <Sheet title="Mudar dia" onClose={() => setSheet(null)}>
          <p className="mb-3 text-sm text-muted">
            Para quando vai o <strong className="text-ink">{sheet.label}</strong>? Só ele muda; os outros treinos ficam onde estão.
          </p>
          <DayPicker
            today={model.today}
            current={sheet.from}
            onPick={(date) => {
              actions.onMove?.(sheet.seq, date)
              setSheet(null)
            }}
          />
        </Sheet>
      )}
    </main>
  )
}
