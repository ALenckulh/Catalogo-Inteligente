'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

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
