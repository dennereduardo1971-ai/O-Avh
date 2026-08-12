export type LeisureStatus = 'ideia' | 'planejado' | 'feito'

export interface LeisureIdea {
  id: string
  title: string
  category: string
  status: LeisureStatus
  notes: string
  createdAt: string
}

export const CATEGORIAS_LAZER = [
  'Filme/Série',
  'Restaurante',
  'Viagem',
  'Casa',
  'Ar livre',
  'Cultura',
  'Outro',
] as const
