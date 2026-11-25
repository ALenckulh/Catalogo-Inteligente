import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/api/config'
import { useCurrentUser } from './CurrentUserContext'
import { CurrentUserProvider } from './CurrentUserProvider'

vi.mock('@/lib/api/config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))

function Probe() {
  const { user, isAuthenticated } = useCurrentUser()
  return <span data-testid="quem">{`${user?.id ?? 'ninguem'} ${isAuthenticated}`}</span>
}

/** Grava como outra aba faria: o storage muda sem passar por este provider. */
function outraAba(usuario: { id: number; tipo: string } | null) {
  if (usuario) {
    localStorage.setItem(AUTH_TOKEN_KEY, `a.${usuario.id}.c`)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(usuario))
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }
}
const avisar = (key: string | null) => act(() => void window.dispatchEvent(new StorageEvent('storage', { key })))
const quem = (texto: string) => waitFor(() => expect(screen.getByTestId('quem')).toHaveTextContent(texto))

beforeEach(async () => {
  localStorage.clear()
  outraAba({ id: 173, tipo: 'PF' })
  render(
    <CurrentUserProvider>
      <Probe />
    </CurrentUserProvider>,
  )
  await quem('173 true')
})
afterEach(cleanup)

describe('conta em outra aba', () => {
  it('troca de conta: acompanha o usuário do token', async () => {
    outraAba({ id: 161, tipo: 'PJ' })
    avisar(AUTH_USER_KEY)
    await quem('161 true')
  })

  it('logout (chave removida) e storage limpo: sai também aqui', async () => {
    outraAba(null)
    avisar(AUTH_USER_KEY)
    await quem('ninguem false')

    outraAba({ id: 173, tipo: 'PF' })
    avisar(AUTH_USER_KEY)
    await quem('173 true')
    localStorage.clear()
    avisar(null)
    await quem('ninguem false')
  })

  it('outra chave não muda nada', async () => {
    outraAba({ id: 161, tipo: 'PJ' })
    avisar('ci_sessao_id')
    await quem('173 true')
  })

  it('volta do cache do navegador: relê o usuário', async () => {
    outraAba({ id: 161, tipo: 'PJ' })
    act(() => void window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
    await quem('161 true')
  })
})
