import { describe, expect, it } from 'vitest'
import { cardEdge, rectanglesOverlap, layoutMapPrints } from './photoMapCardLayout'

describe('photo map card layout geometry', () => {
  it('keeps a gutter between cards when checking overlap', () => {
    const first = { left: 0, top: 0, right: 100, bottom: 80 }
    expect(rectanglesOverlap(first, { left: 105, top: 0, right: 205, bottom: 80 })).toBe(true)
    expect(rectanglesOverlap(first, { left: 110, top: 0, right: 210, bottom: 80 })).toBe(false)
  })

  it('connects an outside anchor to the nearest card edge', () => {
    expect(cardEdge(130, 40, 10, 0, 100, 80)).toEqual({ x: 110, y: 40 })
  })

  it('uses the lower center when the anchor sits inside the card', () => {
    expect(cardEdge(60, 30, 10, 0, 100, 80)).toEqual({ x: 60, y: 80 })
  })

  it.each([[1168, 600], [720, 600], [342, 500], [280, 500]])('fits uncropped portrait and landscape prints at %ipx', (width, height) => {
    const prints = layoutMapPrints(width, height, [2 / 3, 2 / 3, 1.5])
    expect(prints).toHaveLength(width < 640 ? 2 : 3)
    prints.forEach((print, index) => {
      expect(print.left).toBeGreaterThanOrEqual(0)
      expect(print.top).toBeGreaterThanOrEqual(0)
      expect(print.left + print.width).toBeLessThanOrEqual(width)
      expect(print.top + print.height).toBeLessThan(height - 24)
      prints.slice(index + 1).forEach(other => {
        expect(rectanglesOverlap(
          { ...print, right: print.left + print.width, bottom: print.top + print.height },
          { ...other, right: other.left + other.width, bottom: other.top + other.height }
        )).toBe(false)
      })
    })
  })

  it('handles missing or invalid ratios without non-finite geometry', () => {
    layoutMapPrints(342, 500, [NaN, -1, Infinity]).forEach(print => {
      expect(Number.isFinite(print.height)).toBe(true)
      expect(Number.isFinite(print.width)).toBe(true)
    })
  })
})
