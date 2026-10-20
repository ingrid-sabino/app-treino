import { useState } from 'react'
import TrendChart from '../components/TrendChart'
import { Button, Card, SectionHeader, Stat } from '../components/ui'
import type { ProgressModel } from '../lib/progress'

// Aba Evolução, só apresentação (dados em lib/progress.ts).

const kg = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export default function ProgressView({ model, onLogBody }: { model: ProgressModel; onLogBody?: () => void }) {
  const [selected, setSelected] = useState(model.strength[0]?.exerciseId)
  const exercise = model.strength.find((s) => s.exerciseId === selected) ?? model.strength[0]
  const lastWeight = model.weight[model.weight.length - 1]
  const weightChange = model.weight.length > 1 ? lastWeight.value - model.weight[0].value : 0

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <h1 className="text-6xl">Evolução</h1>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Card tone="inverse">
          <Stat label="Sessões no mês" value={String(model.sessionsThisMonth)} />
        </Card>
        <Card tone="lime">
          <Stat label="Volume na semana" value={kg(model.volumeThisWeekKg)} unit="kg" />
        </Card>
      </section>

      <section className="space-y-2 pt-2">
        <SectionHeader title="Força" />
        {exercise ? (
          <Card>
            {/* Filtro do Exercício numa linha acima do gráfico */}
            <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
              {model.strength.map((s) => (
                <button
                  key={s.exerciseId}
                  onClick={() => setSelected(s.exerciseId)}
                  className={`shrink-0 rounded-sm px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    s.exerciseId === exercise.exerciseId ? 'bg-inverse text-on-inverse' : 'bg-surface-2 text-ink'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <Stat label="1RM estimado" value={kg(exercise.points[exercise.points.length - 1].value)} unit="kg" />
              {exercise.change !== 0 && (
                <p className={`text-sm font-bold ${exercise.change > 0 ? 'text-lilac-strong' : 'text-muted'}`}>
                  {exercise.change > 0 ? '+' : ''}
                  {kg(exercise.change)} kg em {exercise.points.length} treinos
                </p>
              )}
            </div>
            <div className="mt-2">
              <TrendChart points={exercise.points} unit="kg" />
            </div>
            <p className="mt-1 text-xs text-muted">1RM estimado pela fórmula de Epley: peso × (1 + reps ÷ 30).</p>
          </Card>
        ) : (
          <Card>
            <p className="font-display text-xl font-bold uppercase">Sem dados de força ainda</p>
            <p className="mt-1 text-sm text-muted">A curva aparece depois das primeiras Sessões de musculação.</p>
          </Card>
        )}
      </section>

      <section className="space-y-2 pt-2">
        <SectionHeader title="Corpo" />
        <Card>
          {lastWeight ? (
            <>
              <div className="flex items-end justify-between">
                <Stat label="Peso corporal" value={kg(lastWeight.value)} unit="kg" />
                {weightChange !== 0 && (
                  <p className="text-sm font-bold text-muted">
                    {weightChange > 0 ? '+' : ''}
                    {kg(weightChange)} kg no período
                  </p>
                )}
              </div>
              <div className="mt-2">
                <TrendChart points={model.weight} unit="kg" />
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold uppercase">Nenhum Registro corporal</p>
              <p className="mt-1 text-sm text-muted">Registre peso, medidas e Fotos de progresso para ver a evolução.</p>
            </>
          )}
          <Button className="mt-4" size="md" onClick={onLogBody} disabled={!onLogBody}>
            Registrar corpo
          </Button>
        </Card>
      </section>
    </main>
  )
}
