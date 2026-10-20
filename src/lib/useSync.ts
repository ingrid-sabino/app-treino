import { useEffect } from 'react'
import { LOCAL_WRITE_EVENT } from './db'
import { supabase, supabaseConfigured } from './supabase'
import { runSync } from './sync'

const AFTER_WRITE_MS = 2000

// Sincroniza ao entrar, quando a rede volta, quando o app volta para a frente
// e logo depois de cada escrita local. Sem rede, tenta de novo no próximo gatilho.
export function useSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !supabaseConfigured) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = () => {
      if (!navigator.onLine) return
      runSync(supabase, userId).catch((err) => console.warn('Sincronização falhou; tenta de novo depois.', err))
    }
    const soon = () => {
      clearTimeout(timer)
      timer = setTimeout(sync, AFTER_WRITE_MS)
    }
    const onVisible = () => document.visibilityState === 'visible' && sync()

    sync()
    window.addEventListener('online', sync)
    window.addEventListener(LOCAL_WRITE_EVENT, soon)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', sync)
      window.removeEventListener(LOCAL_WRITE_EVENT, soon)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])
}
