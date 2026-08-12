import type { PersonKey } from '../../context/ProfileContext'

/**
 * Cada área do app vira uma coleção de itens sincronizáveis.
 *
 * A sincronização é feita **item a item**, não pelo bloco inteiro. Isso não é
 * detalhe: se cada celular mandasse o array completo de recadinhos, o último a
 * salvar apagaria o que o outro tinha escrito. Trocando item por item, os dois
 * podem escrever ao mesmo tempo que nada se perde.
 */

export type Area = 'mensagens' | 'tarefas' | 'financas' | 'lazer' | 'humor'

export const AREAS: Area[] = ['mensagens', 'tarefas', 'financas', 'lazer', 'humor']

export interface ItemSync {
  id: string
  conteudo: unknown
}

export interface Adaptador {
  /** Chave correspondente no localStorage. */
  chave: string
  /** Valor vazio, usado quando ainda não há nada salvo. */
  vazio: unknown
  /** Quebra o valor guardado numa lista de itens com id. */
  paraItens(valor: unknown): ItemSync[]
  /** Remonta o valor guardado a partir dos itens. */
  deItens(itens: ItemSync[]): unknown
}

interface ComId {
  id: string
}

/**
 * Adaptador das áreas que já são listas de objetos com `id`.
 *
 * A ordenação precisa ser determinística e igual nos dois celulares — se cada
 * um ordenasse do seu jeito, a mesma lista apareceria embaralhada em cada tela.
 * Por isso todo critério termina desempatando pelo id.
 */
function listaDeObjetos<T extends ComId>(
  chave: string,
  ordenar: (a: T, b: T) => number,
): Adaptador {
  return {
    chave,
    vazio: [] as T[],
    paraItens: (valor) =>
      ((valor as T[] | null) ?? []).map((item) => ({ id: item.id, conteudo: item })),
    deItens: (itens) =>
      itens
        .map((i) => i.conteudo as T)
        .sort((a, b) => ordenar(a, b) || a.id.localeCompare(b.id)),
  }
}

interface ComCriadoEm extends ComId {
  createdAt: string
}

const maisNovoPrimeiro = (a: ComCriadoEm, b: ComCriadoEm) => b.createdAt.localeCompare(a.createdAt)
const maisAntigoPrimeiro = (a: ComCriadoEm, b: ComCriadoEm) => a.createdAt.localeCompare(b.createdAt)

/**
 * O humor não é uma lista, é um mapa dia → pessoa → humor. Achatamos em itens
 * "dia|pessoa" para que cada um dos dois possa marcar o humor do mesmo dia sem
 * sobrescrever o do outro.
 */
type RegistroDeHumor = Record<string, Partial<Record<PersonKey, string>>>

const adaptadorDeHumor: Adaptador = {
  chave: 'casal:humor',
  vazio: {} as RegistroDeHumor,
  paraItens: (valor) => {
    const registro = (valor as RegistroDeHumor | null) ?? {}
    const itens: ItemSync[] = []
    for (const [dia, doDia] of Object.entries(registro)) {
      for (const [pessoa, humor] of Object.entries(doDia)) {
        if (humor) itens.push({ id: `${dia}|${pessoa}`, conteudo: { dia, pessoa, humor } })
      }
    }
    return itens
  },
  deItens: (itens) => {
    const registro: RegistroDeHumor = {}
    for (const item of itens) {
      const { dia, pessoa, humor } = item.conteudo as {
        dia: string
        pessoa: PersonKey
        humor: string
      }
      if (!dia || !pessoa) continue
      registro[dia] = { ...(registro[dia] ?? {}), [pessoa]: humor }
    }
    return registro
  },
}

export const ADAPTADORES: Record<Area, Adaptador> = {
  mensagens: listaDeObjetos<ComCriadoEm>('casal:mensagens', maisNovoPrimeiro),
  tarefas: listaDeObjetos<ComCriadoEm>('casal:tarefas', maisAntigoPrimeiro),
  // Lançamentos não têm createdAt, só a data escolhida no formulário.
  financas: listaDeObjetos<ComId & { date: string }>('casal:financas', (a, b) =>
    b.date.localeCompare(a.date),
  ),
  lazer: listaDeObjetos<ComCriadoEm>('casal:lazer', maisNovoPrimeiro),
  humor: adaptadorDeHumor,
}

/** Descobre a área a partir da chave do localStorage. */
export function areaDaChave(chave: string): Area | undefined {
  return AREAS.find((area) => ADAPTADORES[area].chave === chave)
}
