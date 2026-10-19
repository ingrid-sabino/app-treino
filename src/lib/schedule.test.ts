import { describe, expect, it } from 'vitest'
import { nextWorkout, planSchedule, weekdayIndex, type OccurrenceState } from './schedule'

// Rotação A B C D E F; Dias de treino: seg, ter, qui e sex
const ITEMS = ['A', 'B', 'C', 'D', 'E', 'F']
const SLOTS = [1, 1, 0, 1, 1, 0, 0]
const MON = '2026-10-19' // segunda-feira
const SUN = '2026-10-25'

function week(occurrences: OccurrenceState[] = [], today = MON, until = SUN, slots = SLOTS) {
  return planSchedule({ itemCount: ITEMS.length, weeklySlots: slots, occurrences, today, until }).map(
    (p) => `${p.date.slice(8)} ${ITEMS[p.itemIndex]}${p.moved ? '*' : ''}`,
  )
}

const done = (seq: number, on: string): OccurrenceState => ({ seq, planned_on: null, resolution: 'done', resolved_on: on })
const skipped = (seq: number, on: string): OccurrenceState => ({ seq, planned_on: null, resolution: 'skipped', resolved_on: on })
const moved = (seq: number, to: string): OccurrenceState => ({ seq, planned_on: to, resolution: null, resolved_on: null })

describe('Agenda da Rotação', () => {
  it('19/10/2026 é segunda', () => {
    expect(weekdayIndex(MON)).toBe(0)
  })

  it('distribui os treinos em ordem nos Dias de treino (FR-34)', () => {
    expect(week()).toEqual(['19 A', '20 B', '22 C', '23 D'])
  })

  it('respeita mais de um treino no mesmo dia', () => {
    expect(week([], MON, SUN, [1, 0, 0, 0, 0, 2, 0])).toEqual(['19 A', '24 B', '24 C'])
  })

  it('FR-1: registrar o A faz o Próximo treino ser o B', () => {
    const occ = [done(0, MON)]
    expect(week(occ)).toEqual(['20 B', '22 C', '23 D'])
    expect(nextWorkout({ itemCount: 6, weeklySlots: SLOTS, occurrences: occ, today: MON })?.itemIndex).toBe(1)
  })

  it('FR-2: pular o A põe o B no lugar dele', () => {
    expect(week([skipped(0, MON)])).toEqual(['19 B', '20 C', '22 D', '23 E'])
  })

  it('FR-2: pular um treino futuro adianta só os sucessores', () => {
    expect(week([skipped(2, MON)])).toEqual(['19 A', '20 B', '22 D', '23 E'])
  })

  it('dia de treino perdido não pula o treino: ele segue na fila', () => {
    // A feito na segunda, terça passou sem Sessão; na quarta o B continua sendo o próximo
    expect(week([done(0, MON)], '2026-10-21')).toEqual(['22 B', '23 C'])
  })

  it('FR-35: mover o C de quinta para sábado deixa a quinta livre', () => {
    expect(week([moved(2, '2026-10-24')])).toEqual(['19 A', '20 B', '23 D', '24 C*'])
  })

  it('FR-35: depois de fazer C e D fora de ordem, a semana seguinte segue com E e F', () => {
    const occ = [done(0, MON), done(1, '2026-10-20'), done(3, '2026-10-23'), { ...done(2, '2026-10-24'), planned_on: '2026-10-24' }]
    expect(week(occ, '2026-10-26', '2026-11-01')).toEqual(['26 E', '27 F', '29 A', '30 B'])
  })

  it('FR-35: mover para antes funciona e pode juntar dois treinos no mesmo dia', () => {
    expect(week([moved(3, '2026-10-20')])).toEqual(['19 A', '20 B', '20 D*', '22 C'])
  })

  it('movido para um dia que já passou volta para a fila', () => {
    expect(week([moved(0, '2026-10-17')])).toEqual(['19 A', '20 B', '22 C', '23 D'])
  })

  it('treino feito hoje ocupa o lugar de hoje', () => {
    expect(week([done(0, MON)])[0]).toBe('20 B')
  })

  it('sem Dias de treino, o Próximo treino é o primeiro da fila', () => {
    const next = nextWorkout({ itemCount: 6, weeklySlots: [0, 0, 0, 0, 0, 0, 0], occurrences: [done(0, MON)], today: MON })
    expect(next).toEqual({ date: null, seq: 1, itemIndex: 1, moved: false })
  })
})
