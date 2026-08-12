import { NavLink, Outlet } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'

const FOLDERS = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/mensagens', label: 'Mensagens Fofas', icon: '💌', end: false },
  { to: '/financas', label: 'Finanças', icon: '💰', end: false },
  { to: '/tarefas', label: 'Tarefas Diárias', icon: '✅', end: false },
  { to: '/lazer', label: 'Lazer', icon: '🎈', end: false },
  { to: '/diversao', label: 'Diversão', icon: '🎲', end: false },
]

export default function Layout() {
  const { profile, setActive } = useProfile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-amber-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="shrink-0 border-b border-rose-100 bg-white/70 backdrop-blur md:w-64 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 px-5 pt-6 pb-3">
            <span className="text-2xl">💞</span>
            <div>
              <p className="text-lg font-bold leading-tight text-rose-700">Nosso Cantinho</p>
              <p className="text-xs text-slate-500">organização a dois</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-1 px-3 pb-3 md:flex-col md:pb-6">
            {FOLDERS.map((f) => (
              <NavLink
                key={f.to}
                to={f.to}
                end={f.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-slate-600 hover:bg-rose-100'
                  }`
                }
              >
                <span aria-hidden>{f.icon}</span>
                {f.label}
              </NavLink>
            ))}
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
          </nav>

          <div className="mx-3 mb-6 rounded-xl border border-rose-100 bg-rose-50/80 p-3 md:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
              Quem está aqui?
            </p>
            <div className="flex gap-2">
              {(['p1', 'p2'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                    profile.active === key
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-rose-100'
                  }`}
                >
                  {profile.names[key]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
