import { useCallback, useRef } from 'react'
import { useLocalStorage, valorAtual } from '../storage'
import { ADAPTADORES, type Area } from './areas'
import { CHAVE_DOC, conteudoParaEnvio, diferencaDeItens } from './motor'
import { enfileirarDoc, enfileirarItens, type Documento } from './fila'
import { SYNC_CONFIGURADO } from './config'
import { pedirEnvio } from './gatilho'

/**
 * Igual ao `useLocalStorage`, mas o que você grava também vai para o outro
 * celular. Substitui o hook antigo nas telas que os dois compartilham.
 *
 * A tela não muda em nada: continua recebendo `[valor, definir]`.
 */
export function useSyncedArea<T>(area: Area, inicial: T) {
  const chave = ADAPTADORES[area].chave
  const inicialRef = useRef(inicial)
  const [valor, definirBruto] = useLocalStorage<T>(chave, inicial)

  const definir = useCallback(
    (acao: T | ((anterior: T) => T)) => {
      // Lê o valor do armazenamento em vez de fechar sobre o `valor` do render:
      // duas gravações no mesmo clique (comum ao concluir uma missão) enxergam
      // uma à outra e nenhuma sobrescreve a anterior.
      const anterior = valorAtual<T>(chave, inicialRef.current)
      const proximo = typeof acao === 'function' ? (acao as (a: T) => T)(anterior) : acao
      definirBruto(proximo)

      if (SYNC_CONFIGURADO) {
        enfileirarItens(diferencaDeItens(area, anterior, proximo))
        pedirEnvio()
      }
    },
    [area, chave, definirBruto],
  )

  return [valor, definir] as const
}

/**
 * Para o que é um bloco só e não uma lista: o estado de jogo e os nomes do
 * casal.
 */
export function useSyncedDoc<T>(documento: Documento, inicial: T) {
  const chave = CHAVE_DOC[documento]
  const inicialRef = useRef(inicial)
  const [valor, definirBruto] = useLocalStorage<T>(chave, inicial)

  const definir = useCallback(
    (acao: T | ((anterior: T) => T)) => {
      const anterior = valorAtual<T>(chave, inicialRef.current)
      const proximo = typeof acao === 'function' ? (acao as (a: T) => T)(anterior) : acao
      definirBruto(proximo)

      if (SYNC_CONFIGURADO) {
        enfileirarDoc(documento, conteudoParaEnvio(documento, proximo))
        pedirEnvio()
      }
    },
    [chave, documento, definirBruto],
  )

  return [valor, definir] as const
}
