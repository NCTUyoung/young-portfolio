import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { expectPaintedWorldDialog } from './painted-world-dialog'
import { waitForSiteHydration } from './site-ready'

type Room = { views: { position: number[], target: number[] }[], mobileStills: string[] }
type Work = { id: string, workId: string, title: string, year: number, art: { title: string } }
function readPublicJson<T>(path: string): T {
  return JSON.parse(readFileSync(new URL('../../public/' + path, import.meta.url), 'utf8'))
}

const years = [2024, 2025, 2026]
const roomDocument = 'painted-worlds/index.html'
const { Img: gallery } = readPublicJson<{ Img: { filename: string }[] }>('galleryList.json')
const { models, rooms } = readPublicJson<{ rooms: Record<string, Room>, models: Record<string, string> }>('painted-worlds/exhibition.json')
const registry = readPublicJson<Work[]>('painted-worlds/work-registry.json')

test('every 2024–2026 original has its own room and two distinct viewpoints', async () => {
  const workIds = gallery
    .filter(work => /^gallery\/202[456]年電繪作品\//.test(work.filename))
    .map(work => 'digital-' + work.filename.replace(/\.[^/.]+$/, ''))
  expect(registry.map(work => work.workId).sort()).toEqual(workIds.sort())
  expect(new Set(registry.map(work => work.id)).size).toBe(workIds.length)
  for (const { id } of registry) {
    expect(models[id], id).toMatch(/\.glb$/)
    const views = rooms[id]?.views
    expect(views?.length, id).toBeGreaterThanOrEqual(2)
    expect(new Set(views.map(view => JSON.stringify([view.position, view.target]))).size, id).toBe(views.length)
  }
})

for (const year of years) {
  const works = registry.filter(work => work.year === year)

  test(`${year} originals open the matching WebGL room from the gallery`, async ({ page }) => {
    test.setTimeout(150_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const modelRequests: string[] = []
    page.on('request', request => {
      const path = new URL(request.url()).pathname
      if (path.endsWith('.glb')) modelRequests.push(decodeURIComponent(path))
    })
    await page.goto('gallery/digital')
    await waitForSiteHydration(page)
    await expect(page.getByTestId('gallery-work-painted-room')).toHaveCount(registry.length)
    expect(modelRequests).toEqual([])

    for (const work of works) {
      const entrance = page.locator(`main figure [data-painted-room="${work.id}"]`)
      await entrance.scrollIntoViewIfNeeded()
      const source = page.url()
      const scroll = await page.evaluate(() => scrollY)
      const modelResponse = page.waitForResponse(response => {
        const path = decodeURIComponent(new URL(response.url()).pathname)
        return path.endsWith(models[work.id].slice(1)) && response.ok()
      })
      await entrance.click()
      const { close, dialog, frame } = await expectPaintedWorldDialog(page, work.title)
      await modelResponse
      await expect(frame.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
      await expect(frame.locator('body')).toHaveAttribute('data-mode', 'webgl')
      await expect(frame.locator('body')).toHaveAttribute('data-world', work.id)
      const stations = frame.getByRole('navigation', { name: '展線站點' }).getByRole('button')
      await stations.nth(1).click()
      await expect(stations.nth(1)).toHaveAttribute('aria-pressed', 'true')
      await expect(frame.locator('body')).toHaveAttribute('data-stop', '1')
      await frame.getByRole('button', { name: '看原畫', exact: true }).click()
      const original = frame.getByRole('dialog')
      await expect(original.getByRole('heading', { name: work.art.title, exact: true })).toBeVisible()
      await expect.poll(() => original.getByRole('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
      await close.click()
      await expect(dialog).toBeHidden()
      await expect(entrance).toBeFocused()
      await expect(page).toHaveURL(source)
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll)
    }
    expect(modelRequests).toHaveLength(works.length)
  })

  test(`${year} bookmarks use the room's own mobile views when WebGL is unavailable`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
        return getContext.call(this, type, ...args)
      } as typeof getContext
    })
    const modelRequests: string[] = []
    page.on('request', request => {
      if (new URL(request.url()).pathname.endsWith('.glb')) modelRequests.push(request.url())
    })
    for (const work of works) {
      await page.goto(roomDocument + '?from=work#' + work.id)
      await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true')
      await expect(page.locator('body')).toHaveAttribute('data-mode', 'stills')
      await expect(page.getByRole('heading', { level: 1, name: work.title, exact: true })).toBeVisible()
      const stations = page.getByRole('navigation', { name: '展線站點' }).getByRole('button')
      const view = page.locator('.still img')
      for (const [index, mobileStill] of rooms[work.id].mobileStills.entries()) {
        await stations.nth(index).click()
        await expect.poll(() => view.evaluate((image: HTMLImageElement) => {
          return image.complete && image.naturalWidth > 0 ? decodeURIComponent(new URL(image.currentSrc).pathname) : null
        })).toContain(mobileStill.slice(1))
      }
      const href = await page.locator('#source-return').getAttribute('href')
      expect(new URL(href!, page.url()).searchParams.get('image')).toBe(work.workId)
      await page.goto('about:blank')
    }
    expect(modelRequests).toEqual([])
  })
}
