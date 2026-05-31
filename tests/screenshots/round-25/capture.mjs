import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-25'

const browser = await chromium.launch({ channel: 'msedge' })

const photoId = 'photography-photography/春日街拍/DSC_7030-1'

const tasks = [
  // Event Cover (prologue 改 polish 後)
  { name: 'desktop-cover-haru', url: `${base}/gallery/photography/${encodeURIComponent('春日街拍')}`, vw: 1440, vh: 900 },
  { name: 'desktop-cover-annber', url: `${base}/gallery/photography/${encodeURIComponent('Annber 外拍')}`, vw: 1440, vh: 900 },
  { name: 'mobile-cover-haru', url: `${base}/gallery/photography/${encodeURIComponent('春日街拍')}`, vw: 390, vh: 844 },
  // InfoPanel spread（annotation 已分化）
  { name: 'desktop-spread', url: `${base}/gallery/photography?image=${encodeURIComponent(photoId)}`, vw: 1440, vh: 900, openSpread: true }
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
  await page.waitForTimeout(2400)

  if (t.openSpread) {
    try {
      await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000 })
    } catch {
      console.log(`[${t.name}] viewer not opened`); await ctx.close(); continue
    }
    await page.waitForTimeout(900)
    await page.keyboard.press('i')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${out}/${t.name}-annotation.png`, fullPage: false })
    await ctx.close()
    continue
  }

  try {
    await page.waitForSelector('.event-cover-prologue', { timeout: 8000 })
  } catch {
    console.log(`[${t.name}] prologue not found`)
    await page.screenshot({ path: `${out}/${t.name}-debug.png`, fullPage: false })
    await ctx.close(); continue
  }
  await page.waitForTimeout(700)

  await page.evaluate(() => {
    const el = document.querySelector('.event-cover-meta')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/${t.name}-prologue.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
