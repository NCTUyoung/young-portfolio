import { chromium } from 'playwright'

const url = 'http://localhost:3000/young-portfolio/'
const out = 'tests/screenshots/round-11'

const browser = await chromium.launch({ channel: 'msedge' })

for (const [name, vw, vh] of [['desktop', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important;}' })
  await page.waitForTimeout(500)

  // Scroll to Journey heading first — top
  const journey = page.getByRole('heading', { name: /步履/ }).first()
  await journey.scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${name}-journey-top.png`, fullPage: false })

  // Scroll halfway through Journey
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes('步履'))
    if (el) {
      const sec = el.closest('section')
      if (sec) {
        const rect = sec.getBoundingClientRect()
        const pageTop = window.scrollY + rect.top
        const targetScroll = pageTop + rect.height * 0.45
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      }
    }
  })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${name}-journey-mid.png`, fullPage: false })

  // Scroll near end of Journey
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes('步履'))
    if (el) {
      const sec = el.closest('section')
      if (sec) {
        const rect = sec.getBoundingClientRect()
        const pageTop = window.scrollY + rect.top
        const targetScroll = pageTop + rect.height * 0.85
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      }
    }
  })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${name}-journey-bottom.png`, fullPage: false })

  await ctx.close()
}

await browser.close()
console.log('done')
