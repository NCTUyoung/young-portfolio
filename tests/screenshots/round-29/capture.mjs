import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-29'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'desktop-balanced', url: `${base}/`, vw: 1440, vh: 900 },
  { name: 'desktop-kai', url: `${base}/?focus=kai`, vw: 1440, vh: 900 },
  { name: 'desktop-kage', url: `${base}/?focus=kage`, vw: 1440, vh: 900 },
  { name: 'mobile-balanced', url: `${base}/`, vw: 390, vh: 844 },
  { name: 'mobile-kai', url: `${base}/?focus=kai`, vw: 390, vh: 844 },
  { name: 'mobile-kage', url: `${base}/?focus=kage`, vw: 390, vh: 844 },
  // 確認 hero → /gallery/digital 後 TabBar 自動切到 digital
  { name: 'desktop-gallery-digital-from-hero', url: `${base}/gallery/digital`, vw: 1440, vh: 900 }
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

  await page.screenshot({ path: `${out}/${t.name}.png`, fullPage: false })
  await ctx.close()
}

await browser.close()
console.log('done')
