import { watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import type { GalleryItem } from '~~/shared/types/gallery'

/**
 * 圖片庫頁面：檢視器與網址 `?image=<id>` 雙向同步。
 * - 開啟／切換圖片時更新 query，便於分享與重新整理還原。
 * - 帶 `?image=` 進入時，待作品載入後開啟檢視器。
 * - **智慧導覽範圍**：若網址同時帶 `?event=<事件>`，viewer 左右切換僅限該事件作品；
 *   否則退回 `allWorks`（跨類別瀏覽）。此設計讓「從事件分享連結進入」的使用者
 *   不會一路左右切換到其他事件，符合分享情境。
 */
export function useGalleryImageRoute () {
  const route = useRoute()
  const router = useRouter()
  const galleryStore = useGalleryStore()
  const imageViewerStore = useImageViewerStore()

  const { allWorks, photographyWorks, digitalWorks, isLoading, galleryDataReady, filterState } = storeToRefs(galleryStore)
  const { isOpen: viewerOpen, currentViewerImage } = storeToRefs(imageViewerStore)

  /** 根據網址 `?event=` 決定 viewer 導覽清單（智慧 scope） */
  const viewerScopeList = computed<GalleryItem[]>(() => {
    const raw = route.query.event
    const q = Array.isArray(raw) ? raw[0] : raw
    if (!q || typeof q !== 'string') return allWorks.value

    const decoded = decodeURIComponent(q)
    const cat = filterState.value.selectedCategory
    // 事件 scope：只取目前分類下屬於該事件的作品；如果分類是 all，兩邊都看
    const pool = cat === 'digital'
      ? digitalWorks.value
      : cat === 'photography'
        ? photographyWorks.value
        : allWorks.value
    const scoped = pool.filter(w => w.event?.name === decoded)
    return scoped.length > 0 ? scoped : allWorks.value
  })

  function clearImageQuery () {
    const next = { ...route.query } as Record<string, string | string[] | undefined>
    delete next.image
    router.replace({ query: next })
  }

  function syncViewerQueryFromStore () {
    if (!import.meta.client) return
    if (viewerOpen.value && currentViewerImage.value) {
      const id = currentViewerImage.value.id
      if (route.query.image !== id) {
        router.replace({ query: { ...route.query, image: id } })
      }
    } else if (!viewerOpen.value && route.query.image !== undefined) {
      clearImageQuery()
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
      const scope = viewerScopeList.value
      // 若 scope 是事件集合卻不包含該圖（？image 不屬於此 event），退回 allWorks
      const list = scope.some(w => w.id === id) ? scope : allWorks.value
      imageViewerStore.openImageViewer(found, list)
      return
    }
    // 資料已全數 ready 卻找不到 id → 屬於過期或誤貼網址，把 query 清掉避免誤導
    if (galleryDataReady.value) {
      clearImageQuery()
    }
  }

  watch([() => route.query.image, isLoading, allWorks, galleryDataReady], tryOpenViewerFromQuery, { immediate: true })
}
