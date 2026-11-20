// Exercise the 2025 assets against the shared exhibition runtime on loopback.
// node check_web_2025.mjs <inventory-directory> <chrome.exe> [playwright-directory]
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [inventoryDirectory, executablePath, playwrightDirectory] = process.argv.slice(2)
assert(inventoryDirectory && executablePath)
const require = createRequire(import.meta.url)
const { chromium } = require(playwrightDirectory ? path.resolve(playwrightDirectory) : 'playwright')
const publicRoot = fileURLToPath(new URL('../../public/', import.meta.url))
const exhibitRoot = path.join(publicRoot, 'painted-worlds')
const output = path.join(inventoryDirectory, '2025-場景證據', 'web')
const ids = ['solitude', '2025-36', 'mirror', 'diamond', 'cosplayer']
const readJSON = async filename => JSON.parse((await readFile(filename, 'utf8')).replace(/^\uFEFF/, ''))
const [manifest, registry, rooms, html] = await Promise.all([
  readJSON(path.join(exhibitRoot, 'exhibition.json')),
  readJSON(path.join(exhibitRoot, 'work-registry.json')),
  Promise.all(ids.map(id => readJSON(path.join(exhibitRoot, 'rooms', id, 'room.json')))),
  readFile(path.join(exhibitRoot, 'index.html'), 'utf8'),
])

// Inject these five room contracts into the test response only. The integration
// group owns the shared manifest and may still be assembling other years.
for (const room of rooms) {
  const { id, title, views, stills, mobileStills, look } = room
  assert(registry.some(work => work.id === id && work.workId === room.workId))
  manifest.models[id] = room.model
  manifest.rooms[id] = { title, views, stills, mobileStills, look }
}
const document = html.replace(/(<script\b[^>]*\bid=["']exhibit-data["'][^>]*>)[\s\S]*?(<\/script>)/i,
  (_, start, end) => start + JSON.stringify(manifest).replaceAll('<', '\\u003c') + end)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = path.resolve(publicRoot, '.' + pathname)
    assert(file.startsWith(publicRoot))
    const body = pathname === '/painted-worlds/index.html' ? document
      : pathname === '/painted-worlds/exhibition.json' ? JSON.stringify(manifest)
        : await readFile(file)
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404).end()
  }
})

const checks = {}
await mkdir(output, { recursive: true })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = 'http://127.0.0.1:' + server.address().port
let browser
try {
  browser = await chromium.launch({ executablePath, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 820 }, reducedMotion: 'reduce' })
  const mobile = await browser.newContext({ viewport: { width: 320, height: 690 }, isMobile: true,
    hasTouch: true, reducedMotion: 'reduce' })
  await mobile.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (mode, ...options) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(mode)) return null
      return getContext.call(this, mode, ...options)
    }
  })
  const page = await desktop.newPage()
  const narrow = await mobile.newPage()
  for (const room of rooms) {
    const { id } = room
    // Force each bookmark to open a fresh document so hash navigation
    // cannot carry the previous work's return destination into its evidence.
    await Promise.all([page.goto('about:blank'), narrow.goto('about:blank')])
    const url = origin + '/painted-worlds/index.html?from=work#' + id
    const asset = page.waitForResponse(response => new URL(response.url()).pathname.endsWith(room.model.slice(1))
      && response.ok())
    await page.goto(url)
    const response = await asset
    await page.waitForSelector('body[data-mode="webgl"][data-world="' + id + '"] #scene[data-ready="true"]',
      { timeout: 30000 })
    const returnURL = await page.locator('#source-return').getAttribute('href')
    assert.equal(new URL(returnURL, url).searchParams.get('image'), room.workId)
    const first = await page.locator('#scene canvas').screenshot({ path: path.join(output, id + '-desktop-0.png') })
    await page.locator('.stations button').nth(1).click()
    await page.waitForSelector('body[data-stop="1"]')
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const second = await page.locator('#scene canvas').screenshot({ path: path.join(output, id + '-desktop-1.png') })
    assert(!first.equals(second), id + ': the second WebGL station did not change the canvas')
    const canvas = page.locator('#scene canvas')
    const bounds = await canvas.boundingBox()
    const center = [bounds.x + bounds.width * .46, bounds.y + bounds.height * .50]
    await page.mouse.move(...center)
    await page.mouse.down()
    await page.mouse.move(center[0] + 135, center[1] + 14, { steps: 5 })
    await page.mouse.up()
    const orbited = await canvas.screenshot({ path: path.join(output, id + '-orbit.png') })
    assert(!orbited.equals(second), id + ': the orbit did not change the canvas')
    await page.locator('#original').click()
    await page.waitForFunction(() => {
      const image = document.querySelector('dialog[open] img')
      return image?.complete && image.naturalWidth > 0
    })
    await page.keyboard.press('Escape')
    await page.waitForSelector('dialog[open]', { state: 'hidden' })
    await narrow.goto(url)
    await narrow.waitForSelector('body[data-mode="stills"][data-world="' + id + '"] #scene[data-ready="true"]')
    const narrowReturnURL = await narrow.locator('#source-return').getAttribute('href')
    assert.equal(new URL(narrowReturnURL, url).searchParams.get('image'), room.workId)
    const used = []
    for (const [i, still] of room.mobileStills.entries()) {
      await narrow.locator('.stations button').nth(i).click()
      const suffix = still.slice(1)
      await narrow.waitForFunction(expected => {
        const image = document.querySelector('.still img')
        return image.complete && image.naturalWidth === 720 && new URL(image.currentSrc).pathname.endsWith(expected)
      }, suffix)
      await narrow.screenshot({ path: path.join(output, id + '-320-fallback-' + i + '.png') })
      used.push(still)
    }
    checks[id] = { webglModel: new URL(response.url()).pathname, desktopStations: 2,
      orbit: true, original: true, sourceReturnWorkId: room.workId, fallbackViewport: 320, mobileStills: used }
    console.log('WEB_OK', id)
  }
  await writeFile(path.join(output, 'verification.json'), JSON.stringify(checks, null, 2) + '\n')
} finally {
  await browser?.close()
  server.close()
}
