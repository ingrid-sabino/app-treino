import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveLocal } from '../lib/db'
import { toLocalDate } from '../lib/schedule'
import { buildTrainModel, type TrainData } from '../lib/train'
import TrainView from './TrainView'

async function loadTrainData(): Promise<TrainData> {
  const rotation = (await db.rotations.filter((r) => r.is_active && !r.deleted_at).first()) ?? null
  const templates = await db.templates.toArray()
  return {
    rotation,
    items: rotation ? await db.rotation_items.where('rotation_id').equals(rotation.id).toArray() : [],
    occurrences: rotation ? await db.rotation_occurrences.where('rotation_id').equals(rotation.id).toArray() : [],
    templates,
    templateExercises: await db.template_exercises.where('template_id').anyOf(templates.map((t) => t.id)).toArray(),
  }
}

export default function Train() {
  const data = useLiveQuery(loadTrainData, [])
  if (!data) return null
  const model = buildTrainModel(data, toLocalDate(new Date()))
  const rotation = data.rotation

  return (
    <TrainView
      model={model}
      // Dias de treino da Rotação (FR-34)
      onSlotsChange={rotation ? (weekly_slots) => saveLocal('rotations', { ...rotation, weekly_slots }) : undefined}
    />
  )
}
