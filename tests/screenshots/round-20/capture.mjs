import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-20'

const browser = await chromium.launch({ channel: 'msedge' })

for (const [name, vw, vh] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
  await page.waitForTimeout(700)

  // Epilogue full
  const epilogue = page.locator('[aria-label="印 — Signature"]').first()
  if (await epilogue.count()) {
    await epilogue.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await epilogue.screenshot({ path: `${out}/${name}-epilogue-final.png` })
  }

  // Hero
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${name}-hero-final.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
