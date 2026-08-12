import confetti from 'canvas-confetti'

const CORES_CASAL = ['#f43f5e', '#e879f9', '#fbbf24', '#fb7185']

/** Confete simples, para pequenas conquistas (tarefa concluída, etc). */
export function confettiPop(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 30,
    origin: origin ?? { y: 0.7 },
    colors: CORES_CASAL,
    scalar: 0.8,
  })
}

/** Confete grande, para conquistas e level up. */
export function confettiBurst() {
  const duration = 900
  const end = Date.now() + duration
  ;(function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors: CORES_CASAL,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors: CORES_CASAL,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors: CORES_CASAL,
  })
}
