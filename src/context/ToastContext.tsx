import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../lib/storage'

export type ToastKind = 'xp' | 'achievement' | 'levelup'

interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  subtitle?: string
  icon: string
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLES: Record<ToastKind, string> = {
  xp: 'border-white/12 bg-night-800/90 text-parch shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]',
  achievement:
    'border-gold-300/45 bg-gradient-to-r from-gold-500/90 to-blush-500/90 text-night-950 shadow-[0_16px_44px_-14px_rgba(251,191,36,0.85)]',
  levelup:
    'border-iris-300/45 bg-gradient-to-r from-blush-500/95 to-iris-500/95 text-white shadow-[0_16px_44px_-14px_rgba(167,139,250,0.9)]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = generateId()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:right-3 sm:left-auto">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl ${STYLES[t.kind]}`}
            >
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{t.title}</p>
                {t.subtitle && <p className="text-xs opacity-90">{t.subtitle}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
