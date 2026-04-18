import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(root, 'app')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    // Playwright e2e 跟 Vitest 共用 `.spec.ts` 副檔名但 runtime 完全不同，
    // 要排除掉，否則 vitest 會嘗試跑它進而 import '@playwright/test' 炸掉。
    exclude: ['node_modules', '.nuxt', '.output', 'dist', 'tests/e2e/**']
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
