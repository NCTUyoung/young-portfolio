import { expect, test } from '@playwright/test'
import { expectPaintedWorldDialog } from './painted-world-dialog'
import { waitForSiteHydration } from './site-ready'

test('the orchard and stage each contain their own three-dimensional character', async ({ request }) => {
  type Model = {
    scene?: number
    scenes: { nodes: number[] }[]
    nodes: { name?: string, mesh?: number, children?: number[] }[]
    meshes: { primitives: { attributes: { POSITION: number } }[] }[]
    accessors: { min: number[], max: number[] }[]
  }
  const manifest = await request.get('/young-portfolio/painted-worlds/exhibition.json')
  expect(manifest.ok()).toBeTruthy()
  const { models } = await manifest.json()

  for (const [room, character] of [['orchard', 'Roxy'], ['stage', 'Vocalist']] as const) {
    const asset = await request.get(new URL(models[room], manifest.url()).href)
    expect(asset.ok(), room).toBeTruthy()
    const bytes = await asset.body()
    expect(bytes.toString('ascii', 0, 4)).toBe('glTF')
    const model: Model = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)))
    function descendants(roots: number[]): number[] {
      return roots.flatMap(root => [root, ...descendants(model.nodes[root].children ?? [])])
    }
    const active = descendants(model.scenes[model.scene ?? 0].nodes)
    const actor = active.find(index => model.nodes[index].name === character)
    expect(actor, room + ' character in active scene').toBeDefined()
    const hasVolume = descendants([actor!]).some(index => {
      const mesh = model.nodes[index].mesh
      return mesh !== undefined && model.meshes[mesh].primitives.some(primitive => {
        const bounds = model.accessors[primitive.attributes.POSITION]
        return bounds.min.every((min, axis) => bounds.max[axis] > min)
      })
    })
    expect(hasVolume, character + ' has mesh geometry with depth').toBeTruthy()
  }
})

test('the homepage dialog opens both rooms and their original artworks without leaving the page', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await waitForSiteHydration(page)
  const opener = page.getByRole('link', { name: '逛 3D 迴廊', exact: true })
  const homeUrl = page.url()
  const homeScroll = await page.evaluate(() => scrollY)
  await opener.click()
  const { dialog, close, frame } = await expectPaintedWorldDialog(page, '畫界迴廊')
  await expect(page).toHaveURL(homeUrl)
  await expect(frame.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
  const historyLength = await page.evaluate(() => history.length)

  for (const [door, room, artwork] of [
    ['orchard', '柑橘樹下', '唯一真神'],
    ['stage', '紅色舞台', 'Mika Nakashima']
  ] as const) {
    await frame.locator(`[data-door="${door}"]`).click()
    await expect(frame.locator('body')).toHaveAttribute('data-world', door)
    await expect(frame.locator('#room-title')).toHaveText(room)
    const stations = frame.getByRole('navigation', { name: '展線站點' }).getByRole('button')
    await expect(stations).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      await stations.nth(i).click()
      await expect(stations.nth(i)).toHaveAttribute('aria-pressed', 'true')
      await expect(frame.locator('body')).toHaveAttribute('data-stop', String(i))
    }
    await frame.getByRole('button', { name: '看原畫' }).click()
    const original = frame.getByRole('dialog')
    await expect(original).toBeVisible()
    await expect(original.getByRole('heading')).toHaveText(artwork)
    await expect.poll(() => original.getByRole('img', { name: artwork }).evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await original.getByRole('button', { name: '關閉' }).click()
    await frame.getByRole('button', { name: '迴廊總覽', exact: true }).click()
    await expect(frame.locator('#room-title')).toHaveText('畫界迴廊')
  }
  await close.click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(homeUrl)
  expect(await page.evaluate(() => history.length)).toBe(historyLength)
  await expect(opener).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(homeScroll)
})

