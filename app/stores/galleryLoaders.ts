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
  PhotographyData
} from '~~/shared/types/gallery'

export function transformDigitalWork (img: DigitalArtItem): GalleryItem {
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
    visible: true
  }
}

export function transformPhotographyWork (img: PhotographyItem): GalleryItem {
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
    visible: true
  }
}

/**
 * Site 根路徑（public/ 底下的靜態檔掛在這裡），不是 `/_nuxt/`。
 * `import.meta.env.BASE_URL` 在部分打包情境會變成 `.../_nuxt/`，若直接 join 會變成 `.../_nuxt/galleryList.json` → 404。
 */
function getPublicSiteBase (): string {
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
 * 載入 public 根目錄的 JSON（路徑 = site base + 檔名，見 `nuxt.config` 的 `app.baseURL`）。
 */
export async function fetchJsonWithFallback (filename: string): Promise<unknown> {
  const path = joinURL(getPublicSiteBase(), filename)
  // 一律用根絕對路徑，避免 ofetch 把相對路徑接到錯誤的 base（例如 _nuxt）
  const absolute = path.startsWith('/') ? path : `/${path}`
  return await $fetch(absolute)
}

export async function fetchDigitalWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> {
  const data = await fetchJsonWithFallback('galleryList.json') as GalleryData

  const works = sortImagesByTime(
    data.Img.map(transformDigitalWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

export async function fetchPhotographyWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> {
  const data = await fetchJsonWithFallback('photographyList.json') as PhotographyData

  const works = sortImagesByTime(
    data.Img.map(transformPhotographyWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}
