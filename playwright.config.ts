import { defineConfig, devices } from '@playwright/test'

/**
 * E2E 設定。
 *
 * - `baseURL` 含 `/young-portfolio/`：對齊 `nuxt.config.ts` 的 `app.baseURL`，
 *   測試裡寫 `page.goto('/')` 就會打到 `/young-portfolio/`，保持 URL 可攜。
 * - `webServer`：`reuseExistingServer: true` 讓本機已開的 `npm run dev`
 *   不會被 Playwright 再起一份；CI 上沒人先開則自動 spawn。
 * - 只跑 chromium headless：用途是 smoke（SSR / 互動 / 鍵盤），暫不追 Webkit/Firefox 多瀏覽器。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:3000/young-portfolio/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/young-portfolio/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe'
  }
})
