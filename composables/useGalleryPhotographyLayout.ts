import type { GalleryItem } from '~/types/gallery'

const HEIGHT_PATTERNS = [
  ['200px', '280px', '240px', '200px', '320px'],
  ['280px', '200px', '260px', '220px', '300px'],
  ['240px', '240px', '200px', '280px', '240px'],
  ['300px', '220px', '240px', '260px', '200px']
] as const

const WIDTH_PATTERNS = [
  [
    ['w-3/5', 'w-2/5'],
    ['w-1/2', 'w-1/2'],
    ['w-2/5', 'w-3/5'],
    ['w-2/3', 'w-1/3']
  ],
  [
    ['w-1/2', 'w-1/2'],
    ['w-1/3', 'w-2/3'],
    ['w-3/5', 'w-2/5'],
    ['w-1/2', 'w-1/2']
  ],
  [
    ['w-2/3', 'w-1/3'],
    ['w-2/5', 'w-3/5'],
    ['w-1/2', 'w-1/2'],
    ['w-3/5', 'w-2/5']
  ]
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
 * Tailwind width classes for each slot in a row.
 */
export function getImageWidth (imageIndex: number, rowIndex: number, groupIndex: number): string {
  const patternIndex = groupIndex % WIDTH_PATTERNS.length
  const rowPatterns = WIDTH_PATTERNS[patternIndex]
  const rowPattern = rowPatterns[rowIndex % rowPatterns.length]
  return rowPattern[imageIndex] || 'w-1/2'
}

export function useGalleryPhotographyLayout () {
  return {
    getImageRows,
    getRowHeight,
    getImageWidth
  }
}
