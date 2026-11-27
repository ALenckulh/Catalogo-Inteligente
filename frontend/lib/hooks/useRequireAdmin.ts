'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminEntrarHref } from '@/lib/navigation'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

/**
 * Só experiência de uso: manda quem não é admin para o login. A proteção real é o
 * hasRole("ADMIN") no backend; nunca se confia no front.
 *
 * @param voltar false ao sair da conta: o próximo login não precisa voltar a esta tela
 */
export function useRequireAdmin(voltar = true) {
  const router = useRouter()
  const { isAdmin, loading } = useCurrentUser()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace(
        voltar ? adminEntrarHref(window.location.pathname + window.location.search) : '/admin/entrar',
      )
    }
  }, [loading, isAdmin, router, voltar])

  return { isAdmin, loading }
}
