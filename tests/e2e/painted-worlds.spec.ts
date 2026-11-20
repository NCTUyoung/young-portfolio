import { expect, test } from '@playwright/test'
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

test('the legacy foyer link still opens the painted-worlds hub and both rooms', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('painted-worlds/index.html?from=home')
  await expect(page).toHaveURL(/\/young-portfolio\/painted-worlds\/index\.html\?from=home$/)
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
  await expect(page.locator('#room-title')).toHaveText('畫界迴廊')

  for (const [door, room, artwork] of [
    ['orchard', '柑橘樹下', '唯一真神'],
    ['stage', '紅色舞台', 'Mika Nakashima']
  ] as const) {
    await page.locator(`[data-door="${door}"]`).click()
    await expect(page).toHaveURL(new RegExp(`#${door}$`))
    await expect(page.locator('#room-title')).toHaveText(room)
    const stations = page.getByRole('navigation', { name: '展線站點' }).getByRole('button')
    await expect(stations).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      await stations.nth(i).click()
      await expect(stations.nth(i)).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('body')).toHaveAttribute('data-stop', String(i))
    }
    await page.getByRole('button', { name: '看原畫' }).click()
    const original = page.getByRole('dialog')
    await expect(original).toBeVisible()
    await expect(original.getByRole('heading')).toHaveText(artwork)
    await expect.poll(() => original.getByRole('img', { name: artwork }).evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await page.getByRole('button', { name: '關閉' }).click()
    await page.getByRole('button', { name: '迴廊總覽', exact: true }).click()
    await expect(page.locator('#room-title')).toHaveText('畫界迴廊')
  }
  await page.getByRole('link', { name: '回到首頁', exact: true }).click()
  await expect(page).toHaveURL(/\/young-portfolio\/$/)
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
  test(`${work.art} enters its painted world and returns to the same artwork`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('gallery/digital')
    await waitForSiteHydration(page)

    const artwork = page.locator('main figure').filter({ has: page.getByRole('button', { name: `觀看作品：${work.art}`, exact: true }) })
    const entrance = artwork.getByRole('link', { name: new RegExp(work.heading) })
    await expect(entrance).toHaveCount(1)
    await entrance.click()
    await expect(page).toHaveURL(new RegExp(`/young-portfolio/painted-worlds/index\\.html\\?from=work#${work.room}$`))
    await expect(page.getByRole('heading', { level: 1, name: work.heading })).toBeVisible()
    await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 25_000 })
    await page.getByRole('button', { name: '看原畫' }).click()
    const original = page.getByRole('dialog')
    await expect(original.getByRole('heading', { name: work.art })).toBeVisible()
    await page.getByRole('button', { name: '關閉' }).click()

    // Exploring a different room and reloading must retain the original source artwork.
    await page.getByRole('button', { name: '迴廊總覽', exact: true }).click()
    await page.locator(`[data-door="${work.room === 'orchard' ? 'stage' : 'orchard'}"]`).click()
    await expect(page).not.toHaveURL(new RegExp(`#${work.room}$`))
    await page.reload()
    await page.getByRole('link', { name: `回到《${work.art}》`, exact: true }).click()
    await expect(page).toHaveURL(/\/young-portfolio\/gallery\/digital\/?\?/)
    await expect.poll(() => new URL(page.url()).searchParams.get('image')).toBe(work.id)
    const viewer = page.getByRole('dialog', { name: '圖片檢視器' })
    await expect(viewer.locator('.image-viewer-area picture img')).toHaveAttribute('alt', work.art)
  })
}

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
