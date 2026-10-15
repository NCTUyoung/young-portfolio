import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const EVENT = 'Annber 外拍'
const EVENT_PATH = `/gallery/photography/${encodeURIComponent(EVENT)}`
const photoData = JSON.parse(readFileSync(resolve(process.cwd(), 'public/photographyList.json'), 'utf8')) as {
  Img: Array<{ filename: string; title: string; event: { name: string } }>
}

async function openTable (page: Page, path = EVENT_PATH) {
  await page.goto(path)
  const table = page.getByTestId('photo-light-table')
  await expect(table).toBeVisible()
  await expect(page.getByRole('button', { name: /前往系列照片/ })).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
  return table
}

async function filterAndOpenEvent (page: Page, searchQuery: string) {
  await page.goto('/gallery/photography')
  const controls = page.getByTestId('gallery-archive-controls')
  await expect(controls).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
  const disclosure = controls.getByTestId('gallery-filter-disclosure')
  await disclosure.click()
  await controls.getByRole('searchbox', { name: /搜尋攝影作品/ }).fill(searchQuery)
  await expect(disclosure).toContainText(`「${searchQuery}」`)
  await controls.getByRole('button', { name: new RegExp(EVENT) }).click()
  await expect(page).toHaveURL(new RegExp(`${encodeURIComponent(EVENT)}$`))
}

test.describe('Photography selection table', () => {
  test('selection stays local until opening, then viewer navigation returns to the chosen print', async ({ page }) => {
    test.setTimeout(60_000)
    const table = await openTable(page)
    const strip = table.getByRole('group', { name: '選擇照片' })
    const choices = strip.getByRole('button')
    const total = await choices.count()
    expect(total).toBeGreaterThan(3)

    await choices.nth(1).click()
    await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true')
    const secondTitle = await choices.nth(1).locator('img').getAttribute('alt')
    await expect(table.getByTestId('light-table-selected').locator('img')).toHaveAttribute('alt', secondTitle!)
    await expect(page).not.toHaveURL(/[?&]image=/)

    const open = table.getByTestId('light-table-open')
    await open.click()
    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/[?&]image=/)
    const viewerImage = dialog.locator('.image-viewer-area picture img')
    await expect(viewerImage).toHaveAttribute('alt', secondTitle!)
    await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    const index = dialog.locator('p').filter({ hasText: /^\s*\d+\s*[／/]\s*\d+\s*$/ })
    await expect(index).toHaveText(new RegExp(`^\\s*2\\s*[／/]\\s*${total}\\s*$`))

    await page.keyboard.press('ArrowRight')
    await expect(index).toHaveText(new RegExp(`^\\s*3\\s*[／/]\\s*${total}\\s*$`))
    const thirdTitle = await choices.nth(2).locator('img').getAttribute('alt')
    await expect(viewerImage).toHaveAttribute('alt', thirdTitle!)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/[?&]image=/)
    await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true')
    await expect(table.getByTestId('light-table-selected').locator('img')).toHaveAttribute('alt', thirdTitle!)
    await expect(open).toBeFocused()
    await expect.poll(() => page.locator('body').evaluate(body => body.style.overflow)).toBe('')
  })

  test('a direct image link opens within its event and leaves that image selected after closing', async ({ page }) => {
    test.setTimeout(60_000)
    const eventImages = photoData.Img.filter(image => image.event.name === EVENT)
    const target = eventImages[1]!
    const imageId = `photography-${target.filename.replace(/\.[^/.]+$/, '')}`
    const table = await openTable(page, `${EVENT_PATH}?image=${encodeURIComponent(imageId)}`)
    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.image-viewer-area picture img')).toHaveAttribute('alt', target.title)
    const choices = table.getByRole('group', { name: '選擇照片' }).getByRole('button')
    const total = await choices.count()
    await expect(dialog.locator('p').filter({ hasText: /^\s*\d+\s*[／/]\s*\d+\s*$/ })).toContainText(new RegExp(`[／/]\\s*${total}\\s*$`))

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(table.getByTestId('light-table-selected').locator('img')).toHaveAttribute('alt', target.title)
    await expect(choices.filter({ has: page.locator(`img[alt="${target.title}"]`) })).toHaveAttribute('aria-pressed', 'true')
  })

  test('entering another activity starts with its first print', async ({ page }) => {
    const table = await openTable(page)
    const choices = table.getByRole('group', { name: '選擇照片' }).getByRole('button')
    await choices.nth(2).click()
    await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('event-cover-return-map').click()
    await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
    const other = page.locator('.em__card-link').filter({ hasNotText: EVENT }).first()
    await expect(other).toBeVisible()
    await other.click()
    const nextTable = page.getByTestId('photo-light-table')
    await expect(nextTable).toBeVisible()
    await expect(nextTable.getByRole('group', { name: '選擇照片' }).getByRole('button').first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page).not.toHaveURL(/[?&]image=/)
  })
})

