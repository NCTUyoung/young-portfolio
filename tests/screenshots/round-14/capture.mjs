import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-14'

const browser = await chromium.launch({ channel: 'msedge' })

for (const [name, vw, vh] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
  await page.waitForTimeout(500)

  const epilogue = page.locator('[aria-label="印 — Signature"]').first()
  if (await epilogue.count()) {
    await epilogue.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await epilogue.screenshot({ path: `${out}/${name}-epilogue.png` })

    // hover seal
    const seal = page.locator('.signature-seal').first()
    if (await seal.count()) {
      await seal.hover()
      await page.waitForTimeout(900)
      await epilogue.screenshot({ path: `${out}/${name}-epilogue-hover-seal.png` })
    }
  }

  await ctx.close()
}

await browser.close()
console.log('done')
