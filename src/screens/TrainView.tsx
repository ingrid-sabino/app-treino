import TrainingDays from '../components/TrainingDays'
import { Button, Card, Label, ModalityTag, SectionHeader } from '../components/ui'
import type { TrainModel } from '../lib/train'

// Aba Treinar, só apresentação (dados em lib/train.ts).

interface Actions {
  onStartFree?: () => void
  onLogCardio?: () => void
  onLogYoga?: () => void
  onSlotsChange?: (slots: number[]) => void
  onCreateTemplate?: () => void
  onOpenTemplate?: (id: string) => void
  onEditRotation?: (id: string) => void
  onNewRotation?: () => void
  onImport?: () => void
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
        <SectionHeader
          title="Rotação"
          action={
            actions.onNewRotation && (
              <button className="text-sm font-semibold text-lilac-strong" onClick={actions.onNewRotation}>
                + Nova
              </button>
            )
          }
        />
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
            <div className="mt-5 border-t border-white/15 pt-4">
              <TrainingDays slots={rotation.weeklySlots} onChange={actions.onSlotsChange} onInverse />
            </div>
            {actions.onEditRotation && (
              <Button variant="dark" size="md" className="mt-4 border border-white/20" onClick={() => actions.onEditRotation!(rotation.id)}>
                Editar Rotação
              </Button>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <p className="font-display text-2xl font-bold uppercase">Nenhuma Rotação ativa</p>
            <p className="mt-1 text-sm text-muted">Importe um Programa ou crie Templates e monte a ordem dos treinos.</p>
            {actions.onNewRotation && (
              <Button size="md" className="mt-4" onClick={actions.onNewRotation}>
                Montar Rotação
              </Button>
            )}
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
