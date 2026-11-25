import { describe, expect, it } from 'vitest'
import { chaveRepetida, fichaToPairs, pairsToFicha } from './fichaTecnica'

describe('ficha técnica', () => {
  it('sem atributos vira {}, que limpa a ficha no PATCH', () => {
    expect(pairsToFicha([])).toEqual({})
    expect(pairsToFicha(undefined)).toEqual({})
  })

  it('tira espaços e descarta chave ou valor em branco', () => {
    expect(
      pairsToFicha([{ chave: ' Marca ', valor: ' X ' }, { chave: '  ', valor: 'a' }, { chave: 'Vazio', valor: '  ' }, {}]),
    ).toEqual({ Marca: 'X' })
  })

  it('ida e volta', () => {
    expect(pairsToFicha(fichaToPairs({ Medida: 'STD', Peso: 2 }))).toEqual({ Medida: 'STD', Peso: '2' })
    expect(fichaToPairs(null)).toEqual([])
  })

  it('chave repetida, sem diferenciar maiúsculas nem espaços', () => {
    const pares = [{ chave: 'Marca' }, { chave: ' marca ' }, { chave: 'Medida' }, {}, { chave: '' }]
    expect(chaveRepetida(pares, 'Marca')).toBe(true)
    expect(chaveRepetida(pares, 'Medida')).toBe(false)
    expect(chaveRepetida(pares, '')).toBe(false)
    expect(chaveRepetida(undefined, 'x')).toBe(false)
  })
})
