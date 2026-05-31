import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-31'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'desktop', vw: 1440, vh: 900 },
  { name: 'mobile', vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${t.name}] pageerror:`, e.message))
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({
    content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}`
  })
  await page.waitForTimeout(2400)

  // Hero (top)
  await page.screenshot({ path: `${out}/${t.name}-01-hero.png`, fullPage: false })

  // Scroll through page in chunks to capture full layout
  const viewportH = t.vh
  const totalH = await page.evaluate(() => document.body.scrollHeight)
  let y = 0
  let i = 2
  while (y + viewportH < totalH && i < 12) {
    y += viewportH
    await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'instant' }), y)
    await page.waitForTimeout(450)
    await page.screenshot({ path: `${out}/${t.name}-${String(i).padStart(2, '0')}-scroll.png`, fullPage: false })
    i++
  }

  console.log(`[${t.name}] total page height: ${totalH}px, took ${i - 1} screenshots`)
  await ctx.close()
}

await browser.close()
console.log('done')
