'use client'

import { notification } from '@/components/ui'

export function useAppNotification() {
  const [api, contextHolder] = notification.useNotification()
  return { api, contextHolder }
}
