import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-16'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(500)

// Scroll to confluence area
await page.evaluate(() => {
  const detail = document.querySelector('details.confluence-story')
  if (detail) detail.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/confluence-story-closed.png`, fullPage: false })

// Open the details
await page.evaluate(() => {
  const detail = document.querySelector('details.confluence-story')
  if (detail) detail.open = true
})
await page.waitForTimeout(700)
await page.evaluate(() => {
  const detail = document.querySelector('details.confluence-story')
  if (detail) detail.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/confluence-story-open.png`, fullPage: false })

// Mobile
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page2 = await ctx2.newPage()
await page2.goto(url, { waitUntil: 'networkidle' })
await page2.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page2.evaluate(() => {
  const detail = document.querySelector('details.confluence-story')
  if (detail) {
    detail.open = true
    detail.scrollIntoView({ behavior: 'instant', block: 'center' })
  }
})
await page2.waitForTimeout(700)
await page2.screenshot({ path: `${out}/mobile-confluence-open.png`, fullPage: false })

await ctx.close()
await ctx2.close()
await browser.close()
console.log('done')
