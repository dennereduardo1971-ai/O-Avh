import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AmbientBackground from './AmbientBackground'
import PlayerHUD from './PlayerHUD'
import { GLOW_HEX, type GlowTone } from './ui/Panel'

interface NavEntry {
  to: string
  label: string
  icon: string
  end: boolean
  tone: Exclude<GlowTone, 'none'>
}

const PRIMARY: NavEntry[] = [
  { to: '/', label: 'Painel', icon: '🛖', end: true, tone: 'blush' },
  { to: '/mensagens', label: 'Recadinhos', icon: '💌', end: false, tone: 'blush' },
  { to: '/financas', label: 'Tesouro', icon: '💎', end: false, tone: 'mint' },
  { to: '/tarefas', label: 'Missões', icon: '⚔️', end: false, tone: 'iris' },
  { to: '/lazer', label: 'Aventuras', icon: '🗺️', end: false, tone: 'gold' },
  { to: '/diversao', label: 'Arcade', icon: '🕹️', end: false, tone: 'iris' },
  { to: '/calma', label: 'Refúgio', icon: '🫧', end: false, tone: 'mint' },
  { to: '/conquistas', label: 'Troféus', icon: '🏆', end: false, tone: 'gold' },
]

const navContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}
const navItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0 },
}

function NavRow({ entry }: { entry: NavEntry }) {
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      className="group relative block"
      style={{ '--glow': GLOW_HEX[entry.tone] } as React.CSSProperties}
    >
      {({ isActive }) => (
        <span
          className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive ? 'text-parch' : 'text-parch-dim hover:text-parch'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="nav-active-pill"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="absolute inset-0 -z-10 rounded-xl border border-[var(--glow)]/35 bg-[var(--glow)]/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            />
          )}
          {!isActive && (
            <span className="absolute inset-0 -z-10 rounded-xl bg-white/0 transition-colors group-hover:bg-white/5" />
          )}

          {/* Marcador luminoso da entrada ativa */}
          {isActive && (
            <motion.span
              layoutId="nav-active-bar"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--glow)] shadow-[0_0_12px_var(--glow)]"
            />
          )}

          <motion.span
            whileHover={{ scale: 1.22, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="text-lg leading-none"
            aria-hidden
          >
            {entry.icon}
          </motion.span>
          {entry.label}
        </span>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const location = useLocation()

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        {/* ---------- Coluna de comando ---------- */}
        <aside className="z-20 shrink-0 border-b border-white/8 bg-night-900/55 backdrop-blur-xl lg:w-[264px] lg:border-r lg:border-b-0">
          <div className="sticky top-0 flex flex-col gap-4 py-5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5"
            >
              <div className="relative">
                <motion.span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/14 bg-gradient-to-br from-blush-500/35 to-iris-500/35 text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden
                >
                  💞
                </motion.span>
                <span className="absolute -inset-1 -z-10 rounded-2xl bg-blush-500/25 blur-lg" />
              </div>
              <div>
                <p className="text-[15px] leading-tight font-black tracking-tight text-parch">
                  Nosso Cantinho
                </p>
                <p className="hud-label mt-0.5">refúgio a dois</p>
              </div>
            </motion.div>

            <PlayerHUD />

            <motion.nav
              variants={navContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-1 px-3 lg:grid-cols-1"
            >
              {PRIMARY.map((entry) => (
                <motion.div key={entry.to} variants={navItem}>
                  <NavRow entry={entry} />
                </motion.div>
              ))}
              <motion.div variants={navItem} className="col-span-2 lg:col-span-1">
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <NavRow
                  entry={{ to: '/config', label: 'Ajustes', icon: '⚙️', end: false, tone: 'iris' }}
                />
              </motion.div>
            </motion.nav>
          </div>
        </aside>

        {/* ---------- Área de conteúdo ---------- */}
        <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
