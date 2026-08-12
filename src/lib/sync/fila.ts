import type { Area } from './areas'

/**
 * Fila de saída ("o que este celular ainda precisa mandar").
 *
 * Ela resolve dois problemas de uma vez:
 *
 *  1. **Sem internet o app continua funcionando.** O que você escreveu no
 *     ônibus fica aqui e sobe sozinho quando a conexão volta.
 *  2. **Decide quem ganha num conflito.** Cada operação guarda a hora em que
 *     foi feita; quando chega uma versão do outro celular, só sobrescreve o que
 *     está aqui se for mais recente. Sem isso, uma sincronização que chegasse
 *     no meio do caminho desfaria o que você acabou de digitar.
 *
 * A hora é a do relógio do próprio celular (e não a do servidor) de propósito:
 * assim os dois lados da comparação vêm de relógios de celular, que é o que
 * torna a comparação justa.
 */

const CHAVE_ITENS = 'casal:fila'
const CHAVE_DOCS = 'casal:fila-docs'

export type Documento = 'jogo' | 'perfil'

export interface OperacaoItem {
  area: Area
  itemId: string
  /** `null` quando o item foi apagado. */
  conteudo: unknown
  removido: boolean
  ts: string
  /**
   * Sobe sem avisar o outro celular.
   *
   * É o caso da primeira sincronização, que manda todo o histórico que já
   * existia no aparelho de uma vez só. Sem esta marca, conectar pela primeira
   * vez faria o celular da Sara apitar uma vez por recadinho antigo.
   */
  silencioso?: boolean
}

export interface OperacaoDoc {
  conteudo: unknown
  ts: string
}

type FilaItens = Record<string, OperacaoItem>
type FilaDocs = Partial<Record<Documento, OperacaoDoc>>

export const chaveDaOperacao = (area: Area, itemId: string) => `${area}|${itemId}`

function ler<T>(chave: string, vazio: T): T {
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : vazio
  } catch {
    return vazio
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Sem espaço ou sem permissão: perde-se a fila, não os dados locais.
  }
}

export const lerFilaItens = (): FilaItens => ler<FilaItens>(CHAVE_ITENS, {})
export const lerFilaDocs = (): FilaDocs => ler<FilaDocs>(CHAVE_DOCS, {})

export function enfileirarItens(operacoes: OperacaoItem[]) {
  if (operacoes.length === 0) return
  const fila = lerFilaItens()
  for (const op of operacoes) fila[chaveDaOperacao(op.area, op.itemId)] = op
  gravar(CHAVE_ITENS, fila)
}

export function enfileirarDoc(documento: Documento, conteudo: unknown) {
  const fila = lerFilaDocs()
  fila[documento] = { conteudo, ts: new Date().toISOString() }
  gravar(CHAVE_DOCS, fila)
}

/**
 * Tira da fila o que já subiu — mas só se ninguém mexeu no item nesse meio
 * tempo. Comparar o `ts` evita a corrida em que o envio termina depois de você
 * ter editado de novo e a edição nova some.
 */
export function confirmarItens(enviadas: OperacaoItem[]) {
  if (enviadas.length === 0) return
  const fila = lerFilaItens()
  for (const op of enviadas) {
    const chave = chaveDaOperacao(op.area, op.itemId)
    if (fila[chave]?.ts === op.ts) delete fila[chave]
  }
  gravar(CHAVE_ITENS, fila)
}

export function confirmarDoc(documento: Documento, ts: string) {
  const fila = lerFilaDocs()
  if (fila[documento]?.ts === ts) {
    delete fila[documento]
    gravar(CHAVE_DOCS, fila)
  }
}

export function totalPendente(): number {
  return Object.keys(lerFilaItens()).length + Object.keys(lerFilaDocs()).length
}

export function limparFila() {
  gravar(CHAVE_ITENS, {})
  gravar(CHAVE_DOCS, {})
}
