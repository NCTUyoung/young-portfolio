import { describe, it, expect } from 'vitest'
import type { UnifiedGalleryItem } from '~/stores/adminTypes'
import {
  computeCanUpload,
  pickDataByCategory,
  buildGroupedManageData,
  buildAvailableEventsForManage
} from './adminSelectors'

function u (overrides: Partial<UnifiedGalleryItem> & { filename?: string }): UnifiedGalleryItem {
  return {
    id: '1',
    filename: 'a.jpg',
    title: 't',
    description: 'd',
    category: 'photography',
    date: '2024-01-01',
    time: '2024 Jan 01',
    ...overrides
  } as UnifiedGalleryItem
}

describe('adminSelectors', () => {
  it('computeCanUpload for gallery without files', () => {
    expect(computeCanUpload({
      fileCount: 0,
      uploading: false,
      uploadCategory: 'gallery',
      eventMode: 'new',
      eventName: '',
      selectedExistingEvent: ''
    })).toBe(false)
  })

  it('computeCanUpload photography new needs event name', () => {
    expect(computeCanUpload({
      fileCount: 1,
      uploading: false,
      uploadCategory: 'photography',
      eventMode: 'new',
      eventName: '',
      selectedExistingEvent: ''
    })).toBe(false)
    expect(computeCanUpload({
      fileCount: 1,
      uploading: false,
      uploadCategory: 'photography',
      eventMode: 'new',
      eventName: 'Trip',
      selectedExistingEvent: ''
    })).toBe(true)
  })

  it('pickDataByCategory', () => {
    const g = [u({ filename: 'g.jpg', category: 'digital' })]
    const p = [u({ filename: 'p.jpg' })]
    expect(pickDataByCategory('gallery', g, p)).toEqual(g)
    expect(pickDataByCategory('photography', g, p)).toEqual(p)
  })

  it('buildAvailableEventsForManage lists year groups for digital', () => {
    const items = [u({ category: 'digital', time: '2024 Jan 01' })]
    const names = buildAvailableEventsForManage(items, 'gallery')
    expect(names.some(n => n.includes('2024'))).toBe(true)
  })

  it('buildGroupedManageData filters by selectedEvent', () => {
    const ev = { name: 'Only', description: '', location: '' }
    const items = [
      u({ event: ev }),
      u({ filename: 'b.jpg', event: { name: 'Other', description: '', location: '' } })
    ]
    const groups = buildGroupedManageData(items, 'photography', 'Only')
    expect(groups).toHaveLength(1)
    expect(groups[0].eventName).toBe('Only')
  })
})
