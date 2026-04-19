<template>
  <div>
    <div class="space-y-20 sm:space-y-32 max-w-7xl mx-auto px-0 sm:px-0">
      <GalleryTimelineItem
        v-for="(item, index) in items"
        :key="item.key"
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
          <GalleryMasonryLayout
            :items="item.images || []"
            @image-click="onImageClick"
          />
        </div>
      </GalleryTimelineItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GalleryItem, MixedPhotoItem } from '~~/shared/types/gallery'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import GalleryMasonryLayout from '~/components/GalleryMasonryLayout.vue'
import { useImageViewerStore } from '~/stores/imageViewer'

defineProps<{
  items: MixedPhotoItem[]
}>()

const imageViewerStore = useImageViewerStore()

const onImageClick = (img: GalleryItem, imgs: GalleryItem[]) => {
  imageViewerStore.openImageViewer(img, imgs)
}
</script>
