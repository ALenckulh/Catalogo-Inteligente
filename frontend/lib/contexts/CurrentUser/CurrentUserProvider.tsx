'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession, LoginRequest, SignupRequest, Usuario } from '@/lib/types'
import {
  clearSession,
  login as apiLogin,
  loginAdmin as apiLoginAdmin,
  logout as apiLogout,
  persistSession,
  readStoredUser,
  signup as apiSignup,
} from '@/lib/api/auth'
import { SESSION_CLEARED_EVENT } from '@/lib/api/client'
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
      setUser(null)
    }
    window.addEventListener(SESSION_CLEARED_EVENT, onSessionCleared)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(SESSION_CLEARED_EVENT, onSessionCleared)
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
    setUser(null)
  }, [])

  const value = useMemo<CurrentUserValue>(
    () => ({
      user,
      loading,
      login,
      loginAdmin,
      signup,
      logout,
      isAuthenticated: user !== null && user.tipo !== 'ADMIN',
      isAdmin: user?.tipo === 'ADMIN',
    }),
    [user, loading, login, loginAdmin, signup, logout],
  )

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  )
}
