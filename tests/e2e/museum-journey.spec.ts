import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

const galleryIndex = 'gallery'
const photographyHall = 'gallery/photography'
const photoData = JSON.parse(readFileSync(resolve(process.cwd(), 'public/photographyList.json'), 'utf8')) as {
  Img: Array<{ filename: string; title: string; event: { name: string } }>
  seriesNarratives: Record<string, { prologue?: string; annotation?: string; strongest_line?: string }>
}
const digitalData = JSON.parse(readFileSync(resolve(process.cwd(), 'public/galleryList.json'), 'utf8')) as {
  Img: Array<{ filename: string; title: string }>
}

test('the collection opens both halls and keeps cross-hall navigation', async ({ page }) => {
  await page.goto(galleryIndex)
  await waitForSiteHydration(page)
  await expect(page).toHaveURL(/\/young-portfolio\/gallery\/?$/)
  await expect(page.getByRole('heading', { name: '館藏', exact: true, level: 1 })).toBeVisible()
  const rooms = page.getByRole('navigation', { name: '館藏目錄' })
  const digital = rooms.getByRole('link', { name: '繪畫館', exact: true })
  await expect(digital).toHaveAttribute('href', '/young-portfolio/gallery/digital')
  await expect(rooms.getByRole('link', { name: '攝影館', exact: true }))
    .toHaveAttribute('href', '/young-portfolio/gallery/photography#gallery-activities')
  await digital.click()
  await expect(page).toHaveURL(/\/gallery\/digital\/?$/)
  await expect(page.getByTestId('gallery-archive-controls')).toBeVisible()
  await expect(page.getByTestId('gallery-work-exhibition').getByText(/繪作/)).toBeVisible()

  await page.getByRole('navigation', { name: '切換展館' }).getByRole('link', { name: '攝影館', exact: true }).click()
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
  await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
  await page.getByRole('navigation', { name: '切換展館' }).getByRole('link', { name: '繪畫館', exact: true }).click()
  await expect(page).toHaveURL(/\/gallery\/digital\/?$/)
})

test('the painting year room returns to the year index anchor', async ({ page }) => {
  await page.goto(galleryIndex)
  await waitForSiteHydration(page)
  await page.getByRole('navigation', { name: '館藏目錄' }).getByRole('link', { name: '繪畫館', exact: true }).click()
  await expect(page).toHaveURL(/\/gallery\/digital\/?$/)
  const years = page.getByRole('navigation', { name: '按年代看繪畫' })
  const year = years.getByRole('link', { name: '2026', exact: true })
  await year.click()
  await expect.poll(() => decodeURIComponent(new URL(page.url()).pathname).replace(/\/$/, ''))
    .toBe('/young-portfolio/gallery/digital/2026年電繪作品')
  await expect(page.getByRole('heading', { name: '2026年電繪作品', exact: true, level: 1 })).toBeVisible()
  const backToYears = page.getByTestId('gallery-year-return')
  await expect(backToYears).toHaveAttribute('href', /\/gallery\/digital\/?#gallery-year-index$/)
  await backToYears.click()
  await expect(page).toHaveURL(/\/gallery\/digital\/?#gallery-year-index$/)
  await expect(year).toBeVisible()
})

test('the collection opens photography activities despite a persisted painting category', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gallery-filters', JSON.stringify({
    selectedCategory: 'digital', selectedEvent: null, searchQuery: '', yearFilter: null
  })))
  await page.goto(galleryIndex)
  await waitForSiteHydration(page)
  await expect(page).toHaveURL(/\/gallery\/?$/)
  const rooms = page.getByRole('navigation', { name: '館藏目錄' })
  await expect(rooms.getByRole('link', { name: '繪畫館', exact: true })).toBeVisible()
  await rooms.getByRole('link', { name: '攝影館', exact: true }).click()
  await expect(page).toHaveURL(/\/gallery\/photography\/?#gallery-activities$/)
  await expect(page.getByRole('heading', { name: '拍攝活動', exact: true })).toBeFocused()
  await expect(page.getByTestId('gallery-activity-index').getByRole('heading', { level: 3 }).first()).toBeInViewport()
  await page.getByRole('navigation', { name: '拍攝活動瀏覽方式' }).getByRole('link', { name: '依地點', exact: true }).click()
  await expect(page).toHaveURL(/\/gallery\/photography\/?#gallery-footsteps$/)
  await expect(page.getByRole('heading', { name: '踏跡', exact: true })).toBeFocused()
  await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeInViewport()
})

