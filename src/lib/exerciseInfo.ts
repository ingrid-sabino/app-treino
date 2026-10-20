import type { Muscle } from 'react-body-highlighter'
import type { Highlight, Segment } from '../components/Pictogram'

// Ficha dos Exercícios do catálogo: músculos (principal e secundários) e "Como fazer".
// Músculos conferidos com o Free Exercise DB (domínio público); passos escritos em português.

export interface ExerciseInfo {
  primary: Muscle[]
  secondary: Muscle[]
  howTo: string[]
}

export const MUSCLE_NAMES: Partial<Record<Muscle, string>> = {
  chest: 'Peito',
  'upper-back': 'Costas',
  'lower-back': 'Lombar',
  trapezius: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearm: 'Antebraço',
  'front-deltoids': 'Ombro (frente)',
  'back-deltoids': 'Ombro (trás)',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  quadriceps: 'Quadríceps',
  hamstring: 'Posterior de coxa',
  adductor: 'Adutores',
  abductors: 'Abdutores',
  gluteal: 'Glúteos',
  calves: 'Panturrilha',
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  'Supino reto': {
    primary: ['chest'],
    secondary: ['triceps', 'front-deltoids'],
    howTo: [
      'Deite no banco com os pés apoiados no chão e segure a barra um pouco além da largura dos ombros.',
      'Desça a barra devagar até encostar no meio do peito, cotovelos levemente abertos.',
      'Empurre a barra de volta até estender os braços, soltando o ar.',
    ],
  },
  'Supino inclinado com halteres': {
    primary: ['chest'],
    secondary: ['front-deltoids', 'triceps'],
    howTo: [
      'Ajuste o banco inclinado (30° a 45°) e sente com um halter em cada mão, apoiados nas coxas.',
      'Deite e leve os halteres à altura do peito, palmas para a frente.',
      'Empurre para cima até quase encostar um halter no outro e desça com controle.',
    ],
  },
  'Crucifixo na máquina': {
    primary: ['chest'],
    secondary: ['front-deltoids'],
    howTo: [
      'Ajuste o banco para as alças ficarem na altura do peito e encoste as costas no encosto.',
      'Com os cotovelos levemente dobrados, junte as alças à frente do peito.',
      'Volte devagar até sentir o peito alongar, sem passar da linha dos ombros.',
    ],
  },
  'Desenvolvimento militar': {
    primary: ['front-deltoids'],
    secondary: ['triceps', 'trapezius'],
    howTo: [
      'Em pé, segure a barra na altura da clavícula, mãos um pouco além dos ombros.',
      'Contraia abdômen e glúteos e empurre a barra para cima da cabeça até estender os braços.',
      'Desça com controle de volta à clavícula, sem arquear a lombar.',
    ],
  },
  'Elevação lateral': {
    primary: ['front-deltoids', 'back-deltoids'],
    secondary: ['trapezius'],
    howTo: [
      'Em pé, um halter em cada mão ao lado do corpo, cotovelos levemente dobrados.',
      'Eleve os braços pelas laterais até a altura dos ombros, sem balançar o tronco.',
      'Desça devagar até a posição inicial.',
    ],
  },
  'Barra fixa': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids', 'forearm'],
    howTo: [
      'Segure a barra com as palmas para a frente, mãos um pouco além dos ombros, e deixe o corpo suspenso com os braços estendidos.',
      'Puxe o corpo para cima levando o peito em direção à barra, até o queixo passar dela.',
      'Desça com controle até estender os braços de novo.',
    ],
  },
  'Remada curvada': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids', 'lower-back'],
    howTo: [
      'Segure a barra, flexione levemente os joelhos e incline o tronco à frente com a coluna reta.',
      'Puxe a barra em direção ao umbigo, aproximando as escápulas.',
      'Estenda os braços devagar, mantendo o tronco parado.',
    ],
  },
  'Puxada frontal': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids'],
    howTo: [
      'Sente com as coxas presas sob o apoio e segure a barra com pegada aberta.',
      'Puxe a barra até a altura do queixo ou do peito, levando os cotovelos para baixo.',
      'Volte devagar até estender os braços.',
    ],
  },
  'Remada baixa': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids', 'trapezius'],
    howTo: [
      'Sente com os pés na plataforma, joelhos levemente dobrados, e segure o puxador.',
      'Com a coluna reta, puxe o puxador até o abdômen, aproximando as escápulas.',
      'Estenda os braços devagar, sem curvar as costas.',
    ],
  },
  'Rosca direta': {
    primary: ['biceps'],
    secondary: ['forearm'],
    howTo: [
      'Em pé, segure a barra com as palmas para cima, braços estendidos à frente das coxas.',
      'Dobre os cotovelos levando a barra até a altura dos ombros, cotovelos parados ao lado do corpo.',
      'Desça devagar até estender os braços.',
    ],
  },
  'Rosca martelo': {
    primary: ['biceps', 'forearm'],
    secondary: [],
    howTo: [
      'Em pé, um halter em cada mão com as palmas viradas para o corpo.',
      'Dobre os cotovelos levando os halteres até os ombros, sem girar os punhos.',
      'Desça com controle.',
    ],
  },
  'Tríceps na polia': {
    primary: ['triceps'],
    secondary: [],
    howTo: [
      'De frente para a polia alta, segure a barra ou a corda com os cotovelos colados ao corpo.',
      'Empurre para baixo até estender os braços, sem mover os cotovelos.',
      'Volte devagar até os antebraços ficarem na horizontal.',
    ],
  },
  'Tríceps francês': {
    primary: ['triceps'],
    secondary: [],
    howTo: [
      'Em pé ou no banco, segure um halter com as duas mãos acima da cabeça.',
      'Dobre os cotovelos levando o halter para trás da cabeça, cotovelos apontando para cima.',
      'Estenda os braços de volta.',
    ],
  },
  'Agachamento livre': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring', 'adductor', 'lower-back'],
    howTo: [
      'Apoie a barra nas costas (sobre o trapézio), pés na largura dos ombros e pontas levemente para fora.',
      'Desça levando o quadril para trás e para baixo, joelhos na direção dos pés, até as coxas ficarem paralelas ao chão.',
      'Suba empurrando o chão com os pés inteiros, coluna reta.',
    ],
  },
  'Leg press 45°': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring', 'adductor'],
    howTo: [
      'Sente com as costas e o quadril bem apoiados e os pés na plataforma, na largura dos ombros.',
      'Destrave e desça a plataforma dobrando os joelhos até cerca de 90°.',
      'Empurre de volta sem travar totalmente os joelhos.',
    ],
  },
  'Levantamento terra': {
    primary: ['hamstring', 'gluteal', 'lower-back'],
    secondary: ['quadriceps', 'upper-back', 'trapezius', 'forearm'],
    howTo: [
      'Com a barra sobre o meio dos pés, dobre quadril e joelhos e segure a barra com os braços estendidos.',
      'Coluna reta e peito aberto, empurre o chão com as pernas e estenda o quadril, mantendo a barra rente ao corpo.',
      'Fique em pé com o corpo alinhado e desça a barra no mesmo caminho.',
    ],
  },
  Stiff: {
    primary: ['hamstring'],
    secondary: ['gluteal', 'lower-back'],
    howTo: [
      'Em pé, segure a barra à frente das coxas, joelhos levemente dobrados e parados.',
      'Incline o tronco levando o quadril para trás e a barra rente às pernas, até sentir a parte de trás da coxa alongar.',
      'Volte estendendo o quadril, coluna sempre reta.',
    ],
  },
  'Cadeira extensora': {
    primary: ['quadriceps'],
    secondary: [],
    howTo: [
      'Sente com as costas apoiadas e o rolo na frente dos tornozelos.',
      'Estenda os joelhos até as pernas ficarem retas.',
      'Desça devagar, sem deixar o peso bater.',
    ],
  },
  'Mesa flexora': {
    primary: ['hamstring'],
    secondary: ['calves'],
    howTo: [
      'Deite de bruços com o rolo logo acima dos calcanhares e segure as alças.',
      'Dobre os joelhos trazendo os calcanhares em direção ao glúteo, quadril colado no banco.',
      'Estenda as pernas devagar.',
    ],
  },
  'Elevação pélvica': {
    primary: ['gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Apoie a parte de cima das costas num banco, com a barra sobre o quadril e os pés no chão.',
      'Empurre pelos calcanhares e suba o quadril até o tronco ficar alinhado com as coxas.',
      'Contraia o glúteo no alto e desça com controle.',
    ],
  },
  'Panturrilha em pé': {
    primary: ['calves'],
    secondary: [],
    howTo: [
      'Fique em pé com a ponta dos pés num degrau e os calcanhares para fora.',
      'Suba na ponta dos pés o mais alto que conseguir.',
      'Desça devagar até sentir a panturrilha alongar.',
    ],
  },
  Prancha: {
    primary: ['abs'],
    secondary: ['obliques', 'front-deltoids'],
    howTo: [
      'Apoie os antebraços no chão, cotovelos abaixo dos ombros, e estenda as pernas apoiando a ponta dos pés.',
      'Alinhe ombros, quadril e calcanhares: nem quadril alto, nem lombar afundando.',
      'Segure a posição respirando normalmente, abdômen e glúteos contraídos.',
    ],
  },
}

export function exerciseInfo(name: string): ExerciseInfo | null {
  return EXERCISE_INFO[name] ?? null
}


// Em que parte da figura cada músculo acende
const SEGMENT_OF: Partial<Record<Muscle, Segment>> = {
  chest: 'torso',
  'upper-back': 'torso',
  'lower-back': 'torso',
  trapezius: 'torso',
  abs: 'torso',
  obliques: 'torso',
  biceps: 'upperArm',
  triceps: 'upperArm',
  forearm: 'forearm',
  'front-deltoids': 'shoulder',
  'back-deltoids': 'shoulder',
  quadriceps: 'thigh',
  hamstring: 'thigh',
  adductor: 'thigh',
  abductors: 'thigh',
  gluteal: 'hip',
  calves: 'shin',
}

export function highlightFor(info: ExerciseInfo): Highlight {
  const h: Highlight = {}
  for (const m of info.secondary) {
    const seg = SEGMENT_OF[m]
    if (seg) h[seg] = 'secondary'
  }
  for (const m of info.primary) {
    const seg = SEGMENT_OF[m]
    if (seg) h[seg] = 'primary' // principal vence o secundário na mesma parte
  }
  return h
}
