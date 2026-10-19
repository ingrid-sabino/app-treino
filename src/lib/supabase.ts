import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Sem as variáveis o app abre, mas a tela de login avisa o que falta.
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'anon-key-ausente',
  {
    auth: {
      persistSession: true, // a sessão fica no aparelho: abre logado mesmo offline
      autoRefreshToken: true,
      detectSessionInUrl: true, // aceita o magic link quando aberto no navegador
    },
  },
)
