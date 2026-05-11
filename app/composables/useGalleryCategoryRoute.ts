import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

/**
 * 2026-05-09：移除 'all'（mixed feed 與雙主線敘事不同質）。
 * 預設落點 'photography'；舊 /gallery/all path 在此 redirect 維持向後相容。
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
 *   - cat undefined  → /gallery 落點：replace 到 /gallery/<store 預設>
 *   - cat === 'all'  → 舊路徑相容：replace 到 /gallery/photography
 *   - cat 為合法值   → 同步到 store
 *   - cat 為非法值   → replace 到 /gallery/photography（避免 404 連鎖）
 */
export function useGalleryCategoryRoute () {
  const route = useRoute()
  const router = useRouter()
  const galleryStore = useGalleryStore()
  const { filterState } = storeToRefs(galleryStore)

  function syncCategoryFromRoute () {
    const cat = paramToCategory(route.params.category)

    if (cat === undefined) {
      if (import.meta.client) {
        router.replace({ path: `/gallery/${filterState.value.selectedCategory}` })
      }
      return
    }

    // 舊 /gallery/all 連結相容：靜默 redirect 到 photography
    if (cat === 'all') {
      navigateTo({ path: `/gallery/${GALLERY_DEFAULT_CATEGORY}`, replace: true })
      return
    }

    if (!isGalleryValidCategory(cat)) {
      navigateTo({ path: `/gallery/${GALLERY_DEFAULT_CATEGORY}`, replace: true })
      return
    }

    galleryStore.setSelectedCategory(cat)
  }

  watch(() => route.params.category, () => {
    syncCategoryFromRoute()
  }, { immediate: true })

  return { syncCategoryFromRoute }
}
