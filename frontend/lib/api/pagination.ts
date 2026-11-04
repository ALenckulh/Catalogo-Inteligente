import type { Page } from '@/lib/types'

/** FE UI uses 1-based page; Spring PageResponse uses 0-based. */
export function toBackendPage(page: number | undefined): number | undefined {
  if (page === undefined) return undefined
  return Math.max(0, page - 1)
}

export function fromBackendPage<T>(data: Page<T>): Page<T> {
  return {
    ...data,
    page: (data.page ?? 0) + 1,
  }
}
