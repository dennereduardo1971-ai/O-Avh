import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'
import { useSyncedArea } from '../../lib/sync/hooks'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import { CATEGORIAS_LAZER, type LeisureIdea, type LeisureStatus } from './types'

const STATUS_LABEL: Record<LeisureStatus, string> = {
  ideia: '💭 Ideia',
  planejado: '📅 Planejado',
  feito: '✔️ Feito',
}

const STATUS_STYLE: Record<LeisureStatus, string> = {
  ideia: 'border-white/12 bg-white/6 text-parch-dim',
  planejado: 'border-gold-400/40 bg-gold-500/12 text-gold-300',
  feito: 'border-mint-400/40 bg-mint-500/12 text-mint-300',
}

export default function LeisurePage() {
  const { trigger } = useGame()
  const [ideas, setIdeas] = useSyncedArea<LeisureIdea[]>('lazer', [])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIAS_LAZER)[number]>('Filme/Série')
  const [notes, setNotes] = useState('')
  const [filtro, setFiltro] = useState<'todas' | LeisureStatus>('todas')

  const adicionar = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setIdeas((prev) => [
      {
        id: generateId(),
        title: trimmed,
        category,
        notes: notes.trim(),
        status: 'ideia',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setTitle('')
    setNotes('')
    trigger({ xp: 3, xpLabel: 'Aventura anotada', xpIcon: '🗺️' })
  }

  const mudarStatus = (id: string, status: LeisureStatus, e: React.MouseEvent) => {
    const atual = ideas.find((i) => i.id === id)
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    if (status === 'feito' && atual?.status !== 'feito') {
      confettiPop({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
      trigger({
        xp: 10,
        xpLabel: `Aventura vivida: ${atual?.title}`,
        xpIcon: '🎉',
        countKey: 'leisureDone',
      })
    }
  }

  const remover = (id: string) => setIdeas((prev) => prev.filter((i) => i.id !== id))
  const visiveis = ideas.filter((i) => filtro === 'todas' || i.status === filtro)

  return (
    <div>
      <SectionTitle icon="🗺️" title="Aventuras" subtitle="O mapa dos programas de vocês." />

      <Panel glow="gold" className="mb-5 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ideia (ex: fim de semana na praia)"
            className="field"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIAS_LAZER)[number])}
            className="field"
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
          className="field mt-3 resize-none"
        />
        <GameButton onClick={adicionar} disabled={!title.trim()} className="mt-3">
          Salvar aventura
        </GameButton>
      </Panel>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['todas', 'ideia', 'planejado', 'feito'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === f
                ? 'border-gold-400/45 bg-gold-500/15 text-gold-300'
                : 'border-white/10 bg-white/4 text-parch-dim hover:bg-white/8 hover:text-parch'
            }`}
          >
            {f === 'todas' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <Panel glow="none" className="p-10 text-center">
          <p className="text-3xl" aria-hidden>
            🗺️
          </p>
          <p className="mt-2 text-sm text-parch-faint">Nenhuma aventura no mapa ainda.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {visiveis.map((i) => (
              <motion.div
                key={i.id}
                layout
                initial={{ opacity: 0, scale: 0.93, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Panel
                  glow={i.status === 'feito' ? 'mint' : i.status === 'planejado' ? 'gold' : 'iris'}
                  interactive
                  className="flex h-full flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-parch">{i.title}</p>
                      <p className="hud-label mt-0.5">{i.category}</p>
                    </div>
                    <motion.span
                      key={i.status}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[i.status]}`}
                    >
                      {STATUS_LABEL[i.status]}
                    </motion.span>
                  </div>

                  {i.notes && <p className="mt-2.5 text-sm text-parch-dim">{i.notes}</p>}

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                    {(['ideia', 'planejado', 'feito'] as const).map((s) => (
                      <motion.button
                        key={s}
                        whileHover={i.status !== s ? { scale: 1.06 } : undefined}
                        whileTap={i.status !== s ? { scale: 0.94 } : undefined}
                        onClick={(e) => mudarStatus(i.id, s, e)}
                        disabled={i.status === s}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-parch-dim transition-colors hover:bg-white/10 hover:text-parch disabled:opacity-30 disabled:hover:bg-white/5"
                      >
                        {STATUS_LABEL[s]}
                      </motion.button>
                    ))}
                    <button
                      onClick={() => remover(i.id)}
                      className="ml-auto text-xs text-parch-faint transition-colors hover:text-blush-300"
                    >
                      remover
                    </button>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
