import { motion } from 'framer-motion'
import { useGame } from '../../context/GameContext'
import { ACHIEVEMENTS } from '../../lib/achievements'
import Panel from '../../components/ui/Panel'
import SectionTitle from '../../components/ui/SectionTitle'
import AnimatedNumber from '../../components/AnimatedNumber'
import molduraTrofeu from '../../assets/ilustracoes/moldura-trofeu.png'

export default function AchievementsPage() {
  const { level, xp, streak, achievements, counts, progress, xpIntoLevel, xpForNext } = useGame()
  const unlocked = new Set(achievements)
  const pct = Math.round((achievements.length / ACHIEVEMENTS.length) * 100)

  return (
    <div>
      <SectionTitle icon="🏆" title="Troféus" subtitle="A caminhada de vocês dois até aqui." />

      {/* Vitrine do nível */}
      <Panel glow="gold" className="mb-4 overflow-hidden p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="relative h-28 w-28">
              <motion.img
                src={molduraTrofeu}
                alt=""
                aria-hidden
                initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_30px_rgba(251,191,36,0.55)]"
              />
              <span className="absolute inset-0 flex items-center justify-center pb-2 text-3xl font-black text-night-900">
                {level}
              </span>
            </div>
            <span className="absolute -inset-2 -z-10 rounded-3xl bg-gold-400/30 blur-xl" />
            <p className="hud-label mt-2 text-center">nível</p>
          </div>

          <div className="w-full flex-1">
            <div className="mb-2 flex items-end justify-between">
              <p className="text-sm font-bold text-parch">Progresso para o nível {level + 1}</p>
              <p className="hud-value text-xs text-parch-dim">
                {xpIntoLevel}/{xpForNext} XP
              </p>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full border border-white/8 bg-night-950/70">
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-r from-gold-400 via-blush-400 to-iris-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, progress * 100)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              >
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-y-0 w-1/3 bg-white/35 blur-[6px] animate-[sheen_2.6s_ease-in-out_infinite]" />
                </span>
              </motion.div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'XP total', value: xp, tone: 'text-gold-300' },
                { label: 'Sequência', value: streak, tone: 'text-orange-300' },
                { label: 'Troféus', value: achievements.length, tone: 'text-iris-300' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-center"
                >
                  <p className={`hud-value text-xl font-black ${s.tone}`}>
                    <AnimatedNumber value={s.value} />
                  </p>
                  <p className="hud-label mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Contadores por área */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Recadinhos', value: counts.messages },
          { label: 'Curtidas', value: counts.hearts },
          { label: 'Missões', value: counts.tasksDone },
          { label: 'Lançamentos', value: counts.financeEntries },
          { label: 'Aventuras', value: counts.leisureDone },
          { label: 'Jogadas', value: counts.funPlays },
          { label: 'Respiros', value: counts.calmMinutes },
        ].map((s) => (
          <Panel key={s.label} glow="none" className="px-3 py-3 text-center">
            <p className="hud-value text-lg font-black text-parch">{s.value}</p>
            <p className="hud-label mt-0.5">{s.label}</p>
          </Panel>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="hud-label">Coleção</p>
        <p className="hud-label">
          {achievements.length}/{ACHIEVEMENTS.length} · {pct}%
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACHIEVEMENTS.map((a, idx) => {
          const isUnlocked = unlocked.has(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.028, 0.4) }}
            >
              <Panel
                glow={isUnlocked ? 'gold' : 'none'}
                lit={isUnlocked}
                interactive={isUnlocked}
                className={`flex h-full items-start gap-3.5 p-4 ${isUnlocked ? '' : 'opacity-55'}`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                    isUnlocked
                      ? 'border-gold-400/35 bg-gold-500/12 shadow-[0_0_20px_-6px_rgba(251,191,36,0.8)]'
                      : 'border-white/8 bg-white/4 grayscale'
                  }`}
                  aria-hidden
                >
                  {isUnlocked ? a.icon : '🔒'}
                </span>
                <div className="min-w-0">
                  <p className={`font-bold ${isUnlocked ? 'text-parch' : 'text-parch-faint'}`}>
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-parch-dim">{a.description}</p>
                </div>
              </Panel>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
