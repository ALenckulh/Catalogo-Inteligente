import { describe, expect, it } from 'vitest'
import { isNivelInteresse, nivelDoScore } from '@/lib/nivelInteresse'

describe('nivelInteresse', () => {
  it('nivelDoScore usa os mesmos cortes do backend', () => {
    expect(nivelDoScore(null)).toBe('SEM_SCORE')
    expect(nivelDoScore(undefined)).toBe('SEM_SCORE')
    expect(nivelDoScore(0)).toBe('FRIO')
    expect(nivelDoScore(39.9)).toBe('FRIO')
    expect(nivelDoScore(40)).toBe('MORNO')
    expect(nivelDoScore(69.9)).toBe('MORNO')
    expect(nivelDoScore(70)).toBe('QUENTE')
    expect(nivelDoScore(100)).toBe('QUENTE')
  })

  it('isNivelInteresse aceita só chaves conhecidas', () => {
    expect(isNivelInteresse('QUENTE')).toBe(true)
    expect(isNivelInteresse('SEM_SCORE')).toBe(true)
    expect(isNivelInteresse('OUTRO')).toBe(false)
    expect(isNivelInteresse(70)).toBe(false)
    expect(isNivelInteresse(null)).toBe(false)
  })
})
