<template>
  <div
    class="gallery-world min-h-screen"
    :data-world="worldId"
  >
    <!-- Fresh Dynamic pilot：同一個 Archive Controls 負責世界識別、分類與篩選狀態。 -->
    <div
      v-if="currentCategory !== 'photography'"
      id="gallery-hall-heading"
      ref="controlsSectionRef"
      class="hall-content scroll-mt-24"
    >
      <GalleryArchiveControls
        ref="archiveControlsRef"
        :world="worldId"
        :count="categoryCount"
        :selected-event="filterState.selectedEvent"
        @open-change="archiveControlsOpen = $event"
      />
    </div>

    <!--
      Sticky mini bar：控制區離開可視區後，收束為一行摘要。
      桌機保留完整頁面呼吸；mini bar 只在 mobile/tablet 顯示。
    -->
    <transition name="mini-bar-fade">
      <div
        v-if="showControlMiniBar"
        class="lg:hidden pointer-events-none fixed inset-x-0 z-[1090] top-[calc(env(safe-area-inset-top,0px)+4rem)]"
        data-testid="gallery-filter-mini-bar"
      >
        <GalleryControlMiniBar
          controls-id="gallery-filter-controls-drawer"
          :category-label="miniCategoryLabel"
          :event-label="miniEventLabel"
          :year-label="miniYearLabel"
          :search-label="miniSearchLabel"
          :expanded="archiveControlsOpen"
          @expand="scrollToControls"
        />
      </div>
    </transition>

    <!-- Gallery Content -->
    <div class="hall-content">
      <!-- Loading State -->
      <div v-if="isGalleryLoading" class="text-center py-28">
        <!-- 日式菱形旋轉動畫 -->
        <div class="inline-flex flex-col items-center gap-6">
          <div class="relative w-10 h-10">
            <div class="absolute inset-0 border border-accent-300/60 dark:border-accent-600/40 rotate-45 animate-spin" style="animation-duration: 2s;"/>
            <div class="absolute inset-[6px] border border-accent-400/40 dark:border-accent-500/30 rotate-45 animate-spin" style="animation-duration: 3s; animation-direction: reverse;"/>
            <div class="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent-400 dark:bg-accent-500 rotate-45"/>
          </div>
          <p class="jp-section-label">Loading</p>
        </div>
      </div>

      <!-- 錯誤態：useAsyncData 失敗或兩邊作品都空時，提供就地重試（避免只靠右上角 toast） -->
      <div
        v-else-if="galleryLoadFailed"
        class="max-w-md mx-auto my-24 text-center px-6"
        role="alert"
      >
        <p class="jp-section-label mb-3">Error</p>
        <h2 class="text-xl font-extralight text-stone-700 dark:text-stone-200 tracking-wider mb-2">
          無法載入作品清單
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-6">
          網路或資料檔可能暫時無法取得，請稍後再試。
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2 text-xs tracking-[0.25em] text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-400/60 transition-colors"
          :disabled="isGalleryRetrying"
          @click="retryGalleryLoad"
        >
          {{ isGalleryRetrying ? 'Retrying…' : 'Retry' }}
        </button>
      </div>

      <section
        v-if="!isGalleryLoading && !galleryLoadFailed && currentCategory === 'photography' && !filterState.selectedEvent && eventLocations.length"
        id="gallery-footsteps"
        ref="mapSectionRef"
        class="photo-map-entry scroll-mt-24"
        aria-labelledby="photo-map-heading"
      >
        <div class="photo-map-entry__caption">
          <div>
            <h1 id="photo-map-heading" class="jp-section-title">踏跡</h1>
            <p class="photo-map-entry__description">攝影展間</p>
          </div>
          <a class="hall-link" href="#gallery-activities">
            活動索引 <Icon name="lucide:arrow-down" aria-hidden="true" />
          </a>
        </div>
        <div class="photo-map-entry__map">
          <EventMap
            v-if="mapShouldMount"
            :events="eventLocations"
            :initial-view="restoredPhotoMapView"
            :selected-event-name="photoMapView.focusedEventName"
            @select-event="photoMapView.focusedEventName = $event"
            @focus-event="handleFocusEvent"
            @viewport-change="savePhotoMapView"
          />
          <div v-else class="photo-map-entry__skeleton" aria-hidden="true" />
        </div>
      </section>

      <div
        v-if="!isGalleryLoading && !galleryLoadFailed && currentCategory === 'photography' && !filterState.selectedEvent"
        id="gallery-activities"
        ref="controlsSectionRef"
        class="scroll-mt-24"
      >
        <GalleryArchiveControls
          ref="archiveControlsRef"
          :world="worldId"
          :count="categoryCount"
          :selected-event="filterState.selectedEvent"
          :has-map-heading="eventLocations.length > 0"
          @open-change="archiveControlsOpen = $event"
        />
      </div>

      <!-- 根據當前類別顯示不同佈局（帶切換動畫） -->
      <transition name="gallery-fade" mode="out-in">
      <div v-if="!isGalleryLoading && !galleryLoadFailed" :key="currentCategory">
        <!-- 搜尋／年份篩選後無結果：就地提示並提供清除 -->
        <div
          v-if="hasActiveSecondaryFilter && noFilteredResults"
          class="max-w-md mx-auto my-20 text-center px-6"
        >
          <p class="jp-section-label mb-3">Empty</p>
          <h2 class="text-lg font-extralight text-stone-700 dark:text-stone-200 tracking-wider mb-2">
            沒有符合條件的作品
          </h2>
          <p class="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-5">
            試著調整搜尋詞或年份篩選，或直接清除現有篩選再瀏覽。
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 text-xs tracking-[0.25em] text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-400/60 transition-colors"
            @click="clearSecondaryFilters"
          >
            Reset filters
          </button>
        </div>

        <!-- Filtered digital works are curated into the exhibition and its year rooms. -->
        <div v-else-if="currentCategory === 'digital'">
          <GalleryAtelierTimeline
            :groups="atelierYearGroups"
            :selected-year="filterState.selectedEvent"
            @image-click="(img) => openImageViewer(img, digitalArtItems)"
          />
        </div>

        <!-- 攝影作品 - 保持原有的日式佈局 -->
        <div v-else-if="currentCategory === 'photography'">
          <GalleryEventCover
            v-if="filterState.selectedEvent && currentEventGroup"
            :group="currentEventGroup"
            :series-expanded="isEventSeriesExpanded"
            :active-image-id="imageViewerStore.isOpen ? imageViewerStore.currentViewerImage?.id : undefined"
            @image-open="image => openImageViewer(image, currentEventGroup?.images || [])"
            @expand="scrollToEventTimeline"
          />

          <div v-if="filterState.selectedEvent && hasActiveSecondaryFilter && currentEventGroup" class="event-filter-summary">
            <p>目前顯示篩選後的照片<span v-if="filterState.searchQuery"> · {{ filterState.searchQuery }}</span><span v-if="filterState.yearFilter"> · {{ filterState.yearFilter }}</span></p>
            <button type="button" @click="galleryStore.resetSecondaryFilters()">顯示完整組圖</button>
          </div>

          <!-- The map and activity directory stay available on the photography overview. -->
          <GalleryEditorialModules v-if="!filterState.selectedEvent" :items="photographyEventItems" />

          <!-- The complete series remains available below the selection table. -->
          <div
            v-if="filterState.selectedEvent"
            id="event-photo-series"
            ref="eventTimelineRef"
            class="scroll-mt-24"
            :hidden="!isEventSeriesExpanded"
          >
            <GalleryPhotographySection
              v-if="isEventSeriesExpanded"
              ref="photographySectionRef"
              :items="photographyEventItems"
              :focused-event-name="focusedEventName"
              :register-event-ref="setEventRef"
            />
          </div>
        </div>

        <!--
          2026-05-09：移除「全部作品 - 混合佈局」分支（原 GalleryAllMixedSection）。
          雙主線敘事（繪 / 影）為策展核心；mixed feed 與兩條獨立敘事弧不同質。
          舊 /gallery/all 由 useGalleryCategoryRoute 在 client-side replace 到 /gallery/photography。
        -->
      </div>
      </transition>
    </div>

    <nav v-if="!isGalleryLoading && !galleryLoadFailed" class="hall-content hall-exit" aria-label="展間動線">
      <NuxtLink
        v-if="filterState.selectedEvent"
        :to="`/gallery/${currentCategory}`"
        replace
        class="hall-link"
      >
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ currentCategory === 'photography' ? '回踏跡地圖' : '回繪畫展間' }}
      </NuxtLink>
      <NuxtLink v-else to="/" class="hall-link">
        <Icon name="lucide:arrow-left" aria-hidden="true" /> 回首頁
      </NuxtLink>
      <NuxtLink :to="currentCategory === 'photography' ? '/gallery/digital' : '/gallery/photography'" class="hall-link">
        {{ currentCategory === 'photography' ? '前往繪畫展間' : '前往攝影展間' }}
        <Icon name="lucide:arrow-right" aria-hidden="true" />
      </NuxtLink>
    </nav>
    <!-- 圖片檢視器 -->
    <ImageViewer />
    <!-- 回到地圖 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="hall-map-return"
      type="button"
      aria-label="回到地圖"
      title="回到地圖"
      @click="scrollToMap"
    >
      <Icon name="lucide:arrow-up" aria-hidden="true" /> 踏跡
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick, defineAsyncComponent, type ComponentPublicInstance } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { SEO_CONFIG } from '~~/shared/config/constants'
import { sitePageUrl } from '~~/shared/utils/sitePageUrl'
import {
  resolveGalleryShareMeta,
  parseGalleryImageIdFromRoute,
  parseGalleryEventFromParams,
  absoluteUrlFromSitePath
} from '~/utils/gallerySeo'
import type { GalleryItem, FilterState } from '~~/shared/types/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryEditorialModules from '~/components/gallery/GalleryEditorialModules.vue'
import GalleryArchiveControls from '~/components/gallery/GalleryArchiveControls.vue'
import GalleryControlMiniBar from '~/components/gallery/GalleryControlMiniBar.vue'
import EventMap from '~/components/EventMap.vue'
import ImageViewer from '~/components/ImageViewer.vue'

