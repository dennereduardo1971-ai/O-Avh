import type { SupabaseClient } from '@supabase/supabase-js'
import { definirValorGlobal, valorAtual } from '../storage'
import { EMPTY_COUNTS, type GameCounts } from '../achievements'
import { ADAPTADORES, AREAS, type Area, type ItemSync } from './areas'
import {
  chaveDaOperacao,
  confirmarDoc,
  confirmarItens,
  enfileirarDoc,
  enfileirarItens,
  lerFilaDocs,
  lerFilaItens,
  type Documento,
  type OperacaoItem,
} from './fila'
import { idDoDispositivo } from './config'

export interface LinhaItem {
  area: Area
  item_id: string
  conteudo: unknown
  atualizado_em: string
  removido: boolean
}

interface LinhaDoc {
  chave: Documento
  conteudo: unknown
  atualizado_em: string
}

/* ------------------------------------------------------------------ */
/* Comparar o antes e o depois de uma tela                            */
/* ------------------------------------------------------------------ */

const mesmoConteudo = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Descobre o que mudou numa área para mandar só isso — e não a lista inteira.
 */
export function diferencaDeItens(area: Area, antes: unknown, depois: unknown): OperacaoItem[] {
  const adaptador = ADAPTADORES[area]
  const mapaAntes = new Map(adaptador.paraItens(antes).map((i) => [i.id, i.conteudo]))
  const ts = new Date().toISOString()
  const operacoes: OperacaoItem[] = []

  for (const item of adaptador.paraItens(depois)) {
    const anterior = mapaAntes.get(item.id)
    if (anterior === undefined || !mesmoConteudo(anterior, item.conteudo)) {
      operacoes.push({ area, itemId: item.id, conteudo: item.conteudo, removido: false, ts })
    }
    mapaAntes.delete(item.id)
  }

  // O que sobrou no mapa sumiu da tela: vira uma lápide, não um "delete".
  // A lápide precisa existir no servidor, senão o outro celular reenviaria o
  // item apagado na próxima sincronização e ele voltaria do além.
  for (const id of mapaAntes.keys()) {
    operacoes.push({ area, itemId: id, conteudo: null, removido: true, ts })
  }

  return operacoes
}

/* ------------------------------------------------------------------ */
/* Aplicar o que veio do outro celular                                 */
/* ------------------------------------------------------------------ */

/**
 * Mescla linhas vindas do servidor no que está salvo aqui.
 * O que está na fila de saída e é mais recente sempre vence — é o que impede
 * uma sincronização de apagar o que você acabou de escrever.
 */
export function aplicarLinhas(linhas: LinhaItem[]) {
  const porArea = new Map<Area, LinhaItem[]>()
  for (const linha of linhas) {
    if (!ADAPTADORES[linha.area]) continue
    const lista = porArea.get(linha.area) ?? []
    lista.push(linha)
    porArea.set(linha.area, lista)
  }

  const fila = lerFilaItens()

  for (const [area, doArea] of porArea) {
    const adaptador = ADAPTADORES[area]
    const atual = valorAtual(adaptador.chave, adaptador.vazio)
    const mapa = new Map(adaptador.paraItens(atual).map((i) => [i.id, i.conteudo]))

    for (const linha of doArea) {
      const pendente = fila[chaveDaOperacao(area, linha.item_id)]
      if (pendente && pendente.ts > linha.atualizado_em) continue
      if (linha.removido) mapa.delete(linha.item_id)
      else mapa.set(linha.item_id, linha.conteudo)
    }

    const itens: ItemSync[] = Array.from(mapa, ([id, conteudo]) => ({ id, conteudo }))
    const novo = adaptador.deItens(itens)
    if (!mesmoConteudo(atual, novo)) definirValorGlobal(adaptador.chave, novo)
  }
}

/* ------------------------------------------------------------------ */
/* Estado de jogo e perfil                                             */
/* ------------------------------------------------------------------ */