test.describe('Photography selection table on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('keyboard selection works inside a scrollable strip without page overflow', async ({ page }) => {
    const table = await openTable(page)
    const strip = table.getByRole('group', { name: '選擇照片' })
    const choices = strip.getByRole('button')
    await choices.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(choices.nth(1)).toBeFocused()
    await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(page).not.toHaveURL(/[?&]image=/)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await expect.poll(() => strip.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
  })
})

test.describe('Photography selection table boundaries', () => {
  test('one matching print has a working stage and no duplicate neighbors', async ({ page }) => {
    await filterAndOpenEvent(page, '光復校園步道')
    const table = page.getByTestId('photo-light-table')
    const choices = table.getByRole('group', { name: '選擇照片' }).getByRole('button')
    await expect(choices).toHaveCount(1)
    await expect(choices.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(table.getByTestId('light-table-selected').locator('img')).toHaveAttribute('alt', '光復校園步道上的笑意')
    await expect(table.getByRole('button', { name: /選看：/ })).toHaveCount(0)
    await table.getByTestId('light-table-open').click()
    await expect(page.getByRole('dialog', { name: '圖片檢視器' })).toBeVisible()
  })

  test('two matching prints allow switching without repeating a neighbor', async ({ page }) => {
    await filterAndOpenEvent(page, '販賣機')
    const table = page.getByTestId('photo-light-table')
    const choices = table.getByRole('group', { name: '選擇照片' }).getByRole('button')
    await expect(choices).toHaveCount(2)
    await expect(table.getByRole('button', { name: /選看：/ })).toHaveCount(1)
    await choices.nth(1).click()
    await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(table.getByRole('button', { name: /選看：/ })).toHaveCount(1)
    await expect(page).not.toHaveURL(/[?&]image=/)
    await table.getByTestId('light-table-open').click()
    const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('p').filter({ hasText: /^\s*\d+\s*[／/]\s*\d+\s*$/ })).toHaveText(/^\s*2\s*[／/]\s*2\s*$/)
  })

  test('zero matching prints show recovery and restore the activity after reset', async ({ page }) => {
    await filterAndOpenEvent(page, 'no-photo-matches-this-query-8372')
    await expect(page.getByText('沒有符合條件的作品')).toBeVisible()
    await expect(page.getByTestId('photo-light-table')).toHaveCount(0)
    await page.getByRole('button', { name: 'Reset filters' }).click()
    const table = page.getByTestId('photo-light-table')
    await expect(table).toBeVisible()
    await expect(table.getByRole('group', { name: '選擇照片' }).getByRole('button')).toHaveCount(9)
  })
})

test('dark mode keeps the page opaque and the selected print usable after viewer closes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('vueuse-color-scheme', 'dark'))
  const table = await openTable(page)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect.poll(() => page.locator('html').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  await expect(table.getByTestId('light-table-open')).toHaveCSS('background-color', 'rgb(48, 46, 40)')
  const choices = table.getByRole('group', { name: '選擇照片' }).getByRole('button')
  await choices.nth(1).click()
  await table.getByTestId('light-table-open').click()
  const dialog = page.getByRole('dialog', { name: '圖片檢視器' })
  await expect(dialog).toBeVisible()
  const viewerImage = dialog.locator('.image-viewer-area picture img')
  await expect.poll(() => viewerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  await expect(dialog.getByText('LOADING', { exact: true })).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await choices.nth(2).click()
  await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true')
})
