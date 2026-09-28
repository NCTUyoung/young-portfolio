<template>
  <div
    ref="pageRef"
    class="gallery-world min-h-screen transition-colors duration-300"
    :data-world="worldId"
    :class="{ 'gallery-world--ready': worldReady }"
  >
    <!-- Fresh Dynamic pilot：同一個 Archive Controls 負責世界識別、分類與篩選狀態。 -->
    <div
      v-if="currentCategory !== 'photography'"
      ref="controlsSectionRef"
      class="container mx-auto px-4 sm:px-6"
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
    <div class="container mx-auto px-4 sm:px-6 relative">
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
        ref="mapSectionRef"
        class="photo-map-entry scroll-mt-24"
        aria-labelledby="photo-map-heading"
      >
        <div class="photo-map-entry__map">
          <EventMap
            v-if="mapShouldMount"
            :events="eventLocations"
            :initial-view="restoredPhotoMapView"
            :selected-event-name="photoMapView.focusedEventName"
            @focus-event="handleFocusEvent"
            @viewport-change="savePhotoMapView"
          />
          <div v-else class="photo-map-entry__skeleton" aria-hidden="true" />
        </div>
        <div class="photo-map-entry__caption">
          <div>
            <p class="jp-eyebrow">其の一 · Footsteps</p>
            <h2 id="photo-map-heading" class="jp-section-title">
              踏跡<span class="jp-section-ruby">Photographs, Placed</span>
            </h2>
          </div>
          <p class="photo-map-entry__hint">拖曳地圖，放大探索附近的照片</p>
        </div>
      </section>

      <div
        v-if="!isGalleryLoading && !galleryLoadFailed && currentCategory === 'photography' && !filterState.selectedEvent"
        ref="controlsSectionRef"
        class="container mx-auto px-4 sm:px-6"
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
        地點地圖：僅在攝影作品分類顯示（2026-04-19 起改 compact 版；2026-04-28 priority 2 重構）
        敘事章節結構：
          一 · 踏跡 Footsteps（map） → 二 · 句 Statement → 三 · 精選 Selected → 四 · 時間軸 Timeline
        每段冠以 editorial section header（章碼 + 漢字 + Ruby + hairline）取代孤立的 eyebrow 行，
        讓策展節奏取代功能感。
      -->

      <!-- Photography overview keeps the book-spread map; event routes begin at the event cover. -->

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

        <!--
          數位繪圖（繪 · 製図室）
          i3（act-critic）：KILL 部落格地層 —— 移除舊「v-for stacked 章節 header
          (其の N / 20XX年電繪作品) → GridWall」逐年上下堆疊（critic verdict #2「太像部落格」）。
          改為單一【橫向可拖動製図台年表】GalleryAtelierTimeline：年份左→右鋪在同一張製圖桌上，
          頂部年尺可點跳年，使用者主動橫拖／⇧滾輪／方向鍵探索（user-initiated，無 timer）。
          桌機橫向、手機降級直落（normal scroll，瀏覽不破）。Intro 製圖宣言保留領銜。
        -->
        <div v-else-if="currentCategory === 'digital'">
          <!-- Event and filtered digital views retain the contextual intro before the timeline. -->
          <div v-if="!isOverviewEntry" class="world-enter world-enter-d1">
            <GalleryDigitalIntro />
          </div>
          <GalleryAtelierTimeline
            :groups="atelierYearGroups"
            class="world-enter world-enter-d2"
            @image-click="(img) => openImageViewer(img, digitalArtItems)"
          />
        </div>

        <!-- 攝影作品 - 保持原有的日式佈局 -->
        <div v-else-if="currentCategory === 'photography'">
          <!--
            進入特定 event 時：扉頁式入口（GalleryEventCover）
            啟發自 sites/ryan-mcginley.md + sites/rinko-kawauchi.md（沉浸型訪客優先）。
            跳過 overview 的 Map/Statement/Strip 三章節，直接呈現該 event 之代表照 + metadata + 展開鈕。
            升級路徑：未來加 SERIES_TAG = 'event-cover' 後，cover 來源由 D1（第一張）改為 D2（admin 指定）。

            注意：不能用 <template v-if/v-else> 包多元素群組——本層在 <transition>
            內，多根 fragment 會觸發 Vue 內部 _leaveCb null reference（v3.4-3.6
            transition + multi-root fragment 已知互動）。改用個別 v-if 維持單根。
          -->
          <GalleryEventCover
            v-if="filterState.selectedEvent && currentEventGroup"
            :group="currentEventGroup"
            :series-expanded="isEventSeriesExpanded"
            @expand="scrollToEventTimeline"
          />

          <!--
            R32：「其の二 · Artist Statement」整段刪除（與首頁 Hero/Epilogue 重複）。

            i4（act-critic / 暗室の横引き膠卷光桌）：KILL 影世界舊「stacked 摺合章 timeline
            + 精選 strip」部落格地層（critic AVOID jump-out：影仍是死板縮圖格牆）。
            overview 主欄改為一條【橫向可拖動的暗房光桌膠卷流】GalleryLightTable，
            與繪 GalleryAtelierTimeline（製図台）對位——一張製圖桌、一卷底片，
            兩世界各有招牌橫向手勢。HorizontalStripFeatured / GalleryPhotographySection
            （逐年 stacked）只在「進 event 沉浸模式」保留垂直閱讀。
          -->
          <!-- overview：編輯模組網格（特稿大圖 + 編號日期格 + banner，每 event 一塊）。
               取代舊橫向小圖膠卷光桌（使用者：圖太小、排版過時）。
               wiki: patterns/newspaper-masthead-module-grid.md -->
          <!--
            book-spread-chapter-plate（wiki: patterns/book-spread-chapter-plate.md）：
            踏跡不再是側欄裡的一塊地圖 widget（無論怎麼包 CSS 外衣，讀起來都是「貼上去的
            app widget」），改把「其の一」升格成一頁真正的書頁對開扉頁——左頁地圖全出血
            無邊框，右頁 jp-seal 印記 + 大數字 + 標題 + 一句引言，書溝 hairline 居中。
            章節索引主欄改回全寬，接在扉頁之後。
          -->
          <div v-if="!filterState.selectedEvent" class="kage-overview world-enter world-enter-d2">
            <div class="kage-overview__main">
              <GalleryEditorialModules :items="photographyEventItems" />
            </div>
          </div>

          <!-- The event cover is the first step; mount the photo series only after an explicit expand. -->
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

    <!-- Footer — 根據分類變化 -->
    <div class="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28 text-center relative overflow-hidden">
      <div class="deco-line-h absolute left-1/2 top-0 w-40 -translate-x-1/2"/>

      <!-- 背景漢字裝飾 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[10rem] sm:text-[14rem] font-thin leading-none text-stone-100/80 dark:text-stone-800/40">
          {{ currentCategory === 'digital' ? '繪' : currentCategory === 'photography' ? '影' : '創' }}
        </span>
      </div>

      <div class="relative">
        <!-- 上方裝飾：hairline + 墨點 -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-12 bg-gradient-to-r from-transparent to-stone-300/60 dark:to-stone-600/40"/>
          <span class="jp-sumi-dot opacity-70"/>
          <div class="h-px w-12 bg-gradient-to-l from-transparent to-stone-300/60 dark:to-stone-600/40"/>
        </div>

        <div class="font-jp text-2xl md:text-3xl font-thin text-stone-300 dark:text-stone-600 tracking-wider">{{ footerQuote }}</div>
        <div class="text-xs text-accent-400/50 dark:text-accent-500/35 mt-3 font-light tracking-[0.4em]">{{ footerSub }}</div>
      </div>
    </div>
    <!-- 圖片檢視器 -->
    <ImageViewer />
    <!-- 回到地圖：桌機右側膠囊按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="hidden md:flex fixed right-[10%] top-1/2 z-[1005] -translate-y-1/2 px-3 py-1.5 text-[0.7rem] tracking-[0.3em] rounded-full bg-white/90 border border-stone-200 text-stone-500 hover:text-accent-600 hover:border-accent-300 shadow-japanese transition-all"
      type="button"
      aria-label="回到地圖"
      title="回到地圖"
      @click="scrollToMap"
    >
      MAP
    </button>

    <!-- 回到地圖：手機右下圓形按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="md:hidden fixed z-[1005] flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[0.65rem] tracking-[0.2em] text-stone-500 shadow-japanese transition-all active:scale-95 right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))]"
      type="button"
      aria-label="回到地圖"
      title="回到地圖"
      @click="scrollToMap"
    >
      MAP
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick, defineAsyncComponent, type ComponentPublicInstance } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { SEO_CONFIG } from '~~/shared/config/constants'
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

