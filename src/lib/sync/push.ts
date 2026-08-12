import type { SupabaseClient } from '@supabase/supabase-js'
import { VAPID_PUBLIC_KEY, idDoDispositivo } from './config'

/**
 * Notificações push.
 *
 * Detalhe que decide tudo no iPhone: só funciona com o app instalado na tela
 * de início. No Safari em aba o `Notification` nem existe, e é por isso que a
 * tela de Ajustes manda instalar antes de oferecer o botão.
 */

/** A chave VAPID vem em base64 "de URL"; o navegador quer bytes crus. */
function chaveParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const normal = preenchido.replace(/-/g, '+').replace(/_/g, '/')
  const bruto = window.atob(normal)
  // O buffer é criado explicitamente para o tipo ficar `Uint8Array<ArrayBuffer>`:
  // `applicationServerKey` não aceita o genérico aberto, que permitiria um
  // SharedArrayBuffer.
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length))
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

export type PermissaoPush = 'default' | 'granted' | 'denied' | 'indisponivel'

export function permissaoAtual(): PermissaoPush {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'indisponivel'
  return Notification.permission as PermissaoPush
}

/** Este aparelho já está inscrito para receber push? */
export async function assinaturaAtual(): Promise<PushSubscription | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const registro = await navigator.serviceWorker.ready
    return await registro.pushManager.getSubscription()
  } catch {
    return null
  }
}

/**
 * Pede permissão, assina e guarda a assinatura no servidor.
 * Precisa ser chamada a partir de um clique — os navegadores recusam pedidos
 * de permissão que não vêm de um gesto do usuário.
 */
export async function ativarPush(sb: SupabaseClient, casalId: string): Promise<void> {
  if (!VAPID_PUBLIC_KEY) throw new Error('Este build não tem a chave de notificações configurada.')
  if (!('Notification' in window)) {
    throw new Error('Este navegador não envia notificações. No iPhone, instale o app primeiro.')
  }

  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') {
    throw new Error('Permissão negada. Dá para liberar de novo nos ajustes do navegador.')
  }

  const registro = await navigator.serviceWorker.ready
  const assinatura =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      // Obrigatório no Chrome: todo push precisa virar um aviso visível.
      userVisibleOnly: true,
      applicationServerKey: chaveParaBytes(VAPID_PUBLIC_KEY),
    }))

  const { error } = await sb.from('dispositivos').upsert(
    {
      casal_id: casalId,
      dispositivo: idDoDispositivo(),
      assinatura: assinatura.toJSON(),
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'casal_id,dispositivo' },
  )
  if (error) throw error
}

/** Desliga as notificações neste aparelho (não mexe no outro). */
export async function desativarPush(sb: SupabaseClient, casalId: string): Promise<void> {
  const assinatura = await assinaturaAtual()
  if (assinatura) await assinatura.unsubscribe()
  await sb
    .from('dispositivos')
    .delete()
    .eq('casal_id', casalId)
    .eq('dispositivo', idDoDispositivo())
}