interface EstadoDeJogo {
  xp: number
  counts: GameCounts
  achievements: string[]
  lastActiveDate: string
  streak: number
}

/**
 * Junta o XP dos dois aparelhos sem nunca regredir.
 *
 * Aqui não dá para usar "o mais recente vence": se a Sara ganhasse XP no
 * celular dela enquanto você ganha no seu, a última gravação zeraria o
 * progresso da outra. Como todos esses números só crescem, ficar com o maior
 * de cada um converge e nunca tira nada de ninguém.
 */
function mesclarJogo(local: EstadoDeJogo, remoto: EstadoDeJogo): EstadoDeJogo {
  const counts = { ...EMPTY_COUNTS }
  for (const chave of Object.keys(EMPTY_COUNTS) as (keyof GameCounts)[]) {
    counts[chave] = Math.max(local.counts?.[chave] ?? 0, remoto.counts?.[chave] ?? 0)
  }
  return {
    xp: Math.max(local.xp ?? 0, remoto.xp ?? 0),
    counts,
    achievements: Array.from(new Set([...(local.achievements ?? []), ...(remoto.achievements ?? [])])),
    streak: Math.max(local.streak ?? 0, remoto.streak ?? 0),
    lastActiveDate:
      (local.lastActiveDate ?? '') > (remoto.lastActiveDate ?? '')
        ? local.lastActiveDate
        : remoto.lastActiveDate,
  }
}

export const CHAVE_DOC: Record<Documento, string> = {
  jogo: 'casal:game',
  perfil: 'casal:perfil',
}

/**
 * Mescla um documento. O perfil é o único caso em que "o mais recente vence"
 * está certo — e sincroniza só os nomes: quem está usando o app agora é
 * informação de cada aparelho, não do casal.
 */
function mesclarDoc(
  documento: Documento,
  local: unknown,
  remoto: unknown,
  remotoEhMaisNovo: boolean,
): unknown {
  if (documento === 'jogo') {
    return mesclarJogo(local as EstadoDeJogo, remoto as EstadoDeJogo)
  }
  const l = local as { names?: unknown; active?: unknown }
  const r = remoto as { names?: unknown }
  return remotoEhMaisNovo && r?.names ? { ...l, names: r.names } : l
}

/**
 * O que de fato vai para o servidor.
 *
 * No perfil, manda só os nomes: `active` é "quem está com o celular na mão
 * agora", e isso é diferente em cada aparelho. Sincronizar esse campo faria o
 * app trocar de pessoa sozinho no celular do outro.
 */
export function conteudoParaEnvio(documento: Documento, valor: unknown): unknown {
  if (documento !== 'perfil') return valor
  return { names: (valor as { names?: unknown })?.names }
}

/* ------------------------------------------------------------------ */
/* Sincronização completa                                              */
/* ------------------------------------------------------------------ */

/** Sobe tudo que está na fila. Devolve quantas operações subiram. */
export async function enviarPendentes(sb: SupabaseClient, casalId: string): Promise<number> {
  const dispositivo = idDoDispositivo()
  let enviadas = 0

  const fila = Object.values(lerFilaItens())
  if (fila.length > 0) {
    const { error } = await sb.from('itens').upsert(
      fila.map((op) => ({
        casal_id: casalId,
        area: op.area,
        item_id: op.itemId,
        conteudo: op.conteudo,
        removido: op.removido,
        atualizado_em: op.ts,
        dispositivo,
        silencioso: op.silencioso ?? false,
      })),
      { onConflict: 'casal_id,area,item_id' },
    )
    if (error) throw error
    confirmarItens(fila)
    enviadas += fila.length
  }

  for (const [documento, operacao] of Object.entries(lerFilaDocs())) {
    if (!operacao) continue
    const { error } = await sb.from('estado').upsert(
      {
        casal_id: casalId,
        chave: documento,
        conteudo: operacao.conteudo,
        atualizado_em: operacao.ts,
        dispositivo,
      },
      { onConflict: 'casal_id,chave' },
    )
    if (error) throw error
    confirmarDoc(documento as Documento, operacao.ts)
    enviadas += 1
  }

  return enviadas
}

