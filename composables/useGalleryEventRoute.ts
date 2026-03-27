import { watch, ref, nextTick } from 'vue'
import type { LocationQuery } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

function stripEventQuery (q: LocationQuery): LocationQuery {
  const next = { ...q }
  delete next.event
  return next
}

/**
 * Gallery：事件篩選與 `?event=<名稱>` 雙向同步（攝影／數位分類）。
 * - 分享連結：`/gallery/photography?event=WBC%202026`（名稱與 JSON `event.name` 完全一致，已編碼）。
 * - 與 `?image=` 可並存。
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

  function eventNamesForCurrentCategory (): Set<string> {
    return new Set(availableEvents.value.map(e => e.name))
  }

  function applyEventFromQuery () {
    if (!import.meta.client) return
    if (isLoading.value) return

    const cat = filterState.value.selectedCategory
    if (cat === 'all') {
      if (route.query.event !== undefined) {
        router.replace({ query: stripEventQuery(route.query) })
      }
      return
    }

    if (cat !== 'photography' && cat !== 'digital') return

    // 必須等 hydrate / loadAllWorks 完成，否則 availableEvents 仍為空，會誤清 ?event=（與 useAsyncData 的競態）
    if (!galleryDataReady.value) return

    const raw = route.query.event
    const q = Array.isArray(raw) ? raw[0] : raw

    if (q === undefined || q === '') {
      return
    }

    if (typeof q !== 'string') return

    const decoded = decodeURIComponent(q)
    const valid = eventNamesForCurrentCategory()

    if (!valid.has(decoded)) {
      router.replace({ query: stripEventQuery(route.query) })
      if (filterState.value.selectedEvent !== null) {
        syncingFromRoute.value = true
        setSelectedEvent(null)
        nextTick(() => { syncingFromRoute.value = false })
      }
      return
    }

    if (filterState.value.selectedEvent === decoded) return

    syncingFromRoute.value = true
    setSelectedEvent(decoded)
    nextTick(() => { syncingFromRoute.value = false })
  }

  watch(
    [
      () => route.query.event,
      isLoading,
      availableEvents,
      () => filterState.value.selectedCategory,
      galleryDataReady
    ],
    applyEventFromQuery,
    { immediate: true }
  )

  watch(
    () => filterState.value.selectedCategory,
    (cat) => {
      if (!import.meta.client) return
      if (cat === 'all' && route.query.event !== undefined) {
        router.replace({ query: stripEventQuery(route.query) })
      }
    }
  )

  watch(
    () => filterState.value.selectedEvent,
    (ev) => {
      if (!import.meta.client) return
      if (syncingFromRoute.value) return

      const cat = filterState.value.selectedCategory
      if (cat !== 'photography' && cat !== 'digital') return

      const raw = route.query.event
      const current = Array.isArray(raw) ? raw[0] : raw

      if (ev === null) {
        if (current !== undefined) {
          router.replace({ query: stripEventQuery(route.query) })
        }
        return
      }

      if (current !== ev) {
        router.replace({ query: { ...route.query, event: ev } })
      }
    }
  )
}
