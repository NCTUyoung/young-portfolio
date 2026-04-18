import { test, expect } from '@playwright/test'

test.describe('首頁 /', () => {
  test('載入並顯示 Hero / 作品集 / 領域段落', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    await expect(
      page.getByRole('region', { name: /Young Portfolio 表紙/ })
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { level: 1, name: /Digital Art & Photography/ })
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { level: 2, name: /領域/ })
    ).toBeVisible()
  })

  test('可從首頁導到 Gallery 並看見作品清單', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /作品を見る Gallery/ }).first().click()

    await expect(page).toHaveURL(/\/gallery(\/|$)/)

    await expect(
      page.getByRole('heading', { level: 1, name: /Works/ })
    ).toBeVisible()
  })
})
