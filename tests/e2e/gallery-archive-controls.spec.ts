import { expect, test } from '@playwright/test'

test.describe('Gallery archive controls pilot', () => {
  test('overview exposes one control surface and a disclosed filter state', async ({ page }) => {
    await page.goto('/gallery/photography')

    const archive = page.getByTestId('gallery-archive-controls')
    await expect(archive).toHaveCount(1)
    await expect(archive).toBeVisible()
    await expect(archive).toHaveAttribute('data-hydrated', 'true', { timeout: 15_000 })

    const disclosure = page.getByTestId('gallery-filter-disclosure')
    const drawer = page.getByTestId('gallery-filter-drawer')

    await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    await expect(drawer).toBeHidden()

    await disclosure.click()

    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    await expect(drawer).toBeVisible()
    const search = page.getByRole('searchbox')
    await expect(search).toBeVisible()

    await search.fill('no-such-gallery-work')
    await expect(disclosure).toContainText('「no-such-gallery-work」')
    await expect(page.getByRole('heading', { level: 2, name: '沒有符合條件的作品' })).toBeVisible()
  })

  test('category navigation uses the quiet route change without the global page flip', async ({ page }) => {
    await page.goto('/gallery/photography')

    await page.getByTestId('gallery-archive-controls').getByRole('link', { name: /繪.*Digital/i }).click()
    await expect(page).toHaveURL(/\/gallery\/digital/)
    await page.waitForTimeout(100)

    await expect(page.locator('.pf')).toHaveCount(0)
    await expect(page.getByTestId('gallery-archive-controls')).toHaveAttribute('data-world', 'kai')
  })
})

test.describe('Gallery archive controls pilot on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('sticky summary reopens the same filter disclosure', async ({ page }) => {
    await page.goto('/gallery/photography')
    await expect(page.getByTestId('gallery-archive-controls')).toHaveAttribute('data-hydrated', 'true')
    await page.evaluate(() => window.scrollTo(0, 900))

    const miniToggle = page.getByTestId('gallery-filter-mini-toggle')
    await expect(miniToggle).toBeVisible()
    await expect(miniToggle).toHaveAttribute('aria-controls', 'gallery-filter-controls-drawer')
    await miniToggle.click()

    const disclosure = page.getByTestId('gallery-filter-disclosure')
    await expect(miniToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('gallery-filter-drawer')).toBeVisible()
  })
})
