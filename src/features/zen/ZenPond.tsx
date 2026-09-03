import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'
import { gota, iniciarAmbiente, pararAmbiente, useSom } from '../../lib/audio'
import rioUrl from '../../assets/animacoes/rio.webm'

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
  const { ligado } = useSom()
  const videoRef = useRef<HTMLVideoElement>(null)

  // A água de fundo vive junto com o lago: sai de cena ao trocar de tela ou ao
  // desligar o som, sem ficar tocando por trás do resto do app.
  useEffect(() => {
    if (!ligado) return
    iniciarAmbiente()
    return () => pararAmbiente()
  }, [ligado])

  // O vídeo do rio só roda se o aparelho aceita movimento — quem pediu
  // prefers-reduced-motion vê o quadro parado (o CSS global já corta a
  // duração de qualquer animação, mas um <video> não é animação CSS, então
  // precisa ser pausado à mão).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [])

  const tocar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = generateId()
    const y = e.clientY - rect.top
    gota(rect.height > 0 ? y / rect.height : 0.5)
    setRipples((prev) => [...prev.slice(-14), { id, x: e.clientX - rect.left, y }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 2600)
  }

  return (
    <div
      onClick={tocar}
      className="relative h-56 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-night-950 select-none"
    >
      {/* Rio animado como cama viva do lago — fica por baixo de tudo,
          escurecido para o texto e as ondas continuarem legíveis. */}
      <video
        ref={videoRef}
        src={rioUrl}
        muted
        loop
        playsInline
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night-950/55 via-night-900/25 to-night-950/70" />

      {/* Reflexo difuso, como luz extra na superfície da água */}
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
