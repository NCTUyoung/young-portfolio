import { describe, expect, it } from 'vitest'
import { layoutPhotoMapCircles, type PhotoMapPoint, type PhotoMapReservedRect } from './photoMapCircleLayout'

function expectValidLayout (
  points: PhotoMapPoint[], width: number, height: number,
  options: { inset?: boolean, reserved?: PhotoMapReservedRect[] } = {}
) {
  const layout = layoutPhotoMapCircles(points, width, height, options)
  expect(layout.map(circle => circle.name)).toEqual(points.map(point => point.name))
  for (const [index, circle] of layout.entries()) {
    const radius = circle.diameter / 2
    expect([circle.x, circle.y, circle.diameter, circle.anchorX, circle.anchorY].every(Number.isFinite)).toBe(true)
    expect(circle.x - radius).toBeGreaterThanOrEqual(0)
    expect(circle.x + radius).toBeLessThanOrEqual(width)
    expect(circle.y - radius).toBeGreaterThanOrEqual(0)
    expect(circle.y + radius).toBeLessThanOrEqual(height)
    for (const other of layout.slice(index + 1)) {
      expect(Math.hypot(circle.x - other.x, circle.y - other.y)).toBeGreaterThanOrEqual(radius + other.diameter / 2 + 4 - .001)
    }
    for (const rect of options.reserved ?? []) {
      const nearX = Math.max(rect.left, Math.min(circle.x, rect.right))
      const nearY = Math.max(rect.top, Math.min(circle.y, rect.bottom))
      expect(Math.hypot(circle.x - nearX, circle.y - nearY)).toBeGreaterThanOrEqual(radius + 1.999)
    }
  }
  return layout
}

const denseEvents = Array.from({ length: 12 }, (_, index) => ({
  name: `event-${index}`,
  x: 320 + (index % 4) * 8,
  y: 255 + Math.floor(index / 4) * 9,
  selected: index === 0
}))

describe('photo map circle fan layout', () => {
  it.each([[1168, 600], [720, 600], [342, 500], [288, 500]])('keeps 12 nearby activities independently visible at %ipx', (width, height) => {
    const centerX = width * .5
    const points = denseEvents.map(point => ({ ...point, x: centerX + point.x - 320 }))
    const reserved = [width < 640
      ? { left: width - 144, top: 0, right: width, bottom: 170 }
      : { left: width - 220, top: 0, right: width, bottom: 220 }]
    expectValidLayout(points, width, height, { reserved })
  })

  it('fans two events at the same location apart inside a small inset', () => {
    const points = [{ name: 'Tokyo A', x: 63, y: 70, selected: true }, { name: 'Tokyo B', x: 63, y: 70 }]
    const layout = expectValidLayout(points, 126, 142, { inset: true })
    expect(layout[0]!.diameter).toBe(52)
    expect(layout[1]!.diameter).toBe(44)
    expect(layout[0]!.anchorX).toBe(layout[1]!.anchorX)
    expect(layout[0]!.x).not.toBe(layout[1]!.x)
  })

  it('keeps a single photo near its true location and preserves outside anchors', () => {
    const single = expectValidLayout([{ name: 'single', x: 160, y: 200 }], 342, 500)
    expect(single[0]!.x).toBeCloseTo(160)
    expect(single[0]!.y).toBeCloseTo(200)
    const outside = expectValidLayout([{ name: 'outside', x: -50, y: 240 }], 342, 500)
    expect(outside[0]!.anchorX).toBe(-50)
    expect(outside[0]!.anchorVisible).toBe(false)
  })

  it('handles invalid projected points without non-finite geometry', () => {
    const layout = expectValidLayout([{ name: 'invalid', x: NaN, y: Infinity }], 342, 500)
    expect(layout[0]!.anchorVisible).toBe(false)
  })

  it('places distant projected locations along the visible edge while retaining their anchors', () => {
    const points = Array.from({ length: 12 }, (_, index) => ({
      name: `remote-${index}`,
      x: -1_000_000 + index * 3,
      y: 1_000_000 + index * 2
    }))
    const layout = expectValidLayout(points, 342, 500)
    expect(layout.every(circle => !circle.anchorVisible)).toBe(true)
    expect(layout[0]!.anchorX).toBe(-1_000_000)
    expect(layout[0]!.anchorY).toBe(1_000_000)
  })
})
