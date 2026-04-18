import { describe, expect, it } from 'vitest'
import {
  buildThumbPath,
  encodePublicUrlPath,
  toThumbRelativePath,
  toThumbRelativeWebp
} from './imagePaths'

describe('toThumbRelativePath / toThumbRelativeWebp', () => {
  it('strips extension and appends webp by default', () => {
    expect(toThumbRelativePath('gallery/foo.jpg')).toBe('gallery/foo.webp')
    expect(toThumbRelativeWebp('/gallery/foo.JPEG')).toBe('gallery/foo.webp')
  })

  it('supports avif format', () => {
    expect(toThumbRelativePath('gallery/foo.jpg', 'avif')).toBe('gallery/foo.avif')
    expect(toThumbRelativePath('/photography/x/y.png', 'avif')).toBe('photography/x/y.avif')
  })
})

describe('encodePublicUrlPath', () => {
  it('replaces spaces only so srcset parses; leaves CJK segments unencoded', () => {
    const raw = '/young-portfolio/images/_thumbs/400w/photography/攝影社 米倉團拍/DSC_1.webp'
    const out = encodePublicUrlPath(raw)
    expect(out).not.toContain(' ')
    expect(out).toContain('%20')
    expect(out).toContain('攝影社')
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
  it('emits avif path when format=avif', () => {
    expect(buildThumbPath('a/b.png', 800, '/young-portfolio/', 'avif')).toBe(
      '/young-portfolio/images/_thumbs/800w/a/b.avif'
    )
  })
})
