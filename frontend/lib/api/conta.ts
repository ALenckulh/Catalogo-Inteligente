import type { ConsentimentoLgpd, Usuario } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { mockUsuarios } from '@/lib/mocks/data'
import { ApiError, apiClient } from './client'
import { USE_MOCK } from './config'

export interface ContaData {
  usuario: Usuario
  consentimentos: ConsentimentoLgpd[]
}

interface ContaApiResponse {
  usuario: Usuario
  consentimentos: ConsentimentoLgpd[]
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
        versaoTermos: '1.0',
        aceitoEm: new Date().toISOString(),
      },
      {
        tipo: 'CONTATO_PROATIVO',
        aceito: false,
        versaoTermos: '1.0',
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

export async function exportarConta(formato: 'json' | 'csv' = 'json'): Promise<Blob> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<unknown>('/conta/exportar', {
      params: { formato },
      responseType: formato === 'csv' ? 'blob' : 'json',
    })
    if (formato === 'csv' && data instanceof Blob) return data
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  }

  await delay()
  return new Blob(
    [JSON.stringify({ mock: true, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' },
  )
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
