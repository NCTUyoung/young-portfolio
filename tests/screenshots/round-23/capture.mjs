import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-23'

const browser = await chromium.launch({ channel: 'msedge' })

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
  await page.waitForTimeout(2500)

  try {
    await page.waitForSelector('[role="dialog"][aria-label="圖片檢視器"]', { timeout: 8000 })
  } catch {
    console.log(`[${t.name}] dialog never attached`)
    await ctx.close(); continue
  }
  await page.waitForTimeout(900)

  // Viewer 純圖（info 未開）
  await page.screenshot({ path: `${out}/${t.name}-viewer.png`, fullPage: false })

  // 按 I 打開對頁 spread takeover
  await page.keyboard.press('i')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${out}/${t.name}-spread.png`, fullPage: false })

  // 跨頁底部視角（scroll spread article 200px 看 colophon）
  await page.evaluate(() => {
    const article = document.querySelector('.info-spread__leaf--article')
    if (article) article.scrollTop = 600
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${t.name}-spread-bottom.png`, fullPage: false })

  // 闔書（按 I 再開回 viewer）
  await page.keyboard.press('i')
  await page.waitForTimeout(700)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500)
  await page.keyboard.press('i')
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${t.name}-spread-next.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
