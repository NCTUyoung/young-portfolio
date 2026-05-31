import { chromium } from 'playwright'

const base = 'http://localhost:3001/young-portfolio'
const out = 'tests/screenshots/round-44'

const browser = await chromium.launch({ channel: 'msedge' })

const pages = [
  { name: 'home', url: `${base}/` },
  { name: 'gallery-event-haru', url: `${base}/gallery/photography/${encodeURIComponent('春日街拍')}` },
  { name: 'gallery-event-wbc', url: `${base}/gallery/photography/${encodeURIComponent('WBC 2026')}` },
  { name: 'gallery-event-annber', url: `${base}/gallery/photography/${encodeURIComponent('Annber 外拍')}` }
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
    await page.waitForTimeout(2400)

    // For event pages, scroll to find prologue + axes
    if (p.name.startsWith('gallery-event')) {
      await page.evaluate(() => {
        const el = document.querySelector('.event-cover-prologue') || document.querySelector('.event-cover-meta')
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${out}/${p.name}-${vp.name}-axes.png`, fullPage: false })
    } else {
      // Home
      await page.screenshot({ path: `${out}/${p.name}-${vp.name}-01.png`, fullPage: false })
    }
    await ctx.close()
  }
}

await browser.close()
console.log('done')
