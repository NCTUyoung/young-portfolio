import { test, expect } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

test.describe('首頁 /', () => {
  test('載入日光迴廊與作者介紹', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    await expect(page.getByRole('heading', { level: 1, name: '日光迴廊' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /關於作者/ })
    ).toBeVisible()
  })

  test('可從首頁導到 Gallery 並看見作品清單', async ({ page }) => {
    await page.goto('./')
    await waitForSiteHydration(page)

    await page.getByRole('region', { name: '日光迴廊' }).getByRole('link', { name: /攝影館/ }).click()

    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/photography\/?$/)
    await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()).toBeVisible()
  })
})
