import type { PersonKey } from '../../context/ProfileContext'

export type AssignedTo = PersonKey | 'ambos'

export interface DailyTask {
  id: string
  title: string
  assignedTo: AssignedTo
  done: boolean
  createdAt: string
}
