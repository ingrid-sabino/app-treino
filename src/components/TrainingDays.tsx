import { Label } from './ui'

// Dias de treino da Rotação (FR-34): quantos treinos cabem em cada dia, de 0 a 3.
const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const WEEKDAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const MAX_SLOTS = 3

export default function TrainingDays({ slots, onChange, onInverse = false }: { slots: number[]; onChange?: (slots: number[]) => void; onInverse?: boolean }) {
  const total = slots.reduce((a, b) => a + b, 0)
  const off = onInverse ? 'border border-white/20 text-on-inverse/60' : 'border border-line text-muted'
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className={onInverse ? 'opacity-70' : 'text-muted'}>Dias de treino</Label>
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
            className={`flex h-14 flex-col items-center justify-center rounded-md font-display font-bold ${n > 0 ? 'bg-lime text-on-lime' : off}`}
          >
            <span className="text-[11px] uppercase">{WEEKDAYS[i]}</span>
            <span className="text-xl leading-none">{n > 0 ? n : '–'}</span>
          </button>
        ))}
      </div>
      {onChange && <p className={`mt-2 text-xs ${onInverse ? 'opacity-60' : 'text-muted'}`}>Toque num dia para mudar quantos treinos cabem nele.</p>}
    </div>
  )
}
