import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'
import { useSyncedArea } from '../../lib/sync/hooks'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import type { CuteMessage } from './types'

const SUGESTOES = [
  'Só passando pra dizer que estou pensando em você 💕',
  'Você fez meu dia melhor hoje, sabia?',
  'Com você a rotina fica mais leve.',
  'Tenho muita sorte de dividir a vida com você.',
  'Já disse hoje que te amo? Então: eu te amo! ❤️',
  'Sinto sua falta e ainda nem saímos de casa juntos hoje.',
  'Você é meu programa favorito, mesmo nos dias mais corridos.',
  'Obrigado(a) por cuidar de nós dois.',
]

export default function MessagesPage() {
  const { profile, otherOf } = useProfile()
  const { trigger } = useGame()
  const [messages, setMessages] = useSyncedArea<CuteMessage[]>('mensagens', [])
  const [text, setText] = useState('')
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const enviar = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [
      {
        id: generateId(),
        from: profile.active,
        text: trimmed,
        createdAt: new Date().toISOString(),
        hearts: 0,
      },
      ...prev,
    ])
    setText('')
    trigger({ xp: 10, xpLabel: 'Recadinho enviado', xpIcon: '💌', countKey: 'messages' })
  }

  const curtir = (id: string, origem: { x: number; y: number } = { x: 0.5, y: 0.42 }) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, hearts: m.hearts + 1 } : m)))
    setPulseId(id)
    setTimeout(() => setPulseId(null), 500)
    confettiPop(origem)
    trigger({ xp: 2, xpLabel: 'Curtida enviada', xpIcon: '❤️', countKey: 'hearts' })
  }

  const remover = (id: string) => setMessages((prev) => prev.filter((m) => m.id !== id))

  const usarSugestao = () => setText(SUGESTOES[Math.floor(Math.random() * SUGESTOES.length)])

  // Vindo de uma notificação: "❤️ Retribuir" já curte o recadinho certo, e
  // "💌 Agradecer" chega com o texto pronto no compositor — o casal só revisa
  // e manda, sem digitar do zero. Roda uma vez só, ao abrir por esse link.
  useEffect(() => {
    const curtirId = searchParams.get('curtir')
    const rascunho = searchParams.get('rascunho')
    if (!curtirId && !rascunho) return

    if (curtirId) curtir(curtirId)
    if (rascunho) setText(rascunho)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na primeira renderização, ao chegar pela notificação
  }, [])

  const destinatario = profile.names[otherOf(profile.active)]

  return (
    <div>
      <SectionTitle
        icon="💌"
        title="Recadinhos"
        subtitle={`Deixe algo carinhoso para ${destinatario}.`}
      />

      <Panel glow="blush" className="mb-7 p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Escreva algo fofo para ${destinatario}...`}
          rows={3}
          className="field resize-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <GameButton onClick={enviar} disabled={!text.trim()}>
            Enviar 💌
          </GameButton>
          <GameButton onClick={usarSugestao} variant="soft">
            ✨ Sugestão
          </GameButton>
          <span className="hud-label ml-auto">como {profile.names[profile.active]}</span>
        </div>
      </Panel>

      {messages.length === 0 ? (
        <Panel glow="none" className="p-10 text-center">
          <p className="text-3xl" aria-hidden>
            💌
          </p>
          <p className="mt-2 text-sm text-parch-faint">
            Nenhum recadinho ainda. Que tal mandar o primeiro?
          </p>
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const meu = m.from === profile.active
              return (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className={meu ? 'ml-auto w-full max-w-xl' : 'mr-auto w-full max-w-xl'}
                >
                  <Panel glow={meu ? 'blush' : 'iris'} className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${meu ? 'bg-blush-400' : 'bg-iris-400'}`}
                      />
                      <p
                        className={`text-xs font-bold ${meu ? 'text-blush-300' : 'text-iris-300'}`}
                      >
                        {profile.names[m.from]}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-parch">{m.text}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-parch-faint">
                      <span>
                        {new Date(m.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <motion.button
                        whileTap={{ scale: 1.35 }}
                        animate={pulseId === m.id ? { scale: [1, 1.45, 1] } : {}}
                        onClick={(e) =>
                          curtir(m.id, { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
                        }
                        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 transition-colors hover:border-blush-400/40 hover:text-blush-300"
                      >
                        ❤️ {m.hearts}
                      </motion.button>
                      <button
                        onClick={() => remover(m.id)}
                        className="ml-auto transition-colors hover:text-blush-300"
                      >
                        remover
                      </button>
                    </div>
                  </Panel>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
