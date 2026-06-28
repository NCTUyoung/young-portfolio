import { describe, it, expect } from 'vitest'
import type { DigitalArtItem, PhotographyItem } from '~~/shared/types/gallery'
import { transformDigitalWork, transformPhotographyWork } from './galleryLoaders'

function digital (overrides: Partial<DigitalArtItem> = {}): DigitalArtItem {
  return {
    filename: 'gallery/2026/a.jpg',
    time: '2026 Jan 01',
    title: 'Digital A',
    content: 'desc',
    color: 'blue',
    ...overrides
  }
}

function photo (overrides: Partial<PhotographyItem> = {}): PhotographyItem {
  return {
    filename: 'photography/event/b.jpg',
    time: '2026 Jan 01',
    title: 'Photo B',
    content: 'desc',
    tags: ['street'],
    event: { name: '某事件' },
    camera: 'X-T5',
    model: 'XF35',
    focalLength: 35,
    aperture: 1.4,
    iso: 200,
    shutterSpeed: 0.005,
    ...overrides
  }
}

describe('galleryLoaders · transformDigitalWork', () => {
  it('maps core fields and stamps category/visible', () => {
    const out = transformDigitalWork(digital({ title: 'T', content: 'C', color: 'red' }))
    expect(out.category).toBe('digital')
    expect(out.visible).toBe(true)
    expect(out.title).toBe('T')
    expect(out.description).toBe('C') // content → description
    expect(out.color).toBe('red')
    expect(typeof out.id).toBe('string')
    expect(out.id.length).toBeGreaterThan(0)
  })

  it('event defaults to null when absent', () => {
    expect(transformDigitalWork(digital()).event).toBeNull()
    const ev = { name: 'E' }
    expect(transformDigitalWork(digital({ event: ev })).event).toEqual(ev)
  })

  it('geometry passthrough: included only when a number, key omitted otherwise', () => {
    const withGeo = transformDigitalWork(digital({ aspectRatio: 1.5, focalX: 0.4, focalY: 0.3 }))
    expect(withGeo.aspectRatio).toBe(1.5)
    expect(withGeo.focalX).toBe(0.4)
    expect(withGeo.focalY).toBe(0.3)

    const noGeo = transformDigitalWork(digital())
    // 缺值時 key 必須「不存在」（讓元件 fallback 生效），而非 undefined 值。
    expect('aspectRatio' in noGeo).toBe(false)
    expect('focalX' in noGeo).toBe(false)
    expect('focalY' in noGeo).toBe(false)
  })

  it('focal 0 is a valid value (not treated as missing)', () => {
    const out = transformDigitalWork(digital({ focalX: 0, focalY: 0, aspectRatio: 0.6667 }))
    expect(out.focalX).toBe(0)
    expect(out.focalY).toBe(0)
  })

  it('series copied as a new array (not the same reference)', () => {
    const src = digital({ series: ['hero'] }) as DigitalArtItem & { series: string[] }
    const out = transformDigitalWork(src)
    expect(out.series).toEqual(['hero'])
    expect(out.series).not.toBe(src.series)
  })
})

describe('galleryLoaders · transformPhotographyWork', () => {
  it('maps EXIF + core fields and stamps category/visible', () => {
    const out = transformPhotographyWork(photo())
    expect(out.category).toBe('photography')
    expect(out.visible).toBe(true)
    expect(out.camera).toBe('X-T5')
    expect(out.focalLength).toBe(35)
    expect(out.aperture).toBe(1.4)
    expect(out.iso).toBe(200)
    expect(out.tags).toEqual(['street'])
  })

  it('geometry passthrough mirrors digital semantics', () => {
    const withGeo = transformPhotographyWork(photo({ aspectRatio: 1.5, focalX: 0.5, focalY: 0.3 }))
    expect(withGeo.aspectRatio).toBe(1.5)
    expect(withGeo.focalX).toBe(0.5)

    const noGeo = transformPhotographyWork(photo())
    expect('aspectRatio' in noGeo).toBe(false)
    expect('focalX' in noGeo).toBe(false)
    expect('focalY' in noGeo).toBe(false)
  })

  it('optional note/pairWith only present when set', () => {
    const bare = transformPhotographyWork(photo())
    expect('note' in bare).toBe(false)
    expect('pairWith' in bare).toBe(false)
    const rich = transformPhotographyWork(photo({ note: 'n', pairWith: 'digital-x' }))
    expect(rich.note).toBe('n')
    expect(rich.pairWith).toBe('digital-x')
  })

  it('id is deterministic for the same category + filename', () => {
    expect(transformPhotographyWork(photo()).id).toBe(transformPhotographyWork(photo()).id)
  })
})
