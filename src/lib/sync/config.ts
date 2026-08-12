export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim()
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()

/** Dá para sincronizar? Sem as chaves o app segue 100% local, como antes. */
export const SYNC_CONFIGURADO = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Dá para pedir notificação push neste build e neste navegador? */
export const PUSH_CONFIGURADO =
  SYNC_CONFIGURADO &&
  Boolean(VAPID_PUBLIC_KEY) &&
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

/** Chave do localStorage com o id fixo deste aparelho. */
const CHAVE_DISPOSITIVO = 'casal:dispositivo'

/**
 * Identidade deste celular. Serve para o servidor não mandar notificação de
 * volta para quem acabou de escrever — senão você seria avisado do próprio
 * recadinho.
 */
export function idDoDispositivo(): string {
  try {
    const salvo = window.localStorage.getItem(CHAVE_DISPOSITIVO)
    if (salvo) return salvo
    const novo =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(CHAVE_DISPOSITIVO, novo)
    return novo
  } catch {
    return 'sem-armazenamento'
  }
}
