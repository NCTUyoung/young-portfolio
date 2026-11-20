import { defineConfig } from '@playwright/test'
import projectConfig from '../../playwright.config'

// Use the running museum preview. The default CI config owns its own server.
export default defineConfig({
  ...projectConfig,
  testDir: '.',
  globalSetup: './global-setup.ts',
  outputDir: '../../.tmp/museum/qa/frozen-results',
  webServer: [],
  use: {
    ...projectConfig.use,
    baseURL: process.env.MUSEUM_TEST_BASE_URL ?? 'http://127.0.0.1:3011/young-portfolio/'
  }
})