// Both collection tabs share one gallery. The route watchers switch its contents
// without restarting the async page setup during a quick return to the other tab.
// A Pages directory URL can gain a trailing slash on direct entry. Keep the same
// event instance when a viewer query update resolves the equivalent slashless URL.
definePageMeta({ key: route => route.params.event ? route.path.replace(/\/$/, '') : 'gallery-overview' })

const loadGalleryAtelierTimeline = () => import('~/components/gallery/GalleryAtelierTimeline.vue')
const loadGalleryPhotographySection = () => import('~/components/gallery/GalleryPhotographySection.vue')
const loadGalleryEventCover = () => import('~/components/gallery/GalleryEventCover.vue')
const GalleryAtelierTimeline = defineAsyncComponent(loadGalleryAtelierTimeline)
const GalleryPhotographySection = defineAsyncComponent(loadGalleryPhotographySection)
const GalleryEventCover = defineAsyncComponent(loadGalleryEventCover)

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  eventLocations,
  isLoading,
  allWorks,
  digitalError,
  photographyError,
  filterState,
  digitalWorks,
  photographyWorks,
  galleryDataReady,
  filteredItems,
} = storeToRefs(galleryStore)

const {
  loadAllWorks,
  hydrateFromPayload,
  setSearchQuery,
  setYearFilter,
  getHydrationPayload,
} = galleryStore

