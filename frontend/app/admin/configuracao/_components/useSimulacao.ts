'use client'

import { useEffect, useRef, useState } from 'react'
import { simularScoring } from '@/lib/api/admin'
import type { ParametroDecay, PesoMetrica, SimulacaoResponse } from '@/lib/types'

const DEBOUNCE_MS = 500

/**
 * Simula os parâmetros em edição contra os dados reais, com debounce.
 * Respostas fora de ordem (de parâmetros antigos) são descartadas.
 */
export function useSimulacao(pesos: PesoMetrica[], decay: ParametroDecay[], ativo: boolean) {
  const [data, setData] = useState<SimulacaoResponse | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)
  const seq = useRef(0)
  const chave = JSON.stringify({ pesos, decay })

  useEffect(() => {
    if (!ativo) return
    const id = ++seq.current
    const t = window.setTimeout(() => {
      setCarregando(true)
      const params = JSON.parse(chave) as { pesos: PesoMetrica[]; decay: ParametroDecay[] }
      simularScoring(params)
        .then((r) => {
          if (id !== seq.current) return
          setData(r)
          setErro(false)
        })
        .catch(() => {
          if (id === seq.current) setErro(true)
        })
        .finally(() => {
          if (id === seq.current) setCarregando(false)
        })
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [chave, ativo])

  return { data, carregando, erro }
}
