import { useState } from 'react'
import Sheet from '../components/Sheet'
import TrainingDays from '../components/TrainingDays'
import { Button, Card, Label, ModalityTag, SectionHeader, TextButton, modalityStyle } from '../components/ui'
import type { Modality } from '../lib/db'
import { moveItem, type DraftItem, type RotationDraft } from '../lib/rotations'

// Montagem da Rotação, só apresentação: o rascunho vive no container (RotationEditor.tsx).

export interface TemplateOption {
  id: string
  name: string
  modality: Modality
  notes: string | null
}

const CARDIO: { modality: Modality; label: string }[] = [
  { modality: 'run', label: 'Corrida' },
  { modality: 'ride', label: 'Ciclismo' },
  { modality: 'yoga', label: 'Yoga' },
  { modality: 'other', label: 'Outra' },
]

const barColor: Record<Modality, string> = {
  strength: 'bg-lime',
  run: 'bg-lilac',
  ride: 'bg-lilac',
  yoga: 'bg-inverse',
  other: 'bg-muted',
}

function ItemRow({ item, index, count, onChange, onMove, onRemove }: {
  item: DraftItem
  index: number
  count: number
  onChange: (item: DraftItem) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <Card className="flex items-center gap-3 py-3">
      <span className="w-6 shrink-0 text-center font-display text-2xl font-bold text-muted">{index + 1}</span>
      <div className={`h-10 w-1.5 shrink-0 rounded-sm ${barColor[item.modality]}`} />
      <div className="min-w-0 flex-1">
        {item.templateId ? (
          <p className="truncate font-display text-xl font-bold uppercase">{item.label}</p>
        ) : (
          // Dia sem Template: o nome é editável ("Corrida leve 5 km")
          <input
            aria-label="Nome do treino"
            value={item.label}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
            className="w-full bg-transparent font-display text-xl font-bold uppercase outline-none focus:underline"
          />
        )}
        <ModalityTag modality={item.modality} className="mt-1" />
      </div>
      <div className="flex shrink-0 gap-1">
        <button aria-label="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="h-8 w-8 rounded-sm border border-line text-lg disabled:opacity-25">
          ↑
        </button>
        <button aria-label="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="h-8 w-8 rounded-sm border border-line text-lg disabled:opacity-25">
          ↓
        </button>
        <button aria-label="Remover" onClick={onRemove} className="h-8 w-8 rounded-sm border border-line text-lg text-danger">
          ×
        </button>
      </div>
    </Card>
  )
}

