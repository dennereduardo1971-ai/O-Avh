import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useProfile, type PersonKey } from '../context/ProfileContext'

/** Iniciais para o avatar — evita depender de imagens. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function PlayerHUD() {
  const { profile, setActive } = useProfile()
  const { level, xpIntoLevel, xpForNext, progress, streak } = useGame()

  return (
    <div className="px-3">
      <div className="panel panel-lit relative overflow-hidden p-3.5" style={{ '--glow': '#fbbf24' } as React.CSSProperties}>
        {/* Emblema de nível + sequência */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <motion.div
                key={level}
                initial={{ scale: 0.4, rotate: -35 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 14 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-base font-black text-night-900 shadow-[0_6px_18px_-6px_rgba(251,191,36,0.9),inset_0_1px_0_rgba(255,255,255,0.55)]"
              >
                {level}
              </motion.div>
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-gold-400/25 blur-md" />
            </div>
            <div>
              <p className="hud-label">Nível do casal</p>
              <p className="hud-value text-sm font-bold text-gold-300">
                {xpIntoLevel} <span className="text-parch-faint">/ {xpForNext} XP</span>
              </p>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-500/12 px-2.5 py-1">
              <motion.span
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="text-sm"
                aria-hidden
              >
                🔥
              </motion.span>
              <span className="hud-value text-sm font-bold text-orange-300">{streak}</span>
            </div>
          )}
        </div>

        {/* Trilho de XP com varredura de brilho */}
        <div className="relative mt-3 h-2.5 overflow-hidden rounded-full border border-white/8 bg-night-950/70">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-gold-400 via-blush-400 to-iris-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          >
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 w-1/3 bg-white/35 blur-[6px] animate-[sheen_2.6s_ease-in-out_infinite]" />
            </span>
          </motion.div>
        </div>

        {/* Os dois jogadores — clicar troca quem está usando o app */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {(['p1', 'p2'] as PersonKey[]).map((key) => {
            const isActive = profile.active === key
            return (
              <motion.button
                key={key}
                onClick={() => setActive(key)}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex items-center gap-2 overflow-hidden rounded-xl border px-2 py-1.5 text-left transition-colors ${
                  isActive
                    ? 'border-blush-400/45 bg-blush-500/15'
                    : 'border-white/8 bg-white/4 hover:bg-white/8'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-blush-300 to-blush-500 text-white'
                      : 'bg-white/10 text-parch-dim'
                  }`}
                >
                  {initials(profile.names[key])}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                    isActive ? 'text-parch' : 'text-parch-dim'
                  }`}
                >
                  {profile.names[key]}
                </span>

                {/* Ponto pulsante marca quem está no comando — dispensa rótulo. */}
                {isActive && (
                  <motion.span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-blush-400 shadow-[0_0_8px_#ff7da3]"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="hud-active-player"
                    className="absolute inset-0 -z-10 rounded-xl bg-blush-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
