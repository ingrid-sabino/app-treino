import { exerciseInfo, highlightFor, MUSCLE_NAMES } from '../lib/exerciseInfo'
import { pictogramFor } from '../lib/pictograms'
import { MuscleMap } from './MuscleMap'
import { PictogramView } from './Pictogram'
import { Label } from './ui'

// Ilustração e ficha dos Exercícios: pictograma sem marca de gênero com os músculos
// que trabalham acesos, mapa do corpo e "Como fazer". Sem dados (Exercício criado
// pela pessoa), a miniatura mostra a inicial do grupo muscular.

export function ExerciseThumb({ name, muscleGroup, className = 'h-14 w-14' }: { name: string; muscleGroup: string; className?: string }) {
  const def = pictogramFor(name)
  const info = exerciseInfo(name)
  if (!def) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-display text-2xl font-bold uppercase text-muted ${className}`}>
        {muscleGroup.slice(0, 1) || '?'}
      </div>
    )
  }
  return <PictogramView def={def} frame={1} fit highlight={info ? highlightFor(info) : undefined} className={`shrink-0 rounded-md ${className}`} />
}

function MuscleChips({ muscles, tone }: { muscles: string[]; tone: 'primary' | 'secondary' }) {
  return (
    <>
      {muscles.map((m) => (
        <span
          key={m}
          className={`inline-flex h-7 items-center rounded-sm px-2 text-xs font-bold uppercase tracking-wider ${
            tone === 'primary' ? 'bg-lime text-on-lime' : 'bg-lilac text-on-lilac'
          }`}
        >
          {MUSCLE_NAMES[m as keyof typeof MUSCLE_NAMES] ?? m}
        </span>
      ))}
    </>
  )
}

// Ficha completa: simulação animada, músculos, mapa do corpo e passos
export function ExerciseSheetContent({ name }: { name: string }) {
  const def = pictogramFor(name)
  const info = exerciseInfo(name)
  if (!def && !info) return <p className="text-sm text-muted">Ainda não há ficha para este Exercício.</p>
  return (
    <div className="max-h-[75dvh] space-y-4 overflow-y-auto pb-2">
      {def && <PictogramView def={def} animated highlight={info ? highlightFor(info) : undefined} className="w-full rounded-md" />}
      {info && (
        <>
          <div>
            <Label className="mb-1.5 text-muted">Músculos</Label>
            <div className="flex flex-wrap gap-1.5">
              <MuscleChips muscles={info.primary} tone="primary" />
              <MuscleChips muscles={info.secondary} tone="secondary" />
            </div>
            <p className="mt-1.5 text-xs text-muted">Lima: principal · Lilás: ajuda no movimento</p>
          </div>
          <MuscleMap primary={info.primary} secondary={info.secondary} />
          <div>
            <Label className="mb-1.5 text-muted">Como fazer</Label>
            <ol className="space-y-2">
              {info.howTo.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-inverse font-display text-sm font-bold text-on-inverse">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
