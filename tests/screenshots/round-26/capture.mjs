import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-26'

const browser = await chromium.launch({ channel: 'msedge' })

// 帶 image-level note 的圖片 → InfoPanel 顯示「単張記 · IMAGE NOTE」chip
const noteId = 'photography-photography/春日街拍/DSC_7030-1'
// 無 note 的圖片 → InfoPanel 退回 annotation (event-level)
const fallbackId = 'photography-photography/春日街拍/DSC_7033-1'

const tasks = [
  { name: 'desktop-image-note', url: `${base}/gallery/photography?image=${encodeURIComponent(noteId)}`, vw: 1440, vh: 900, openSpread: true },
  { name: 'desktop-fallback-annotation', url: `${base}/gallery/photography?image=${encodeURIComponent(fallbackId)}`, vw: 1440, vh: 900, openSpread: true },
  { name: 'desktop-article-colophon', url: `${base}/article`, vw: 1440, vh: 900 },
  { name: 'mobile-article-colophon', url: `${base}/article`, vw: 390, vh: 844 },
  { name: 'mobile-image-note', url: `${base}/gallery/photography?image=${encodeURIComponent(noteId)}`, vw: 390, vh: 844, openSpread: true }
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

  if (t.openSpread) {
    try {
      await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000 })
    } catch { console.log(`[${t.name}] viewer not opened`); await ctx.close(); continue }
    await page.waitForTimeout(900)
    await page.keyboard.press('i')
    await page.waitForTimeout(1100)
    await page.screenshot({ path: `${out}/${t.name}-spread.png`, fullPage: false })
    await ctx.close()
    continue
  }

  // Article page — scroll to colophon
  await page.evaluate(() => {
    const el = document.querySelector('.article-colophon-eyebrow') || document.querySelector('.article-colophon-tail')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/${t.name}-section.png`, fullPage: false })

  // Article full page (scroll bottom)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-bottom.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
