import { Button, Card, Label, SectionHeader } from '../components/ui'
import type { Theme } from '../lib/theme'

// Aba Perfil, só apresentação.

export default function ProfileView({
  email,
  theme,
  onThemeChange,
  onSignOut,
}: {
  email: string
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onSignOut?: () => void
}) {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <h1 className="text-6xl">Perfil</h1>
      </header>

      <Card className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-lime font-display text-3xl font-extrabold uppercase text-on-lime">
          {email.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <Label className="text-muted">Conta</Label>
          <p className="truncate font-semibold">{email}</p>
        </div>
      </Card>

      <section className="space-y-2 pt-2">
        <SectionHeader title="Aparência" />
        <Card>
          <div role="radiogroup" aria-label="Tema" className="grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={theme === t}
                onClick={() => onThemeChange(t)}
                className={`h-11 rounded-sm font-display text-lg font-bold uppercase tracking-wide ${
                  theme === t ? 'bg-inverse text-on-inverse' : 'text-muted'
                }`}
              >
                {t === 'light' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Vale só para este aparelho.</p>
        </Card>
      </section>

      <Button variant="secondary" size="md" onClick={onSignOut} disabled={!onSignOut}>
        Sair
      </Button>
    </main>
  )
}
