import { chromium, type FullConfig } from '@playwright/test'

/**
 * E2E 暖機（globalSetup）。
 *
 * 痛點：e2e 跑在 `nuxt dev` 上，Vite 對每條路由「首次命中才即時編譯」。攝影 overview
 * （含 1800 行 [[event]].vue + 一票 gallery 子元件）首編譯可達數秒。多個 worker 平行
 * 首次命中同一條未編譯路由時，會一起卡在編譯上互相競爭 → toBeVisible 撞 timeout 而 flaky
 * （實測：冷 server 6 workers 5/12 失敗；全暖後 6 workers 12/12、~12s）。
 *
 * 解法：在所有平行 worker 開跑「之前」，序列走訪一次重路由，把每條的 SSR + client chunk
 * 編譯成本一次付清。之後測試只是導航既編譯好的路由 → 穩定且更快，CI 也能解除 workers:1。
 *
 * webServer 由 Playwright 先於 globalSetup 啟動，故此處可直接打 baseURL。暖機屬 best-effort：
 * 任一路由失敗（編譯慢、暫時 5xx）只記 warn 不中斷，真正把關交給各 spec 的可見性斷言。
 */
const ROUTES = [
  '/', // 首頁 Hero 對開
  '/gallery', // all
  '/gallery/photography', // 影 overview（最重）
  '/gallery/digital', // 繪 overview
  '/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D', // 代表性 event 沉浸頁
  '/admin' // CSR-only 後台
]

export default async function globalSetup (config: FullConfig) {
  const base = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000/young-portfolio/'
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: base })
  const t0 = Date.now()
  for (const route of ROUTES) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90_000 })
      // 給 client chunk 起手請求一點時間，讓 Vite 把該頁前端模組也編出來。
      await page.waitForTimeout(400)
    } catch (e) {
      console.warn(`[e2e warmup] ${route} 暖機未完成（不致命）：${(e as Error).message}`)
    }
  }
  await browser.close()
  console.log(`[e2e warmup] ${ROUTES.length} 條路由暖機完成，耗時 ${Math.round((Date.now() - t0) / 1000)}s`)
}
