import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useProfile, type PersonKey } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { useLocalStorage } from '../../lib/storage'
import { chanfro } from '../../lib/chanfro'
import JanelaStatus from '../../components/ui/JanelaStatus'
import { GLOW_HEX, type GlowTone } from '../../components/ui/Panel'
import AnimatedNumber from '../../components/AnimatedNumber'
import fundoUrl from '../../assets/animacoes/fundo-app.webm'
import molduraTrofeu from '../../assets/ilustracoes/moldura-trofeu.png'
import ondaMissoes from '../../assets/ilustracoes/onda-missoes.png'
import seloTesouro from '../../assets/ilustracoes/selo-tesouro.jpg'
import impactoArcade from '../../assets/ilustracoes/impacto-arcade.jpg'
import petalasRecadinhos from '../../assets/ilustracoes/petalas-recadinhos.jpg'
import lagoLuarRefugio from '../../assets/ilustracoes/lago-luar-refugio.jpg'
import type { CuteMessage } from '../messages/types'
import type { DailyTask } from '../tasks/types'
import type { Transaction } from '../finance/types'

const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type TomAba = Exclude<GlowTone, 'none'>

const ABAS: { to: string; label: string; icon: string; tone: TomAba; end?: boolean }[] = [
  { to: '/prototipo', label: 'Painel', icon: '🛖', tone: 'blush', end: true },
  { to: '/mensagens', label: 'Recadinhos', icon: '💌', tone: 'blush' },
  { to: '/financas', label: 'Tesouro', icon: '💎', tone: 'mint' },
  { to: '/tarefas', label: 'Missões', icon: '⚔️', tone: 'iris' },
  { to: '/diversao', label: 'Arcade', icon: '🕹️', tone: 'iris' },
  { to: '/calma', label: 'Refúgio', icon: '🫧', tone: 'mint' },
  { to: '/conquistas', label: 'Troféus', icon: '🏆', tone: 'gold' },
]

const MOTIVOS: Record<string, { src: string; preto: boolean }> = {
  Missões: { src: ondaMissoes, preto: false },
  Tesouro: { src: seloTesouro, preto: true },
  Arcade: { src: impactoArcade, preto: true },
  Recadinhos: { src: petalasRecadinhos, preto: false },
  Refúgio: { src: lagoLuarRefugio, preto: false },
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** As quatro pontas da moldura HUD fixa ao redor da tela — reforça "isto é
 * um menu de jogo", não uma página de site. */
function CantosHUD() {
  const cantos = [
    'top-3 left-3 border-t border-l',
    'top-3 right-3 border-t border-r',
    'bottom-3 left-3 border-b border-l',
    'bottom-3 right-3 border-b border-r',
  ]
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {cantos.map((c) => (
        <span key={c} className={`absolute h-6 w-6 border-gold-400/40 ${c}`} />
      ))}
    </div>
  )
}

