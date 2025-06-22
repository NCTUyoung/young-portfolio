<template>
  <!-- 放射型輪盤縮圖導航 -->
  <div v-if="viewerImages.length > 1"
       class="fixed bottom-8 transform -translate-x-1/2 z-30"
       :style="{
         left: showInfoPanel ? `calc(50% - ${infoPanelWidth / 2}px)` : '50%'
       }">
    <div class="relative">
      <!-- 放射型縮圖 -->
      <div class="relative">
        <button v-for="visibleImage in getVisibleRadialImages"
                :key="visibleImage.id"
                @click="selectRadialImage(visibleImage.originalIndex)"
                :style="{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '40px',
                  height: '40px',
                  transform: `translate(-50%, -50%) translate(${posMap[visibleImage.originalIndex]?.x || 0}px, ${posMap[visibleImage.originalIndex]?.y || 0}px)`,
                  opacity: visibleImage.originalIndex === currentImageIndex ? 1 : (isTransitioning && visibleImage.originalIndex === previousImageIndex ? 0 : 0.7),
                  zIndex: visibleImage.originalIndex === currentImageIndex ? 30 : 20,
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.3s ease'
                }"
                :class="[
                  'rounded-full border-2 overflow-hidden bg-gray-900 bg-opacity-90 hover:scale-110 transition-all duration-300 backdrop-blur-md',
                  visibleImage.originalIndex === currentImageIndex
                    ? 'border-white shadow-2xl shadow-blue-500/60 radial-nav-active'
                    : 'border-gray-500 hover:border-white hover:shadow-lg hover:shadow-white/30'
                ]"
                :title="`${visibleImage.title} (${visibleImage.originalIndex + 1}/${viewerImages.length})`">
          <!-- 縮圖圖片 -->
          <img :src="getImagePath(visibleImage.filename)" :alt="visibleImage.title" class="w-full h-full object-cover" />

          <!-- 當前圖片的特殊效果 -->
          <div v-if="visibleImage.originalIndex === currentImageIndex"
               class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 animate-pulse"></div>
        </button>
      </div>

      <!-- 中心控制按鈕 -->
      <button @click="handleCenterButtonClick" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black bg-opacity-80 backdrop-blur-md rounded-full border-2 border-white border-opacity-40 hover:border-opacity-70 hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center z-40">
        <div class="text-white text-xs font-medium leading-tight">
          <div>{{ currentImageIndex + 1 }}</div>
          <div class="text-gray-300">/{{ viewerImages.length }}</div>
        </div>
      </button>

      <!-- 圖片過多指示器 -->
      <div v-if="viewerImages.length > 7" class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs opacity-80">
        顯示 {{ getVisibleRadialImages.length }}/{{ viewerImages.length }}
      </div>

      <!-- 背景光暈 -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 scale-150 animate-pulse pointer-events-none w-20 h-20"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'

const imageViewerStore = useImageViewerStore()
const { getImagePath } = useImagePath()
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
/* ===== 放射型導航動畫 ===== */
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

@keyframes radialPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6), 0 0 20px rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0), 0 0 30px rgba(147, 51, 234, 0.6);
  }
}

@keyframes currentGlow {
  0%, 100% {
    filter: brightness(1) saturate(1);
  }
  50% {
    filter: brightness(1.2) saturate(1.3);
  }
}

.radial-nav-active {
  animation: radialPulse 2s infinite, currentGlow 1.5s ease-in-out infinite;
}
</style>