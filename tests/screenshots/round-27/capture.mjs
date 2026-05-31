import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-27'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'desktop-hero', url: `${base}/`, vw: 1440, vh: 900 },
  { name: 'mobile-hero', url: `${base}/`, vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${t.name}] pageerror:`, e.message))
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({
    content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}`
  })
  await page.waitForTimeout(2200)

  // Balanced (default)
  await page.screenshot({ path: `${out}/${t.name}-balanced.png`, fullPage: false })

  // Click 繪 toggle
  const kaiBtn = page.locator('button.hero-toggle').first()
  if (await kaiBtn.count()) {
    await kaiBtn.click()
    await page.waitForTimeout(900) // wait for transition
    await page.screenshot({ path: `${out}/${t.name}-focus-kai.png`, fullPage: false })

    // Click 繪 again to deactivate, then click 影
    await kaiBtn.click()
    await page.waitForTimeout(500)
    const kageBtn = page.locator('button.hero-toggle').nth(1)
    if (await kageBtn.count()) {
      await kageBtn.click()
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${out}/${t.name}-focus-kage.png`, fullPage: false })
    }
  } else {
    console.log(`[${t.name}] no toggle button found`)
  }

  await ctx.close()
}

// Also capture article colophon polish
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page2 = await ctx2.newPage()
await page2.goto(`${base}/article`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page2.waitForLoadState('load')
await page2.addStyleTag({ content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}` })
await page2.waitForTimeout(1800)
await page2.evaluate(() => {
  const el = document.querySelector('.article-colophon-eyebrow')
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page2.waitForTimeout(500)
await page2.screenshot({ path: `${out}/desktop-article-colophon-polish.png`, fullPage: false })
await ctx2.close()

await browser.close()
console.log('done')
