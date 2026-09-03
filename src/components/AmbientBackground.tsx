import { useEffect, useRef } from 'react'

type Forma = 'poeira' | 'petala' | 'fagulha'

interface Particle {
  x: number
  y: number
  r: number
  drift: number
  speed: number
  alpha: number
  hue: number
  phase: number
  forma: Forma
  rotacao: number
  giro: number
}

const HUES = [340, 285, 170, 30]
// Poeira é a maioria (textura de fundo); pétala e fagulha aparecem em doses
// pequenas — são o toque de anime (sakura / energia), não o efeito principal.
const FORMAS: Forma[] = [
  'poeira',
  'poeira',
  'poeira',
  'poeira',
  'poeira',
  'petala',
  'poeira',
  'poeira',
  'fagulha',
]

/**
 * Desenha uma partícula conforme sua forma. `poeira` é o pingo simples de
 * sempre; `petala` é uma pétala de sakura (elipse girando, tom rosado —
 * Shigatsu/temporada de flores); `fagulha` é um losango de energia (tom
 * quente — respiração de fogo/impacto). Mesmo motor de canvas, só o
 * traçado muda, então o custo por quadro continua baixo.
 */
function desenharParticula(ctx: CanvasRenderingContext2D, p: Particle, twinkle: number) {
  const alpha = p.alpha * twinkle

  if (p.forma === 'poeira') {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 90%, 78%, ${alpha})`
    ctx.fill()
    return
  }

  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotacao)

  if (p.forma === 'petala') {
    ctx.beginPath()
    ctx.ellipse(0, 0, p.r, p.r * 0.42, 0, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(340, 85%, 80%, ${alpha * 0.85})`
    ctx.fill()
  } else {
    const s = p.r * 1.8
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.lineTo(s * 0.55, 0)
    ctx.lineTo(0, s)
    ctx.lineTo(-s * 0.55, 0)
    ctx.closePath()
    ctx.fillStyle = `hsla(30, 95%, 68%, ${alpha})`
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Fundo do painel: aurora em CSS (barata) + poeira estelar em canvas.
 * O movimento é lento de propósito — é o "plano de fundo respirando",
 * não um efeito que disputa atenção com o conteúdo.
 */
export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let running = true

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Densidade proporcional à área, com teto para não pesar em telas grandes.
      const count = Math.min(70, Math.round((width * height) / 26000))
      particles = Array.from({ length: count }, () => {
        const forma = FORMAS[Math.floor(Math.random() * FORMAS.length)]
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: forma === 'petala' ? Math.random() * 2.2 + 2.4 : Math.random() * 1.6 + 0.5,
          drift: (Math.random() - 0.5) * (forma === 'petala' ? 0.3 : 0.12),
          speed: Math.random() * 0.16 + 0.04,
          alpha: Math.random() * 0.4 + 0.15,
          hue: HUES[Math.floor(Math.random() * HUES.length)],
          phase: Math.random() * Math.PI * 2,
          forma,
          rotacao: Math.random() * Math.PI * 2,
          giro: (Math.random() - 0.5) * 0.02,
        }
      })
    }

    const draw = () => {
      if (!running) return
      frame += 1
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.y -= p.speed
        p.x += p.drift + Math.sin((frame + p.phase * 60) / 190) * 0.14
        p.rotacao += p.giro
        if (p.y < -8) {
          p.y = height + 8
          p.x = Math.random() * width
        }
        if (p.x < -8) p.x = width + 8
        if (p.x > width + 8) p.x = -8

        // Cintilância suave — a poeira "pulsa" em ritmos diferentes.
        const twinkle = 0.65 + Math.sin(frame / 42 + p.phase) * 0.35
        desenharParticula(ctx, p, twinkle)
      }

      requestAnimationFrame(draw)
    }

    build()
    if (reduced) {
      // Sem animação: desenha um quadro estático e para por aqui.
      for (const p of particles) desenharParticula(ctx, p, 1)
    } else {
      draw()
    }

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      running = false
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night-950">
      {/* Auroras: manchas de cor muito difusas que dão profundidade ao fundo. */}
      <div className="absolute -top-1/4 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-blush-500/12 blur-[120px] animate-[drift_26s_ease-in-out_infinite_alternate]" />
      <div className="absolute -bottom-1/3 -right-1/4 h-[65vmax] w-[65vmax] rounded-full bg-iris-500/14 blur-[130px] animate-[drift_34s_ease-in-out_infinite_alternate-reverse]" />
      <div className="absolute top-1/3 left-1/2 h-[45vmax] w-[45vmax] -translate-x-1/2 rounded-full bg-mint-500/7 blur-[140px] animate-[drift_30s_ease-in-out_infinite_alternate]" />

      {/* Vinheta: escurece as bordas e puxa o olho para o centro do painel. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,4,13,0.82)_100%)]" />

      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
