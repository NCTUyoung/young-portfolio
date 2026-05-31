// Act-critic round screenshot helper.
// Usage: node tests/screenshots/shoot-featured.mjs <roundLabel>
// Captures the index "相片庫 / 精選 Featured" section at desktop + mobile widths.
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const round = process.argv[2] || 'round'
const outDir = join(__dirname, 'rounds', round)
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/young-portfolio/'

// Resolve the bundled Chromium that playwright installed.
const browser = await chromium.launch()

async function shoot (label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  // domcontentloaded + settle: dev HMR websocket keeps `networkidle` from firing.
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1000)
  // Trigger scroll-reveal + lazy images by scrolling through the page.
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  const featured = page.locator('#featured')
  await featured.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  // Element shot — the section itself.
  await featured.screenshot({ path: join(outDir, `${label}-featured.png`) })
  // Viewport shot — what the visitor actually sees at that scroll position.
  await page.screenshot({ path: join(outDir, `${label}-viewport.png`) })
  await ctx.close()
}

await shoot('desktop', 1440, 900)
await shoot('mobile', 390, 844)
await browser.close()
console.log('shot ->', outDir)
