import { test, expect } from '@playwright/test'

test.describe('首頁 /', () => {
  test('載入並顯示 Hero / 雙軌 toggle / 主要段落', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    await expect(
      page.getByRole('region', { name: /Young Portfolio 表紙/ })
    ).toBeVisible()

    // Hero 改版：舊的「Digital Art & Photography」h1 已換成「余白」主標 +
    // 繪／影 雙軌 user-initiated toggle。驗 toggle 按鈕（aria-label 穩定）證明 Hero 渲染。
    await expect(
      page.getByRole('button', { name: '切換至電繪主視覺' })
    ).toBeVisible()

    // 「領域 Domains」段落已於改版移除（與 Hero/対話 重複）；改驗仍存在的「自己紹介 About」段。
    await expect(
      page.getByRole('heading', { level: 2, name: /自己紹介/ })
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
