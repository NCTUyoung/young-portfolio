<template>
  <div ref="pageRef" class="min-h-screen transition-colors duration-300">
    <!-- Header — 個性化設計 -->
    <div ref="controlsSectionRef" class="container mx-auto px-4 py-8 sm:px-6 md:py-20 relative">
      <!-- 右側縦書き裝飾字（配 hairline 收尾，不再孤立色點） -->
      <div class="absolute top-10 right-[6%] hidden lg:flex flex-col items-center gap-4 select-none pointer-events-none">
        <span class="jp-hairline-v h-16"/>
        <span class="jp-vertical-caption text-stone-400/60 dark:text-stone-600/60">記録と創作</span>
      </div>

      <div class="max-w-7xl mx-auto">
        <!--
          頁眉 — 對齊 ui_kits/portfolio_site/GalleryControls.jsx：
          「— Gallery」accent eyebrow 帶 em-dash → 大 sans「Works」+ 中性 hairline → category · count 行
          em-dash hairline 由 .jp-eyebrow::before 自動產生（取代右側漸層裝飾線，回歸對稱）
        -->
        <div class="mb-2">
          <p class="jp-eyebrow text-accent-500 dark:text-accent-400 mb-2"><span>Gallery</span></p>
          <div class="flex items-end gap-6">
            <h1 class="text-3xl md:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">Works</h1>
            <!-- 中性 hairline（對齊 ui_kit Works ___ 的橫線），不再用 accent 漸層搶焦 -->
            <span class="hidden sm:block h-px flex-1 max-w-[120px] bg-stone-300/70 dark:bg-stone-600/50 mb-2"/>
          </div>
        </div>

        <!-- 作品數量 -->
        <p class="text-stone-500 dark:text-stone-400 font-light mb-6 text-sm tracking-wide flex items-center gap-2">
          <span class="text-accent-500 dark:text-accent-400">{{ categoryLabel }}</span>
          <span class="text-stone-300 dark:text-stone-700">·</span>
          <span>{{ categoryCount }} works</span>
        </p>

        <div id="gallery-filter-controls">
          <!-- Category Tabs -->
          <div class="mb-4">
            <GalleryTabBar />
          </div>

          <!-- Event Filter -->
          <div class="mb-6">
            <EventFilter />
          </div>

          <!-- 搜尋 + 年份：輕量行內工具列 -->
          <GalleryFilterToolbar />
        </div>
      </div>
    </div>

    <!-- Sticky mini bar：控制區離開可視區後，收束為一行摘要 -->
    <transition name="mini-bar-fade">
      <div
        v-if="showControlMiniBar"
        class="pointer-events-none fixed inset-x-0 z-[1090] top-[calc(env(safe-area-inset-top,0px)+4rem)]"
        data-testid="gallery-filter-mini-bar"
      >
        <GalleryControlMiniBar
          controls-id="gallery-filter-controls"
          :category-label="miniCategoryLabel"
          :event-label="miniEventLabel"
          :year-label="miniYearLabel"
          :search-label="miniSearchLabel"
          :expanded="false"
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

      <!--
        地點地圖：僅在攝影作品分類顯示（2026-04-19 起改 compact 版；2026-04-28 priority 2 重構）
        敘事章節結構：
          一 · 踏跡 Footsteps（map） → 二 · 句 Statement → 三 · 精選 Selected → 四 · 時間軸 Timeline
        每段冠以 editorial section header（章碼 + 漢字 + Ruby + hairline）取代孤立的 eyebrow 行，
        讓策展節奏取代功能感。
      -->
      <!--
        其の一 Footsteps Map — 僅在 photography overview（未進 event）顯示。
        進 event 時改走扉頁（GalleryEventCover），跳過 map / statement / strip 三章節。
      -->
      <section
        v-if="!galleryLoadFailed && eventLocations && eventLocations.length && currentCategory === 'photography' && !filterState.selectedEvent"
        ref="mapSectionRef"
        class="mb-12 max-w-7xl mx-auto scroll-mt-24"
        aria-labelledby="photo-map-heading"
      >
        <header class="mb-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p class="jp-section-label mb-2">其の一 · Footsteps</p>
            <h2
              id="photo-map-heading"
              class="font-jp text-2xl sm:text-3xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100"
            >踏跡 <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 ml-2 align-middle uppercase">Visited Places</span></h2>
          </div>
          <p class="jp-kansuji text-[0.7rem] tracking-[0.35em] text-stone-500 dark:text-stone-400 uppercase">{{ eventLocations.length }} locations · {{ totalPhotographyCount }} 葉</p>
        </header>
        <EventMap
          :events="eventLocations"
          :selected-event-name="filterState.selectedEvent"
          variant="compact"
          @focus-event="handleFocusEvent"
        />
        <div class="jp-hairline w-full mt-6"/>
      </section>

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

        <!-- 數位繪圖 - 策展開場 + Pinterest 風格瀑布流佈局 -->
        <div v-else-if="currentCategory === 'digital'">
          <!--
            策展開場：縦書き「繪」+ Statement +年度索引
            設計依據：design brief priority 4 — 補上電繪頁的「入口質感」，
                      避免從 controls 直接掉入大量瀑布流圖片。
          -->
          <GalleryDigitalIntro />
          <div class="max-w-7xl mx-auto">
            <GalleryMasonryLayout
              :items="digitalArtItems"
              :columns="4"
              :gap="16"
              @image-click="openImageViewer"
            />
          </div>
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
            @expand="scrollToEventTimeline"
          />

          <!--
            其の二 · 句 Statement（僅 overview 模式）
            原 一行斜插的「まだ、撮っている。」太孤立（design brief priority 2）。
            這版改為「章節節點」結構：左側縦書き章碼 + 中央句子 + ruby/譯註 + 兩端 hairline，
            讓 statement 成為地圖與精選之間的過場頁，而非散落 caption。
          -->
          <section
            v-if="!filterState.selectedEvent"
            class="max-w-3xl mx-auto px-6 mt-4 mb-12 md:mb-16 scroll-mt-24"
            aria-labelledby="photo-statement-heading"
          >
            <p class="jp-section-label text-center mb-5">其の二 · Artist Statement</p>
            <div class="relative flex items-center justify-center gap-6 md:gap-10">
              <!-- 左側 hairline -->
              <span class="hidden sm:block flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-stone-300/70 dark:to-stone-600/60" aria-hidden="true"/>
              <blockquote
                id="photo-statement-heading"
                lang="ja"
                class="font-jp text-xl sm:text-2xl md:text-[1.6rem] font-extralight tracking-[0.4em] text-stone-800 dark:text-stone-100 leading-[1.9] text-center"
              >
                まだ、<span class="inline-block mx-1"/>撮っている。
              </blockquote>
              <!-- 右側 hairline -->
              <span class="hidden sm:block flex-1 max-w-[80px] h-px bg-gradient-to-l from-transparent to-stone-300/70 dark:to-stone-600/60" aria-hidden="true"/>
            </div>
            <p class="text-center text-[0.7rem] tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500 mt-4">— Still, photographing.</p>
          </section>

          <!--
            其の三 · 精選 Selected — Horizontal Featured Strip（僅 overview 模式）
            放在地圖之後、時間軸之前：工具性（地圖） → 策展焦點（strip） → 全量（時間軸）
            桌機獨享（元件內 md:hidden）。
            上方加 editorial section header，承接 statement 的氣口、避免和 strip 內側欄重複信號。
          -->
          <header v-if="!filterState.selectedEvent" class="hidden md:flex max-w-7xl mx-auto px-6 mb-3 items-end justify-between gap-4 flex-wrap">
            <div>
              <p class="jp-section-label mb-2">其の三 · Selected</p>
              <h2 class="font-jp text-2xl sm:text-3xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100">精選 <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 ml-2 align-middle uppercase">Featured Series</span></h2>
            </div>
            <p class="jp-kansuji text-[0.7rem] tracking-[0.35em] text-stone-500 dark:text-stone-400 uppercase">Horizontal Cut</p>
          </header>
          <HorizontalStripFeatured v-if="!filterState.selectedEvent" />

          <!--
            其の四 · 時間軸 Timeline header — 僅 overview 模式顯示章節 header；
            event 模式下章節標題感由扉頁取代，timeline 直接展開以保留沉浸氣口。
          -->
          <header v-if="!filterState.selectedEvent" class="max-w-7xl mx-auto px-6 mt-12 md:mt-16 mb-8 md:mb-10">
            <div class="jp-hairline w-full mb-6"/>
            <div class="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p class="jp-section-label mb-2">其の四 · Timeline</p>
                <h2 class="font-jp text-2xl sm:text-3xl font-extralight tracking-[0.3em] text-stone-800 dark:text-stone-100">時間軸 <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 ml-2 align-middle uppercase">Chronicle</span></h2>
              </div>
              <p class="jp-kansuji text-[0.7rem] tracking-[0.35em] text-stone-500 dark:text-stone-400 uppercase">All by event</p>
            </div>
          </header>

          <!-- Timeline：兩種模式皆渲染；event 模式下扉頁的「展開全部」會 scroll 到此 -->
          <div ref="eventTimelineRef" :class="{ 'scroll-mt-24': filterState.selectedEvent }">
            <GalleryPhotographySection
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
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick, type ComponentPublicInstance } from 'vue'
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
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'
import GalleryMasonryLayout from '~/components/GalleryMasonryLayout.vue'
import GalleryPhotographySection from '~/components/gallery/GalleryPhotographySection.vue'
import GalleryEventCover from '~/components/gallery/GalleryEventCover.vue'
import HorizontalStripFeatured from '~/components/gallery/HorizontalStripFeatured.vue'
import GalleryDigitalIntro from '~/components/gallery/GalleryDigitalIntro.vue'
import GalleryControlMiniBar from '~/components/gallery/GalleryControlMiniBar.vue'
import EventMap from '~/components/EventMap.vue'
import ImageViewer from '~/components/ImageViewer.vue'

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
  filteredItems,
} = storeToRefs(galleryStore)

