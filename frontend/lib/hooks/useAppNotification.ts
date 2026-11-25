'use client'

import { App } from '@/components/ui'

/** Avisos do <App> da raiz: continuam na tela depois de navegar (ex.: "Produto criado" e volta para a lista). */
export function useAppNotification() {
  const { notification: api } = App.useApp()
  return { api }
}
