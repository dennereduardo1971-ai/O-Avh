import { useState } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { PERGUNTAS_DO_DIA } from './questions'

function sorteiaPergunta(atual: string) {
  if (PERGUNTAS_DO_DIA.length <= 1) return PERGUNTAS_DO_DIA[0]
  let nova = atual
  while (nova === atual) {
    nova = PERGUNTAS_DO_DIA[Math.floor(Math.random() * PERGUNTAS_DO_DIA.length)]
  }
  return nova
}

export default function FunPage() {
  const { profile } = useProfile()

  const [pergunta, setPergunta] = useState(PERGUNTAS_DO_DIA[0])
  const [lista, setLista] = useState('pizza\nmassa\nsushi')
  const [sorteado, setSorteado] = useState<string | null>(null)
  const [moeda, setMoeda] = useState<string | null>(null)
  const [decisor, setDecisor] = useState<string | null>(null)

  const novaPergunta = () => setPergunta((atual) => sorteiaPergunta(atual))

  const sortear = () => {
    const itens = lista
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (itens.length === 0) return
    setSorteado(itens[Math.floor(Math.random() * itens.length)])
  }

  const jogarMoeda = () => setMoeda(Math.random() < 0.5 ? 'Cara' : 'Coroa')

  const escolherDecisor = () =>
    setDecisor(Math.random() < 0.5 ? profile.names.p1 : profile.names.p2)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🎲 Diversão</h1>
        <p className="mt-1 text-slate-500">Umas brincadeiras rápidas para quando bater o tédio.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">💬 Pergunta do dia</h2>
          <p className="mt-3 rounded-xl bg-rose-50 p-4 text-slate-700">{pergunta}</p>
          <button
            onClick={novaPergunta}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            🔀 Outra pergunta
          </button>
        </section>

        <section className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">🎯 Sorteio / roleta de decisões</h2>
          <p className="mt-1 text-xs text-slate-400">Um item por linha (ex: opções de jantar, filme, etc.)</p>
          <textarea
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          />
          <button
            onClick={sortear}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            🎲 Sortear
          </button>
          {sorteado && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-center font-semibold text-emerald-700">
              {sorteado}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">🪙 Cara ou coroa</h2>
          <p className="mt-1 text-xs text-slate-400">Pra desempatar aquela discussão boba.</p>
          <button
            onClick={jogarMoeda}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            Jogar a moeda
          </button>
          {moeda && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-center text-2xl font-bold text-amber-700">
              {moeda === 'Cara' ? '🙂 Cara' : '👑 Coroa'}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">🙋 Quem decide hoje?</h2>
          <p className="mt-1 text-xs text-slate-400">Sorteia quem escolhe o programa de hoje.</p>
          <button
            onClick={escolherDecisor}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
          >
            Sortear responsável
          </button>
          {decisor && (
            <p className="mt-3 rounded-xl bg-fuchsia-50 p-3 text-center text-lg font-semibold text-fuchsia-700">
              {decisor} decide hoje! 🎉
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
