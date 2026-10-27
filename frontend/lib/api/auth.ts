import type { AuthSession, LoginRequest, SignupRequest, Usuario } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { MOCK_PASSWORD, mockUsuarios } from '@/lib/mocks/data'
import { ApiError, apiClient } from './client'
import { AUTH_TOKEN_KEY, USE_MOCK } from './config'

function displayName(u: Usuario): string {
  return u.nomeCompleto ?? u.razaoSocial ?? u.email
}

export async function login(body: LoginRequest): Promise<AuthSession> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<AuthSession>('/auth/login', body)
    return data
  }

  await delay()
  const user = mockUsuarios.find(
    (u) => u.email === body.email && (u.tipo === 'PF' || u.tipo === 'PJ'),
  )
  if (!user || body.senha !== MOCK_PASSWORD) {
    throw new ApiError('AUTH_INVALID', 'E-mail ou senha inválidos', 401)
  }
  return { token: `mock-token-${user.id}`, usuario: user }
}

export async function loginAdmin(body: LoginRequest): Promise<AuthSession> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<AuthSession>('/admin/auth/login', body)
    return data
  }

  await delay()
  const user = mockUsuarios.find((u) => u.email === body.email && u.tipo === 'ADMIN')
  if (!user || body.senha !== MOCK_PASSWORD) {
    throw new ApiError('AUTH_INVALID', 'Credenciais inválidas', 401)
  }
  return { token: `mock-admin-token-${user.id}`, usuario: user }
}

export async function signup(body: SignupRequest): Promise<AuthSession> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<AuthSession>('/auth/signup', body)
    return data
  }

  await delay()
  if (!body.aceitaTermos || !body.aceitaPrivacidade) {
    throw new ApiError('VALIDATION', 'Aceite dos termos e privacidade é obrigatório', 400)
  }
  if (mockUsuarios.some((u) => u.email === body.email)) {
    throw new ApiError('EMAIL_EXISTS', 'E-mail já cadastrado', 409)
  }

  const now = new Date().toISOString()
  const usuario: Usuario = {
    id: mockUsuarios.length + 1,
    tipo: body.tipo,
    email: body.email,
    telefone: body.telefone ?? null,
    emailAlternativo: body.emailAlternativo ?? null,
    cpf: body.cpf ?? null,
    nomeCompleto: body.nomeCompleto ?? null,
    idade: body.idade ?? null,
    cnpj: body.cnpj ?? null,
    razaoSocial: body.razaoSocial ?? null,
    createdAt: now,
    updatedAt: now,
  }
  mockUsuarios.push(usuario)
  return { token: `mock-token-${usuario.id}`, usuario }
}

export async function logout(): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post('/auth/logout')
    return
  }
  await delay(100)
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post('/auth/password-reset', { email })
    return
  }
  await delay()
  void email
}

export async function confirmPasswordReset(token: string, novaSenha: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post('/auth/password-reset/confirm', { token, novaSenha })
    return
  }
  await delay()
  if (!token || !novaSenha) {
    throw new ApiError('VALIDATION', 'Token ou senha inválidos', 400)
  }
}

export function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_TOKEN_KEY, session.token)
  window.localStorage.setItem('ci_auth_user', JSON.stringify(session.usuario))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem('ci_auth_user')
}

export function readStoredUser(): Usuario | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('ci_auth_user')
    if (!raw) return null
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export { displayName }