test('photography map keeps all activity circles and its selected series card opens that event', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(photographyHall)
  const map = page.locator('.event-map-wrapper:not(.event-map-wrapper--compact):not(.event-map-inset)')
  await expect(map).toBeVisible()
  await expect(map.locator('.event-map-photo-card')).toHaveCount(14)
  const entry = map.getByTestId('map-series-entry')
  await expect(entry).toBeVisible()

  const choice = map.locator('.event-map-photo-card[data-event-name="WBC 2026"]')
  const eventName = await choice.getAttribute('data-event-name')
  expect(eventName).toBeTruthy()
  await choice.click()
  await expect(choice).toHaveAttribute('aria-pressed', 'true')
  await expect(entry).toContainText(eventName!)
  const series = photoData.seriesNarratives[eventName!]
  if (series) {
    const authenticLines = [series.strongest_line, series.prologue, series.annotation].filter(Boolean) as string[]
    await expect.poll(async () => {
      const cardText = await entry.innerText()
      return authenticLines.some(line => cardText.includes(line))
    }).toBe(true)
  }
  const image = entry.locator('img')
  await expect(image).toHaveAttribute('data-full-image', /\S+/)
  await expect(image).toHaveCSS('object-fit', 'contain')
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)

  await entry.click()
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
})

test('article index gives each published chapter one entrance with durable wording', async ({ page }) => {
  await page.goto('./')
  await waitForSiteHydration(page)
  await page.getByRole('navigation', { name: '網站導覽' }).getByRole('link', { name: '手記', exact: true }).click()
  await expect(page).toHaveURL(/\/young-portfolio\/article\/?$/)
  await expect(page.locator('main a[href$="/article/design-thinking"]')).toHaveCount(1)
  await expect(page.locator('main a[href$="/article/gear-119mm"]')).toHaveCount(1)
  await expect(page.locator('main')).not.toContainText(/New This Week|本週新刊/)

  await page.locator('main a[href$="/article/design-thinking"]').click()
  await expect(page).toHaveURL(/\/article\/design-thinking\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('link', { name: '返回目次', exact: true }).click()
  await expect(page).toHaveURL(/\/article\/?$/)
  await page.locator('main a[href$="/article/gear-119mm"]').click()
  await expect(page).toHaveURL(/\/article\/gear-119mm\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('器材評測')
  await page.getByRole('link', { name: /WBC 2026.*活動照片/ }).click()
  await expect(page.locator('#event-cover-heading')).toHaveText('WBC 2026')
})

test('an unnamed photograph keeps its exhibition label across viewer and filtered event entry', async ({ page }) => {
  test.setTimeout(60_000)
  const eventName = '峨嵋湖風鈴木'
  await page.goto(`gallery/photography/${encodeURIComponent(eventName)}`)
  await expect(page.getByRole('button', { name: /前往系列照片/ })).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
  const table = page.getByTestId('photo-light-table')
  const rawPhoto = table.getByRole('group', { name: '選擇照片' }).getByRole('button').filter({
    has: page.locator('img[src*="DSC_1721"]')
  })
  await expect(rawPhoto).toHaveCount(1)
  await rawPhoto.click()
  const label = await table.getByTestId('light-table-selected').locator('img').getAttribute('alt')
  expect(label).toMatch(/^峨嵋湖風鈴木 · \d{2}$/)
  await expect(table.locator('.light-table__caption span').first()).toHaveText(label!)
  await table.getByTestId('light-table-open').click()
  const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
  await expect(dialog.locator('.image-viewer-area picture img')).toHaveAttribute('alt', label!)
  await expect(page).toHaveURL(/[?&]image=/)
  const firstImageId = new URL(page.url()).searchParams.get('image')
  expect(firstImageId).toContain('DSC_1721-編輯-1')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.getByTestId('event-cover-return-map').click()
  const controls = page.getByTestId('gallery-archive-controls')
  await expect(controls).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
  await controls.getByTestId('gallery-filter-disclosure').click()
  const search = controls.getByRole('searchbox', { name: /搜尋攝影作品/ })
  await search.fill('DSC_1721')
  await expect(controls.getByTestId('gallery-filter-disclosure')).toContainText('「DSC_1721」')
  await controls.getByRole('button', { name: new RegExp(eventName) }).click()
  await expect(page.getByText('目前顯示篩選後的照片 · DSC_1721', { exact: true })).toBeVisible()
  const filteredTable = page.getByTestId('photo-light-table')
  await expect(filteredTable.getByRole('group', { name: '選擇照片' }).getByRole('button')).toHaveCount(1)
  await expect(filteredTable.getByTestId('light-table-selected').locator('img')).toHaveAttribute('alt', label!)
  await expect(filteredTable.locator('.light-table__caption span').first()).toHaveText(label!)
  await expect(page.locator('.contact-sheet__btn:visible')).toHaveAttribute('aria-label', label!)
  await expect(page.locator('.contact-sheet__img:visible')).toHaveAttribute('alt', label!)
  await filteredTable.getByTestId('light-table-open').click()
  await expect(dialog.locator('.image-viewer-area picture img')).toHaveAttribute('alt', label!)
  await expect.poll(() => new URL(page.url()).searchParams.get('image')).toBe(firstImageId)
})

test('header Collection shows both halls and Back restores the visited room', async ({ page }) => {
  for (const path of ['gallery/digital', 'gallery/photography/Annber%20%E5%A4%96%E6%8B%8D']) {
    await page.goto(path)
    const previousRoomUrl = page.url()
    const room = path === 'gallery/digital'
      ? page.getByTestId('gallery-archive-controls')
      : page.locator('#event-cover-heading')
    await expect(room).toBeVisible()
    const header = page.getByRole('navigation', { name: '網站導覽' })
    await waitForSiteHydration(page)
    const galleryLink = header.getByRole('link', { name: '館藏', exact: true })
    await expect(galleryLink).toHaveAttribute('href', /\/gallery\/?$/)
    await galleryLink.click()
    await expect(page).toHaveURL(/\/gallery\/?$/)
    const rooms = page.getByRole('navigation', { name: '館藏目錄' })
    await expect(rooms.getByRole('link', { name: '繪畫館', exact: true })).toBeVisible()
    await expect(rooms.getByRole('link', { name: '攝影館', exact: true })).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(previousRoomUrl)
    await expect(room).toBeVisible()
  }
})

test('legacy gallery image links open the matching hall while an unknown image leaves photography usable', async ({ page }) => {
  test.setTimeout(60_000)
  const hydrationWarnings: string[] = []
  page.on('console', message => {
    if (/hydration.*mismatch/i.test(message.text())) hydrationWarnings.push(message.text())
  })
  const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
  for (const example of [
    { path: 'gallery/', category: 'digital', work: digitalData.Img[0]! },
    { path: 'gallery/all/', category: 'photography', work: photoData.Img.find(work => work.event.name === 'Annber 外拍')! }
  ]) {
    const imageId = `${example.category}-${example.work.filename.replace(/\.[^/.]+$/, '')}`
    await page.goto(`${example.path}?image=${encodeURIComponent(imageId)}&keep=x#fragment`)
    await expect(page).toHaveURL(new RegExp(`/young-portfolio/gallery/${example.category}/?\\?`))
    await expect(dialog.locator('.image-viewer-area picture img')).toHaveAttribute('alt', example.work.title)
    const resolved = new URL(page.url())
    expect(resolved.searchParams.get('image')).toBe(imageId)
    expect(resolved.searchParams.get('keep')).toBe('x')
    expect(resolved.hash).toBe('#fragment')
  }

  await page.goto('gallery?image=missing-image-8372&keep=x#fragment')
  await expect(page).toHaveURL(/\/gallery\/photography\?/)
  await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
  await expect(dialog).toHaveCount(0)
  expect(hydrationWarnings).toEqual([])
})

test('viewer radial choices stay on screen and switch photos at desktop and mobile widths', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const eventPath = `gallery/photography/${encodeURIComponent('WBC 2026')}`

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto(eventPath)
    await expect(page.getByRole('button', { name: /前往系列照片/ })).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
    const table = page.getByTestId('photo-light-table')
    await expect(table.getByRole('group', { name: '選擇照片' }).getByRole('button')).toHaveCount(12)
    await table.getByTestId('light-table-open').click()

    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    const image = dialog.locator('.image-viewer-area picture img')
    const radial = dialog.locator('.radial-cluster')
    const thumbs = radial.locator('.radial-thumb')
    await expect(radial.locator('.radial-center')).toBeVisible()
    expect(await thumbs.count()).toBeGreaterThan(1)
    await expect.poll(() => radial.locator('.radial-thumb, .radial-center').evaluateAll((buttons, isMobile) =>
      buttons.flatMap(button => {
        const rect = button.getBoundingClientRect()
        const withinViewport = rect.left >= 0 && rect.top >= 0
          && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight
        const largeEnough = button.classList.contains('radial-center') || isMobile
          ? rect.width >= 44 && rect.height >= 44
          : true
        return withinViewport && largeEnough ? [] : [{ label: button.getAttribute('aria-label'),
          left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
          width: rect.width, height: rect.height }]
      }), viewport.width < 768)).toEqual([])

    await expect(page).toHaveURL(/[?&]image=/)
    const initialId = new URL(page.url()).searchParams.get('image')
    const initialAlt = await image.getAttribute('alt')
    const labels = await thumbs.locator('img').evaluateAll(images => images.map(item => item.getAttribute('alt')))
    const nextIndex = labels.findIndex(label => label !== initialAlt)
    expect(nextIndex).toBeGreaterThanOrEqual(0)
    await thumbs.nth(nextIndex).click()
    await expect(image).toHaveAttribute('alt', labels[nextIndex]!)
    await expect.poll(() => new URL(page.url()).searchParams.get('image')).not.toBe(initialId)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  }
})

