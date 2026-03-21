import { describe, expect, it } from 'vitest'
import { buildThumbPath, toThumbRelativeWebp } from './imagePaths'

describe('toThumbRelativeWebp', () => {
  it('strips extension and appends webp', () => {
    expect(toThumbRelativeWebp('gallery/foo.jpg')).toBe('gallery/foo.webp')
    expect(toThumbRelativeWebp('/gallery/foo.JPEG')).toBe('gallery/foo.webp')
  })
})

describe('buildThumbPath', () => {
  it('includes base and thumb folder', () => {
    expect(buildThumbPath('a/b.png', 800, '/young-portfolio/')).toBe(
      '/young-portfolio/images/_thumbs/800w/a/b.webp'
    )
  })
  it('works with empty base (dev)', () => {
    expect(buildThumbPath('x.jpg', 400, '')).toBe('images/_thumbs/400w/x.webp')
  })
})
