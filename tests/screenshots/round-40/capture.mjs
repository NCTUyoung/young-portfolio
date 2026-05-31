import { chromium } from 'playwright'

const base = 'http://localhost:3001/young-portfolio'
const out = 'tests/screenshots/round-40'

const browser = await chromium.launch({ channel: 'msedge' })

const pages = [
  { name: 'home', url: `${base}/` },
  { name: 'gallery-digital', url: `${base}/gallery/digital` },
  { name: 'gallery-photography', url: `${base}/gallery/photography` }
]

for (const p of pages) {
  for (const vp of [{ name: 'desktop', vw: 1440, vh: 900 }, { name: 'mobile', vw: 390, vh: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.vw, height: vp.vh } })
    const page = await ctx.newPage()
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('load')
    await page.addStyleTag({
      content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}.gallery-item{opacity:1!important;}`
    })
    await page.waitForTimeout(2200)
    const totalH = await page.evaluate(() => document.body.scrollHeight)
    let y = 0; let i = 1
    while (y < totalH && i <= 6) {
      await page.evaluate((s) => window.scrollTo({ top: s, behavior: 'instant' }), y)
      await page.waitForTimeout(450)
      await page.screenshot({ path: `${out}/${p.name}-${vp.name}-${String(i).padStart(2, '0')}.png`, fullPage: false })
      y += vp.vh; i++
    }
    console.log(`[${p.name}-${vp.name}] height ${totalH}px, ${i - 1} shots`)
    await ctx.close()
  }
}

await browser.close()
console.log('done')
