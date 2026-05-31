import { chromium } from 'playwright'

const base = 'http://localhost:3000/young-portfolio'
const out = 'tests/screenshots/round-30'

const browser = await chromium.launch({ channel: 'msedge' })

const tasks = [
  { name: 'desktop-article-top', url: `${base}/article`, vw: 1440, vh: 900 },
  { name: 'desktop-article-prologue', url: `${base}/article`, vw: 1440, vh: 900, scrollSelector: '.article-prologue-eyebrow' },
  { name: 'desktop-article-toc', url: `${base}/article`, vw: 1440, vh: 900, scrollSelector: '.article-toc-row' },
  { name: 'desktop-article-colophon', url: `${base}/article`, vw: 1440, vh: 900, scrollSelector: '.article-colophon-eyebrow' },
  { name: 'mobile-article-prologue', url: `${base}/article`, vw: 390, vh: 844, scrollSelector: '.article-prologue-eyebrow' },
  { name: 'mobile-article-toc', url: `${base}/article`, vw: 390, vh: 844, scrollSelector: '.article-toc-row' }
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

  if (t.scrollSelector) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
    }, t.scrollSelector)
    await page.waitForTimeout(600)
  }
  await page.screenshot({ path: `${out}/${t.name}.png`, fullPage: false })
  await ctx.close()
}

await browser.close()
console.log('done')
