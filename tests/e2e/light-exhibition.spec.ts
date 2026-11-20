import { expect, test } from '@playwright/test'
import { expectPaintedWorldDialog } from './painted-world-dialog'
import { waitForSiteHydration } from './site-ready'

test('the legacy exhibition keeps all three stops and opens the orchard on the same page', async ({ page }) => {
  test.setTimeout(75_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('exhibition/light/#painting')
  await waitForSiteHydration(page)
  await expect(page).toHaveURL(/\/young-portfolio\/exhibition\/light\/?#painting$/)
  await expect(page.getByRole('heading', { name: '光落之處', level: 1 })).toBeVisible()

  const stops = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link')
  await expect(stops).toHaveCount(3)
  const painting = page.getByRole('heading', { name: '唯一真神', exact: true, level: 2 })
  await expect(painting).toBeVisible()
  await expect(stops.nth(0)).toHaveAttribute('aria-current', 'step')
  const windowLink = page.getByRole('link', { name: /觀景窗/ })
  await windowLink.focus()
  await page.keyboard.press('Enter')
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  await page.reload()
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  // Pages adds the directory slash on a direct reload. Back should return here.
  const secondUrl = page.url()
  await stops.nth(2).click()
  await expect(stops.nth(2)).toHaveAttribute('aria-current', 'step')
  await page.goBack()
  await expect(page).toHaveURL(secondUrl)
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')

  await stops.nth(0).click()
  await expect(painting).toBeVisible()
  const orchard = page.getByRole('region', { name: '唯一真神', exact: true }).getByRole('link', { name: /畫界/ })
  const orchardUrl = /\/young-portfolio\/painted-worlds\/index\.html\?from=light#orchard$/
  await expect(orchard).toHaveAttribute('href', orchardUrl)
  await orchard.scrollIntoViewIfNeeded()
  const paintingUrl = page.url()
  const originScroll = await page.evaluate(() => scrollY)
  await orchard.click()
  const { dialog, close, frame } = await expectPaintedWorldDialog(page, '柑橘樹下')
  await expect(frame.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
  await expect.poll(() => frame.locator('body').evaluate(() => location.hash)).toBe('#orchard')
  await expect(page).toHaveURL(paintingUrl)
  await close.click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(paintingUrl)
  await expect(orchard).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(originScroll)
  await expect(painting).toBeVisible()
  await expect(stops.nth(0)).toHaveAttribute('aria-current', 'step')
})

test('catalogue failures leave exhibition navigation usable and retry restores the artwork', async ({ page }) => {
  await page.goto('article')
  await waitForSiteHydration(page)
  let failRequests = true
  const failed = new Set<string>()
  await page.route(/\/(galleryList|photographyList)\.json(?:\?|$)/, async route => {
    if (!failRequests) return route.continue()
    failed.add(new URL(route.request().url()).pathname.split('/').at(-1)!)
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })
  // Enter through the client router so failure injection reaches the loaders.
  // A direct request to Pages hydrates its catalogue from prerendered data.
  await page.evaluate(() => {
    const root = document.getElementById('__nuxt')
    if (!root || !('__vue_app__' in root)) throw new Error('Nuxt app is unavailable after hydration')
    const app = root.__vue_app__ as { config: { globalProperties: { $router: { push: (path: string) => Promise<unknown> } } } }
    return app.config.globalProperties.$router.push('/exhibition/light#painting')
  })
  const status = page.getByRole('status').filter({ hasText: '館藏資料暫時無法讀取。' })
  await expect(status).toBeVisible({ timeout: 20_000 })
  expect(failed).toEqual(new Set(['galleryList.json', 'photographyList.json']))
  await expect(page.getByRole('link', { name: '回序廳', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /觀景窗.*花下/ })).toBeVisible()

  failRequests = false
  await page.getByRole('button', { name: '重試', exact: true }).click()
  await expect(status).toBeHidden()
  await expect(page.getByRole('heading', { name: '唯一真神', exact: true, level: 2 })).toBeVisible()
  await expect(page.getByRole('link', { name: /觀景窗.*DSC_1377-編輯-1/ })).toBeVisible()
})

for (const station of [
  { hash: '#flowers', stop: '花下', title: 'DSC_1377-編輯-1', adjacentStop: '長椅' },
  { hash: '#bench', stop: '長椅', title: '長椅與參道', adjacentStop: '花下' }
]) {
  test(`fresh ${station.hash} bookmark renders its artwork and active stop`, async ({ page }) => {
    await page.goto(`exhibition/light/${station.hash}`, { waitUntil: 'domcontentloaded' })
    await waitForSiteHydration(page)
    expect(new URL(page.url()).hash).toBe(station.hash)
    const artwork = page.getByRole('heading', { level: 2, name: station.title, exact: true })
    await expect(artwork).toBeVisible()
    const route = page.getByRole('navigation', { name: '展線', exact: true })
    await expect(route.locator('[aria-current="step"]')).toHaveCount(1)
    const activeStop = route.getByRole('link', { name: station.stop, exact: true })
    await expect(activeStop).toHaveAttribute('aria-current', 'step')
    const bookmarkUrl = page.url()
    if (station.hash === '#bench') {
      const exit = page.getByRole('link', { name: /展覽出口.*前往館藏/ })
      await expect(exit).toBeVisible()
      await expect(exit).toHaveAttribute('href', /\/young-portfolio\/gallery\/?$/)
      await page.getByRole('link', { name: /續看攝影系列.*WBC東京 台澳/ }).click()
      await expect(page.locator('#event-cover-heading')).toHaveText('WBC東京 台澳')
      await page.goBack()
      await expect(page).toHaveURL(bookmarkUrl)
      await expect(activeStop).toHaveAttribute('aria-current', 'step')
    }
    const adjacentStop = route.getByRole('link', { name: station.adjacentStop, exact: true })
    await adjacentStop.click()
    await expect(adjacentStop).toHaveAttribute('aria-current', 'step')
    await page.goBack()
    await expect(page).toHaveURL(bookmarkUrl)
    await expect(activeStop).toHaveAttribute('aria-current', 'step')
    await expect(artwork).toBeVisible()
    await page.getByRole('link', { name: '回序廳', exact: true }).click()
    await expect(page).toHaveURL(/\/young-portfolio\/$/)
    await expect(page.getByRole('region', { name: '作品集' }).getByRole('link', { name: '逛 3D 迴廊' })).toBeVisible()
  })
}

test('a station selected before hydration stays selected once the app is ready', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve })
  await page.route('**/_nuxt/**', async requestRoute => {
    if (requestRoute.request().resourceType() === 'script') await scriptsReady
    await requestRoute.continue()
  })

  const flower = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link', { name: '花下' })
  try {
    await page.goto('exhibition/light/', { waitUntil: 'commit' })
    await flower.click()
    await expect(page).toHaveURL(/#flowers$/)
  } finally {
    releaseScripts()
  }
  await waitForSiteHydration(page)
  await expect(flower).toHaveAttribute('aria-current', 'step')
  await expect(page.getByRole('heading', { name: 'DSC_1377-編輯-1', level: 2 })).toBeVisible()
})
