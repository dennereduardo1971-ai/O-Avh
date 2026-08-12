import { motion } from 'framer-motion'
import { useLocalStorage } from '../../lib/storage'
import { todayISO } from '../../lib/gameMath'
import { useProfile, type PersonKey } from '../../context/ProfileContext'

/* Rótulos curtos de propósito: o painel de humor é estreito e nomes
   longos colidiam entre si na grade. */
export const MOODS = [
  { id: 'otimo', icon: '🤩', label: 'Ótimo', tone: 'text-gold-300' },
  { id: 'bem', icon: '🙂', label: 'Bem', tone: 'text-mint-300' },
  { id: 'neutro', icon: '😐', label: 'Neutro', tone: 'text-parch-dim' },
  { id: 'cansado', icon: '🥱', label: 'Cansaço', tone: 'text-iris-300' },
  { id: 'estressado', icon: '😮‍💨', label: 'Tenso', tone: 'text-blush-300' },
  { id: 'triste', icon: '🥺', label: 'Pra baixo', tone: 'text-blush-400' },
] as const

type MoodLog = Record<string, Partial<Record<PersonKey, string>>>

export function useTodayMoods() {
  const [log] = useLocalStorage<MoodLog>('casal:humor', {})
  return log[todayISO()] ?? {}
}

export default function MoodCheck() {
  const { profile, otherOf } = useProfile()
  const [log, setLog] = useLocalStorage<MoodLog>('casal:humor', {})

  const hoje = todayISO()
  const doDia = log[hoje] ?? {}
  const meu = doDia[profile.active]
  const outro = otherOf(profile.active)
  const doOutro = doDia[outro]

  const marcar = (moodId: string) =>
    setLog((prev) => ({
      ...prev,
      [hoje]: { ...(prev[hoje] ?? {}), [profile.active]: moodId },
    }))

  const moodDoOutro = MOODS.find((m) => m.id === doOutro)

  return (
    <div>
      <p className="text-sm text-parch-dim">
        Como <span className="font-semibold text-parch">{profile.names[profile.active]}</span> está
        hoje?
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {MOODS.map((m) => {
          const selecionado = meu === m.id
          return (
            <motion.button
              key={m.id}
              onClick={() => marcar(m.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-colors ${
                selecionado
                  ? 'border-mint-400/45 bg-mint-500/15'
                  : 'border-white/8 bg-white/4 hover:bg-white/8'
              }`}
            >
              <span className="text-xl" aria-hidden>
                {m.icon}
              </span>
              <span
                className={`w-full truncate text-center text-[10px] leading-tight font-semibold ${
                  selecionado ? 'text-mint-300' : 'text-parch-faint'
                }`}
              >
                {m.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
        {moodDoOutro ? (
          <p className="flex items-center gap-2 text-sm text-parch-dim">
            <span className="text-xl" aria-hidden>
              {moodDoOutro.icon}
            </span>
            <span>
              <span className="font-semibold text-parch">{profile.names[outro]}</span> marcou{' '}
              <span className={`font-semibold ${moodDoOutro.tone}`}>{moodDoOutro.label}</span> hoje.
            </span>
          </p>
        ) : (
          <p className="text-sm text-parch-faint">
            {profile.names[outro]} ainda não marcou o humor de hoje.
          </p>
        )}
      </div>
    </div>
  )
}
