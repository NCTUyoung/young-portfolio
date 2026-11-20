import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

type Work = { title: string, series?: string[] }
const digitalWorks = (JSON.parse(readFileSync(resolve(process.cwd(), 'public/galleryList.json'), 'utf8')) as { Img: Work[] }).Img
const photoWorks = (JSON.parse(readFileSync(resolve(process.cwd(), 'public/photographyList.json'), 'utf8')) as { Img: Work[] }).Img

test.describe('首頁展廳入口', () => {
  test('keeps two hero entrances and goes straight to about without repeating selected works', async ({ page }) => {
    await page.goto('/young-portfolio/')
    const entrance = page.getByRole('region', { name: '日光迴廊' })
    await expect(entrance.getByRole('link', { name: /繪畫館/ })).toBeVisible()
    await expect(entrance.getByRole('link', { name: /攝影館/ })).toBeVisible()
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

  test('failed hero data shows a retry that restores the real hero titles', async ({ page }) => {
    await page.goto('/young-portfolio/article')
    await waitForSiteHydration(page)
    let failRequests = true
    const failed = { galleryList: 0, photographyList: 0 }
    await page.route(/\/(galleryList|photographyList)\.json(?:\?|$)/, async route => {
      if (failRequests) {
        const name = route.request().url().includes('photographyList.json') ? 'photographyList' : 'galleryList'
        failed[name]++
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
      } else {
        await route.continue()
      }
    })
    await page.getByRole('link', { name: 'NCTU Young — 首頁' }).click()
    const alert = page.getByTestId('home-gallery-error')
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toContainText('作品資料暫時無法載入，請重新載入。')
    expect(failed.galleryList).toBeGreaterThan(0)
    expect(failed.photographyList).toBeGreaterThan(0)
    await expect(page.getByRole('link', { name: /繪畫館/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /攝影館/ })).toBeVisible()
    failRequests = false
    await alert.getByRole('button', { name: '重新載入作品' }).click()
    await expect(alert).toBeHidden()
    const artwork = digitalWorks.find(work => work.series?.includes('hero'))!
    const photograph = photoWorks.find(work => work.series?.includes('hero'))!
    await expect(page.locator('.hero-page--kai img')).toHaveAttribute('alt', `電繪作品代表 — ${artwork.title}`)
    await expect(page.locator('.hero-page__print--main img')).toHaveAttribute('alt', photograph.title)
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

test.describe('首頁展廳入口 / mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('menu stays visitor focused and the shorter homepage does not overflow', async ({ page }) => {
    await page.goto('/young-portfolio/')
    await waitForSiteHydration(page)
    const menu = page.getByRole('button', { name: '開啟選單' })
    await expect(menu).toBeVisible()
    const box = await menu.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await menu.click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByRole('menu').locator('a[href*="/admin"]')).toHaveCount(0)
    await expect(page.locator('footer a[href$="/admin"]')).toHaveCount(1)
    await expect(page.locator('#featured')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

for (const viewport of [
  { width: 320, height: 640 }, { width: 360, height: 640 },
  { width: 390, height: 844 }, { width: 1440, height: 900 }
]) {
  test.describe(`Museum doors at ${viewport.width}px`, () => {
    const mobile = viewport.width < 768
    test.use({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' })

    test('both doors start within the viewport and lead directly to their halls', async ({ page }) => {
      await page.goto('./')
      await waitForSiteHydration(page)
      const entrance = page.getByRole('region', { name: '日光迴廊' })
      const digital = entrance.getByRole('link', { name: /繪畫館/ })
      const photography = entrance.getByRole('link', { name: /攝影館/ })

      for (const door of [digital, photography]) {
        await expect(door).toBeInViewport({ ratio: 1 })
        const bounds = (await door.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

      await digital.click()
      await expect(page).toHaveURL(/\/young-portfolio\/gallery\/digital\/?$/)
      await expect(page.getByTestId('gallery-archive-controls')).toBeVisible()
      await page.goBack()
      await expect(page).toHaveURL(/\/young-portfolio\/$/)
      await waitForSiteHydration(page)
      await photography.click()
      await expect(page).toHaveURL(/\/young-portfolio\/gallery\/photography\/?$/)
      await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible({ timeout: 20_000 })
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
      const toggle = async (name: string) => {
        if (mobile) {
          await page.getByRole('button', { name: '開啟選單' }).click()
          await page.getByRole('menuitem', { name }).click()
        } else {
          await page.getByRole('button', { name }).click()
        }
      }
      await expect(html).not.toHaveClass(/\bdark\b/)
      await toggle('切換到深色模式')
      await expect(html).toHaveClass(/\bdark\b/)
      await page.reload()
      await waitForSiteHydration(page)
      await expect(html).toHaveClass(/\bdark\b/)
      await toggle('切換到淺色模式')
      await expect(html).not.toHaveClass(/\bdark\b/)
    })
  })
}
