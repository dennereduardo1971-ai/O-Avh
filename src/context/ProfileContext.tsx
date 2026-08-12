import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../lib/storage'

export type PersonKey = 'p1' | 'p2'

export interface CoupleProfile {
  names: Record<PersonKey, string>
  active: PersonKey
}

const DEFAULT_PROFILE: CoupleProfile = {
  names: { p1: 'Você', p2: 'Sara' },
  active: 'p1',
}

interface ProfileContextValue {
  profile: CoupleProfile
  setActive: (person: PersonKey) => void
  setName: (person: PersonKey, name: string) => void
  otherOf: (person: PersonKey) => PersonKey
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useLocalStorage<CoupleProfile>(
    'casal:perfil',
    DEFAULT_PROFILE,
  )

  const setActive = (person: PersonKey) =>
    setProfile((prev) => ({ ...prev, active: person }))

  const setName = (person: PersonKey, name: string) =>
    setProfile((prev) => ({
      ...prev,
      names: { ...prev.names, [person]: name || DEFAULT_PROFILE.names[person] },
    }))

  const otherOf = (person: PersonKey): PersonKey => (person === 'p1' ? 'p2' : 'p1')

  return (
    <ProfileContext.Provider value={{ profile, setActive, setName, otherOf }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile precisa estar dentro de ProfileProvider')
  return ctx
}