const { getImagePath, getThumbPath } = useImagePath()

type PhotoMapState = {
  center: [number, number] | null
  zoom: number | null
  focusedEventName: string | null
  allLocations?: boolean
}

const photoMapView = useState<PhotoMapState>('photo-map-view', () => ({
  center: null,
  zoom: null,
  focusedEventName: null
}))
const restoredPhotoMapView = computed(() => {
  const { center, zoom, allLocations } = photoMapView.value
  return center && zoom !== null ? { center, zoom, allLocations } : null
})
const router = useRouter()

let galleryPayloadReusesStore = false
const { data: galleryPayload, pending: galleryPending, error: galleryPayloadError, refresh: refreshGalleryPayload } = await useAsyncData('gallery-works', async () => {
  // 首頁已載入並 hydrate 兩類作品時，沿用 Pinia 資料，避免 SPA 進圖片庫又下載、解析同兩份 JSON。
  const hasReusableGalleryData = galleryDataReady.value &&
    digitalWorks.value.length > 0 &&
    photographyWorks.value.length > 0
  if (hasReusableGalleryData) {
    galleryPayloadReusesStore = true
    return getHydrationPayload()
  }
  galleryPayloadReusesStore = false

  // Key 必須叫 `photography` 才能對上 `hydrateFromPayload` 的 destructure；
  // 早期版本誤命名為 `photo`，導致 SSR 只灌到 digital，攝影仍為空，要靠 onMounted 補抓
  // (見下方 `if (digitalWorks.length === 0 || photographyWorks.length === 0) loadAllWorks()`)。
  // 修正 key 名後 SSR 就能完整填滿 store，事件頁的 `ImageGallery` JSON-LD 也才會帶 hasPart。
  const [digital, photography] = await Promise.all([fetchDigitalWorks(), fetchPhotographyWorks()])
  return { digital, photography }
})

