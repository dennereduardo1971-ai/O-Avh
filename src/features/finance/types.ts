import type { PersonKey } from '../../context/ProfileContext'

export type TransactionType = 'receita' | 'despesa'
export type PaidBy = PersonKey | 'ambos'

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: string
  paidBy: PaidBy
  date: string // yyyy-mm-dd
}

export const CATEGORIAS = [
  'Casa',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Presentes',
  'Salário',
  'Outros',
] as const
