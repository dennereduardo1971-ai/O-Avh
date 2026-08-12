import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { ACHIEVEMENTS } from '../../lib/achievements'

export default function AchievementsPage() {
  const { level, xp, streak, achievements, counts } = useGame()
  const unlocked = new Set(achievements)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🏆 Conquistas</h1>
        <p className="mt-1 text-slate-500">O progresso de vocês dois jogando o "Nosso Cantinho".</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="⭐" label="Nível" value={level} />
        <StatCard icon="✨" label="XP total" value={xp} />
        <StatCard icon="🔥" label="Sequência" value={`${streak} dia${streak === 1 ? '' : 's'}`} />
        <StatCard icon="🥇" label="Desbloqueadas" value={`${achievements.length}/${ACHIEVEMENTS.length}`} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Mensagens" value={counts.messages} />
        <MiniStat label="Curtidas" value={counts.hearts} />
        <MiniStat label="Tarefas feitas" value={counts.tasksDone} />
        <MiniStat label="Lançamentos" value={counts.financeEntries} />
        <MiniStat label="Programas feitos" value={counts.leisureDone} />
        <MiniStat label="Jogadas" value={counts.funPlays} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, idx) => {
          const isUnlocked = unlocked.has(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={isUnlocked ? { scale: 1.03, rotate: -0.5 } : undefined}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition ${
                isUnlocked
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-fuchsia-50'
                  : 'border-white bg-white/60 grayscale'
              }`}
            >
              <span className={`text-3xl ${isUnlocked ? '' : 'opacity-30'}`} aria-hidden>
                {isUnlocked ? a.icon : '🔒'}
              </span>
              <div>
                <p className={`font-semibold ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>{a.title}</p>
                <p className="text-sm text-slate-500">{a.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-white bg-white/80 p-4 text-center shadow-sm"
    >
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs uppercase text-slate-400">{label}</p>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-white/70 p-3 text-center">
      <p className="text-lg font-bold text-rose-600">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