watch(galleryPayload, (v) => {
  if (v && !galleryPayloadReusesStore) hydrateFromPayload(v)
}, { immediate: true })

const isGalleryLoading = computed(() => galleryPending.value || isLoading.value)

const galleryLoadFailed = computed(() => {
  if (isGalleryLoading.value) return false
  const hasError = Boolean(galleryPayloadError.value || digitalError.value || photographyError.value)
  const hasNoWorks = digitalWorks.value.length === 0 && photographyWorks.value.length === 0
  return hasError && hasNoWorks
})

const isGalleryRetrying = ref(false)
const retryGalleryLoad = async () => {
  if (isGalleryRetrying.value) return
  isGalleryRetrying.value = true
  try {
    await refreshGalleryPayload()
    if (galleryPayload.value && !galleryPayloadReusesStore) {
      hydrateFromPayload(galleryPayload.value)
    } else if (!galleryPayload.value) {
      await loadAllWorks()
    }
  } finally {
    isGalleryRetrying.value = false
  }
}

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()

/** Lightbox 與 `?image=` 網址同步（見 composables/useGalleryImageRoute.ts） */
useGalleryImageRoute()
useGalleryCategoryRoute()
useGalleryEventRoute()
const controlsSectionRef = ref<HTMLElement | null>(null)
const archiveControlsRef = ref<{ open: () => Promise<void> } | null>(null)
const archiveControlsOpen = ref(false)
const mapSectionRef = ref<HTMLElement | null>(null)
const showBackToMap = ref(false)
const showControlMiniBar = ref(false)
/**
 * 延後掛載 Leaflet 地圖（修「首次點圖庫非常卡」）：地圖在影世界 overview 預設落地即渲染，
 * 但 leaflet 動態 import + 一格瓦片網路請求 + flyToBounds + tile CSS filter 全擠在首屏。
 * 改為首屏繪製完成後（requestIdleCallback，無則 setTimeout 退回）才掛地圖，讓影像格牆先出來。
 */
const mapShouldMount = ref(false)

// ===== 計算屬性 =====
// 當前選擇的類別
const currentCategory = computed(() => filterState.value.selectedCategory)

/**
 * R1（galleryWorlds）：世界身分 — 繪=kai / 影=kage。
 * 由此一個 data-world attribute 驅動整頁氛圍（底紋／環境光／accent 色溫／進場節奏），
 * 讓兩條 track 像兩個截然不同的世界，而非同一個 image browser 換內容。
 */
const worldId = computed(() => (currentCategory.value === 'digital' ? 'kai' : 'kage'))

