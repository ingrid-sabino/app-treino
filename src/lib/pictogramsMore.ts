import type { P, PictogramDef, Pose } from '../components/Pictogram'

// Poses do catálogo ampliado (migration 0004). Em vez de coordenadas soltas, cada pose
// sai de um quadril, do ângulo do tronco e dos alvos de mãos e pés: joelhos e cotovelos
// vêm da cinemática inversa, com os ossos sempre do mesmo tamanho. Figura olhando para a
// direita; ângulos em graus na tela (0 = direita, 90 = baixo, -90 = cima).

const BONE = { torso: 17, neck: 8, upperArm: 10, forearm: 10, thigh: 11.5, shin: 10.5 }
const rad = (deg: number) => (deg * Math.PI) / 180
const half = (n: number) => Math.round(n * 2) / 2
const round = (p: P): P => [half(p[0]), half(p[1])]
const toward = (p: P, deg: number, len: number): P => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))]
const add = (p: P, d: P): P => [p[0] + d[0], p[1] + d[1]]

// Junta do meio entre a raiz e a ponta; `side` escolhe para que lado ela dobra
// (+1 = à esquerda do sentido raiz → ponta, na tela). Ponta fora de alcance é puxada para perto.
function limb(root: P, target: P, a: number, b: number, side: number): { mid: P; tip: P } {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const len = Math.hypot(dx, dy) || 1e-6
  const ux = dx / len
  const uy = dy / len
  const d = Math.min(len, a + b - 0.01)
  const x = (a * a - b * b + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, a * a - x * x))
  return {
    mid: [root[0] + ux * x - uy * h * side, root[1] + uy * x + ux * h * side],
    tip: [root[0] + ux * d, root[1] + uy * d],
  }
}

interface Spec {
  hip: P
  torso?: number // ângulo do quadril para o ombro
  shoulder?: P // ou o ponto para onde o tronco aponta
  neck?: number // inclinação extra da cabeça
  headDist?: number
  hand?: P
  handRel?: P // mão relativa ao ombro
  farHand?: P
  farHandRel?: P
  foot: P
  farFoot?: P
  elbowSide?: number
  farElbowSide?: number
  kneeSide?: number
  farKneeSide?: number
}

const HANG: P = [1.5, 19.5] // braço solto ao lado do corpo

function body(s: Spec): Pose {
  const angle = s.shoulder ? (Math.atan2(s.shoulder[1] - s.hip[1], s.shoulder[0] - s.hip[0]) * 180) / Math.PI : (s.torso ?? -90)
  const shoulder = toward(s.hip, angle, BONE.torso)
  const head = toward(shoulder, angle + (s.neck ?? 0), s.headDist ?? BONE.neck)
  const arm = limb(shoulder, s.hand ?? add(shoulder, s.handRel ?? HANG), BONE.upperArm, BONE.forearm, s.elbowSide ?? 1)
  const leg = limb(s.hip, s.foot, BONE.thigh, BONE.shin, s.kneeSide ?? -1)
  const pose: Pose = {
    head: round(head),
    shoulder: round(shoulder),
    hip: round(s.hip),
    elbow: round(arm.mid),
    hand: round(arm.tip),
    knee: round(leg.mid),
    foot: round(leg.tip),
  }
  const farHand = s.farHand ?? (s.farHandRel && add(shoulder, s.farHandRel))
  if (farHand) {
    const far = limb(shoulder, farHand, BONE.upperArm, BONE.forearm, s.farElbowSide ?? s.elbowSide ?? 1)
    pose.farElbow = round(far.mid)
    pose.farHand = round(far.tip)
  }
  if (s.farFoot) {
    const far = limb(s.hip, s.farFoot, BONE.thigh, BONE.shin, s.farKneeSide ?? s.kneeSide ?? -1)
    pose.farKnee = round(far.mid)
    pose.farFoot = round(far.tip)
  }
  return pose
}

type Gear = (p: Pose) => Partial<Pose>

