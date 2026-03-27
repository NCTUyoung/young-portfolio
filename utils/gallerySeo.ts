import type { GalleryItem } from '~/types/gallery'

export type GalleryShareMeta = {
  title: string
  description: string
  ogImage: string
  ogImageAlt: string
  jsonLd: Record<string, unknown> | null
}

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

export function parseGalleryEventFromRoute (query: Record<string, unknown>): string | null {
  const raw = query.event
  const q = Array.isArray(raw) ? raw[0] : raw
  if (!q || typeof q !== 'string') return null
  try {
    return decodeURIComponent(q)
  } catch {
    return q
  }
}

function truncate (s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/**
 * OG / Twitter / JSON-LD for gallery deep links (?image= / ?event=).
 */
export function resolveGalleryShareMeta (opts: {
  category: 'all' | 'digital' | 'photography'
  categoryTitle: string
  imageId: string | null
  eventName: string | null
  allWorks: GalleryItem[]
  absPath: (filename: string) => string
  absThumb800: (filename: string) => string
  defaultOgImageAbs: string
  defaultTitle: string
  defaultDescription: string
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
    defaultDescription
  } = opts

  if (imageId) {
    const img = allWorks.find(w => w.id === imageId)
    if (img) {
      const ogImage = img.category === 'photography' ? absThumb800(img.filename) : absPath(img.filename)
      const title = `${img.title} · Works`
      const description = truncate(img.description || defaultDescription, 160)
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: img.title,
        description: img.description || undefined,
        contentUrl: absPath(img.filename),
        thumbnailUrl: img.category === 'photography' ? absThumb800(img.filename) : undefined
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

  if (eventName && (category === 'photography' || category === 'digital' || category === 'all')) {
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
          '@type': 'CollectionPage',
          name: title,
          description: description,
          hasPart: {
            '@type': 'ImageObject',
            name: cover.title,
            contentUrl: absPath(cover.filename)
          }
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

  return {
    title: defaultTitle,
    description: defaultDescription,
    ogImage: defaultOgImageAbs,
    ogImageAlt: defaultTitle,
    jsonLd: null
  }
}
