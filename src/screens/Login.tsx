import { useState, type FormEvent } from 'react'
import { Button, Input, TextButton } from '../components/ui'
import { sendLoginEmail, verifyLoginCode } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

export default function Login() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
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
    <main className="flex min-h-dvh flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))]">
      <img src="/pwa-192x192.png" alt="" className="h-16 w-16 rounded-2xl" />
      <h1 className="mt-6 text-6xl uppercase leading-none">Tônus</h1>
      <p className="mt-3 text-muted">Seu treino de hoje, sempre pronto.</p>

      {!supabaseConfigured && (
        <p className="mt-6 rounded-2xl bg-lilac-soft p-4 text-sm text-lilac-ink">
          Supabase não configurado: faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de
          ambiente.
        </p>
      )}

      <div className="mt-auto pt-10">
        {step === 'email' ? (
          <form onSubmit={handleEmail} className="space-y-3">
            <label htmlFor="email" className="block text-sm font-medium">
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
            <p className="text-sm text-muted">
              Enviamos um código para <strong className="text-ink">{email}</strong>. Digite aqui. Se
              estiver no computador, também pode tocar no link do e-mail.
            </p>
            <label htmlFor="code" className="block text-sm font-medium">
              Código
            </label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              maxLength={10}
              required
              placeholder="000000"
              className="text-center font-display text-3xl tracking-[0.4em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" disabled={busy || code.length < 6}>
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
            <div className="flex justify-between pt-1">
              <TextButton type="button" onClick={() => setStep('email')}>
                Trocar e-mail
              </TextButton>
              <TextButton type="button" disabled={busy} onClick={handleEmail}>
                Reenviar código
              </TextButton>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
