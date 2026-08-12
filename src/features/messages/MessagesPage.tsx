import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import { confettiPop } from '../../lib/confetti'
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
  const [messages, setMessages] = useLocalStorage<CuteMessage[]>('casal:mensagens', [])
  const [text, setText] = useState('')
  const [pulseId, setPulseId] = useState<string | null>(null)

  const enviar = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const nova: CuteMessage = {
      id: generateId(),
      from: profile.active,
      text: trimmed,
      createdAt: new Date().toISOString(),
      hearts: 0,
    }
    setMessages((prev) => [nova, ...prev])
    setText('')
    trigger({ xp: 10, xpLabel: 'Mensagem fofa enviada', xpIcon: '💌', countKey: 'messages' })
  }

  const curtir = (id: string, e: React.MouseEvent) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, hearts: m.hearts + 1 } : m)))
    setPulseId(id)
    setTimeout(() => setPulseId(null), 500)
    confettiPop({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    trigger({ xp: 2, xpLabel: 'Curtida enviada', xpIcon: '❤️', countKey: 'hearts' })
  }

  const remover = (id: string) => setMessages((prev) => prev.filter((m) => m.id !== id))

  const usarSugestao = () => {
    const sugestao = SUGESTOES[Math.floor(Math.random() * SUGESTOES.length)]
    setText(sugestao)
  }

  const destinatario = profile.names[otherOf(profile.active)]

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">💌 Mensagens Fofas</h1>
        <p className="mt-1 text-slate-500">
          Deixe um recadinho carinhoso para {destinatario}.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border border-white bg-white/80 p-4 shadow-sm"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Escreva algo fofo para ${destinatario}...`}
          rows={3}
          className="w-full resize-none rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={enviar}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            Enviar 💌
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95, rotate: -4 }}
            onClick={usarSugestao}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            ✨ Sugestão fofa
          </motion.button>
          <span className="ml-auto text-xs text-slate-400">enviando como {profile.names[profile.active]}</span>
        </div>
      </motion.div>

      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhuma mensagem ainda. Que tal mandar a primeira? 💕
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className={`rounded-2xl border p-4 shadow-sm ${
                  m.from === profile.active
                    ? 'ml-auto max-w-xl border-rose-200 bg-rose-100/70'
                    : 'mr-auto max-w-xl border-white bg-white/80'
                }`}
              >
                <p className="text-sm font-semibold text-rose-600">{profile.names[m.from]}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.text}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    {new Date(m.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <motion.button
                    whileTap={{ scale: 1.4 }}
                    animate={pulseId === m.id ? { scale: [1, 1.5, 1] } : {}}
                    onClick={(e) => curtir(m.id, e)}
                    className="hover:text-rose-500"
                  >
                    ❤️ {m.hearts}
                  </motion.button>
                  <button onClick={() => remover(m.id)} className="ml-auto hover:text-rose-500">
                    remover
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
