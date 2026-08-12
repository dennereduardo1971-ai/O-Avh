import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useLocalStorage } from '../lib/storage'
import { levelInfo, todayISO, yesterdayISO } from '../lib/gameMath'
import { ACHIEVEMENTS, EMPTY_COUNTS, type GameCounts } from '../lib/achievements'
import { useToast } from './ToastContext'
import { confettiBurst } from '../lib/confetti'

interface GameState {
  xp: number
  counts: GameCounts
  achievements: string[]
  lastActiveDate: string
  streak: number
}

const DEFAULT_STATE: GameState = {
  xp: 0,
  counts: EMPTY_COUNTS,
  achievements: [],
  lastActiveDate: '',
  streak: 0,
}

export interface GameEvent {
  xp: number
  xpLabel: string
  xpIcon?: string
  countKey?: keyof GameCounts
  countDelta?: number
}

interface GameContextValue {
  xp: number
  level: number
  xpIntoLevel: number
  xpForNext: number
  progress: number
  streak: number
  counts: GameCounts
  achievements: string[]
  trigger: (event: GameEvent) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<GameState>('casal:game', DEFAULT_STATE)
  const toast = useToast()
  // Estes dois refs precisam já nascer preenchidos com o que veio do
  // localStorage. Se fossem semeados num useEffect, o efeito que anuncia
  // conquistas rodaria antes (ordem de declaração) e o app comemoraria de
  // novo, com confete, tudo o que o casal já tinha ganhado — a cada abertura.
  const notifiedAchievements = useRef<Set<string> | null>(null)
  if (notifiedAchievements.current === null) {
    notifiedAchievements.current = new Set(state.achievements)
  }
  const notified = notifiedAchievements.current

  const notifiedLevel = useRef<number | null>(null)
  if (notifiedLevel.current === null) {
    notifiedLevel.current = levelInfo(state.xp).level
  }

  // Atualiza a sequência de dias seguidos usando o app (streak).
  useEffect(() => {
    const today = todayISO()
    setState((prev) => {
      if (prev.lastActiveDate === today) return prev
      const wasYesterday = prev.lastActiveDate === yesterdayISO()
      return { ...prev, lastActiveDate: today, streak: wasYesterday ? prev.streak + 1 : 1 }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const info = useMemo(() => levelInfo(state.xp), [state.xp])

  // Saves de versões anteriores não têm os contadores mais novos. Preencher
  // com zero aqui evita `undefined + 1 === NaN` ao incrementar.
  const counts = useMemo<GameCounts>(() => ({ ...EMPTY_COUNTS, ...state.counts }), [state.counts])

  // Detecta level up e conquistas novas de forma reativa (evita duplicar
  // efeitos colaterais em cliques concorrentes).
  useEffect(() => {
    if (notifiedLevel.current !== null && info.level > notifiedLevel.current) {
      notifiedLevel.current = info.level
      toast.push({ kind: 'levelup', title: `Subiram para o nível ${info.level}! 🎉`, icon: '⭐' })
      confettiBurst()
    }

    const novas = ACHIEVEMENTS.filter(
      (a) => !notified.has(a.id) && a.check(counts, info.level, state.streak),
    )
    if (novas.length === 0) return

    novas.forEach((a) => notified.add(a.id))
    setState((prev) => ({
      ...prev,
      achievements: Array.from(new Set([...prev.achievements, ...novas.map((a) => a.id)])),
    }))
    novas.forEach((a) => {
      toast.push({ kind: 'achievement', title: 'Conquista desbloqueada!', subtitle: a.title, icon: a.icon })
    })
    confettiBurst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, state.streak, info.level])

  const trigger = (event: GameEvent) => {
    setState((prev) => {
      const next = { ...EMPTY_COUNTS, ...prev.counts }
      if (event.countKey) {
        next[event.countKey] = Math.max(0, next[event.countKey] + (event.countDelta ?? 1))
      }
      return { ...prev, xp: Math.max(0, prev.xp + event.xp), counts: next }
    })
    if (event.xp > 0) {
      toast.push({ kind: 'xp', title: `+${event.xp} XP`, subtitle: event.xpLabel, icon: event.xpIcon ?? '✨' })
    }
  }

  return (
    <GameContext.Provider
      value={{
        xp: state.xp,
        level: info.level,
        xpIntoLevel: info.xpIntoLevel,
        xpForNext: info.xpForNext,
        progress: info.progress,
        streak: state.streak,
        counts,
        achievements: state.achievements,
        trigger,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame precisa estar dentro de GameProvider')
  return ctx
}