test.describe('museum journey on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the three visible mobile navigation links open the exhibition, collection and journal at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('./')
    await waitForSiteHydration(page)
    const nav = page.getByRole('navigation', { name: '網站導覽' })
    await nav.getByRole('link', { name: '當期展', exact: true }).tap()
    await expect(page).toHaveURL(/\/exhibition\/light\/?#painting$/)
    await expect(page.getByRole('heading', { level: 2, name: '唯一真神', exact: true })).toBeVisible()
    await nav.getByRole('link', { name: '館藏', exact: true }).tap()
    await expect(page).toHaveURL(/\/gallery\/?$/)
    await page.getByRole('navigation', { name: '館藏目錄' }).getByRole('link', { name: '攝影館', exact: true }).tap()
    await expect(page).toHaveURL(/\/gallery\/photography\/?#gallery-activities$/)
    await expect(page.getByTestId('gallery-activity-index').getByRole('heading', { level: 3 }).first()).toBeInViewport()
    await page.getByRole('navigation', { name: '拍攝活動瀏覽方式' }).getByRole('link', { name: '依地點', exact: true }).tap()
    await expect(page).toHaveURL(/\/gallery\/photography\/?#gallery-footsteps$/)
    await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeInViewport()
    await nav.getByRole('link', { name: '手記', exact: true }).tap()
    await expect(page).toHaveURL(/\/young-portfolio\/article\/?$/)
    await expect(page.getByRole('heading', { level: 1, name: '手記', exact: true })).toBeVisible()
  })

  test('article breadcrumb has a readable touch target without horizontal overflow', async ({ page }) => {
    await page.goto('article/gear-119mm')
    const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: '目次' })
    await expect(breadcrumb).toBeVisible()
    const bounds = await breadcrumb.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await waitForSiteHydration(page)
    await breadcrumb.click()
    await expect(page).toHaveURL(/\/article\/?$/)
  })
})
