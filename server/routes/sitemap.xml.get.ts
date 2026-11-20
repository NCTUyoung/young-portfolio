import digital from '../../public/galleryList.json'
import photography from '../../public/photographyList.json'
import { galleryEventPaths } from '../../shared/utils/galleryEventPaths'
import { sitePageUrl } from '../../shared/utils/sitePageUrl'

const pages = [
  '/',
  '/gallery/digital',
  '/gallery/photography',
  '/article',
  '/article/design-thinking',
  '/article/gear-119mm',
  '/exhibition/light',
  '/painted-worlds/index.html',
  ...galleryEventPaths(digital, 'digital'),
  ...galleryEventPaths(photography, 'photography')
]

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(path => `  <url><loc>${sitePageUrl(path)}</loc></url>`),
    '</urlset>'
  ].join('\n')
})
