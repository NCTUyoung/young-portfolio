<template>
  <div class="space-y-3">
    <div
      v-for="(item, index) in group.items"
      :key="index"
      class="flex items-center space-x-5 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 hover:shadow-sm transition-all duration-200 border border-stone-200/30"
    >
      <img
        :src="getImagePath(item.filename)"
        :alt="item.title"
        class="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
        loading="lazy"
      />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-light text-stone-800 truncate mb-1">{{ item.title }}</h4>
        <p class="text-sm text-stone-600 truncate mb-2">{{ item.content }}</p>
        <div class="flex items-center space-x-4">
          <span class="text-xs text-stone-400 font-light">{{ item.time }}</span>
          <span class="text-xs text-stone-400 font-light">{{ item.filename }}</span>
        </div>
      </div>
      <div class="flex-shrink-0 flex items-center space-x-3">
        <div v-if="adminStore.manageCategory === 'photography' && (item as any).camera" class="text-right">
          <div class="text-xs text-stone-600 font-light mb-1">{{ (item as any).camera }}</div>
          <div v-if="(item as any).tags" class="text-xs text-amber-600 font-light">
            {{ Array.isArray((item as any).tags) ? (item as any).tags.join(' ・ ') : (item as any).tags }}
          </div>
        </div>
        <div v-else-if="adminStore.manageCategory === 'gallery'" class="flex items-center">
          <span
            :class="[
              'inline-block w-4 h-4 rounded-full border border-stone-300/50 shadow-sm',
              getColorClass((item as GalleryItem).color || 'blue')
            ]"
          ></span>
        </div>

        <!-- 編輯模式刪除按鈕 -->
        <button
          v-if="adminStore.editMode"
          @click.stop="handleDeleteImage(item.filename, item.title)"
          class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
          title="刪除圖片"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
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