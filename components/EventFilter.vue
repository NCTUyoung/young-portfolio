<template>
  <div v-if="(filterState.selectedCategory === 'photography' || filterState.selectedCategory === 'digital') && availableEvents.length > 0" class="mb-8">
    <!-- Event Filter Buttons -->
    <div class="flex flex-wrap gap-3 mb-4">
      <button
        @click="setSelectedEvent(null)"
        :class="filterState.selectedEvent === null
          ? 'bg-accent-600 dark:bg-accent-500 text-white'
          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-accent-300/60 dark:hover:border-accent-600/60 hover:text-accent-600 dark:hover:text-accent-400'"
        class="px-4 py-2 rounded-lg text-sm font-light transition-all duration-200"
      >
        全部事件 ({{ totalWorksInCategory }})
      </button>
      <button
        v-for="event in availableEvents"
        :key="event.name"
        @click="setSelectedEvent(event.name)"
        :class="filterState.selectedEvent === event.name
          ? 'bg-accent-600 dark:bg-accent-500 text-white'
          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-accent-300/60 dark:hover:border-accent-600/60 hover:text-accent-600 dark:hover:text-accent-400'"
        class="px-4 py-2 rounded-lg text-sm font-light transition-all duration-200"
      >
        {{ event.name }} ({{ event.count }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()
const {
  filterState,
  availableEvents,
  photographyWorks,
  digitalWorks,
  currentWorks
} = storeToRefs(galleryStore)
const { setSelectedEvent } = galleryStore

// 「全部事件」顯示的是目前類別的總作品數（不受事件篩選影響）
const totalWorksInCategory = computed(() => {
  if (filterState.value.selectedCategory === 'digital') {
    return digitalWorks.value.length
  }
  if (filterState.value.selectedCategory === 'photography') {
    return photographyWorks.value.length
  }
  // 理論上這個元件只在 digital / photography 類別下渲染
  return currentWorks.value.length
})

// 當切換到不支援事件的類別時，自動清除事件選擇
watch(() => filterState.value.selectedCategory, (newCategory) => {
  if (newCategory === 'all' && filterState.value.selectedEvent) {
    setSelectedEvent(null)
  }
})
</script>
