import { Button, Card, Label, ModalityTag, SectionHeader, Stat, modalityStyle } from '../components/ui'
import type { Modality } from '../lib/db'

// Tela Hoje, só apresentação (os dados vêm de useTodayModel em Today.tsx).

export interface WeekDayModel {
  date: string
  weekday: string // seg, ter...
  dayNumber: number
  isToday: boolean
  items: { modality: Modality; status: 'done' | 'planned' }[]
}

export interface NextWorkoutModel {
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

export interface TodayModel {
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
  onSkip?: () => void
  onMove?: () => void
  onImport?: () => void
  onCreateTemplate?: () => void
}

const barColor: Record<Modality, string> = {
  strength: 'bg-lime',
  run: 'bg-lilac',
  ride: 'bg-lilac',
  yoga: 'bg-inverse',
  other: 'bg-muted',
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  )
}

function WeekStrip({ week, done, planned }: { week: WeekDayModel[]; done: number; planned: number }) {
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
          const tile = doneItem
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
                className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md font-display text-xl font-bold ${tile} ${
                  day.isToday ? 'ring-2 ring-ink ring-inset' : ''
                }`}
              >
                {doneItem ? <Check /> : day.dayNumber}
                {/* Treinos planejados: uma faixa por treino, na cor da Modalidade */}
                {!doneItem && day.items.length > 0 && (
                  <div className="absolute inset-x-0 bottom-0 flex h-1.5 gap-px">
                    {day.items.map((item, i) => (
                      <span key={i} className={`flex-1 ${barColor[item.modality]}`} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function NextWorkoutCard({ next, onStart, onSkip, onMove }: { next: NextWorkoutModel } & Actions) {
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
        Começar
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="dark" size="md" className="border border-white/20" onClick={onSkip} disabled={!onSkip}>
          Pular
        </Button>
        <Button variant="dark" size="md" className="border border-white/20" onClick={onMove} disabled={!onMove}>
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

export default function TodayView({ model, ...actions }: { model: TodayModel } & Actions) {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <Label className="text-muted first-letter:uppercase">{model.dateLabel}</Label>
        <h1 className="mt-1 text-6xl">Hoje</h1>
      </header>

      <WeekStrip week={model.week} done={model.doneThisWeek} planned={model.plannedThisWeek} />

      {model.next ? (
        <NextWorkoutCard next={model.next} {...actions} />
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
    </main>
  )
}
