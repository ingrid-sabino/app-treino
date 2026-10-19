import { Card } from '../components/ui'
import Screen from '../components/Screen'

export default function Train() {
  return (
    <Screen title="Treinar">
      <Card>
        <h2 className="text-2xl uppercase">Templates</h2>
        <p className="mt-2 text-sm text-muted">Seus Templates e Rotações vão ficar aqui.</p>
      </Card>
      <Card>
        <h2 className="text-2xl uppercase">Importar Programa</h2>
        <p className="mt-2 text-sm text-muted">
          Cole o Programa gerado pela IA a partir de um Prompt-modelo.
        </p>
      </Card>
    </Screen>
  )
}
