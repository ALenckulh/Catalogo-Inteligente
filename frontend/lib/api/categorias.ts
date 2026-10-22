import type { Categoria } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { mockCategorias } from '@/lib/mocks/data'
import { apiClient } from './client'
import { USE_MOCK } from './config'

export async function listCategorias(): Promise<Categoria[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Categoria[]>('/categorias')
    return data
  }

  await delay()
  return [...mockCategorias]
}
