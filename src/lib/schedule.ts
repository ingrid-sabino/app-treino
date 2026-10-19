// Agenda da Rotação: distribui os próximos treinos nos Dias de treino.
//
// A Rotação é uma fila infinita de ocorrências: seq 0, 1, 2... e a ocorrência
// seq usa o item (seq mod nº de itens). Ex.: A B C D → seq 4 é A de novo.
//
// Regras (PRD §4.1):
// - FR-1  Próximo treino = o primeiro treino ainda não feito nem pulado da fila,
//         pela ordem da Agenda.
// - FR-2  Pular tira a ocorrência da fila; o sucessor ocupa o lugar dela, como se
//         nada tivesse sido pulado.
// - FR-34 Os treinos seguem a ordem da Rotação e ocupam os Dias de treino
//         (quantos por dia a pessoa escolher).
// - FR-35 Mudar o dia de um treino move só ele; o dia de origem fica livre e os
//         outros continuam onde estavam.
// - Dia de treino que passou sem Sessão não pula nada: o treino segue na fila.

export interface OccurrenceState {
  seq: number
  planned_on: string | null // AAAA-MM-DD para onde foi movida
  resolution: 'done' | 'skipped' | null
  resolved_on: string | null // AAAA-MM-DD em que foi feita ou pulada
}

export interface PlannedWorkout {
  date: string // AAAA-MM-DD
  seq: number
  itemIndex: number // posição do item na Rotação
  moved: boolean
}

export interface ScheduleInput {
  itemCount: number
  weeklySlots: number[] // 7 posições, segunda [0] a domingo [6]
  occurrences: OccurrenceState[]
  today: string // AAAA-MM-DD, no fuso da pessoa
  until: string // último dia da Agenda (inclusive)
}

// Datas como AAAA-MM-DD, calculadas em UTC para não sofrer com fuso e horário de verão
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7 // segunda = 0
}

export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date))
}

export function toLocalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function planSchedule(input: ScheduleInput): PlannedWorkout[] {
  const { itemCount, weeklySlots, occurrences, today, until } = input
  if (itemCount === 0 || until < today) return []

  const bySeq = new Map(occurrences.map((o) => [o.seq, o]))
  const isResolved = (seq: number) => bySeq.get(seq)?.resolution != null
  // Movida para hoje ou depois; se a data já passou sem Sessão, volta para a fila
  const movedTo = (seq: number) => {
    const o = bySeq.get(seq)
    return o && o.resolution == null && o.planned_on && o.planned_on >= today ? o.planned_on : null
  }

  const plan: PlannedWorkout[] = []
  const item = (seq: number) => seq % itemCount

  // Ocorrências movidas aparecem no dia escolhido, fora dos Dias de treino
  for (const o of occurrences) {
    const date = movedTo(o.seq)
    if (date && date <= until) plan.push({ date, seq: o.seq, itemIndex: item(o.seq), moved: true })
  }

  // Treinos já feitos hoje ocupam os lugares de hoje
  const doneToday = occurrences.filter((o) => o.resolution === 'done' && o.resolved_on === today).length

  let seq = 0
  const nextInQueue = () => {
    while (isResolved(seq)) seq++
    return seq++
  }

  for (let date = today; date <= until; date = addDays(date, 1)) {
    let slots = weeklySlots[weekdayIndex(date)] ?? 0
    if (date === today) slots = Math.max(0, slots - doneToday)
    for (let i = 0; i < slots; i++) {
      const s = nextInQueue()
      // A movida já foi colocada no novo dia; o lugar original fica livre
      if (movedTo(s)) continue
      plan.push({ date, seq: s, itemIndex: item(s), moved: false })
    }
  }

  return plan.sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1))
}

// Próximo treino (FR-1): o primeiro da Agenda a partir de hoje. Sem Dias de treino
// definidos, é simplesmente o primeiro da fila.
export function nextWorkout(input: Omit<ScheduleInput, 'until'>): PlannedWorkout | { date: null; seq: number; itemIndex: number; moved: false } | null {
  if (input.itemCount === 0) return null
  const [first] = planSchedule({ ...input, until: addDays(input.today, 27) })
  if (first) return first
  const resolved = new Set(input.occurrences.filter((o) => o.resolution != null).map((o) => o.seq))
  let seq = 0
  while (resolved.has(seq)) seq++
  return { date: null, seq, itemIndex: seq % input.itemCount, moved: false }
}
