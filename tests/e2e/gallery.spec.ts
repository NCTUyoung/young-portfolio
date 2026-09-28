import { test, expect } from '@playwright/test'

test.describe('Gallery /gallery/photography', () => {
  test('攝影入口先呈現互動地圖與代表照片組圖', async ({ page }) => {
    await page.goto('/gallery/photography')

    await expect(page.locator('.photo-map-entry')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
    await expect(page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /踏跡/ })).toBeVisible()
  })

  test('點地圖代表照片進入組圖，再展開系列照片', async ({ page }) => {
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

    // 組圖扉頁是照片系列的入口；點擊明確展開後才掛載系列格。
    const expandSeries = page.getByRole('button', { name: /展開全部/ })
    await expect(expandSeries).toHaveAttribute('data-hydrated', 'true')
    await expandSeries.click()
    await expect(expandSeries).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.contact-sheet__masonry').first()).toBeVisible({ timeout: 15_000 })
  })

  test('新組圖以橫幅代表照開場，展開後有 7 張系列照片', async ({ page }) => {
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

    const expandSeries = page.getByRole('button', { name: /展開全部/ })
    await expect(expandSeries).toBeVisible()
    await expect(expandSeries).toHaveAttribute('data-hydrated', 'true')
    await expandSeries.click()
    await expect(expandSeries).toHaveAttribute('aria-expanded', 'true')

    const series = page.locator('.contact-sheet__masonry').first()
    await expect(series).toBeVisible({ timeout: 15_000 })
    await expect(series.locator('.contact-sheet__btn')).toHaveCount(7)
  })
})
