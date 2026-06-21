import { test, expect } from '@playwright/test'

test.describe('首頁 /', () => {
  test('載入並顯示 Hero / 對開扉頁 / 主要段落', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    // Hero 改版（強硬大膽 · 首頁精簡）：舊「繪／影 toggle」單視覺已換成
    // 「左繪右影 對開扉頁」(hero-spread)，role=region + aria-roledescription「封面對開主視覺」。
    await expect(
      page.getByRole('region', { name: /繪と影.*對開扉頁/ })
    ).toBeVisible()

    // 不再有 toggle 按鈕；改成兩半各自是進入對應圖片庫的連結（aria-label 穩定）。
    // 驗兩個入口連結都在 → 證明對開 Hero 已渲染。
    await expect(
      page.getByRole('link', { name: /進入繪世界/ })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /進入影世界/ })
    ).toBeVisible()

    // 「領域 Domains」段落已於改版移除（與 Hero/対話 重複）；改驗仍存在的「自己紹介 About」段。
    await expect(
      page.getByRole('heading', { level: 2, name: /自己紹介/ })
    ).toBeVisible()
  })

  test('可從首頁導到 Gallery 並看見作品清單', async ({ page }) => {
    await page.goto('/')

    // Hero 對開右半 = 影世界入口（→ /gallery/photography）。
    await page.getByRole('link', { name: /進入影世界/ }).first().click()

    await expect(page).toHaveURL(/\/gallery(\/|$)/)

    // 攝影 overview 改版：影(kage) 世界 desktop 主欄改報紙刊頭式編輯模組
    // (GalleryEditorialModules)，扉頁刊頭 h2 為「写真記録」。
    await expect(
      page.getByRole('heading', { level: 2, name: '写真記録' })
    ).toBeVisible()
  })
})
