import { expect, test } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

test.describe('首頁序廳', () => {
  test('the foyer offers the current exhibition and collection before the author sections', async ({ page }) => {
    await page.goto('/young-portfolio/')
    const entrance = page.getByRole('region', { name: '光落之處' })
    await expect(entrance.getByRole('link', { name: '開始看展', exact: true }))
      .toHaveAttribute('href', /\/young-portfolio\/exhibition\/light\/?#painting$/)
    await expect(entrance.getByRole('link', { name: '瀏覽館藏', exact: true }))
      .toHaveAttribute('href', /\/young-portfolio\/gallery\/?$/)
    await expect(page.getByRole('heading', { name: '作品選集', exact: true })).toHaveCount(0)
    await expect(page.locator('#featured')).toHaveCount(0)
    await expect(page.locator('#about')).toBeVisible()
    await expect(page.locator('#journey')).toBeVisible()
    await expect(page.locator('#dialogue')).toHaveCount(1)
    const order = await page.locator('main').evaluate(main =>
      Array.from(main.querySelectorAll('section')).map(section => section.id || 'hero')
    )
    expect(order).toEqual(['hero', 'about', 'journey', 'epilogue'])
  })

  test('full journey starts closed and opens with the keyboard to show all five milestones', async ({ page }) => {
    await page.goto('/young-portfolio/')
    const details = page.getByTestId('home-journey-details')
    const summary = details.locator('summary')
    await expect(summary).toContainText('完整創作沿革')
    await expect(details).toBeVisible()
    await expect(details).not.toHaveAttribute('open', '')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(details).toHaveAttribute('open', '')
    for (const title of ['開始數位繪畫', '深入角色創作', '電繪技法精進', '踏入攝影領域', '建立作品集']) {
      await expect(details.getByRole('heading', { name: new RegExp(title) })).toBeVisible()
    }
    await expect(details.getByRole('listitem')).toHaveCount(5)
  })
})

test.describe('首頁導覽 / 320px', () => {
  test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true })
  test('all three navigation links and the theme button fit on the same tappable row', async ({ page }) => {
    await page.goto('/young-portfolio/')
    await waitForSiteHydration(page)
    const nav = page.getByRole('navigation', { name: '網站導覽' })
    const exhibition = nav.getByRole('link', { name: '當期展', exact: true })
    const collection = nav.getByRole('link', { name: '館藏', exact: true })
    const journal = nav.getByRole('link', { name: '手記', exact: true })
    const theme = nav.getByRole('button', { name: '切換到深色模式', exact: true })
    const centers = []
    for (const control of [exhibition, collection, journal, theme]) {
      await expect(control).toBeInViewport({ ratio: 1 })
      const box = (await control.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      centers.push(box.y + box.height / 2)
    }
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(2)
    await expect(exhibition).toHaveAttribute('href', /\/exhibition\/light\/?#painting$/)
    await expect(collection).toHaveAttribute('href', /\/gallery\/?$/)
    await expect(journal).toHaveAttribute('href', /\/article\/?$/)
    await expect(nav.getByRole('button', { name: '開啟選單' })).toHaveCount(0)
    await expect(nav.locator('a[href*="/admin"]')).toHaveCount(0)
    await expect(page.locator('footer a[href$="/admin"]')).toHaveCount(1)
    await expect(page.locator('#featured')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

for (const viewport of [
  { width: 320, height: 640 }, { width: 360, height: 640 },
  { width: 390, height: 844 }, { width: 1440, height: 900 }
]) {
  test.describe(`Foyer entrances at ${viewport.width}px`, () => {
    const mobile = viewport.width < 768
    test.use({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' })

    test('the exhibition and collection links fit on the first screen and reach their destinations', async ({ page }) => {
      await page.goto('./')
      await waitForSiteHydration(page)
      const entrance = page.getByRole('region', { name: '光落之處' })
      const start = entrance.getByRole('link', { name: '開始看展', exact: true })
      const collection = entrance.getByRole('link', { name: '瀏覽館藏', exact: true })

      for (const link of [start, collection]) {
        await expect(link).toBeInViewport({ ratio: 1 })
        const bounds = (await link.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

      await start.focus()
      await expect(start).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/young-portfolio\/exhibition\/light\/?#painting$/)
      await expect(page.getByRole('heading', { level: 2, name: '唯一真神', exact: true })).toBeVisible()
      await page.goBack()
      await expect(page).toHaveURL(/\/young-portfolio\/$/)
      await waitForSiteHydration(page)
      await collection.click()
      await expect(page).toHaveURL(/\/young-portfolio\/gallery\/?$/)
      const rooms = page.getByRole('navigation', { name: '館藏目錄' })
      for (const name of ['繪畫館', '攝影館']) {
        const room = rooms.getByRole('link', { name, exact: true })
        await expect(room).toBeVisible()
        const bounds = (await room.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  })
}

test('the home uses a decoded still and does not start WebGL or request 3D models', async ({ page }) => {
  const modelRequests: string[] = []
  page.on('request', request => {
    if (/\.glb(?:[?#]|$)|(?:\/three\/|\/three(?:\.module|\.min)?\.js)/i.test(request.url())) {
      modelRequests.push(request.url())
    }
  })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    const attempts: string[] = []
    Object.defineProperty(window, 'museumWebGLAttempts', { value: attempts })
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/^(?:experimental-)?webgl2?$/.test(type)) attempts.push(type)
      return original.call(this, type, ...args)
    } as typeof original
  })

  await page.goto('./')
  await waitForSiteHydration(page)
  const hall = page.getByRole('img', { name: /唯一真神.*雕像/ })
  await expect(hall).toBeVisible()
  await expect.poll(() => hall.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(modelRequests).toEqual([])
  expect(await page.evaluate(() => Reflect.get(window, 'museumWebGLAttempts'))).toEqual([])
})

for (const mobile of [false, true]) {
  test.describe(`Theme on ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile })

    test('the theme control toggles and reload preserves the choice', async ({ page }) => {
      await page.goto('./')
      await waitForSiteHydration(page)
      const html = page.locator('html')
      const nav = page.getByRole('navigation', { name: '網站導覽' })
      await expect(html).not.toHaveClass(/\bdark\b/)
      await nav.getByRole('button', { name: '切換到深色模式', exact: true }).click()
      await expect(html).toHaveClass(/\bdark\b/)
      await page.reload()
      await waitForSiteHydration(page)
      await expect(html).toHaveClass(/\bdark\b/)
      await nav.getByRole('button', { name: '切換到淺色模式', exact: true }).click()
      await expect(html).not.toHaveClass(/\bdark\b/)
    })
  })
}
