import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
import type { AssignedTo, DailyTask } from './types'

export default function TasksPage() {
  const { profile } = useProfile()
  const { trigger } = useGame()
  const [tasks, setTasks] = useLocalStorage<DailyTask[]>('casal:tarefas', [])
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState<AssignedTo>(profile.active)
  const [filtro, setFiltro] = useState<'todas' | AssignedTo>('todas')

  const adicionar = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const nova: DailyTask = {
      id: generateId(),
      title: trimmed,
      assignedTo,
      done: false,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, nova])
    setTitle('')
  }

  const alternar = (id: string, e: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const ficandoConcluida = !task.done
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    if (ficandoConcluida) {
      confettiPop({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
      trigger({ xp: 8, xpLabel: `Tarefa concluída: ${task.title}`, xpIcon: '✅', countKey: 'tasksDone' })
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">✅ Tarefas Diárias</h1>
        <p className="mt-1 text-slate-500">Organizem o que precisa ser feito hoje.</p>
      </header>

      <div className="mb-6 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Progresso do dia</span>
          <motion.span
            key={progresso}
            initial={{ scale: 1.3, color: '#f43f5e' }}
            animate={{ scale: 1, color: '#94a3b8' }}
            className="text-slate-400"
          >
            {progresso}%
          </motion.span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-rose-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-500"
            initial={{ width: 0 }}
            animate={{ width: `${progresso}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
        {progresso === 100 && tasks.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs font-semibold text-emerald-600"
          >
            🎉 Tudo feito por hoje! Vocês arrasaram.
          </motion.p>
        )}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95, rotate: -180 }}
          onClick={resetarDia}
          className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
        >
          🔄 Resetar tarefas para um novo dia
        </motion.button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Nova tarefa (ex: lavar louça)"
          className="min-w-[200px] flex-1 rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value as AssignedTo)}
          className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
        >
          <option value="p1">{profile.names.p1}</option>
          <option value="p2">{profile.names.p2}</option>
          <option value="ambos">Os dois</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={adicionar}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
        >
          Adicionar
        </motion.button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(['todas', 'p1', 'p2', 'ambos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              filtro === f ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 ring-1 ring-rose-100'
            }`}
          >
            {f === 'todas' ? 'Todas' : nomeResponsavel(f)}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhuma tarefa por aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visiveis.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3 shadow-sm"
              >
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => alternar(t.id, e)}
                  aria-label={t.done ? 'Marcar como não feita' : 'Marcar como feita'}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white transition ${
                    t.done ? 'border-emerald-500 bg-emerald-500' : 'border-rose-200 bg-white'
                  }`}
                >
                  <AnimatePresence>
                    {t.done && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <span className={`flex-1 text-sm transition ${t.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {t.title}
                </span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-500">
                  {nomeResponsavel(t.assignedTo)}
                </span>
                <button onClick={() => remover(t.id)} className="text-xs text-slate-400 hover:text-rose-500">
                  remover
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
