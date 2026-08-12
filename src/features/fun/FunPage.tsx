import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiBurst, confettiPop } from '../../lib/confetti'
import { PERGUNTAS_DO_DIA } from './questions'

function sorteiaPergunta(atual: string) {
  if (PERGUNTAS_DO_DIA.length <= 1) return PERGUNTAS_DO_DIA[0]
  let nova = atual
  while (nova === atual) {
    nova = PERGUNTAS_DO_DIA[Math.floor(Math.random() * PERGUNTAS_DO_DIA.length)]
  }
  return nova
}

export default function FunPage() {
  const { profile } = useProfile()
  const { trigger } = useGame()

  const [pergunta, setPergunta] = useState(PERGUNTAS_DO_DIA[0])
  const jogar = (xpLabel: string) => trigger({ xp: 3, xpLabel, xpIcon: '🎲', countKey: 'funPlays' })

  const novaPergunta = () => {
    setPergunta((atual) => sorteiaPergunta(atual))
    jogar('Pergunta do dia sorteada')
  }

  // --- Sorteio / roleta ---
  const [lista, setLista] = useState('pizza\nmassa\nsushi')
  const [display, setDisplay] = useState<string | null>(null)
  const [sorteado, setSorteado] = useState<string | null>(null)
  const [girando, setGirando] = useState(false)
  const spinTimer = useRef<number | null>(null)

  const sortear = () => {
    const itens = lista
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (itens.length === 0 || girando) return
    setGirando(true)
    setSorteado(null)
    let ticks = 0
    const totalTicks = 16
    spinTimer.current = window.setInterval(() => {
      setDisplay(itens[Math.floor(Math.random() * itens.length)])
      ticks += 1
      if (ticks >= totalTicks) {
        if (spinTimer.current) window.clearInterval(spinTimer.current)
        const final = itens[Math.floor(Math.random() * itens.length)]
        setDisplay(final)
        setSorteado(final)
        setGirando(false)
        confettiPop()
        jogar('Roleta de decisões')
      }
    }, 80)
  }

  // --- Cara ou coroa ---
  const [rotation, setRotation] = useState(0)
  const [moeda, setMoeda] = useState<string | null>(null)
  const [virando, setVirando] = useState(false)

  const jogarMoeda = () => {
    if (virando) return
    setVirando(true)
    setMoeda(null)
    const resultado = Math.random() < 0.5 ? 'Cara' : 'Coroa'
    const voltas = 4 + Math.floor(Math.random() * 3)
    const finalRotation = rotation + voltas * 360 + (resultado === 'Coroa' ? 180 : 0)
    setRotation(finalRotation)
    window.setTimeout(() => {
      setMoeda(resultado)
      setVirando(false)
      confettiPop()
      jogar('Cara ou coroa')
    }, 900)
  }

  // --- Quem decide hoje ---
  const [decisor, setDecisor] = useState<string | null>(null)
  const [sorteandoDecisor, setSorteandoDecisor] = useState(false)
  const decisorTimer = useRef<number | null>(null)

  const escolherDecisor = () => {
    if (sorteandoDecisor) return
    setSorteandoDecisor(true)
    setDecisor(null)
    let ticks = 0
    decisorTimer.current = window.setInterval(() => {
      setDecisor(Math.random() < 0.5 ? profile.names.p1 : profile.names.p2)
      ticks += 1
      if (ticks >= 14) {
        if (decisorTimer.current) window.clearInterval(decisorTimer.current)
        const final = Math.random() < 0.5 ? profile.names.p1 : profile.names.p2
        setDecisor(final)
        setSorteandoDecisor(false)
        confettiBurst()
        jogar('Sorteio de responsável')
      }
    }, 90)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🎲 Diversão</h1>
        <p className="mt-1 text-slate-500">Umas brincadeiras rápidas para quando bater o tédio.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
          style={{ perspective: 800 }}
        >
          <h2 className="font-semibold text-slate-800">💬 Pergunta do dia</h2>
          <div className="mt-3 min-h-[88px]" style={{ perspective: 800 }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={pergunta}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl bg-rose-50 p-4 text-slate-700"
              >
                {pergunta}
              </motion.p>
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={novaPergunta}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            🔀 Outra pergunta
          </motion.button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-800">🎯 Sorteio / roleta de decisões</h2>
          <p className="mt-1 text-xs text-slate-400">Um item por linha (ex: opções de jantar, filme, etc.)</p>
          <textarea
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={sortear}
            disabled={girando}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600 disabled:opacity-60"
          >
            {girando ? '🎲 Sorteando...' : '🎲 Sortear'}
          </motion.button>
          <AnimatePresence mode="wait">
            {display && (
              <motion.p
                key={display + (sorteado ? 'final' : 'spin')}
                initial={{ opacity: 0, y: girando ? -6 : 10, scale: sorteado ? 0.8 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: girando ? 0.06 : 0.4, type: sorteado ? 'spring' : 'tween' }}
                className={`mt-3 rounded-xl p-3 text-center font-semibold ${
                  sorteado ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                }`}
              >
                {display}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-800">🪙 Cara ou coroa</h2>
          <p className="mt-1 text-xs text-slate-400">Pra desempatar aquela discussão boba.</p>
          <div className="mt-4 flex justify-center" style={{ perspective: 600 }}>
            <motion.div
              animate={{ rotateY: rotation }}
              transition={{ duration: 0.9, ease: [0.2, 0.75, 0.3, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-2xl font-bold text-white shadow-lg"
              style={{ transformStyle: 'preserve-3d' }}
            >
              🪙
            </motion.div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={jogarMoeda}
            disabled={virando}
            className="mx-auto mt-3 block rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600 disabled:opacity-60"
          >
            {virando ? 'Jogando...' : 'Jogar a moeda'}
          </motion.button>
          <AnimatePresence>
            {moeda && (
              <motion.p
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 rounded-xl bg-amber-50 p-3 text-center text-2xl font-bold text-amber-700"
              >
                {moeda === 'Cara' ? '🙂 Cara' : '👑 Coroa'}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-800">🙋 Quem decide hoje?</h2>
          <p className="mt-1 text-xs text-slate-400">Sorteia quem escolhe o programa de hoje.</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={escolherDecisor}
            disabled={sorteandoDecisor}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600 disabled:opacity-60"
          >
            {sorteandoDecisor ? 'Sorteando...' : 'Sortear responsável'}
          </motion.button>
          <AnimatePresence mode="wait">
            {decisor && (
              <motion.p
                key={decisor + (sorteandoDecisor ? 'spin' : 'final')}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, scale: sorteandoDecisor ? 1 : [1, 1.1, 1] }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: sorteandoDecisor ? 0.07 : 0.5 }}
                className="mt-3 rounded-xl bg-fuchsia-50 p-3 text-center text-lg font-semibold text-fuchsia-700"
              >
                {sorteandoDecisor ? decisor : `${decisor} decide hoje! 🎉`}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  )
}
