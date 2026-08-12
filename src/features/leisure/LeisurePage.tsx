import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
import { CATEGORIAS_LAZER, type LeisureIdea, type LeisureStatus } from './types'

const STATUS_LABEL: Record<LeisureStatus, string> = {
  ideia: '💭 Ideia',
  planejado: '📅 Planejado',
  feito: '✔️ Feito',
}

const STATUS_STYLE: Record<LeisureStatus, string> = {
  ideia: 'bg-slate-100 text-slate-600',
  planejado: 'bg-amber-100 text-amber-700',
  feito: 'bg-emerald-100 text-emerald-700',
}

export default function LeisurePage() {
  const { trigger } = useGame()
  const [ideas, setIdeas] = useLocalStorage<LeisureIdea[]>('casal:lazer', [])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIAS_LAZER)[number]>('Filme/Série')
  const [notes, setNotes] = useState('')
  const [filtro, setFiltro] = useState<'todas' | LeisureStatus>('todas')

  const adicionar = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const nova: LeisureIdea = {
      id: generateId(),
      title: trimmed,
      category,
      notes: notes.trim(),
      status: 'ideia',
      createdAt: new Date().toISOString(),
    }
    setIdeas((prev) => [nova, ...prev])
    setTitle('')
    setNotes('')
    trigger({ xp: 3, xpLabel: 'Ideia de lazer salva', xpIcon: '🎈' })
  }

  const mudarStatus = (id: string, status: LeisureStatus, e: React.MouseEvent) => {
    const atual = ideas.find((i) => i.id === id)
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    if (status === 'feito' && atual?.status !== 'feito') {
      confettiPop({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
      trigger({ xp: 10, xpLabel: `Programa realizado: ${atual?.title}`, xpIcon: '🎉', countKey: 'leisureDone' })
    }
  }

  const remover = (id: string) => setIdeas((prev) => prev.filter((i) => i.id !== id))

  const visiveis = ideas.filter((i) => filtro === 'todas' || i.status === filtro)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🎈 Lazer</h1>
        <p className="mt-1 text-slate-500">Guardem ideias de programas para curtir juntos.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-white bg-white/80 p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ideia (ex: fim de semana na praia)"
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIAS_LAZER)[number])}
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          >
            {CATEGORIAS_LAZER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalhes (opcional)"
          rows={2}
          className="mt-3 w-full resize-none rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={adicionar}
          className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
        >
          Salvar ideia
        </motion.button>
      </motion.div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(['todas', 'ideia', 'planejado', 'feito'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              filtro === f ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 ring-1 ring-rose-100'
            }`}
          >
            {f === 'todas' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhuma ideia por aqui ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {visiveis.map((i) => (
              <motion.div
                key={i.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{i.title}</p>
                    <p className="text-xs text-slate-400">{i.category}</p>
                  </div>
                  <motion.span
                    key={i.status}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}
                  >
                    {STATUS_LABEL[i.status]}
                  </motion.span>
                </div>
                {i.notes && <p className="mt-2 text-sm text-slate-600">{i.notes}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(['ideia', 'planejado', 'feito'] as const).map((s) => (
                    <motion.button
                      key={s}
                      whileHover={i.status !== s ? { scale: 1.06 } : undefined}
                      whileTap={i.status !== s ? { scale: 0.94 } : undefined}
                      onClick={(e) => mudarStatus(i.id, s, e)}
                      disabled={i.status === s}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100 disabled:cursor-default disabled:opacity-40"
                    >
                      {STATUS_LABEL[s]}
                    </motion.button>
                  ))}
                  <button onClick={() => remover(i.id)} className="ml-auto text-xs text-slate-400 hover:text-rose-500">
                    remover
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
