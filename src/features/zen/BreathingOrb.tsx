import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import GameButton from '../../components/ui/GameButton'
import { pararRespiracao, tomDeRespiracao, type FaseDaRespiracao } from '../../lib/audio'

interface BreathStep {
  label: string
  seconds: number
  /** Tamanho que a esfera assume ao final do passo. */
  scale: number
  /**
   * Qual som guia o passo. É campo próprio, e não o `label` reaproveitado:
   * mudar o texto da tela um dia não pode calar o som sem ninguém perceber.
   */
  fase: FaseDaRespiracao
}

interface Pattern {
  id: string
  name: string
  hint: string
  steps: BreathStep[]
}

const SMALL = 0.55
const BIG = 1

export const PATTERNS: Pattern[] = [
  {
    id: 'calma',
    name: 'Calma 4-6',
    hint: 'Expiração mais longa que a inspiração — o jeito mais rápido de baixar a agitação.',
    steps: [
      { label: 'Inspire', seconds: 4, scale: BIG, fase: 'inspire' },
      { label: 'Solte', seconds: 6, scale: SMALL, fase: 'solte' },
    ],
  },
  {
    id: 'quadrado',
    name: 'Quadrado 4-4-4-4',
    hint: 'Usada para recuperar o foco sob pressão. Quatro tempos iguais.',
    steps: [
      { label: 'Inspire', seconds: 4, scale: BIG, fase: 'inspire' },
      { label: 'Segure', seconds: 4, scale: BIG, fase: 'segure' },
      { label: 'Solte', seconds: 4, scale: SMALL, fase: 'solte' },
      { label: 'Segure', seconds: 4, scale: SMALL, fase: 'segure' },
    ],
  },
  {
    id: 'sono',
    name: 'Sono 4-7-8',
    hint: 'A preferida para desacelerar antes de dormir.',
    steps: [
      { label: 'Inspire', seconds: 4, scale: BIG, fase: 'inspire' },
      { label: 'Segure', seconds: 7, scale: BIG, fase: 'segure' },
      { label: 'Solte', seconds: 8, scale: SMALL, fase: 'solte' },
    ],
  },
]

export default function BreathingOrb({ onCycle }: { onCycle?: (total: number) => void }) {
  const [patternId, setPatternId] = useState(PATTERNS[0].id)
  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [remaining, setRemaining] = useState(PATTERNS[0].steps[0].seconds)

  const pattern = useMemo(
    () => PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0],
    [patternId],
  )
  const step = pattern.steps[stepIndex] ?? pattern.steps[0]

  // Guarda o callback num ref para não reiniciar o ciclo a cada render do pai.
  const onCycleRef = useRef(onCycle)
  useEffect(() => {
    onCycleRef.current = onCycle
  }, [onCycle])

  // Silencia ao pausar e ao sair da tela — sem isto o tom do passo em curso
  // continuaria tocando sozinho depois do ⏸.
  useEffect(() => {
    if (!running) pararRespiracao()
  }, [running])
  useEffect(() => pararRespiracao, [])

  // Relógio do exercício: conta o passo atual e avança quando zera.
  useEffect(() => {
    if (!running) return
    setRemaining(step.seconds)
    tomDeRespiracao(step.fase, step.seconds, step.scale === BIG)

    const tick = window.setInterval(() => {
      setRemaining((r) => (r > 1 ? r - 1 : 0))
    }, 1000)

    const advance = window.setTimeout(() => {
      const next = stepIndex + 1
      if (next >= pattern.steps.length) {
        setStepIndex(0)
        setCycles((c) => {
          const total = c + 1
          onCycleRef.current?.(total)
          return total
        })
      } else {
        setStepIndex(next)
      }
    }, step.seconds * 1000)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(advance)
    }
  }, [running, stepIndex, pattern, step])

  const trocarPadrao = (id: string) => {
    setPatternId(id)
    setStepIndex(0)
    setRunning(false)
    const p = PATTERNS.find((x) => x.id === id) ?? PATTERNS[0]
    setRemaining(p.steps[0].seconds)
  }

  const alternar = () => {
    if (running) {
      setRunning(false)
    } else {
      setStepIndex(0)
      setRemaining(pattern.steps[0].seconds)
      setRunning(true)
    }
  }

  const scale = running ? step.scale : 0.78

  return (
    <div className="flex flex-col items-center">
      {/* ---- A esfera ---- */}
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        {/* Halo externo que acompanha a respiração */}
        <motion.div
          className="absolute h-56 w-56 rounded-full bg-mint-400/18 blur-3xl sm:h-64 sm:w-64"
          animate={{ scale: scale * 1.15, opacity: running ? 0.9 : 0.5 }}
          transition={{ duration: running ? step.seconds : 1.2, ease: 'easeInOut' }}
        />

        {/* Anéis concêntricos: dão a referência visual do "cheio" e do "vazio" */}
        <div className="absolute h-56 w-56 rounded-full border border-white/8 sm:h-64 sm:w-64" />
        <div className="absolute h-36 w-36 rounded-full border border-white/6 sm:h-40 sm:w-40" />

        {/* Traço de progresso do passo atual */}
        <svg className="absolute h-56 w-56 -rotate-90 sm:h-64 sm:w-64" viewBox="0 0 100 100">
          <motion.circle
            key={`${pattern.id}-${stepIndex}-${cycles}-${running}`}
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="url(#breath-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: running ? 1 : 0 }}
            transition={{ duration: running ? step.seconds : 0.4, ease: 'linear' }}
          />
          <defs>
            <linearGradient id="breath-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Corpo da esfera */}
        <motion.div
          className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/18 bg-gradient-to-br from-mint-400/35 via-iris-500/30 to-blush-500/30 shadow-[inset_0_2px_20px_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(94,234,212,0.6)] backdrop-blur-sm sm:h-44 sm:w-44"
          animate={{ scale }}
          transition={{ duration: running ? step.seconds : 1.2, ease: 'easeInOut' }}
        >
          <div className="text-center">
            <motion.p
              key={step.label + stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold tracking-tight text-parch"
            >
              {running ? step.label : 'Pronto?'}
            </motion.p>
            {running && (
              <p className="hud-value mt-0.5 text-3xl font-black text-parch">{remaining}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ---- Controles ---- */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => trocarPadrao(p.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              p.id === patternId
                ? 'border-mint-400/45 bg-mint-500/15 text-mint-300'
                : 'border-white/10 bg-white/4 text-parch-dim hover:bg-white/8 hover:text-parch'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-parch-faint">
        {pattern.hint}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <GameButton onClick={alternar} variant={running ? 'soft' : 'primary'} size="md">
          {running ? '⏸ Pausar' : '▶ Começar'}
        </GameButton>
        {cycles > 0 && (
          <span className="hud-label">
            {cycles} ciclo{cycles === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  )
}
