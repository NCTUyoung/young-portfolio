import { expect, test } from '@playwright/test'
import { waitForSiteHydration } from './site-ready'

test('the thematic exhibition connects the two galleries and its three stops', async ({ page }) => {
  test.setTimeout(75_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('gallery/digital')
  await expect(page.getByTestId('gallery-work-exhibition').getByText(/繪作/)).toBeVisible()
  const galleryControls = page.getByTestId('gallery-archive-controls')
  await expect(galleryControls).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 })
  await galleryControls.locator('.gallery-tabs__link[href$="/gallery/photography"]').click()
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
  await expect(page.getByRole('region', { name: '影的互動拍攝地圖' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('navigation', { name: '網站導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
  await page.getByRole('region', { name: '日光迴廊' }).getByRole('link', { name: /主題展.*光落之處/ }).click()
  await expect(page).toHaveURL(/\/exhibition\/light\/?#painting$/)
  await expect(page.getByRole('heading', { name: '光落之處', level: 1 })).toBeVisible()

  const stops = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link')
  await expect(stops).toHaveCount(3)
  const windowLink = page.getByRole('link', { name: /觀景窗/ })
  await windowLink.focus()
  await page.keyboard.press('Enter')
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  await page.reload()
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')
  // Pages adds the directory slash on a direct reload. Back should return here.
  const secondUrl = page.url()
  await stops.nth(2).click()
  await expect(stops.nth(2)).toHaveAttribute('aria-current', 'step')
  await page.goBack()
  await expect(page).toHaveURL(secondUrl)
  await expect(stops.nth(1)).toHaveAttribute('aria-current', 'step')

  await stops.nth(0).click()
  await page.getByRole('link', { name: /進入畫界/ }).click()
  await expect(page.getByRole('heading', { name: '畫界迴廊', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: '返回光落之處', exact: true }).click()
  await expect(page).toHaveURL(/\/exhibition\/light\/?#painting$/)
  await expect(page.getByRole('heading', { name: '光落之處', level: 1 })).toBeVisible()
  await expect(stops.nth(0)).toHaveAttribute('aria-current', 'step')
})

for (const station of [
  { hash: '#flowers', stop: '花下', title: 'DSC_1377-編輯-1' },
  { hash: '#bench', stop: '長椅', title: '長椅與參道' }
]) {
  test(`fresh ${station.hash} bookmark renders its artwork and active stop`, async ({ page }) => {
    await page.goto(`exhibition/light/${station.hash}`, { waitUntil: 'domcontentloaded' })
    await waitForSiteHydration(page)
    expect(new URL(page.url()).hash).toBe(station.hash)
    await expect(page.getByRole('heading', { level: 2, name: station.title, exact: true })).toBeVisible()
    const route = page.getByRole('navigation', { name: '展線', exact: true })
    await expect(route.locator('[aria-current="step"]')).toHaveCount(1)
    await expect(route.getByRole('link', { name: station.stop, exact: true })).toHaveAttribute('aria-current', 'step')
    if (station.hash === '#bench') {
      const exit = page.getByRole('link', { name: '前往攝影館', exact: true })
      await expect(exit).toBeVisible()
      await expect(exit).toHaveAttribute('href', /\/young-portfolio\/gallery\/photography\/?$/)
    }
  })
}

test('a station selected before hydration stays selected once the app is ready', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve })
  await page.route('**/_nuxt/**', async requestRoute => {
    if (requestRoute.request().resourceType() === 'script') await scriptsReady
    await requestRoute.continue()
  })

  const flower = page.getByRole('navigation', { name: '展線', exact: true }).getByRole('link', { name: '花下' })
  try {
    await page.goto('exhibition/light/', { waitUntil: 'commit' })
    await flower.click()
    await expect(page).toHaveURL(/#flowers$/)
  } finally {
    releaseScripts()
  }
  await waitForSiteHydration(page)
  await expect(flower).toHaveAttribute('aria-current', 'step')
  await expect(page.getByRole('heading', { name: 'DSC_1377-編輯-1', level: 2 })).toBeVisible()
})
