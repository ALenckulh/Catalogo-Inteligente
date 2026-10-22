import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from '@/lib/types'
import { API_BASE_URL, AUTH_TOKEN_KEY, VISITANTE_COOKIE_KEY } from './config'

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readStorage(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const visitanteId = readStorage(VISITANTE_COOKIE_KEY)
  if (visitanteId) {
    config.headers['X-Visitante-Cookie-Id'] = visitanteId
  }
  return config
})

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ApiErrorBody>
    const status = ax.response?.status ?? 0
    const body = ax.response?.data
    if (body?.code && body?.message) {
      return new ApiError(body.code, body.message, status)
    }
    return new ApiError('HTTP_ERROR', ax.message || 'Erro de rede', status)
  }

  if (error instanceof Error) {
    return new ApiError('UNKNOWN', error.message, 0)
  }

  return new ApiError('UNKNOWN', 'Erro desconhecido', 0)
}
