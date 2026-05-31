import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-28'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'desktop-balanced', url: `${base}/`, vw: 1440, vh: 900 },
  { name: 'desktop-focus-kai-url', url: `${base}/?focus=kai`, vw: 1440, vh: 900 },
  { name: 'desktop-focus-kage-url', url: `${base}/?focus=kage`, vw: 1440, vh: 900 },
  { name: 'mobile-balanced', url: `${base}/`, vw: 390, vh: 844 },
  { name: 'mobile-focus-kai-url', url: `${base}/?focus=kai`, vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${t.name}] pageerror:`, e.message))
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({
    content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}`
  })
  await page.waitForTimeout(2200)

  await page.screenshot({ path: `${out}/${t.name}-hero.png`, fullPage: false })

  // 對 balanced 與 kai-url 測試 hover affordance 是否在 toggle
  if (t.name === 'desktop-balanced') {
    const kaiBtn = page.locator('button.hero-toggle').first()
    if (await kaiBtn.count()) {
      await kaiBtn.hover()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${out}/${t.name}-toggle-hover.png`, fullPage: false })
      // click 後驗證 URL 改變
      await kaiBtn.click()
      await page.waitForTimeout(900)
      const url = page.url()
      console.log(`[${t.name}] after click 繪: URL =`, url)
      await page.screenshot({ path: `${out}/${t.name}-after-click-kai.png`, fullPage: false })

      // 點 Gallery CTA — 應該到 /gallery/digital
      const cta = page.locator('a[href*="/gallery"]').first()
      const href = await cta.getAttribute('href')
      console.log(`[${t.name}] gallery CTA href after kai:`, href)
    }
  }

  await ctx.close()
}

await browser.close()
console.log('done')
