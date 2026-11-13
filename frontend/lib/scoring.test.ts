import { describe, expect, it } from 'vitest'
import {
  BOOST_PADRAO,
  EVENTOS_SCORING,
  LAMBDA_PADRAO,
  ORDEM_EVENTOS,
  PESOS_PADRAO,
  decayGlobal,
  fatorDecaimento,
  formatPontos,
  lambdaDeMeiaVida,
  meiaVidaDeLambda,
  pontosPorAcao,
  scoreMax,
} from '@/lib/scoring'

describe('scoring', () => {
  it('ORDEM_EVENTOS cobre todos os eventos uma vez', () => {
    expect([...ORDEM_EVENTOS].sort()).toEqual(Object.keys(EVENTOS_SCORING).sort())
  })

  it('scoreMax soma só pesos positivos de produto', () => {
    // 0.2 + 0.5 + 0.1 + 1 + 0.5 + 0.3 + 0.5 (FILTRO_APLICADO é de categoria)
    expect(scoreMax(PESOS_PADRAO)).toBeCloseTo(3.1)
    expect(scoreMax([{ tipoEvento: 'FAVORITAR', peso: 0 }])).toBe(1)
    expect(scoreMax([{ tipoEvento: 'FILTRO_APLICADO', peso: 2 }])).toBe(1)
  })

  it('pontosPorAcao escala cada peso pelo divisor', () => {
    const pts = pontosPorAcao([
      { tipoEvento: 'CONTATO_WHATSAPP', peso: 1 },
      { tipoEvento: 'FAVORITAR', peso: 0.5 },
      { tipoEvento: 'FILTRO_APLICADO', peso: 0.5 },
    ])
    expect(pts.CONTATO_WHATSAPP).toBeCloseTo(66.67, 1)
    expect(pts.FAVORITAR).toBeCloseTo(33.33, 1)
    expect(pts.FILTRO_APLICADO).toBeCloseTo(33.33, 1)
  })

  it('meia-vida e λ vão e voltam para dias inteiros de 7 a 180', () => {
    for (let dias = 7; dias <= 180; dias++) {
      expect(Math.round(meiaVidaDeLambda(lambdaDeMeiaVida(dias)))).toBe(dias)
    }
    expect(meiaVidaDeLambda(0)).toBe(Infinity)
    expect(lambdaDeMeiaVida(0)).toBe(lambdaDeMeiaVida(1))
  })

  it('fatorDecaimento segue as faixas do DecayCalculator', () => {
    const l = 0.01
    expect(fatorDecaimento(3, l, false)).toBe(1)
    expect(fatorDecaimento(30, l, false)).toBeCloseTo(Math.exp(-0.3))
    expect(fatorDecaimento(120, l, true)).toBeCloseTo(Math.exp(-1.2))
    expect(fatorDecaimento(120, l, false)).toBeCloseTo(Math.exp(-2.4))
    expect(fatorDecaimento(200, l, true)).toBeCloseTo(Math.exp(-2))
    expect(fatorDecaimento(200, l, false)).toBe(0)
  })

  it('decayGlobal acha o parâmetro global ou usa o padrão', () => {
    const global = { categoriaId: null, categoriaNome: null, lambda: 0.02, boostConversao: 1.5 }
    const cat = { categoriaId: 1, categoriaNome: 'C1', lambda: 0.05, boostConversao: 1 }
    expect(decayGlobal([cat, global])).toBe(global)
    expect(decayGlobal([cat])).toEqual({
      categoriaId: null,
      categoriaNome: null,
      lambda: LAMBDA_PADRAO,
      boostConversao: BOOST_PADRAO,
    })
  })

  it('formatPontos arredonda e mostra <1 para valores pequenos', () => {
    expect(formatPontos(0.3)).toBe('<1')
    expect(formatPontos(0)).toBe('0')
    expect(formatPontos(12.6)).toBe('13')
  })
})
