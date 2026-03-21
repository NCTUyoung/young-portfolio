import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.nuxt', '.output', 'dist']
  },
  resolve: {
    alias: {
      '~': root,
      '~~': root,
      '@': root
    }
  }
})
