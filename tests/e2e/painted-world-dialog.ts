import { expect, type Page } from '@playwright/test'

export async function expectPaintedWorldDialog (page: Page, title: string) {
  const dialog = page.locator('dialog').filter({
    has: page.getByRole('button', { name: '離開畫界', exact: true })
  })
  const close = dialog.getByRole('button', { name: '離開畫界', exact: true })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true)
  const frame = dialog.frameLocator('iframe')
  await expect(frame.getByRole('heading', { name: title, exact: true, level: 1 }))
    .toBeVisible({ timeout: 20_000 })
  await expect(frame.locator('html')).toHaveAttribute('data-embed', '1', { timeout: 20_000 })
  return { dialog, close, frame }
}
