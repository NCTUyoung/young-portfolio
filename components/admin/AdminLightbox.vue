<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
      @click.self="close"
    >
      <!-- 關閉按鈕 -->
      <button
        @click="close"
        class="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 圖片計數 -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-light tracking-widest">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>

      <!-- 上一張 -->
      <button
        v-if="images.length > 1"
        @click.stop="prev"
        class="absolute left-4 p-3 text-white/50 hover:text-white transition-colors group"
      >
        <svg class="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- 圖片主體 -->
      <div class="max-w-5xl max-h-[85vh] mx-16 flex flex-col items-center">
        <img
          v-if="currentImage"
          :src="getImagePath(currentImage.filename)"
          :alt="currentImage.title"
          class="max-w-full max-h-[75vh] object-contain rounded-lg select-none"
          @error="handleError"
        />
        <!-- 標題 -->
        <div v-if="currentImage" class="mt-4 text-center">
          <p class="text-white/80 text-sm font-light">{{ currentImage.title }}</p>
          <p v-if="currentImage.time" class="text-white/40 text-xs font-light mt-1">{{ currentImage.time }}</p>
        </div>
      </div>

      <!-- 下一張 -->
      <button
        v-if="images.length > 1"
        @click.stop="next"
        class="absolute right-4 p-3 text-white/50 hover:text-white transition-colors group"
      >
        <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface ImageItem {
  filename: string
  title: string
  time?: string
}

interface Props {
  isVisible: boolean
  images: ImageItem[]
  initialIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const emit = defineEmits<{ close: [] }>()

const { getImagePath } = useImagePath()
const currentIndex = ref(props.initialIndex)

watch(() => props.initialIndex, (val) => { currentIndex.value = val })
watch(() => props.isVisible, (val) => { if (val) currentIndex.value = props.initialIndex })

const currentImage = computed(() => props.images[currentIndex.value] || null)

const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % props.images.length
}

const close = () => emit('close')

const handleError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none'
}

// 鍵盤操作
onMounted(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (!props.isVisible) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }
  document.addEventListener('keydown', handleKey)
  onUnmounted(() => document.removeEventListener('keydown', handleKey))
})
</script>
