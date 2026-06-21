import { describe, expect, it } from 'vitest'
import { computeMasonryColumns } from './masonryColumns'
import type { GalleryItem } from '~~/shared/types/gallery'

const img = (filename: string): GalleryItem =>
  ({
    filename,
    title: filename,
  }) as GalleryItem

describe('computeMasonryColumns', () => {
  const square = () => 1

  it('returns the requested number of (empty) columns for no images', () => {
    const cols = computeMasonryColumns([], square, 3)
    expect(cols).toHaveLength(3)
    expect(cols.every(c => c.items.length === 0)).toBe(true)
  })

  it('clamps column count to at least 1', () => {
    const cols = computeMasonryColumns([img('a'), img('b')], square, 0)
    expect(cols).toHaveLength(1)
    expect(cols[0]!.items).toHaveLength(2)
  })

  it('distributes equal squares round-robin across columns (leftmost on tie)', () => {
    const cols = computeMasonryColumns([img('a'), img('b'), img('c'), img('d')], square, 3)
    // a→col0, b→col1, c→col2, d→shortest(col0)
    expect(cols[0]!.items.map(i => i.filename)).toEqual(['a', 'd'])
    expect(cols[1]!.items.map(i => i.filename)).toEqual(['b'])
    expect(cols[2]!.items.map(i => i.filename)).toEqual(['c'])
  })

  it('balances total relative height across columns', () => {
    const items = Array.from({ length: 12 }, (_, i) => img(`f${i}`))
    // mixed ratios: tall (0.66) and wide (1.5) alternating
    const ratioOf = (f: string) => (Number(f.slice(1)) % 2 === 0 ? 0.66 : 1.5)
    const cols = computeMasonryColumns(items, ratioOf, 4)
    const heights = cols.map(c => c.height)
    const max = Math.max(...heights)
    const min = Math.min(...heights)
    // greedy shortest-column keeps spread small (< one tall cell's height)
    expect(max - min).toBeLessThan(1 / 0.66)
  })

  it('preserves every image exactly once', () => {
    const items = Array.from({ length: 9 }, (_, i) => img(`x${i}`))
    const cols = computeMasonryColumns(items, () => 1.3, 3)
    const flat = cols.flatMap(c => c.items.map(i => i.filename)).sort()
    expect(flat).toEqual(items.map(i => i.filename).sort())
  })

  it('falls back safely for missing/invalid ratios', () => {
    const cols = computeMasonryColumns([img('a'), img('b')], () => 0, 2)
    expect(cols.flatMap(c => c.items)).toHaveLength(2)
    expect(cols.every(c => Number.isFinite(c.height))).toBe(true)
  })
})
