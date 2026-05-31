import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-09'

const browser = await chromium.launch({ channel: 'msedge' })

for (const [name, vw, vh] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  // 強制把所有 .reveal 元素設為 revealed（讓 screenshot 看到 post-animation 狀態）
  await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
  await page.waitForTimeout(800)

  await page.screenshot({ path: `${out}/${name}-home-revealed.png`, fullPage: true })

  // 額外：定位到 対話 section 的局部截圖
  const section = page.locator('[aria-label="繪と影 — 対話"]').first()
  if (await section.count()) {
    await section.screenshot({ path: `${out}/${name}-dialogue.png` })
  }
  await ctx.close()
}

await browser.close()
console.log('done')
