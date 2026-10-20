import { MemoryRouter } from 'react-router'
import TabBar from '../components/TabBar'
import { sampleTodayData } from '../lib/sample'
import { buildTodayModel } from '../lib/today'
import DesignSheet from './DesignSheet'
import TodayView from './TodayView'

// Prévias visuais com dados de exemplo (só em desenvolvimento): /design?tela=...
const noop = () => {}

export default function Preview() {
  const tela = new URLSearchParams(window.location.search).get('tela')
  const now = new Date('2026-10-20T08:00:00')
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
