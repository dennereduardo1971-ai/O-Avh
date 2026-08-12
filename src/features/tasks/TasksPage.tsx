import { useMemo, useState } from 'react'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useProfile } from '../../context/ProfileContext'
import type { AssignedTo, DailyTask } from './types'

export default function TasksPage() {
  const { profile } = useProfile()
  const [tasks, setTasks] = useLocalStorage<DailyTask[]>('casal:tarefas', [])
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState<AssignedTo>(profile.active)
  const [filtro, setFiltro] = useState<'todas' | AssignedTo>('todas')

  const adicionar = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const nova: DailyTask = {
      id: generateId(),
      title: trimmed,
      assignedTo,
      done: false,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, nova])
    setTitle('')
  }

  const alternar = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remover = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))

  const resetarDia = () => setTasks((prev) => prev.map((t) => ({ ...t, done: false })))

  const nomeResponsavel = (a: AssignedTo) => (a === 'ambos' ? 'Os dois' : profile.names[a])

  const visiveis = tasks.filter((t) => filtro === 'todas' || t.assignedTo === filtro)

  const progresso = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
  }, [tasks])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">✅ Tarefas Diárias</h1>
        <p className="mt-1 text-slate-500">Organizem o que precisa ser feito hoje.</p>
      </header>

      <div className="mb-6 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Progresso do dia</span>
          <span className="text-slate-400">{progresso}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-rose-100">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <button
          onClick={resetarDia}
          className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
        >
          🔄 Resetar tarefas para um novo dia
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Nova tarefa (ex: lavar louça)"
          className="min-w-[200px] flex-1 rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value as AssignedTo)}
          className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
        >
          <option value="p1">{profile.names.p1}</option>
          <option value="p2">{profile.names.p2}</option>
          <option value="ambos">Os dois</option>
        </select>
        <button
          onClick={adicionar}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
        >
          Adicionar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(['todas', 'p1', 'p2', 'ambos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              filtro === f ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 ring-1 ring-rose-100'
            }`}
          >
            {f === 'todas' ? 'Todas' : nomeResponsavel(f)}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhuma tarefa por aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => alternar(t.id)}
                className="h-4 w-4 accent-rose-500"
              />
              <span className={`flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {t.title}
              </span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-500">
                {nomeResponsavel(t.assignedTo)}
              </span>
              <button onClick={() => remover(t.id)} className="text-xs text-slate-400 hover:text-rose-500">
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