/**
 * Sincronização completa: baixa tudo, mescla, e sobe o que faltava.
 * Roda ao entrar e sempre que a conexão volta.
 */
export async function sincronizarTudo(sb: SupabaseClient, casalId: string) {
  const { data: linhas, error } = await sb
    .from('itens')
    .select('area, item_id, conteudo, atualizado_em, removido')
    .eq('casal_id', casalId)
  if (error) throw error

  const remotas = (linhas ?? []) as LinhaItem[]
  aplicarLinhas(remotas)

  // Tudo que só existe aqui (dados de antes do sync, ou criados offline)
  // entra na fila para subir.
  const conhecidas = new Set(remotas.map((l) => `${l.area}|${l.item_id}`))
  const ts = new Date().toISOString()
  const novas: OperacaoItem[] = []
  for (const area of AREAS) {
    const adaptador = ADAPTADORES[area]
    for (const item of adaptador.paraItens(valorAtual(adaptador.chave, adaptador.vazio))) {
      if (!conhecidas.has(`${area}|${item.id}`)) {
        // Histórico que já existia aqui antes da sincronização: sobe calado.
        novas.push({
          area,
          itemId: item.id,
          conteudo: item.conteudo,
          removido: false,
          ts,
          silencioso: true,
        })
      }
    }
  }
  enfileirarItens(novas)

  // ---- Documentos (jogo e perfil) ----
  const { data: docs, error: erroDocs } = await sb
    .from('estado')
    .select('chave, conteudo, atualizado_em')
    .eq('casal_id', casalId)
  if (erroDocs) throw erroDocs

  const filaDocs = lerFilaDocs()
  for (const documento of ['jogo', 'perfil'] as Documento[]) {
    const chaveLocal = CHAVE_DOC[documento]
    const local = valorAtual<unknown>(chaveLocal, null)
    if (local === null) continue

    const remoto = ((docs ?? []) as LinhaDoc[]).find((d) => d.chave === documento)
    const pendente = filaDocs[documento]
    const remotoEhMaisNovo =
      !!remoto && (!pendente || pendente.ts <= remoto.atualizado_em)

    const mesclado = remoto
      ? mesclarDoc(documento, local, remoto.conteudo, remotoEhMaisNovo)
      : local

    if (!mesmoConteudo(local, mesclado)) definirValorGlobal(chaveLocal, mesclado)
    // Sobe se o servidor não tem, ou se a mescla gerou algo diferente do que
    // ele tem (caso típico: XP que só existia aqui). A comparação usa o mesmo
    // recorte que seria enviado, senão o perfil pareceria sempre diferente.
    const aEnviar = conteudoParaEnvio(documento, mesclado)
    if (!remoto || !mesmoConteudo(remoto.conteudo, aEnviar)) {
      enfileirarDoc(documento, aEnviar)
    }
  }

  await enviarPendentes(sb, casalId)
}

/** Aplica um documento que chegou pelo tempo real. */
export function aplicarDoc(linha: LinhaDoc) {
  const chaveLocal = CHAVE_DOC[linha.chave]
  if (!chaveLocal) return
  const local = valorAtual<unknown>(chaveLocal, null)
  if (local === null) return

  const pendente = lerFilaDocs()[linha.chave]
  const remotoEhMaisNovo = !pendente || pendente.ts <= linha.atualizado_em
  const mesclado = mesclarDoc(linha.chave, local, linha.conteudo, remotoEhMaisNovo)
  if (!mesmoConteudo(local, mesclado)) definirValorGlobal(chaveLocal, mesclado)
}
