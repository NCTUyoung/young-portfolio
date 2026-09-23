import { test, expect } from '@playwright/test'

test('gallery map loads tiles from the keyless provider', async ({ page }) => {
  await page.goto('/gallery/photography')
  await page.locator('.event-map-container').scrollIntoViewIfNeeded()

  const tile = page.locator('.event-map-container .leaflet-tile').first()
  await expect(tile).toBeVisible({ timeout: 15_000 })
  await expect(tile).toHaveAttribute('src', /^https:\/\/tile\.openstreetmap\.org\//)
  await expect.poll(() => tile.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  await expect(page.locator('.event-map-container .leaflet-control-attribution')).toBeVisible()
  await expect(page.locator('.event-map-container .leaflet-control-attribution')).toContainText('OpenStreetMap')
  await expect(page.locator('.event-map-container .leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]')).toBeVisible()
})
