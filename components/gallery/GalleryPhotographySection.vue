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
            ? 'bg-amber-50/40 dark:bg-amber-900/10 rounded-2xl -mx-4 px-4 py-2'
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
        >
          <div
            :ref="el => bindStripRef(item.key, el, 'desktop')"
            class="mb-12 w-full min-w-0 overflow-x-hidden"
          >
            <div class="mb-6">
              <h3 class="text-lg font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
                {{ item.eventName || '其他作品' }}
              </h3>
              <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
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
                    'relative max-w-full shrink-0 overflow-hidden rounded-lg cursor-pointer group hover:shadow-lg transition-all duration-300',
                    isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                  ]"
                  :style="{ width: `${row.widths[ci]}px`, height: `${row.height}px` }"
                  @click="openImageViewer(image, item.images || [])"
                >
                  <img
                    :src="getThumbPath(image.filename, 800)"
                    :srcset="getGridImageSrcset(image.filename)"
                    :sizes="gridImageSizes"
                    :alt="image.title"
                    class="h-full w-full object-cover align-top group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                    loading="lazy"
                    decoding="async"
                    @load="onImgLoad(image.filename, $event)"
                  >
                  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 flex flex-col justify-end p-3">
                    <h4 class="text-white text-sm font-light mb-2 truncate">{{ image.title || '未命名' }}</h4>
                    <div class="text-white/80 text-xs space-y-1 font-light">
                      <div v-if="image.camera || image.model" class="flex items-center gap-2">
                        <svg class="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span>{{ image.camera }} {{ image.model }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-white/70">
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
        </GalleryTimelineItem>
      </div>
    </div>
  </div>

  <!-- Mobile -->
  <div class="md:hidden block">
    <div class="space-y-12">
      <div
        v-for="item in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        class="[content-visibility:auto] scroll-mt-24"
      >
        <div v-if="item.eventName" class="mb-4">
          <h3 class="text-base font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
            {{ item.eventName }}
          </h3>
          <p class="text-xs text-stone-400 dark:text-stone-500 font-light">{{ item.images?.length || 0 }} 張作品</p>
        </div>
        <div
          :ref="el => bindStripRef(item.key, el, 'mobile')"
          class="w-full min-w-0 overflow-x-hidden"
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
                  'relative max-w-full shrink-0 overflow-hidden rounded-lg cursor-pointer group active:scale-[0.99] transition-transform duration-200',
                  isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                ]"
                :style="{ width: `${row.widths[ci]}px`, height: `${row.height}px` }"
                @click="openImageViewer(image, item.images || [])"
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
import type { GalleryItem, MixedPhotoItem } from '~/types/gallery'
import { formatShutterSpeed } from '~/utils/formatters'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import { useImageViewerStore } from '~/stores/imageViewer'
import { computeJustifiedRows, DEFAULT_ASPECT_RATIO } from '~/utils/justifiedGalleryLayout'

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

const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()
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

  const ro = new ResizeObserver(apply)
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
