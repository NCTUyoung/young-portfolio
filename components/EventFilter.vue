<template>
  <div v-if="(filterState.selectedCategory === 'photography' || filterState.selectedCategory === 'digital') && availableEvents.length > 0" class="mb-8">
    <!-- Event Filter Buttons -->
    <div class="flex flex-wrap gap-3 mb-4">
      <button
        @click="setSelectedEvent(null)"
        :class="filterState.selectedEvent === null ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
        class="px-4 py-2 rounded-lg text-sm font-light transition-colors duration-200"
      >
        全部事件 ({{ currentWorks.length }})
      </button>
      <button
        v-for="event in availableEvents"
        :key="event.name"
        @click="setSelectedEvent(event.name)"
        :class="filterState.selectedEvent === event.name ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
        class="px-4 py-2 rounded-lg text-sm font-light transition-colors duration-200"
      >
        {{ event.name }} ({{ event.count }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
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

// 當切換到不支援事件的類別時，自動清除事件選擇
watch(() => filterState.value.selectedCategory, (newCategory) => {
  if (newCategory === 'all' && filterState.value.selectedEvent) {
    setSelectedEvent(null)
  }
})
</script>