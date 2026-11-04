import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from '@/lib/types'
import { API_BASE_URL, AUTH_TOKEN_KEY, USE_MOCK, VISITANTE_COOKIE_KEY } from './config'

export const SESSION_CLEARED_EVENT = 'ci:session-cleared'

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem('ci_auth_user')
    window.dispatchEvent(new Event(SESSION_CLEARED_EVENT))
  } catch {
    /* ignore */
  }
}

function isPublicAuthUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/password-reset') ||
    url.includes('/admin/auth/login')
  )
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

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      !USE_MOCK &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isPublicAuthUrl(error.config?.url)
    ) {
      clearStoredAuth()
    }
    return Promise.reject(error)
  },
)

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
