import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-17'

const browser = await chromium.launch({ channel: 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
await page.waitForTimeout(500)

// Hero seal 楊
const heroSeal = page.locator('.jp-seal').first()
await heroSeal.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
const box1 = await heroSeal.boundingBox()
if (box1) {
  await page.screenshot({
    path: `${out}/hero-seal-zoom.png`,
    clip: {
      x: Math.max(0, box1.x - 30),
      y: Math.max(0, box1.y - 30),
      width: box1.width + 60,
      height: box1.height + 60,
    },
  })
}

// Open confluence details and zoom 合 seal
await page.evaluate(() => {
  const d = document.querySelector('details.confluence-story')
  if (d) d.open = true
})
await page.waitForTimeout(500)
await page.evaluate(() => {
  const seals = [...document.querySelectorAll('.jp-seal')]
  const heSeal = seals.find((s) => s.textContent?.trim() === '合')
  if (heSeal) heSeal.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(600)

const sealHe = page.locator('.jp-seal', { hasText: '合' }).first()
const boxHe = await sealHe.boundingBox()
if (boxHe) {
  await page.screenshot({
    path: `${out}/confluence-seal-zoom.png`,
    clip: {
      x: Math.max(0, boxHe.x - 60),
      y: Math.max(0, boxHe.y - 60),
      width: boxHe.width + 120,
      height: boxHe.height + 120,
    },
  })
}

// Epilogue seal 楊（書末）
await page.evaluate(() => {
  const el = document.getElementById('epilogue')
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(500)
const sealEpilogue = page.locator('.signature-seal .jp-seal').first()
const boxEp = await sealEpilogue.boundingBox()
if (boxEp) {
  await page.screenshot({
    path: `${out}/epilogue-seal-zoom.png`,
    clip: {
      x: Math.max(0, boxEp.x - 60),
      y: Math.max(0, boxEp.y - 60),
      width: boxEp.width + 120,
      height: boxEp.height + 120,
    },
  })
}

// Overview: featured cards with 集 文 seals
const featured = page.locator('#featured').first()
await featured.scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/featured-cards-seals.png`, fullPage: false })

await ctx.close()
await browser.close()
console.log('done')
