/** Enquanto true, services usam lib/mocks. Trocar para false quando o backend estiver no ar. */
export const USE_MOCK = true

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

export const AUTH_TOKEN_KEY = 'ci_auth_token'
export const VISITANTE_COOKIE_KEY = 'ci_visitante_id'
