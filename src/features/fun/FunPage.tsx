import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiBurst, confettiPop } from '../../lib/confetti'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import impactoArcade from '../../assets/ilustracoes/impacto-arcade.jpg'
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
  const jogar = (xpLabel: string) => trigger({ xp: 3, xpLabel, xpIcon: '🕹️', countKey: 'funPlays' })

  // --- Pergunta do dia ---
  const [pergunta, setPergunta] = useState(PERGUNTAS_DO_DIA[0])
  const novaPergunta = () => {
    setPergunta((atual) => sorteiaPergunta(atual))
    jogar('Pergunta do dia')
  }

  // --- Roleta ---
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
    spinTimer.current = window.setInterval(() => {
      setDisplay(itens[Math.floor(Math.random() * itens.length)])
      ticks += 1
      if (ticks >= 16) {
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

  // --- Moeda ---
  const [rotation, setRotation] = useState(0)
  const [moeda, setMoeda] = useState<string | null>(null)
  const [virando, setVirando] = useState(false)

  const jogarMoeda = () => {
    if (virando) return
    setVirando(true)
    setMoeda(null)
    const resultado = Math.random() < 0.5 ? 'Cara' : 'Coroa'
    const voltas = 4 + Math.floor(Math.random() * 3)
    setRotation((r) => r + voltas * 360 + (resultado === 'Coroa' ? 180 : 0))
    window.setTimeout(() => {
      setMoeda(resultado)
      setVirando(false)
      confettiPop()
      jogar('Cara ou coroa')
    }, 900)
  }

  // --- Quem decide ---
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
        setDecisor(Math.random() < 0.5 ? profile.names.p1 : profile.names.p2)
        setSorteandoDecisor(false)
        confettiBurst()
        jogar('Sorteio de responsável')
      }
    }, 90)
  }

  // Encerra os relógios se sair da página no meio de uma jogada.
  useEffect(
    () => () => {
      if (spinTimer.current) window.clearInterval(spinTimer.current)
      if (decisorTimer.current) window.clearInterval(decisorTimer.current)
    },
    [],
  )

  return (
    <div>
      <SectionTitle icon="🕹️" title="Arcade" subtitle="Para quando bater o tédio." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Pergunta do dia */}
        <Panel glow="iris" className="p-5" style={{ perspective: 900 }}>
          <p className="hud-label mb-1">Conversa</p>
          <h2 className="mb-4 text-lg font-bold text-parch">Pergunta do dia</h2>
          <div className="min-h-[92px]" style={{ perspective: 900 }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={pergunta}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.36 }}
                className="rounded-xl border border-white/8 bg-white/5 p-4 text-parch"
              >
                {pergunta}
              </motion.p>
            </AnimatePresence>
          </div>
          <GameButton onClick={novaPergunta} variant="soft" className="mt-4">
            🔀 Outra pergunta
          </GameButton>
        </Panel>

        {/* Roleta */}
        <Panel glow="blush" className="relative overflow-hidden p-5">
          {/* Fagulha de impacto no instante em que o sorteio pousa — some
              rápido, então não atrapalha ler o resultado. */}
          <AnimatePresence>
            {sorteado && (
              <motion.img
                key={sorteado}
                src={impactoArcade}
                alt=""
                aria-hidden
                initial={{ opacity: 0.85, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 m-auto h-48 w-48 mix-blend-screen select-none"
              />
            )}
          </AnimatePresence>
          <p className="hud-label mb-1">Decisões</p>
          <h2 className="mb-1 text-lg font-bold text-parch">Roleta</h2>
          <p className="mb-3 text-xs text-parch-faint">Um item por linha.</p>
          <textarea
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            rows={4}
            className="field resize-none"
          />
          <GameButton onClick={sortear} disabled={girando} className="mt-3">
            {girando ? '🎲 Girando…' : '🎲 Sortear'}
          </GameButton>
          <AnimatePresence mode="wait">
            {display && (
              <motion.p
                key={display + (sorteado ? 'f' : 's')}
                initial={{ opacity: 0, y: girando ? -6 : 12, scale: sorteado ? 0.8 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: girando ? 0.06 : 0.42, type: sorteado ? 'spring' : 'tween' }}
                className={`mt-3 rounded-xl border p-3.5 text-center text-lg font-black ${
                  sorteado
                    ? 'border-mint-400/40 bg-mint-500/12 text-mint-300'
                    : 'border-white/8 bg-white/4 text-parch-faint'
                }`}
              >
                {display}
              </motion.p>
            )}
          </AnimatePresence>
        </Panel>

        {/* Moeda */}
        <Panel glow="gold" className="p-5">
          <p className="hud-label mb-1">Desempate</p>
          <h2 className="mb-4 text-lg font-bold text-parch">Cara ou coroa</h2>
          <div className="flex justify-center py-2" style={{ perspective: 700 }}>
            <motion.div
              animate={{ rotateY: rotation }}
              transition={{ duration: 0.9, ease: [0.2, 0.75, 0.3, 1] }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-3xl shadow-[0_12px_36px_-10px_rgba(251,191,36,0.9),inset_0_2px_0_rgba(255,255,255,0.6)]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              🪙
            </motion.div>
          </div>
          <GameButton onClick={jogarMoeda} disabled={virando} variant="gold" className="mx-auto mt-4 flex">
            {virando ? 'Jogando…' : 'Jogar a moeda'}
          </GameButton>
          <AnimatePresence>
            {moeda && (
              <motion.p
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className="mt-3 rounded-xl border border-gold-400/35 bg-gold-500/12 p-3 text-center text-xl font-black text-gold-300"
              >
                {moeda === 'Cara' ? '🙂 Cara' : '👑 Coroa'}
              </motion.p>
            )}
          </AnimatePresence>
        </Panel>

        {/* Quem decide */}
        <Panel glow="mint" className="p-5">
          <p className="hud-label mb-1">Sorteio</p>
          <h2 className="mb-1 text-lg font-bold text-parch">Quem decide hoje?</h2>
          <p className="mb-4 text-xs text-parch-faint">Quem escolhe o programa da noite.</p>
          <GameButton onClick={escolherDecisor} disabled={sorteandoDecisor}>
            {sorteandoDecisor ? 'Sorteando…' : 'Sortear responsável'}
          </GameButton>
          <AnimatePresence mode="wait">
            {decisor && (
              <motion.p
                key={decisor + (sorteandoDecisor ? 's' : 'f')}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, scale: sorteandoDecisor ? 1 : [1, 1.12, 1] }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: sorteandoDecisor ? 0.07 : 0.5 }}
                className="mt-4 rounded-xl border border-mint-400/35 bg-mint-500/12 p-3.5 text-center text-lg font-black text-mint-300"
              >
                {sorteandoDecisor ? decisor : `${decisor} decide! 🎉`}
              </motion.p>
            )}
          </AnimatePresence>
        </Panel>
      </div>
    </div>
  )
}
