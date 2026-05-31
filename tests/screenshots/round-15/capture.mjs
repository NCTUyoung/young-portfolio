import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-15'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(500)

// Hero (top) — chapter rail shows 序 active
await page.screenshot({ path: `${out}/desktop-hero-rail.png`, fullPage: false })

// scroll to dialogue
await page.evaluate(() => {
  const el = document.getElementById('dialogue')
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/desktop-dialogue-rail.png`, fullPage: false })

// scroll to journey
await page.evaluate(() => {
  const el = document.getElementById('journey')
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/desktop-journey-rail.png`, fullPage: false })

// scroll to epilogue
await page.evaluate(() => {
  const el = document.getElementById('epilogue')
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/desktop-epilogue-rail.png`, fullPage: false })

await ctx.close()
await browser.close()
console.log('done')
