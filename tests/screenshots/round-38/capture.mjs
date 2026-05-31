import { chromium } from 'playwright'

const base = 'http://localhost:3001/young-portfolio'
const out = 'tests/screenshots/round-38'

const browser = await chromium.launch({ channel: 'msedge' })

const pages = [
  { name: 'article-toc', url: `${base}/article` },
  { name: 'article-design-thinking', url: `${base}/article/design-thinking` },
  { name: 'article-gear-119mm', url: `${base}/article/gear-119mm` }
]

for (const p of pages) {
  for (const vp of [{ name: 'desktop', vw: 1440, vh: 900 }, { name: 'mobile', vw: 390, vh: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.vw, height: vp.vh } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log(`[${p.name}-${vp.name}] pageerror:`, e.message))
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('load')
    await page.addStyleTag({
      content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}.gallery-item{opacity:1!important;}`
    })
    await page.waitForTimeout(2400)

    // Scroll-stitch
    const totalH = await page.evaluate(() => document.body.scrollHeight)
    const viewportH = vp.vh
    let y = 0; let i = 1
    while (y < totalH && i <= 6) {
      await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'instant' }), y)
      await page.waitForTimeout(450)
      await page.screenshot({ path: `${out}/${p.name}-${vp.name}-${String(i).padStart(2, '0')}.png`, fullPage: false })
      y += viewportH
      i++
    }
    console.log(`[${p.name}-${vp.name}] height ${totalH}px, ${i - 1} shots`)
    await ctx.close()
  }
}

await browser.close()
console.log('done')
