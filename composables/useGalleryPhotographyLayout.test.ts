import { describe, expect, it } from 'vitest'
import { getImageRows, getRowGridTemplateColumns } from './useGalleryPhotographyLayout'
import type { GalleryItem } from '~/types/gallery'

const img = (filename: string): GalleryItem =>
  ({
    filename,
    title: filename,
  }) as GalleryItem

describe('useGalleryPhotographyLayout', () => {
  it('getImageRows chunks by two', () => {
    const rows = getImageRows([img('a'), img('b'), img('c')])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(2)
    expect(rows[1]).toHaveLength(1)
  })

  it('getRowGridTemplateColumns returns fr tracks for grid (not Tailwind classes)', () => {
    expect(getRowGridTemplateColumns(0, 0)).toBe('3fr 2fr')
    expect(getRowGridTemplateColumns(1, 0)).toBe('1fr 1fr')
    expect(getRowGridTemplateColumns(0, 1)).toBe('1fr 1fr')
  })
})
