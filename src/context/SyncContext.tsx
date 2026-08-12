import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  PUSH_CONFIGURADO,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  SYNC_CONFIGURADO,
} from '../lib/sync/config'
import { definirGatilhoDeEnvio } from '../lib/sync/gatilho'
import { aplicarDoc, aplicarLinhas, enviarPendentes, sincronizarTudo } from '../lib/sync/motor'
import type { LinhaItem } from '../lib/sync/motor'
import { limparFila, totalPendente } from '../lib/sync/fila'
import { assinaturaAtual, ativarPush, desativarPush } from '../lib/sync/push'

/**
 * Conexão entre os dois celulares.
 *
 * O app inteiro continua funcionando sem isto: se não houver chaves no build,
 * `disponivel` é falso, nenhuma tela muda e tudo segue salvo só no aparelho.
 * A sincronização é uma camada por cima, nunca um pré-requisito.
 */

export type EstadoConexao = 'desligado' | 'deslogado' | 'sincronizando' | 'conectado' | 'erro'

interface SyncContextValue {
  disponivel: boolean
  estado: EstadoConexao
  erro: string | null
  email: string | null
  ultimaSync: string | null
  pendentes: number
  online: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
  sincronizarAgora: () => Promise<void>
  pushDisponivel: boolean
  pushAtivo: boolean
  ativarNotificacoes: () => Promise<void>
  desativarNotificacoes: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

const mensagemDoErro = (e: unknown) =>
  e instanceof Error ? e.message : 'Não deu para sincronizar agora.'

export function SyncProvider({ children }: { children: ReactNode }) {
  const cliente = useMemo<SupabaseClient | null>(() => {
    if (!SYNC_CONFIGURADO) return null
    return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }, [])

  const [casalId, setCasalId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoConexao>(SYNC_CONFIGURADO ? 'deslogado' : 'desligado')
  const [erro, setErro] = useState<string | null>(null)
  const [ultimaSync, setUltimaSync] = useState<string | null>(null)
  const [pendentes, setPendentes] = useState(0)
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [pushAtivo, setPushAtivo] = useState(false)

  /* ---------------- Sessão ---------------- */

  useEffect(() => {
    if (!cliente) return
    let vivo = true

    cliente.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setCasalId(data.session?.user.id ?? null)
      setEmail(data.session?.user.email ?? null)
      if (!data.session) setEstado('deslogado')
    })

    const { data: assinatura } = cliente.auth.onAuthStateChange((_evento, sessao) => {
      setCasalId(sessao?.user.id ?? null)
      setEmail(sessao?.user.email ?? null)
      if (!sessao) setEstado('deslogado')
    })

    return () => {
      vivo = false
      assinatura.subscription.unsubscribe()
    }
  }, [cliente])

  /* ---------------- Envio da fila ---------------- */

  const enviar = useCallback(async () => {
    if (!cliente || !casalId) return
    try {
      await enviarPendentes(cliente, casalId)
      setUltimaSync(new Date().toISOString())
      setErro(null)
    } catch (e) {
      // Sem internet a fila fica guardada e sobe na próxima chance — isso é
      // funcionamento normal, não erro para assustar o usuário.
      if (navigator.onLine) setErro(mensagemDoErro(e))
    } finally {
      setPendentes(totalPendente())
    }
  }, [cliente, casalId])

  // As telas avisam "mudou" a cada tecla; agrupar num respiro evita mandar uma
  // requisição por caractere digitado.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!cliente || !casalId) {
      definirGatilhoDeEnvio(null)
      return
    }

    definirGatilhoDeEnvio(() => {
      setPendentes(totalPendente())
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void enviar()
      }, 700)
    })

    return () => {
      definirGatilhoDeEnvio(null)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cliente, casalId, enviar])

  /* ---------------- Sincronização + tempo real ---------------- */

  const sincronizarAgora = useCallback(async () => {
    if (!cliente || !casalId) return
    setEstado('sincronizando')
    try {
      await sincronizarTudo(cliente, casalId)
      setUltimaSync(new Date().toISOString())
      setErro(null)
      setEstado('conectado')
    } catch (e) {
      setErro(mensagemDoErro(e))
      setEstado(navigator.onLine ? 'erro' : 'conectado')
    } finally {
      setPendentes(totalPendente())
    }
  }, [cliente, casalId])

  useEffect(() => {
    if (!cliente || !casalId) return
    void sincronizarAgora()

    const canal = cliente
      .channel(`cantinho-${casalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itens', filter: `casal_id=eq.${casalId}` },
        (payload) => {
          if (payload.new) aplicarLinhas([payload.new as LinhaItem])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estado', filter: `casal_id=eq.${casalId}` },
        (payload) => {
          if (payload.new) aplicarDoc(payload.new as Parameters<typeof aplicarDoc>[0])
        },
      )
      .subscribe()

    return () => {
      void cliente.removeChannel(canal)
    }
  }, [cliente, casalId, sincronizarAgora])

  /* ---------------- Conexão de rede ---------------- */

  useEffect(() => {
    const voltou = () => {
      setOnline(true)
      void enviar()
    }
    const caiu = () => setOnline(false)
    window.addEventListener('online', voltou)
    window.addEventListener('offline', caiu)
    return () => {
      window.removeEventListener('online', voltou)
      window.removeEventListener('offline', caiu)
    }
  }, [enviar])

  /* ---------------- Push ---------------- */

  useEffect(() => {
    if (!PUSH_CONFIGURADO) return
    void assinaturaAtual().then((a) => setPushAtivo(a !== null))
  }, [casalId])

  const ativarNotificacoes = useCallback(async () => {
    if (!cliente || !casalId) throw new Error('Entre na conta do casal primeiro.')
    await ativarPush(cliente, casalId)
    setPushAtivo(true)
  }, [cliente, casalId])

  const desativarNotificacoes = useCallback(async () => {
    if (!cliente || !casalId) return
    await desativarPush(cliente, casalId)
    setPushAtivo(false)
  }, [cliente, casalId])

  /* ---------------- Entrar e sair ---------------- */

  const entrar = useCallback(
    async (novoEmail: string, senha: string) => {
      if (!cliente) throw new Error('Sincronização não configurada neste build.')
      setErro(null)
      const { error } = await cliente.auth.signInWithPassword({
        email: novoEmail.trim(),
        password: senha,
      })
      if (error) throw new Error('E-mail ou senha do casal não confere.')
    },
    [cliente],
  )

  const sair = useCallback(async () => {
    if (!cliente) return
    await cliente.auth.signOut()
    // A fila é do vínculo com aquela conta; o que está salvo no aparelho fica
    // onde está — sair da sincronização não apaga os dados de ninguém.
    limparFila()
    setPendentes(0)
    setUltimaSync(null)
    setPushAtivo(false)
    setEstado('deslogado')
  }, [cliente])

  return (
    <SyncContext.Provider
      value={{
        disponivel: SYNC_CONFIGURADO,
        estado,
        erro,
        email,
        ultimaSync,
        pendentes,
        online,
        entrar,
        sair,
        sincronizarAgora,
        pushDisponivel: PUSH_CONFIGURADO,
        pushAtivo,
        ativarNotificacoes,
        desativarNotificacoes,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync precisa estar dentro de SyncProvider')
  return ctx
}
