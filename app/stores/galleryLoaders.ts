/**
 * Gallery 公開資料載入：JSON 路徑（依 app.baseURL）、轉成 GalleryItem
 */
import { joinURL } from 'ufo'
import { sortImagesByTime } from '~/utils/galleryUtils'
import { generateImageId } from '~/utils/imageUtils'
import type {
  GalleryItem,
  DigitalArtItem,
  PhotographyItem,
  GalleryData,
  PhotographyData,
  SeriesNarrative,
  TrackManifesto
} from '~~/shared/types/gallery'

type NarrativeMap = Record<string, SeriesNarrative> | undefined

export function transformDigitalWork (img: DigitalArtItem, narratives?: NarrativeMap): GalleryItem {
  const eventName = img.event?.name
  return {
    id: generateImageId('digital', img.filename),
    filename: img.filename,
    title: img.title,
    description: img.content,
    date: img.time,
    time: img.time,
    color: img.color,
    event: img.event || null,
    category: 'digital' as const,
    visible: true,
    ...(Array.isArray((img as unknown as { series?: unknown }).series)
      ? { series: [...((img as unknown as { series: string[] }).series)] }
      : {}),
    ...(eventName && narratives?.[eventName] ? { seriesNarrative: narratives[eventName] } : {}),
    ...((img as { pairWith?: string }).pairWith ? { pairWith: (img as { pairWith?: string }).pairWith } : {})
  }
}

export function transformPhotographyWork (img: PhotographyItem, narratives?: NarrativeMap): GalleryItem {
  const eventName = img.event?.name
  return {
    id: generateImageId('photography', img.filename),
    filename: img.filename,
    title: img.title,
    description: img.content,
    date: img.time,
    time: img.time,
    tags: img.tags || [],
    event: img.event || null,
    camera: img.camera,
    model: img.model,
    focalLength: img.focalLength,
    aperture: img.aperture,
    iso: img.iso,
    shutterSpeed: img.shutterSpeed,
    category: 'photography' as const,
    visible: true,
    ...(Array.isArray(img.series) ? { series: [...img.series] } : {}),
    ...(eventName && narratives?.[eventName] ? { seriesNarrative: narratives[eventName] } : {}),
    ...(img.note ? { note: img.note } : {}),
    ...(img.pairWith ? { pairWith: img.pairWith } : {})
  }
}

/**
 * Client 端 site 根路徑（public/ 底下的靜態檔掛在這裡），不是 `/_nuxt/`。
 *
 * 部署到 GitHub Pages 時 `app.baseURL = /young-portfolio/`，瀏覽器才需要帶前綴。
 * SSR/prerender 不走這條路：server 端直接用 `fs` 讀檔，見下方 `fetchJsonWithFallback`。
 *
 * `import.meta.env.BASE_URL` 在部分打包情境會變成 `.../_nuxt/`，若直接 join 會
 * 變成 `.../_nuxt/galleryList.json` → 404，所以 fallback 主動把它洗掉。
 */
function getClientSiteBase (): string {
  try {
    const app = useRuntimeConfig().app as { baseURL?: string } | undefined
    const u = app?.baseURL
    if (u && typeof u === 'string' && u.length > 0) {
      return u.endsWith('/') ? u : `${u}/`
    }
  } catch {
    // 非 Nuxt 內容（例如純 Vitest）則走下方 fallback
  }

  let b = import.meta.env.BASE_URL || '/'
  b = b.replace(/\/?_nuxt\/?$/, '/')
  if (!b.endsWith('/')) b += '/'
  return b
}

/**
 * 載入 public 根目錄的 JSON。
 *
 * - **Server（SSR / prerender / dev server）**：直接 `fs.readFile` 讀 `public/<filename>`。
 *   不走 Nitro HTTP，避免 request 先丟進 Vue Router catchall 產生
 *   `[Vue Router warn] No match found for location with path "/galleryList.json"`
 *   （即使最終 public handler 會回 200，router.resolve 已經在 log 留噪音；
 *   Nuxt 4 下 prerender 甚至會升級成 `[unhandledRejection]`）。
 * - **Client（瀏覽器）**：走 `$fetch` 配 baseURL，由 GitHub Pages 直接供檔。
 */
export async function fetchJsonWithFallback (filename: string): Promise<unknown> {
  if (import.meta.server) {
    const [{ readFile }, { resolve }] = await Promise.all([
      import('node:fs/promises'),
      import('node:path')
    ])
    const absolute = resolve(process.cwd(), 'public', filename)
    const raw = await readFile(absolute, 'utf-8')
    return JSON.parse(raw)
  }

  const path = joinURL(getClientSiteBase(), filename)
  const absolute = path.startsWith('/') ? path : `/${path}`
  return await $fetch(absolute)
}

export async function fetchDigitalWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number>, manifesto?: TrackManifesto }> {
  const data = await fetchJsonWithFallback('galleryList.json') as GalleryData

  const works = sortImagesByTime(
    data.Img.map((img) => transformDigitalWork(img, data.seriesNarratives))
  )

  return {
    works,
    eventStats: data.eventStats || {},
    manifesto: data.trackManifesto
  }
}

export async function fetchPhotographyWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number>, manifesto?: TrackManifesto }> {
  const data = await fetchJsonWithFallback('photographyList.json') as PhotographyData

  const works = sortImagesByTime(
    data.Img.map((img) => transformPhotographyWork(img, data.seriesNarratives))
  )

  return {
    works,
    eventStats: data.eventStats || {},
    manifesto: data.trackManifesto
  }
}
