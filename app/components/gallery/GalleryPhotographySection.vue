<template>
  <!-- Desktop: width must be measured on the timeline *content* strip, not the outer max-w-7xl -->
  <div class="hidden md:block">
    <div class="space-y-32 max-w-7xl mx-auto">
      <div
        v-for="(item, index) in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        :class="[
          '[content-visibility:auto]',
          'scroll-mt-24',
          'transition-colors duration-500',
          focusedEventName === item.eventName
            ? 'bg-stone-100/60 dark:bg-stone-800/30 -mx-4 px-4 py-2 border-l border-accent-400/40 dark:border-accent-500/40'
            : ''
        ]"
      >
        <GalleryTimelineItem
          :index="index"
          :time-label="item.timeRange || ''"
          :event-info="item.eventInfo"
          :event-key="item.eventName || 'no-event'"
          :show-event-control="!!item.eventName"
          :show-event-info="!!item.eventName"
          :default-collapsed="index >= 2"
        >
          <div
            :ref="el => bindStripRef(item.key, el, 'desktop')"
            class="mb-12 w-full min-w-0 overflow-x-hidden"
          >
            <div class="mb-6">
              <h3 class="text-lg font-jp font-extralight text-stone-700 dark:text-stone-200 tracking-wider">
                {{ item.eventName || '其他作品' }}
              </h3>
              <p class="text-[0.65rem] text-stone-400 dark:text-stone-500 mt-1.5 font-light tracking-[0.3em] jp-kansuji">
                {{ item.images?.length || 0 }} <span class="text-stone-400 dark:text-stone-600">·</span> 作品
              </p>
            </div>

            <div class="flex flex-col" :style="{ gap: GAP_DESKTOP + 'px' }">
              <div
                v-for="(row, ri) in justifiedRowsDesktop(item.images || [], item.key)"
                :key="`d-${item.key}-${ri}`"
                class="flex w-full min-w-0 max-w-full flex-row flex-nowrap items-start justify-start"
                :style="{ gap: GAP_DESKTOP + 'px' }"
              >
                <div
                  v-for="(image, ci) in row.items"
                  :key="image.filename"
                  :class="[
                    'relative max-w-full shrink-0 overflow-hidden cursor-pointer group transition-[filter] duration-500 ease-out hover:brightness-105 motion-reduce:transition-none',
                    isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                  ]"
                  :style="{ width: `${row.widths[ci]}px`, height: `${row.height}px` }"
                  @click="openImageViewer(image, item.images || [])"
                >
                  <!--
                    `<picture class="contents">` 讓 layout 透明化，flex/grid 仍以 `<img>` 當 direct child。
                    AVIF 未產出時瀏覽器自動 fallback 到 WebP `<source>`，再到 `<img>.src`，不會影響畫面。
                  -->
                  <picture class="contents">
                    <source
                      :srcset="getGridAvifSrcset(image.filename)"
                      :sizes="gridImageSizes"
                      type="image/avif"
                    >
                    <source
                      :srcset="getGridImageSrcset(image.filename)"
                      :sizes="gridImageSizes"
                      type="image/webp"
                    >
                    <img
                      :src="getThumbPath(image.filename, 800)"
                      :srcset="getGridImageSrcset(image.filename)"
                      :sizes="gridImageSizes"
                      :alt="image.title"
                      class="h-full w-full object-cover align-top"
                      loading="lazy"
                      decoding="async"
                      @load="onImgLoad(image.filename, $event)"
                    >
                  </picture>
                  <!-- Hover overlay — 墨色和紙、jp-eyebrow 風 -->
                  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:pointer-events-auto group-hover:opacity-100 flex flex-col justify-end p-3 motion-reduce:transition-none">
                    <h4 class="text-stone-100 text-sm font-jp font-light tracking-wider mb-1.5 truncate">{{ image.title || '未命名' }}</h4>
                    <div class="text-stone-300 text-xs space-y-1 font-light">
                      <div v-if="image.camera || image.model" class="flex items-center gap-2 tracking-[0.15em]">
                        <span aria-hidden="true" class="font-jp text-[0.7rem] tracking-[0.4em] text-stone-400">CAM</span>
                        <span class="truncate">{{ image.camera }} {{ image.model }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-stone-400 jp-kansuji">
                        <span v-if="image.aperture">f/{{ image.aperture }}</span>
                        <span v-if="image.shutterSpeed">{{ formatShutterSpeed(image.shutterSpeed) }}</span>
                        <span v-if="image.iso">ISO {{ image.iso }}</span>
                        <span v-if="image.focalLength">{{ image.focalLength }}mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- R34/R35：摺合時章封 cover — 章節編號 + 章名 + 章首詩 + 縮圖（R35 升級 layout） -->
          <template #cover>
            <button
              type="button"
              class="chapter-cover-btn group w-full text-left"
              :aria-label="`展開 ${item.eventName || ''} 章節作品`"
              @click="item.eventName && toggleExpand(item.eventName)"
            >
              <div class="chapter-cover-grid">
                <div class="chapter-cover-thumb">
                  <!-- Skeleton placeholder while loading -->
                  <div class="chapter-cover-thumb__skeleton" aria-hidden="true"/>
                  <img
                    v-if="item.images?.[0]?.filename"
                    :src="getThumbPath(item.images[0].filename, 400)"
                    :alt="`${item.eventName} 章封`"
                    loading="lazy"
                    decoding="async"
                    :class="['chapter-cover-thumb__img', { 'is-loaded': isImageLoaded(item.images[0].filename) }]"
                    @load="onImgLoad(item.images[0].filename, $event)"
                  >
                  <span class="chapter-cover-thumb__seal" aria-hidden="true">{{ item.images?.length || 0 }}</span>
                </div>
                <div class="chapter-cover-meta">
                  <p class="chapter-cover-index">其の {{ formatKansuji(index + 1) }}</p>
                  <h3 class="chapter-cover-title font-jp">
                    {{ item.eventName || '其他作品' }}
                  </h3>
                  <p v-if="getEventCaption(item)" class="chapter-cover-strongest">
                    「{{ getEventCaption(item) }}」
                  </p>
                  <p class="chapter-cover-cta">
                    <span class="chapter-cover-cta__line" aria-hidden="true"/>
                    <span>展開全部</span>
                    <span class="chapter-cover-cta__arrow" aria-hidden="true">→</span>
                  </p>
                </div>
              </div>
            </button>
          </template>
        </GalleryTimelineItem>
      </div>
    </div>
  </div>

  <!-- Mobile（R34：接 fold 機制；前 2 個展開、其餘預設摺合） -->
  <div class="md:hidden block">
    <div class="space-y-10">
      <div
        v-for="(item, mIdx) in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        class="[content-visibility:auto] scroll-mt-24"
      >
        <button
          v-if="item.eventName"
          type="button"
          class="mobile-event-header w-full text-left"
          :aria-label="`${isMobileExpanded(item, mIdx) ? '摺合' : '展開'} ${item.eventName} 章節`"
          :aria-expanded="isMobileExpanded(item, mIdx)"
          @click="item.eventName && toggleExpand(item.eventName)"
        >
          <div class="flex items-baseline justify-between gap-2">
            <h3 class="text-base font-jp font-extralight text-stone-700 dark:text-stone-200 tracking-wider">
              {{ item.eventName }}
            </h3>
            <span class="text-[0.7rem] text-stone-400 jp-kansuji">
              {{ isMobileExpanded(item, mIdx) ? '−' : '+' }}
            </span>
          </div>
          <p class="text-[0.65rem] text-stone-400 dark:text-stone-500 mt-1 font-light tracking-[0.3em] jp-kansuji">
            {{ item.images?.length || 0 }} <span class="text-stone-400 dark:text-stone-600">·</span> 作品
          </p>
          <p v-if="!isMobileExpanded(item, mIdx) && getEventCaption(item)" class="mt-2 text-[0.78rem] leading-relaxed text-stone-500 dark:text-stone-400">
            {{ getEventCaption(item) }}
          </p>
        </button>
        <div
          v-if="isMobileExpanded(item, mIdx)"
          :ref="el => bindStripRef(item.key, el, 'mobile')"
          class="w-full min-w-0 overflow-x-hidden mt-4"
        >
          <div class="flex flex-col" :style="{ gap: GAP_MOBILE + 'px' }">
            <div
              v-for="(row, ri) in justifiedRowsMobile(item.images || [], item.key)"
              :key="`m-${item.key}-${ri}`"
              class="flex w-full min-w-0 max-w-full flex-row flex-nowrap items-start justify-start"
              :style="{ gap: GAP_MOBILE + 'px' }"
            >
              <div
                v-for="(image, ci) in row.items"
                :key="image.filename"
                :class="[
                  'relative max-w-full shrink-0 overflow-hidden cursor-pointer group active:opacity-80 transition-opacity duration-200',
                  isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                ]"
                :style="{ width: `${row.widths[ci]}px`, height: `${row.height}px` }"
                @click="openImageViewer(image, item.images || [])"
              >
                <picture class="contents">
                  <source
                    :srcset="getGridAvifSrcset(image.filename)"
                    :sizes="gridImageSizes"
                    type="image/avif"
                  >
                  <source
                    :srcset="getGridImageSrcset(image.filename)"
                    :sizes="gridImageSizes"
                    type="image/webp"
                  >
                  <img
                    :src="getThumbPath(image.filename, 800)"
                    :srcset="getGridImageSrcset(image.filename)"
                    :sizes="gridImageSizes"
                    :alt="image.title"
                    class="h-full w-full object-cover align-top"
                    loading="lazy"
                    decoding="async"
                    @load="onImgLoad(image.filename, $event)"
                  >
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, type ComponentPublicInstance } from 'vue'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'
import { formatShutterSpeed } from '~/utils/formatters'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGalleryStore } from '~/stores/gallery'
import { computeJustifiedRows, DEFAULT_ASPECT_RATIO } from '~/utils/justifiedGalleryLayout'

