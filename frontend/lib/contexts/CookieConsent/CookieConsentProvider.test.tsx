import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { CookieConsentProvider } from '@/lib/contexts/CookieConsent/CookieConsentProvider'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'

vi.mock('@/lib/api/visitantes', () => ({
  abrirSessaoVisitante: vi.fn().mockResolvedValue(undefined),
}))

function Probe() {
  const { needsDecision, acceptAll, acceptEssential, preferences } = useCookieConsent()
  return (
    <div>
      <span data-testid="needs">{String(needsDecision)}</span>
      <span data-testid="level">{preferences.level}</span>
      <button type="button" onClick={acceptAll}>
        all
      </button>
      <button type="button" onClick={acceptEssential}>
        essential
      </button>
    </div>
  )
}

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('needs decision after hydrate then persists acceptAll', async () => {
    const user = userEvent.setup()
    render(
      <CookieConsentProvider>
        <Probe />
      </CookieConsentProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('needs')).toHaveTextContent('true'))

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'all' }))
    })

    await waitFor(() => {
      expect(screen.getByTestId('needs')).toHaveTextContent('false')
      expect(screen.getByTestId('level')).toHaveTextContent('all')
    })
    expect(window.localStorage.getItem('ci_cookie_consent')).toContain('"level":"all"')
  })
})
