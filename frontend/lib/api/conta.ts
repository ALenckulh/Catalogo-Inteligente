import type { ConsentimentoInput, ConsentimentoLgpd, Usuario } from '@/lib/types'
import { VERSAO_TERMOS } from '@/lib/config'
import { delay } from '@/lib/mocks/delay'
import { mockUsuarios } from '@/lib/mocks/data'
import { persistToken } from './auth'
import { ApiError, apiClient } from './client'
import { USE_MOCK } from './config'

export interface ContaData {
  usuario: Usuario
  consentimentos: ConsentimentoLgpd[]
}

interface ContaApiResponse {
  usuario: Usuario
  consentimentos: ConsentimentoLgpd[]
  token?: string | null
}

export async function getConta(usuarioId: number): Promise<ContaData> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<ContaApiResponse>('/conta')
    return {
      usuario: data.usuario,
      consentimentos: data.consentimentos ?? [],
    }
  }

  await delay()
  const user = mockUsuarios.find((u) => u.id === usuarioId)
  if (!user) throw new ApiError('NOT_FOUND', 'Usuário não encontrado', 404)
  return {
    usuario: { ...user },
    consentimentos: [
      {
        tipo: 'COOKIES_COMPORTAMENTAIS',
        aceito: true,
        versaoTermos: VERSAO_TERMOS,
        aceitoEm: new Date().toISOString(),
      },
      {
        tipo: 'CONTATO_PROATIVO',
        aceito: true,
        versaoTermos: VERSAO_TERMOS,
        aceitoEm: new Date().toISOString(),
      },
    ],
  }
}

export async function updateConta(
  usuarioId: number,
  patch: Partial<Pick<Usuario, 'telefone' | 'emailAlternativo' | 'nomeCompleto' | 'idade'>>,
): Promise<Usuario> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<ContaApiResponse>('/conta', patch)
    if (data.token) persistToken(data.token)
    return data.usuario
  }

  await delay()
  const user = mockUsuarios.find((u) => u.id === usuarioId)
  if (!user) throw new ApiError('NOT_FOUND', 'Usuário não encontrado', 404)
  Object.assign(user, patch, { updatedAt: new Date().toISOString() })
  return { ...user }
}

export async function updateConsentimentos(
  _usuarioId: number,
  consentimentos: ConsentimentoInput[],
): Promise<ConsentimentoLgpd[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<ConsentimentoLgpd[]>('/conta/consentimentos', {
      consentimentos,
    })
    return data
  }

  await delay()
  return consentimentos.map((c) => ({ ...c, aceitoEm: new Date().toISOString() }))
}

export async function solicitarLgpd(
  tipo: 'EXPORTACAO' | 'EXCLUSAO' | 'REVOGACAO_CONSENTIMENTO' | 'CORRECAO',
  detalhes?: string,
): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post('/conta/solicitacoes-lgpd', { tipo, detalhes })
    return
  }
  await delay()
  void tipo
  void detalhes
}

export async function requestAccountDeletion(usuarioId: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete('/conta')
    return
  }

  await delay()
  void usuarioId
}
