'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CookieConsentLevel } from '@/lib/types'
import { VISITANTE_COOKIE_KEY } from '@/lib/api/config'
import {
  CookieConsentContext,
  type CookieConsentPreferences,
  type CookieConsentValue,
} from './CookieConsentContext'

const STORAGE_KEY = 'ci_cookie_consent'
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

const defaultPrefs: CookieConsentPreferences = {
  level: 'essential',
  behavioral: false,
  decidedAt: null,
}

interface StoredConsent {
  level: CookieConsentLevel
  behavioral: boolean
  decidedAt: string
}

function ensureVisitanteId(): void {
  if (typeof window === 'undefined') return
  try {
    if (!window.localStorage.getItem(VISITANTE_COOKIE_KEY)) {
      window.localStorage.setItem(VISITANTE_COOKIE_KEY, crypto.randomUUID())
    }
  } catch {
    /* ignore */
  }
}

function readStored(): CookieConsentPreferences {
  if (typeof window === 'undefined') return defaultPrefs
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPrefs
    const parsed = JSON.parse(raw) as StoredConsent
    const age = Date.now() - new Date(parsed.decidedAt).getTime()
    if (Number.isNaN(age) || age > TWELVE_MONTHS_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      return defaultPrefs
    }
    return {
      level: parsed.level,
      behavioral: parsed.behavioral,
      decidedAt: parsed.decidedAt,
    }
  } catch {
    return defaultPrefs
  }
}

interface Props {
  children: React.ReactNode
}

export function CookieConsentProvider({ children }: Props) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(defaultPrefs)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      ensureVisitanteId()
      setPreferences(readStored())
      setHydrated(true)
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  const persist = useCallback((level: CookieConsentLevel, behavioral: boolean) => {
    const decidedAt = new Date().toISOString()
    const next: CookieConsentPreferences = { level, behavioral, decidedAt }
    setPreferences(next)
    try {
      const stored: StoredConsent = { level, behavioral, decidedAt }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      /* ignore */
    }
  }, [])

  const acceptAll = useCallback(() => persist('all', true), [persist])
  const acceptEssential = useCallback(() => persist('essential', false), [persist])
  const acceptCustom = useCallback(
    (behavioral: boolean) => persist('custom', behavioral),
    [persist],
  )

  const value = useMemo<CookieConsentValue>(
    () => ({
      preferences,
      needsDecision: hydrated && preferences.decidedAt === null,
      acceptAll,
      acceptEssential,
      acceptCustom,
      canTrackBehavioral: preferences.behavioral,
    }),
    [preferences, hydrated, acceptAll, acceptEssential, acceptCustom],
  )

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  )
}
