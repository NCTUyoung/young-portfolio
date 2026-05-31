import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-18'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForLoadState('load')
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(700)

// hero seal 楊（variant C）
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(300)
const seals = await page.evaluate(() => {
  return [...document.querySelectorAll('.jp-seal')].map((s, i) => ({
    i,
    text: s.textContent?.trim(),
    classes: s.className,
  }))
})
console.log('seals:', JSON.stringify(seals, null, 2))

// individual seal close-ups
async function shotSeal (text, name) {
  const el = page.locator('.jp-seal').filter({ hasText: text }).first()
  if (!(await el.count())) return
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  const b = await el.boundingBox()
  if (!b) return
  await page.screenshot({
    path: `${out}/seal-${name}.png`,
    clip: { x: Math.max(0, b.x - 60), y: Math.max(0, b.y - 60), width: b.width + 120, height: b.height + 120 },
  })
}

await shotSeal('楊', 'A-hero-logo') // hero (variant C)
await shotSeal('対', 'dialogue') // dialogue (variant B)

// Open confluence details and capture 合
await page.evaluate(() => {
  const d = document.querySelector('details.confluence-story')
  if (d) d.open = true
})
await page.waitForTimeout(300)
await shotSeal('合', 'confluence') // variant A

// Featured cards
await page.evaluate(() => document.getElementById('featured')?.scrollIntoView({ behavior: 'instant', block: 'center' }))
await page.waitForTimeout(500)
await shotSeal('集', 'featured-zone-collection') // variant B
await shotSeal('文', 'featured-zone-article') // variant C

// Epilogue
await page.evaluate(() => document.getElementById('epilogue')?.scrollIntoView({ behavior: 'instant', block: 'center' }))
await page.waitForTimeout(500)
const ep = page.locator('.signature-seal .jp-seal').first()
const b = await ep.boundingBox()
if (b) {
  await page.screenshot({
    path: `${out}/seal-epilogue-A.png`,
    clip: { x: Math.max(0, b.x - 60), y: Math.max(0, b.y - 60), width: b.width + 120, height: b.height + 120 },
  })
}

// Combo: 4 cards comparison
await page.evaluate(() => document.getElementById('featured')?.scrollIntoView({ behavior: 'instant', block: 'start' }))
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/featured-overview.png`, fullPage: false })

await ctx.close()
await browser.close()
console.log('done')
