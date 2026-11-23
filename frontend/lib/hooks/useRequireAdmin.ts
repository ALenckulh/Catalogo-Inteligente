'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

/**
 * Só experiência de uso: manda quem não é admin para o login. A proteção real é o
 * hasRole("ADMIN") no backend; nunca se confia no front.
 */
export function useRequireAdmin() {
  const router = useRouter()
  const { isAdmin, loading } = useCurrentUser()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin/entrar')
    }
  }, [loading, isAdmin, router])

  return { isAdmin, loading }
}
