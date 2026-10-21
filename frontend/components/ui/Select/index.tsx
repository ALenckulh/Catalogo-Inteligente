'use client'

import React from 'react'
import { Select as AntSelect, Spin } from 'antd'
import type { SelectProps as AntSelectProps, RefSelectProps, DefaultOptionType } from 'antd/es/select'

export type { RefSelectProps }
export type SelectProps = AntSelectProps

export interface PageableSelectPage {
  items: DefaultOptionType[]
  hasMore: boolean
}

export interface PageableSelectProps extends Omit<AntSelectProps, 'options' | 'onSearch' | 'loading'> {
  fetchPage: (params: { page: number; pageSize: number; search: string }) => Promise<PageableSelectPage>
  pageSize?: number
  debounceMs?: number
}

export function usePageableSelect({
  fetchPage,
  pageSize = 20,
  debounceMs = 250,
}: {
  fetchPage: PageableSelectProps['fetchPage']
  pageSize?: number
  debounceMs?: number
}) {
  const [options, setOptions] = React.useState<DefaultOptionType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(true)

  const abortRef = React.useRef<AbortController | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadedRef = React.useRef(false)

  const load = React.useCallback(
    async (nextPage: number, searchTerm: string, append: boolean) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      try {
        const result = await fetchPage({ page: nextPage, pageSize, search: searchTerm })
        if (ac.signal.aborted) return
        setOptions((prev) => (append ? [...prev, ...result.items] : result.items))
        setHasMore(result.hasMore)
        setPage(nextPage)
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    },
    [fetchPage, pageSize],
  )

  const onSearch = React.useCallback(
    (value: string) => {
      setSearch(value)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => void load(0, value, false), debounceMs)
    },
    [load, debounceMs],
  )

  const onPopupScroll = React.useCallback<React.UIEventHandler<HTMLDivElement>>(
    (e) => {
      const el = e.currentTarget
      if (loading || !hasMore) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
        void load(page + 1, search, true)
      }
    },
    [load, loading, hasMore, page, search],
  )

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) return
      if (initialLoadedRef.current) return
      initialLoadedRef.current = true
      void load(0, search, false)
    },
    [load, search],
  )

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { options, loading, onSearch, onPopupScroll, onOpenChange }
}

export const PageableSelect = React.forwardRef<RefSelectProps, PageableSelectProps>(
  function PageableSelect(
    { fetchPage, pageSize, debounceMs, showSearch = true, filterOption = false, onOpenChange, ...rest },
    ref,
  ) {
    const {
      options,
      loading,
      onSearch,
      onPopupScroll,
      onOpenChange: onFirstOpen,
    } = usePageableSelect({ fetchPage, pageSize, debounceMs })

    return (
      <AntSelect
        ref={ref}
        showSearch={showSearch}
        filterOption={filterOption}
        options={options}
        loading={loading}
        onSearch={onSearch}
        onPopupScroll={onPopupScroll}
        onOpenChange={(open) => {
          onFirstOpen(open)
          onOpenChange?.(open)
        }}
        notFoundContent={loading ? <Spin size="small" /> : undefined}
        {...rest}
      />
    )
  },
)

const BaseSelect = React.forwardRef<RefSelectProps, SelectProps>(function Select(props, ref) {
  return <AntSelect ref={ref} {...props} />
})

export const Select = Object.assign(BaseSelect, {
  Pageable: PageableSelect,
  Option: AntSelect.Option,
  OptGroup: AntSelect.OptGroup,
})
