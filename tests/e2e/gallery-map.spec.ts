import { expect, test, type Locator, type Page } from '@playwright/test'

const PHOTO_MAP_PATH = '/gallery/photography'
const ALL_ACTIVITY_COUNT = 14

async function openMap (page: Page) {
  await page.goto(PHOTO_MAP_PATH)
  const map = page.locator('.event-map-wrapper:not(.event-map-wrapper--compact):not(.event-map-inset)')
  await expect(map).toBeVisible()
  await expect(map.locator('.event-map-photo-card')).toHaveCount(ALL_ACTIVITY_COUNT)
  await expect(map.locator('.event-map-selection')).toBeVisible()
  await expect(map).toHaveAttribute('data-map-zoom', /\d+(?:\.\d+)?/)
  return map
}

async function mapZoom (map: Locator) {
  return Number(await map.getAttribute('data-map-zoom'))
}

async function assertCircleLayout (cards: Locator) {
  const rectangles = await cards.evaluateAll(elements => elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect()
    return { x, y, width, height }
  }))
  for (const [index, current] of rectangles.entries()) {
    expect(current.width).toBeGreaterThan(0)
    expect(current.height).toBeGreaterThan(0)
    for (const other of rectangles.slice(index + 1)) {
      const overlapWidth = Math.max(0, Math.min(current.x + current.width, other.x + other.width) - Math.max(current.x, other.x))
      const overlapHeight = Math.max(0, Math.min(current.y + current.height, other.y + other.height) - Math.max(current.y, other.y))
      const overlapRatio = overlapWidth * overlapHeight / Math.min(current.width * current.height, other.width * other.height)
      expect(overlapRatio).toBeLessThan(0.15)
    }
  }
}

