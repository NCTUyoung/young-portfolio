import { watch } from 'vue'
import { useGalleryStore } from '~/stores/gallery'

/**
 * 2026-05-09：移除 'all'（mixed feed 與雙主線敘事不同質）。
 * 舊 /gallery/all path 在此 redirect 維持向後相容。
 */
export const GALLERY_VALID_CATEGORIES = ['digital', 'photography'] as const
export type GalleryValidCategory = (typeof GALLERY_VALID_CATEGORIES)[number]

const GALLERY_DEFAULT_CATEGORY: GalleryValidCategory = 'photography'

export function isGalleryValidCategory (s: string): s is GalleryValidCategory {
  return (GALLERY_VALID_CATEGORIES as readonly string[]).includes(s)
}

function paramToCategory (raw: string | string[] | undefined): string | undefined {
  if (raw === undefined || raw === '') return undefined
  return Array.isArray(raw) ? raw[0] : raw
}

/**
 * Sync Pinia `selectedCategory` with `/gallery/:category` (URL is source of truth).
 *
 * 三條路徑：
 *   - /gallery        → 獨立雙館索引，不改寫已存分類
 *   - cat === 'all'  → 舊路徑相容：replace 到 /gallery/photography
 *   - cat 為合法值   → 同步到 store
 *   - cat 為非法值   → replace 到 /gallery/photography（避免 404 連鎖）
 */
export function useGalleryCategoryRoute () {
  const route = useRoute()
  const galleryStore = useGalleryStore()
  function syncCategoryFromRoute () {
    // 舊頁面在離場時可能尚未卸載；不得把獨立索引或其他頁導回分類。
    if (!route.path.startsWith('/gallery/')) return
    const cat = paramToCategory(route.params.category)
    if (cat === undefined) return

    // 舊分類連結相容；圖片 ID 若已知分類，交給對應 viewer 處理。
    if (cat === 'all' || !isGalleryValidCategory(cat)) {
      const image = Array.isArray(route.query.image) ? route.query.image[0] : route.query.image
      const imageCategory = typeof image === 'string' && image.startsWith('digital-')
        ? 'digital'
        : typeof image === 'string' && image.startsWith('photography-')
          ? 'photography'
          : GALLERY_DEFAULT_CATEGORY
      void navigateTo({ path: `/gallery/${imageCategory}`, query: route.query, hash: route.hash }, { replace: true })
      return
    }

    galleryStore.setSelectedCategory(cat)
  }

  watch(() => route.params.category, () => {
    syncCategoryFromRoute()
  }, { immediate: true })

  return { syncCategoryFromRoute }
}
