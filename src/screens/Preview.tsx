import { MemoryRouter } from 'react-router'
import TabBar from '../components/TabBar'
import { sampleProgressData, sampleTodayData } from '../lib/sample'
import { buildProgressModel } from '../lib/progress'
import { buildTrainModel } from '../lib/train'
import { getTheme } from '../lib/theme'
import ProfileView from './ProfileView'
import ProgressView from './ProgressView'
import TrainView from './TrainView'
import { buildTodayModel } from '../lib/today'
import DesignSheet from './DesignSheet'
import Login from './Login'
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
  if (tela === 'login') return <Login />
  if (tela === 'login-codigo') return <Login initialStep="code" initialEmail="ingridsabino000@gmail.com" initialCode="4821" />
  if (tela === 'treinar') {
    const d = sampleTodayData()
    return wrap(<TrainView model={buildTrainModel(d, '2026-10-20')} onStartFree={noop} onLogCardio={noop} onLogYoga={noop} onSlotsChange={noop} onCreateTemplate={noop} onImport={noop} />, '/treinar')
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
