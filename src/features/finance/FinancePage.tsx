import { useMemo, useState } from 'react'
import { useLocalStorage, generateId } from '../../lib/storage'
import { useProfile } from '../../context/ProfileContext'
import { CATEGORIAS, type PaidBy, type Transaction, type TransactionType } from './types'

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function FinancePage() {
  const { profile } = useProfile()
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('casal:financas', [])

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('despesa')
  const [category, setCategory] = useState<(typeof CATEGORIAS)[number]>('Casa')
  const [paidBy, setPaidBy] = useState<PaidBy>(profile.active)
  const [date, setDate] = useState(todayISO())

  const adicionar = () => {
    const valor = Number(amount.replace(',', '.'))
    if (!description.trim() || !valor || valor <= 0) return
    const nova: Transaction = {
      id: generateId(),
      description: description.trim(),
      amount: valor,
      type,
      category,
      paidBy,
      date,
    }
    setTransactions((prev) => [nova, ...prev])
    setDescription('')
    setAmount('')
  }

  const remover = (id: string) => setTransactions((prev) => prev.filter((t) => t.id !== id))

  const resumo = useMemo(() => {
    const receitas = transactions.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
    const despesas = transactions.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
    const porPessoa: Record<PaidBy, number> = { p1: 0, p2: 0, ambos: 0 }
    transactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        porPessoa[t.paidBy] += t.amount
      })
    return { receitas, despesas, saldo: receitas - despesas, porPessoa }
  }, [transactions])

  const ordenadas = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  const nomePagador = (p: PaidBy) => (p === 'ambos' ? 'Os dois' : profile.names[p])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">💰 Finanças do Casal</h1>
        <p className="mt-1 text-slate-500">Registrem receitas e despesas para manter as contas em dia.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-400">Saldo</p>
          <p className={`mt-1 text-xl font-bold ${resumo.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatBRL(resumo.saldo)}
          </p>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-400">Receitas</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{formatBRL(resumo.receitas)}</p>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-400">Despesas</p>
          <p className="mt-1 text-xl font-bold text-rose-600">{formatBRL(resumo.despesas)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase text-slate-400">Quem gastou mais</p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>{profile.names.p1}: <strong>{formatBRL(resumo.porPessoa.p1)}</strong></span>
          <span>{profile.names.p2}: <strong>{formatBRL(resumo.porPessoa.p2)}</strong></span>
          <span>Os dois: <strong>{formatBRL(resumo.porPessoa.ambos)}</strong></span>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Novo lançamento</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (ex: supermercado)"
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (ex: 150.00)"
            inputMode="decimal"
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIAS)[number])}
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as PaidBy)}
            className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 text-sm outline-none focus:border-rose-300"
          >
            <option value="p1">{profile.names.p1}</option>
            <option value="p2">{profile.names.p2}</option>
            <option value="ambos">Os dois</option>
          </select>
        </div>
        <button
          onClick={adicionar}
          className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
        >
          Adicionar lançamento
        </button>
      </div>

      {ordenadas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rose-200 p-6 text-center text-sm text-slate-400">
          Nenhum lançamento ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white bg-white/80 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Pago por</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((t) => (
                <tr key={t.id} className="border-t border-rose-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2">{t.description}</td>
                  <td className="px-4 py-2">{t.category}</td>
                  <td className="px-4 py-2">{nomePagador(t.paidBy)}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium whitespace-nowrap ${
                      t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'receita' ? '+' : '-'}
                    {formatBRL(t.amount)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => remover(t.id)} className="text-xs text-slate-400 hover:text-rose-500">
                      remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
