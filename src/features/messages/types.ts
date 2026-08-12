import type { PersonKey } from '../../context/ProfileContext'

export interface CuteMessage {
  id: string
  from: PersonKey
  text: string
  createdAt: string
  hearts: number
}
