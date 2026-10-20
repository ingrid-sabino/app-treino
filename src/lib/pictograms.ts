import type { P, PictogramDef, Pose } from '../components/Pictogram'

// Poses (início e fim) dos Exercícios do catálogo. Quadro 100 × 74, chão em y = 60.
// Figura em pé de referência: cabeça 14, ombro 22, quadril 39, joelho 50, pé 60.

const standing = { head: [51, 14] as P, shoulder: [50, 22] as P, hip: [50, 39] as P, knee: [51, 50] as P, foot: [50, 60] as P }
const up = (p: P, dy: number): P => [p[0], p[1] - dy]
const raise = (pose: Pose, dy: number): Pose => ({
  ...pose,
  head: up(pose.head, dy),
  shoulder: up(pose.shoulder, dy),
  hip: up(pose.hip, dy),
  knee: up(pose.knee, dy),
  elbow: up(pose.elbow, dy),
  hand: up(pose.hand, dy),
})

// Banco reto: assento e dois pés
const flatBench = (x: number, y: number, w: number): [P, P][] => [
  [[x, y], [x + w, y]],
  [[x + 4, y], [x + 4, 60]],
  [[x + w - 4, y], [x + w - 4, 60]],
]

export const PICTOGRAMS: Record<string, PictogramDef> = {
  'Supino reto': {
    start: { head: [22, 39], shoulder: [30, 42], hip: [56, 42], elbow: [31, 31], hand: [31, 20], knee: [70, 36], foot: [72, 59], plates: [[31, 19]], lines: flatBench(18, 46, 44) },
    end: { head: [22, 39], shoulder: [30, 42], hip: [56, 42], elbow: [37, 50], hand: [33, 34], knee: [70, 36], foot: [72, 59], plates: [[33, 33]], lines: flatBench(18, 46, 44) },
  },
  'Supino inclinado com halteres': {
    start: {
      head: [29, 22], shoulder: [35, 29], hip: [49, 45], elbow: [40, 19], hand: [42, 9], knee: [62, 40], foot: [65, 59], weights: [[42, 9]],
      lines: [[[26, 24], [44, 48]], [[42, 48], [60, 48]], [[50, 48], [50, 60]]],
    },
    end: {
      head: [29, 22], shoulder: [35, 29], hip: [49, 45], elbow: [30, 39], hand: [38, 27], knee: [62, 40], foot: [65, 59], weights: [[38, 27]],
      lines: [[[26, 24], [44, 48]], [[42, 48], [60, 48]], [[50, 48], [50, 60]]],
    },
  },
  'Crucifixo na máquina': {
    start: {
      head: [45, 11], shoulder: [44, 19], hip: [46, 41], elbow: [36, 21], hand: [29, 24], knee: [59, 42], foot: [59, 59], pads: [[29, 24]],
      lines: [[[39, 8], [39, 44]], [[39, 44], [58, 44]], [[50, 44], [50, 60]]],
    },
    end: {
      head: [45, 11], shoulder: [44, 19], hip: [46, 41], elbow: [53, 21], hand: [61, 23], knee: [59, 42], foot: [59, 59], pads: [[61, 23]],
      lines: [[[39, 8], [39, 44]], [[39, 44], [58, 44]], [[50, 44], [50, 60]]],
    },
  },
  'Desenvolvimento militar': {
    start: { ...standing, elbow: [57, 29], hand: [55, 19], plates: [[55, 18]] },
    end: { ...standing, elbow: [52, 12], hand: [52, 1], plates: [[52, 0]] },
  },
  'Elevação lateral': {
    frontal: true,
    start: {
      head: [50, 13], shoulder: [50, 21], hip: [50, 39], knee: [46, 50], foot: [45, 60], farKnee: [54, 50], farFoot: [55, 60],
      elbow: [45, 30], hand: [44, 39], farElbow: [55, 30], farHand: [56, 39], weights: [[44, 39], [56, 39]],
    },
    end: {
      head: [50, 13], shoulder: [50, 21], hip: [50, 39], knee: [46, 50], foot: [45, 60], farKnee: [54, 50], farFoot: [55, 60],
      elbow: [40, 22], hand: [30, 23], farElbow: [60, 22], farHand: [70, 23], weights: [[30, 23], [70, 23]],
    },
  },
  'Barra fixa': {
    floor: false,
    start: { head: [47, 21], shoulder: [50, 29], hip: [48, 49], elbow: [55, 20], hand: [59, 12], knee: [50, 55], foot: [46, 62], lines: [[[30, 11], [74, 11]]] },
    end: { head: [58, 5], shoulder: [55, 18], hip: [52, 39], elbow: [48, 22], hand: [59, 12], knee: [54, 48], foot: [49, 56], lines: [[[30, 11], [74, 11]]] },
  },
  'Remada curvada': {
    start: { head: [69, 24], shoulder: [62, 28], hip: [44, 37], elbow: [62, 39], hand: [62, 48], knee: [55, 48], foot: [51, 60], plates: [[62, 49]] },
    end: { head: [69, 24], shoulder: [62, 28], hip: [44, 37], elbow: [52, 33], hand: [57, 41], knee: [55, 48], foot: [51, 60], plates: [[57, 42]] },
  },
  'Puxada frontal': {
    start: {
      head: [47, 16], shoulder: [46, 24], hip: [44, 43], elbow: [49, 13], hand: [51, 3], knee: [58, 44], foot: [58, 59], pads: [[51, 3]],
      lines: [[[34, 46], [56, 46]], [[45, 46], [45, 60]]], cables: [[[51, -7], [51, 3]]],
    },
    end: {
      head: [47, 16], shoulder: [46, 24], hip: [44, 43], elbow: [41, 31], hand: [49, 21], knee: [58, 44], foot: [58, 59], pads: [[49, 21]],
      lines: [[[34, 46], [56, 46]], [[45, 46], [45, 60]]], cables: [[[51, -7], [49, 21]]],
    },
  },
  'Remada baixa': {
    start: {
      head: [35, 18], shoulder: [33, 26], hip: [30, 45], elbow: [42, 32], hand: [51, 36], knee: [46, 40], foot: [59, 48], pads: [[51, 36]],
      lines: [[[22, 48], [40, 48]], [[62, 38], [62, 56]], [[31, 48], [31, 60]]], cables: [[[80, 40], [51, 36]]],
    },
    end: {
      head: [33, 17], shoulder: [30, 25], hip: [30, 45], elbow: [22, 33], hand: [35, 36], knee: [46, 40], foot: [59, 48], pads: [[35, 36]],
      lines: [[[22, 48], [40, 48]], [[62, 38], [62, 56]], [[31, 48], [31, 60]]], cables: [[[80, 40], [35, 36]]],
    },
  },
  'Rosca direta': {
    start: { ...standing, elbow: [52, 31], hand: [56, 40], plates: [[56, 41]] },
    end: { ...standing, elbow: [52, 31], hand: [59, 23], plates: [[59, 22]] },
  },
  'Rosca martelo': {
    start: { ...standing, elbow: [52, 31], hand: [55, 40], weights: [[55, 40]] },
    end: { ...standing, elbow: [52, 31], hand: [58, 22], weights: [[58, 22]] },
  },
  'Tríceps na polia': {
    start: { ...standing, head: [53, 14], shoulder: [51, 22], elbow: [53, 32], hand: [61, 27], pads: [[61, 27]], cables: [[[64, -7], [61, 27]]] },
    end: { ...standing, head: [53, 14], shoulder: [51, 22], elbow: [53, 32], hand: [57, 42], pads: [[57, 42]], cables: [[[64, -7], [57, 42]]] },
  },
  'Tríceps francês': {
    start: { ...standing, elbow: [52, 11], hand: [52, 0], weights: [[52, 0]] },
    end: { ...standing, elbow: [52, 11], hand: [43, 18], weights: [[43, 18]] },
  },
  'Agachamento livre': {
    start: { head: [55, 13], shoulder: [50, 22], hip: [49, 39], elbow: [41, 27], hand: [45, 21], knee: [50, 50], foot: [49, 60], plates: [[46, 21]] },
    end: { head: [61, 26], shoulder: [54, 33], hip: [37, 46], elbow: [43, 39], hand: [49, 33], knee: [58, 48], foot: [50, 60], plates: [[50, 33]] },
  },
  'Leg press 45°': {
    start: {
      head: [19, 33], shoulder: [25, 40], hip: [38, 52], elbow: [33, 47], hand: [40, 53], knee: [41, 35], foot: [55, 37],
      lines: [[[17, 35], [35, 57]], [[51, 31], [59, 43]]],
    },
    end: {
      head: [19, 33], shoulder: [25, 40], hip: [38, 52], elbow: [33, 47], hand: [40, 53], knee: [51, 42], foot: [64, 32],
      lines: [[[17, 35], [35, 57]], [[60, 26], [68, 38]]],
    },
  },
  'Levantamento terra': {
    start: { head: [61, 25], shoulder: [55, 30], hip: [40, 40], elbow: [55, 41], hand: [55, 51], knee: [56, 50], foot: [50, 60], plates: [[55, 53]] },
    end: { ...standing, elbow: [51, 31], hand: [53, 40], plates: [[53, 41]] },
  },
  Stiff: {
    start: { ...standing, elbow: [51, 31], hand: [53, 40], plates: [[53, 41]] },
    end: { head: [67, 30], shoulder: [61, 33], hip: [43, 38], elbow: [61, 43], hand: [61, 52], knee: [51, 50], foot: [50, 60], plates: [[61, 53]] },
  },
  'Cadeira extensora': {
    start: {
      head: [40, 12], shoulder: [39, 20], hip: [41, 40], elbow: [42, 31], hand: [48, 41], knee: [55, 41], foot: [56, 54], pads: [[57, 54]],
      lines: [[[35, 8], [35, 43]], [[35, 43], [56, 43]], [[46, 43], [46, 60]]],
    },
    end: {
      head: [40, 12], shoulder: [39, 20], hip: [41, 40], elbow: [42, 31], hand: [48, 41], knee: [55, 41], foot: [68, 37], pads: [[69, 38]],
      lines: [[[35, 8], [35, 43]], [[35, 43], [56, 43]], [[46, 43], [46, 60]]],
    },
  },
  'Mesa flexora': {
    start: {
      head: [21, 38], shoulder: [29, 40], hip: [51, 40], elbow: [23, 46], hand: [17, 46], knee: [63, 40], foot: [76, 40], pads: [[76, 43]],
      lines: flatBench(16, 44, 54),
    },
    end: {
      head: [21, 38], shoulder: [29, 40], hip: [51, 40], elbow: [23, 46], hand: [17, 46], knee: [63, 40], foot: [68, 28], pads: [[70, 30]],
      lines: flatBench(16, 44, 54),
    },
  },
  'Elevação pélvica': {
    start: {
      head: [23, 32], shoulder: [30, 38], hip: [46, 51], elbow: [38, 45], hand: [46, 46], knee: [58, 43], foot: [63, 59], plates: [[47, 46]],
      lines: [[[14, 41], [32, 41]], [[18, 41], [18, 60]]],
    },
    end: {
      head: [23, 32], shoulder: [30, 38], hip: [47, 38], elbow: [39, 33], hand: [47, 33], knee: [60, 40], foot: [63, 59], plates: [[48, 33]],
      lines: [[[14, 41], [32, 41]], [[18, 41], [18, 60]]],
    },
  },
  'Panturrilha em pé': {
    start: { ...standing, elbow: [52, 31], hand: [53, 40], lines: [[[42, 60], [58, 60]]] },
    end: { ...raise({ ...standing, elbow: [52, 31], hand: [53, 40] }, 7), foot: [50, 59], knee: [51, 43], lines: [[[42, 60], [58, 60]]] },
  },
  Prancha: {
    start: { head: [24, 41], shoulder: [30, 45], hip: [55, 41], elbow: [30, 57], hand: [40, 58], knee: [68, 51], foot: [82, 58] },
    end: { head: [24, 41], shoulder: [30, 45], hip: [55, 49], elbow: [30, 57], hand: [40, 58], knee: [68, 53], foot: [82, 58] },
  },
}

export function pictogramFor(name: string): PictogramDef | null {
  return PICTOGRAMS[name] ?? null
}
