import { describe, expect, it } from 'vitest'
import {
  calcRadialXY,
  computeRadialVisibleWindow,
  lerp,
  easeOutQuad
} from './radialNavigation'

describe('calcRadialXY', () => {
  it('returns fixed top position when total is 1', () => {
    expect(calcRadialXY(0, 0, 1)).toEqual({ x: 0, y: -140 })
  })

  it('middle order sits directly below (angle=270°)', () => {
    // total=3, angleRange=150, startAngle=195°, step=75°
    //   order=0 → 195°, order=1 → 270°（正下方）, order=2 → 345°
    const mid = calcRadialXY(1, 0, 3)
    expect(mid.x).toBeCloseTo(0, 5)
    expect(mid.y).toBeCloseTo(80, 5) // sin(270°) = -1 → y = -(-1)*80 = 80
  })

  it('symmetric orders mirror on x axis around 270°', () => {
    // order=0 (195°) 和 order=2 (345°) 相對 270° 對稱：x 互為正負，y 相同。
    const left = calcRadialXY(0, 0, 3) // order=0
    const right = calcRadialXY(2, 0, 3) // order=2
    expect(left.x).toBeCloseTo(-right.x, 5)
    expect(left.y).toBeCloseTo(right.y, 5)
  })

  it('picks different radii per visible count bucket', () => {
    // 3 張: radius=80；7 張: radius=140。取 order=0（startAngle）處的距離當 radius。
    const p3 = calcRadialXY(0, 0, 3)
    const p7 = calcRadialXY(0, 0, 7)
    const r3 = Math.hypot(p3.x, p3.y)
    const r7 = Math.hypot(p7.x, p7.y)
    expect(r3).toBeCloseTo(80, 3)
    expect(r7).toBeCloseTo(140, 3)
  })

  it('switches to >7 bucket radius', () => {
    const p = calcRadialXY(0, 0, 9)
    const r = Math.hypot(p.x, p.y)
    expect(r).toBeCloseTo(160, 3)
  })
})

describe('computeRadialVisibleWindow', () => {
  it('returns [0, total-1] when total <= maxVisible', () => {
    expect(computeRadialVisibleWindow(5, 2, 7)).toEqual({ start: 0, end: 4 })
    expect(computeRadialVisibleWindow(7, 6, 7)).toEqual({ start: 0, end: 6 })
  })

  it('centers the window on currentIndex when in middle', () => {
    expect(computeRadialVisibleWindow(20, 10, 7)).toEqual({ start: 7, end: 13 })
  })

  it('clamps window at the start without shrinking', () => {
    expect(computeRadialVisibleWindow(20, 0, 7)).toEqual({ start: 0, end: 6 })
    expect(computeRadialVisibleWindow(20, 2, 7)).toEqual({ start: 0, end: 6 })
  })

  it('clamps window at the end without shrinking', () => {
    expect(computeRadialVisibleWindow(20, 19, 7)).toEqual({ start: 13, end: 19 })
    expect(computeRadialVisibleWindow(20, 18, 7)).toEqual({ start: 13, end: 19 })
  })

  it('handles empty album gracefully', () => {
    expect(computeRadialVisibleWindow(0, 0, 7)).toEqual({ start: 0, end: 0 })
  })
})

describe('lerp / easeOutQuad', () => {
  it('lerp interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.25)).toBeCloseTo(2.5)
  })

  it('easeOutQuad eases toward 1', () => {
    expect(easeOutQuad(0)).toBe(0)
    expect(easeOutQuad(1)).toBe(1)
    // 0.5 的 easeOutQuad 應該大於 0.5（尾段放慢 → 前段較快）
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5)
  })
})