test('modifier click on the legacy exhibition link opens the original standalone room', async ({ page, context }) => {
  await page.goto('exhibition/light/#painting')
  await waitForSiteHydration(page)
  const sourceUrl = page.url()
  const orchard = page.getByRole('region', { name: '唯一真神', exact: true }).getByRole('link', { name: /畫界/ })
  const newTab = context.waitForEvent('page')
  await orchard.click({ modifiers: ['ControlOrMeta'] })
  const standalone = await newTab
  await expect(standalone).toHaveURL(/\/young-portfolio\/painted-worlds\/index\.html\?from=light#orchard$/)
  await expect(standalone.getByRole('heading', { level: 1, name: '柑橘樹下', exact: true })).toBeVisible()
  await standalone.getByRole('link', { name: '回到繪作站', exact: true }).click()
  await expect(standalone).toHaveURL(/\/young-portfolio\/exhibition\/light\/?#painting$/)
  await expect(page).toHaveURL(sourceUrl)
})

test.describe('standalone fallback', () => {
  test.use({ javaScriptEnabled: false })

  test('the home action still opens the corridor document without JavaScript', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('link', { name: '逛 3D 迴廊', exact: true }).click()
    await expect(page).toHaveURL(/\/young-portfolio\/painted-worlds\/index\.html\?from=home$/)
    await expect(page.getByRole('heading', { level: 1, name: '畫界迴廊', exact: true })).toBeVisible()
  })
})

test('the legacy Mika bookmark opens the stage and its original artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('painted-worlds/index.html#stage')
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
  await expect(page).toHaveURL(/\/young-portfolio\/painted-worlds\/index\.html#stage$/)
  await expect(page.getByRole('heading', { level: 1, name: '紅色舞台', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '看原畫' }).click()
  const original = page.getByRole('dialog')
  await expect(original.getByRole('heading', { name: 'Mika Nakashima', exact: true })).toBeVisible()
  await expect.poll(() => original.getByRole('img', { name: 'Mika Nakashima' })
    .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
})

const paintedWorks = [
  { room: 'orchard', heading: '柑橘樹下', art: '唯一真神', id: 'digital-gallery/2026年電繪作品/23-編輯-4-1' },
  { room: 'stage', heading: '紅色舞台', art: 'Mika Nakashima', id: 'digital-gallery/2026年電繪作品/16-編輯-1' }
] as const

for (const work of paintedWorks) {
  test(`${work.art} opens in the same page and keeps the original viewer open`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('gallery/digital')
    await waitForSiteHydration(page)

    const workButton = page.getByRole('button', { name: `觀看作品：${work.art}`, exact: true })
    const artwork = page.locator('main figure').filter({ has: workButton })
    const entrance = artwork.getByTestId('gallery-work-painted-room')
    await expect(entrance).toHaveCount(1)
    await expect(entrance).toHaveAttribute('href', new RegExp(`/young-portfolio/painted-worlds/index\\.html\\?from=work#${work.room}$`))
    await entrance.scrollIntoViewIfNeeded()
    const galleryUrl = page.url()
    const galleryScroll = await page.evaluate(() => scrollY)
    await entrance.click()
    const fromWall = await expectPaintedWorldDialog(page, work.heading)
    await expect.poll(() => fromWall.frame.locator('body').evaluate(() => location.hash)).toBe('#' + work.room)
    await expect(page).toHaveURL(galleryUrl)
    await fromWall.close.click()
    await expect(fromWall.dialog).toBeHidden()
    await expect(page).toHaveURL(galleryUrl)
    await expect(entrance).toBeFocused()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(galleryScroll)

    await workButton.click()
    await expect.poll(() => new URL(page.url()).searchParams.get('image')).toBe(work.id)
    const viewer = page.getByRole('dialog', { name: '圖片檢視器' })
    const viewerImage = viewer.locator('.image-viewer-area picture img')
    await expect(viewerImage).toHaveAttribute('alt', work.art)
    const originalViewer = await viewer.elementHandle()
    const viewerEntrance = viewer.getByTestId('gallery-work-painted-room')
    await expect(viewerEntrance).toBeVisible()
    const viewerUrl = page.url()
    const viewerScroll = await page.evaluate(() => scrollY)
    await viewerEntrance.click()
    const fromViewer = await expectPaintedWorldDialog(page, work.heading)
    await expect(page).toHaveURL(viewerUrl)
    await expect(page.locator('[role="dialog"][aria-label="圖片檢視器"]')).toHaveCount(1)
    expect(await originalViewer.evaluate(element => element.isConnected)).toBe(true)
    await fromViewer.close.focus()
    await page.keyboard.press('Escape')
    await expect(fromViewer.dialog).toBeHidden()
    await expect(page).toHaveURL(viewerUrl)
    await expect(viewer).toBeVisible()
    await expect(viewerImage).toHaveAttribute('alt', work.art)
    await expect(viewerEntrance).toBeFocused()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(viewerScroll)
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/digital\/?$/)
  })
}

test('the standalone gallery room remembers the original work across room changes and reload', async ({ page }) => {
  await page.goto('painted-worlds/index.html?from=work#stage')
  await expect(page.locator('#room-title')).toHaveText('紅色舞台')
  await page.getByRole('button', { name: '迴廊總覽', exact: true }).click()
  await page.locator('[data-door="orchard"]').click()
  await expect(page).toHaveURL(/#orchard$/)
  await page.reload()
  await page.getByRole('link', { name: '回到《Mika Nakashima》', exact: true }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('image')).toBe(paintedWorks[1].id)
  const viewer = page.getByRole('dialog', { name: '圖片檢視器' })
  await expect(viewer.locator('.image-viewer-area picture img')).toHaveAttribute('alt', 'Mika Nakashima')
})

test('painted worlds remain usable on a narrow viewport without WebGL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return original.call(this, type, ...args)
    } as typeof original
  })
  const models: string[] = []
  page.on('request', request => {
    if (/\.glb(?:[?#]|$)/i.test(request.url())) models.push(request.url())
  })
  await page.goto('painted-worlds/index.html')
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'stills')
  await page.locator('[data-door="orchard"]').click()
  await expect(page.locator('#room-title')).toHaveText('柑橘樹下')
  const stations = page.getByRole('navigation', { name: '展線站點' }).getByRole('button')
  await expect(stations).toHaveCount(3)
  await stations.nth(2).click()
  await expect(page.locator('body')).toHaveAttribute('data-stop', '2')
  const still = page.locator('.still img')
  await expect(still).toBeVisible()
  await expect(still).toHaveAttribute('alt', /洛琪希/)
  await expect.poll(() => still.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await expect.poll(() => still.evaluate(img => (img as HTMLImageElement).currentSrc)).toContain('orchard-2-mobile.webp')
  await page.getByRole('button', { name: '看原畫' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '關閉' }).click()
  await page.getByRole('button', { name: '迴廊總覽', exact: true }).click()
  await expect(page.locator('#room-title')).toHaveText('畫界迴廊')
  expect(models).toEqual([])
})
