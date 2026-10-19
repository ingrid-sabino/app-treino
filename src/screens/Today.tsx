import { Card } from '../components/ui'
import Screen from '../components/Screen'

const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

export default function Today() {
  const today = new Date()
  const kicker = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayIndex = (today.getDay() + 6) % 7 // semana começa na segunda (FR-3)

  return (
    <Screen title="Hoje" kicker={kicker}>
      <Card className="bg-lime-soft">
        <p className="text-sm font-medium text-muted">Próximo treino</p>
        <h2 className="mt-1 text-3xl uppercase">Nenhuma Rotação ativa</h2>
        <p className="mt-2 text-sm text-muted">
          Crie seus Templates e uma Rotação, ou importe um Programa. O Próximo treino aparece aqui.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-medium text-muted">Semana</p>
        <ol className="mt-3 grid grid-cols-7 gap-1 text-center">
          {weekdays.map((day, i) => (
            <li key={day} className="flex flex-col items-center gap-2">
              <span className={`text-xs ${i === todayIndex ? 'font-semibold text-ink' : 'text-muted'}`}>{day}</span>
              <span
                className={`h-9 w-9 rounded-full border ${
                  i === todayIndex ? 'border-lilac bg-lilac-soft' : 'border-line'
                }`}
              />
            </li>
          ))}
        </ol>
      </Card>
    </Screen>
  )
}
