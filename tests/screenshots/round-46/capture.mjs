import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-46'

const browser = await chromium.launch({ channel: 'msedge' })

const states = [
  { name: 'home-balanced', url: `${base}/` },
  { name: 'home-kai', url: `${base}/?focus=kai` },
  { name: 'home-kage', url: `${base}/?focus=kage` }
]

for (const s of states) {
  for (const vp of [{ name: 'desktop', vw: 1440, vh: 900 }, { name: 'mobile', vw: 390, vh: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.vw, height: vp.vh } })
    const page = await ctx.newPage()
    await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('load')
    await page.addStyleTag({
      content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}`
    })
    await page.waitForTimeout(2400)
    // Hero
    await page.screenshot({ path: `${out}/${s.name}-${vp.name}-hero.png`, fullPage: false })
    // Featured strip
    await page.evaluate(() => {
      const el = document.querySelector('#featured')
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/${s.name}-${vp.name}-featured.png`, fullPage: false })
    await ctx.close()
  }
}

await browser.close()
console.log('done')
