import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import type { GalleryItem } from '~/types/gallery'

/**
 * 圖片庫頁面：檢視器與網址 `?image=<id>` 雙向同步。
 * - 開啟／切換圖片時更新 query，便於分享與重新整理還原。
 * - 帶 `?image=` 進入時，待作品載入後開啟檢視器（導覽列表為 `allWorks`）。
 */
export function useGalleryImageRoute () {
  const route = useRoute()
  const router = useRouter()
  const galleryStore = useGalleryStore()
  const imageViewerStore = useImageViewerStore()

  const { allWorks, isLoading } = storeToRefs(galleryStore)
  const { isOpen: viewerOpen, currentViewerImage } = storeToRefs(imageViewerStore)

  function syncViewerQueryFromStore () {
    if (!import.meta.client) return
    if (viewerOpen.value && currentViewerImage.value) {
      const id = currentViewerImage.value.id
      if (route.query.image !== id) {
        router.replace({ query: { ...route.query, image: id } })
      }
    } else if (!viewerOpen.value && route.query.image !== undefined) {
      const next = { ...route.query } as Record<string, string | string[] | undefined>
      delete next.image
      router.replace({ query: next })
    }
  }

  watch([viewerOpen, currentViewerImage], syncViewerQueryFromStore)

  function tryOpenViewerFromQuery () {
    if (!import.meta.client) return
    const raw = route.query.image
    const id = Array.isArray(raw) ? raw[0] : raw
    if (!id || typeof id !== 'string') return
    if (isLoading.value || !allWorks.value.length) return
    if (viewerOpen.value) return
    const found = allWorks.value.find((img: GalleryItem) => img.id === id)
    if (found) {
      imageViewerStore.openImageViewer(found, allWorks.value)
    }
  }

  watch([() => route.query.image, isLoading, allWorks], tryOpenViewerFromQuery, { immediate: true })
}
