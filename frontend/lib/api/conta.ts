import type { ConsentimentoLgpd, Usuario } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { mockUsuarios } from '@/lib/mocks/data'
import { ApiError, apiClient } from './client'
import { USE_MOCK } from './config'

export async function getConta(usuarioId: number): Promise<Usuario> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Usuario>('/conta')
    return data
  }

  await delay()
  const user = mockUsuarios.find((u) => u.id === usuarioId)
  if (!user) throw new ApiError('NOT_FOUND', 'Usuário não encontrado', 404)
  return { ...user }
}

export async function updateConta(
  usuarioId: number,
  patch: Partial<Pick<Usuario, 'telefone' | 'emailAlternativo' | 'nomeCompleto' | 'idade'>>,
): Promise<Usuario> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<Usuario>('/conta', patch)
    return data
  }

  await delay()
  const user = mockUsuarios.find((u) => u.id === usuarioId)
  if (!user) throw new ApiError('NOT_FOUND', 'Usuário não encontrado', 404)
  Object.assign(user, patch, { updatedAt: new Date().toISOString() })
  return { ...user }
}

export async function updateConsentimentos(
  _usuarioId: number,
  consentimentos: ConsentimentoLgpd[],
): Promise<ConsentimentoLgpd[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<ConsentimentoLgpd[]>('/conta/consentimentos', {
      consentimentos,
    })
    return data
  }

  await delay()
  return consentimentos
}

export async function requestAccountDeletion(usuarioId: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete('/conta')
    return
  }

  await delay()
  void usuarioId
}
