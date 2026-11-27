import { createContext, useContext } from 'react'
import type { AuthSession, LoginRequest, SignupRequest, Usuario } from '@/lib/types'

export interface CurrentUserValue {
  user: Usuario | null
  loading: boolean
  login: (body: LoginRequest) => Promise<AuthSession>
  loginAdmin: (body: LoginRequest) => Promise<AuthSession>
  signup: (body: SignupRequest) => Promise<AuthSession>
  logout: () => Promise<void>
  /** Atualiza o usuário logado (header + localStorage) depois de editar a conta. */
  updateUser: (usuario: Usuario) => void
  isAuthenticated: boolean
  isAdmin: boolean
}

export const CurrentUserContext = createContext<CurrentUserValue | null>(null)

export function useCurrentUser(): CurrentUserValue {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error('useCurrentUser must be used within <CurrentUserProvider>')
  }
  return ctx
}
