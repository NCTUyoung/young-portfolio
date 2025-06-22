<template>
    <div
    ref="cardRef"
    class="group hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="openImageViewer"
    :style="{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }"
  >
    <!-- Image -->
    <div class="relative overflow-hidden rounded-lg border border-gray-100" :class="imageClass">
      <!-- 懶載入的圖片 -->
      <img
        v-if="isVisible"
        :src="getImagePath(image.filename)"
        :alt="image.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 載入佔位符 -->
      <div
        v-else-if="!imageLoaded"
        class="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"
      >
        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
        </svg>
      </div>

      <!-- 載入錯誤佔位符 -->
      <div
        v-else-if="imageError"
        class="w-full h-full bg-red-50 flex items-center justify-center"
      >
        <div class="text-center">
          <svg class="w-8 h-8 text-red-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-xs text-red-600">載入失敗</p>
        </div>
      </div>

      <!-- Category Badge -->
      <div class="absolute top-4 right-4" v-if="isVisible">
        <span v-if="primaryTag"
              class="px-2 py-1 text-xs font-light border border-gray-200 text-gray-600 rounded bg-white/90 backdrop-blur-sm">
          {{ primaryTag }}
        </span>
        <span v-else
              class="px-3 py-1 rounded-full text-xs font-light bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm border border-gray-100">
          {{ image.category === 'digital' ? '繪圖' : '攝影' }}
        </span>
      </div>

      <!-- Mobile Event Badge -->
      <div v-if="image.event && isVisible" class="absolute top-4 left-4 md:hidden">
        <span class="px-2 py-1 rounded text-xs font-light bg-gray-800/80 text-white">
          {{ image.event.name }}
        </span>
      </div>

      <!-- 滑鼠位置指示器 (僅在 hover 時顯示) -->
      <div
        v-if="isHovered && mouseX !== null && mouseY !== null"
        class="absolute pointer-events-none transition-opacity duration-200"
        :style="{
          left: `${mouseX}px`,
          top: `${mouseY}px`,
          transform: 'translate(-50%, -50%)'
        }"
      >
        <div class="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
      </div>
    </div>

    <!-- Info -->
    <div class="p-6 bg-white/80 backdrop-blur-sm mt-2 rounded-lg border border-gray-100">
      <!-- Title -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-light text-gray-800 tracking-wide">
          {{ displayTitle }}
        </h3>

        <!-- 複製連結按鈕 -->
        <button
          @click="copyImageUrl"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
          :title="copied ? '已複製！' : '複製圖片連結'"
        >
          <svg v-if="!copied" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </button>
      </div>

      <!-- Photography EXIF Info -->
      <div v-if="image.category === 'photography' && image.camera">
        <!-- Camera Info -->
        <div class="flex items-center text-sm text-gray-500 mb-4 font-light">
          <svg class="w-4 h-4 mr-2 opacity-60" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
          </svg>
          <span>{{ cameraName }}</span>
        </div>

        <!-- Technical Parameters -->
        <div class="grid grid-cols-4 gap-4 text-xs border-t border-gray-100 pt-4">
          <div v-if="image.focalLength" class="text-center">
            <div class="text-gray-400 mb-1 font-light">焦距</div>
            <div class="font-medium text-gray-700">{{ image.focalLength }}mm</div>
          </div>
          <div v-if="image.aperture" class="text-center">
            <div class="text-gray-400 mb-1 font-light">光圈</div>
            <div class="font-medium text-gray-700">f/{{ image.aperture }}</div>
          </div>
          <div v-if="image.iso" class="text-center">
            <div class="text-gray-400 mb-1 font-light">ISO</div>
            <div class="font-medium text-gray-700">{{ image.iso }}</div>
          </div>
          <div v-if="image.shutterSpeed" class="text-center">
            <div class="text-gray-400 mb-1 font-light">快門</div>
            <div class="font-medium text-gray-700">{{ shutterSpeedText }}</div>
          </div>
        </div>
      </div>

      <!-- Description for digital art -->
      <div v-else class="border-t border-gray-100 pt-4">
        <p class="text-gray-600 text-sm leading-relaxed font-light">{{ image.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGalleryStore } from '~/stores/gallery'
import type { GalleryItem } from '~/types/gallery'
import { useIntersectionObserver, useMouse, useClipboard } from '@vueuse/core'
import { useGlobalToast } from '~/composables/useToast'

interface Props {
  image: GalleryItem
  index?: number
}

interface Emits {
  (e: 'openViewer', image: GalleryItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const galleryStore = useGalleryStore()

// Refs
const cardRef = ref<HTMLElement>()
const imageLoaded = ref(false)
const imageError = ref(false)
const isHovered = ref(false)

// VueUse composables
const { stop } = useIntersectionObserver(
  cardRef,
  ([{ isIntersecting }]) => {
    isVisible.value = isIntersecting
  },
  {
    threshold: 0.1,
  }
)

const isVisible = ref(false)

const { x: mouseX, y: mouseY } = useMouse({ target: cardRef })
const { copy, copied } = useClipboard()
const { getImagePath, getFullImageUrl } = useImagePath()

// 3D tilt effect
const rotateX = ref(0)
const rotateY = ref(0)

// Computed properties
const displayTitle = computed(() =>
  galleryStore.getDisplayTitle(props.image)
)

const primaryTag = computed(() =>
  galleryStore.getPrimaryTag(props.image)
)

const cameraName = computed(() =>
  props.image.camera && props.image.model
    ? galleryStore.formatCameraName(props.image.camera, props.image.model)
    : ''
)

const shutterSpeedText = computed(() =>
  props.image.shutterSpeed
    ? galleryStore.formatShutterSpeed(props.image.shutterSpeed)
    : ''
)

const imageClass = computed(() =>
  props.index !== undefined
    ? galleryStore.getImageClass(props.index)
    : 'h-64'
)

// Methods
const onImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

const onImageError = () => {
  imageError.value = true
  imageLoaded.value = false
}

const onMouseEnter = (event: MouseEvent) => {
  isHovered.value = true
  const rect = cardRef.value?.getBoundingClientRect()
  if (rect) {
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rotateXValue = (event.clientY - centerY) / 10
    const rotateYValue = (centerX - event.clientX) / 10

    rotateX.value = Math.max(-10, Math.min(10, rotateXValue))
    rotateY.value = Math.max(-10, Math.min(10, rotateYValue))
  }
}

const onMouseLeave = () => {
  isHovered.value = false
  rotateX.value = 0
  rotateY.value = 0
}

const toast = useGlobalToast()

const copyImageUrl = async (event: Event) => {
  event.stopPropagation() // 防止觸發圖片檢視器

  try {
    const imageUrl = getFullImageUrl(props.image.filename)
    await copy(imageUrl)

    // 顯示成功通知
    toast.success('連結已複製！', '圖片連結已複製到剪貼簿')
  } catch (error) {
    // 顯示錯誤通知
    toast.error('複製失敗', '無法複製連結到剪貼簿')
  }
}

const openImageViewer = () => {
  // 這裡我們需要發送事件給父元件來開啟圖片檢視器
  // 因為圖片檢視器需要所有圖片的列表
  emit('openViewer', props.image)
}
</script>