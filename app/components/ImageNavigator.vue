<template>
  <div
v-show="showNavigator && currentViewerImage"
       class="navigator-panel fixed z-40 select-none"
       :style="{
         left: navigatorX + 'px',
         top: navigatorY + 'px',
         transition: navigatorDragging ? 'none' : 'all 0.2s ease'
       }"
       @wheel.stop>
    <div
class="bg-stone-900/85 backdrop-blur-md border border-stone-700/60 p-2"
         :class="{ 'cursor-move': !navigatorDragging, 'cursor-grabbing': navigatorDragging }"
         @mousedown="handleNavigatorMouseDown">
      <div class="text-stone-300 text-[0.65rem] tracking-[0.3em] mb-2 px-1 flex items-center justify-between font-jp font-light">
        <span>導覽器</span>
        <svg class="w-3 h-3 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
        </svg>
      </div>
      <div ref="navigatorElement" class="relative w-32 h-32 overflow-hidden border border-stone-700/60">
        <!-- 導覽器縮圖 -->
        <img
v-if="currentViewerImage"
             ref="navigatorImageElement"
             :src="getThumbPath(currentViewerImage.filename, 400)"
             decoding="async"
             :alt="currentViewerImage.title"
             class="w-full h-full object-contain cursor-pointer"
             draggable="false"
             @click="handleNavigatorClick" >

        <!-- 可視區域指示框 — 墨色 accent，輕飽和 -->
        <div
v-if="navigatorViewport"
             class="absolute border border-accent-400/80 bg-accent-400/15 pointer-events-none"
             :style="{
               left: navigatorViewport.left + 'px',
               top: navigatorViewport.top + 'px',
               width: navigatorViewport.width + 'px',
               height: navigatorViewport.height + 'px'
             }"/>
      </div>

      <!-- 導覽器控制 -->
      <div class="flex items-center justify-between mt-2 text-xs text-stone-400 font-light">
        <span class="jp-kansuji">{{ Math.round(viewerScale * 100) }}%</span>
        <button
class="px-2 py-1 bg-stone-800/80 hover:bg-stone-700/70 border border-stone-700/60 text-stone-200 transition-colors"
                title="重置"
                @click="resetTransform">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'

const imageViewerStore = useImageViewerStore()
const { getThumbPath } = useImagePath()
const {
  showNavigator,
  navigatorDragging,
  navigatorX,
  navigatorY,
  currentViewerImage,
  viewerScale,
  viewerTranslateX,
  viewerTranslateY,
  showInfoPanel,
  infoPanelWidth,
} = storeToRefs(imageViewerStore)

const { resetTransform } = imageViewerStore

const navigatorElement = ref<HTMLDivElement>()
const navigatorImageElement = ref<HTMLImageElement>()

// 導覽器視窗計算
const navigatorViewport = computed(() => {
  if (!navigatorImageElement.value || viewerScale.value <= 1) return null

  const navImg = navigatorImageElement.value
  const navWidth = navImg.clientWidth
  const navHeight = navImg.clientHeight

  // 計算可視區域在導覽器中的位置和大小
  const viewportWidth = navWidth / viewerScale.value
  const viewportHeight = navHeight / viewerScale.value

  // 計算當前位移在導覽器中的對應位置
  const centerX = navWidth / 2
  const centerY = navHeight / 2
  const offsetX = -viewerTranslateX.value / viewerScale.value
  const offsetY = -viewerTranslateY.value / viewerScale.value

  const left = centerX + offsetX - viewportWidth / 2
  const top = centerY + offsetY - viewportHeight / 2

  return {
    left: Math.max(0, Math.min(left, navWidth - viewportWidth)),
    top: Math.max(0, Math.min(top, navHeight - viewportHeight)),
    width: viewportWidth,
    height: viewportHeight
  }
})

// 導覽器點擊處理
const handleNavigatorClick = (event: MouseEvent) => {
  if (!navigatorImageElement.value || navigatorDragging.value) return

  const rect = navigatorImageElement.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  const navWidth = navigatorImageElement.value.clientWidth
  const navHeight = navigatorImageElement.value.clientHeight

  // 將點擊位置轉換為圖片上的位置
  const centerX = navWidth / 2
  const centerY = navHeight / 2
  const offsetX = (clickX - centerX) * viewerScale.value
  const offsetY = (clickY - centerY) * viewerScale.value

  viewerTranslateX.value = -offsetX
  viewerTranslateY.value = -offsetY
}

// 導覽器拖拽處理
const handleNavigatorMouseDown = (event: MouseEvent) => {
  // 防止在圖片區域觸發拖拽
  if (event.target === navigatorImageElement.value) return

  event.preventDefault()
  event.stopPropagation()

  navigatorDragging.value = true
  const startX = event.clientX - navigatorX.value
  const startY = event.clientY - navigatorY.value

  let animationId: number | null = null

  const handleMouseMove = (e: MouseEvent) => {
    if (!navigatorDragging.value) return

    e.preventDefault()
    e.stopPropagation()

    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    animationId = requestAnimationFrame(() => {
      // 計算新位置，確保不超出螢幕邊界並避開資訊面板
      const newX = e.clientX - startX
      const newY = e.clientY - startY

      const desktop = window.matchMedia('(min-width: 768px)').matches
      const rightPanelOffset =
        showInfoPanel.value && desktop ? infoPanelWidth.value : 0
      const maxX = window.innerWidth - rightPanelOffset - 180 // 導覽器寬度 + 邊距
      const maxY = window.innerHeight - 200 // 導覽器高度 + 邊距

      navigatorX.value = Math.max(-20, Math.min(newX, maxX))
      navigatorY.value = Math.max(20, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    navigatorDragging.value = false

    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    document.removeEventListener('mousemove', handleMouseMove, { capture: true })
    document.removeEventListener('mouseup', handleMouseUp, { capture: true })
  }

  document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: false })
  document.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false })
}
</script>