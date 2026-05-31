import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-50'

const browser = await chromium.launch({ channel: 'msedge' })

const pairedId = 'photography-photography/春日街拍/DSC_7030-1'
const unpairedId = 'photography-photography/春日街拍/DSC_7033-1'

const tasks = [
  { name: 'viewer-paired-desktop', url: `${base}/gallery/photography?image=${encodeURIComponent(pairedId)}`, vw: 1440, vh: 900 },
  { name: 'viewer-paired-mobile', url: `${base}/gallery/photography?image=${encodeURIComponent(pairedId)}`, vw: 390, vh: 844 },
  { name: 'viewer-unpaired', url: `${base}/gallery/photography?image=${encodeURIComponent(unpairedId)}`, vw: 1440, vh: 900 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  await page.waitForTimeout(2500)
  try {
    await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000 })
  } catch { console.log(`[${t.name}] no viewer`); await ctx.close(); continue }
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/${t.name}.png`, fullPage: false })
  await ctx.close()
}

await browser.close()
console.log('done')
