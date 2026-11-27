'use client'

import { useEffect, useRef, useState } from 'react'
import type { Page } from '@/lib/types'
import type { TableProps } from '@/components/ui'

const PAGE_SIZE = 20

interface BuscaParams {
  page: number
  limit: number
  /** "campo,asc|desc" */
  sort?: string
}

interface Ordenacao {
  field: string
  order: 'ascend' | 'descend'
}

type OnChangeParams = Parameters<NonNullable<TableProps['onChange']>>

/**
 * Tabela com paginação e ordenação no servidor: guarda só a página pedida, então não há limite de registros.
 *
 * `buscar` deve vir de um `useCallback` com os filtros nas dependências: mudar um filtro refaz a busca.
 * Quem muda o filtro também chama `setPage(1)`.
 */
export function useTabelaPaginada<T>(
  buscar: (params: BuscaParams) => Promise<Page<T>>,
  enabled: boolean,
) {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<Ordenacao | null>(null)
  const seq = useRef(0)

  async function reload() {
    // Respostas fora de ordem (cliques rápidos em ordenar/filtrar) são descartadas.
    const id = ++seq.current
    setLoading(true)
    setErro(false)
    try {
      const res = await buscar({
        page,
        limit: PAGE_SIZE,
        sort: sort ? `${sort.field},${sort.order === 'descend' ? 'desc' : 'asc'}` : undefined,
      })
      if (id !== seq.current) return
      setTotal(res.total)
      // A página não existe mais (ex.: desativou o último item com o filtro Ativo): vai para a última.
      if (res.items.length === 0 && page > 1) {
        setPage(Math.max(1, Math.min(page - 1, Math.ceil(res.total / PAGE_SIZE))))
        return
      }
      setItems(res.items)
    } catch {
      if (id === seq.current) setErro(true)
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, buscar, page, sort])

  /** Repassar do `onChange` da Table. Mudar ordenação ou filtro volta para a página 1. */
  function onTableChange(
    pagination: OnChangeParams[0],
    sorter: { field?: unknown; order?: Ordenacao['order'] | null } | { field?: unknown; order?: Ordenacao['order'] | null }[],
    filtroMudou: boolean,
  ) {
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    const next = s?.order && s.field ? { field: String(s.field), order: s.order } : null
    const ordemMudou = next?.field !== sort?.field || next?.order !== sort?.order
    if (ordemMudou) setSort(next)
    setPage(ordemMudou || filtroMudou ? 1 : (pagination.current ?? 1))
  }

  function sortOrder(field: string) {
    return sort?.field === field ? sort.order : null
  }

  return {
    items,
    loading,
    /** A última busca falhou: a tela mostra PageError com `reload` em vez da tabela. */
    erro,
    setPage,
    reload,
    onTableChange,
    sortOrder,
    pagination: { current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false },
  }
}
