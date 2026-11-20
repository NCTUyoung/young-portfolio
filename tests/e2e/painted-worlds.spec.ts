import { expect, test } from '@playwright/test'

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

test('digital gallery reaches both painted worlds, their stations and original art', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/gallery/digital')
  await page.getByRole('link', { name: '進入畫界迴廊' }).click()
  await expect(page).toHaveURL(/\/young-portfolio\/painted-worlds\/index\.html$/)
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
    await page.getByRole('button', { name: '返回迴廊' }).click()
    await expect(page.locator('#room-title')).toHaveText('畫界迴廊')
  }
  await page.getByRole('link', { name: '數位繪畫展廳' }).click()
  await expect(page).toHaveURL(/\/gallery\/digital\/?$/)
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
  await page.goto('/painted-worlds/index.html')
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
  await page.getByRole('button', { name: '返回迴廊' }).click()
  await expect(page.locator('#room-title')).toHaveText('畫界迴廊')
})