const {
  loadAllWorks,
  hydrateFromPayload,
  setSelectedEvent,
  setSearchQuery,
  setYearFilter,
} = galleryStore

const { getImagePath, getThumbPath } = useImagePath()

const { data: galleryPayload, pending: galleryPending, error: galleryPayloadError, refresh: refreshGalleryPayload } = await useAsyncData('gallery-works', async () => {
  // Key 必須叫 `photography` 才能對上 `hydrateFromPayload` 的 destructure；
  // 早期版本誤命名為 `photo`，導致 SSR 只灌到 digital，攝影仍為空，要靠 onMounted 補抓
  // (見下方 `if (digitalWorks.length === 0 || photographyWorks.length === 0) loadAllWorks()`)。
  // 修正 key 名後 SSR 就能完整填滿 store，事件頁的 `ImageGallery` JSON-LD 也才會帶 hasPart。
  const [digital, photography] = await Promise.all([fetchDigitalWorks(), fetchPhotographyWorks()])
  return { digital, photography }
})

watch(galleryPayload, (v) => {
  if (v) hydrateFromPayload(v)
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
    if (galleryPayload.value) {
      hydrateFromPayload(galleryPayload.value)
    } else {
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
const mapSectionRef = ref<HTMLElement | null>(null)
const showBackToMap = ref(false)
const showControlMiniBar = ref(false)

// ===== 計算屬性 =====
// 當前選擇的類別
const currentCategory = computed(() => filterState.value.selectedCategory)

// Gallery header dynamic info
// 2026-05-09：移除 'all'，labels 收斂為雙主線
const categoryLabel = computed(() => {
  const labels: Record<FilterState['selectedCategory'], string> = { digital: 'Digital Art', photography: 'Photography' }
  return labels[currentCategory.value]
})
const categoryCount = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length
  return photographyEventItems.value.reduce((sum, g) => sum + (g.images?.length || 0), 0)
})

// 攝影段落 Header 標示總葉數（與 categoryCount 一致；獨立 computed 以便其他段落引用）
const totalPhotographyCount = computed(() => photographyWorks.value.length)

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

/** 扉頁「展開全部」→ 平滑捲到 timeline；prefers-reduced-motion 改為瞬移 */
const scrollToEventTimeline = () => {
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

const handleFocusEvent = async (eventName: string) => {
  let target = eventRefs.value[eventName]

  // 若目標事件被篩選掉、不在 DOM 中，先切換到該事件再捲動
  if (!target && filterState.value.selectedEvent !== eventName) {
    setSelectedEvent(eventName)
    await nextTick()
    await nextTick() // 再等一幀，確保 ref 已設定
    target = eventRefs.value[eventName]
  }

  if (!target) return

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })

  focusedEventName.value = eventName
  if (focusTimer !== null) {
    window.clearTimeout(focusTimer)
  }
  focusTimer = window.setTimeout(() => {
    focusedEventName.value = null
  }, 900)
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

const scrollToControls = () => {
  if (!controlsSectionRef.value) return
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
  h1 {
    font-size: 2rem !important;
    line-height: 1.2;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 1.75rem !important;
  }
}
</style>
