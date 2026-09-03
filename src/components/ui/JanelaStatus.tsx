import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { chanfro } from '../../lib/chanfro'
import { GLOW_HEX, type GlowTone } from './Panel'

interface JanelaStatusProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  tone?: GlowTone
  corner?: number
  padded?: boolean
  className?: string
}

/**
 * Painel do layout novo: cantos chanfrados em vez de arredondados — janela
 * de status de RPG japonês, não card de dashboard. Duas camadas de
 * clip-path (moldura fina por fora, conteúdo por dentro) porque clip-path
 * corta a borda junto — não dá pra só usar `border` numa forma cortada e
 * esperar que fique nítido.
 */
export default function JanelaStatus({
  children,
  tone = 'blush',
  corner = 16,
  padded = true,
  className = '',
  style,
  ...rest
}: JanelaStatusProps) {
  const glow = tone === 'none' ? '#4a4468' : GLOW_HEX[tone]
  return (
    <motion.div
      {...rest}
      style={{
        clipPath: chanfro(corner),
        background: `linear-gradient(135deg, ${glow}80, ${glow}25 45%, transparent 75%)`,
        ...style,
      }}
      className={`relative p-[1.5px] ${className}`}
    >
      <div
        className={`h-full w-full bg-night-900/88 backdrop-blur-sm ${padded ? 'p-5' : ''}`}
        style={{ clipPath: chanfro(corner) }}
      >
        {children}
      </div>
    </motion.div>
  )
}
