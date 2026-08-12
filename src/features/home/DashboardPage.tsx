import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel, { GLOW_HEX, type GlowTone } from '../../components/ui/Panel'
import AnimatedNumber from '../../components/AnimatedNumber'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { useLocalStorage } from '../../lib/storage'
import { ACHIEVEMENTS } from '../../lib/achievements'
import { useTodayMoods, MOODS } from '../zen/MoodCheck'
import type { CuteMessage } from '../messages/types'
import type { DailyTask } from '../tasks/types'
import type { Transaction } from '../finance/types'
import type { LeisureIdea } from '../leisure/types'

const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
}
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
}

/* ------------------------------------------------------------------ */

function StatTile({
  label,
  value,
  icon,
  tone,
  to,
}: {
  label: string
  value: React.ReactNode
  icon: string
  tone: Exclude<GlowTone, 'none'>
  to: string
}) {
  return (
    <motion.div variants={rise}>
      <Link to={to} className="block">
        <Panel glow={tone} interactive className="h-full p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="hud-label">{label}</p>
            <span className="text-base leading-none opacity-70" aria-hidden>
              {icon}
            </span>
          </div>
          <p
            className="hud-value mt-2 text-2xl font-black"
            style={{ color: GLOW_HEX[tone] }}
          >
            {value}
          </p>
        </Panel>
      </Link>
    </motion.div>
  )
}