test('gallery map loads tiles from the keyless provider', async ({ page }) => {
  await page.goto(PHOTO_MAP_PATH)
  await page.locator('.event-map-container').first().scrollIntoViewIfNeeded()

  const tile = page.locator('.event-map-container .leaflet-tile').first()
  await expect(tile).toBeVisible({ timeout: 15_000 })
  await expect(tile).toHaveAttribute('src', /^https:\/\/tile\.openstreetmap\.org\//)
  await expect.poll(() => tile.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  await expect(page.locator('.event-map-container .leaflet-control-attribution').first()).toContainText('OpenStreetMap')
  await expect(page.locator('.event-map-container .leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]').first()).toBeVisible()
})

test('all activity circles are visible across the Taiwan map and Japan inset', async ({ page }) => {
  const map = await openMap(page)
  const circles = map.locator('.event-map-photo-card')
  await expect(map.locator('.event-map-inset .event-map-photo-card')).toHaveCount(2)
  await expect(map.locator('.event-map-photo-card--focused')).toHaveCount(1)
  for (const circle of await circles.all()) {
    await expect(circle).toBeVisible()
    await expect(circle).toHaveAttribute('aria-label', /^預覽「.+」$/)
    await expect(circle).toHaveAttribute('aria-pressed', /^(true|false)$/)
    await expect(circle.locator('img')).toHaveCSS('object-fit', 'cover')
  }
  await assertCircleLayout(circles)
  await expect(map.locator('.event-map-marker--selected')).toHaveCount(1)
})

test('selecting a circle stays on the map; entering and returning preserves its selection and zoom', async ({ page }) => {
  const map = await openMap(page)
  const choice = map.locator('.event-map-photo-card[aria-pressed="false"]').first()
  const eventName = await choice.getAttribute('data-event-name')
  expect(eventName).toBeTruthy()
  await choice.click()
  await expect(map.getByRole('button', { name: `預覽「${eventName}」` })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)

  const footer = map.locator('.event-map-selection')
  await expect(footer).toHaveAttribute('aria-label', new RegExp(`^進入「${eventName}」組圖，共 \\d+ 張$`))
  await expect(footer.locator('.event-map-photo-title')).toHaveText(eventName!)
  await expect(map.locator('.event-map-photo-card--focused')).toHaveCount(1)

  const initialZoom = await mapZoom(map)
  await map.getByRole('button', { name: '放大地圖並靠近活動位置' }).click()
  await expect(map).toHaveAttribute('data-map-zoom', String(initialZoom + 1))
  await footer.click()
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)

  await page.getByTestId('event-cover-return-map').click()
  const restoredMap = page.locator('.event-map-wrapper:not(.event-map-wrapper--compact):not(.event-map-inset)')
  await expect(restoredMap).toHaveAttribute('data-map-zoom', String(initialZoom + 1))
  await expect(restoredMap.locator('.event-map-photo-card--focused')).toHaveAttribute('data-event-name', eventName!)
  await expect(restoredMap.locator('.event-map-selection .event-map-photo-title')).toHaveText(eventName!)
})

test('circle keyboard selection exposes a separate action to enter the group', async ({ page }) => {
  const map = await openMap(page)
  const choice = map.locator('.event-map-photo-card[aria-pressed="false"]').first()
  const eventName = await choice.getAttribute('data-event-name')
  expect(eventName).toBeTruthy()
  await choice.focus()
  await page.keyboard.press('Enter')
  await expect(map.getByRole('button', { name: `預覽「${eventName}」` })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
  await expect(map.locator('.event-map-selection .event-map-photo-title')).toHaveText(eventName!)

  const footer = map.locator('.event-map-selection')
  await page.keyboard.press('Tab')
  await expect(map.locator('.event-map-inset .event-map-photo-card[tabindex="0"]')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(footer).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
})

test('arrow and boundary keys move focus and selection among Taiwan circles', async ({ page }) => {
  const map = await openMap(page)
  const circles = map.locator('.event-map-photos').first().getByRole('button', { name: /^預覽「/ })
  expect(await circles.count()).toBeGreaterThan(2)
  await circles.first().click()
  await circles.first().focus()

  await page.keyboard.press('ArrowRight')
  await expect(circles.nth(1)).toBeFocused()
  await expect(circles.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(circles.first()).toHaveAttribute('tabindex', '-1')
  await page.keyboard.press('Home')
  await expect(circles.first()).toBeFocused()
  await page.keyboard.press('End')
  await expect(circles.last()).toBeFocused()
  await expect(circles.last()).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
})

test('switching to all locations and opening immediately preserves that map mode on return', async ({ page }) => {
  const map = await openMap(page)
  const eventName = (await map.locator('.event-map-selection .event-map-photo-title').textContent())?.trim()
  expect(eventName).toBeTruthy()

  await map.getByRole('button', { name: '顯示全部活動' }).click()
  await map.locator('.event-map-selection').click()
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)

  await page.getByTestId('event-cover-return-map').click()
  const restoredMap = page.locator('.event-map-wrapper:not(.event-map-wrapper--compact):not(.event-map-inset)')
  await expect(restoredMap.locator('.event-map-inset')).toHaveCount(0)
  await expect(restoredMap.locator('.event-map-photo-card')).toHaveCount(ALL_ACTIVITY_COUNT)
  await expect(restoredMap.getByRole('button', { name: '回到主要拍攝區域' })).toBeVisible()
  await expect(restoredMap.locator('.event-map-selection .event-map-photo-title')).toHaveText(eventName!)
})

test('selecting a Japan circle updates the footer without moving the Taiwan map', async ({ page }) => {
  const map = await openMap(page)
  const mainPane = map.locator('.event-map-container .leaflet-map-pane').first()
  const mainPosition = await mainPane.getAttribute('style')
  const initialZoom = await mapZoom(map)
  const remote = map.locator('.event-map-inset .event-map-photo-card').first()
  const eventName = await remote.getAttribute('data-event-name')
  expect(eventName).toBeTruthy()

  await remote.click()
  await expect(remote).toHaveAttribute('aria-pressed', 'true')
  await expect(map.locator('.event-map-photo-card--focused')).toHaveCount(1)
  await expect(map.locator('.event-map-selection .event-map-photo-title')).toHaveText(eventName!)
  await expect(page).toHaveURL(/\/gallery\/photography\/?$/)
  await expect(map).toHaveAttribute('data-map-zoom', String(initialZoom))
  await expect(mainPane).toHaveAttribute('style', mainPosition!)
  await map.locator('.event-map-selection').click()
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
})

test('ordinary wheel scrolls the page while Ctrl-wheel and controls zoom the Taiwan map', async ({ page }) => {
  const map = await openMap(page)
  const initialZoom = await mapZoom(map)
  const bounds = await map.locator('.event-map-container').first().boundingBox()
  expect(bounds).toBeTruthy()
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)

  const beforeScroll = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 450)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeScroll)
  await expect(map).toHaveAttribute('data-map-zoom', String(initialZoom))

  await map.scrollIntoViewIfNeeded()
  const mapBounds = await map.locator('.event-map-container').first().boundingBox()
  expect(mapBounds).toBeTruthy()
  await page.mouse.move(mapBounds!.x + mapBounds!.width / 2, mapBounds!.y + mapBounds!.height / 2)
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -450)
  await page.keyboard.up('Control')
  await expect(map).toHaveAttribute('data-map-zoom', String(initialZoom + 1))

  await map.getByRole('button', { name: '顯示全部活動' }).click()
  await expect.poll(() => mapZoom(map)).toBeLessThan(initialZoom)
  await expect(map.locator('.event-map-inset')).toHaveCount(0)
  await expect(map.locator('.event-map-photo-card')).toHaveCount(ALL_ACTIVITY_COUNT)

  await map.getByRole('button', { name: '回到主要拍攝區域' }).click()
  await expect(map.locator('.event-map-inset .event-map-photo-card')).toHaveCount(2)
  await expect.poll(() => mapZoom(map)).toBeGreaterThan(initialZoom - 1)
})