const galleryStore = useGalleryStore()

/** 給章封展開按鈕用 — 同 GalleryTimelineItem 的 toggleGroupExpansion */
function toggleExpand (eventName: string) {
  galleryStore.toggleGroupExpansion(eventName)
}

/**
 * Mobile timeline 預設摺合邏輯 — 與 desktop 對齊（前 2 個展開、其餘摺合）
 * 沒有 eventName 的散圖一律展開
 */
function isMobileExpanded (item: MixedPhotoItem, idx: number): boolean {
  if (!item.eventName) return true
  const state = galleryStore.expandedGroups[item.eventName]
  if (state === undefined) return idx < 2
  return state
}

/** 1~12 → 一/二/三/四/.../十二 漢數字 */
const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function formatKansuji (n: number): string {
  return KANSUJI[n] || String(n)
}

/**
 * 章封 caption 來源（R35 優先序）：
 *   1. strongest_line（章首詩，≤24 字，editorial 精煉）
 *   2. annotation（fallback，截 36 字）
 *   3. prologue / narrative（更次 fallback）
 */
function getEventCaption (item: MixedPhotoItem): string | null {
  const sn = (item.images?.[0] as { seriesNarrative?: SeriesNarrative } | undefined)?.seriesNarrative
  if (sn?.strongest_line && sn.strongest_line.trim()) return sn.strongest_line
  const text = sn?.annotation || sn?.prologue || sn?.narrative
  if (!text) return null
  if (text.length > 36) return text.slice(0, 36) + '…'
  return text
}

