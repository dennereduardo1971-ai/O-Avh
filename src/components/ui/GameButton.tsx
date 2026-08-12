import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'

type Variant = 'primary' | 'soft' | 'ghost' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-blush-400 to-blush-600 text-white border-blush-300/40 shadow-[0_8px_24px_-10px_rgba(255,92,138,0.85),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_12px_30px_-10px_rgba(255,92,138,1),inset_0_1px_0_rgba(255,255,255,0.45)]',
  gold: 'bg-gradient-to-b from-gold-300 to-gold-500 text-night-900 border-gold-300/50 shadow-[0_8px_24px_-10px_rgba(251,191,36,0.85),inset_0_1px_0_rgba(255,255,255,0.5)]',
  soft: 'bg-white/6 text-parch border-white/12 hover:bg-white/11 hover:border-white/20',
  ghost: 'bg-transparent text-parch-dim border-transparent hover:text-parch hover:bg-white/6',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
}

interface Ripple {
  id: string
  x: number
  y: number
}

interface GameButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode
  variant?: Variant
  size?: Size
}

/**
 * Botão do painel. A onda que nasce no ponto do clique existe para dar
 * o retorno tátil que torna a interação satisfatória — é o miolo da
 * proposta anti-estresse: tudo que se toca responde.
 */
export default function GameButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  ...rest
}: GameButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = generateId()
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600)
    onClick?.(e)
  }

  return (
    <motion.button
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { y: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
      className={[
        'relative inline-flex items-center justify-center overflow-hidden border font-semibold',
        'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-none absolute h-40 w-40 rounded-full bg-white/50"
            style={{ left: r.x - 80, top: r.y - 80 }}
          />
        ))}
      </AnimatePresence>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  )
}
