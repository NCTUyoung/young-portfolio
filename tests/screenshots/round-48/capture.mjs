import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-48'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'gallery-photo-desktop', url: `${base}/gallery/photography`, vw: 1440, vh: 900 },
  { name: 'gallery-photo-mobile', url: `${base}/gallery/photography`, vw: 390, vh: 844 },
  { name: 'gallery-digital-desktop', url: `${base}/gallery/digital`, vw: 1440, vh: 900 },
  { name: 'gallery-digital-mobile', url: `${base}/gallery/digital`, vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({
    content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}.gallery-item{opacity:1!important;}`
  })
  await page.waitForTimeout(2400)

  // Hero / first screen
  await page.screenshot({ path: `${out}/${t.name}-01.png`, fullPage: false })

  // Scroll to dual-split
  await page.evaluate(() => {
    const el = document.querySelector('.gallery-dual-split')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-split.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
