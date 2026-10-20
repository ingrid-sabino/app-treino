import { useEffect, useState } from 'react'

// Pictogramas de execução dos Exercícios: figura geométrica sem marca de gênero,
// em duas poses (início e fim), com animação entre elas. Corpo na cor do texto,
// equipamento em lima. Quadro de 100 × 74 (y de -8 a 66); o chão fica em y = 60.
// As duas poses de um Exercício têm os mesmos elementos, para a animação interpolar.

export type P = [number, number]

export interface Pose {
  head: P
  shoulder: P
  hip: P
  elbow: P
  hand: P
  knee: P
  foot: P
  // Membros do lado de longe: por padrão, os de perto deslocados (vista de lado)
  farElbow?: P
  farHand?: P
  farKnee?: P
  farFoot?: P
  // Equipamento: listas com o mesmo tamanho nas duas poses
  plates?: P[] // anilha de barra vista de frente
  weights?: P[] // halter
  pads?: P[] // rolo/apoio de máquina
  lines?: [P, P][] // banco, encosto, barra fixa, plataforma
  cables?: [P, P][] // cabo de polia
}

export interface PictogramDef {
  start: Pose
  end: Pose
  floor?: boolean
  frontal?: boolean // vista de frente: os dois lados com o mesmo peso
}

const DUR = '2.8s'
// Segura em cada ponta, vai e volta com suavidade
const KEY_TIMES = '0;0.18;0.5;0.68;1'
const SPLINES = '0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1'

const shift = ([x, y]: P, dx: number): P => [x + dx, y]
const d2 = (a: P, b: P) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`
const d3 = (a: P, b: P, c: P) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}`

function farLimbs(p: Pose) {
  return {
    elbow: p.farElbow ?? shift(p.elbow, 2),
    hand: p.farHand ?? shift(p.hand, 2),
    knee: p.farKnee ?? shift(p.knee, 2),
    foot: p.farFoot ?? shift(p.foot, 2),
    shoulder: p.farElbow ? p.shoulder : shift(p.shoulder, 2),
    hip: p.farKnee ? p.hip : shift(p.hip, 2),
  }
}

function anim(attr: string, a: string | number, b: string | number) {
  if (a === b) return null
  return (
    <animate
      attributeName={attr}
      values={`${a};${a};${b};${b};${a}`}
      keyTimes={KEY_TIMES}
      keySplines={SPLINES}
      calcMode="spline"
      dur={DUR}
      repeatCount="indefinite"
    />
  )
}

// Caminho que vai de `a` para `b` quando animado
function Path({ a, b, animated, ...rest }: { a: string; b: string; animated: boolean } & React.SVGProps<SVGPathElement>) {
  return (
    <path d={a} {...rest}>
      {animated && anim('d', a, b)}
    </path>
  )
}

function Dot({ a, b, r, animated, ...rest }: { a: P; b: P; r: number; animated: boolean } & React.SVGProps<SVGCircleElement>) {
  return (
    <circle cx={a[0]} cy={a[1]} r={r} {...rest}>
      {animated && anim('cx', a[0], b[0])}
      {animated && anim('cy', a[1], b[1])}
    </circle>
  )
}

