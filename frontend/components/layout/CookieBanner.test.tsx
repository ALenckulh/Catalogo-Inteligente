import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CookieBanner } from '@/components/layout/CookieBanner'
import {
  CookieConsentContext,
  type CookieConsentValue,
} from '@/lib/contexts/CookieConsent/CookieConsentContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

function renderBanner(overrides: Partial<CookieConsentValue> = {}) {
  const value: CookieConsentValue = {
    preferences: { level: 'essential', behavioral: false, decidedAt: null },
    needsDecision: true,
    acceptAll: vi.fn(),
    acceptEssential: vi.fn(),
    acceptCustom: vi.fn(),
    canTrackBehavioral: false,
    ...overrides,
  }
  return {
    value,
    ...render(
      <CookieConsentContext.Provider value={value}>
        <CookieBanner />
      </CookieConsentContext.Provider>,
    ),
  }
}

describe('CookieBanner', () => {
  it('renders nothing when decision already made', () => {
    const { container } = renderBanner({ needsDecision: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('calls acceptAll and acceptEssential', async () => {
    const user = userEvent.setup()
    const { value } = renderBanner()
    await user.click(screen.getByRole('button', { name: /Aceitar todos/i }))
    expect(value.acceptAll).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Apenas essenciais/i }))
    expect(value.acceptEssential).toHaveBeenCalled()
  })
})