export default function RotationEditorView({
  draft,
  templates,
  activate,
  onChange,
  onActivateChange,
  onSave,
  onCancel,
  onCreateTemplate,
  initialAddOpen = false,
}: {
  draft: RotationDraft
  templates: TemplateOption[]
  activate: boolean
  onChange: (d: RotationDraft) => void
  onActivateChange: (v: boolean) => void
  onSave?: () => void
  onCancel?: () => void
  onCreateTemplate?: () => void
  initialAddOpen?: boolean
}) {
  const [adding, setAdding] = useState(initialAddOpen)
  const perWeek = draft.weeklySlots.reduce((a, b) => a + b, 0)
  const add = (item: Omit<DraftItem, 'key'>) => {
    onChange({ ...draft, items: [...draft.items, { ...item, key: crypto.randomUUID() }] })
    setAdding(false)
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-32">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <TextButton className="whitespace-nowrap" onClick={onCancel}>
          ← Voltar
        </TextButton>
        <Label className="text-muted">{draft.isNew ? 'Nova Rotação' : 'Editar Rotação'}</Label>
        <Button size="sm" className="!w-auto px-5" onClick={onSave} disabled={!onSave || !draft.name.trim() || draft.items.length === 0}>
          Salvar
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        <input
          aria-label="Nome da Rotação"
          placeholder="Nome da Rotação"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          className="w-full bg-transparent font-display text-5xl font-extrabold uppercase leading-none outline-none placeholder:text-line"
        />

        <section className="space-y-2">
          <SectionHeader
            title="Ordem dos treinos"
            action={<p className="font-display text-lg font-bold uppercase text-muted">{draft.items.length} treinos</p>}
          />
          <p className="text-sm text-muted">O Tönus segue esta ordem e volta ao primeiro depois do último.</p>
          {draft.items.map((item, i) => (
            <ItemRow
              key={item.key}
              item={item}
              index={i}
              count={draft.items.length}
              onChange={(next) => onChange({ ...draft, items: draft.items.map((x) => (x.key === item.key ? next : x)) })}
              onMove={(delta) => onChange(moveItem(draft, i, delta))}
              onRemove={() => onChange({ ...draft, items: draft.items.filter((x) => x.key !== item.key) })}
            />
          ))}
          {draft.items.length === 0 && <Card className="border-dashed text-center text-sm text-muted">Adicione Templates e dias de cardio na ordem em que quer treinar.</Card>}
          <Button variant="dark" size="md" onClick={() => setAdding(true)}>
            + Adicionar treino
          </Button>
        </section>

        <Card>
          <TrainingDays slots={draft.weeklySlots} onChange={(weeklySlots) => onChange({ ...draft, weeklySlots })} />
          {perWeek > 0 && draft.items.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              {draft.items.length <= perWeek
                ? `A Rotação inteira cabe em uma semana${draft.items.length < perWeek ? ' e recomeça na mesma semana' : ''}.`
                : `A Rotação inteira leva cerca de ${Math.ceil(draft.items.length / perWeek)} semanas.`}
            </p>
          )}
        </Card>

        {!draft.isActive && (
          <button
            role="switch"
            aria-checked={activate}
            onClick={() => onActivateChange(!activate)}
            className={`flex w-full items-center justify-between rounded-lg border p-4 text-left ${activate ? 'border-ink bg-lime text-on-lime' : 'border-line bg-surface'}`}
          >
            <span>
              <span className="block font-display text-xl font-bold uppercase">Ativar a partir de hoje</span>
              <span className="block text-sm opacity-80">A tela Hoje passa a seguir esta Rotação; a atual fica arquivada.</span>
            </span>
            <span className={`ml-3 flex h-7 w-12 shrink-0 items-center rounded-sm p-1 ${activate ? 'bg-inverse' : 'bg-surface-2'}`}>
              <span className={`h-5 w-5 rounded-sm transition ${activate ? 'translate-x-5 bg-lime' : 'bg-muted'}`} />
            </span>
          </button>
        )}
      </div>

      {adding && (
        <Sheet title="Adicionar treino" onClose={() => setAdding(false)}>
          <div className="max-h-[70dvh] space-y-4 overflow-y-auto">
            <div>
              <Label className="mb-1.5 text-muted">Seus Templates</Label>
              <ul className="divide-y divide-line">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => add({ templateId: t.id, modality: t.modality, label: t.name })}>
                      <div className={`h-9 w-1.5 rounded-sm ${barColor[t.modality]}`} />
                      <span className="flex-1">
                        <span className="block font-display text-lg font-bold uppercase">{t.name}</span>
                        {t.notes && <span className="block text-xs text-muted">{t.notes}</span>}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink text-xl font-bold">+</span>
                    </button>
                  </li>
                ))}
              </ul>
              {templates.length === 0 && <p className="py-3 text-sm text-muted">Nenhum Template ainda.</p>}
              {onCreateTemplate && (
                <TextButton className="mt-1" onClick={onCreateTemplate}>
                  Criar Template
                </TextButton>
              )}
            </div>
            <div>
              <Label className="mb-1.5 text-muted">Dia sem Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {CARDIO.map((c) => (
                  <button
                    key={c.modality}
                    onClick={() => add({ templateId: null, modality: c.modality, label: c.label })}
                    className={`h-12 rounded-md font-display text-lg font-bold uppercase ${modalityStyle[c.modality].className}`}
                  >
                    + {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  )
}
