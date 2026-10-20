import type { Rotation, RotationItem, RotationOccurrence, Session, Template, TemplateExercise, WorkoutSet } from './db'
import { addDays, nextWorkout, planSchedule, startOfWeek, toLocalDate, weekdayIndex } from './schedule'
import type { TodayModel, WeekDayModel } from '../screens/TodayView'

// Monta a tela Hoje a partir do banco local: semana (FR-3), Próximo treino (FR-1)
// e próximos da Agenda (FR-34, FR-35).

export interface TodayData {
  rotation: Rotation | null
  items: RotationItem[]
  occurrences: RotationOccurrence[]
  weekSessions: Session[] // Sessões concluídas desta semana, de todas as Modalidades
  weekSets: WorkoutSet[]
  templates: Template[]
  templateExercises: TemplateExercise[]
}

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const DEFAULT_REST_SECONDS = 90
const SECONDS_PER_SET = 45

function shortDate(date: string, today: string): string {
  const [, m, d] = date.split('-')
  const label = `${WEEKDAYS[weekdayIndex(date)]} ${d}/${m}`
  if (date === today) return `Hoje · ${label}`
  if (date === addDays(today, 1)) return `Amanhã · ${label}`
  return label
}

export function buildTodayModel(data: TodayData, today: string, now = new Date()): TodayModel {
  const monday = startOfWeek(today)
  const sunday = addDays(monday, 6)
  const items = [...data.items].filter((i) => !i.deleted_at).sort((a, b) => a.position - b.position)
  const occurrences = data.occurrences.filter((o) => !o.deleted_at)
  const scheduleInput = {
    itemCount: items.length,
    weeklySlots: data.rotation?.weekly_slots ?? [0, 0, 0, 0, 0, 0, 0],
    occurrences,
    today,
  }

  const plan = data.rotation ? planSchedule({ ...scheduleInput, until: addDays(today, 13) }) : []
  const doneSessions = data.weekSessions.filter((s) => s.ended_at && !s.deleted_at)

  const week: WeekDayModel[] = WEEKDAYS.map((weekday, i) => {
    const date = addDays(monday, i)
    const done = doneSessions
      .filter((s) => toLocalDate(new Date(s.started_at)) === date) // dia no fuso da pessoa
      .map((s) => ({ modality: s.modality, status: 'done' as const, seq: null, label: null }))
    const planned = plan
      .filter((p) => p.date === date)
      .map((p) => ({
        modality: items[p.itemIndex].modality,
        status: 'planned' as const,
        seq: p.seq,
        label: items[p.itemIndex].label,
      }))
    return { date, weekday, dayNumber: Number(date.slice(8)), isToday: date === today, items: [...done, ...planned] }
  })

  const plannedRestOfWeek = plan.filter((p) => p.date <= sunday).length

  const next = data.rotation ? nextWorkout(scheduleInput) : null
  let nextModel: TodayModel['next'] = null
  if (next) {
    const item = items[next.itemIndex]
    const template = data.templates.find((t) => t.id === item.template_id)
    const exercises = data.templateExercises.filter((te) => te.template_id === item.template_id && !te.deleted_at)
    const setCount = exercises.reduce((sum, te) => sum + te.target_sets, 0)
    const seconds = exercises.reduce(
      (sum, te) => sum + te.target_sets * (SECONDS_PER_SET + (te.rest_seconds ?? DEFAULT_REST_SECONDS)),
      0,
    )
    nextModel = {
      seq: next.seq,
      label: item.label,
      notes: template?.notes ?? null,
      modality: item.modality,
      dateLabel: next.date ? shortDate(next.date, today) : 'Próximo treino',
      exerciseCount: exercises.length || null,
      setCount: setCount || null,
      estimatedMinutes: seconds ? Math.max(5, Math.round(seconds / 60 / 5) * 5) : null,
    }
  }

  const upcoming = plan
    .filter((p) => !next || p.seq !== next.seq)
    .slice(0, 4)
    .map((p) => ({
      key: `${p.seq}`,
      label: items[p.itemIndex].label,
      modality: items[p.itemIndex].modality,
      dateLabel: shortDate(p.date, today) + (p.moved ? ' · movido' : ''),
    }))

  // Volume = peso × reps das Séries feitas (FR-26)
  const doneIds = new Set(doneSessions.map((s) => s.id))
  const volumeKg = data.weekSets
    .filter((s) => doneIds.has(s.session_id) && s.status === 'done' && !s.deleted_at)
    .reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)

  return {
    today,
    dateLabel: now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
    hasRotation: Boolean(data.rotation),
    week,
    next: nextModel,
    upcoming,
    doneThisWeek: doneSessions.length,
    plannedThisWeek: doneSessions.length + plannedRestOfWeek,
    volumeKg: Math.round(volumeKg),
  }
}
