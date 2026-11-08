import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      exclude: [
        'lib/mocks/**',
        'lib/api/!(pagination).ts',
        'lib/hooks/**',
        'lib/theme/**',
        'lib/types/**',
        'lib/contexts/CurrentUser/**',
        'components/ui/**',
        'components/auth/**',
        'components/LegalConteudo.tsx',
        'components/ProdutoCard.tsx',
        'components/layout/AdminShell.tsx',
        'components/layout/PublicHeader.tsx',
        'components/layout/PublicFooter.tsx',
        'components/layout/PageStates.tsx',
        'components/layout/PublicLayoutShell.tsx',
        '**/*.{test,spec}.{ts,tsx}',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 25,
        statements: 25,
      },
    },
  },
})
