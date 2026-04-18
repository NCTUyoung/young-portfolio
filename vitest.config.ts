import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(root, 'app')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.nuxt', '.output', 'dist']
  },
  resolve: {
    alias: {
      // Nuxt 4: `~` / `@` 指向 srcDir（app/），`~~` / `@@` 指向 rootDir
      '~~': root,
      '@@': root,
      '~': appDir,
      '@': appDir
    }
  }
})
