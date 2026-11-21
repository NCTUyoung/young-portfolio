import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { getHallWallView, layoutHallArt } from '../../public/painted-worlds/hall-hanging.js'
import { PerspectiveCamera, Vector3 } from '../../public/painted-worlds/vendor/three-gallery.js'

type Work = { id: string, year: number, art: { thumb: string } }
const worlds = new URL('../../public/painted-worlds/', import.meta.url)
const registry: Work[] = JSON.parse(readFileSync(new URL('work-registry.json', worlds), 'utf8'))
const documentPath = 'painted-worlds/index.html'

async function artworkFor(year: number) {
  return layoutHallArt(await Promise.all(registry.filter(work => work.year === year).map(async work => {
    const { width, height } = await sharp(fileURLToPath(new URL(work.art.thumb, worlds))).metadata()
    return { work, width, height }
  })))
}

async function waitForYear(page: Page, year: number) {
  await expect(page.locator('#scene')).toHaveAttribute('data-hanging-year', String(year), { timeout: 20_000 })
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'webgl')
}

async function paintingPoint(page: Page, item: Awaited<ReturnType<typeof artworkFor>>[number]) {
  await page.locator('#hall-view').selectOption(item.wall)
  const canvas = page.locator('canvas')
  await canvas.scrollIntoViewIfNeeded()
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const rect = (await canvas.boundingBox())!
  const aspect = rect.width / rect.height
  const view = getHallWallView(item.wall, aspect)
  const camera = new PerspectiveCamera(view.fov, aspect, .035, 140)
  camera.position.fromArray(view.position)
  camera.lookAt(new Vector3().fromArray(view.target))
  camera.updateMatrixWorld()
  const point = new Vector3().fromArray(item.position).project(camera)
  expect(Math.abs(point.x)).toBeLessThan(1)
  expect(Math.abs(point.y)).toBeLessThan(1)
  return { x: rect.x + (1 + point.x) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 }
}

test('changing year hangs the works in the same hall without loading room models', async ({ page }) => {
  // The CI browser renders in software while other room tests run. Each
  // gallery load still uses waitForYear's own readiness deadline.
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    document.addEventListener('webglcontextrestored', () => {
      const status = document.documentElement.dataset
      status.hallRestorations = String(Number(status.hallRestorations ?? 0) + 1)
    }, true)
  })
  const models: string[] = []
  const artworks = new Set<string>()
  page.on('request', request => {
    if (request.url().endsWith('.glb')) models.push(request.url().split('/').at(-1)!)
    if (request.url().includes('/_thumbs/')) artworks.add(request.url())
  })
  await page.goto(documentPath)
  await waitForYear(page, 2026)
  expect(artworks).toEqual(new Set(registry.filter(work => work.year === 2026).map(work => new URL(work.art.thumb, page.url()).href)))
  for (const year of [2024, 2025, 2026]) {
    await page.locator(`[data-year="${year}"]`).click()
    await waitForYear(page, year)
    await expect(page.locator('[data-door]')).toHaveCount(registry.filter(work => work.year === year).length)
  }
  const restorations = await page.evaluate(() => Number(document.documentElement.dataset.hallRestorations ?? 0))
  expect([...new Set(models)].sort()).toEqual(['hall.glb', 'statue.glb'])
  for (const asset of ['hall.glb', 'statue.glb']) {
    expect(models.filter(model => model === asset).length).toBeLessThanOrEqual(1 + restorations)
  }
  expect(artworks).toEqual(new Set(registry.map(work => new URL(work.art.thumb, page.url()).href)))
})

test('all fourteen physical paintings open their own rooms', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(documentPath)
  await waitForYear(page, 2026)
  for (const year of [2024, 2025, 2026]) {
    await page.locator(`[data-year="${year}"]`).click()
    const paintings = await artworkFor(year)
    for (const painting of paintings) {
      await waitForYear(page, year)
      const point = await paintingPoint(page, painting)
      await page.mouse.move(point.x, point.y)
      await expect(page.locator('canvas')).toHaveAttribute('data-hit', 'painting')
      await page.mouse.click(point.x, point.y)
      await expect(page.locator('body')).toHaveAttribute('data-world', painting.work.id)
      await page.locator('#back').click()
      await waitForYear(page, year)
      await expect(page.locator('#hall-view')).toHaveValue(painting.wall)
    }
  }
})

test.describe('phone hall', () => {
  test.use({ hasTouch: true, isMobile: true })

  for (const [width, height] of [[320, 568], [390, 844]]) {
    test(`${width}px shows the scene and first work row and supports tapping the wall`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(documentPath)
      await waitForYear(page, 2026)
      const bounds = await page.evaluate(() => {
        const scene = document.querySelector('#scene')!.getBoundingClientRect()
        const door = document.querySelector('.doors a')!.getBoundingClientRect()
        return { sceneBottom: scene.bottom, rowTop: door.top, rowBottom: door.bottom, width: document.documentElement.scrollWidth }
      })
      expect(bounds.width).toBe(width)
      expect(bounds.sceneBottom).toBeLessThan(bounds.rowTop)
      expect(bounds.rowBottom).toBeLessThanOrEqual(height)

      const paintings = await artworkFor(2026)
      const painting = paintings.find(item => item.work.id === (width === 320 ? 'orchard' : 'stage'))!
      const point = await paintingPoint(page, painting)
      await page.touchscreen.tap(point.x, point.y)
      await expect(page.locator('body')).toHaveAttribute('data-world', painting.work.id)
    })
  }
})

test('without WebGL, the selected year still links to its room and mobile views', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return getContext.call(this, type, ...args)
    } as typeof getContext
  })
  const models: string[] = []
  page.on('request', request => { if (request.url().endsWith('.glb')) models.push(request.url()) })
  await page.goto(documentPath)
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('#hall-view')).toBeHidden()
  await page.locator('[data-year="2025"]').click()
  await expect(page.locator('[data-door]')).toHaveCount(5)
  await expect.poll(() => page.locator('.still img').evaluate((image: HTMLImageElement) =>
    image.complete && image.naturalWidth > 0 ? image.currentSrc : '')).toMatch(/hall-2025-mobile\.webp$/)
  await page.locator('[data-door="cosplayer"]').click()
  await expect(page.locator('body')).toHaveAttribute('data-world', 'cosplayer')
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'stills')
  await expect.poll(() => page.locator('.still img').evaluate((image: HTMLImageElement) =>
    image.complete && image.naturalWidth > 0 ? image.currentSrc : '')).toMatch(/cosplayer\/.*mobile\.webp$/)
  expect(models).toEqual([])
})

test('the corridor follows the year of the room restored by browser history', async ({ page }) => {
  await page.route('**/painted-worlds/renderer.js', route => route.abort())
  await page.goto(documentPath + '#2024-23')
  await expect(page.locator('body')).toHaveAttribute('data-world', '2024-23')
  await page.locator('#back').click()
  await page.locator('[data-year="2025"]').click()
  await expect(page.locator('[data-year="2025"]')).toHaveAttribute('aria-pressed', 'true')

  await page.goBack()
  await expect(page.locator('body')).toHaveAttribute('data-world', '2024-23')
  await page.locator('#back').click()
  await expect(page.locator('[data-year="2024"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-door="2024-23"]')).toBeVisible()
  await expect(page.locator('[data-door="cosplayer"]')).toHaveCount(0)
})
