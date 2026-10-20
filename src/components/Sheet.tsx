import type { ReactNode } from 'react'

// Folha que sobe do rodapé, por cima da tela (ações de um dia, escolha de dia).
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative rounded-t-lg border-t border-line bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-ink">
        <div className="mx-auto mb-3 h-1 w-10 rounded-sm bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl">{title}</h2>
          <button onClick={onClose} className="text-sm font-bold uppercase tracking-wider text-muted">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
