import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-24'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  // 進入特定 event：春日街拍 → EventCover 應該帶卷頭語
  { name: 'desktop-event-cover', url: `${base}/gallery/photography/${encodeURIComponent('春日街拍')}`, vw: 1440, vh: 900 },
  { name: 'desktop-event-cover-amber', url: `${base}/gallery/photography/${encodeURIComponent('Annber 外拍')}`, vw: 1440, vh: 900 },
  { name: 'mobile-event-cover', url: `${base}/gallery/photography/${encodeURIComponent('春日街拍')}`, vw: 390, vh: 844 }
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

  // 等 event-cover 出現
  try {
    await page.waitForSelector('.event-cover', { timeout: 8000 })
  } catch {
    console.log(`[${t.name}] event-cover not found`)
    await page.screenshot({ path: `${out}/${t.name}-debug.png`, fullPage: false })
    await ctx.close(); continue
  }
  await page.waitForTimeout(900)

  // 全頁截圖（含 hero + 卷頭語 + expand button）
  const cover = page.locator('.event-cover')
  await cover.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  // Hero with prologue visible（scroll 一點點看 prologue 完整）
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-prologue.png`, fullPage: false })

  // 再 scroll 多點，整個 cover meta block 滿屏
  await page.evaluate(() => {
    const el = document.querySelector('.event-cover-meta')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-meta.png`, fullPage: false })

  // Top of page (cover image)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-top.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
