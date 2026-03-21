import type { GalleryItem } from '~/types/gallery'

const HEIGHT_PATTERNS = [
  ['200px', '280px', '240px', '200px', '320px'],
  ['280px', '200px', '260px', '220px', '300px'],
  ['240px', '240px', '200px', '280px', '240px'],
  ['300px', '220px', '240px', '260px', '200px']
] as const

/**
 * Per-row `grid-template-columns` (two tracks). Inline style — not Tailwind — so ratios
 * always apply (arbitrary `flex-[n]` classes are easy to purge / miss in production).
 */
const ROW_GRID_TEMPLATE_PATTERNS = [
  ['3fr 2fr', '1fr 1fr', '2fr 3fr', '2fr 1fr'],
  ['1fr 1fr', '1fr 2fr', '3fr 2fr', '1fr 1fr'],
  ['2fr 1fr', '2fr 3fr', '1fr 1fr', '3fr 2fr']
] as const

/**
 * Photography desktop layout: two images per row.
 */
export function getImageRows (images: GalleryItem[]): GalleryItem[][] {
  const rows: GalleryItem[][] = []
  for (let i = 0; i < images.length; i += 2) {
    rows.push(images.slice(i, i + 2))
  }
  return rows
}

/**
 * Row height for desktop photography grid (varies by group + row).
 */
export function getRowHeight (rowIndex: number, groupIndex: number): string {
  const patternIndex = groupIndex % HEIGHT_PATTERNS.length
  const pattern = HEIGHT_PATTERNS[patternIndex]
  return pattern[rowIndex % pattern.length]
}

/**
 * Two-column track template for one row (use with CSS Grid + `gap`).
 */
export function getRowGridTemplateColumns (rowIndex: number, groupIndex: number): string {
  const patternIndex = groupIndex % ROW_GRID_TEMPLATE_PATTERNS.length
  const pattern = ROW_GRID_TEMPLATE_PATTERNS[patternIndex]
  return pattern[rowIndex % pattern.length]
}

export function useGalleryPhotographyLayout () {
  return {
    getImageRows,
    getRowHeight,
    getRowGridTemplateColumns
  }
}
