import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'
import { useSyncedArea } from '../../lib/sync/hooks'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import type { AssignedTo, DailyTask } from './types'

export default function TasksPage() {
  const { profile } = useProfile()
  const { trigger } = useGame()
  const [tasks, setTasks] = useSyncedArea<DailyTask[]>('tarefas', [])
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState<AssignedTo>(profile.active)
  const [filtro, setFiltro] = useState<'todas' | AssignedTo>('todas')

  const adicionar = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setTasks((prev) => [
      ...prev,
      {
        id: generateId(),
        title: trimmed,
        assignedTo,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ])
    setTitle('')
  }

  const alternar = (id: string, e: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const concluindo = !task.done
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    if (concluindo) {
      confettiPop({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
      trigger({ xp: 8, xpLabel: `Missão cumprida: ${task.title}`, xpIcon: '⚔️', countKey: 'tasksDone' })
    }
  }

  const remover = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))
  const resetarDia = () => setTasks((prev) => prev.map((t) => ({ ...t, done: false })))

  const nomeResponsavel = (a: AssignedTo) => (a === 'ambos' ? 'Os dois' : profile.names[a])
  const visiveis = tasks.filter((t) => filtro === 'todas' || t.assignedTo === filtro)

  const progresso = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
  }, [tasks])

  return (
    <div>
      <SectionTitle icon="⚔️" title="Missões" subtitle="O que precisa ser feito hoje." />

      <Panel glow="iris" className="mb-4 p-5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="hud-label">Progresso do dia</p>
          <motion.span
            key={progresso}
            initial={{ scale: 1.35, color: '#a78bfa' }}
            animate={{ scale: 1, color: '#a7a1cc' }}
            className="hud-value text-sm font-bold"
          >
            {progresso}%
          </motion.span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-white/8 bg-night-950/70">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-iris-500 to-mint-400"
            initial={{ width: 0 }}
            animate={{ width: `${progresso}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 w-1/3 bg-white/30 blur-[6px] animate-[sheen_2.8s_ease-in-out_infinite]" />
            </span>
          </motion.div>
        </div>
        {progresso === 100 && tasks.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm font-bold text-mint-300"
          >
            🎉 Tudo concluído por hoje. Vão descansar!
          </motion.p>
        )}
        <GameButton onClick={resetarDia} variant="ghost" size="sm" className="mt-3">
          🔄 Recomeçar o dia
        </GameButton>
      </Panel>

      <Panel glow="iris" className="mb-5 flex flex-wrap gap-2 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Nova missão (ex: lavar a louça)"
          className="field min-w-[200px] flex-1"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value as AssignedTo)}
          className="field w-auto"
        >
          <option value="p1">{profile.names.p1}</option>
          <option value="p2">{profile.names.p2}</option>
          <option value="ambos">Os dois</option>
        </select>
        <GameButton onClick={adicionar} disabled={!title.trim()}>
          Adicionar
        </GameButton>
      </Panel>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['todas', 'p1', 'p2', 'ambos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === f
                ? 'border-iris-400/45 bg-iris-500/15 text-iris-300'
                : 'border-white/10 bg-white/4 text-parch-dim hover:bg-white/8 hover:text-parch'
            }`}
          >
            {f === 'todas' ? 'Todas' : nomeResponsavel(f)}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <Panel glow="none" className="p-10 text-center">
          <p className="text-3xl" aria-hidden>
            ⚔️
          </p>
          <p className="mt-2 text-sm text-parch-faint">Nenhuma missão no quadro.</p>
        </Panel>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visiveis.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 32, transition: { duration: 0.16 } }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              >
                <Panel glow={t.done ? 'mint' : 'iris'} lit={false} className="flex items-center gap-3 p-3.5">
                  <motion.button
                    whileTap={{ scale: 0.78 }}
                    onClick={(e) => alternar(t.id, e)}
                    aria-label={t.done ? 'Reabrir missão' : 'Concluir missão'}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-black transition-colors ${
                      t.done
                        ? 'border-mint-400 bg-mint-500/25 text-mint-300 shadow-[0_0_14px_-2px_rgba(94,234,212,0.7)]'
                        : 'border-white/18 bg-white/5 text-transparent hover:border-iris-400/60'
                    }`}
                  >
                    <AnimatePresence>
                      {t.done && (
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <span
                    className={`flex-1 text-sm transition-colors ${
                      t.done ? 'text-parch-faint line-through' : 'text-parch'
                    }`}
                  >
                    {t.title}
                  </span>

                  <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-parch-dim sm:block">
                    {nomeResponsavel(t.assignedTo)}
                  </span>
                  <button
                    onClick={() => remover(t.id)}
                    className="text-xs text-parch-faint transition-colors hover:text-blush-300"
                  >
                    remover
                  </button>
                </Panel>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
