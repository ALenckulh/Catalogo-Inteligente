import '@testing-library/jest-dom/vitest'

// Form e Table do antd usam a grade responsiva e medem a largura; o jsdom não tem nenhum dos dois.
if (typeof window !== 'undefined') {
  window.matchMedia ??= ((media: string) => ({
    media,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as never
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