function QuestCard({
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
  return (
    <motion.div variants={rise}>
      <Link to={to} className="group block h-full">
        <Panel glow={tone} interactive className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <motion.span
              whileHover={{ scale: 1.14, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
              style={{ background: `color-mix(in srgb, ${GLOW_HEX[tone]} 16%, transparent)` }}
              aria-hidden
            >
              {icon}
            </motion.span>
            {meta && (
              <span
                className="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                style={{
                  color: GLOW_HEX[tone],
                  borderColor: `color-mix(in srgb, ${GLOW_HEX[tone]} 35%, transparent)`,
                  background: `color-mix(in srgb, ${GLOW_HEX[tone]} 12%, transparent)`,
                }}
              >
                {meta}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-parch transition-colors group-hover:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-parch-dim">{description}</p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold text-parch-faint transition-colors group-hover:text-parch-dim">
            entrar
            <motion.span
              className="inline-block"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              aria-hidden
            >
              →
            </motion.span>
          </span>
        </Panel>
      </Link>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { profile, otherOf } = useProfile()
  const { level, xp, streak, achievements, counts } = useGame()

  // Lê os dados das outras pastas para montar o resumo do painel.
  const [messages] = useLocalStorage<CuteMessage[]>('casal:mensagens', [])
  const [tasks] = useLocalStorage<DailyTask[]>('casal:tarefas', [])
  const [transactions] = useLocalStorage<Transaction[]>('casal:financas', [])
  const [leisure] = useLocalStorage<LeisureIdea[]>('casal:lazer', [])
  const moods = useTodayMoods()

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const saldo =
    transactions.reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0) ?? 0
  const pendentes = tasks.filter((t) => !t.done).length
  const feitasHoje = tasks.filter((t) => t.done).length
  const progressoTarefas = tasks.length ? Math.round((feitasHoje / tasks.length) * 100) : 0
  const planejados = leisure.filter((l) => l.status === 'planejado').length
  const ultima = messages[0]
  const meuHumor = MOODS.find((m) => m.id === moods[profile.active])

  return (
    <div>
      {/* ---------- Cabeçalho ---------- */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7"
      >
        <p className="hud-label">
          {saudacao} · nível {level} · {streak} dia{streak === 1 ? '' : 's'} seguidos
        </p>
        <h1 className="mt-1.5 text-3xl font-black tracking-tight text-parch sm:text-4xl">
          Olá, <span className="text-blush-400 text-glow">{profile.names[profile.active]}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-parch-dim">
          Este é o painel de vocês dois. Tudo o que importa em um lugar só — e um refúgio
          para quando o dia pesar.
        </p>
      </motion.header>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {/* ---------- Faixa de indicadores ---------- */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Tesouro"
            icon="💎"
            tone="mint"
            to="/financas"
            value={<AnimatedNumber value={saldo} formatter={formatBRL} />}
          />
          <StatTile
            label="Missões abertas"
            icon="⚔️"
            tone="iris"
            to="/tarefas"
            value={<AnimatedNumber value={pendentes} />}
          />
          <StatTile
            label="Recadinhos"
            icon="💌"
            tone="blush"
            to="/mensagens"
            value={<AnimatedNumber value={messages.length} />}
          />
          <StatTile
            label="Troféus"
            icon="🏆"
            tone="gold"
            to="/conquistas"
            value={
              <>
                <AnimatedNumber value={achievements.length} />
                <span className="text-parch-faint">/{ACHIEVEMENTS.length}</span>
              </>
            }
          />
        </div>

        {/* ---------- Linha do meio ---------- */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Progresso do dia */}
          <motion.div variants={rise} className="lg:col-span-2">
            <Panel glow="iris" className="h-full p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="hud-label">Jornada de hoje</p>
                  <h2 className="mt-1 text-lg font-bold text-parch">
                    {tasks.length === 0
                      ? 'Nenhuma missão no quadro'
                      : pendentes === 0
                        ? 'Tudo concluído! 🎉'
                        : pendentes === 1
                          ? '1 missão restante'
                          : `${pendentes} missões restantes`}
                  </h2>
                </div>
                <span className="hud-value text-2xl font-black text-iris-300">
                  {progressoTarefas}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/8 bg-night-950/70">
                <motion.div
                  className="relative h-full rounded-full bg-gradient-to-r from-iris-500 via-blush-400 to-mint-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressoTarefas}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.2 }}
                >
                  <span className="absolute inset-0 overflow-hidden rounded-full">
                    <span className="absolute inset-y-0 w-1/3 bg-white/30 blur-[6px] animate-[sheen_2.8s_ease-in-out_infinite]" />
                  </span>
                </motion.div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Feitas', value: feitasHoje, tone: 'text-mint-300' },
                  { label: 'Abertas', value: pendentes, tone: 'text-blush-300' },
                  { label: 'Planos', value: planejados, tone: 'text-gold-300' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-center"
                  >
                    <p className={`hud-value text-xl font-black ${s.tone}`}>{s.value}</p>
                    <p className="hud-label mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          {/* Refúgio + humor */}
          <motion.div variants={rise}>
            <Link to="/calma" className="block h-full">
              <Panel glow="mint" interactive className="flex h-full flex-col p-5">
                <p className="hud-label">Refúgio</p>
                <h2 className="mt-1 text-lg font-bold text-parch">Pausa para respirar</h2>

                <div className="my-4 flex flex-1 items-center justify-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <span className="absolute h-24 w-24 rounded-full bg-mint-400/20 blur-2xl" />
                    <motion.span
                      className="absolute h-20 w-20 rounded-full border border-mint-300/30"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.span
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-mint-400/40 to-iris-500/35 text-2xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.25)]"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    >
                      🫧
                    </motion.span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                  {meuHumor ? (
                    <p className="text-xs text-parch-dim">
                      Hoje você marcou{' '}
                      <span className="font-bold text-mint-300">
                        {meuHumor.icon} {meuHumor.label}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-parch-faint">Ainda não marcou seu humor hoje</p>
                  )}
                </div>
              </Panel>
            </Link>
          </motion.div>
        </div>

        {/* ---------- Último recadinho ---------- */}
        {ultima && (
          <motion.div variants={rise}>
            <Link to="/mensagens" className="block">
              <Panel glow="blush" interactive className="p-5">
                <p className="hud-label mb-2">Último recadinho</p>
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    💌
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-parch italic">"{ultima.text}"</p>
                    <p className="mt-1.5 text-xs text-parch-faint">
                      — {profile.names[ultima.from]} para{' '}
                      {profile.names[otherOf(ultima.from)]} ·{' '}
                      {new Date(ultima.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Panel>
            </Link>
          </motion.div>
        )}

        {/* ---------- As pastas ---------- */}
        <div>
          <p className="hud-label mt-2 mb-3">Pastas</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <QuestCard
              to="/mensagens"
              icon="💌"
              tone="blush"
              title="Recadinhos"
              description="Deixem declarações e elogios um para o outro."
              meta={messages.length > 0 ? `${messages.length}` : undefined}
            />
            <QuestCard
              to="/financas"
              icon="💎"
              tone="mint"
              title="Tesouro"
              description="Receitas, despesas e o saldo do casal."
              meta={transactions.length > 0 ? `${transactions.length}` : undefined}
            />
            <QuestCard
              to="/tarefas"
              icon="⚔️"
              tone="iris"
              title="Missões"
              description="As tarefas do dia, divididas entre vocês."
              meta={pendentes > 0 ? `${pendentes} aberta${pendentes === 1 ? '' : 's'}` : undefined}
            />
            <QuestCard
              to="/lazer"
              icon="🗺️"
              tone="gold"
              title="Aventuras"
              description="Programas, viagens e planos para curtir juntos."
              meta={planejados > 0 ? `${planejados} no plano` : undefined}
            />
            <QuestCard
              to="/diversao"
              icon="🕹️"
              tone="iris"
              title="Arcade"
              description="Sorteios, moeda e perguntas para o tédio."
              meta={
                counts.funPlays > 0
                  ? `${counts.funPlays} jogada${counts.funPlays === 1 ? '' : 's'}`
                  : undefined
              }
            />
            <QuestCard
              to="/calma"
              icon="🫧"
              tone="mint"
              title="Refúgio"
              description="Respiração guiada, bolhas e água para acalmar."
              meta={
                counts.calmMinutes > 0
                  ? `${counts.calmMinutes} sess${counts.calmMinutes === 1 ? 'ão' : 'ões'}`
                  : undefined
              }
            />
          </div>
        </div>

        {/* ---------- Rodapé de XP ---------- */}
        <motion.div variants={rise}>
          <Panel glow="gold" className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl" aria-hidden>
                ⭐
              </span>
              <p className="text-sm text-parch-dim">
                Vocês somam{' '}
                <span className="hud-value font-black text-gold-300">
                  <AnimatedNumber value={xp} /> XP
                </span>{' '}
                no total.
              </p>
            </div>
            <Link
              to="/conquistas"
              className="rounded-lg border border-gold-400/30 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-300 transition-colors hover:bg-gold-500/20"
            >
              Ver troféus →
            </Link>
          </Panel>
        </motion.div>
      </motion.div>
    </div>
  )
}
