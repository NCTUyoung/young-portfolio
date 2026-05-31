import { describe, it, expect } from 'vitest'
import type { GalleryItem } from '~~/shared/types/gallery'
import {
  combineAndSortAllWorks,
  getCurrentWorks,
  applySearchAndYearFilter,
  buildAvailableYears
} from './gallerySelectors'

function item (overrides: Partial<GalleryItem>): GalleryItem {
  return {
    id: '1',
    filename: 'a.jpg',
    title: 'Hello',
    description: 'World',
    category: 'photography',
    date: '2024-06-01',
    time: '2024 Jun 01',
    ...overrides
  }
}

describe('gallerySelectors', () => {
  it('combineAndSortAllWorks merges and sorts by time desc', () => {
    const d = [item({ filename: 'd.jpg', category: 'digital', time: '2020 Jan 01' })]
    const p = [item({ filename: 'p.jpg', time: '2025 Jan 01' })]
    const out = combineAndSortAllWorks(d, p)
    expect(out[0]!.filename).toBe('p.jpg')
  })

  it('getCurrentWorks respects category and event', () => {
    const ev = { name: 'E1', description: '', location: '' }
    const digital = [item({ filename: '1.jpg', category: 'digital', event: ev })]
    const photo = [item({ filename: '2.jpg', event: ev })]
    const all = combineAndSortAllWorks(digital, photo)

    const fs = {
      selectedCategory: 'digital' as const,
      selectedEvent: 'E1' as string | null,
      searchQuery: '',
      yearFilter: null
    }
    expect(getCurrentWorks(fs, digital, photo, all)).toHaveLength(1)

    // 2026-05-09：'all' 已移除，改測「切到 photography 看到 photo 那張」
    const fs2 = { ...fs, selectedCategory: 'photography' as const, selectedEvent: null }
    expect(getCurrentWorks(fs2, digital, photo, all).length).toBe(1)
    expect(getCurrentWorks(fs2, digital, photo, all)[0]?.filename).toBe('2.jpg')
  })

  it('applySearchAndYearFilter', () => {
    const works = [
      item({ title: 'Alpha', date: '2023-01-01' }),
      item({ title: 'Beta', date: '2024-01-01' })
    ]
    expect(applySearchAndYearFilter(works, 'beta', null)).toHaveLength(1)
    expect(applySearchAndYearFilter(works, '', '2024')).toHaveLength(1)
  })

  it('buildAvailableYears unique desc', () => {
    const works = [
      item({ date: '2023-01-01' }),
      item({ date: '2024-01-01' })
    ]
    expect(buildAvailableYears(works)).toEqual(['2024', '2023'])
  })
})
