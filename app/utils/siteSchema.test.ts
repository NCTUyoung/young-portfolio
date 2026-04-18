import { describe, it, expect } from 'vitest'
import {
  buildPersonSchema,
  buildWebSiteSchema,
  toHeadScripts,
  type SiteIdentity
} from '~/utils/siteSchema'

const identity: SiteIdentity = {
  siteUrl: 'https://nctuyoung.github.io/young-portfolio/',
  siteName: 'NCTU Young Portfolio',
  siteDescription: 'Digital art & photography portfolio',
  personName: 'NCTU Young',
  personAlternateName: 'jimmyyoung1995',
  personJobTitle: 'Digital Painter · Photographer',
  personDescription: '電繪與攝影',
  personImage: 'https://nctuyoung.github.io/young-portfolio/images/og-image.jpg',
  socialLinks: [
    'https://github.com/NCTUyoung',
    'https://www.instagram.com/jimmyyoung1995/',
    'mailto:nctuyoung@gmail.com' // should be filtered (non-http)
  ],
  knowsAbout: ['Digital Painting', 'Photography']
}

describe('buildPersonSchema', () => {
  it('emits Person with @context/@type and filters non-http sameAs', () => {
    const p = buildPersonSchema(identity)
    expect(p['@context']).toBe('https://schema.org')
    expect(p['@type']).toBe('Person')
    expect(p.name).toBe('NCTU Young')
    expect(p.sameAs).toEqual([
      'https://github.com/NCTUyoung',
      'https://www.instagram.com/jimmyyoung1995/'
    ])
    expect(p.knowsAbout).toEqual(['Digital Painting', 'Photography'])
  })
})

describe('buildWebSiteSchema', () => {
  it('emits WebSite with inLanguage default zh-Hant and author pointer', () => {
    const w = buildWebSiteSchema(identity)
    expect(w['@type']).toBe('WebSite')
    expect(w.name).toBe('NCTU Young Portfolio')
    expect(w.inLanguage).toBe('zh-Hant')
    expect(w.author.name).toBe('NCTU Young')
  })
})

describe('toHeadScripts', () => {
  it('wraps schemas as application/ld+json script records', () => {
    const scripts = toHeadScripts([
      buildPersonSchema(identity),
      buildWebSiteSchema(identity)
    ])
    expect(scripts).toHaveLength(2)
    expect(scripts[0]!.type).toBe('application/ld+json')
    const parsed = JSON.parse(scripts[0]!.innerHTML)
    expect(parsed['@type']).toBe('Person')
  })
})