const loadGalleryAtelierTimeline = () => import('~/components/gallery/GalleryAtelierTimeline.vue')
const loadGalleryPhotographySection = () => import('~/components/gallery/GalleryPhotographySection.vue')
const loadGalleryEventCover = () => import('~/components/gallery/GalleryEventCover.vue')
const GalleryAtelierTimeline = defineAsyncComponent(loadGalleryAtelierTimeline)
const GalleryPhotographySection = defineAsyncComponent(loadGalleryPhotographySection)
const GalleryEventCover = defineAsyncComponent(loadGalleryEventCover)
const GalleryDigitalIntro = defineAsyncComponent(() => import('~/components/gallery/GalleryDigitalIntro.vue'))

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
}

const photoMapView = useState<PhotoMapState>('photo-map-view', () => ({
  center: null,
  zoom: null,
  focusedEventName: null
}))
const restoredPhotoMapView = computed(() => {
  const { center, zoom } = photoMapView.value
  return center && zoom !== null ? { center, zoom } : null
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
const pageRef = ref<HTMLElement | null>(null)
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

/**
 * i2（act-critic / 雙世界共同入口）：overview「双世界の門」入口屏條件。
 * 回應 Round 1 critic「門被鎖在 photography 單一路由，/gallery/digital 與 /gallery/all
 * 落地仍是 header+左rail+逐年堆疊的部落格格」。
 * 改為：**任一 overview 路由**（digital 或 photography）未選 event、無次級篩選、
 * 兩軌都有資料時，第一屏都先見 full-bleed 繪×影對峙門面 —— 門已偏向當前世界（bias），
 * 但岐 seam 仍可拖回對側。門之後才是該世界內容（仍可瀏覽，bold ≠ broken）。
 * 進入任一 event（選 event）即離開門面、回到該世界沉浸導航。
 */
const isOverviewEntry = computed(() =>
  !galleryLoadFailed.value &&
  !isGalleryLoading.value &&
  !filterState.value.selectedEvent &&
  !hasActiveSecondaryFilter.value &&
  digitalWorks.value.length > 0 &&
  photographyWorks.value.length > 0
)

/**
 * worldReady：控制 ::before/::after 質地層淡入。
 * 切換 track 時先抽離再掛回 → 重新觸發世界進場（質地淡入 + .world-enter 動畫重播）。
 * 純一次性進場，無 timer/autoplay，不違 hero 靜態鐵律（此處非 hero）。
 */
const worldReady = ref(false)
let worldReadyRaf = 0
const armWorld = () => {
  worldReady.value = false
  if (typeof window === 'undefined') return
  cancelAnimationFrame(worldReadyRaf)
  worldReadyRaf = requestAnimationFrame(() => {
    worldReadyRaf = requestAnimationFrame(() => { worldReady.value = true })
  })
}

/**
 * 切換 track 時重新觸發世界進場（質地淡入 + .world-enter 重播）。
 * two-rooms-r1：移除「世界幕」overlay 後，跨世界只靠書口門檻 + 進場呼吸，不再額外掛幕。
 */
watch(worldId, () => {
  armWorld()
})

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

// Footer quotes by category（2026-05-09：移除 'all' quote）
const footerQuotes: Record<FilterState['selectedCategory'], { quote: string; sub: string }> = {
  digital:     { quote: '每一筆都是故事', sub: 'every stroke tells a story' },
  photography: { quote: '光影之間，皆是詩', sub: 'poetry between light and shadow' },
}
const footerQuote = computed(() => footerQuotes[currentCategory.value].quote)
const footerSub = computed(() => footerQuotes[currentCategory.value].sub)

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
const isEventSeriesExpanded = ref(false)

watch(() => filterState.value.selectedEvent, () => {
  isEventSeriesExpanded.value = false
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

const savePhotoMapView = (view: { center: [number, number], zoom: number }) => {
  photoMapView.value.center = view.center
  photoMapView.value.zoom = view.zoom
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
  mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
  // 攝影 overview 首屏即以互動地圖為主，避免等作品清單的防禦性補抓才掛載。
  if (currentCategory.value === 'photography' && !filterState.value.selectedEvent) {
    mapShouldMount.value = true
  }

  // 攝影總覽的主要下一步是打開事件。提早暖載事件封面與印樣格元件，
  // 讓使用者進事件時不必再等 async component chunk 載入。
  if (currentCategory.value === 'photography' && !filterState.value.selectedEvent) {
    void Promise.all([
      loadGalleryEventCover(),
      loadGalleryPhotographySection()
    ]).catch((error) => {
      console.warn('Unable to preload photography event components', error)
    })
  }

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
    armWorld()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    cancelAnimationFrame(worldReadyRaf)
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
const requestUrl = useRequestURL()

const shareUrl = computed(() => {
  if (import.meta.client) return window.location.href
  return `${requestUrl.origin}${requestUrl.pathname}${requestUrl.search}`
})

/**
 * JSON-LD 專用的 canonical URL。
 *
 * `useRequestURL()` 在 `nuxt generate` 預渲染時 origin 會是 `http://localhost`，
 * 丟進 schema 會被 Google 當 staging URL。這裡改以 `SEO_CONFIG.siteUrl` 作
 * 基準 origin，但保留 pathname/query 讓 event / image 參數仍帶得進去。
 * （`og:url` 保留原 behavior，避免動到既有 share flow。）
 */
const schemaCanonicalUrl = computed(() => {
  if (import.meta.client) return window.location.href
  const canonicalOrigin = new URL(SEO_CONFIG.siteUrl).origin
  return `${canonicalOrigin}${requestUrl.pathname}${requestUrl.search}`
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
    pageUrl: schemaCanonicalUrl.value,
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
/* ===== R40：Digital section 章封 header（與 photography Timeline 對位） ===== */
.digital-chapter-header {
  position: relative;
  padding: 1.6rem 0 1.2rem;
  margin-bottom: 1.4rem;
  border-bottom: 1px solid rgb(168 162 158 / 0.2);
}
.digital-chapter-header__index {
  font-size: 0.62rem;
  letter-spacing: 0.34em;
  color: rgb(217 123 46 / 0.85);
  text-transform: uppercase;
  /* R4：章碼改等寬 mono 製圖字（繪世界專屬 --world-mono），與影 serif 章碼分歧 */
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.5rem;
}
.digital-chapter-header__title {
  /* R2：繪章名改世界字族（Zen Kaku Gothic New，幾何 gothic），與影 Shippori 明體分家 */
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-size: 1.85rem;
  font-weight: var(--world-display-weight, 400);
  letter-spacing: var(--world-display-spacing, 0.18em);
  color: rgb(68 64 60);
  margin: 0;
  line-height: 1.3;
}
:global(.dark) .digital-chapter-header__title { color: rgb(231 229 228); }
.digital-chapter-header__strongest {
  margin: 0.6rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1rem;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
  font-weight: 300;
}
:global(.dark) .digital-chapter-header__strongest { color: rgb(168 162 158); }
.digital-chapter-header__meta {
  margin: 0.85rem 0 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  color: rgb(120 113 108);
  text-transform: uppercase;
  /* R4：meta 行（繪 · DIGITAL · N 葉）等寬 mono，製圖標註觸感。
     「繪」漢字首字由既有 .digital-chapter-header__meta > span:first-child 規則覆寫回 serif */
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
.digital-chapter-header__meta > span:first-child {
  font-family: 'Noto Serif JP', serif;
  color: rgb(217 123 46);
  font-size: 0.92rem;
}
:global(.dark) .digital-chapter-header__meta > span:first-child { color: rgb(231 184 125); }
.digital-chapter-header::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 1.8rem;
  bottom: 1rem;
  width: 2px;
  border-radius: 1px;
  background: rgb(217 123 46 / 0.55);
}

/* R45：digital chapter axes 3 row — 與 photography 對等 */
.digital-chapter-axes-3row {
  margin: 1rem 0 0;
  padding-top: 0.85rem;
  border-top: 1px solid rgb(168 162 158 / 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.photo-map-entry {
  margin: 1rem auto clamp(3rem, 6vw, 5rem);
}

.photo-map-entry__map {
  height: clamp(460px, 65svh, 720px);
  overflow: hidden;
  background: rgb(245 245 244);
}

.photo-map-entry__map :deep(.event-map-wrapper) {
  height: 100%;
  border: 0;
  border-radius: 0.2rem;
  box-shadow: none;
}

.photo-map-entry__map :deep(.event-map-container),
.photo-map-entry__skeleton {
  height: 100%;
}

.photo-map-entry__skeleton {
  background: linear-gradient(135deg, rgb(231 229 228), rgb(245 245 244) 58%, rgb(231 229 228));
}

.dark .photo-map-entry__map,
.dark .photo-map-entry__skeleton {
  background: rgb(41 37 36);
}

.dark .photo-map-entry__skeleton {
  background: linear-gradient(135deg, rgb(41 37 36), rgb(28 25 23) 58%, rgb(41 37 36));
}

.photo-map-entry__caption {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.3rem clamp(0.25rem, 1.5vw, 1rem) 0;
}

.photo-map-entry__caption .jp-eyebrow {
  margin: 0 0 0.35rem;
}

.photo-map-entry__caption .jp-section-title {
  margin: 0;
  font-size: clamp(1.9rem, 3.2vw, 2.6rem);
}

.photo-map-entry__hint {
  margin: 0 0 0.4rem;
  color: rgb(87 83 78);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.dark .photo-map-entry__hint {
  color: rgb(214 211 209);
}

@media (max-width: 767px) {
  .photo-map-entry {
    margin-top: 0;
  }

  .photo-map-entry__map {
    height: clamp(400px, 59svh, 560px);
  }

  .photo-map-entry__caption {
    align-items: start;
    flex-direction: column;
    gap: 0.75rem;
  }

  .photo-map-entry__hint {
    font-size: 0.8rem;
  }
}

/* =========================================================
   overview：書頁對開扉頁（全寬）之後接章節索引主欄（全寬）
   ========================================================= */
.kage-overview {
  display: flex;
  flex-direction: column;
}


/* 僅保留頁面內過場與響應式 h1 調整；共用樣式（shadow-japanese、backdrop-blur-japanese、scrollbar 等）已遷入 assets/css/main.css */
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

@media (max-width: 768px) {
  h1:not(.gallery-masthead-m__title) {
    font-size: 2rem !important;
    line-height: 1.2;
  }
  /* R6：世界標牌在手機略收，但保留兩世界字級差（mono 緊 / serif 鬆） */
  .gallery-masthead-m__title--mono { font-size: 1.75rem; }
  .gallery-masthead-m__title--serif { font-size: 2rem; }
}

@media (max-width: 480px) {
  h1:not(.gallery-masthead-m__title) {
    font-size: 1.75rem !important;
  }
  .gallery-masthead-m__title--mono { font-size: 1.6rem; }
  .gallery-masthead-m__title--serif { font-size: 1.85rem; }
}
</style>
