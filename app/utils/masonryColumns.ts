import type { GalleryItem } from '~~/shared/types/gallery'
import { DEFAULT_ASPECT_RATIO } from './justifiedGalleryLayout'

/**
 * 欄式瀑布流（Pinterest-style column masonry）— 純函式、零 DOM 相依。
 *
 * 與 [`computeJustifiedRows`](./justifiedGalleryLayout.ts)（row-fill：每行等高、寬度依比例）
 * 互補：此處是 column-balanced（每格保留原縱橫比、依「目前最矮欄」貪婪填入），給接觸印樣
 * 事件頁那種「錯落但乾淨」的瀑布版面。比例由 caller 傳入（優先吃 JSON 預算的
 * `image.aspectRatio`），故 server / client 結果一致、可 SSG。
 *
 * 高度以「單位欄寬下的相對高 = 1/ratio」累加；不需真實 px，只為決定哪一欄最矮。
 * 同高時取最左欄（穩定、可決定，避免 hydration 不一致）。
 */
export interface MasonryColumn {
  items: GalleryItem[]
  /** 累積相對高度（Σ 1/ratio）；僅用於平衡判斷與測試斷言，非像素值。 */
  height: number
}

export function computeMasonryColumns (
  images: GalleryItem[],
  ratioOf: (filename: string) => number,
  columnCount: number
): MasonryColumn[] {
  const cols = Math.max(1, Math.floor(columnCount))
  const columns: MasonryColumn[] = Array.from({ length: cols }, () => ({ items: [], height: 0 }))
  if (!images.length) return columns

  // 比例下限 0.25（1:4）：超直幅照片若不夾，單格高度會吃掉整欄、破壞平衡（同 justified 的處理）。
  const r = (f: string) => Math.max(0.25, ratioOf(f) || DEFAULT_ASPECT_RATIO)

  for (const img of images) {
    const cellH = 1 / r(img.filename)
    let target = 0
    for (let c = 1; c < cols; c++) {
      // 嚴格小於 → 平手取最左欄（穩定）
      if (columns[c]!.height < columns[target]!.height - 1e-9) target = c
    }
    columns[target]!.items.push(img)
    columns[target]!.height += cellH
  }
  return columns
}
