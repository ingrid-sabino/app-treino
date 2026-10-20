import { pictogramFor } from '../lib/pictograms'
import { PictogramView } from './Pictogram'

// Ilustração de execução dos Exercícios: pictogramas sem marca de gênero (lib/pictograms.ts).
// Sem pictograma (Exercício criado pela pessoa), a inicial do grupo muscular.

// Miniatura parada (listas); quadro de 100 × 74
export function ExerciseThumb({ name, muscleGroup, className = 'h-14 w-14' }: { name: string; muscleGroup: string; className?: string }) {
  const def = pictogramFor(name)
  if (!def) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-display text-2xl font-bold uppercase text-muted ${className}`}>
        {muscleGroup.slice(0, 1) || '?'}
      </div>
    )
  }
  return <PictogramView def={def} frame={1} fit className={`shrink-0 rounded-md ${className}`} />
}

// Animação do movimento e, abaixo, início e fim parados
export function ExerciseFrames({ name }: { name: string }) {
  const def = pictogramFor(name)
  if (!def) return <p className="text-sm text-muted">Sem ilustração de execução para este Exercício.</p>
  return (
    <div className="space-y-2">
      <PictogramView def={def} animated className="w-full rounded-md" />
      <div className="grid grid-cols-2 gap-2">
        {(['Início', 'Fim'] as const).map((label, i) => (
          <figure key={label}>
            <PictogramView def={def} frame={i as 0 | 1} className="w-full rounded-md" />
            <figcaption className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
