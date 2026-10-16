import { describe, expect, it } from 'vitest'
import type { GalleryItem } from '~~/shared/types/gallery'
import { getGalleryDisplayTitle } from './galleryDisplayTitle'

function photo (id: string, title: string, time = '2026-03-29', eventName?: string): GalleryItem {
  return { id, title, filename: `photography/${id}.jpg`, time, date: time, description: '', category: 'photography', visible: true, event: eventName ? { name: eventName, location: '', description: '' } : null }
}

describe('getGalleryDisplayTitle', () => {
  it('keeps authored Chinese and English titles, including camera-like words', () => {
    for (const title of ['樹墩上的林下片刻', 'Car', 'IMG story', 'DSC_1234 的光']) {
      const image = photo('a', title)
      expect(getGalleryDisplayTitle(image, [image])).toBe(title)
    }
  })

  it('does not rename digital artwork with a camera-style title', () => {
    const image = { ...photo('a', 'DSC_1234'), category: 'digital' as const }
    expect(getGalleryDisplayTitle(image, [image])).toBe('DSC_1234')
  })

  it('replaces exact camera file labels and edit suffixes with a truthful event and ordinal', () => {
    for (const title of ['DSC_1721-編輯-1', 'IMG_1234.JPG', '_DSC1234', 'DSCF_2345-Edit-2', '攝影作品 #7030']) {
      const image = photo('b', title, '2026-03-28', '風鈴木')
      const newer = photo('a', '已命名作品', '2026-03-29', '風鈴木')
      expect(getGalleryDisplayTitle(image, [image, newer])).toBe('風鈴木 · 02')
    }
  })

  it('uses the full event collection rather than the caller order or other events', () => {
    const image = photo('b', 'DSC_1234', '2026-03-28', '外拍')
    const newer = photo('a', 'DSC_1235', '2026-03-29', '外拍')
    const unrelated = photo('c', 'DSC_1236', '2026-04-01', '別的活動')
    expect(getGalleryDisplayTitle(image, [unrelated, image, newer])).toBe('外拍 · 02')
    expect(getGalleryDisplayTitle(image, [newer, image, unrelated])).toBe('外拍 · 02')
  })

  it('breaks equal and invalid date ties by ID consistently', () => {
    const a = photo('a', 'DSC_1', 'not-a-date', '外拍')
    const b = photo('b', 'DSC_2', 'not-a-date', '外拍')
    expect(getGalleryDisplayTitle(b, [b, a])).toBe('外拍 · 02')
  })

  it('uses a neutral label when no event exists, without inventing a sequence when absent', () => {
    const image = photo('a', '')
    expect(getGalleryDisplayTitle(image, [image])).toBe('攝影作品 · 01')
    expect(getGalleryDisplayTitle(image, [])).toBe('攝影作品')
    const eventImage = photo('b', 'DSC_2', '2026-03-28', '外拍')
    expect(getGalleryDisplayTitle(eventImage, [])).toBe('外拍')
  })

  it('does not mutate original metadata or collection order', () => {
    const image = photo('b', 'DSC_1234', '2026-03-28', '外拍')
    const items = [image, photo('a', 'DSC_2', '2026-03-29', '外拍')]
    const before = JSON.stringify(items)
    getGalleryDisplayTitle(image, items)
    expect(JSON.stringify(items)).toBe(before)
  })
})
