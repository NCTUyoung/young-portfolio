import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'

type Work = { filename: string, title: string, time: string, series?: string[] }
type Category = 'digital' | 'photography'

const collections: Record<Category, Work[]> = {
  digital: (JSON.parse(readFileSync(resolve(process.cwd(), 'public/galleryList.json'), 'utf8')) as { Img: Work[] }).Img,
  photography: (JSON.parse(readFileSync(resolve(process.cwd(), 'public/photographyList.json'), 'utf8')) as { Img: Work[] }).Img
}

function exhibit (page: Page, category: Category): Locator {
  return page.getByTestId(`home-exhibit-${category}`)
}

async function realWorkFor (link: Locator, category: Category): Promise<Work> {
  const href = await link.getAttribute('href')
  expect(href, `${category} exhibit has a shareable URL`).toBeTruthy()
  const url = new URL(href!, 'http://localhost:3000')
  expect(url.pathname).toBe(`/young-portfolio/gallery/${category}`)
  const imageId = url.searchParams.get('image')
  expect(imageId, `${category} exhibit points to a specific image`).toBeTruthy()
  const work = collections[category].find(item => `${category}-${item.filename.replace(/\.[^/.]+$/, '')}` === imageId)
  expect(work, `${category} exhibit uses an existing work`).toBeDefined()
  return work!
}

test.describe('首頁作品展覽', () => {
  test('keeps the two hero entrances and places selected works before about and journey', async ({ page }) => {
    await page.goto('/young-portfolio/')

    await expect(page.getByRole('region', { name: /繪と影.*對開扉頁/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /進入繪世界/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /開啟影世界攝影地圖/ })).toBeVisible()
    await expect(page.locator('#featured').getByRole('heading', { name: '作品選集' })).toBeVisible()
    await expect(exhibit(page, 'digital')).toBeVisible()
    await expect(exhibit(page, 'photography')).toBeVisible()
    await expect(page.locator('#about')).toBeVisible()
    await expect(page.locator('#journey')).toBeVisible()
    await expect(page.locator('#dialogue')).toHaveCount(1)

    const order = await page.locator('main').evaluate(main =>
      Array.from(main.querySelectorAll('#featured, #about, #journey')).map(section => section.id)
    )
    expect(order).toEqual(['featured', 'about', 'journey'])
  })

  test('both exhibit labels and share links match actual featured works', async ({ page }) => {
    await page.goto('/young-portfolio/')

    for (const category of ['digital', 'photography'] as const) {
      const link = exhibit(page, category)
      await expect(link).toBeVisible()
      const work = await realWorkFor(link, category)
      await expect(link).toContainText(work.title)
      await expect(link).toContainText(work.time.slice(0, 4))
      await expect(link).toContainText(category === 'digital' ? /電繪|數位繪畫/ : /攝影/)
      const preferred = collections[category].some(item => item.series?.includes('featured') && !item.series?.includes('hero'))
      if (preferred) {
        expect(work.series, `${category} exhibit should favor a featured work`).toContain('featured')
        expect(work.series).not.toContain('hero')
      }
    }
  })

  for (const category of ['digital', 'photography'] as const) {
    test(`${category} exhibit opens its matching work in the existing viewer`, async ({ page }) => {
      test.setTimeout(60_000)
      await page.goto('/young-portfolio/')
      const link = exhibit(page, category)
      await expect(link).toBeVisible()
      const work = await realWorkFor(link, category)

      await link.click()
      await expect.poll(() => new URL(page.url()).pathname).toBe(`/young-portfolio/gallery/${category}`)
      await expect(page.getByTestId('gallery-archive-controls')).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
      const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
      await expect(dialog).toBeVisible({ timeout: 20_000 })
      const image = dialog.locator('.image-viewer-area picture img')
      await expect(image).toHaveAttribute('alt', work.title)
      await expect(dialog.getByRole('heading', { name: work.title })).toBeVisible()
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0), { timeout: 15_000 }).toBe(true)
      await expect.poll(() => page.locator('body').evaluate(body => body.style.overflow)).toBe('hidden')

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect.poll(() => new URL(page.url()).searchParams.has('image')).toBe(false)
      await expect.poll(() => page.locator('body').evaluate(body => body.style.overflow)).toBe('')
    })
  }

  test('failed exhibit data shows a retry that restores both real works', async ({ page }) => {
    await page.goto('/young-portfolio/article')
    await expect(page.getByRole('navigation')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.getByRole('link', { name: 'NCTU Young — 首頁' })).toBeVisible()

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
    const alert = page.getByTestId('home-exhibition-error')
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toContainText('作品資料暫時無法載入，請重新載入。')
    expect(failed.galleryList).toBeGreaterThan(0)
    expect(failed.photographyList).toBeGreaterThan(0)
    await expect(exhibit(page, 'digital')).toHaveCount(0)
    await expect(exhibit(page, 'photography')).toHaveCount(0)

    failRequests = false
    await alert.getByRole('button', { name: '重新載入作品' }).click()
    await expect(alert).toBeHidden()
    for (const category of ['digital', 'photography'] as const) {
      const link = exhibit(page, category)
      await expect(link).toBeVisible()
      const work = await realWorkFor(link, category)
      await expect(link).toContainText(work.title)
    }
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

test.describe('首頁作品展覽 / mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('menu stays visitor focused and the exhibits keep their full images', async ({ page }) => {
    await page.goto('/young-portfolio/')
    await expect(page.getByRole('navigation')).toHaveAttribute('data-hydrated', 'true')
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

    for (const category of ['digital', 'photography'] as const) {
      const image = exhibit(page, category).locator('img')
      await expect(image).toBeVisible()
      await expect(image).toHaveCSS('object-fit', 'contain')
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
