import { watch, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

/**
 * Gallery：事件篩選與路徑 `/gallery/<category>/<event>` 雙向同步（攝影／數位）。
 *
 * 改用路徑（非 query）的動機：
 * - 每個 event 在 SSG 時可獨立預渲染為一份 HTML，社群爬蟲（OG / Twitter Card）抓得到 hero 圖。
 * - URL 更語意化、可直接被 sitemap 列舉。
 * - 與 `?image=` query 並存（image 是檢視器狀態，不該變成獨立頁面）。
 */
export function useGalleryEventRoute () {
  const route = useRoute()
  const router = useRouter()
  const galleryStore = useGalleryStore()
  const {
    filterState,
    availableEvents,
    isLoading,
    galleryDataReady
  } = storeToRefs(galleryStore)
  const { setSelectedEvent } = galleryStore

  const syncingFromRoute = ref(false)

  /** 取出已 decode 的事件名（path 進來時 vue-router 會自動 decodeURIComponent，但保險起見再 decode 一次以容錯）。 */
  function readEventParam (): string | null {
    const raw = route.params.event
    const v = Array.isArray(raw) ? raw[0] : raw
    if (!v || typeof v !== 'string') return null
    try { return decodeURIComponent(v) } catch { return v }
  }

  function eventNamesForCurrentCategory (): Set<string> {
    return new Set(availableEvents.value.map(e => e.name))
  }

  function applyEventFromRoute () {
    if (!import.meta.client) return
    if (isLoading.value) return

    const cat = filterState.value.selectedCategory
    const pathEvent = readEventParam()

    // 2026-05-09：移除 'all' 後僅 'photography' / 'digital' 兩類；narrow 一下避免 type drift
    if (cat !== 'photography' && cat !== 'digital') return

    // 必須等 hydrate / loadAllWorks 完成，否則 availableEvents 仍空，會誤把合法 event redirect 掉。
    if (!galleryDataReady.value) return

    if (pathEvent === null) {
      if (filterState.value.selectedEvent !== null) {
        syncingFromRoute.value = true
        setSelectedEvent(null)
        nextTick(() => { syncingFromRoute.value = false })
      }
      return
    }

    const valid = eventNamesForCurrentCategory()
    if (!valid.has(pathEvent)) {
      router.replace({ path: `/gallery/${cat}`, query: route.query })
      if (filterState.value.selectedEvent !== null) {
        syncingFromRoute.value = true
        setSelectedEvent(null)
        nextTick(() => { syncingFromRoute.value = false })
      }
      return
    }

    if (filterState.value.selectedEvent === pathEvent) return

    syncingFromRoute.value = true
    setSelectedEvent(pathEvent)
    nextTick(() => { syncingFromRoute.value = false })
  }

  watch(
    [
      () => route.params.event,
      isLoading,
      availableEvents,
      () => filterState.value.selectedCategory,
      galleryDataReady
    ],
    applyEventFromRoute,
    { immediate: true }
  )

  // 2026-05-09：移除「切到 all 時卸 event」watcher；'all' 已不存在，類別切換時的 event
  // 同步由 setSelectedEvent / store → URL watcher 自然處理。

  // store → URL：使用者點 EventFilter 時 setSelectedEvent 觸發；同步把 path 段補上 / 撤掉。
  watch(
    () => filterState.value.selectedEvent,
    (ev) => {
      if (!import.meta.client) return
      if (syncingFromRoute.value) return

      const cat = filterState.value.selectedCategory
      if (cat !== 'photography' && cat !== 'digital') return

      const current = readEventParam()

      if (ev === null) {
        if (current !== null) {
          router.replace({ path: `/gallery/${cat}`, query: route.query })
        }
        return
      }

      if (current !== ev) {
        router.replace({ path: `/gallery/${cat}/${encodeURIComponent(ev)}`, query: route.query })
      }
    }
  )
}
