import { describe, it, expect } from 'vitest'
import type { GalleryItem } from '~~/shared/types/gallery'
import {
  sortImagesByTime,
  filterVisibleImages,
  calculateTimeRange,
  searchImages,
  filterImagesByYear,
  filterImagesByCategory,
  filterImagesByEvent,
  getAvailableYears,
  getAvailableEvents,
  groupImagesByYear,
  groupImagesByEvent
} from './galleryUtils'

function mockItem (overrides: Partial<GalleryItem>): GalleryItem {
  return {
    id: '1',
    filename: 'a.jpg',
    title: 't',
    description: 'd',
    category: 'photography',
    date: '2024-01-01',
    time: '2024 Jan 01',
    ...overrides
  }
}

describe('galleryUtils', () => {
  it('sortImagesByTime sorts newest first', () => {
    const a = mockItem({ filename: 'old.jpg', time: '2020 Jan 01' })
    const b = mockItem({ filename: 'new.jpg', time: '2025 Jan 01' })
    const sorted = sortImagesByTime([a, b])
    expect(sorted[0].filename).toBe('new.jpg')
  })

  it('filterVisibleImages drops visible: false', () => {
    const items = [
      mockItem({ filename: '1.jpg', visible: true }),
      mockItem({ filename: '2.jpg', visible: false })
    ]
    expect(filterVisibleImages(items)).toHaveLength(1)
  })

  it('calculateTimeRange returns single date when same', () => {
    const img = mockItem({ time: '2024 Jun 15' })
    const range = calculateTimeRange([img, img])
    expect(range.length).toBeGreaterThan(0)
  })

  it('searchImages filters by title, description, tags', () => {
    const items = [
      mockItem({ filename: 'a.jpg', title: 'Sunset', description: 'x' }),
      mockItem({ filename: 'b.jpg', title: 'Other', description: 'night shot', tags: ['urban'] })
    ]
    expect(searchImages(items, 'sun').map(i => i.filename)).toEqual(['a.jpg'])
    expect(searchImages(items, 'night').map(i => i.filename)).toEqual(['b.jpg'])
    expect(searchImages(items, 'urban')).toHaveLength(1)
  })

  it('searchImages returns all when query empty', () => {
    const items = [mockItem({ filename: 'a.jpg' })]
    expect(searchImages(items, '   ')).toEqual(items)
  })

  it('filterImagesByYear', () => {
    const items = [
      mockItem({ filename: 'a.jpg', time: '2020 Jan 01' }),
      mockItem({ filename: 'b.jpg', time: '2024 Jun 01' })
    ]
    expect(filterImagesByYear(items, '2024')).toHaveLength(1)
    expect(filterImagesByYear(items, null)).toEqual(items)
  })

  it('filterImagesByCategory', () => {
    const items = [
      mockItem({ filename: 'a.jpg', category: 'digital' }),
      mockItem({ filename: 'b.jpg', category: 'photography' })
    ]
    // 2026-05-09：移除 'all'；驗證雙主線各自只取自家類別
    expect(filterImagesByCategory(items, 'digital')).toHaveLength(1)
    expect(filterImagesByCategory(items, 'photography')).toHaveLength(1)
  })

  it('filterImagesByEvent', () => {
    const items = [
      mockItem({
        filename: 'a.jpg',
        event: { name: 'E1', description: '', location: '' }
      }),
      mockItem({
        filename: 'b.jpg',
        event: { name: 'E2', description: '', location: '' }
      })
    ]
    expect(filterImagesByEvent(items, 'E1')).toHaveLength(1)
    expect(filterImagesByEvent(items, null)).toEqual(items)
  })

  it('getAvailableYears returns sorted descending strings', () => {
    const items = [
      mockItem({ filename: 'a.jpg', time: '2020 Jan 01' }),
      mockItem({ filename: 'b.jpg', time: '2024 Jun 01' })
    ]
    expect(getAvailableYears(items)).toEqual(['2024', '2020'])
  })

  it('getAvailableEvents aggregates counts', () => {
    const items = [
      mockItem({ filename: 'a.jpg', event: { name: 'Trip', description: '', location: '' } }),
      mockItem({ filename: 'b.jpg', event: { name: 'Trip', description: '', location: '' } })
    ]
    const ev = getAvailableEvents(items)
    expect(ev).toEqual([{ name: 'Trip', count: 2 }])
  })

  it('groupImagesByYear', () => {
    const items = [
      mockItem({ filename: 'a.jpg', time: '2024 Jan 01' }),
      mockItem({ filename: 'b.jpg', time: '2024 Jun 01' })
    ]
    const g = groupImagesByYear(items)
    expect(Object.keys(g)).toContain('2024')
    expect(g['2024']).toHaveLength(2)
  })

  it('groupImagesByEvent uses event name or no-event', () => {
    const withEv = mockItem({
      filename: 'a.jpg',
      event: { name: 'Foo', description: '', location: '' }
    })
    const noEv = mockItem({ filename: 'b.jpg', event: undefined })
    const g = groupImagesByEvent([withEv, noEv])
    expect(g.Foo).toHaveLength(1)
    expect(g['no-event']).toHaveLength(1)
  })
})
