import { chromium } from 'playwright'

const base = 'http://localhost:3001/young-portfolio'
const out = 'tests/screenshots/round-39'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  // 故意 hit 不存在的 page → 觸發 404
  { name: 'desktop-404', url: `${base}/no-such-page`, vw: 1440, vh: 900 },
  { name: 'mobile-404', url: `${base}/no-such-page`, vw: 390, vh: 844 },
  // /article/[slug] 不存在 slug → 404
  { name: 'desktop-404-article', url: `${base}/article/does-not-exist`, vw: 1440, vh: 900 },
  { name: 'mobile-404-article', url: `${base}/article/does-not-exist`, vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/${t.name}.png`, fullPage: false })
  await ctx.close()
}

await browser.close()
console.log('done')
