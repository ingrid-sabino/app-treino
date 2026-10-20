import Model, { type Muscle } from 'react-body-highlighter'

// Mapa do corpo (frente e costas) com os músculos trabalhados acesos:
// principal em lima, secundários em lilás. Biblioteca react-body-highlighter (MIT).

export function MuscleMap({ primary, secondary = [] }: { primary: Muscle[]; secondary?: Muscle[] }) {
  const data = [
    { name: 'secundário', muscles: secondary, frequency: 1 },
    { name: 'principal', muscles: primary, frequency: 2 },
  ]
  // Cores fixas da marca: a biblioteca pinta com valores literais, não com variáveis CSS
  const colors = ['#b9a7f5', '#d4f26a', '#d4f26a']
  const body = 'var(--line)'
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['anterior', 'posterior'] as const).map((type) => (
        <figure key={type} className="rounded-md bg-surface-2 p-3">
          <Model type={type} data={data} highlightedColors={colors} bodyColor={body} style={{ width: '100%' }} svgStyle={{ width: '100%', height: 'auto' }} />
          <figcaption className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-muted">{type === 'anterior' ? 'Frente' : 'Costas'}</figcaption>
        </figure>
      ))}
    </div>
  )
}
