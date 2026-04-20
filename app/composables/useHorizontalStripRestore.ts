/**
 * `useHorizontalStripRestore`
 *
 * Horizontal featured strip 專用的 scroll restoration。
 *
 * 使用情境：
 *   - 使用者點 strip 中某張圖 → ImageViewer 開啟 → 關閉 viewer 時，該張原位需回到可視中央
 *   - 深連結 `/gallery/photography?image=foo` 命中 strip 內項目 → viewer 首次關閉時捲回原位
 *
 * 為什麼獨立一個 composable：
 *   - `useGalleryImageRoute` 負責 URL ⇔ viewer 雙向同步，已是單一責任；不能再塞 DOM 操作
 *   - Strip 是 photography 頁的局部元件，restore 只影響 strip 自己；把邏輯留在 strip 範圍避免擴散
 *   - 未來若首頁 Hero 替換為 strip（Phase 3），首頁也能直接複用這個 composable
 *
 * 關鍵參數（已吸收 critic 提醒）：
 *   - `inline: 'center'` 讓目標圖回到水平中央
 *   - `block: 'nearest'` ← 不可省略，否則預設 `'start'` 會連**垂直**軸也被拉動，誤觸 page scroll
 *   - `behavior: 'smooth'`：相容 `prefers-reduced-motion` 由瀏覽器層處理（CSS 已設 `scroll-behavior`）
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'

export function useHorizontalStripRestore () {
  const imageViewerStore = useImageViewerStore()
  const { isOpen, currentViewerImage } = storeToRefs(imageViewerStore)

  const elMap = ref<Record<string, HTMLElement | null>>({})
  let lastViewerFilename: string | null = null

  function registerImage (filename: string, el: HTMLElement | null) {
    elMap.value[filename] = el
  }

  function unregisterImage (filename: string) {
    if (elMap.value[filename]) {
      elMap.value = { ...elMap.value, [filename]: null }
    }
  }

  const stopViewerTrack = watch(currentViewerImage, (img) => {
    if (img?.filename) {
      lastViewerFilename = img.filename
    }
  })

  const stopOpenWatch = watch(isOpen, (open, prev) => {
    if (prev && !open && lastViewerFilename) {
      const el = elMap.value[lastViewerFilename]
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
      }
      lastViewerFilename = null
    }
  })

  onBeforeUnmount(() => {
    stopViewerTrack()
    stopOpenWatch()
  })

  return {
    registerImage,
    unregisterImage
  }
}
