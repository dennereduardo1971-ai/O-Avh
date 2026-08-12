import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '../context/ProfileContext'
import XPBar from './XPBar'

const FOLDERS = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/mensagens', label: 'Mensagens Fofas', icon: '💌', end: false },
  { to: '/financas', label: 'Finanças', icon: '💰', end: false },
  { to: '/tarefas', label: 'Tarefas Diárias', icon: '✅', end: false },
  { to: '/lazer', label: 'Lazer', icon: '🎈', end: false },
  { to: '/diversao', label: 'Diversão', icon: '🎲', end: false },
  { to: '/conquistas', label: 'Conquistas', icon: '🏆', end: false },
]

const navContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}
const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

export default function Layout() {
  const { profile, setActive } = useProfile()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-amber-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="shrink-0 border-b border-rose-100 bg-white/70 backdrop-blur md:w-64 md:border-b-0 md:border-r">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-5 pt-6 pb-3"
          >
            <motion.span
              className="text-2xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              💞
            </motion.span>
            <div>
              <p className="text-lg font-bold leading-tight text-rose-700">Nosso Cantinho</p>
              <p className="text-xs text-slate-500">organização a dois</p>
            </div>
          </motion.div>

          <XPBar />

          <motion.nav
            variants={navContainer}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-1 px-3 pb-3 md:flex-col md:pb-6"
          >
            {FOLDERS.map((f) => (
              <motion.div key={f.to} variants={navItem}>
                <NavLink
                  to={f.to}
                  end={f.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-rose-500 text-white shadow'
                        : 'text-slate-600 hover:bg-rose-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-xl bg-rose-500"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <motion.span whileHover={{ scale: 1.2, rotate: -8 }} aria-hidden>
                        {f.icon}
                      </motion.span>
                      {f.label}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
            <motion.div variants={navItem}>
              <NavLink
                to="/config"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-rose-500 text-white shadow' : 'text-slate-600 hover:bg-rose-100'
                  }`
                }
              >
                <span aria-hidden>⚙️</span>
                Configurações
              </NavLink>
            </motion.div>
          </motion.nav>

          <div className="mx-3 mb-6 rounded-xl border border-rose-100 bg-rose-50/80 p-3 md:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
              Quem está aqui?
            </p>
            <div className="flex gap-2">
              {(['p1', 'p2'] as const).map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActive(key)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                    profile.active === key
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-rose-100'
                  }`}
                >
                  {profile.names[key]}
                </motion.button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
