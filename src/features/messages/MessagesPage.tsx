import { useState } from 'react'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useProfile } from '../../context/ProfileContext'
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
  const [messages, setMessages] = useLocalStorage<CuteMessage[]>('casal:mensagens', [])
  const [text, setText] = useState('')

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
  }

  const curtir = (id: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, hearts: m.hearts + 1 } : m)))

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

      <div className="mb-8 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Escreva algo fofo para ${destinatario}...`}
          rows={3}
          className="w-full resize-none rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-sm outline-none focus:border-rose-300"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={enviar}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            Enviar 💌
          </button>
          <button
            onClick={usarSugestao}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            ✨ Sugestão fofa
          </button>
          <span className="ml-auto text-xs text-slate-400">enviando como {profile.names[profile.active]}</span>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhuma mensagem ainda. Que tal mandar a primeira? 💕
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
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
                <button onClick={() => curtir(m.id)} className="hover:text-rose-500">
                  ❤️ {m.hearts}
                </button>
                <button onClick={() => remover(m.id)} className="ml-auto hover:text-rose-500">
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
