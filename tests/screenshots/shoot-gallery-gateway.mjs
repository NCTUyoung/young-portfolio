// Act-critic round screenshot helper — gallery overview 割面ゲートウェイ.
// Usage: node tests/screenshots/shoot-gallery-gateway.mjs <roundLabel>
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const round = process.argv[2] || 'round'
const outDir = join(__dirname, 'rounds', round)
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/young-portfolio/gallery/photography'

const browser = await chromium.launch()

async function shoot (label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  const gateway = page.locator('[aria-label="繪×影 割面ゲートウェイ"]')
  try {
    await gateway.scrollIntoViewIfNeeded({ timeout: 5000 })
    await page.waitForTimeout(800)
    await gateway.screenshot({ path: join(outDir, `${label}-gateway.png`) })
  } catch (e) {
    console.warn('gateway not found for', label, e.message)
  }
  await page.screenshot({ path: join(outDir, `${label}-gallery-viewport.png`) })
  await ctx.close()
}

await shoot('desktop', 1440, 900)
await shoot('mobile', 390, 844)
await browser.close()
console.log('shot ->', outDir)