function move(a: Spec, b: Spec, gear: Gear = () => ({}), opts: Pick<PictogramDef, 'floor' | 'frontal'> = {}): PictogramDef {
  const pa = body(a)
  const pb = body(b)
  return { ...opts, start: { ...pa, ...gear(pa) }, end: { ...pb, ...gear(pb) } }
}

// Equipamento preso ao corpo
const barAtHand: Gear = (p) => ({ plates: [p.hand] })
const dumbbell: Gear = (p) => ({ weights: [p.hand] })
const dumbbells: Gear = (p) => ({ weights: [p.hand, p.farHand ?? p.hand] })
const withLines =
  (lines: [P, P][], inner: Gear = () => ({})): Gear =>
  (p) => ({ ...inner(p), lines: [...(inner(p).lines ?? []), ...lines] })
const flatBench = (x: number, y: number, w: number): [P, P][] => [
  [[x, y], [x + w, y]],
  [[x + 4, y], [x + 4, 60]],
  [[x + w - 4, y], [x + w - 4, 60]],
]
const STAND: Spec = { hip: [50, 38], torso: -90, foot: [50.5, 60] }
const LYING: Spec = { hip: [56, 43], torso: 180, foot: [70, 59.5] }

export const MORE_PICTOGRAMS: Record<string, PictogramDef> = {
  // Peito
  'Supino inclinado com barra': move(
    { hip: [50, 45], torso: -131, foot: [66, 59.5], hand: [41, 12] },
    { hip: [50, 45], torso: -131, foot: [66, 59.5], hand: [41, 28], elbowSide: 1 },
    withLines([[[26, 24], [45, 48]], [[43, 48], [60, 48]], [[51, 48], [51, 60]]], barAtHand),
  ),
  'Supino declinado': move(
    { hip: [58, 38], torso: 172, foot: [71, 50], kneeSide: 1, hand: [42, 21] },
    { hip: [58, 38], torso: 172, foot: [71, 50], kneeSide: 1, hand: [43, 36] },
    withLines([[[29, 45], [62, 41]], [[35, 44.5], [35, 60]], [[58, 41.5], [58, 60]]], (p) => ({ plates: [p.hand], pads: [[72, 47]] })),
  ),
  'Supino reto com halteres': move(
    { ...LYING, hand: [40, 24] },
    { ...LYING, hand: [37, 36], elbowSide: -1 },
    withLines(flatBench(26, 47, 40), dumbbell),
  ),
  'Crucifixo com halteres': move(
    { ...LYING, hand: [40, 24], farHand: [41, 24] },
    { ...LYING, hand: [30, 47], farHand: [50, 47], elbowSide: -1, farElbowSide: 1 },
    withLines(flatBench(26, 47, 40), dumbbells),
  ),
  Crossover: move(
    { hip: [50, 38], torso: -90, foot: [45, 60], farFoot: [55, 60], hand: [31, 15], farHand: [69, 15], elbowSide: 1, farElbowSide: -1, farKneeSide: 1 },
    { hip: [50, 38], torso: -90, foot: [45, 60], farFoot: [55, 60], hand: [47, 37], farHand: [53, 37], elbowSide: 1, farElbowSide: -1, farKneeSide: 1 },
    (p) => ({ pads: [p.hand, p.farHand!], cables: [[[8, -6], p.hand], [[92, -6], p.farHand!]] }),
    { frontal: true },
  ),
  'Flexão de braço': move(
    { hip: [48, 46.5], torso: -153, foot: [70, 59.5], hand: [33, 59.5] },
    { hip: [49, 52], torso: -170, foot: [70, 59.5], hand: [35, 59.5], elbowSide: -1 },
  ),

  // Ombros
  'Desenvolvimento com halteres': move({ ...STAND, hand: [57, 16] }, { ...STAND, hand: [52, 1] }, dumbbell),
  'Elevação frontal': move({ ...STAND, hand: [53, 40] }, { ...STAND, hand: [70, 20] }, dumbbell),
  'Crucifixo invertido': move(
    { hip: [50, 38], torso: -90, foot: [45, 60], farFoot: [55, 60], hand: [47, 39], farHand: [53, 39], elbowSide: -1, farElbowSide: 1, farKneeSide: 1 },
    { hip: [50, 38], torso: -90, foot: [45, 60], farFoot: [55, 60], hand: [31, 24], farHand: [69, 24], elbowSide: -1, farElbowSide: 1, farKneeSide: 1 },
    dumbbells,
    { frontal: true },
  ),
  'Remada alta': move({ ...STAND, hand: [53, 40] }, { ...STAND, hand: [55, 24], elbowSide: -1 }, barAtHand),
  Encolhimento: move({ ...STAND, hand: [52, 41] }, { ...STAND, headDist: 5.5, hand: [52, 37] }, dumbbell),
  'Face pull': move(
    { ...STAND, hand: [70, 18] },
    { ...STAND, hand: [57, 13], elbowSide: -1 },
    (p) => ({ pads: [p.hand], cables: [[[94, 15], p.hand]] }),
  ),

  // Costas
  'Remada unilateral com halter': move(
    { hip: [38, 36], torso: -6, foot: [37, 60], farFoot: [26, 46.5], farKneeSide: 1, hand: [56, 54], farHand: [58, 46.5] },
    { hip: [38, 36], torso: -6, foot: [37, 60], farFoot: [26, 46.5], farKneeSide: 1, hand: [48, 38], farHand: [58, 46.5] },
    withLines([[[20, 48], [64, 48]], [[24, 48], [24, 60]], [[60, 48], [60, 60]]], dumbbell),
  ),
  'Pulldown com braços estendidos': move(
    { hip: [48, 38], torso: -80, foot: [50.5, 60], hand: [68, 6] },
    { hip: [48, 38], torso: -80, foot: [50.5, 60], hand: [57, 40] },
    (p) => ({ pads: [p.hand], cables: [[[82, -7], p.hand]] }),
  ),
  'Remada cavalinho': move(
    { hip: [44, 37], torso: -25, neck: -20, foot: [51, 60], hand: [62, 48] },
    { hip: [44, 37], torso: -25, neck: -20, foot: [51, 60], hand: [57, 40] },
    (p) => ({ plates: [p.hand], lines: [[[20, 59], p.hand]] }),
  ),
  'Hiperextensão lombar': move(
    { hip: [48, 34], torso: 75, foot: [28, 43.5], kneeSide: 1, handRel: [4, -3] },
    { hip: [48, 34], torso: -12, foot: [28, 43.5], kneeSide: 1, handRel: [-3, 4] },
    () => ({ pads: [[50, 38], [29, 47]], lines: [[[22, 60], [52, 39]], [[36, 50], [36, 60]]] }),
  ),

  // Bíceps
  'Rosca alternada': move(
    { ...STAND, hand: [53, 40], farHand: [59, 23] },
    { ...STAND, hand: [59, 23], farHand: [53, 40] },
    dumbbells,
  ),
  'Rosca Scott': move(
    { hip: [40, 42], torso: -96, foot: [54, 60], hand: [54, 41] },
    { hip: [40, 42], torso: -96, foot: [54, 60], hand: [50, 22], elbowSide: 1 },
    withLines([[[42, 29], [56, 41]], [[53, 39], [53, 60]], [[30, 44], [46, 44]], [[38, 44], [38, 60]]], barAtHand),
  ),
  'Rosca na polia': move(
    { ...STAND, hand: [54, 40] },
    { ...STAND, hand: [58, 23] },
    (p) => ({ pads: [p.hand], cables: [[[70, 59], p.hand]] }),
  ),
  'Rosca concentrada': move(
    { hip: [38, 44], torso: -62, foot: [58, 60], hand: [52, 53] },
    { hip: [38, 44], torso: -62, foot: [58, 60], hand: [50, 34], elbowSide: 1 },
    withLines([[[26, 46], [42, 46]], [[34, 46], [34, 60]]], dumbbell),
  ),

  // Tríceps
  'Tríceps testa': move(
    { ...LYING, hand: [40, 24] },
    { ...LYING, hand: [31, 33] },
    withLines(flatBench(26, 47, 40), barAtHand),
  ),
  'Tríceps corda': move(
    { ...STAND, hip: [49, 38], torso: -84, hand: [60, 26] },
    { ...STAND, hip: [49, 38], torso: -84, hand: [55, 45] },
    (p) => ({ pads: [p.hand], cables: [[[64, -7], p.hand]] }),
  ),
  'Mergulho no banco': move(
    { hip: [41, 40], torso: -92, foot: [72, 59.5], kneeSide: -1, hand: [36, 42.5] },
    { hip: [41, 48], torso: -92, foot: [72, 59.5], kneeSide: -1, hand: [36, 42.5], elbowSide: -1 },
    () => ({ lines: [[[22, 44], [38, 44]], [[25, 44], [25, 60]]] }),
  ),
  'Mergulho nas paralelas': move(
    { hip: [50, 30], torso: -90, foot: [47, 52], farFoot: [53, 52], farKneeSide: 1, hand: [41, 31], farHand: [59, 31], elbowSide: -1, farElbowSide: 1 },
    { hip: [50, 38], torso: -90, foot: [47, 60], farFoot: [53, 60], farKneeSide: 1, hand: [41, 31], farHand: [59, 31], elbowSide: -1, farElbowSide: 1 },
    () => ({ lines: [[[30, 31.5], [43, 31.5]], [[57, 31.5], [70, 31.5]], [[32, 31.5], [32, 60]], [[68, 31.5], [68, 60]]] }),
    { frontal: true },
  ),
  'Tríceps coice': move(
    { hip: [44, 37], torso: -22, foot: [51, 60], hand: [53, 46], elbowSide: 1 },
    { hip: [44, 37], torso: -22, foot: [51, 60], hand: [37, 33] },
    dumbbell,
  ),
  'Supino fechado': move(
    { ...LYING, hand: [40, 24] },
    { ...LYING, hand: [41, 37], elbowSide: 1 },
    withLines(flatBench(26, 47, 40), barAtHand),
  ),

  // Pernas
  'Agachamento sumô': move(
    { hip: [50, 37], torso: -90, foot: [38, 60], farFoot: [62, 60], kneeSide: 1, farKneeSide: -1, hand: [50, 43], farHand: [50, 43], elbowSide: 1, farElbowSide: -1 },
    { hip: [50, 47], torso: -90, foot: [38, 60], farFoot: [62, 60], kneeSide: 1, farKneeSide: -1, hand: [50, 52], farHand: [50, 52], elbowSide: 1, farElbowSide: -1 },
    dumbbell,
    { frontal: true },
  ),
  'Agachamento búlgaro': move(
    { hip: [47, 38], torso: -86, foot: [58, 60], farFoot: [29, 44], farKneeSide: 1 },
    { hip: [46, 46], torso: -80, foot: [58, 60], farFoot: [29, 44], farKneeSide: 1 },
    withLines([[[20, 46], [34, 46]], [[23, 46], [23, 60]]], dumbbell),
  ),
  Afundo: move(
    { hip: [48, 38], torso: -90, foot: [62, 60], farFoot: [34, 59], farKneeSide: 1 },
    { hip: [48, 47], torso: -90, foot: [62, 60], farFoot: [34, 59], farKneeSide: 1 },
    dumbbell,
  ),
  'Agachamento hack': move(
    { hip: [42, 37], torso: -104, foot: [57, 56], handRel: [4, 1] },
    { hip: [35, 47], torso: -112, foot: [57, 56], handRel: [4, 1] },
    (p) => ({ pads: [p.shoulder], lines: [[[50, 60], [66, 55]], [add(p.hip, [-4, 2]), add(p.shoulder, [-4, 0])]] }),
  ),
  'Agachamento goblet': move(
    { ...STAND, handRel: [7, 7] },
    { hip: [38, 46], torso: -62, foot: [50.5, 60], handRel: [7, 7] },
    dumbbell,
  ),
  'Agachamento no Smith': move(
    { ...STAND, handRel: [-5, -1] },
    { hip: [40, 47], torso: -72, neck: -10, foot: [52, 60], handRel: [-5, -1] },
    (p) => ({ plates: [add(p.hand, [1, 0])], lines: [[[33, -6], [33, 60]]] }),
  ),
  'Cadeira adutora': move(
    { hip: [50, 40], torso: -90, foot: [31, 55], farFoot: [69, 55], kneeSide: 1, farKneeSide: -1, hand: [40, 41], farHand: [60, 41], elbowSide: -1, farElbowSide: 1 },
    { hip: [50, 40], torso: -90, foot: [43, 58], farFoot: [57, 58], kneeSide: 1, farKneeSide: -1, hand: [40, 41], farHand: [60, 41], elbowSide: -1, farElbowSide: 1 },
    (p) => ({ pads: [add(p.knee, [2, 0]), add(p.farKnee!, [-2, 0])], lines: [[[38, 42], [62, 42]]] }),
    { frontal: true },
  ),
  'Cadeira abdutora': move(
    { hip: [50, 40], torso: -90, foot: [43, 58], farFoot: [57, 58], kneeSide: 1, farKneeSide: -1, hand: [40, 41], farHand: [60, 41], elbowSide: -1, farElbowSide: 1 },
    { hip: [50, 40], torso: -90, foot: [31, 55], farFoot: [69, 55], kneeSide: 1, farKneeSide: -1, hand: [40, 41], farHand: [60, 41], elbowSide: -1, farElbowSide: 1 },
    (p) => ({ pads: [add(p.knee, [-2.5, 0]), add(p.farKnee!, [2.5, 0])], lines: [[[38, 42], [62, 42]]] }),
    { frontal: true },
  ),
  'Subida no banco': move(
    { hip: [47, 38], torso: -86, foot: [62, 46], farFoot: [45, 60] },
    { hip: [62, 24], torso: -90, foot: [62.5, 46], farFoot: [57, 44] },
    withLines([[[54, 46.5], [76, 46.5]], [[55, 46.5], [55, 60]], [[75, 46.5], [75, 60]]], dumbbell),
  ),

  // Posterior
  'Cadeira flexora': move(
    { hip: [41, 40], torso: -92, foot: [67, 38], hand: [47, 41] },
    { hip: [41, 40], torso: -92, foot: [52, 55], hand: [47, 41] },
    (p) => ({ pads: [add(p.foot, [0, 2.5])], lines: [[[35, 8], [35, 43]], [[35, 43], [56, 43]], [[46, 43], [46, 60]]] }),
  ),
  'Bom dia': move(
    { ...STAND, handRel: [-5, -1] },
    { hip: [43, 38], torso: -14, neck: -15, foot: [50.5, 60], handRel: [-1, -5] },
    (p) => ({ plates: [add(p.hand, [1, 0])] }),
  ),

  // Glúteos
  'Glúteo na polia': move(
    { hip: [48, 38], torso: -78, foot: [49, 59.5], farFoot: [51, 60], hand: [66, 26] },
    { hip: [48, 38], torso: -74, foot: [30, 46], farFoot: [51, 60], kneeSide: 1, hand: [66, 26] },
    (p) => ({ pads: [p.foot], cables: [[[72, 57], p.foot]], lines: [[[72, -6], [72, 60]]] }),
  ),
  'Ponte de glúteo': move(
    { hip: [45, 57.5], torso: 180, foot: [61, 59.5], hand: [44, 59.5] },
    { hip: [44, 46], shoulder: [28, 56.5], foot: [61, 59.5], hand: [44, 59.5] },
  ),

  // Panturrilhas
  'Panturrilha sentada': move(
    { hip: [40, 42], torso: -92, foot: [53, 59.5], hand: [51, 41] },
    { hip: [40, 42], torso: -92, foot: [53, 55.5], hand: [51, 37] },
    (p) => ({ pads: [add(p.knee, [0, -3])], lines: [[[30, 44], [46, 44]], [[38, 44], [38, 60]], [[48, 59], [62, 59]]] }),
  ),
  'Panturrilha no leg press': {
    start: {
      head: [19, 33], shoulder: [25, 40], hip: [38, 52], elbow: [33, 47], hand: [40, 53], knee: [51, 42], foot: [63, 33],
      lines: [[[17, 35], [35, 57]], [[59, 27], [67, 39]]],
    },
    end: {
      head: [19, 33], shoulder: [25, 40], hip: [38, 52], elbow: [33, 47], hand: [40, 53], knee: [52, 41], foot: [66, 30],
      lines: [[[17, 35], [35, 57]], [[62, 24], [70, 36]]],
    },
  },

  // Core
  'Abdominal supra': move(
    { hip: [52, 57], torso: 180, foot: [65, 59.5], handRel: [5, -3] },
    { hip: [52, 57], torso: -152, foot: [65, 59.5], handRel: [6, 2] },
  ),
  'Abdominal infra': move(
    { hip: [52, 57], torso: 180, foot: [74, 58.5], kneeSide: 1, hand: [50, 59.5] },
    { hip: [52, 57], torso: 180, foot: [55, 35], kneeSide: 1, hand: [50, 59.5] },
  ),
  'Elevação de pernas na barra': move(
    { hip: [50, 42], torso: -92, foot: [51, 64], kneeSide: -1, hand: [51, 6] },
    { hip: [50, 42], torso: -98, foot: [72, 42], kneeSide: 1, hand: [51, 6] },
    () => ({ lines: [[[30, 6], [74, 6]]] }),
    { floor: false },
  ),
  'Prancha lateral': move(
    { hip: [55, 51], shoulder: [33, 46], foot: [80, 59], hand: [43, 59.5], farHandRel: [1, -18], elbowSide: 1 },
    { hip: [56, 44], shoulder: [33, 46], foot: [80, 59], hand: [43, 59.5], farHandRel: [1, -18], elbowSide: 1 },
    () => ({}),
    { frontal: true },
  ),
  'Abdominal oblíquo': move(
    { hip: [50, 54], torso: -100, foot: [38, 60], farFoot: [62, 60], kneeSide: 1, farKneeSide: -1, hand: [36, 47], farHand: [37, 48], elbowSide: 1 },
    { hip: [50, 54], torso: -80, foot: [38, 60], farFoot: [62, 60], kneeSide: 1, farKneeSide: -1, hand: [64, 47], farHand: [63, 48], elbowSide: -1 },
    dumbbell,
    { frontal: true },
  ),
  'Abdominal na polia': move(
    { hip: [49, 48], torso: -82, foot: [37, 59.5], kneeSide: 1, handRel: [3, -6] },
    { hip: [49, 48], torso: 0, neck: 30, foot: [37, 59.5], kneeSide: 1, handRel: [-1, 4] },
    (p) => ({ pads: [p.hand], cables: [[[70, -6], p.hand]] }),
  ),
  'Roda abdominal': move(
    { hip: [46, 49], torso: -40, foot: [30, 59.5], kneeSide: 1, hand: [60, 57] },
    { hip: [52, 53], torso: -6, foot: [30, 59.5], kneeSide: 1, hand: [80, 57] },
    dumbbell,
  ),
  Escalador: move(
    { hip: [48, 46.5], torso: -153, foot: [70, 59.5], farFoot: [70, 59.5], hand: [33, 59.5] },
    { hip: [48, 46.5], torso: -153, foot: [44, 51], farFoot: [70, 59.5], kneeSide: 1, hand: [33, 59.5] },
  ),
}
