<template>
  <div class="flex space-x-8 mb-8">
    <button
      @click="setSelectedCategory('digital')"
      :class="filterState.selectedCategory === 'digital' ? 'border-b-2 border-accent-500 dark:border-accent-400 text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400'"
      class="pb-2 font-light tracking-wide transition-colors duration-200"
    >
      數位繪圖 ({{ categoryStats.digital }})
    </button>
    <button
      @click="setSelectedCategory('photography')"
      :class="filterState.selectedCategory === 'photography' ? 'border-b-2 border-accent-500 dark:border-accent-400 text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400'"
      class="pb-2 font-light tracking-wide transition-colors duration-200"
    >
      攝影作品 ({{ categoryStats.photography }})
    </button>
    <button
      @click="setSelectedCategory('all')"
      :class="filterState.selectedCategory === 'all' ? 'border-b-2 border-accent-500 dark:border-accent-400 text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400'"
      class="pb-2 font-light tracking-wide transition-colors duration-200"
    >
      全部作品 ({{ categoryStats.all }})
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()
const { filterState, categoryStats } = storeToRefs(galleryStore)
const { setSelectedCategory } = galleryStore
</script>
