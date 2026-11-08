import { describe, expect, it } from 'vitest'
import { fromBackendPage, toBackendPage } from '@/lib/api/pagination'

describe('pagination', () => {
  it('toBackendPage converts 1-based to 0-based', () => {
    expect(toBackendPage(undefined)).toBeUndefined()
    expect(toBackendPage(1)).toBe(0)
    expect(toBackendPage(2)).toBe(1)
    expect(toBackendPage(0)).toBe(0)
  })

  it('fromBackendPage converts 0-based to 1-based', () => {
    const page = fromBackendPage({
      items: [1],
      page: 0,
      limit: 20,
      total: 1,
    })
    expect(page.page).toBe(1)
    expect(page.items).toEqual([1])
  })
})
