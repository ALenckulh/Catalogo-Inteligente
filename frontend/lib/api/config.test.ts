import { describe, expect, it } from 'vitest'
import { API_BASE_URL, imagemSrc } from '@/lib/api/config'

describe('imagemSrc', () => {
  it('mantém URLs absolutas e do mock', () => {
    expect(imagemSrc('https://placehold.co/800x600')).toBe('https://placehold.co/800x600')
    expect(imagemSrc('blob:http://localhost/abc')).toBe('blob:http://localhost/abc')
  })

  it('resolve referência de BLOB contra a base da API', () => {
    expect(imagemSrc('produtos/imagens/42')).toBe(`${API_BASE_URL}/produtos/imagens/42`)
  })
})
