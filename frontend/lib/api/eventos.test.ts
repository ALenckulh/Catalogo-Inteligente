import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from './client'
import { AUTH_TOKEN_KEY } from './config'
import { registrarEnvioInicial } from '@/lib/consentSync'
import { liberarEventos, trackEvent } from './eventos'
import { garantirSessao, readSessaoId, reabrirSessao } from './visitantes'

vi.mock('./config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))
vi.mock('./visitantes', () => ({ garantirSessao: vi.fn(), readSessaoId: vi.fn(), reabrirSessao: vi.fn() }))

const post = vi.spyOn(apiClient, 'post')
const evento = { tipo: 'VISUALIZACAO_PRODUTO', produtoId: 1 } as const
const sessoesEnviadas = () => post.mock.calls.map(([, body]) => (body as { sessaoId?: number }).sessaoId)

beforeEach(() => {
  post.mockReset().mockResolvedValue({})
  vi.mocked(garantirSessao).mockReset().mockResolvedValue(5)
  vi.mocked(reabrirSessao).mockReset().mockResolvedValue(6)
  vi.mocked(readSessaoId).mockReset().mockReturnValue(4)
})

describe('trackEvent', () => {
  it('espera a sessão da visita e envia o id dela, não o antigo', async () => {
    await trackEvent(evento)
    expect(sessoesEnviadas()).toEqual([5])
  })

  it.each(['INVALID_SESSAO', 'INVALID_COOKIE'])('%s: reabre a sessão e reenvia uma vez', async (code) => {
    post.mockRejectedValueOnce(new ApiError(code, 'x', 400))
    await trackEvent(evento)
    expect(sessoesEnviadas()).toEqual([5, 6])
  })

  it('recusado de novo: para na segunda tentativa', async () => {
    post.mockRejectedValue(new ApiError('INVALID_SESSAO', 'x', 400))
    await expect(trackEvent(evento)).rejects.toThrow()
    expect(sessoesEnviadas()).toEqual([5, 6])
  })

  it('outro erro (ex.: sem consentimento) não reenvia', async () => {
    post.mockRejectedValueOnce(new ApiError('CONSENT_REQUIRED', 'x', 403))
    await expect(trackEvent(evento)).rejects.toThrow()
    expect(sessoesEnviadas()).toEqual([5])
    expect(reabrirSessao).not.toHaveBeenCalled()
  })

  it('conta recusou (403): para de enviar até trocar de login ou aceitar em /conta', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'ana')
    post.mockRejectedValueOnce(new ApiError('CONSENT_REQUIRED', 'x', 403))
    await expect(trackEvent(evento)).rejects.toThrow()
    await trackEvent(evento)
    await trackEvent(evento, { keepalive: true })
    expect(post).toHaveBeenCalledTimes(1)
    expect(garantirSessao).toHaveBeenCalledTimes(1)

    window.localStorage.setItem(AUTH_TOKEN_KEY, 'bia')
    await trackEvent(evento)
    expect(post).toHaveBeenCalledTimes(2)

    window.localStorage.setItem(AUTH_TOKEN_KEY, 'ana')
    liberarEventos()
    await trackEvent(evento)
    expect(post).toHaveBeenCalledTimes(3)

    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    await trackEvent(evento)
    expect(post).toHaveBeenCalledTimes(4)
  })

  it('abrir a sessão também pode dar 403: para de tentar', async () => {
    liberarEventos()
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'caio')
    vi.mocked(garantirSessao).mockRejectedValueOnce(new ApiError('CONSENT_REQUIRED', 'x', 403))
    await expect(trackEvent(evento)).rejects.toThrow()
    await trackEvent(evento)
    expect(garantirSessao).toHaveBeenCalledTimes(1)
    expect(post).not.toHaveBeenCalled()
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  })

  it('espera o consentimento inicial chegar à conta, mesmo registrado depois no mesmo render', async () => {
    const ordem: string[] = []
    post.mockImplementation(async () => {
      ordem.push('evento')
      return {}
    })
    const envio = trackEvent(evento)
    registrarEnvioInicial(
      new Promise<void>((r) => setTimeout(r, 20)).then(() => {
        ordem.push('consentimento')
      }),
    )
    await envio
    expect(ordem).toEqual(['consentimento', 'evento'])
  })

  it('aba fechando (keepalive): usa a sessão salva, sem abrir outra', async () => {
    await trackEvent(evento, { keepalive: true })
    expect(sessoesEnviadas()).toEqual([4])
    expect(garantirSessao).not.toHaveBeenCalled()
  })
})
