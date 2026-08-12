import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon: string
  title: string
  subtitle?: string
  right?: ReactNode
}

export default function SectionTitle({ icon, title, subtitle, right }: SectionTitleProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
          aria-hidden
        >
          {icon}
        </motion.span>
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-parch sm:text-[1.75rem]"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="mt-0.5 text-sm text-parch-dim"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
      {right}
    </header>
  )
}
