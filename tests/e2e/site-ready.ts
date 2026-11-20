import { expect, type Page } from '@playwright/test'

export async function waitForSiteHydration (page: Page) {
  await expect(page.locator('nav[data-hydrated]')).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
}
