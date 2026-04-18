/**
 * 站台層級的 JSON-LD schema 產生器。
 *
 * 目的：
 * - 給 Google / 其他搜尋引擎 knowledge graph 吃：誰是作者、站是誰。
 * - 首頁塞 `Person` + `WebSite`，其他頁只補頁面層級（`ImageGallery`、`ImageObject`）。
 *
 * 原則：
 * - 欄位全部可序列化成 JSON，沒有任何 Vue ref / composable 相依。
 * - 可在 SSR 與單元測試裡直接呼叫（不依賴 `useRuntimeConfig`）。
 */

export type PersonSchema = {
  '@context': 'https://schema.org'
  '@type': 'Person'
  name: string
  alternateName?: string
  url: string
  image?: string
  jobTitle?: string
  description?: string
  sameAs: string[]
  knowsAbout?: string[]
}

export type WebSiteSchema = {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  alternateName?: string
  url: string
  description?: string
  inLanguage?: string
  author: { '@type': 'Person', name: string, url: string }
}

export interface SiteIdentity {
  siteUrl: string
  siteName: string
  siteDescription?: string
  personName: string
  personAlternateName?: string
  personJobTitle?: string
  personDescription?: string
  personImage?: string
  socialLinks: string[]
  knowsAbout?: string[]
  inLanguage?: string
}

export function buildPersonSchema (id: SiteIdentity): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: id.personName,
    alternateName: id.personAlternateName,
    url: id.siteUrl,
    image: id.personImage,
    jobTitle: id.personJobTitle,
    description: id.personDescription,
    sameAs: id.socialLinks.filter(u => /^https?:\/\//i.test(u)),
    knowsAbout: id.knowsAbout
  }
}

export function buildWebSiteSchema (id: SiteIdentity): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: id.siteName,
    alternateName: id.personAlternateName,
    url: id.siteUrl,
    description: id.siteDescription,
    inLanguage: id.inLanguage ?? 'zh-Hant',
    author: {
      '@type': 'Person',
      name: id.personName,
      url: id.siteUrl
    }
  }
}

/**
 * 以 `<script type="application/ld+json">` 形式塞進 `useHead({ script })`。
 * 多條 schema 用一個 array 輸出；Google 允許單頁多個 JSON-LD block。
 */
export function toHeadScripts (
  schemas: Array<Record<string, unknown>>
): Array<{ type: 'application/ld+json', innerHTML: string }> {
  return schemas.map(s => ({
    type: 'application/ld+json' as const,
    innerHTML: JSON.stringify(s)
  }))
}
