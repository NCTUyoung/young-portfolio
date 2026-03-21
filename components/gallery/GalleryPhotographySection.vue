<template>
  <!-- Desktop -->
  <div class="hidden md:block">
    <div class="space-y-32 max-w-6xl mx-auto">
      <div
        v-for="(item, index) in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        :class="[
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
          <div class="mb-12">
            <div class="mb-6">
              <h3 class="text-lg font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
                {{ item.eventName || '其他作品' }}
              </h3>
              <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
            </div>

            <div class="space-y-3">
              <div
                v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                :key="`row-${rowIdx}`"
                class="flex gap-3"
                :style="{ height: getRowHeight(rowIdx, index) }"
              >
                <div
                  v-for="(image, imgIdx) in rowImages"
                  :key="image.filename"
                  :class="[
                    getImageWidth(imgIdx, rowIdx, index),
                    'relative rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300',
                    isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                  ]"
                  @click="openImageViewer(image, item.images || [])"
                >
                  <img
                    :src="getImagePath(image.filename)"
                    :alt="image.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                    @load="markImageLoaded(image.filename)"
                  >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
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
      <div v-for="item in items" :key="item.key">
        <div v-if="item.eventName" class="mb-4">
          <h3 class="text-base font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
            {{ item.eventName }}
          </h3>
          <p class="text-xs text-stone-400 dark:text-stone-500 font-light">{{ item.images?.length || 0 }} 張作品</p>
        </div>
        <div class="space-y-2">
          <div
            v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
            :key="`row-${rowIdx}`"
            class="flex gap-2"
            style="height: 150px"
          >
            <div
              v-for="image in rowImages"
              :key="image.filename"
              :class="[
                'flex-1 rounded-lg overflow-hidden cursor-pointer group active:scale-95 transition-all duration-200 relative',
                isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
              ]"
              @click="openImageViewer(image, item.images || [])"
            >
              <img
                :src="getImagePath(image.filename)"
                :alt="image.title"
                class="w-full h-full object-cover"
                loading="lazy"
                @load="markImageLoaded(image.filename)"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue'
import type { GalleryItem, MixedPhotoItem } from '~/types/gallery'
import { formatShutterSpeed } from '~/utils/formatters'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import { useGalleryPhotographyLayout } from '~/composables/useGalleryPhotographyLayout'
import { useImageViewerStore } from '~/stores/imageViewer'

const props = defineProps<{
  items: MixedPhotoItem[]
  focusedEventName: string | null
  /** Parent keeps event DOM refs for map → scroll focus */
  registerEventRef: (name: string | null, el: Element | ComponentPublicInstance | null) => void
}>()

const { getImageRows, getRowHeight, getImageWidth } = useGalleryPhotographyLayout()
const { getImagePath } = useImagePath()
const imageViewerStore = useImageViewerStore()

const loadedPhotographyImages = ref<Record<string, boolean>>({})

const markImageLoaded = (filename: string) => {
  loadedPhotographyImages.value[filename] = true
}

const isImageLoaded = (filename: string) => {
  return !!loadedPhotographyImages.value[filename]
}

const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}
</script>
