<template>
    <!-- 圖片檢視器 -->
  <div v-if="viewerState.isOpen" class="fixed inset-0 z-[9999] bg-black bg-opacity-90 backdrop-blur-sm">
    <!-- 背景點擊關閉 -->
    <div @click="closeViewer" class="absolute inset-0"></div>

    <!-- 主要內容 -->
    <div class="relative w-full h-full flex items-center justify-center p-4">
      <!-- 頂部工具列 -->
      <div class="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <!-- 左側：圖片資訊 -->
        <div class="flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div class="text-white">
            <h3 class="font-medium">{{ currentImage?.title || '未命名' }}</h3>
            <p class="text-sm text-gray-300">
              {{ viewerState.currentIndex + 1 }} / {{ viewerState.images.length }}
            </p>
          </div>
        </div>

        <!-- 右側：操作按鈕 -->
        <div class="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-2 py-2">
          <!-- 縮放控制 -->
          <button
            @click="zoomOut"
            :disabled="viewerState.scale <= 0.5"
            class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="縮小 (Ctrl + -)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path>
            </svg>
          </button>

          <span class="text-white text-sm min-w-[60px] text-center">
            {{ Math.round(viewerState.scale * 100) }}%
          </span>

          <button
            @click="zoomIn"
            :disabled="viewerState.scale >= 5"
            class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="放大 (Ctrl + +)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
          </button>

          <!-- 重置縮放 -->
          <button
            @click="resetTransform"
            class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="重置縮放 (0)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>

          <!-- 全螢幕 -->
          <button
            @click="toggleFullscreen"
            class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="全螢幕 (F)"
          >
            <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v-4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5M15 15h4.5m0 0l-5.5 5.5"></path>
            </svg>
          </button>

          <!-- 關閉按鈕 -->
          <button
            @click="closeViewer"
            class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="關閉 (Esc)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- 主要圖片區域 -->
      <div ref="viewerRef" class="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img
          v-if="currentImage"
          ref="imageRef"
          :src="`/images/${currentImage.filename}`"
          :alt="currentImage.title"
          class="max-w-none transition-transform duration-200 ease-out select-none cursor-grab active:cursor-grabbing"
          :style="{
            transform: imageTransform,
            transformOrigin: 'center center'
          }"
          draggable="false"
          @click.stop
        />

        <!-- 載入中 -->
        <div v-if="!currentImage" class="absolute inset-0 flex items-center justify-center">
          <div class="text-white text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>載入中...</p>
          </div>
        </div>
      </div>

      <!-- 導航按鈕 -->
      <button
        v-if="viewerState.images.length > 1 && hasPrevious"
        @click="goToPrevious"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white rounded-full hover:bg-opacity-70 transition-colors"
        title="上一張 (←)"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>

      <button
        v-if="viewerState.images.length > 1 && hasNext"
        @click="goToNext"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white rounded-full hover:bg-opacity-70 transition-colors"
        title="下一張 (→)"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>

      <!-- 底部縮圖導航 -->
      <div
        v-if="viewerState.images.length > 1"
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2"
      >
        <div class="flex space-x-2 max-w-md overflow-x-auto">
          <button
            v-for="(image, index) in viewerState.images"
            :key="image.id"
            @click="goToIndex(index)"
            :class="[
              'flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all',
              index === viewerState.currentIndex
                ? 'border-white shadow-lg'
                : 'border-transparent hover:border-gray-400'
            ]"
          >
            <img
              :src="`/images/${image.filename}`"
              :alt="image.title"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageViewer } from '~/composables/useImageViewer'

// 使用 composable
const {
  viewerState,
  viewerRef,
  imageRef,
  isFullscreen,
  currentImage,
  hasPrevious,
  hasNext,
  imageTransform,
  closeViewer,
  goToPrevious,
  goToNext,
  goToIndex,
  resetTransform,
  zoomIn,
  zoomOut,
  toggleFullscreen
} = useImageViewer()
</script>

<style scoped>
/* 隱藏縮圖導航的滾動條 */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>