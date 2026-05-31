// Act-critic round screenshot helper — gallery 「起算尺」track transition overlay.
// Usage: node tests/screenshots/shoot-gallery-ledger.mjs <roundLabel>
// Loads /gallery/digital, clicks the 影 tab, and captures the ledger sweep overlay
// mid-animation (marker sliding 2018 -> 2024), plus the settled viewport.
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const round = process.argv[2] || 'round'
const outDir = join(__dirname, 'rounds', round)
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/young-portfolio/gallery/digital'

const browser = await chromium.launch()

async function shoot (label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)

  // Click the 影 (photography) tab to trigger the track transition overlay.
  // Desktop: rail tab is visible. Mobile/tablet: the in-page TabBar tab is used.
  const photoTab = page.locator('a[href*="/gallery/photography"]:visible').first()
  try {
    await photoTab.scrollIntoViewIfNeeded({ timeout: 3000 })
    // noWaitAfter: NuxtLink does a client-side route change; don't block on navigation.
    await photoTab.click({ timeout: 5000, noWaitAfter: true })
  } catch (e) {
    console.warn('photo tab click failed for', label, e.message)
  }

  // Late-sweep: marker near 2024 + declaration fading in (~1000ms into the 1.1s slide).
  await page.waitForTimeout(1000)
  // Page-level shot (element is intentionally animating, so we shoot the viewport).
  await page.screenshot({ path: join(outDir, `${label}-ledger-xition.png`) })
  // Mirror to the conventional name the round harness reads.
  await page.screenshot({ path: join(outDir, `${label}-featured.png`) })

  // After overlay fades out: settled photography gallery.
  await page.waitForTimeout(1800)
  await page.screenshot({ path: join(outDir, `${label}-viewport.png`) })
  await ctx.close()
}

await shoot('desktop', 1440, 900)
await shoot('mobile', 390, 844)
await browser.close()
console.log('shot ->', outDir)
