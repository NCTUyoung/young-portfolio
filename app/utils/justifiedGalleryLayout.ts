import type { GalleryItem } from '~~/shared/types/gallery'

/** Used until natural dimensions are known */
export const DEFAULT_ASPECT_RATIO = 1.5

export interface JustifiedRow {
  height: number
  items: GalleryItem[]
  /** Pixel width for each item (same order as items) */
  widths: number[]
}

/**
 * Google-Images / Flickr style justified rows: same row height, widths from aspect ratios,
 * row fills `containerWidth` (last/single row may be shorter if height is clamped).
 */
export function computeJustifiedRows (
  images: GalleryItem[],
  ratioOf: (filename: string) => number,
  containerWidth: number,
  gapPx: number,
  idealRowHeight: number,
  options?: {
    singleRowMaxHeight?: number
    singleRowMinHeight?: number
  }
): JustifiedRow[] {
  const maxSingleH = options?.singleRowMaxHeight ?? 520
  const minSingleH = options?.singleRowMinHeight ?? 120

  if (containerWidth <= 0 || images.length === 0) return []

  const r = (f: string) => Math.max(0.25, ratioOf(f))

  const rows: JustifiedRow[] = []
  let row: GalleryItem[] = []

  const finalize = (items: GalleryItem[]) => {
    if (items.length === 0) return
    const sumR = items.reduce((s, i) => s + r(i.filename), 0)
    let h = (containerWidth - gapPx * (items.length - 1)) / sumR
    if (items.length === 1) {
      h = Math.min(maxSingleH, Math.max(minSingleH, h))
    }
    const rawWidths = items.map(i => r(i.filename) * h)
    const widths = snapRowWidthsToContainer(rawWidths, gapPx, containerWidth)
    rows.push({ height: h, items: [...items], widths })
  }

  for (const img of images) {
    row.push(img)
    const sumR = row.reduce((s, i) => s + r(i.filename), 0)
    const wAtIdeal = idealRowHeight * sumR + gapPx * (row.length - 1)
    if (wAtIdeal > containerWidth && row.length > 1) {
      const last = row.pop()!
      finalize(row)
      row = [last]
    }
  }
  finalize(row)
  return rows
}

/**
 * Floor widths to integer px and assign rounding remainder to the last cell so
 * sum(widths) + gaps never exceeds container (avoids horizontal overflow).
 */
export function snapRowWidthsToContainer (
  rawWidths: number[],
  gapPx: number,
  containerWidth: number
): number[] {
  const n = rawWidths.length
  if (n === 0) return []
  const gaps = gapPx * Math.max(0, n - 1)
  const budget = Math.max(0, Math.floor(containerWidth - gaps))
  const floored = rawWidths.map(w => Math.max(1, Math.floor(w)))
  const sum = floored.reduce((a, b) => a + b, 0)
  const diff = budget - sum
  if (diff !== 0 && n > 0) {
    floored[n - 1] = Math.max(1, (floored[n - 1] ?? 0) + diff)
  }
  return floored
}
