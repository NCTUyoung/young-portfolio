import { SEO_CONFIG } from '../config/constants'

/** The static host redirects document routes to their trailing-slash URL. */
export function sitePageUrl (path: string, search = ''): string {
  const site = new URL(SEO_CONFIG.siteUrl)
  const segments = path.split('/').filter(Boolean).map(segment => {
    try {
      return encodeURIComponent(decodeURIComponent(segment))
    } catch {
      return encodeURIComponent(segment)
    }
  })
  if (segments.length) {
    const last = segments[segments.length - 1] ?? ''
    const document = last === 'index.html'
    site.pathname += segments.join('/') + (document ? '' : '/')
  }
  site.search = search
  return site.href
}
