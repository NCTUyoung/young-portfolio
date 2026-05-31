import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-12'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(500)

// Find Journey section and confluence
async function scrollToConfluence (pct) {
  await page.evaluate((p) => {
    const conf = document.querySelector('.confluence-marker')
    if (!conf) return
    const rect = conf.getBoundingClientRect()
    const target = window.scrollY + rect.top - (window.innerHeight * p)
    window.scrollTo({ top: target, behavior: 'instant' })
  }, pct)
  await page.waitForTimeout(900)
}

await scrollToConfluence(0.85)
await page.screenshot({ path: `${out}/confluence-approaching.png`, fullPage: false })

await scrollToConfluence(0.55)
await page.screenshot({ path: `${out}/confluence-peak.png`, fullPage: false })

await scrollToConfluence(0.3)
await page.screenshot({ path: `${out}/confluence-passed.png`, fullPage: false })

await ctx.close()
await browser.close()
console.log('done')
