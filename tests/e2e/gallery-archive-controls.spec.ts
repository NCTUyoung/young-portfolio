import { expect, test } from '@playwright/test'

test.describe('Photography map-first entry', () => {
  test('overview exposes the interactive map and representative photo groups', async ({ page }) => {
    await page.goto('/gallery/photography')

    await expect(page.locator('.photo-map-entry')).toBeVisible()
    await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
    await expect(page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()).toBeVisible()
    await expect(page.locator('.em__card-link').first()).toBeVisible()
  })

  test('map photo opens its event cover', async ({ page }) => {
    await page.goto('/gallery/photography')

    const mapPhoto = page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()
    await expect(mapPhoto).toBeVisible({ timeout: 15_000 })
    const eventName = (await mapPhoto.locator('.event-map-photo-title').textContent())?.trim()
    expect(eventName).toBeTruthy()

    await mapPhoto.click()
    await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
    await expect(page.getByTestId('event-cover-return-map')).toBeVisible()
  })
})

test.describe('Photography map-first entry on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('map photo cards remain visible and open the same event group', async ({ page }) => {
    await page.goto('/gallery/photography')

    const mapPhoto = page.getByRole('button', { name: /組圖，共 \d+ 張/ }).first()
    await expect(mapPhoto).toBeVisible({ timeout: 15_000 })
    const eventName = (await mapPhoto.locator('.event-map-photo-title').textContent())?.trim()
    expect(eventName).toBeTruthy()

    await mapPhoto.click()
    await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
  })
})
