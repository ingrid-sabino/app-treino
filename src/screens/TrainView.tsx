import { Button, Card, Label, ModalityTag, SectionHeader } from '../components/ui'
import type { TrainModel } from '../lib/train'

// Aba Treinar, só apresentação (dados em lib/train.ts).

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const WEEKDAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const MAX_SLOTS = 3

interface Actions {
  onStartFree?: () => void
  onLogCardio?: () => void
  onLogYoga?: () => void
  onSlotsChange?: (slots: number[]) => void
  onCreateTemplate?: () => void
  onOpenTemplate?: (id: string) => void
  onImport?: () => void
}

function TrainingDays({ slots, onChange }: { slots: number[]; onChange?: (slots: number[]) => void }) {
  const total = slots.reduce((a, b) => a + b, 0)
  return (
    <div className="mt-5 border-t border-white/15 pt-4">
      <div className="flex items-baseline justify-between">
        <Label className="opacity-70">Dias de treino</Label>
        <p className="font-display text-lg font-bold uppercase">
          {total} <span className="opacity-60">por semana</span>
        </p>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {slots.map((n, i) => (
          <button
            key={i}
            aria-label={`${WEEKDAY_NAMES[i]}: ${n} treino(s)`}
            disabled={!onChange}
            onClick={() => onChange?.(slots.map((v, j) => (j === i ? (v + 1) % (MAX_SLOTS + 1) : v)))}
            className={`flex h-14 flex-col items-center justify-center rounded-md font-display font-bold ${
              n > 0 ? 'bg-lime text-on-lime' : 'border border-white/20 text-on-inverse/60'
            }`}
          >
            <span className="text-[11px] uppercase">{WEEKDAYS[i]}</span>
            <span className="text-xl leading-none">{n > 0 ? n : '–'}</span>
          </button>
        ))}
      </div>
      {onChange && <p className="mt-2 text-xs opacity-60">Toque num dia para mudar quantos treinos cabem nele.</p>}
    </div>
  )
}

export default function TrainView({ model, ...actions }: { model: TrainModel } & Actions) {
  const { rotation, templates } = model
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <h1 className="text-6xl">Treinar</h1>
      </header>

      <Card tone="lime" className="p-5">
        <Label className="opacity-70">Fora da Rotação</Label>
        <p className="mt-1 font-display text-4xl font-extrabold uppercase leading-none">Treino livre</p>
        <Button variant="dark" className="mt-4" onClick={actions.onStartFree} disabled={!actions.onStartFree}>
          Começar treino livre
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="md" className="border-on-lime bg-transparent text-on-lime" onClick={actions.onLogCardio} disabled={!actions.onLogCardio}>
            + Corrida
          </Button>
          <Button variant="secondary" size="md" className="border-on-lime bg-transparent text-on-lime" onClick={actions.onLogYoga} disabled={!actions.onLogYoga}>
            + Yoga
          </Button>
        </div>
      </Card>

      <section className="space-y-2 pt-2">
        <SectionHeader title="Rotação" />
        {rotation ? (
          <Card tone="inverse" className="p-5">
            <Label className="opacity-70">{rotation.sourceLabel}</Label>
            <p className="mt-1 font-display text-4xl font-extrabold uppercase leading-none">{rotation.name}</p>
            <ol className="mt-4 space-y-1.5">
              {rotation.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-md px-2 py-2 ${item.isNext ? 'bg-white/10 ring-1 ring-lime' : ''}`}
                >
                  <span className="w-6 text-center font-display text-xl font-bold opacity-60">{item.position}</span>
                  <span className="min-w-0 flex-1 truncate font-display text-xl font-bold uppercase">{item.label}</span>
                  {item.isNext && <span className="rounded-sm bg-lime px-1.5 py-0.5 text-[11px] font-bold uppercase text-on-lime">Próximo</span>}
                  <ModalityTag modality={item.modality} />
                </li>
              ))}
            </ol>
            <TrainingDays slots={rotation.weeklySlots} onChange={actions.onSlotsChange} />
          </Card>
        ) : (
          <Card className="p-5">
            <p className="font-display text-2xl font-bold uppercase">Nenhuma Rotação ativa</p>
            <p className="mt-1 text-sm text-muted">Importe um Programa ou crie Templates e monte a ordem dos treinos.</p>
          </Card>
        )}
      </section>

      <section className="space-y-2 pt-2">
        <SectionHeader title="Templates" />
        {templates.map((t) => (
          <button key={t.id} className="block w-full text-left" onClick={() => actions.onOpenTemplate?.(t.id)} disabled={!actions.onOpenTemplate}>
          <Card className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-bold uppercase">{t.name}</p>
              <p className="text-sm text-muted">
                {[t.notes, `${t.exerciseCount} exercícios`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <ModalityTag modality={t.modality} />
          </Card>
          </button>
        ))}
        <Button variant="secondary" size="md" onClick={actions.onCreateTemplate} disabled={!actions.onCreateTemplate}>
          Criar Template
        </Button>
      </section>

      <Card tone="lilac" className="p-5">
        <Label className="opacity-70">Programa por IA</Label>
        <p className="mt-1 font-display text-4xl font-extrabold uppercase leading-none">Importar Programa</p>
        <p className="mt-2 text-sm">
          Copie um Prompt-modelo, cole no Claude ou no ChatGPT com seu objetivo e traga o Programa de volta.
        </p>
        <Button variant="dark" className="mt-4" onClick={actions.onImport} disabled={!actions.onImport}>
          Importar
        </Button>
      </Card>
    </main>
  )
}
