<template>
  <div class="flex space-x-8 mb-8">
    <button
      @click="setSelectedCategory('digital')"
      :class="filterState.selectedCategory === 'digital' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'"
      class="pb-2 font-light tracking-wide transition-colors duration-200"
    >
      數位繪圖 ({{ categoryStats.digital }})
    </button>
    <button
      @click="setSelectedCategory('photography')"
      :class="filterState.selectedCategory === 'photography' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'"
      class="pb-2 font-light tracking-wide transition-colors duration-200"
    >
      攝影作品 ({{ categoryStats.photography }})
    </button>
    <button
      @click="setSelectedCategory('all')"
      :class="filterState.selectedCategory === 'all' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'"
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