/**
 * ResizeObserver debounce：視窗拖拉時每毫秒都會觸發 RO，
 * 一次 resize 可能連續觸發上百次 justified layout 重算 → 主執行緒抖動。
 * 用 rAF 合併到下一幀只算一次。
 */
function rafDebounce (fn: () => void): () => void {
  let scheduled = false
  return () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      fn()
    })
  }
}

const props = defineProps<{
  items: MixedPhotoItem[]
  focusedEventName: string | null
  /** Parent keeps event DOM refs for map → scroll focus */
  registerEventRef: (name: string | null, el: Element | ComponentPublicInstance | null) => void
}>()

const GAP_DESKTOP = 12
const GAP_MOBILE = 8
const IDEAL_ROW_DESKTOP = 220
const IDEAL_ROW_MOBILE = 180
const FALLBACK_WIDTH_DESKTOP = 1200
const FALLBACK_WIDTH_MOBILE = 360

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset, gridImageSizes } = useImagePath()
const imageViewerStore = useImageViewerStore()

/** Measured width of the actual gallery column (inside timeline content slot) */
const stripWidthDesktop = ref<Record<string, number>>({})
const stripWidthMobile = ref<Record<string, number>>({})

const aspectRatios = ref<Record<string, number>>({})

const loadedPhotographyImages = ref<Record<string, boolean>>({})

