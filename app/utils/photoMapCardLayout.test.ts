import { describe, expect, it } from 'vitest'
import { cardEdge, rectanglesOverlap } from './photoMapCardLayout'

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
})
