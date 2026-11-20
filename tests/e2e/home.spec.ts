import { test, expect } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

test.describe('首頁 /', () => {
  test('載入作品集與作者介紹', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    await expect(page.getByRole('heading', { level: 1, name: '作品集', exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /關於作者/ })
    ).toBeVisible()
  })

  test('首頁可直達拍攝活動，再切換到踏跡地圖', async ({ page }) => {
    await page.goto('./')
    await waitForSiteHydration(page)

    const photography = page.getByRole('navigation', { name: '網站導覽' })
      .getByRole('link', { name: '攝影', exact: true })
    await expect(photography).toHaveAttribute('href', '/young-portfolio/gallery/photography#gallery-activities')
    await photography.click()
    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/photography\/?#gallery-activities$/)
    await waitForSiteHydration(page)
    const activityModes = page.getByRole('navigation', { name: '拍攝活動瀏覽方式' })
    await expect(activityModes.getByRole('link', { name: '依活動', exact: true })).toHaveAttribute('aria-current', 'location')
    await expect(page.getByTestId('gallery-activity-index').getByRole('heading', { level: 3 }).first()).toBeInViewport()

    await activityModes.getByRole('link', { name: '依地點', exact: true }).click()
    await expect(page).toHaveURL(/\/gallery\/photography\/?#gallery-footsteps$/)
    const map = page.getByRole('region', { name: '影的互動拍攝地圖' })
    await expect(map).toBeInViewport({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()).toBeVisible()
  })
})
