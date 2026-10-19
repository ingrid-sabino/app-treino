import { Card } from '../components/ui'
import Screen from '../components/Screen'

export default function Progress() {
  return (
    <Screen title="Evolução">
      <Card>
        <h2 className="text-2xl uppercase">Força</h2>
        <p className="mt-2 text-sm text-muted">A curva de 1RM estimado por Exercício aparece depois das primeiras Sessões.</p>
      </Card>
      <Card>
        <h2 className="text-2xl uppercase">Corpo</h2>
        <p className="mt-2 text-sm text-muted">Peso, medidas e Fotos de progresso do Registro corporal.</p>
      </Card>
    </Screen>
  )
}