const resizeObservers = new Map<string, ResizeObserver>()

function resolveEl (el: Element | ComponentPublicInstance | null): HTMLElement | null {
  if (!el) return null
  if (el instanceof HTMLElement) return el
  const v = el as ComponentPublicInstance
  return v.$el instanceof HTMLElement ? v.$el : null
}

function bindStripRef (
  key: string,
  el: Element | ComponentPublicInstance | null,
  mode: 'desktop' | 'mobile'
) {
  const mapKey = `${mode}:${key}`
  resizeObservers.get(mapKey)?.disconnect()
  resizeObservers.delete(mapKey)

  const html = resolveEl(el)
  if (!html) return

  const apply = () => {
    const w = Math.round(html.clientWidth)
    if (w <= 0) return
    if (mode === 'desktop') {
      const prev = stripWidthDesktop.value[key]
      if (prev === w) return
      stripWidthDesktop.value = { ...stripWidthDesktop.value, [key]: w }
    } else {
      const prev = stripWidthMobile.value[key]
      if (prev === w) return
      stripWidthMobile.value = { ...stripWidthMobile.value, [key]: w }
    }
  }

  const ro = new ResizeObserver(rafDebounce(apply))
  ro.observe(html)
  resizeObservers.set(mapKey, ro)
  apply()
}

onBeforeUnmount(() => {
  resizeObservers.forEach(o => o.disconnect())
  resizeObservers.clear()
})

function ratioOf (filename: string): number {
  return aspectRatios.value[filename] ?? DEFAULT_ASPECT_RATIO
}

function justifiedRowsDesktop (images: GalleryItem[], eventKey: string) {
  const w = stripWidthDesktop.value[eventKey] ?? FALLBACK_WIDTH_DESKTOP
  return computeJustifiedRows(
    images,
    ratioOf,
    w,
    GAP_DESKTOP,
    IDEAL_ROW_DESKTOP
  )
}

function justifiedRowsMobile (images: GalleryItem[], eventKey: string) {
  const w = stripWidthMobile.value[eventKey] ?? FALLBACK_WIDTH_MOBILE
  return computeJustifiedRows(
    images,
    ratioOf,
    w,
    GAP_MOBILE,
    IDEAL_ROW_MOBILE
  )
}

function onImgLoad (filename: string, ev: Event) {
  const el = ev.target as HTMLImageElement
  if (el.naturalWidth > 0 && el.naturalHeight > 0) {
    const next = el.naturalWidth / el.naturalHeight
    const prev = aspectRatios.value[filename]
    if (prev === undefined || Math.abs(prev - next) > 1e-5) {
      aspectRatios.value = { ...aspectRatios.value, [filename]: next }
    }
  }
  if (!loadedPhotographyImages.value[filename]) {
    loadedPhotographyImages.value = { ...loadedPhotographyImages.value, [filename]: true }
  }
}

const isImageLoaded = (filename: string) => {
  return !!loadedPhotographyImages.value[filename]
}

const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}
</script>

