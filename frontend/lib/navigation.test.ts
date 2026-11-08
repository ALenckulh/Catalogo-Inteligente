import { describe, expect, it } from 'vitest'
import { entrarHref, safeNext } from '@/lib/navigation'

describe('navigation', () => {
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
