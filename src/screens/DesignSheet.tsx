import { MemoryRouter } from 'react-router'
import TabBar from '../components/TabBar'
import { Button, Card, Input, Label, ModalityTag, SectionHeader, Stat, TextButton } from '../components/ui'

// Folha de componentes para revisar a identidade visual (só em desenvolvimento: /design).

const swatches = [
  { name: 'Lima', className: 'bg-lime text-on-lime', hex: '#D4F26A' },
  { name: 'Tinta', className: 'bg-inverse text-on-inverse', hex: '#1E1B2E' },
  { name: 'Lilás', className: 'bg-lilac text-on-lilac', hex: '#B9A7F5' },
  { name: 'Fundo', className: 'bg-bg text-ink border border-line', hex: 'claro/escuro' },
  { name: 'Superfície', className: 'bg-surface text-ink border border-line', hex: 'claro/escuro' },
]

export default function DesignSheet() {
  return (
    <MemoryRouter>
      <main className="mx-auto max-w-lg space-y-8 px-4 pb-32 pt-6">
        <div>
          <Label className="text-muted">Tönus · base visual</Label>
          <h1 className="mt-1 text-6xl">Componentes</h1>
        </div>

        <section className="space-y-3">
          <SectionHeader title="Cores" />
          <div className="grid grid-cols-5 gap-2">
            {swatches.map((s) => (
              <div key={s.name} className={`flex aspect-[3/4] flex-col justify-end rounded-md p-2 ${s.className}`}>
                <p className="text-[11px] font-bold uppercase">{s.name}</p>
                <p className="text-[10px] opacity-70">{s.hex}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <SectionHeader title="Tipografia" />
          <p className="font-display text-7xl font-extrabold uppercase leading-none">Treino B</p>
          <p className="font-display text-3xl font-bold uppercase">Costas e bíceps</p>
          <p className="text-base">Inter no texto corrido: 6 exercícios, 18 Séries, cerca de 55 minutos.</p>
          <Label className="text-muted">Rótulo de seção</Label>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Botões" />
          <Button>Começar treino</Button>
          <Button variant="dark">Ver Rotação</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md">Pular</Button>
            <Button variant="secondary" size="md">Mudar dia</Button>
          </div>
          <TextButton>Link de texto</TextButton>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Modalidades" />
          <div className="flex flex-wrap gap-2">
            <ModalityTag modality="strength" />
            <ModalityTag modality="run" />
            <ModalityTag modality="yoga" />
            <ModalityTag modality="other" />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Cards" action={<TextButton>Ver tudo</TextButton>} />

          <Card tone="inverse" className="p-5">
            <div className="flex items-center justify-between">
              <Label className="opacity-70">Hoje · ter 20/10</Label>
              <ModalityTag modality="strength" />
            </div>
            <p className="mt-3 font-display text-6xl font-extrabold uppercase leading-[0.9]">Treino B</p>
            <p className="mt-1 font-display text-2xl font-semibold uppercase opacity-80">Costas e bíceps</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
              <Stat label="Exercícios" value="6" />
              <Stat label="Séries" value="18" />
              <Stat label="Duração" value="55" unit="min" />
            </div>
            <Button className="mt-5">Começar</Button>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card tone="lime">
              <Stat label="Volume" value="12.450" unit="kg" />
            </Card>
            <Card tone="lilac">
              <Stat label="Corrida" value="5,2" unit="km" />
            </Card>
          </div>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-sm bg-lilac" />
              <div className="flex-1">
                <p className="font-display text-xl font-bold uppercase">Corrida leve 5 km</p>
                <p className="text-sm text-muted">Qui 22/10 · Próximo da Rotação</p>
              </div>
              <ModalityTag modality="run" />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Campos" />
          <Input placeholder="voce@email.com" />
        </section>
        <section className="space-y-3">
          <SectionHeader title="Navegação" />
          {/* Na folha a barra fica no fluxo da página; no app ela é fixa no rodapé */}
          <div className="overflow-hidden rounded-lg border border-line [&>nav]:static">
            <TabBar />
          </div>
        </section>
      </main>
    </MemoryRouter>
  )
}
