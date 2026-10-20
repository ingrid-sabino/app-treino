import { useState, type FormEvent } from 'react'
import { Button, Input, Label, TextButton } from '../components/ui'
import { sendLoginEmail, verifyLoginCode } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

const CODE_LENGTH = 6 // Supabase: mailer_otp_length

// Login por código de 6 dígitos no e-mail (funciona no PWA instalado no iPhone);
// o magic link do mesmo e-mail continua valendo no navegador.
export default function Login({
  initialStep = 'email',
  initialEmail = '',
  initialCode = '',
}: {
  initialStep?: 'email' | 'code'
  initialEmail?: string
  initialCode?: string
}) {
  const [step, setStep] = useState<'email' | 'code'>(initialStep)
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(initialCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  async function handleEmail(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await sendLoginEmail(email.trim())
      setStep('code')
    } catch {
      setError('Não foi possível enviar o e-mail. Confira o endereço e a internet.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verifyLoginCode(email.trim(), code.trim())
    } catch {
      setError('Código inválido ou expirado. Peça um novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <img src="/pwa-192x192.png" alt="" className="h-9 w-9 rounded-md" />
        <span className="font-display text-2xl font-extrabold uppercase tracking-tight">Tönus</span>
      </header>

      <section className="mt-5 rounded-lg bg-inverse p-5 text-on-inverse">
        <p className="font-display text-6xl font-extrabold uppercase leading-[0.9]">
          Seu treino de hoje, <span className="text-lime">sempre pronto.</span>
        </p>
        <ul className="mt-6 space-y-2.5 text-sm">
          <li className="flex items-center gap-3">
            <span className="h-4 w-4 shrink-0 rounded-sm bg-lime" />
            Rotação que sabe qual é o próximo treino
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-4 shrink-0 rounded-sm bg-lilac" />
            Programas gerados por IA, importados prontos
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-4 shrink-0 rounded-sm border-2 border-on-inverse" />
            Força e corpo na mesma linha do tempo
          </li>
        </ul>
      </section>

      {!supabaseConfigured && (
        <p className="mt-4 rounded-md border border-danger p-3 text-sm text-danger">
          Supabase não configurado: faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.
        </p>
      )}

      <div className="mt-auto pt-8">
        {step === 'email' ? (
          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <h1 className="text-4xl">Entrar</h1>
              <p className="mt-1 text-sm text-muted">Mandamos um código de 6 dígitos para o seu e-mail. Sem senha.</p>
            </div>
            <label htmlFor="email" className="sr-only">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={busy || !email}>
              {busy ? 'Enviando…' : 'Receber código'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCode} className="space-y-3">
            <div>
              <h1 className="text-4xl">Digite o código</h1>
              <p className="mt-1 text-sm text-muted">
                Enviado para <strong className="text-ink">{email}</strong>. Vale por 1 hora. Se não chegar, olhe no spam.
              </p>
            </div>
            {/* Seis caixas visuais sobre um único campo, para o teclado numérico e o preenchimento do iOS */}
            <label htmlFor="code" className="sr-only">
              Código
            </label>
            <div className="relative">
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={CODE_LENGTH}
                required
                value={code}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                className="absolute inset-0 h-full w-full opacity-0"
              />
              <div className="pointer-events-none grid grid-cols-6 gap-2" aria-hidden="true">
                {Array.from({ length: CODE_LENGTH }, (_, i) => {
                  const current = focused && i === Math.min(code.length, CODE_LENGTH - 1)
                  return (
                    <div
                      key={i}
                      className={`flex h-16 items-center justify-center rounded-md border bg-surface font-display text-4xl font-bold ${
                        current ? 'border-ink ring-2 ring-lime' : code[i] ? 'border-ink' : 'border-line'
                      }`}
                    >
                      {code[i] ?? ''}
                    </div>
                  )
                })}
              </div>
            </div>
            <Button type="submit" disabled={busy || code.length < CODE_LENGTH}>
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
            <div className="flex justify-between pt-1">
              <TextButton type="button" onClick={() => setStep('email')}>
                Trocar e-mail
              </TextButton>
              <TextButton type="button" disabled={busy} onClick={() => handleEmail()}>
                Reenviar código
              </TextButton>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <Label className="mt-6 text-center text-muted">Seus dados ficam só com você</Label>
      </div>
    </main>
  )
}
