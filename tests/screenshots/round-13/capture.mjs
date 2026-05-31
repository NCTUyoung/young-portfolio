import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-13'

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
  }

  // Confluence ring revamp — scroll to confluence
  await page.evaluate(() => {
    const conf = document.querySelector('.confluence-marker')
    if (!conf) return
    const rect = conf.getBoundingClientRect()
    const target = window.scrollY + rect.top - (window.innerHeight * 0.5)
    window.scrollTo({ top: target, behavior: 'instant' })
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${out}/${name}-confluence-glow.png` })

  await ctx.close()
}

await browser.close()
console.log('done')
