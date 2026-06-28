import { defineConfig, devices } from '@playwright/test'

/**
 * E2E 設定。
 *
 * - `baseURL` 含 `/young-portfolio/`：對齊 `nuxt.config.ts` 的 `app.baseURL`，
 *   測試裡寫 `page.goto('/')` 就會打到 `/young-portfolio/`，保持 URL 可攜。
 * - `webServer`：`reuseExistingServer: true` 讓本機已開的 `npm run dev`
 *   不會被 Playwright 再起一份；CI 上沒人先開則自動 spawn。
 * - 只跑 chromium headless：用途是 smoke（SSR / 互動 / 鍵盤），暫不追 Webkit/Firefox 多瀏覽器。
 * - `globalSetup`：平行 worker 開跑前先序列暖機重路由（見 tests/e2e/global-setup.ts），把
 *   `nuxt dev` 的 on-demand 編譯成本一次付清，消除「多 worker 同時首編譯」的競爭型 flaky。
 *   有了暖機，CI 不再需要 workers:1 序列保護，可放開併發加速。
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 暖機後 dev server 只需服務已編譯路由，併發安全。CI 用 3 workers（GitHub runner ≈4 vCPU，
  // 留 headroom 給 dev server）；本機 undefined＝Playwright 依核心數自動（約半數）。
  workers: process.env.CI ? 3 : undefined,
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
    // 冷啟動上限：依賴變動後 Vite 首次需 full dep pre-bundle，疊加 Nitro/Nuxt boot 可逼近 4 分鐘
    // （實測 npm update 後 ~242s）。CI 有 node_modules/.cache/nuxt 快取通常更快，此處留 margin。
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe'
  }
})