const BODY = { stroke: 'var(--text)', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
const GEAR = { stroke: 'var(--lime)', strokeLinecap: 'round' as const, fill: 'none' }

function Figure({ def, frame, animated }: { def: PictogramDef; frame: 0 | 1; animated: boolean }) {
  const a = frame === 0 ? def.start : def.end
  const b = frame === 0 ? def.end : def.start
  const fa = farLimbs(a)
  const fb = farLimbs(b)
  const farOpacity = def.frontal ? 1 : 0.35
  return (
    <g>
      {def.floor !== false && <path d="M6 60H94" stroke="var(--line)" strokeWidth={1.5} />}
      {(a.lines ?? []).map((l, i) => (
        <Path key={`l${i}`} a={d2(...l)} b={d2(...(b.lines ?? [])[i])} animated={animated} {...GEAR} strokeWidth={3.5} />
      ))}
      {(a.cables ?? []).map((l, i) => (
        <Path key={`c${i}`} a={d2(...l)} b={d2(...(b.cables ?? [])[i])} animated={animated} {...GEAR} strokeWidth={1.2} />
      ))}
      <Path a={d3(fa.shoulder, fa.elbow, fa.hand)} b={d3(fb.shoulder, fb.elbow, fb.hand)} animated={animated} {...BODY} strokeOpacity={farOpacity} strokeWidth={4} />
      <Path a={d3(fa.hip, fa.knee, fa.foot)} b={d3(fb.hip, fb.knee, fb.foot)} animated={animated} {...BODY} strokeOpacity={farOpacity} strokeWidth={4} />
      <Path a={d2(a.shoulder, a.hip)} b={d2(b.shoulder, b.hip)} animated={animated} {...BODY} strokeWidth={6.5} />
      <Path a={d3(a.hip, a.knee, a.foot)} b={d3(b.hip, b.knee, b.foot)} animated={animated} {...BODY} strokeWidth={4} />
      <Path a={d3(a.shoulder, a.elbow, a.hand)} b={d3(b.shoulder, b.elbow, b.hand)} animated={animated} {...BODY} strokeWidth={4} />
      <Dot a={a.head} b={b.head} r={4.8} animated={animated} fill="var(--text)" />
      {(a.pads ?? []).map((p, i) => (
        <Dot key={`p${i}`} a={p} b={(b.pads ?? [])[i]} r={2.8} animated={animated} fill="var(--lime)" />
      ))}
      {(a.weights ?? []).map((p, i) => (
        <Dot key={`w${i}`} a={p} b={(b.weights ?? [])[i]} r={3.6} animated={animated} fill="var(--lime)" stroke="var(--surface-2)" strokeWidth={1} />
      ))}
      {(a.plates ?? []).map((p, i) => (
        <g key={`a${i}`}>
          <Dot a={p} b={(b.plates ?? [])[i]} r={6.5} animated={animated} fill="var(--lime)" stroke="var(--surface-2)" strokeWidth={1.2} />
          <Dot a={p} b={(b.plates ?? [])[i]} r={1.3} animated={animated} fill="var(--on-lime)" />
        </g>
      ))}
    </g>
  )
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Recorte quadrado em volta da figura e do equipamento (para miniaturas)
function fittedViewBox(def: PictogramDef): string {
  const pts: P[] = []
  for (const p of [def.start, def.end]) {
    pts.push(p.head, p.shoulder, p.hip, p.elbow, p.hand, p.knee, p.foot)
    for (const extra of [p.farElbow, p.farHand, p.farKnee, p.farFoot]) if (extra) pts.push(extra)
    for (const q of [...(p.plates ?? []), ...(p.weights ?? []), ...(p.pads ?? [])]) pts.push(q)
    for (const [q1, q2] of [...(p.lines ?? []), ...(p.cables ?? [])]) pts.push(q1, q2)
  }
  const xs = pts.map((q) => q[0])
  const ys = pts.map((q) => q[1])
  const pad = 7
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const size = Math.max(Math.max(...xs) - minX + pad, Math.max(...ys) - minY + pad)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`
}

// Um quadro parado (início ou fim) ou a animação entre os dois; `fit` recorta para miniatura
export function PictogramView({ def, frame = 0, animated = false, fit = false, className = '' }: { def: PictogramDef; frame?: 0 | 1; animated?: boolean; fit?: boolean; className?: string }) {
  const reduced = usePrefersReducedMotion()
  return (
    <svg viewBox={fit ? fittedViewBox(def) : '0 -8 100 74'} className={`bg-surface-2 ${className}`} aria-hidden="true">
      <Figure def={def} frame={frame} animated={animated && !reduced} />
    </svg>
  )
}
