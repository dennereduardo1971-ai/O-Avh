import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateId } from '../../lib/storage'
import { useSyncedArea } from '../../lib/sync/hooks'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'
import AnimatedNumber from '../../components/AnimatedNumber'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import { CATEGORIAS, type PaidBy, type Transaction, type TransactionType } from './types'

const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function FinancePage() {
  const { profile } = useProfile()
  const { trigger } = useGame()
  const [transactions, setTransactions] = useSyncedArea<Transaction[]>('financas', [])

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('despesa')
  const [category, setCategory] = useState<(typeof CATEGORIAS)[number]>('Casa')
  const [paidBy, setPaidBy] = useState<PaidBy>(profile.active)
  const [date, setDate] = useState(todayISO())

  const adicionar = () => {
    const valor = Number(amount.replace(',', '.'))
    if (!description.trim() || !valor || valor <= 0) return
    setTransactions((prev) => [
      {
        id: generateId(),
        description: description.trim(),
        amount: valor,
        type,
        category,
        paidBy,
        date,
      },
      ...prev,
    ])
    setDescription('')
    setAmount('')
    trigger({
      xp: 5,
      xpLabel: type === 'receita' ? 'Receita registrada' : 'Despesa registrada',
      xpIcon: '💎',
      countKey: 'financeEntries',
    })
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
  const maiorGasto = Math.max(resumo.porPessoa.p1, resumo.porPessoa.p2, resumo.porPessoa.ambos, 1)

  return (
    <div>
      <SectionTitle icon="💎" title="Tesouro" subtitle="As contas do casal, sem susto." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Saldo', value: resumo.saldo, tone: resumo.saldo >= 0 ? 'mint' : 'blush' },
          { label: 'Receitas', value: resumo.receitas, tone: 'mint' },
          { label: 'Despesas', value: resumo.despesas, tone: 'blush' },
        ].map((s) => (
          <Panel key={s.label} glow={s.tone as 'mint' | 'blush'} className="p-4">
            <p className="hud-label">{s.label}</p>
            <p
              className={`hud-value mt-1.5 text-2xl font-black ${
                s.tone === 'mint' ? 'text-mint-300' : 'text-blush-300'
              }`}
            >
              <AnimatedNumber value={s.value} formatter={formatBRL} />
            </p>
          </Panel>
        ))}
      </div>

      {/* Quem gastou mais — com barras para leitura imediata */}
      <Panel glow="iris" className="mb-4 p-5">
        <p className="hud-label mb-3">Quem gastou mais</p>
        <div className="flex flex-col gap-2.5">
          {(['p1', 'p2', 'ambos'] as PaidBy[]).map((p) => (
            <div key={p} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs font-semibold text-parch-dim">
                {nomePagador(p)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-night-950/70">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-iris-500 to-blush-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(resumo.porPessoa[p] / maiorGasto) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                />
              </div>
              <span className="hud-value w-24 shrink-0 text-right text-xs font-bold text-parch">
                {formatBRL(resumo.porPessoa[p])}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel glow="mint" className="mb-6 p-5">
        <p className="hud-label mb-3">Novo lançamento</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (ex: supermercado)"
            className="field"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (ex: 150.00)"
            inputMode="decimal"
            className="field"
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="field"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIAS)[number])}
            className="field"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as PaidBy)} className="field">
            <option value="p1">{profile.names.p1}</option>
            <option value="p2">{profile.names.p2}</option>
            <option value="ambos">Os dois</option>
          </select>
        </div>
        <GameButton onClick={adicionar} className="mt-4">
          Adicionar lançamento
        </GameButton>
      </Panel>

      {ordenadas.length === 0 ? (
        <Panel glow="none" className="p-10 text-center">
          <p className="text-3xl" aria-hidden>
            💎
          </p>
          <p className="mt-2 text-sm text-parch-faint">Nenhum lançamento ainda.</p>
        </Panel>
      ) : (
        <Panel glow="none" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/4">
                  {['Data', 'Descrição', 'Categoria', 'Pago por'].map((h) => (
                    <th key={h} className="hud-label px-4 py-3">
                      {h}
                    </th>
                  ))}
                  <th className="hud-label px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {ordenadas.map((t) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0, backgroundColor: 'rgba(94,234,212,0.14)' }}
                      animate={{ opacity: 1, backgroundColor: 'rgba(94,234,212,0)' }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.5 }}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-parch-dim">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-parch">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-parch-dim">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-parch-dim">{nomePagador(t.paidBy)}</td>
                      <td
                        className={`hud-value px-4 py-3 text-right font-bold whitespace-nowrap ${
                          t.type === 'receita' ? 'text-mint-300' : 'text-blush-300'
                        }`}
                      >
                        {t.type === 'receita' ? '+' : '−'}
                        {formatBRL(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remover(t.id)}
                          className="text-xs text-parch-faint transition-colors hover:text-blush-300"
                        >
                          remover
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
