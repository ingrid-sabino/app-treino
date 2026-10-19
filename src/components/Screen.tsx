import type { ReactNode } from 'react'

export default function Screen({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-lg px-5 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {kicker && <p className="text-sm font-medium text-muted first-letter:uppercase">{kicker}</p>}
      <h1 className="text-5xl uppercase leading-none">{title}</h1>
      <div className="mt-6 space-y-4">{children}</div>
    </main>
  )
}
