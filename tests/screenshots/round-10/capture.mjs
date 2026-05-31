import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-10'

const browser = await chromium.launch({ channel: 'msedge' })

for (const [name, vw, vh] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
  await page.waitForTimeout(800)

  const dialogue = page.locator('[aria-label="繪と影 — 対話"]').first()
  if (await dialogue.count()) {
    await dialogue.screenshot({ path: `${out}/${name}-dialogue.png` })
  }

  // Featured 対 divider local screenshot — scroll first
  const featuredLink = page.locator('a[href="#dialogue"]').first()
  if (await featuredLink.count()) {
    await featuredLink.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    const box = await featuredLink.boundingBox()
    if (box) {
      const pad = 120
      await page.screenshot({
        path: `${out}/${name}-featured-divider.png`,
        clip: {
          x: Math.max(0, box.x - 280),
          y: Math.max(0, box.y - pad),
          width: Math.min(vw, box.width + 560),
          height: Math.min(box.height + pad * 2, 220),
        },
      })

      // Hover screenshot — show accent micro-tell
      await featuredLink.hover()
      await page.waitForTimeout(400)
      const box2 = await featuredLink.boundingBox()
      if (box2) {
        await page.screenshot({
          path: `${out}/${name}-featured-divider-hover.png`,
          clip: {
            x: Math.max(0, box2.x - 280),
            y: Math.max(0, box2.y - pad),
            width: Math.min(vw, box2.width + 560),
            height: Math.min(box2.height + pad * 2, 220),
          },
        })
      }
    }
  }

  await ctx.close()
}

await browser.close()
console.log('done')
