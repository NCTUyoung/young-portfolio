import { describe, expect, it } from 'vitest'
import { computeJustifiedRows, DEFAULT_ASPECT_RATIO, snapRowWidthsToContainer } from './justifiedGalleryLayout'
import type { GalleryItem } from '~/types/gallery'

const img = (filename: string): GalleryItem =>
  ({
    filename,
    title: filename,
  }) as GalleryItem

describe('snapRowWidthsToContainer', () => {
  it('makes sum(widths) + gaps equal container width', () => {
    const w = snapRowWidthsToContainer([100.7, 200.4, 50.1], 12, 600)
    expect(w.reduce((a, b) => a + b, 0) + 12 * 2).toBe(600)
  })
})

describe('computeJustifiedRows', () => {
  const ratio1 = () => 1

  it('returns one row when three equal squares fit at ideal height', () => {
    const rows = computeJustifiedRows([img('a'), img('b'), img('c')], ratio1, 300, 0, 100)
    expect(rows).toHaveLength(1)
    expect(rows[0].items).toHaveLength(3)
    expect(rows[0].height).toBe(100)
    expect(rows[0].widths.every(w => w === 100)).toBe(true)
  })

  it('splits when row would exceed container at ideal height', () => {
    const rows = computeJustifiedRows([img('a'), img('b'), img('c')], ratio1, 250, 0, 100)
    expect(rows.length).toBeGreaterThanOrEqual(2)
  })

  it('uses DEFAULT_ASPECT_RATIO when all ratios are 1.5 in helper', () => {
    // idealRowHeight low enough that two images stay in one row at container 600
    const rows = computeJustifiedRows([img('a'), img('b')], () => DEFAULT_ASPECT_RATIO, 600, 12, 195)
    expect(rows[0].items).toHaveLength(2)
    const sumW = rows[0].widths.reduce((a, b) => a + b, 0) + 12
    expect(sumW).toBeCloseTo(600, 5)
  })
})
