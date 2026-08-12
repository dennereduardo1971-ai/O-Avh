import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Persistência em localStorage com estado compartilhado.
 *
 * Antes cada `useLocalStorage` guardava a própria cópia do valor: dois
 * componentes lendo a mesma chave não se falavam (o Painel só via o recadinho
 * novo depois de trocar de rota). Agora existe um único valor por chave em
 * memória e todo mundo que usa aquela chave é avisado quando ele muda.
 *
 * Isso também é o que permite a sincronização entre os celulares empurrar
 * dados que chegaram do outro aparelho direto para dentro das telas, via
 * `definirValorGlobal`, sem que as telas precisem saber que sync existe.
 */

const memoria = new Map<string, unknown>()
const ouvintes = new Map<string, Set<(valor: unknown) => void>>()

function lerDoDisco<T>(chave: string, inicial: T): T {
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : inicial
  } catch {
    return inicial
  }
}

function gravarNoDisco(chave: string, valor: unknown) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // localStorage indisponível (modo privado, cota cheia etc.) — ignora.
  }
}

/** Valor atual da chave, lendo do disco na primeira vez. */
export function valorAtual<T>(chave: string, inicial: T): T {
  if (memoria.has(chave)) return memoria.get(chave) as T
  const valor = lerDoDisco(chave, inicial)
  memoria.set(chave, valor)
  return valor
}

/**
 * Troca o valor da chave e avisa todo mundo — inclusive as telas já montadas.
 * A sincronização usa isto ao receber dados do outro celular.
 */
export function definirValorGlobal<T>(chave: string, valor: T) {
  memoria.set(chave, valor)
  gravarNoDisco(chave, valor)
  ouvintes.get(chave)?.forEach((ouvinte) => ouvinte(valor))
}

export function useLocalStorage<T>(chave: string, inicial: T) {
  const inicialRef = useRef(inicial)
  const [valor, setValor] = useState<T>(() => valorAtual(chave, inicialRef.current))

  useEffect(() => {
    setValor(valorAtual(chave, inicialRef.current))

    const ouvinte = (novo: unknown) => setValor(novo as T)
    const conjunto = ouvintes.get(chave) ?? new Set()
    conjunto.add(ouvinte)
    ouvintes.set(chave, conjunto)

    return () => {
      conjunto.delete(ouvinte)
      if (conjunto.size === 0) ouvintes.delete(chave)
    }
  }, [chave])

  const definir = useCallback(
    (acao: T | ((anterior: T) => T)) => {
      const anterior = valorAtual(chave, inicialRef.current)
      const proximo = typeof acao === 'function' ? (acao as (a: T) => T)(anterior) : acao
      definirValorGlobal(chave, proximo)
    },
    [chave],
  )

  return [valor, definir] as const
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
