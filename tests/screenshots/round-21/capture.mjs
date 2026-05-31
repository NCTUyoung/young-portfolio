import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-21'

const browser = await chromium.launch({ channel: 'msedge' })

// 直接帶 ?image=<id> 進場（透過 useGalleryImageRoute 自動開 viewer）
const photoId = 'photography-photography/春日街拍/DSC_7030-1'
const digitalId = 'digital-gallery/2018年電繪作品/Capsule'

const tasks = [
  { name: 'desktop-photo', url: `${base}/gallery/photography?image=${encodeURIComponent(photoId)}`, vw: 1440, vh: 900 },
  { name: 'desktop-digital', url: `${base}/gallery/digital?image=${encodeURIComponent(digitalId)}`, vw: 1440, vh: 900 },
  { name: 'mobile-photo', url: `${base}/gallery/photography?image=${encodeURIComponent(photoId)}`, vw: 390, vh: 844 }
]

for (const t of tasks) {
  const ctx = await browser.newContext({ viewport: { width: t.vw, height: t.vh } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(`[${t.name}] pageerror:`, e.message))
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('load')
  // 給資料載入 + auto-open viewer 一些時間
  await page.waitForTimeout(2500)

  try {
    await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000, state: 'attached' })
  } catch {
    console.log(`[${t.name}] dialog never attached`)
    await page.screenshot({ path: `${out}/${t.name}-debug.png`, fullPage: false })
    await ctx.close()
    continue
  }
  await page.waitForTimeout(900)

  await page.screenshot({ path: `${out}/${t.name}-viewer.png`, fullPage: false })

  // 開 InfoPanel
  await page.keyboard.press('i')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${t.name}-viewer-info.png`, fullPage: false })

  // 關 info, 翻頁兩張
  await page.keyboard.press('i')
  await page.waitForTimeout(400)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/${t.name}-viewer-next.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
