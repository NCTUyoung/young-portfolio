// node scripts/capture-painted-hall.mjs http://127.0.0.1:3001/young-portfolio/painted-worlds/index.html
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const target = new URL(process.argv[2])
const worlds = new URL('../public/painted-worlds/', import.meta.url)
const registry = JSON.parse(await readFile(new URL('work-registry.json', worlds), 'utf8'))
const years = [...new Set(registry.map(work => work.year))].sort((a, b) => a - b)
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
const files = []
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 910 },
      deviceScaleFactor: mobile ? 2 : 1.5,
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce'
    })
    await page.goto(target.href)
    for (const year of years) {
      await page.locator(`[data-year="${year}"]`).click()
      await page.locator(`body[data-mode="webgl"] [data-hanging-year="${year}"]`).waitFor({ timeout: 30_000 })
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const image = await page.locator('canvas').screenshot()
      const stem = year === years.at(-1) ? 'hall' : `hall-${year}`
      const filename = `media/${stem}${mobile ? '-mobile' : ''}.webp`
      files.push([filename, await sharp(image).webp({ quality: 86 }).toBuffer()])
    }
    await page.close()
  }
} finally {
  await browser.close()
}
for (const [filename, image] of files) {
  await writeFile(new URL(filename, worlds), image)
  console.log(filename)
}
