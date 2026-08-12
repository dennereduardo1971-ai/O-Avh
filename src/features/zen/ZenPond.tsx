import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'

interface Ripple {
  id: string
  x: number
  y: number
}

/**
 * Lago de ondas: toque na água e veja o círculo se abrir e sumir.
 * Sem pontuação, sem objetivo — é justamente o ponto.
 */
export default function ZenPond() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const tocar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = generateId()
    setRipples((prev) => [
      ...prev.slice(-14),
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 2600)
  }

  return (
    <div
      onClick={tocar}
      className="relative h-56 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-night-800 via-night-850 to-night-950 select-none"
    >
      {/* Reflexo difuso, como luz na superfície da água */}
      <div className="pointer-events-none absolute -top-10 left-1/4 h-40 w-40 rounded-full bg-mint-400/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-1/4 h-40 w-40 rounded-full bg-iris-400/12 blur-3xl" />

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ width: 0, height: 0, opacity: 0.65, x: 0, y: 0 }}
            animate={{ width: 340, height: 340, opacity: 0, x: -170, y: -170 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.6, ease: 'easeOut' }}
            className="pointer-events-none absolute rounded-full border border-mint-300/60"
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </AnimatePresence>

      {ripples.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-parch-faint">toque na água 🫧</p>
        </div>
      )}
    </div>
  )
}
