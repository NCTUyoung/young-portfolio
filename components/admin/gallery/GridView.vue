<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
    <div
      v-for="(item, index) in group.items"
      :key="index"
      class="group relative bg-stone-100/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
      <div class="aspect-square">
        <img
          :src="getImagePath(item.filename)"
          :alt="item.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <!-- 編輯模式刪除按鈕 -->
      <div v-if="adminStore.editMode" class="absolute top-2 right-2 z-20 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        <button
          @click.stop="handleDeleteImage(item.filename, item.title)"
          class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
          title="刪除圖片"
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
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GalleryItem } from '~/types/gallery'
import { COLOR_CLASS_MAP } from '~/types/gallery'

interface Props {
  group: {
    eventName: string
    description: string
    location: string
    items: (GalleryItem | any)[]
  }
}

defineProps<Props>()

const adminStore = useAdminStore()
const { getImagePath } = useImagePath()

// 顏色樣式對應
const getColorClass = (color?: string) => {
  if (!color) return 'bg-gray-500'
  return COLOR_CLASS_MAP[color] || 'bg-gray-500'
}

// 刪除圖片處理
const handleDeleteImage = (filename: string, title: string) => {
  adminStore.showDeleteConfirm(filename, title)
}
</script>