// Gallery header dynamic info
// 2026-05-09：移除 'all'，labels 收斂為雙主線
// （categoryLabel 已隨 GalleryLeftRail 移除而刪除——其唯一消費者是左 rail）
const categoryCount = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length
  return photographyEventItems.value.reduce((sum, g) => sum + (g.images?.length || 0), 0)
})

const miniCategoryLabel = computed(() => {
  const labels: Record<FilterState['selectedCategory'], string> = { digital: 'Digital', photography: 'Photography' }
  return labels[currentCategory.value]
})

const miniEventLabel = computed(() => filterState.value.selectedEvent || '全部事件')
const miniYearLabel = computed(() => filterState.value.yearFilter || '全年份')
const miniSearchLabel = computed(() => {
  const value = filterState.value.searchQuery.trim()
  if (!value) return '無'
  return value.length > 18 ? `${value.slice(0, 18)}…` : value
})

// 數位作品列表 - 使用經過篩選的 currentWorks（含搜尋／年份）
const digitalArtItems = computed(() => {
  if (filterState.value.selectedCategory === 'digital') {
    // filteredItems = currentWorks 套用 search/year；category=digital 時 currentWorks 已是 digitalWorks
    return filteredItems.value
  }
  return digitalWorks.value
})

const hasActiveSecondaryFilter = computed(() =>
  Boolean(filterState.value.searchQuery || filterState.value.yearFilter)
)

const noFilteredResults = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length === 0
  return photographyEventItems.value.reduce((s, g) => s + (g.images?.length || 0), 0) === 0
})

const clearSecondaryFilters = () => {
  setSearchQuery('')
  setYearFilter(null)
}

/**
 * i3：digital 依 event.name (年份) 分組，餵給橫向製図台年表（GalleryAtelierTimeline）。
 * 取代舊 digitalEventGroups + stacked 章節 header（部落格地層）。
 * 年份 asc（左→右＝舊→新，橫向時間軸自然由過去往現在推進）。
 * year 欄位：從 event.name 抽 4 位年份，作年尺刻度與年脊大字。
 */
interface AtelierYearGroup {
  eventName: string
  year: string
  images: typeof digitalArtItems.value
  strongestLine: string | null
}
const atelierYearGroups = computed<AtelierYearGroup[]>(() => {
  const groups = new Map<string, AtelierYearGroup>()
  for (const img of digitalArtItems.value) {
    const name = img.event?.name || '其他作品'
    if (!groups.has(name)) {
      const sn = (img as { seriesNarrative?: { strongest_line?: string } }).seriesNarrative
      groups.set(name, {
        eventName: name,
        year: name.match(/(\d{4})/)?.[1] || name,
        images: [],
        strongestLine: sn?.strongest_line || null
      })
    }
    groups.get(name)!.images.push(img)
  }
  // 年份 asc（左→右＝舊→新）：橫向製図台的時間自然由左往右推進
  return Array.from(groups.values()).sort((a, b) => {
    const ay = parseInt(a.year.match(/(\d{4})/)?.[1] || '0', 10)
    const by = parseInt(b.year.match(/(\d{4})/)?.[1] || '0', 10)
    return ay - by
  })
})



// 攝影作品事件分組
const photographyEventItems = computed(() => {
  return mixedPhotoItems.value.filter(item =>
    item.images && item.images.some(img => img.category === 'photography')
  )
})

/**
 * 進入 event path 時的扉頁來源 group。
 * `mixedPhotoItems` 已套 selectedEvent filter，所以選 event 時通常只剩一個 group；
 * 仍 explicit 用 eventName 比對以防其他 filter 介入。
 */
const currentEventGroup = computed(() => {
  if (!filterState.value.selectedEvent) return null
  return photographyEventItems.value.find(g => g.eventName === filterState.value.selectedEvent) ?? null
})

const eventTimelineRef = ref<HTMLDivElement | null>(null)
const photographySectionRef = ref<{ expandEvent: (name: string) => void } | null>(null)
const isEventSeriesExpanded = ref(true)

watch(() => filterState.value.selectedEvent, () => {
  isEventSeriesExpanded.value = true
})

