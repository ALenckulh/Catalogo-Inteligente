import { describe, expect, it } from 'vitest'
import { adminEntrarHref, entrarHref, safeAdminNext, safeNext } from '@/lib/navigation'

describe('navigation', () => {
  it('safeAdminNext só aceita tela do admin, menos o login', () => {
    expect(safeAdminNext('/admin/usuarios?nivel=QUENTE')).toBe('/admin/usuarios?nivel=QUENTE')
    expect(safeAdminNext('/admin?x=1')).toBe('/admin?x=1')
    for (const ruim of [null, '', '/', '/produtos', '/administracao', '//evil.com', 'https://evil.com', '/\\evil', '/admin/entrar', '/admin/entrar?next=/admin/entrar']) {
      expect(safeAdminNext(ruim)).toBe('/admin')
    }
    expect(adminEntrarHref('/admin/usuarios?tipo=PF')).toBe('/admin/entrar?next=%2Fadmin%2Fusuarios%3Ftipo%3DPF')
    expect(adminEntrarHref('/admin')).toBe('/admin/entrar')
  })

  it('safeNext only allows internal paths', () => {
    expect(safeNext('/produtos')).toBe('/produtos')
    expect(safeNext(null)).toBe('/')
    expect(safeNext('https://evil.com')).toBe('/')
    expect(safeNext('//evil.com')).toBe('/')
  })

  it('entrarHref encodes next', () => {
    expect(entrarHref('/favoritos')).toBe('/entrar?next=%2Ffavoritos')
  })
})
