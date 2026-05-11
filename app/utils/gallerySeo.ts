import type { GalleryItem } from '~~/shared/types/gallery'

export type GalleryShareMeta = {
  title: string
  description: string
  ogImage: string
  ogImageAlt: string
  jsonLd: Record<string, unknown> | null
}

/**
 * JSON-LD schema 內的作者資訊，插進 `ImageObject.creator` 讓 Google 圖搜
 * 把作品連回作者本人（配合首頁的 `Person` schema 形成閉環）。
 */
export interface GallerySchemaAuthor {
  name: string
  url: string
  alternateName?: string
}

/** 單張 Image 多大上限；超過只取 cover + 前 N 張，避免 schema JSON 變肥。 */
const EVENT_IMAGE_CAP = 20

/**
 * Absolute URL for static assets under site (path from useImagePath / getThumbPath).
 */
export function absoluteUrlFromSitePath (siteUrl: string, path: string): string {
  const origin = new URL(siteUrl).origin
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin}${p}`
}

export function parseGalleryImageIdFromRoute (query: Record<string, unknown>): string | null {
  const raw = query.image
  const id = Array.isArray(raw) ? raw[0] : raw
  if (!id || typeof id !== 'string') return null
  return id
}

/**
 * 從 vue-router params 取出 event 名（已 decode）。
 * 對應 `/gallery/<category>/<event>` 路由；若沒帶 event 段回傳 null。
 *
 * 不再從 query 讀取——`?event=` 已遷移為路徑參數，獨立預渲染為各自的 HTML。
 */
export function parseGalleryEventFromParams (params: Record<string, unknown>): string | null {
  const raw = params.event
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v || typeof v !== 'string') return null
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

function truncate (s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/**
 * 把 GalleryItem 轉成 schema.org/ImageObject。
 * - `creator`（若提供）：把每張作品綁回 `Person` schema，形成作者知識圖譜閉環。
 * - `dateCreated`：用 img.time（ISO-ish）。
 * - `keywords`：photography tags。
 * - `thumbnailUrl`：攝影帶 800w webp 縮圖；電繪本身就是輕量 webp 省略。
 */
function buildImageObject (
  img: GalleryItem,
  absPath: (f: string) => string,
  absThumb800: (f: string) => string,
  creator?: GallerySchemaAuthor
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'ImageObject',
    name: img.title,
    contentUrl: absPath(img.filename)
  }
  if (img.description) schema.description = img.description
  if (img.time) schema.dateCreated = img.time
  if (img.category === 'photography') {
    schema.thumbnailUrl = absThumb800(img.filename)
    if (img.tags && img.tags.length > 0) schema.keywords = img.tags
  }
  if (creator) {
    schema.creator = {
      '@type': 'Person',
      name: creator.name,
      url: creator.url,
      ...(creator.alternateName ? { alternateName: creator.alternateName } : {})
    }
  }
  return schema
}

/**
 * OG / Twitter / JSON-LD for gallery pages。
 *
 * 三種情境：
 * 1. `?image=<id>` → 單張 `ImageObject`（附 creator / keywords / dateCreated）
 * 2. 路徑 `/gallery/<cat>/<event>` → `ImageGallery`（`hasPart` 列多張作 ImageObject，上限 EVENT_IMAGE_CAP）
 * 3. 預設（無 image / event）→ `CollectionPage`，describes 整個類別；不列作品避免太重
 */
export function resolveGalleryShareMeta (opts: {
  category: 'digital' | 'photography'
  categoryTitle: string
  imageId: string | null
  eventName: string | null
  allWorks: GalleryItem[]
  absPath: (filename: string) => string
  absThumb800: (filename: string) => string
  defaultOgImageAbs: string
  defaultTitle: string
  defaultDescription: string
  pageUrl?: string
  author?: GallerySchemaAuthor
}): GalleryShareMeta {
  const {
    category,
    categoryTitle,
    imageId,
    eventName,
    allWorks,
    absPath,
    absThumb800,
    defaultOgImageAbs,
    defaultTitle,
    defaultDescription,
    pageUrl,
    author
  } = opts

  if (imageId) {
    const img = allWorks.find(w => w.id === imageId)
    if (img) {
      const ogImage = img.category === 'photography' ? absThumb800(img.filename) : absPath(img.filename)
      const title = `${img.title} · Works`
      const description = truncate(img.description || defaultDescription, 160)
      const jsonLd = {
        '@context': 'https://schema.org',
        ...buildImageObject(img, absPath, absThumb800, author)
      }
      return {
        title,
        description,
        ogImage,
        ogImageAlt: img.title,
        jsonLd
      }
    }
  }

  if (eventName && (category === 'photography' || category === 'digital')) {
    const inEvent = allWorks.filter(w => w.event?.name === eventName)
    const firstPhoto = inEvent.find(w => w.category === 'photography')
    const firstAny = inEvent[0]
    const cover = firstPhoto || firstAny
    const eventInfo = cover?.event
    const title = `${eventName} · ${categoryTitle}`
    const description = truncate(
      eventInfo?.description || cover?.description || defaultDescription,
      160
    )
    const ogImage = cover
      ? (cover.category === 'photography' ? absThumb800(cover.filename) : absPath(cover.filename))
      : defaultOgImageAbs
    const jsonLd = cover
      ? {
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: title,
          description,
          ...(pageUrl ? { url: pageUrl } : {}),
          ...(eventInfo?.location ? { contentLocation: { '@type': 'Place', name: eventInfo.location } } : {}),
          image: absPath(cover.filename),
          numberOfItems: inEvent.length,
          hasPart: inEvent
            .slice(0, EVENT_IMAGE_CAP)
            .map(img => buildImageObject(img, absPath, absThumb800, author))
        }
      : null
    return {
      title,
      description,
      ogImage,
      ogImageAlt: eventName,
      jsonLd
    }
  }

  // 預設頁：沒帶 query 的 /gallery、/gallery/photography、/gallery/digital
  // 吐一個頁面層級的 `CollectionPage`，`about` 指向作者（Person）。
  const defaultJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: defaultTitle,
    description: defaultDescription,
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(author
      ? {
          about: {
            '@type': 'Person',
            name: author.name,
            url: author.url,
            ...(author.alternateName ? { alternateName: author.alternateName } : {})
          }
        }
      : {}),
    numberOfItems: allWorks.length
  }

  return {
    title: defaultTitle,
    description: defaultDescription,
    ogImage: defaultOgImageAbs,
    ogImageAlt: defaultTitle,
    jsonLd: defaultJsonLd
  }
}
