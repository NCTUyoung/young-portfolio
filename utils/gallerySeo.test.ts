import { describe, it, expect } from 'vitest'
import { resolveGalleryShareMeta } from '~/utils/gallerySeo'
import type { GalleryItem } from '~/types/gallery'

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

describe('resolveGalleryShareMeta', () => {
  it('uses single image meta for ?image= id', () => {
    const works: GalleryItem[] = [
      baseItem({ id: 'id-123', title: 'Hello', description: 'Long text '.repeat(20) })
    ]
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works - 攝影作品',
      imageId: 'id-123',
      eventName: null,
      allWorks: works,
      absPath: (fn) => abs(`/young-portfolio/images/${fn.replace(/^photography\//, 'photography/')}`),
      absThumb800: () => abs('/young-portfolio/images/_thumbs/800w/photography/test/a.webp'),
      defaultOgImageAbs: abs('/default.jpg'),
      defaultTitle: 'Works',
      defaultDescription: 'default'
    })
    expect(m.title).toContain('Hello')
    expect(m.ogImage).toContain('800w')
    expect(m.jsonLd?.['@type']).toBe('ImageObject')
  })

  it('uses event cover for ?event=', () => {
    const works: GalleryItem[] = [baseItem({ id: 'x' })]
    const m = resolveGalleryShareMeta({
      category: 'photography',
      categoryTitle: 'Works - 攝影作品',
      imageId: null,
      eventName: 'E1',
      allWorks: works,
      absPath: (fn) => abs(`/images/${fn}`),
      absThumb800: () => abs('/thumb.webp'),
      defaultOgImageAbs: abs('/default.jpg'),
      defaultTitle: 'Works',
      defaultDescription: 'default'
    })
    expect(m.title).toContain('E1')
    expect(m.jsonLd?.['@type']).toBe('CollectionPage')
  })
})