function QuestWindow({
  to,
  icon,
  title,
  description,
  tone,
  meta,
}: {
  to: string
  icon: string
  title: string
  description: string
  tone: Exclude<GlowTone, 'none'>
  meta?: string
}) {
  const motivo = MOTIVOS[title]
  return (
    <Link to={to} className="group block h-full">
      <JanelaStatus tone={tone} corner={20} className="h-full transition-transform group-hover:-translate-y-0.5">
        <div className="relative flex h-full flex-col gap-3 overflow-hidden">
          {motivo && (
            <img
              src={motivo.src}
              alt=""
              aria-hidden
              className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 select-none ${
                motivo.preto ? 'mix-blend-screen opacity-40' : 'opacity-20'
              }`}
            />
          )}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className="flex h-11 w-11 items-center justify-center text-2xl"
              style={{
                clipPath: chanfro(8),
                background: `color-mix(in srgb, ${GLOW_HEX[tone]} 18%, transparent)`,
                border: `1px solid color-mix(in srgb, ${GLOW_HEX[tone]} 35%, transparent)`,
              }}
              aria-hidden
            >
              {icon}
            </span>
            {meta && (
              <span
                className="px-2.5 py-1 text-[11px] font-bold"
                style={{
                  clipPath: chanfro(5),
                  color: GLOW_HEX[tone],
                  background: `color-mix(in srgb, ${GLOW_HEX[tone]} 14%, transparent)`,
                }}
              >
                {meta}
              </span>
            )}
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-parch transition-colors group-hover:text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-parch-dim">{description}</p>
          </div>
          <span className="relative z-10 mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold text-parch-faint transition-colors group-hover:text-parch-dim">
            entrar
            <motion.span initial={{ x: 0 }} whileHover={{ x: 3 }} aria-hidden className="inline-block">
              →
            </motion.span>
          </span>
        </div>
      </JanelaStatus>
    </Link>
  )
}

export default function DashboardPrototipo() {
  const { profile, setActive } = useProfile()
  const { level, xp, xpIntoLevel, xpForNext, progress, streak, achievements, counts } = useGame()
  const [abrindo, setAbrindo] = useState(true)

  const [messages] = useLocalStorage<CuteMessage[]>('casal:mensagens', [])
  const [tasks] = useLocalStorage<DailyTask[]>('casal:tarefas', [])
  const [transactions] = useLocalStorage<Transaction[]>('casal:financas', [])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const saldo = transactions.reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0)
  const pendentes = tasks.filter((t) => !t.done).length

  return (
    <div className="relative min-h-screen">
      {/* ---------- Abertura de capítulo: corte diagonal revelando a tela ---------- */}
      <AnimatePresence onExitComplete={() => {}}>
        {abrindo && (
          <motion.div
            key="abertura"
            initial={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
            animate={{ clipPath: 'polygon(0 0,100% 0,100% 0,0 0)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={() => setAbrindo(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night-950"
          >
            <motion.p
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="hud-label text-lg tracking-[0.3em] text-gold-300"
            >
              painel
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Fundo: vídeo do torii, igual ao resto do app ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night-950">
        <video src={fundoUrl} autoPlay muted loop playsInline aria-hidden className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-night-950/55" />
      </div>

      <CantosHUD />

      {/* ---------- Barra de comando: substitui a sidebar ---------- */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-night-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden>
              💞
            </span>
            <p className="text-sm font-black tracking-tight text-parch">Nosso Cantinho</p>
          </div>

          {/* Status de grupo, no topo — não numa coluna lateral */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <img src={molduraTrofeu} alt="" aria-hidden className="absolute inset-0 h-full w-full object-contain" />
              <span className="absolute inset-0 flex items-center justify-center pb-0.5 text-xs font-black text-night-900">
                {level}
              </span>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 via-blush-400 to-iris-400"
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                />
              </div>
              <p className="hud-label mt-1">
                {xpIntoLevel}/{xpForNext} XP
              </p>
            </div>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-300">
                🔥 {streak}
              </span>
            )}
            <div className="flex items-center gap-1">
              {(['p1', 'p2'] as PersonKey[]).map((key) => {
                const isActive = profile.active === key
                return (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`flex h-8 w-8 items-center justify-center text-[10px] font-black transition-colors ${
                      isActive ? 'bg-blush-500 text-white' : 'bg-white/10 text-parch-dim'
                    }`}
                    style={{ clipPath: chanfro(5) }}
                    title={profile.names[key]}
                  >
                    {initials(profile.names[key])}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Abas — menu de RPG horizontal, sem sidebar */}
        <nav className="mx-auto flex max-w-[1400px] gap-1.5 overflow-x-auto px-6 pb-3">
          {ABAS.map((aba) => (
            <NavLink key={aba.to} to={aba.to} end={aba.end}>
              {({ isActive }) => (
                <span
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive ? '' : 'text-parch-dim hover:text-parch'
                  }`}
                  style={{
                    clipPath: chanfro(7),
                    background: isActive
                      ? `color-mix(in srgb, ${GLOW_HEX[aba.tone]} 20%, transparent)`
                      : 'rgba(255,255,255,0.04)',
                    color: isActive ? GLOW_HEX[aba.tone] : undefined,
                    border: `1px solid ${
                      isActive ? `color-mix(in srgb, ${GLOW_HEX[aba.tone]} 45%, transparent)` : 'transparent'
                    }`,
                  }}
                >
                  <span aria-hidden>{aba.icon}</span>
                  {aba.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ---------- Conteúdo ---------- */}
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <p className="hud-label">
            {saudacao} · nível {level} · protótipo de layout
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-parch sm:text-4xl">
            Olá, <span className="text-blush-400 text-glow">{profile.names[profile.active]}</span>
          </h1>
        </motion.header>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <JanelaStatus tone="mint" corner={12} className="p-0">
            <p className="hud-label">Tesouro</p>
            <p className="hud-value mt-2 text-2xl font-black text-mint-300">
              <AnimatedNumber value={saldo} formatter={formatBRL} />
            </p>
          </JanelaStatus>
          <JanelaStatus tone="iris" corner={12} className="p-0">
            <p className="hud-label">Missões abertas</p>
            <p className="hud-value mt-2 text-2xl font-black text-iris-300">
              <AnimatedNumber value={pendentes} />
            </p>
          </JanelaStatus>
          <JanelaStatus tone="blush" corner={12} className="p-0">
            <p className="hud-label">Recadinhos</p>
            <p className="hud-value mt-2 text-2xl font-black text-blush-300">
              <AnimatedNumber value={messages.length} />
            </p>
          </JanelaStatus>
          <JanelaStatus tone="gold" corner={12} className="p-0">
            <p className="hud-label">Troféus</p>
            <p className="hud-value mt-2 text-2xl font-black text-gold-300">
              <AnimatedNumber value={achievements.length} />
            </p>
          </JanelaStatus>
        </div>

        <p className="hud-label mt-2 mb-3">Pastas</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <QuestWindow to="/mensagens" icon="💌" tone="blush" title="Recadinhos" description="Deixem declarações e elogios um para o outro." meta={messages.length > 0 ? `${messages.length}` : undefined} />
          <QuestWindow to="/financas" icon="💎" tone="mint" title="Tesouro" description="Receitas, despesas e o saldo do casal." meta={transactions.length > 0 ? `${transactions.length}` : undefined} />
          <QuestWindow to="/tarefas" icon="⚔️" tone="iris" title="Missões" description="As tarefas do dia, divididas entre vocês." meta={pendentes > 0 ? `${pendentes} aberta${pendentes === 1 ? '' : 's'}` : undefined} />
          <QuestWindow to="/diversao" icon="🕹️" tone="iris" title="Arcade" description="Sorteios, moeda e perguntas para o tédio." meta={counts.funPlays > 0 ? `${counts.funPlays} jogada${counts.funPlays === 1 ? '' : 's'}` : undefined} />
          <QuestWindow to="/calma" icon="🫧" tone="mint" title="Refúgio" description="Respiração guiada, bolhas e água para acalmar." meta={counts.calmMinutes > 0 ? `${counts.calmMinutes} sessão${counts.calmMinutes === 1 ? '' : 'ões'}` : undefined} />
          <QuestWindow to="/conquistas" icon="🏆" tone="gold" title="Troféus" description="A caminhada de vocês dois até aqui." meta={`${achievements.length}/16`} />
        </div>

        <JanelaStatus tone="gold" corner={14} className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-parch-dim">
              Vocês somam{' '}
              <span className="hud-value font-black text-gold-300">
                <AnimatedNumber value={xp} /> XP
              </span>{' '}
              no total.
            </p>
            <p className="text-xs text-parch-faint">isto é um protótipo — nada aqui está definitivo</p>
          </div>
        </JanelaStatus>
      </main>
    </div>
  )
}
