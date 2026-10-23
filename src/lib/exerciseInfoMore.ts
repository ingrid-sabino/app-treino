import type { ExerciseInfo } from './exerciseInfo'

// Fichas do catálogo ampliado (migration 0004). Músculos conferidos com o Free Exercise DB
// (domínio público); passos escritos em português, sem flexão de gênero para quem treina.

export const MORE_EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // Peito
  'Supino inclinado com barra': {
    primary: ['chest'],
    secondary: ['front-deltoids', 'triceps'],
    howTo: [
      'Ajuste o banco inclinado (30° a 45°), deite e segure a barra um pouco além da largura dos ombros.',
      'Desça a barra até a parte de cima do peito, com os cotovelos um pouco abaixo da linha dos ombros.',
      'Empurre a barra de volta até estender os braços, sem tirar as costas do banco.',
    ],
  },
  'Supino declinado': {
    primary: ['chest'],
    secondary: ['triceps', 'front-deltoids'],
    howTo: [
      'Prenda os pés sob o apoio do banco declinado e deite com a cabeça na parte mais baixa.',
      'Desça a barra até a parte de baixo do peito, devagar.',
      'Empurre a barra para cima até estender os braços e repita.',
    ],
  },
  'Supino reto com halteres': {
    primary: ['chest'],
    secondary: ['triceps', 'front-deltoids'],
    howTo: [
      'Deite no banco com um halter em cada mão, na altura do peito, palmas para a frente.',
      'Empurre os halteres para cima até estender os braços, aproximando um do outro.',
      'Desça com controle até os cotovelos passarem um pouco da linha do banco.',
    ],
  },
  'Crucifixo com halteres': {
    primary: ['chest'],
    secondary: ['front-deltoids'],
    howTo: [
      'Deite no banco com os halteres acima do peito, palmas uma de frente para a outra.',
      'Com os cotovelos levemente dobrados, abra os braços em arco até sentir o peito alongar.',
      'Feche os braços pelo mesmo arco até os halteres quase se encostarem.',
    ],
  },
  Crossover: {
    primary: ['chest'],
    secondary: ['front-deltoids'],
    howTo: [
      'Fique entre as duas polias altas, um pegador em cada mão, com um pé um pouco à frente do outro.',
      'Com os cotovelos levemente dobrados, puxe os pegadores para baixo e para a frente até as mãos se encontrarem.',
      'Volte devagar até os braços abrirem na altura dos ombros.',
    ],
  },
  'Flexão de braço': {
    primary: ['chest'],
    secondary: ['triceps', 'front-deltoids', 'abs'],
    howTo: [
      'Apoie as mãos no chão um pouco além da largura dos ombros e estenda as pernas, com o corpo em linha reta.',
      'Dobre os cotovelos e desça o peito até perto do chão, sem deixar o quadril cair.',
      'Empurre o chão até estender os braços de novo. Para facilitar, apoie os joelhos.',
    ],
  },

  // Ombros
  'Desenvolvimento com halteres': {
    primary: ['front-deltoids'],
    secondary: ['triceps', 'trapezius'],
    howTo: [
      'Em pé ou no banco com encosto, segure os halteres na altura dos ombros, palmas para a frente.',
      'Empurre os halteres para cima da cabeça até estender os braços.',
      'Desça com controle até a altura das orelhas.',
    ],
  },
  'Elevação frontal': {
    primary: ['front-deltoids'],
    secondary: ['chest', 'trapezius'],
    howTo: [
      'Em pé, um halter em cada mão à frente das coxas.',
      'Eleve um ou os dois braços à frente, quase estendidos, até a altura dos ombros.',
      'Desça devagar, sem balançar o tronco.',
    ],
  },
  'Crucifixo invertido': {
    primary: ['back-deltoids'],
    secondary: ['upper-back', 'trapezius'],
    howTo: [
      'Incline o tronco à frente com a coluna reta (ou use a máquina voador de frente para o encosto), halteres sob o peito.',
      'Abra os braços pelas laterais, cotovelos levemente dobrados, até a altura dos ombros.',
      'Aproxime as escápulas no alto e desça devagar.',
    ],
  },
  'Remada alta': {
    primary: ['front-deltoids', 'trapezius'],
    secondary: ['biceps', 'back-deltoids'],
    howTo: [
      'Em pé, segure a barra à frente das coxas com as mãos na largura dos ombros.',
      'Puxe a barra rente ao corpo até a altura do peito, levando os cotovelos para cima e para fora.',
      'Desça devagar até estender os braços.',
    ],
  },
  Encolhimento: {
    primary: ['trapezius'],
    secondary: ['forearm'],
    howTo: [
      'Em pé, um halter em cada mão ao lado do corpo, braços estendidos.',
      'Eleve os ombros em direção às orelhas, sem dobrar os cotovelos.',
      'Segure um instante no alto e desça devagar.',
    ],
  },
  'Face pull': {
    primary: ['back-deltoids'],
    secondary: ['trapezius', 'upper-back'],
    howTo: [
      'Prenda a corda na polia na altura do rosto e segure uma ponta em cada mão, braços estendidos.',
      'Puxe a corda em direção à testa, abrindo os cotovelos para os lados e para cima.',
      'Volte devagar até estender os braços.',
    ],
  },

  // Costas
  'Remada unilateral com halter': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids'],
    howTo: [
      'Apoie um joelho e a mão do mesmo lado no banco, com o tronco paralelo ao chão.',
      'Com a outra mão, puxe o halter em direção ao quadril, cotovelo rente ao corpo.',
      'Desça devagar até estender o braço e troque de lado ao fim das repetições.',
    ],
  },
  'Pulldown com braços estendidos': {
    primary: ['upper-back'],
    secondary: ['triceps', 'abs'],
    howTo: [
      'De frente para a polia alta, segure a barra com os braços estendidos à frente e o tronco levemente inclinado.',
      'Com os cotovelos quase retos, leve a barra em arco até as coxas.',
      'Volte devagar até os braços passarem da altura da cabeça.',
    ],
  },
  'Remada cavalinho': {
    primary: ['upper-back'],
    secondary: ['biceps', 'back-deltoids', 'lower-back'],
    howTo: [
      'Com a barra entre as pernas, flexione os joelhos e incline o tronco à frente com a coluna reta.',
      'Puxe o pegador em direção ao peito, aproximando as escápulas.',
      'Estenda os braços devagar, sem arredondar as costas.',
    ],
  },
  'Hiperextensão lombar': {
    primary: ['lower-back'],
    secondary: ['gluteal', 'hamstring'],
    howTo: [
      'Apoie o quadril no banco de hiperextensão e prenda os calcanhares sob o rolo, braços cruzados no peito.',
      'Desça o tronco devagar, dobrando no quadril.',
      'Suba até o corpo ficar em linha reta, sem passar desse ponto.',
    ],
  },

  // Bíceps
  'Rosca alternada': {
    primary: ['biceps'],
    secondary: ['forearm'],
    howTo: [
      'Em pé, um halter em cada mão ao lado do corpo, palmas para dentro.',
      'Dobre um cotovelo de cada vez, girando a palma para cima enquanto sobe.',
      'Desça devagar e alterne os braços, com os cotovelos parados junto ao corpo.',
    ],
  },
  'Rosca Scott': {
    primary: ['biceps'],
    secondary: ['forearm'],
    howTo: [
      'Sente no banco Scott com a parte de trás dos braços apoiada na almofada.',
      'Segure a barra com as palmas para cima e dobre os cotovelos até a barra chegar perto dos ombros.',
      'Desça devagar até quase estender os braços.',
    ],
  },
  'Rosca na polia': {
    primary: ['biceps'],
    secondary: ['forearm'],
    howTo: [
      'De frente para a polia baixa, segure a barra com as palmas para cima.',
      'Dobre os cotovelos e leve a barra até perto dos ombros, cotovelos junto ao corpo.',
      'Desça devagar até estender os braços.',
    ],
  },
  'Rosca concentrada': {
    primary: ['biceps'],
    secondary: ['forearm'],
    howTo: [
      'Sente na ponta do banco com as pernas afastadas e apoie o cotovelo na parte de dentro da coxa.',
      'Dobre o cotovelo e suba o halter em direção ao ombro.',
      'Desça devagar até estender o braço e troque de lado ao fim.',
    ],
  },

  // Tríceps
  'Tríceps testa': {
    primary: ['triceps'],
    secondary: [],
    howTo: [
      'Deite no banco com a barra acima do peito, braços estendidos.',
      'Dobre só os cotovelos e desça a barra em direção à testa, com os braços parados.',
      'Estenda os cotovelos de volta, sem abrir os braços.',
    ],
  },
  'Tríceps corda': {
    primary: ['triceps'],
    secondary: [],
    howTo: [
      'De frente para a polia alta, segure uma ponta da corda em cada mão, cotovelos junto ao corpo.',
      'Estenda os cotovelos e, no fim, afaste as pontas da corda para os lados.',
      'Volte devagar até os antebraços passarem da altura dos cotovelos.',
    ],
  },
  'Mergulho no banco': {
    primary: ['triceps'],
    secondary: ['chest', 'front-deltoids'],
    howTo: [
      'Apoie as mãos na beira de um banco atrás do corpo e estique as pernas à frente.',
      'Dobre os cotovelos e desça o quadril, com as costas perto do banco.',
      'Empurre o banco até estender os braços. Joelhos dobrados facilitam.',
    ],
  },
  'Mergulho nas paralelas': {
    primary: ['triceps', 'chest'],
    secondary: ['front-deltoids'],
    howTo: [
      'Segure as barras paralelas e deixe o corpo suspenso com os braços estendidos.',
      'Dobre os cotovelos e desça até os braços ficarem paralelos ao chão.',
      'Empurre até estender os braços de novo. Tronco à frente trabalha mais o peito.',
    ],
  },
  'Tríceps coice': {
    primary: ['triceps'],
    secondary: [],
    howTo: [
      'Incline o tronco à frente com a coluna reta e cole o braço ao lado do corpo, cotovelo dobrado.',
      'Estenda o cotovelo, levando o halter para trás até o braço ficar reto.',
      'Volte devagar, sem mexer o braço.',
    ],
  },
  'Supino fechado': {
    primary: ['triceps'],
    secondary: ['chest', 'front-deltoids'],
    howTo: [
      'Deite no banco e segure a barra com as mãos na largura dos ombros.',
      'Desça a barra até o peito com os cotovelos junto ao corpo.',
      'Empurre de volta até estender os braços.',
    ],
  },

  // Pernas
  'Agachamento sumô': {
    primary: ['quadriceps', 'adductor', 'gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Afaste bem os pés, com as pontas viradas para fora, e segure o halter entre as pernas.',
      'Desça o quadril com o tronco reto, levando os joelhos na direção das pontas dos pés.',
      'Suba empurrando o chão até estender as pernas.',
    ],
  },
  'Agachamento búlgaro': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Fique de costas para um banco e apoie nele o peito do pé de trás, um halter em cada mão.',
      'Desça dobrando o joelho da frente até a coxa ficar quase paralela ao chão.',
      'Suba empurrando com o pé da frente e troque de perna ao fim.',
    ],
  },
  Afundo: {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring', 'calves'],
    howTo: [
      'Em pé, dê um passo largo à frente, com um halter em cada mão.',
      'Desça até o joelho de trás quase tocar o chão, tronco reto.',
      'Empurre com o pé da frente para subir e alterne as pernas.',
    ],
  },
  'Agachamento hack': {
    primary: ['quadriceps'],
    secondary: ['gluteal', 'hamstring'],
    howTo: [
      'Encoste as costas e os ombros nos apoios da máquina, pés na plataforma na largura do quadril.',
      'Destrave e desça dobrando os joelhos até as coxas ficarem paralelas à plataforma.',
      'Empurre a plataforma até quase estender as pernas.',
    ],
  },
  'Agachamento goblet': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['abs'],
    howTo: [
      'Segure um halter em pé junto ao peito, com as duas mãos, e afaste os pés na largura dos ombros.',
      'Desça o quadril entre os calcanhares, com o tronco alto e os cotovelos entre os joelhos.',
      'Suba empurrando o chão até estender as pernas.',
    ],
  },
  'Agachamento no Smith': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Posicione a barra do Smith sobre a parte de cima das costas e os pés um pouco à frente do corpo.',
      'Destrave a barra e desça até as coxas ficarem paralelas ao chão.',
      'Suba empurrando o chão e trave a barra no fim da Série.',
    ],
  },
  'Cadeira adutora': {
    primary: ['adductor'],
    secondary: [],
    howTo: [
      'Sente na máquina com as costas no encosto e os apoios na parte de dentro dos joelhos.',
      'Feche as pernas, apertando os apoios até se encontrarem.',
      'Abra devagar até sentir a parte de dentro da coxa alongar.',
    ],
  },
  'Cadeira abdutora': {
    primary: ['abductors', 'gluteal'],
    secondary: [],
    howTo: [
      'Sente na máquina com as costas no encosto e os apoios na parte de fora dos joelhos.',
      'Abra as pernas empurrando os apoios para fora.',
      'Feche devagar, sem deixar o peso bater.',
    ],
  },
  'Subida no banco': {
    primary: ['quadriceps', 'gluteal'],
    secondary: ['hamstring', 'calves'],
    howTo: [
      'De frente para um banco ou caixa firme, apoie um pé inteiro em cima, halteres nas mãos.',
      'Empurre com esse pé até estender a perna e subir no banco.',
      'Desça com controle pelo mesmo lado e alterne as pernas.',
    ],
  },

  // Posterior
  'Cadeira flexora': {
    primary: ['hamstring'],
    secondary: ['calves'],
    howTo: [
      'Sente na máquina com o rolo atrás dos tornozelos e a trava sobre as coxas.',
      'Dobre os joelhos, levando o rolo para baixo e para trás.',
      'Volte devagar até quase estender as pernas.',
    ],
  },
  'Bom dia': {
    primary: ['hamstring', 'lower-back'],
    secondary: ['gluteal'],
    howTo: [
      'Em pé, com a barra apoiada na parte de cima das costas e os joelhos levemente dobrados.',
      'Leve o quadril para trás e incline o tronco à frente com a coluna reta, até ficar quase paralelo ao chão.',
      'Suba contraindo glúteos e posterior de coxa.',
    ],
  },

  // Glúteos
  'Glúteo na polia': {
    primary: ['gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Prenda a tornozeleira da polia baixa em um tornozelo e segure o apoio à frente.',
      'Leve a perna para trás, com o joelho quase reto, sem arquear a lombar.',
      'Volte devagar e troque de perna ao fim da Série.',
    ],
  },
  'Ponte de glúteo': {
    primary: ['gluteal'],
    secondary: ['hamstring'],
    howTo: [
      'Deite de barriga para cima com os joelhos dobrados e os pés no chão, braços ao lado do corpo.',
      'Empurre o chão com os calcanhares e suba o quadril até o corpo ficar em linha dos ombros aos joelhos.',
      'Segure um instante no alto e desça devagar.',
    ],
  },

  // Panturrilhas
  'Panturrilha sentada': {
    primary: ['calves'],
    secondary: [],
    howTo: [
      'Sente na máquina com o apoio sobre os joelhos e a ponta dos pés na plataforma.',
      'Suba os calcanhares o máximo que conseguir.',
      'Desça devagar até sentir a panturrilha alongar.',
    ],
  },
  'Panturrilha no leg press': {
    primary: ['calves'],
    secondary: [],
    howTo: [
      'No leg press, apoie só a ponta dos pés na parte de baixo da plataforma, pernas quase estendidas.',
      'Empurre a plataforma esticando os tornozelos, sem dobrar os joelhos.',
      'Volte devagar até os calcanhares passarem da linha da plataforma.',
    ],
  },

  // Core
  'Abdominal supra': {
    primary: ['abs'],
    secondary: ['obliques'],
    howTo: [
      'Deite de barriga para cima com os joelhos dobrados e as mãos no peito ou atrás da cabeça.',
      'Contraia o abdômen e tire os ombros do chão, olhando para o teto.',
      'Desça devagar, sem puxar o pescoço.',
    ],
  },
  'Abdominal infra': {
    primary: ['abs'],
    secondary: ['obliques'],
    howTo: [
      'Deite de barriga para cima com as pernas estendidas e as mãos ao lado do quadril.',
      'Eleve as pernas até apontarem para o teto, com a lombar colada no chão.',
      'Desça devagar sem encostar os pés no chão.',
    ],
  },
  'Elevação de pernas na barra': {
    primary: ['abs'],
    secondary: ['obliques'],
    howTo: [
      'Segure a barra fixa e deixe o corpo suspenso com os braços estendidos.',
      'Eleve as pernas à frente até ficarem paralelas ao chão, sem balançar.',
      'Desça devagar. Joelhos dobrados facilitam.',
    ],
  },
  'Prancha lateral': {
    primary: ['obliques'],
    secondary: ['abs', 'abductors'],
    howTo: [
      'Deite de lado e apoie o antebraço no chão, cotovelo sob o ombro.',
      'Eleve o quadril até o corpo formar uma linha reta da cabeça aos pés.',
      'Mantenha a posição pelo tempo da Série e troque de lado.',
    ],
  },
  'Abdominal oblíquo': {
    primary: ['obliques'],
    secondary: ['abs'],
    howTo: [
      'Sente no chão com os joelhos dobrados e incline o tronco um pouco para trás, halter nas mãos.',
      'Gire o tronco levando o halter para um lado do quadril.',
      'Gire para o outro lado, sem pressa, com o abdômen firme.',
    ],
  },
  'Abdominal na polia': {
    primary: ['abs'],
    secondary: ['obliques'],
    howTo: [
      'Ajoelhe de frente para a polia alta e segure a corda junto à cabeça.',
      'Contraia o abdômen e enrole o tronco para baixo, levando os cotovelos em direção às coxas.',
      'Volte devagar, sem mexer o quadril.',
    ],
  },
  'Roda abdominal': {
    primary: ['abs'],
    secondary: ['upper-back', 'front-deltoids'],
    howTo: [
      'De joelhos no chão, segure a roda à frente com os braços estendidos.',
      'Role a roda para a frente devagar, estendendo o corpo sem deixar a lombar afundar.',
      'Contraia o abdômen e puxe a roda de volta até os joelhos.',
    ],
  },
  Escalador: {
    primary: ['abs'],
    secondary: ['quadriceps', 'front-deltoids'],
    howTo: [
      'Comece na posição de flexão, com os braços estendidos e o corpo em linha reta.',
      'Leve um joelho em direção ao peito e volte a perna para trás.',
      'Alterne as pernas em ritmo constante, sem subir o quadril.',
    ],
  },
}
