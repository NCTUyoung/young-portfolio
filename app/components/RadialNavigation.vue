<template>
  <!-- 放射型輪盤縮圖導航 -->
  <div
v-if="viewerImages.length > 1"
       class="radial-cluster fixed bottom-4 z-30 sm:bottom-8"
       :style="{ left: radialClusterLeft }">
    <div class="relative">
      <!-- 放射型縮圖 -->
      <div class="relative">
        <button
v-for="visibleImage in getVisibleRadialImages"
                :key="visibleImage.id"
                :style="{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${posMap[visibleImage.originalIndex]?.x || 0}px, ${posMap[visibleImage.originalIndex]?.y || 0}px)`,
                  opacity: visibleImage.originalIndex === currentImageIndex ? 1 : (isTransitioning && visibleImage.originalIndex === previousImageIndex ? 0 : 0.7),
                  zIndex: visibleImage.originalIndex === currentImageIndex ? 30 : 20,
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.3s ease'
                }"
                :class="[
                  'radial-thumb rounded-full border overflow-hidden bg-stone-900/70 hover:scale-105 transition-all duration-300 backdrop-blur-md',
                  visibleImage.originalIndex === currentImageIndex
                    ? 'border-stone-100/80'
                    : 'border-stone-600/30 hover:border-stone-200/60'
                ]"
                :title="`${visibleImage.title} (${visibleImage.originalIndex + 1}/${viewerImages.length})`"
                @click="selectRadialImage(visibleImage.originalIndex)">
          <!-- 縮圖圖片 -->
          <img :src="getThumbPath(visibleImage.filename ?? '', 400)" :alt="visibleImage.title" class="w-full h-full object-cover" decoding="async" loading="lazy">
        </button>
      </div>

      <!-- 中心控制按鈕 — 墨色小印，細邊無陰影 -->
      <button class="radial-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-stone-900/75 backdrop-blur-md rounded-full border border-stone-500/30 hover:border-stone-300/60 hover:bg-stone-800/85 transition-all duration-200 flex items-center justify-center z-40" @click="handleCenterButtonClick">
        <div class="text-stone-100 text-[0.65rem] sm:text-xs font-jp font-light leading-tight jp-kansuji tabular-nums">
          <div>{{ currentImageIndex + 1 }}</div>
          <div class="text-stone-500">／{{ viewerImages.length }}</div>
        </div>
      </button>

      <!-- 圖片過多指示器 -->
      <div v-if="viewerImages.length > 7" class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-stone-900/70 backdrop-blur-sm px-3 py-1 text-stone-300 text-[0.65rem] tracking-[0.25em] font-light border border-stone-700/50">
        {{ getVisibleRadialImages.length }}/{{ viewerImages.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useImageViewerStore } from '~/stores/imageViewer'

const imageViewerStore = useImageViewerStore()
const isDesktopRadialLayout = useMediaQuery('(min-width: 768px)')
const { getThumbPath } = useImagePath()
const {
  viewerImages,
  currentImageIndex,
  previousImageIndex,
  isTransitioning,
  posMap,
  animating,
  showInfoPanel,
  infoPanelWidth,
  getVisibleRadialImages
} = storeToRefs(imageViewerStore)

const radialClusterLeft = computed(() => {
  if (!showInfoPanel.value || !isDesktopRadialLayout.value) return '50%'
  return `calc(50% - ${infoPanelWidth.value / 2}px)`
})

const {
  selectRadialImage,
  handleCenterButtonClick,
  updatePosMap
} = imageViewerStore

// 監聽圖片索引變化
watch(currentImageIndex, (val) => {
  if (!animating.value) updatePosMap(val)
})

// 監聽圖片列表變化
watch(viewerImages, () => updatePosMap(currentImageIndex.value))

// 初始化位置映射
onMounted(() => {
  updatePosMap(currentImageIndex.value)
})
</script>

<style scoped>
/* Radial cluster：手機縮小以讓出主圖空間（scale 會同步作用於 transform 位置） */
.radial-cluster {
  transform: translateX(-50%) scale(0.7);
  transform-origin: bottom center;
}
@media (min-width: 640px) {
  .radial-cluster {
    transform: translateX(-50%) scale(1);
  }
}

/* 放射縮圖 — 保持 40px 視覺大小（手機實際佔 28px 因 scale） */
.radial-thumb {
  width: 40px;
  height: 40px;
}

/* 中心鈕 — 手機略小，桌面原樣 */
.radial-center {
  width: 48px;
  height: 48px;
}
@media (min-width: 640px) {
  .radial-center {
    width: 56px;
    height: 56px;
  }
}

/* 保留簡潔的 fade-in，去除藍紫 pulse 與光暈（違反色點稀有化／靜素原則） */
@keyframes radialFadeIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>