import { MemoryRouter } from 'react-router'
import TabBar from '../components/TabBar'
import { sampleCatalog, sampleProgressData, sampleTemplateDraft, sampleTodayData, sampleTodayTwoToday } from '../lib/sample'
import { useState } from 'react'
import TemplateEditorView from './TemplateEditorView'
import RotationEditorView from './RotationEditorView'
import type { RotationDraft } from '../lib/rotations'
import { buildProgressModel } from '../lib/progress'
import { buildTrainModel } from '../lib/train'
import { getTheme } from '../lib/theme'
import ProfileView from './ProfileView'
import ProgressView from './ProgressView'
import TrainView from './TrainView'
import { buildTodayModel } from '../lib/today'
import DesignSheet from './DesignSheet'
import Login from './Login'
import { MuscleMap } from '../components/MuscleMap'
import { PictogramView } from '../components/Pictogram'
import { PICTOGRAMS } from '../lib/pictograms'
import { EXERCISE_INFO, highlightFor } from '../lib/exerciseInfo'
import TodayView from './TodayView'

// Prévias visuais com dados de exemplo (só em desenvolvimento): /design?tela=...
const noop = () => {}

export default function Preview() {
  const tela = new URLSearchParams(window.location.search).get('tela')
  const now = new Date('2026-10-20T08:00:00')
  const wrap = (screen: React.ReactNode, path: string) => (
    <MemoryRouter initialEntries={[path]}>
      {screen}
      <TabBar />
    </MemoryRouter>
  )
  if (tela === 'template' || tela === 'template-catalogo' || tela === 'template-execucao' || tela === 'ficha')
    return <TemplatePreview picker={tela === 'template-catalogo'} frames={tela === 'template-execucao' ? 1 : tela === 'ficha' ? 0 : undefined} />
  if (tela === 'pictogramas')
    return (
      <main className="mx-auto max-w-lg space-y-3 px-4 py-6">
        <h1 className="text-5xl">Pictogramas</h1>
        <p className="text-sm text-muted">Início e fim de cada Exercício. No app, a figura anima entre os dois.</p>
        {Object.entries(PICTOGRAMS).map(([name, def]) => (
          <section key={name} className="grid grid-cols-[1fr_1fr] items-end gap-2">
            <h2 className="col-span-2 text-lg">{name}</h2>
            <PictogramView def={def} frame={0} className="w-full rounded-md" />
            <PictogramView def={def} frame={1} className="w-full rounded-md" />
          </section>
        ))}
      </main>
    )
  if (tela === 'pictograma-animado')
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <PictogramView def={PICTOGRAMS['Agachamento livre']} animated highlight={highlightFor(EXERCISE_INFO['Agachamento livre'])} className="w-full rounded-md" />
      </main>
    )
  if (tela === 'musculos')
    return (
      <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
        <h1 className="text-5xl">Músculos</h1>
        {[
          { name: 'Supino reto', primary: ['chest'], secondary: ['triceps', 'front-deltoids'] },
          { name: 'Agachamento livre', primary: ['quadriceps', 'gluteal'], secondary: ['hamstring', 'adductor', 'lower-back'] },
          { name: 'Barra fixa', primary: ['upper-back'], secondary: ['biceps', 'back-deltoids', 'forearm'] },
        ].map((e) => (
          <section key={e.name}>
            <h2 className="mb-2 text-2xl">{e.name}</h2>
            <MuscleMap primary={e.primary as never} secondary={e.secondary as never} />
          </section>
        ))}
      </main>
    )
  if (tela === 'rotacao' || tela === 'rotacao-adicionar') return <RotationPreview adding={tela === 'rotacao-adicionar'} />
  if (tela === 'login') return <Login />
  if (tela === 'login-codigo') return <Login initialStep="code" initialEmail="ingridsabino000@gmail.com" initialCode="4821" />
  if (tela === 'treinar') {
    const d = sampleTodayData()
    return wrap(<TrainView model={buildTrainModel(d, '2026-10-20')} onStartFree={noop} onLogCardio={noop} onLogYoga={noop} onSlotsChange={noop} onCreateTemplate={noop} onImport={noop} onEditRotation={noop} onNewRotation={noop} />, '/treinar')
  }
  if (tela === 'evolucao') return wrap(<ProgressView model={buildProgressModel(sampleProgressData(), '2026-10-20')} onLogBody={noop} />, '/evolucao')
  if (tela === 'perfil') return wrap(<ProfileView email="ingrid@exemplo.com" theme={getTheme()} onThemeChange={noop} onSignOut={noop} />, '/perfil')
  if (tela === 'hoje-dia' || tela === 'hoje-mudar') {
    const model = buildTodayModel(sampleTodayData(), '2026-10-20', now)
    const day = model.week[3] // quinta: Treino C
    const item = day.items[0]
    return wrap(
      <TodayView
        model={model}
        onStart={noop}
        onSkip={noop}
        onMove={noop}
        initialSheet={tela === 'hoje-dia' ? { kind: 'day', day } : { kind: 'move', seq: item.seq!, label: item.label!, from: day.date }}
      />,
      '/',
    )
  }
  if (tela === 'hoje-dois')
    return wrap(<TodayView model={buildTodayModel(sampleTodayTwoToday(), '2026-10-20', now)} onStart={noop} onSkip={noop} onMove={noop} />, '/')
  if (tela === 'hoje' || tela === 'hoje-vazio') {
    const data = sampleTodayData()
    const model = buildTodayModel(
      tela === 'hoje' ? data : { ...data, rotation: null, items: [], occurrences: [], weekSessions: [], weekSets: [] },
      '2026-10-20',
      now,
    )
    return (
      <MemoryRouter>
        <TodayView model={model} onStart={noop} onSkip={noop} onMove={noop} onImport={noop} onCreateTemplate={noop} />
        <TabBar />
      </MemoryRouter>
    )
  }
  return <DesignSheet />
}

function TemplatePreview({ picker, frames }: { picker: boolean; frames?: number }) {
  const [draft, setDraft] = useState(sampleTemplateDraft())
  return (
    <TemplateEditorView
      draft={draft}
      catalog={sampleCatalog()}
      onChange={setDraft}
      onSave={noop}
      onCancel={noop}
      onArchive={noop}
      onCreateExercise={async () => sampleCatalog()[0]}
      initialPickerOpen={picker}
      initialFramesIndex={frames}
    />
  )
}

function RotationPreview({ adding }: { adding: boolean }) {
  const d = sampleTodayData()
  const [draft, setDraft] = useState<RotationDraft>({
    id: 'rot',
    isNew: false,
    name: 'Força + corrida',
    isActive: false,
    weeklySlots: d.rotation!.weekly_slots,
    items: d.items.map((i) => ({ key: i.id, templateId: i.template_id, modality: i.modality, label: i.label })),
  })
  const [activate, setActivate] = useState(true)
  return (
    <RotationEditorView
      draft={draft}
      templates={d.templates.map((t) => ({ id: t.id, name: t.name, modality: t.modality, notes: t.notes }))}
      activate={activate}
      onChange={setDraft}
      onActivateChange={setActivate}
      onSave={noop}
      onCancel={noop}
      onCreateTemplate={noop}
      initialAddOpen={adding}
    />
  )
}
