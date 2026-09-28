import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  test('攝影入口先呈現互動地圖與代表照片組圖', async ({ page }) => {
    await page.goto('/gallery/photography')

    await expect(page.locator('.photo-map-entry')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
    await expect(page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /踏跡/ })).toBeVisible()
  })

  test('點地圖代表照片進入組圖，系列照片預設展開', async ({ page }) => {
    await page.goto('/gallery/photography')

    const mapPhoto = page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()
    await expect(mapPhoto).toBeVisible({ timeout: 15_000 })
    const eventName = (await mapPhoto.locator('.event-map-photo-title').textContent())?.trim()
    expect(eventName).toBeTruthy()

    await mapPhoto.click()
    await expect(page).toHaveURL(/\/gallery\/photography\/[^/?]+$/)
    await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
    await expect(page.getByTestId('event-cover-return-map')).toBeVisible()
    await page.waitForLoadState('networkidle')

    // 組圖扉頁預設展開系列格；扉頁按鈕只負責快速捲到作品。
    const seriesShortcut = page.getByRole('button', { name: /前往系列照片/ })
    await expect(seriesShortcut).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.contact-sheet__masonry:visible').first()).toBeVisible({ timeout: 15_000 })
  })

  test('新組圖以橫幅代表照開場，預設顯示 7 張系列照片', async ({ page }) => {
    await page.goto(`/gallery/photography/${encodeURIComponent('清大外拍 - 阿存')}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#event-cover-heading')).toHaveText('清大外拍 - 阿存')
    await expect(page.locator('.event-cover img')).toHaveAttribute('alt', /花與白傘/)
    await expect(
      page.locator('p').filter({ hasText: /^扉頁\s*·\s*Cover\s*$/ })
    ).toBeVisible()

    // Overview 章節隱藏（Map / Statement heading；編輯模組的扉頁刊頭 写真記録 也不在 event mode）
    await expect(page.locator('#photo-map-heading')).toHaveCount(0)
    await expect(page.locator('#photo-statement-heading')).toHaveCount(0)
    await expect(page.locator('.em__masthead')).toHaveCount(0)

    const seriesShortcut = page.getByRole('button', { name: /前往系列照片/ })
    await expect(seriesShortcut).toBeVisible()
    await expect(seriesShortcut).toHaveAttribute('aria-expanded', 'true')

    const series = page.locator('.contact-sheet__masonry:visible').first()
    await expect(series).toBeVisible({ timeout: 15_000 })
    await expect(series.locator('.contact-sheet__btn')).toHaveCount(7)
  })
})

test.describe('Mobile contact-sheet image reveal', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('already loaded visible photos are not left blurred', async ({ page }) => {
    await page.goto(`/gallery/photography/${encodeURIComponent('清大外拍 - 阿存')}`)

    const seriesShortcut = page.getByRole('button', { name: /前往系列照片/ })
    await expect(seriesShortcut).toHaveAttribute('aria-expanded', 'true')

    const series = page.locator('.contact-sheet__masonry:visible').first()
    await expect(series).toBeVisible({ timeout: 15_000 })
    await expect.poll(async () => series.locator('.contact-sheet__img').evaluateAll(images =>
      images.filter(image => image.complete && image.naturalWidth > 0).length
    )).toBeGreaterThan(0)

    await expect.poll(async () => series.locator('.contact-sheet__cell').evaluateAll(cells =>
      cells.filter(cell => {
        const image = cell.querySelector('img')
        const rect = cell.getBoundingClientRect()
        const inViewport = rect.bottom > 0 && rect.top < window.innerHeight
        return inViewport && image?.complete && image.naturalWidth > 0
          && !cell.classList.contains('contact-sheet__cell--developed')
      }).length
    )).toBe(0)
  })
})
