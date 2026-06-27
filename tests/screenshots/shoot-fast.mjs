// Fast site screenshot flow — captures home + both gallery worlds, desktop + mobile,
// first-screen (top) + full-page, ALL IN PARALLEL (6 contexts at once) for speed.
//
// Usage:
//   node tests/screenshots/shoot-fast.mjs <label>          # all 6 (default)
//   node tests/screenshots/shoot-fast.mjs <label> gallery  # only the two gallery worlds (4 shots) — fastest
//   node tests/screenshots/shoot-fast.mjs <label> home     # only homepage (2 shots)
//
// npm aliases: `npm run shoot -- <label> [scope]`
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'fast'
const scope = process.argv[3] || 'all'
const outDir = join(__dirname, 'rounds', label)
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/young-portfolio/'
const ALL_VIEWS = {
  home: { name: 'home', path: '' },
  'gallery-digital': { name: 'gallery-digital', path: 'gallery/digital' },
  'gallery-photography': { name: 'gallery-photography', path: 'gallery/photography' }
}
const VIEWS =
  scope === 'gallery' ? [ALL_VIEWS['gallery-digital'], ALL_VIEWS['gallery-photography']]
  : scope === 'home' ? [ALL_VIEWS.home]
  : Object.values(ALL_VIEWS)
const DEVICES = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 }
]

const browser = await chromium.launch()

async function shoot (view, dev) {
  const ctx = await browser.newContext({ viewport: { width: dev.width, height: dev.height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + view.path, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(900)
    await page.screenshot({ path: join(outDir, `${view.name}-${dev.tag}-top.png`) })
    // Walk to fire scroll-reveal + lazy images (tighter cadence than the slow flow).
    await page.evaluate(async () => {
      const step = window.innerHeight
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, 90))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(350)
    await page.screenshot({ path: join(outDir, `${view.name}-${dev.tag}-full.png`), fullPage: true })
    // Record full scroll height + screens-deep (viewport multiples) so reviewers can
    // objectively track "縮短滑動" — how many screens the visitor must scroll.
    const scrollPx = await page.evaluate(() => document.documentElement.scrollHeight)
    return { key: `${view.name}-${dev.tag}`, scrollPx, screensDeep: +(scrollPx / dev.height).toFixed(1) }
  } finally {
    await ctx.close()
  }
}

// All view×device pairs run concurrently — the real speedup vs sequential.
const jobs = []
for (const view of VIEWS) for (const dev of DEVICES) jobs.push(shoot(view, dev))
const t0 = process.hrtime.bigint()
const results = await Promise.all(jobs)
const ms = Number(process.hrtime.bigint() - t0) / 1e6
await browser.close()
const heights = Object.fromEntries(results.map(r => [r.key, { scrollPx: r.scrollPx, screensDeep: r.screensDeep }]))
writeFileSync(join(outDir, 'heights.json'), JSON.stringify(heights, null, 2))
console.log(`shot ${jobs.length} frames (${scope}) in ${(ms / 1000).toFixed(1)}s -> ${outDir}`)
console.log('scroll depth (screens):', results.map(r => `${r.key}=${r.screensDeep}`).join('  '))
