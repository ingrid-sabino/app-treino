import type { Modality, Rotation, RotationItem, RotationOccurrence, Template, TemplateExercise } from './db'
import { nextWorkout } from './schedule'

// Aba Treinar: Rotação ativa (com Dias de treino, FR-34) e Templates.

export interface TrainModel {
  rotation: {
    id: string
    name: string
    sourceLabel: string
    weeklySlots: number[]
    items: { id: string; position: number; label: string; modality: Modality; isNext: boolean }[]
  } | null
  templates: { id: string; name: string; modality: Modality; exerciseCount: number; notes: string | null }[]
}

export interface TrainData {
  rotation: Rotation | null
  items: RotationItem[]
  occurrences: RotationOccurrence[]
  templates: Template[]
  templateExercises: TemplateExercise[]
}

const sourceLabel: Record<Rotation['source'], string> = {
  manual: 'Criada à mão',
  ai_import: 'Programa importado',
  preset: 'Programa pronto',
}

export function buildTrainModel(data: TrainData, today: string): TrainModel {
  const items = data.items.filter((i) => !i.deleted_at).sort((a, b) => a.position - b.position)
  const next = data.rotation
    ? nextWorkout({
        itemCount: items.length,
        weeklySlots: data.rotation.weekly_slots,
        occurrences: data.occurrences.filter((o) => !o.deleted_at),
        today,
      })
    : null
  return {
    rotation: data.rotation && {
      id: data.rotation.id,
      name: data.rotation.name,
      sourceLabel: sourceLabel[data.rotation.source],
      weeklySlots: data.rotation.weekly_slots,
      items: items.map((i, n) => ({ id: i.id, position: n + 1, label: i.label, modality: i.modality, isNext: next?.itemIndex === n })),
    },
    templates: data.templates
      .filter((t) => !t.deleted_at && !t.archived_at)
      .map((t) => ({
        id: t.id,
        name: t.name,
        modality: t.modality,
        notes: t.notes,
        exerciseCount: data.templateExercises.filter((te) => te.template_id === t.id && !te.deleted_at).length,
      })),
  }
}
