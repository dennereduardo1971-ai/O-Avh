import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'

export default function XPBar() {
  const { level, xpIntoLevel, xpForNext, progress, streak } = useGame()

  return (
    <div className="mx-3 mb-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-fuchsia-50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-bold text-fuchsia-700">
          <motion.span
            key={level}
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="inline-block"
          >
            ⭐
          </motion.span>
          Nível {level}
        </span>
        {streak > 0 && (
          <span className="flex items-center gap-1 font-medium text-orange-500">
            🔥 {streak}
          </span>
        )}
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-slate-400">
        {xpIntoLevel}/{xpForNext} XP
      </p>
    </div>
  )
}
