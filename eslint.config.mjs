// @ts-check
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import withNuxt from './.nuxt/eslint.config.mjs'

const repoRoot = dirname(fileURLToPath(import.meta.url))

export default withNuxt(
  {
    name: 'typescript-eslint/consistent-type-imports',
    files: ['**/*.{ts,vue}'],
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'public/**',
      // vitest.config.ts / playwright.config.ts / tests/e2e 都不在 Nuxt 4 產出的 tsconfig 內，
      // projectService 會抱怨 "file not found by the project service"，直接排除。
      'vitest.config.ts',
      'playwright.config.ts',
      'tests/e2e/**'
    ],
    languageOptions: {
      parserOptions: {
        // TS 5+：以 language service 取得型別，供需 type info 的規則使用
        projectService: true,
        tsconfigRootDir: repoRoot
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports'
      }],
      // 失敗路徑用 console.error；debug print 一律 warn 出來避免提交到 master。
      // 已 ship 2026-05-15：admin.ts 21 條 debug log + ImageInfoPanel.vue 1 條 dev-only log 清空。
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
)
