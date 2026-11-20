import { test, expect } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

test.describe('首頁 /', () => {
  test('載入光落之處序廳與作者介紹', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveTitle(/Young Portfolio/i)

    await expect(page.getByRole('heading', { level: 1, name: '光落之處', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: '光落之處' }).getByText(/序廳/)).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /關於作者/ })
    ).toBeVisible()
  })

  test('可從序廳經館藏先看拍攝活動，再到踏跡地圖', async ({ page }) => {
    await page.goto('./')
    await waitForSiteHydration(page)

    await page.getByRole('region', { name: '光落之處' }).getByRole('link', { name: '瀏覽館藏', exact: true }).click()
    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/?$/)
    const photography = page.getByRole('navigation', { name: '館藏目錄' })
      .getByRole('link', { name: '攝影館', exact: true })
    await expect(photography).toHaveAttribute('href', '/young-portfolio/gallery/photography#gallery-activities')
    await photography.click()
    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/photography\/?#gallery-activities$/)
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