/** The cover's expand action reveals the series, then scrolls to it. */
const scrollToEventTimeline = async () => {
  isEventSeriesExpanded.value = true
  await nextTick()
  if (!eventTimelineRef.value) return
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  eventTimelineRef.value.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

// 地圖點擊 → 導覽到下方事件區塊
const eventRefs = ref<Record<string, HTMLElement | null>>({})
const focusedEventName = ref<string | null>(null)
let focusTimer: number | null = null

const setEventRef = (name: string | null, el: Element | ComponentPublicInstance | null) => {
  if (!name) return
  if (!el) {
    eventRefs.value[name] = null
    return
  }
  const target = ('$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement))
  if (typeof window !== 'undefined') {
    if (typeof target.checkVisibility === 'function') {
      if (!target.checkVisibility()) return
    } else if (target.getClientRects().length === 0) {
      return
    }
  }
  eventRefs.value[name] = target
}

const savePhotoMapView = (view: { center: [number, number], zoom: number, allLocations?: boolean }) => {
  photoMapView.value.center = view.center
  photoMapView.value.zoom = view.zoom
  photoMapView.value.allLocations = view.allLocations
}

const handleFocusEvent = (eventName: string) => {
  photoMapView.value.focusedEventName = eventName
  void router.push({ path: `/gallery/photography/${encodeURIComponent(eventName)}` })
}

const handleScroll = () => {
  if (mapSectionRef.value) {
    const mapBottom = mapSectionRef.value.getBoundingClientRect().bottom
    const threshold = 80
    showBackToMap.value = mapBottom < threshold
  } else {
    showBackToMap.value = false
  }

  // 控制區 sticky mini bar（hysteresis：避免臨界點閃爍）
  if (!controlsSectionRef.value || isGalleryLoading.value || galleryLoadFailed.value) {
    showControlMiniBar.value = false
    return
  }
  const controlsBottom = controlsSectionRef.value.getBoundingClientRect().bottom
  const collapseThreshold = 100
  const expandThreshold = 160
  if (!showControlMiniBar.value && controlsBottom < collapseThreshold) {
    showControlMiniBar.value = true
  } else if (showControlMiniBar.value && controlsBottom > expandThreshold) {
    showControlMiniBar.value = false
  }
}

/** 地圖區是否已貼在導覽列下方；區塊高於視窗時只檢查頂緣對齊（避免矮螢幕誤判） */
const isMapComfortablyVisible = () => {
  const el = mapSectionRef.value
  if (!el) return true
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const navReserve = 88
  if (r.top > navReserve + 56) return false
  if (r.top < 52) return false
  if (r.height >= vh - navReserve - 24) {
    return r.top >= navReserve - 16 && r.top <= navReserve + 48
  }
  if (r.bottom > vh - 10) return false
  return true
}

const scrollToMap = () => {
  // block: 'nearest' 避免使用者已在地圖下方瀏覽時被強拉回頂端；
  // 只有完全看不到地圖時瀏覽器才會自動對齊，符合「柔性引導」原則。
  if (!mapSectionRef.value) return
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  mapSectionRef.value.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' })
}

const scrollToControls = async () => {
  if (!controlsSectionRef.value) return
  await archiveControlsRef.value?.open()
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  controlsSectionRef.value.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}

// ===== 監聽器 =====
/**
 * 篩選某一事件時：
 * - 地圖 flyTo 由 EventMap 處理
 * - 僅當「首次選取事件」且「使用者目前看不到地圖」才 scrollToMap，
 *   避免在地圖下方繼續切換事件時每次都被捲回頂端
 */
const hasScrolledOnEventSelection = ref(false)
watch(
  () => filterState.value.selectedEvent,
  async (name, prev) => {
    if (currentCategory.value !== 'photography') return
    if (!name) {
      hasScrolledOnEventSelection.value = false
      return
    }
    await nextTick()
    await nextTick()

    if (focusTimer !== null) {
      window.clearTimeout(focusTimer)
      focusTimer = null
    }
    focusedEventName.value = name
    focusTimer = window.setTimeout(() => {
      focusedEventName.value = null
      focusTimer = null
    }, 1200)

    const isFirstSelection = prev === null || prev === undefined
    if (isFirstSelection && !isMapComfortablyVisible()) {
      scrollToMap()
      hasScrolledOnEventSelection.value = true
    }
  }
)

watch([digitalError, photographyError], ([digitalErr, photoErr]) => {
  if (digitalErr) {
    toast.error('載入數位作品失敗', '請檢查網路連線或稍後再試')
  }
  if (photoErr) {
    toast.error('載入攝影作品失敗', '請檢查網路連線或稍後再試')
  }
})

// ===== 生命週期 =====
onMounted(async () => {
  // The mounted overview can enter photography either directly or from the digital tab.
  watch(
    () => currentCategory.value === 'photography' && !filterState.value.selectedEvent,
    (isPhotographyOverview) => {
      if (!isPhotographyOverview || mapShouldMount.value) return
      mapShouldMount.value = true
      void Promise.all([
        loadGalleryEventCover(),
        loadGalleryPhotographySection()
      ]).catch((error) => {
        console.warn('Unable to preload photography event components', error)
      })
    },
    { immediate: true }
  )

  // 防禦性 fallback：useAsyncData 走完 hydrate 後若仍有任一邊為空（過去因 payload key
  // 不對齊導致 SSR 只灌數位的 bug 觸發過；現已修正），補抓一次保 UX 正常。
  try {
    if (!digitalError.value && !photographyError.value) {
      if (digitalWorks.value.length === 0 || photographyWorks.value.length === 0) {
        await loadAllWorks()
      }
    }
  } catch (error) {
    console.error('Failed to load works:', error)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})

// ===== SEO（SSR：useAsyncData 先灌入作品，才能依 ?image= / 路徑 event 段產生 OG／Twitter／JSON-LD）=====
// 2026-05-09：移除 'all' 類別後 seoTitles 收斂為雙主線
const seoTitles: Record<FilterState['selectedCategory'], string> = {
  digital: 'Works - 數位繪圖',
  photography: 'Works - 攝影作品',
}

const seoDefaultDescription = '數位藝術與攝影作品集，包含數位插畫與攝影紀錄。'

const defaultOgImageAbs = absoluteUrlFromSitePath(
  SEO_CONFIG.siteUrl,
  'images/photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg'
)

const route = useRoute()
const shareUrl = computed(() => {
  const [location = ''] = route.fullPath.split('#', 1)
  const queryStart = location.indexOf('?')
  return sitePageUrl(route.path, queryStart === -1 ? '' : location.slice(queryStart))
})

const absPathClean = (filename: string) => {
  const p = getImagePath(filename)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

const absThumb800Clean = (filename: string) => {
  const p = getThumbPath(filename, 800)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

// creator 欄位會貼進每張 `ImageObject` 作 schema，呼應首頁 `Person` schema（同 url）。
const gallerySchemaAuthor = {
  name: 'NCTU Young',
  alternateName: 'jimmyyoung1995',
  url: SEO_CONFIG.siteUrl
}

const gallerySeoResolved = computed(() =>
  resolveGalleryShareMeta({
    category: currentCategory.value,
    categoryTitle: seoTitles[currentCategory.value],
    imageId: parseGalleryImageIdFromRoute(route.query as Record<string, unknown>),
    eventName: parseGalleryEventFromParams(route.params as Record<string, unknown>),
    allWorks: allWorks.value,
    absPath: absPathClean,
    absThumb800: absThumb800Clean,
    defaultOgImageAbs,
    defaultTitle: seoTitles[currentCategory.value],
    defaultDescription: seoDefaultDescription,
    pageUrl: shareUrl.value,
    author: gallerySchemaAuthor
  })
)

useSeoMeta({
  title: computed(() => gallerySeoResolved.value.title),
  description: computed(() => gallerySeoResolved.value.description),
  ogTitle: computed(() => gallerySeoResolved.value.title),
  ogDescription: computed(() => gallerySeoResolved.value.description),
  ogType: 'website',
  ogUrl: shareUrl,
  ogImage: computed(() => gallerySeoResolved.value.ogImage),
  ogImageAlt: computed(() => gallerySeoResolved.value.ogImageAlt),
  twitterCard: 'summary_large_image',
  twitterImage: computed(() => gallerySeoResolved.value.ogImage)
})

useHead({
  script: computed(() => {
    const ld = gallerySeoResolved.value.jsonLd
    if (!ld) return []
    return [{ type: 'application/ld+json', innerHTML: JSON.stringify(ld) }]
  })
})
</script>

<style scoped>
.event-filter-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0 auto 2rem;
  padding: 1rem;
  border-block: 1px solid var(--border-soft);
  color: var(--fg-3);
  font-size: 0.8rem;
}
.event-filter-summary button {
  min-height: 44px;
  text-decoration: underline;
  text-underline-offset: 5px;
}
.event-filter-summary button:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 4px; }

.gallery-world[data-world] {
  --hall-tone: var(--museum-warm);
  color: var(--museum-ink);
  background:
    linear-gradient(90deg, var(--hall-tone), transparent 15% 85%, var(--hall-tone)),
    radial-gradient(ellipse 82% 45rem at 48% 0, var(--museum-light), transparent 92%),
    var(--museum-paper);
}
.gallery-world[data-world='kage'] { --hall-tone: var(--museum-cool); }
.gallery-world::before,
.gallery-world::after { content: none; }

.hall-content {
  width: min(86rem, 100%);
  margin-inline: auto;
  padding-inline: clamp(1rem, 5vw, 4rem);
}
.hall-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  color: var(--museum-ink);
  font-size: 0.84rem;
  text-decoration: underline;
  text-underline-offset: 0.32em;
  text-decoration-color: var(--museum-line);
}
.hall-link:hover { text-decoration-color: currentColor; }
.hall-link:focus-visible,
.hall-map-return:focus-visible { outline: 2px solid var(--museum-ink); outline-offset: 3px; }
.hall-exit {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding-block: 2rem clamp(3rem, 7vw, 6rem);
  margin-top: clamp(2rem, 4vw, 3rem);
}
.hall-exit::before { content: ''; flex-basis: 100%; border-top: 1px solid var(--museum-line); }
.hall-map-return {
  position: fixed;
  z-index: 1005;
  right: max(1rem, env(safe-area-inset-right));
  bottom: calc(4.75rem + env(safe-area-inset-bottom));
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0 0.7rem;
  border: 1px solid var(--museum-line);
  background: var(--museum-paper);
  color: var(--museum-ink);
  font-size: 0.8rem;
}
.hall-map-return:hover { border-color: var(--museum-muted); }

.photo-map-entry { margin: 0 auto clamp(2.75rem, 5vw, 4.5rem); padding-top: clamp(1.25rem, 3vw, 2.5rem); }
.photo-map-entry__caption {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
}
.photo-map-entry__caption .jp-section-title {
  margin: 0;
  color: var(--museum-ink);
  font-size: clamp(2.15rem, 5vw, 4.35rem);
  line-height: 1.16;
}
.photo-map-entry__description { margin: 0.35rem 0 0; color: var(--museum-muted); font-size: 0.85rem; }
.photo-map-entry__map {
  padding: clamp(0.25rem, 0.7vw, 0.55rem);
  background: var(--museum-cool);
  border: 1px solid var(--museum-line);
}
.photo-map-entry__skeleton { height: 440px; background: var(--museum-cool); }

.gallery-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.gallery-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gallery-fade-enter-from { opacity: 0; transform: translateY(12px); }
.gallery-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

.mini-bar-fade-enter-active,
.mini-bar-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.mini-bar-fade-enter-from,
.mini-bar-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .gallery-fade-enter-active,
  .gallery-fade-leave-active,
  .mini-bar-fade-enter-active,
  .mini-bar-fade-leave-active {
    transition: opacity 0.15s linear;
  }
  .gallery-fade-enter-from,
  .gallery-fade-leave-to,
  .mini-bar-fade-enter-from,
  .mini-bar-fade-leave-to {
    transform: none;
  }
}

</style>
