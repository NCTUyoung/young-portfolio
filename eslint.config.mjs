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
      'public/**'
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
      }]
    }
  }
)
