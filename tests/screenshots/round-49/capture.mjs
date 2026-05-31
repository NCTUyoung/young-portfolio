import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-49'

const browser = await chromium.launch({ channel: 'msedge' })

// Image that has pairWith (春日街拍 #7030)
const pairedId = 'photography-photography/春日街拍/DSC_7030-1'

const tasks = [
  { name: 'gallery-photo-desktop', url: `${base}/gallery/photography`, vw: 1440, vh: 900, scrollSel: '.gallery-dual-split' },
  { name: 'gallery-photo-mobile', url: `${base}/gallery/photography`, vw: 390, vh: 844, scrollSel: '.gallery-dual-split' },
  { name: 'viewer-paired-desktop', url: `${base}/gallery/photography?image=${encodeURIComponent(pairedId)}`, vw: 1440, vh: 900, openSpread: true, scrollSel: '.info-paired' }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.addStyleTag({ content: `.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}` })
  await page.waitForTimeout(2400)

  if (t.openSpread) {
    try {
      await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000 })
    } catch { console.log(`[${t.name}] no viewer`); await ctx.close(); continue }
    await page.waitForTimeout(900)
    await page.keyboard.press('i')
    await page.waitForTimeout(1100)
    // scroll spread article to find paired
    await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
    }, t.scrollSel)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/${t.name}-paired.png`, fullPage: false })
    await ctx.close()
    continue
  }

  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
  }, t.scrollSel)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-split-wider-gap.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
