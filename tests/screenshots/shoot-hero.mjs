// R48 act-critic round: capture the HERO first screen (where the dual-track
// startYear ledger now lives) + the Featured section.
// Usage: node tests/screenshots/shoot-hero.mjs <roundLabel>
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const round = process.argv[2] || 'round'
const outDir = join(__dirname, 'rounds', round)
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/young-portfolio/'
const browser = await chromium.launch()

async function shoot (label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  // domcontentloaded avoids HMR websocket keeping networkidle from settling in dev.
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Let reveal entrance animations settle (above-fold .reveal fade-in ~0.8s + delays).
  await page.waitForTimeout(3000)
  // Hero first-screen viewport shot — what a first visitor hits in 3 seconds.
  await page.screenshot({ path: join(outDir, `${label}-hero-viewport.png`) })
  // Element shot of the track ledger.
  const ledger = page.locator('.track-ledger')
  if (await ledger.count()) {
    await ledger.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await ledger.screenshot({ path: join(outDir, `${label}-ledger.png`) })
  }
  await ctx.close()
}

await shoot('desktop', 1440, 900)
await shoot('mobile', 390, 844)
await browser.close()
console.log('shot ->', outDir)
