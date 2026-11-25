'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession, LoginRequest, SignupRequest, Usuario } from '@/lib/types'
import {
  clearSession,
  login as apiLogin,
  loginAdmin as apiLoginAdmin,
  logout as apiLogout,
  persistSession,
  persistUser,
  readStoredUser,
  signup as apiSignup,
} from '@/lib/api/auth'
import { SESSION_CLEARED_EVENT } from '@/lib/api/client'
import { AUTH_USER_KEY } from '@/lib/api/config'
import { esquecerVisitante } from '@/lib/api/visitanteId'
import { CurrentUserContext, type CurrentUserValue } from './CurrentUserContext'

interface Props {
  children: React.ReactNode
}

export function CurrentUserProvider({ children }: Props) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setUser(readStoredUser())
      setLoading(false)
    }, 0)
    function onSessionCleared() {
      esquecerVisitante()
      setUser(null)
    }
    // Login, logout ou troca de conta em outra aba: as chamadas já usariam o token novo, então a tela tem de
    // acompanhar (senão salvar aqui gravaria na outra conta). ci_auth_user é a última chave gravada no login.
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === AUTH_USER_KEY) setUser(readStoredUser())
    }
    // Página que voltou do cache do navegador não recebeu os eventos de storage enquanto estava congelada.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) setUser(readStoredUser())
    }
    window.addEventListener(SESSION_CLEARED_EVENT, onSessionCleared)
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(SESSION_CLEARED_EVENT, onSessionCleared)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const applySession = useCallback((session: AuthSession) => {
    persistSession(session)
    setUser(session.usuario)
    try {
      if (session.usuario.tipo !== 'ADMIN') {
        window.sessionStorage.setItem('ci_migrar_pending', '1')
      }
    } catch {
      /* ignore */
    }
    return session
  }, [])

  const login = useCallback(
    async (body: LoginRequest) => applySession(await apiLogin(body)),
    [applySession],
  )

  const loginAdmin = useCallback(
    async (body: LoginRequest) => applySession(await apiLoginAdmin(body)),
    [applySession],
  )

  const signup = useCallback(
    async (body: SignupRequest) => applySession(await apiSignup(body)),
    [applySession],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    clearSession()
    esquecerVisitante()
    setUser(null)
  }, [])

  const updateUser = useCallback((usuario: Usuario) => {
    persistUser(usuario)
    setUser(usuario)
  }, [])

  const value = useMemo<CurrentUserValue>(
    () => ({
      user,
      loading,
      login,
      loginAdmin,
      signup,
      logout,
      updateUser,
      isAuthenticated: user !== null && user.tipo !== 'ADMIN',
      isAdmin: user?.tipo === 'ADMIN',
    }),
    [user, loading, login, loginAdmin, signup, logout, updateUser],
  )

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  )
}
