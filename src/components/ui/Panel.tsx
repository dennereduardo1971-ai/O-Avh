import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

export type GlowTone = 'blush' | 'iris' | 'mint' | 'gold' | 'none'

export const GLOW_HEX: Record<Exclude<GlowTone, 'none'>, string> = {
  blush: '#ff6fa0',
  iris: '#a879fa',
  mint: '#34e8c4',
  gold: '#fbbf24',
}

interface PanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Cor do fio de luz e do brilho ao passar o mouse. */
  glow?: GlowTone
  /** Acende o fio de luz no topo do painel. */
  lit?: boolean
  /** Reage ao mouse — use só onde o painel realmente é clicável ou vivo. */
  interactive?: boolean
  className?: string
}

export default function Panel({
  children,
  glow = 'blush',
  lit = true,
  interactive = false,
  className = '',
  ...rest
}: PanelProps) {
  const glowVar = glow === 'none' ? undefined : GLOW_HEX[glow]

  return (
    <motion.div
      {...rest}
      style={glowVar ? ({ '--glow': glowVar } as React.CSSProperties) : undefined}
      className={[
        'panel',
        lit && glow !== 'none' ? 'panel-lit' : '',
        interactive ? 'panel-interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </motion.div>
  )
}
