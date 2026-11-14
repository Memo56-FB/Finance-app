import path from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/server-only.ts'),
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    exclude: [...configDefaults.exclude, '**/tests/e2e/**', '**/*.e2e.*'],
  },
})
