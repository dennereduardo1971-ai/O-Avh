import { useEffect, useState } from 'react'

/**
 * Hook simples de persistência em localStorage.
 * Tudo do app fica salvo só no navegador de quem está usando —
 * nenhum dado sai daqui, é só nosso.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage indisponível (modo privado, cota cheia etc.) — ignora.
    }
  }, [key, value])

  return [value, setValue] as const
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
