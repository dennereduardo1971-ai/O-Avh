import { useState } from 'react'
import { motion } from 'framer-motion'
import { ploc } from '../../lib/audio'

const TOTAL = 84

/** Vibração curtíssima no toque — no celular é o que "fecha" a sensação de estourar. */
function buzz() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(8)
  }
}

export default function BubblePop({ onPop }: { onPop?: () => void }) {
  const [popped, setPopped] = useState<Set<number>>(new Set())

  const estourar = (i: number) => {
    if (popped.has(i)) return
    buzz()
    ploc()
    onPop?.()
    setPopped((prev) => {
      const next = new Set(prev)
      next.add(i)
      // Folha cheia: repõe sozinha depois de um respiro.
      if (next.size >= TOTAL) {
        setTimeout(() => setPopped(new Set()), 700)
      }
      return next
    })
  }

  const restantes = TOTAL - popped.size

  return (
    <div>
      {/* auto-fill mantém a densidade de plástico bolha de verdade em
          qualquer largura, em vez de inchar as bolhas em telas grandes. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))] gap-1.5 sm:gap-2">
        {Array.from({ length: TOTAL }, (_, i) => {
          const isPopped = popped.has(i)
          return (
            <motion.button
              key={i}
              onClick={() => estourar(i)}
              aria-label={isPopped ? 'Bolha estourada' : 'Estourar bolha'}
              whileHover={isPopped ? undefined : { scale: 1.12 }}
              whileTap={isPopped ? undefined : { scale: 0.75 }}
              animate={
                isPopped
                  ? { scale: 0.82, opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
              className={`aspect-square rounded-full border transition-colors duration-300 ${
                isPopped
                  ? 'border-white/6 bg-night-950/70 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]'
                  : 'border-white/25 bg-gradient-to-br from-white/28 to-mint-400/22 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_8px_-2px_rgba(94,234,212,0.5)]'
              }`}
            />
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-parch-faint">
        {restantes > 0 ? `${restantes} bolhas inteiras` : 'Repondo a cartela… ✨'}
      </p>
    </div>
  )
}
