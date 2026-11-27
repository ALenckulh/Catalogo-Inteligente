import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest'
import { CookieConsentProvider } from '@/lib/contexts/CookieConsent/CookieConsentProvider'
import { apiClient } from '@/lib/api/client'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'

vi.mock('@/lib/api/config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))

// Nunca vai à rede, mesmo que o provider volte a chamar a API.
const post = vi.spyOn(apiClient, 'post')

function Probe() {
  const { needsDecision, acceptAll, acceptEssential, acceptIfUndecided, preferences } = useCookieConsent()
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
      <button type="button" onClick={acceptIfUndecided}>
        cadastro
      </button>
      <span data-testid="behavioral">{String(preferences.behavioral)}</span>
    </div>
  )
}

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    post.mockReset().mockResolvedValue({ data: {} })
  })
  afterEach(cleanup)

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

  it.each([
    ['all', 'true'],
    ['essential', 'false'],
    [null, 'true'],
  ])('cadastro depois de %s: coleta neste navegador = %s', async (escolha, esperado) => {
    const user = userEvent.setup()
    render(
      <CookieConsentProvider>
        <Probe />
      </CookieConsentProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('needs')).toHaveTextContent('true'))
    if (escolha) await user.click(screen.getByRole('button', { name: escolha }))
    await user.click(screen.getByRole('button', { name: 'cadastro' }))
    expect(screen.getByTestId('behavioral')).toHaveTextContent(esperado)
    expect(screen.getByTestId('needs')).toHaveTextContent('false')
  })

  it('não abre sessão de visitante ao aceitar nem ao recarregar (ela nasce no primeiro evento)', async () => {
    const user = userEvent.setup()
    const tela = (
      <CookieConsentProvider>
        <Probe />
      </CookieConsentProvider>
    )
    const { unmount } = render(tela)
    await waitFor(() => expect(screen.getByTestId('needs')).toHaveTextContent('true'))
    await user.click(screen.getByRole('button', { name: 'all' }))
    await waitFor(() => expect(screen.getByTestId('level')).toHaveTextContent('all'))
    unmount()

    render(tela)
    await waitFor(() => expect(screen.getByTestId('level')).toHaveTextContent('all'))
    expect(post).not.toHaveBeenCalled()
  })
})
