import { describe, it, expect } from 'vitest'
import { resolveGalleryShareMeta } from '~/utils/gallerySeo'
import type { GalleryItem } from '~~/shared/types/gallery'

const abs = (s: string) => `https://example.com${s.startsWith('/') ? s : `/${s}`}`

const baseItem = (over: Partial<GalleryItem>): GalleryItem => ({
  id: 'p1',
  filename: 'photography/test/a.jpg',
  title: 'T1',
  description: 'Desc',
  date: '2026 Jan 01',
  time: '2026 Jan 01',
  category: 'photography',
  tags: [],
  event: { name: 'E1', description: 'ed', location: 'L' },
  camera: 'x',
  model: 'y',
  focalLength: 50,
  aperture: 2.8,
  iso: 100,
  shutterSpeed: 0.01,
  ...over
})

const common = {
  absPath: (fn: string) => abs(`/images/${fn}`),
  absThumb800: (fn: string) => abs(`/_thumbs/800w/${fn.replace(/\.jpg$/, '.webp')}`),
  defaultOgImageAbs: abs('/default.jpg'),
  defaultTitle: 'Works',
  defaultDescription: 'default'
}

const author = {
  name: 'NCTU Young',
  url: 'https://example.com/',
  alternateName: 'jimmyyoung1995'
}

describe('resolveGalleryShareMeta', () => {
  it('uses single image meta for ?image= id and embeds creator + keywords', () => {
    const works: GalleryItem[] = [
      baseItem({
        id: 'id-123',
        title: 'Hello',
        description: 'Long text '.repeat(20),
        tags: ['street', 'night'],
        time: '2026-04-01T10:00:00Z'
      })
    ]
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works - 攝影作品',
      imageId: 'id-123',
      eventName: null,
      allWorks: works,
      author,
      pageUrl: 'https://example.com/gallery/photography?image=id-123',
      ...common
    })
    expect(m.title).toContain('Hello')
    expect(m.ogImage).toContain('800w')
    expect(m.jsonLd?.['@type']).toBe('ImageObject')
    expect(m.jsonLd?.dateCreated).toBe('2026-04-01T10:00:00Z')
    expect(m.jsonLd?.keywords).toEqual(['street', 'night'])
    expect((m.jsonLd?.creator as Record<string, unknown>)?.name).toBe('NCTU Young')
  })

  it('renders ImageGallery with hasPart list for ?event= (+ location)', () => {
    const works: GalleryItem[] = [
      baseItem({ id: 'x1', title: 'A' }),
      baseItem({ id: 'x2', title: 'B', filename: 'photography/test/b.jpg' })
    ]
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works - 攝影作品',
      imageId: null,
      eventName: 'E1',
      allWorks: works,
      author,
      ...common
    })
    expect(m.title).toContain('E1')
    expect(m.jsonLd?.['@type']).toBe('ImageGallery')
    expect(m.jsonLd?.numberOfItems).toBe(2)
    const parts = m.jsonLd?.hasPart as Array<Record<string, unknown>>
    expect(parts).toHaveLength(2)
    expect(parts[0]?.['@type']).toBe('ImageObject')
    expect((m.jsonLd?.contentLocation as Record<string, unknown>)?.name).toBe('L')
  })

  it('returns a CollectionPage fallback for queryless gallery pages', () => {
    const works: GalleryItem[] = [baseItem({ id: 'y' })]
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works - 攝影作品',
      imageId: null,
      eventName: null,
      allWorks: works,
      author,
      pageUrl: 'https://example.com/gallery/photography',
      ...common
    })
    expect(m.jsonLd?.['@type']).toBe('CollectionPage')
    expect(m.jsonLd?.numberOfItems).toBe(1)
    expect((m.jsonLd?.about as Record<string, unknown>)?.name).toBe('NCTU Young')
  })

  it('caps ImageGallery hasPart at EVENT_IMAGE_CAP', () => {
    const works: GalleryItem[] = Array.from({ length: 25 }, (_, i) =>
      baseItem({ id: `img-${i}`, filename: `photography/test/${i}.jpg` })
    )
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works',
      imageId: null,
      eventName: 'E1',
      allWorks: works,
      author,
      ...common
    })
    const parts = m.jsonLd?.hasPart as Array<Record<string, unknown>>
    expect(parts.length).toBe(20)
    expect(m.jsonLd?.numberOfItems).toBe(25)
  })
})
