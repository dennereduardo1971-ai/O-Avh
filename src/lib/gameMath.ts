/** XP necessário para subir do nível n para o nível n+1. */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 25
}

export interface LevelInfo {
  level: number
  xpIntoLevel: number
  xpForNext: number
  progress: number // 0..1
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, totalXp)
  let needed = xpForLevel(level)
  while (remaining >= needed) {
    remaining -= needed
    level += 1
    needed = xpForLevel(level)
  }
  return { level, xpIntoLevel: remaining, xpForNext: needed, progress: remaining / needed }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