<style scoped>
/* ===== R34 章封 chapter-cover（摺合事件視覺） ===== */
.chapter-cover-btn {
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  width: 100%;
  transition: opacity 0.3s ease;
}
.chapter-cover-btn:hover { opacity: 0.92; }
.chapter-cover-btn:focus-visible {
  outline: 1px solid rgb(217 123 46 / 0.5);
  outline-offset: 4px;
}
.chapter-cover-grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  padding: 1.6rem 0;
  align-items: center;
  border-top: 1px solid rgb(168 162 158 / 0.2);
  border-bottom: 1px solid rgb(168 162 158 / 0.2);
}
.chapter-cover-thumb {
  width: 220px;
  height: 160px;
  overflow: hidden;
  background: rgb(245 244 240);
  border: 1px solid rgb(168 162 158 / 0.18);
  position: relative;
}
:global(.dark) .chapter-cover-thumb {
  background: rgb(28 25 23);
  border-color: rgb(120 113 108 / 0.32);
}
/* Skeleton placeholder — R36：避免 loading 灰塊刺眼 */
.chapter-cover-thumb__skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    rgb(245 244 240) 30%,
    rgb(231 229 228) 50%,
    rgb(245 244 240) 70%
  );
  background-size: 200% 100%;
  animation: chapter-cover-shimmer 2.4s ease-in-out infinite;
}
:global(.dark) .chapter-cover-thumb__skeleton {
  background: linear-gradient(
    100deg,
    rgb(41 37 36) 30%,
    rgb(68 64 60) 50%,
    rgb(41 37 36) 70%
  );
  background-size: 200% 100%;
}
@keyframes chapter-cover-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .chapter-cover-thumb__skeleton { animation: none; }
}

.chapter-cover-thumb__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92);
  opacity: 0;
  transition: opacity 0.45s ease, filter 0.4s ease, transform 0.6s ease;
}
.chapter-cover-thumb__img.is-loaded {
  opacity: 1;
}
.chapter-cover-btn:hover .chapter-cover-thumb__img.is-loaded {
  filter: saturate(1.05);
  transform: scale(1.02);
}
/* 縮圖右下角朱印標葉數 */
.chapter-cover-thumb__seal {
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgb(217 123 46 / 0.92);
  color: rgb(250 250 249);
  font-family: 'Noto Serif JP', serif;
  font-weight: 300;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.55rem;
  line-height: 1.4;
}

.chapter-cover-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.chapter-cover-index {
  margin: 0;
  font-size: 0.65rem;
  letter-spacing: 0.42em;
  color: rgb(217 123 46 / 0.85);
  text-transform: uppercase;
  font-family: 'Noto Serif JP', serif;
}
.chapter-cover-title {
  font-size: 1.55rem;
  font-weight: 200;
  letter-spacing: 0.16em;
  color: rgb(68 64 60);
  margin: 0;
  line-height: 1.3;
}
:global(.dark) .chapter-cover-title { color: rgb(231 229 228); }

/* 章首詩 — strongest_line 用 mincho 包引號顯示 */
.chapter-cover-strongest {
  margin: 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.02rem;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
  font-weight: 300;
  max-width: 32rem;
}
:global(.dark) .chapter-cover-strongest {
  color: rgb(168 162 158);
}

.chapter-cover-cta {
  margin: 0.5rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.65rem;
  letter-spacing: 0.4em;
  color: rgb(217 123 46);
  text-transform: uppercase;
  font-weight: 300;
}
.chapter-cover-cta__line {
  display: inline-block;
  width: 32px;
  height: 1px;
  background: rgb(217 123 46 / 0.55);
  transition: width 0.3s ease;
}
.chapter-cover-cta__arrow {
  display: inline-block;
  transition: transform 0.3s ease;
}
.chapter-cover-btn:hover .chapter-cover-cta__arrow { transform: translateX(4px); }
.chapter-cover-btn:hover .chapter-cover-cta__line { width: 48px; }

@media (max-width: 1023px) {
  .chapter-cover-grid {
    grid-template-columns: 160px 1fr;
    gap: 1.2rem;
    padding: 1.1rem 0;
  }
  .chapter-cover-thumb { width: 160px; height: 110px; }
  .chapter-cover-title { font-size: 1.3rem; }
  .chapter-cover-strongest { font-size: 0.9rem; }
}

/* ===== R34 mobile header button affordance ===== */
.mobile-event-header {
  background: transparent;
  border: 0;
  padding: 0.4rem 0;
  cursor: pointer;
  display: block;
  border-top: 1px solid rgb(168 162 158 / 0.18);
  padding-top: 0.85rem;
}
.mobile-event-header:focus-visible {
  outline: 1px solid rgb(217 123 46 / 0.5);
  outline-offset: 4px;
}
</style>
