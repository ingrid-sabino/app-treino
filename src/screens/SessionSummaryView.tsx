import { Button, Card, Label, SectionHeader, Stat } from '../components/ui'
import { formatClock, type PersonalRecord, type SessionSummary } from '../lib/session'

// Resumo da Sessão concluída (FR-9, FR-27).

const kg = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export default function SessionSummaryView({
  title,
  summary,
  exerciseName,
  onDone,
}: {
  title: string
  summary: SessionSummary
  exerciseName: (id: string) => string
  onDone: () => void
}) {
  const recordText = (r: PersonalRecord) =>
    r.kind === 'weight' ? `Maior peso: ${kg(r.value)} kg` : `1RM estimado: ${kg(r.value)} kg`
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Card tone="inverse" className="p-5">
        <Label className="opacity-70">Treino concluído</Label>
        <p className="mt-2 font-display text-6xl font-extrabold uppercase leading-[0.9]">{title}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
          <Stat label="Duração" value={formatClock(summary.durationSeconds)} />
          <Stat label="Volume" value={kg(summary.volumeKg)} unit="kg" />
          <Stat label="Reps" value={String(summary.reps)} />
          <Stat label="Séries" value={String(summary.setsDone)} />
        </div>
      </Card>

      {summary.records.length > 0 && (
        <section className="space-y-2">
          <SectionHeader title={summary.records.length === 1 ? 'Recorde novo' : 'Recordes novos'} />
          {summary.records.map((r) => (
            <Card key={`${r.exerciseId}-${r.kind}`} tone="lilac" className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-inverse font-display text-xl font-extrabold text-lime">★</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold uppercase">{exerciseName(r.exerciseId)}</p>
                <p className="text-sm">
                  {recordText(r)}
                  {r.previous != null && <span className="opacity-70"> · antes {kg(r.previous)} kg</span>}
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Button onClick={onDone}>Voltar para Hoje</Button>
    </main>
  )
}
