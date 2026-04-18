<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
    <div
      v-for="(item, index) in group.items"
      :key="index"
      class="group relative bg-stone-100/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
      <div class="aspect-square">
        <img
          :src="getThumbPath(item.filename, 800)"
          :srcset="getGridImageSrcset(item.filename)"
          :sizes="gridImageSizes"
          :alt="item.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        >
      </div>
      <!-- 編輯模式：操作鍵走 stone（編輯）+ 赤陶 accent（刪除語義）替代原本藍紅鮮色，
           以符合 design-aesthetic「色點稀有化」「黑白灰 + 一點赤陶」「Hairline > 粗線」。
           icon 顏色用 currentColor；hover 時才顯真實色塊底，平時維持毛玻璃低調。 -->
      <div v-if="adminStore.editMode" class="absolute top-2 right-2 z-20 opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1">
        <button
          class="p-2 rounded-full border border-stone-300/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition-colors duration-200 hover:border-stone-500 hover:text-stone-900 dark:border-stone-600/70 dark:bg-stone-900/70 dark:text-stone-200 dark:hover:border-stone-300 dark:hover:text-stone-50"
          title="編輯圖片"
          @click.stop="handleEditImage(item)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          class="p-2 rounded-full border border-accent-400/70 bg-white/85 text-accent-700 shadow-sm backdrop-blur transition-colors duration-200 hover:border-accent-600 hover:text-accent-800 dark:border-accent-500/60 dark:bg-stone-900/70 dark:text-accent-300 dark:hover:border-accent-300 dark:hover:text-accent-200"
          title="刪除圖片"
          @click.stop="handleDeleteImage(item.filename, item.title)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 懸浮資訊 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
        <div class="w-full p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h4 class="text-sm font-light truncate mb-1">{{ item.title }}</h4>
          <p class="text-xs opacity-80 truncate mb-2">{{ item.content }}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs opacity-70 font-light">{{ item.time }}</span>
            <div v-if="adminStore.manageCategory === 'photography' && (item as any).camera" class="text-xs opacity-80">
              {{ (item as any).camera }}
            </div>
            <div v-else-if="adminStore.manageCategory === 'gallery'" class="flex items-center space-x-1">
              <span
                :class="[
                  'inline-block w-3 h-3 rounded-full border border-white/30',
                  getColorClass((item as GalleryItem).color || 'blue')
                ]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GalleryItem } from '~~/shared/types/gallery'
import { COLOR_CLASS_MAP } from '~~/shared/types/gallery'

interface Props {
  group: {
    eventName: string
    description: string
    location: string
    items: GalleryItem[]
  }
}

defineProps<Props>()

const adminStore = useAdminStore()
const { getThumbPath, getGridImageSrcset, gridImageSizes } = useImagePath()

// 顏色樣式對應
const getColorClass = (color?: string) => {
  if (!color) return 'bg-gray-500'
  return COLOR_CLASS_MAP[color] || 'bg-gray-500'
}

// 刪除圖片處理
const handleDeleteImage = (filename: string, title: string) => {
  adminStore.showDeleteConfirm(filename, title)
}

// 編輯圖片處理
const handleEditImage = (item: GalleryItem) => {
  adminStore.startEditImage(item)
}
</script>