test('dragging the map updates a connector; offscreen anchors lose the line while circles remain selectable', async ({ page }) => {
  const map = await openMap(page)
  const selected = map.locator('.event-map-photo-card--focused')
  const selectedName = await selected.getAttribute('data-event-name')
  expect(selectedName).toBeTruthy()
  const line = map.locator(`.event-map-connectors line[data-event-name="${selectedName}"]`)
  await expect(line).toHaveAttribute('x1', /\d+/)
  const anchorBefore = await line.getAttribute('x1')
  const bounds = await map.locator('.event-map-container').first().boundingBox()
  expect(bounds).toBeTruthy()
  const x = bounds!.x + bounds!.width * .52
  const y = bounds!.y + bounds!.height * .52
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 72, y + 36, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => line.getAttribute('x1')).not.toBe(anchorBefore)

  for (let index = 0; index < 2; index++) {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - bounds!.width * .35, y, { steps: 10 })
    await page.mouse.up()
  }
  await expect(line).toHaveCount(0)
  await expect(selected).toBeVisible()
})

test.describe('photography map on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('all circles and the selection action remain usable without horizontal overflow', async ({ page }) => {
    const map = await openMap(page)
    const circles = map.locator('.event-map-photo-card')
    await expect(map.locator('.event-map-inset .event-map-photo-card')).toHaveCount(2)
    for (const circle of await circles.all()) await expect(circle).toBeVisible()
    await assertCircleLayout(circles)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)

    const choice = map.locator('.event-map-photo-card[aria-pressed="false"]').first()
    const eventName = await choice.getAttribute('data-event-name')
    await choice.click()
    await expect(map.getByRole('button', { name: `預覽「${eventName}」` })).toHaveAttribute('aria-pressed', 'true')
    await map.locator('.event-map-selection').click()
    await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
  })
})

test('tile failure keeps every circle and selected group usable', async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  const map = await openMap(page)
  await expect(map.locator('.event-map-tile-status').first()).toBeVisible({ timeout: 20_000 })
  await expect(map.getByRole('button', { name: '重試載入地圖' }).first()).toBeVisible()
  await expect(map.locator('.event-map-photo-card')).toHaveCount(ALL_ACTIVITY_COUNT)

  const choice = map.locator('.event-map-photo-card[aria-pressed="false"]').first()
  const eventName = await choice.getAttribute('data-event-name')
  await choice.click()
  await expect(map.getByRole('button', { name: `預覽「${eventName}」` })).toHaveAttribute('aria-pressed', 'true')
  await map.locator('.event-map-selection').click()
  await expect(page.locator('#event-cover-heading')).toHaveText(eventName!)
})
