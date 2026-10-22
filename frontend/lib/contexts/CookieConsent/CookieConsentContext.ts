import { createContext, useContext } from 'react'
import type { CookieConsentLevel } from '@/lib/types'

export interface CookieConsentPreferences {
  level: CookieConsentLevel
  /** Cookies comportamentais (RF18 / gate de eventos) */
  behavioral: boolean
  decidedAt: string | null
}

export interface CookieConsentValue {
  preferences: CookieConsentPreferences
  /** Ainda não escolheu nesta visita (ou expirado) */
  needsDecision: boolean
  acceptAll: () => void
  acceptEssential: () => void
  acceptCustom: (behavioral: boolean) => void
  canTrackBehavioral: boolean
}

export const CookieConsentContext = createContext<CookieConsentValue | null>(null)

export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error('useCookieConsent must be used within <CookieConsentProvider>')
  }
  return ctx
}
