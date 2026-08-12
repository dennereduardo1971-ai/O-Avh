import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useLocalStorage } from '../lib/storage'
import { levelInfo, todayISO, yesterdayISO } from '../lib/gameMath'
import { ACHIEVEMENTS, type GameCounts } from '../lib/achievements'
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
  counts: { messages: 0, hearts: 0, tasksDone: 0, financeEntries: 0, leisureDone: 0, funPlays: 0 },
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
  const notifiedAchievements = useRef(new Set<string>())
  const notifiedLevel = useRef<number | null>(null)

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

  // Detecta level up e conquistas novas de forma reativa (evita duplicar
  // efeitos colaterais em cliques concorrentes).
  useEffect(() => {
    if (notifiedLevel.current === null) {
      notifiedLevel.current = info.level
    } else if (info.level > notifiedLevel.current) {
      notifiedLevel.current = info.level
      toast.push({ kind: 'levelup', title: `Subiram para o nível ${info.level}! 🎉`, icon: '⭐' })
      confettiBurst()
    }

    const novas = ACHIEVEMENTS.filter(
      (a) => !notifiedAchievements.current.has(a.id) && a.check(state.counts, info.level, state.streak),
    )
    if (novas.length === 0) return

    novas.forEach((a) => notifiedAchievements.current.add(a.id))
    setState((prev) => ({
      ...prev,
      achievements: Array.from(new Set([...prev.achievements, ...novas.map((a) => a.id)])),
    }))
    novas.forEach((a) => {
      toast.push({ kind: 'achievement', title: 'Conquista desbloqueada!', subtitle: a.title, icon: a.icon })
    })
    confettiBurst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.counts, state.streak, info.level])

  // Já vindo do localStorage: marca conquistas salvas como "já notificadas".
  useEffect(() => {
    state.achievements.forEach((id) => notifiedAchievements.current.add(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trigger = (event: GameEvent) => {
    setState((prev) => {
      const counts = { ...prev.counts }
      if (event.countKey) {
        counts[event.countKey] = Math.max(0, counts[event.countKey] + (event.countDelta ?? 1))
      }
      return { ...prev, xp: Math.max(0, prev.xp + event.xp), counts }
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
        counts: state.counts,
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
