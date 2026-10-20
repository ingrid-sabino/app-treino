import type { BodyLog, Exercise, Session, WorkoutSet } from './db'
import { addDays, startOfWeek, toLocalDate } from './schedule'
import { estimateOneRepMax } from './strength'
import type { TrendPoint } from '../components/TrendChart'

// Aba Evolução: curva de força por Exercício (1RM estimado, FR-22) e peso corporal.

export interface ProgressModel {
  sessionsThisMonth: number
  volumeThisWeekKg: number
  strength: { exerciseId: string; name: string; points: TrendPoint[]; best: number; change: number }[]
  weight: TrendPoint[]
}

export interface ProgressData {
  sessions: Session[]
  sets: WorkoutSet[]
  exercises: Exercise[]
  bodyLogs: BodyLog[]
}

export function buildProgressModel(data: ProgressData, today: string): ProgressModel {
  const sessions = data.sessions.filter((s) => s.ended_at && !s.deleted_at)
  const dayOf = new Map(sessions.map((s) => [s.id, toLocalDate(new Date(s.started_at))]))
  const doneSets = data.sets.filter((s) => s.status === 'done' && !s.deleted_at && dayOf.has(s.session_id))

  // Melhor 1RM estimado de cada Exercício em cada dia
  const byExercise = new Map<string, Map<string, number>>()
  for (const s of doneSets) {
    if (!s.weight_kg || !s.reps) continue
    const day = dayOf.get(s.session_id)!
    const days = byExercise.get(s.exercise_id) ?? new Map<string, number>()
    days.set(day, Math.max(days.get(day) ?? 0, estimateOneRepMax(s.weight_kg, s.reps)))
    byExercise.set(s.exercise_id, days)
  }
  const strength = [...byExercise.entries()]
    .map(([exerciseId, days]) => {
      const points = [...days.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, value]) => ({ date, value: Math.round(value * 10) / 10 }))
      return {
        exerciseId,
        name: data.exercises.find((e) => e.id === exerciseId)?.name ?? 'Exercício',
        points,
        best: Math.max(...points.map((p) => p.value)),
        change: points.length > 1 ? Math.round((points[points.length - 1].value - points[0].value) * 10) / 10 : 0,
      }
    })
    .sort((a, b) => b.points.length - a.points.length)

  const monday = startOfWeek(today)
  const weekIds = new Set(sessions.filter((s) => (dayOf.get(s.id) ?? '') >= monday && (dayOf.get(s.id) ?? '') <= addDays(monday, 6)).map((s) => s.id))
  return {
    sessionsThisMonth: sessions.filter((s) => (dayOf.get(s.id) ?? '').slice(0, 7) === today.slice(0, 7)).length,
    volumeThisWeekKg: Math.round(doneSets.filter((s) => weekIds.has(s.session_id)).reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)),
    strength,
    weight: data.bodyLogs
      .filter((b) => b.weight_kg != null && !b.deleted_at)
      .sort((a, b) => (a.logged_on < b.logged_on ? -1 : 1))
      .map((b) => ({ date: b.logged_on, value: b.weight_kg! })),
  }
}
