import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from './client'
import { trackEvent } from './eventos'
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

  it('aba fechando (keepalive): usa a sessão salva, sem abrir outra', async () => {
    await trackEvent(evento, { keepalive: true })
    expect(sessoesEnviadas()).toEqual([4])
    expect(garantirSessao).not.toHaveBeenCalled()
  })
})
