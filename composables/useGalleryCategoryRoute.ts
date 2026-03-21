import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

export const GALLERY_VALID_CATEGORIES = ['all', 'digital', 'photography'] as const
export type GalleryValidCategory = (typeof GALLERY_VALID_CATEGORIES)[number]

export function isGalleryValidCategory (s: string): s is GalleryValidCategory {
  return (GALLERY_VALID_CATEGORIES as readonly string[]).includes(s)
}

function paramToCategory (raw: string | string[] | undefined): string | undefined {
  if (raw === undefined || raw === '') return undefined
  return Array.isArray(raw) ? raw[0] : raw
}

/**
 * Sync Pinia `selectedCategory` with `/gallery/:category` (URL is source of truth).
 */
export function useGalleryCategoryRoute () {
  const route = useRoute()
  const router = useRouter()
  const galleryStore = useGalleryStore()
  const { filterState } = storeToRefs(galleryStore)

  function syncCategoryFromRoute () {
    const cat = paramToCategory(route.params.category)

    if (cat === undefined) {
      const next = filterState.value.selectedCategory
      if (import.meta.client) {
        router.replace({ path: `/gallery/${next}` })
      }
      return
    }

    if (!isGalleryValidCategory(cat)) {
      navigateTo({ path: '/gallery/all', replace: true })
      return
    }

    galleryStore.setSelectedCategory(cat)
  }

  watch(() => route.params.category, () => {
    syncCategoryFromRoute()
  }, { immediate: true })

  return { syncCategoryFromRoute }
}
