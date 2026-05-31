import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-19'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForLoadState('load')
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(700)

async function shotSeal (text, name, padBefore = 80) {
  const el = page.locator('.jp-seal').filter({ hasText: text }).first()
  if (!(await el.count())) return
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const b = await el.boundingBox()
  if (!b) return
  await page.screenshot({
    path: `${out}/seal-${name}.png`,
    clip: { x: Math.max(0, b.x - padBefore), y: Math.max(0, b.y - padBefore), width: b.width + padBefore * 2, height: b.height + padBefore * 2 },
  })
}

await shotSeal('楊', 'hero')

// open confluence + 合
await page.evaluate(() => {
  const d = document.querySelector('details.confluence-story')
  if (d) d.open = true
})
await page.waitForTimeout(400)
await shotSeal('合', 'confluence')
await shotSeal('対', 'dialogue')
await shotSeal('集', 'featured-collection')
await shotSeal('文', 'featured-article')

// Epilogue seal — specifically the larger one
const ep = page.locator('.signature-seal .jp-seal').first()
await ep.scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
const b = await ep.boundingBox()
if (b) {
  await page.screenshot({
    path: `${out}/seal-epilogue.png`,
    clip: { x: Math.max(0, b.x - 80), y: Math.max(0, b.y - 80), width: b.width + 160, height: b.height + 160 },
  })
}

await ctx.close()
await browser.close()
console.log('done')
