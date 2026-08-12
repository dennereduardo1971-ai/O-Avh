import { useState } from 'react'
import { useProfile } from '../../context/ProfileContext'

export default function SettingsPage() {
  const { profile, setName } = useProfile()
  const [p1, setP1] = useState(profile.names.p1)
  const [p2, setP2] = useState(profile.names.p2)
  const [salvo, setSalvo] = useState(false)

  const salvar = () => {
    setName('p1', p1.trim())
    setName('p2', p2.trim())
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">⚙️ Configurações</h1>
        <p className="mt-1 text-slate-500">Ajustem os nomes de vocês dois no aplicativo.</p>
      </header>

      <div className="max-w-md rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
        <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
          Nome da pessoa 1
        </label>
        <input
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          className="mb-4 w-full rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
        />

        <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
          Nome da pessoa 2
        </label>
        <input
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          className="mb-4 w-full rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
        />

        <button
          onClick={salvar}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
        >
          Salvar
        </button>
        {salvo && <span className="ml-3 text-sm text-emerald-600">Salvo! ✅</span>}
      </div>

      <p className="mt-6 max-w-md text-xs text-slate-400">
        Todos os dados deste app (mensagens, finanças, tarefas, lazer) ficam salvos apenas neste
        navegador, no armazenamento local do dispositivo — nada é enviado para a internet.
      </p>
    </div>
  )
}
