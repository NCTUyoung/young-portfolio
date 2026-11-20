import { expect, test } from '@playwright/test'

test('the thematic exhibition connects the two galleries and its three stops', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/gallery/digital')
  const digitalEntrance = page.getByRole('navigation', { name: '主題展', exact: true })
  await expect(digitalEntrance.getByRole('link', { name: /光落之處/ })).toBeVisible()
  await page.locator('.gallery-tabs__link[href$="/gallery/photography"]').first().click()
  await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible()
  await page.getByRole('navigation', { name: '主題展', exact: true }).getByRole('link', { name: /光落之處/ }).click()
  await expect(page.getByRole('heading', { name: '光落之處', level: 1 })).toBeVisible()

  const stops = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link')
  await expect(stops).toHaveCount(3)
  const windowLink = page.getByRole('link', { name: /觀景窗/ })
  await windowLink.focus()
  await page.keyboard.press('Enter')
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  const secondUrl = page.url()
  await page.reload()
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  await stops.nth(2).click()
  await expect(stops.nth(2)).toHaveAttribute('aria-current', 'step')
  await page.goBack()
  await expect(page).toHaveURL(secondUrl)
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')

  await stops.nth(0).click()
  await page.getByRole('link', { name: /進入畫界/ }).click()
  await expect(page.getByRole('heading', { name: '畫界迴廊', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: '光落之處', exact: true }).click()
  await expect(page.getByRole('heading', { name: '光落之處', level: 1 })).toBeVisible()
})

test('a station selected before hydration stays selected once the app is ready', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve })
  await page.route('**/_nuxt/**', async requestRoute => {
    if (requestRoute.request().resourceType() === 'script') await scriptsReady
    await requestRoute.continue()
  })

  const flower = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link', { name: '花下' })
  try {
    await page.goto('/exhibition/light/', { waitUntil: 'commit' })
    await flower.click()
    await expect(page).toHaveURL(/#flowers$/)
  } finally {
    releaseScripts()
  }
  await expect(flower).toHaveAttribute('aria-current', 'step')
  await expect(page.getByRole('heading', { name: 'DSC_1377-編輯-1', level: 2 })).toBeVisible()
})
