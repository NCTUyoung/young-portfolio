<template>
  <div class="row-gallery-container">
    <!-- Desktop Row Layout -->
    <div class="hidden md:block space-y-4">
      <div
        v-for="(row, rowIndex) in imageRows"
        :key="`row-${rowIndex}-${layoutKey}`"
        class="gallery-row flex gap-4"
        :style="{
          transitionDelay: `${rowIndex * 100}ms`,
          opacity: rowsLoaded[rowIndex] ? 1 : 0
        }"
      >
        <div
          v-for="(item, itemIndex) in row.items"
          :key="item.filename"
          @click="$emit('imageClick', item, sortedItems)"
          class="gallery-item relative cursor-pointer group rounded-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out overflow-hidden"
          :style="{
            flex: `${item.flex} 1 0`,
            transitionDelay: `${(rowIndex * row.items.length + itemIndex) * 50}ms`
          }"
        >
          <img
            :src="getImagePath(item.filename)"
            :alt="item.title"
            class="w-full h-auto block rounded-sm transition-all duration-500 ease-out"
            :loading="rowIndex < 3 ? 'eager' : 'lazy'"
            @load="(e) => onImageLoad(e, rowIndex, itemIndex)"
          >
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-end justify-start p-4 rounded-sm">
            <div class="text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out delay-100">
              <h3 class="text-lg font-light mb-1 drop-shadow-lg">{{ item.title }}</h3>
              <p class="text-sm opacity-90 drop-shadow-md">{{ item.time }}</p>
              <div v-if="item.color" class="flex items-center gap-2 mt-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-200">
                <div :class="`w-3 h-3 rounded-full bg-${item.color}-500 shadow-lg`"></div>
                <span class="text-xs opacity-80 capitalize drop-shadow-sm">{{ item.color }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Grid Layout -->
    <div class="md:hidden">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in sortedItems"
          :key="item.filename"
          @click="$emit('imageClick', item, sortedItems)"
          class="cursor-pointer active:scale-95 transition-transform duration-200"
        >
          <img
            :src="getImagePath(item.filename)"
            :alt="item.title"
            class="w-full h-auto rounded-sm"
            loading="lazy"
          >
          <div class="mt-2">
            <h4 class="text-sm font-light text-stone-700 line-clamp-1">{{ item.title }}</h4>
            <p class="text-xs text-stone-400">{{ item.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem } from '~/stores/gallery'

const props = defineProps<{
  items: GalleryItem[]
  gap?: number
  maxRowAspectRatio?: number
}>()

// 使用傳入的 items（應該已經按時間排序）
const sortedItems = computed(() => props.items)

const emit = defineEmits<{
  imageClick: [item: GalleryItem, items: GalleryItem[]]
}>()

const { getImagePath } = useImagePath()

// 狀態
const layoutKey = ref(0)
const rowsLoaded = ref<boolean[]>([])
const gap = computed(() => props.gap || 16)
const maxRowAspectRatio = computed(() => props.maxRowAspectRatio || 6) // 一行的最大寬高比總和

// 圖片數據接口
interface ImageWithAspectRatio extends GalleryItem {
  aspectRatio: number
  flex: number
  loaded: boolean
}

interface ImageRow {
  items: ImageWithAspectRatio[]
}

// 存儲實際的圖片長寬比
const imageAspectRatios = ref<Map<string, number>>(new Map())

// 計算圖片行佈局
const imageRows = computed(() => {
  if (!sortedItems.value.length) return []

  const rows: ImageRow[] = []
  let currentRow: ImageWithAspectRatio[] = []
  let currentRowAspectRatio = 0

  // 預設長寬比（當圖片還沒載入時）
  const getAspectRatio = (item: GalleryItem) => {
    // 優先使用已載入的真實長寬比
    if (imageAspectRatios.value.has(item.filename)) {
      return imageAspectRatios.value.get(item.filename)!
    }

    // 根據檔案名稱猜測長寬比
    const filename = item.filename.toLowerCase()
    if (filename.includes('portrait') || filename.includes('vertical')) {
      return 0.75 // 豎圖
    } else if (filename.includes('panorama') || filename.includes('wide')) {
      return 2.5 // 超寬圖
    } else {
      return 1.5 // 一般橫圖
    }
  }

  for (let i = 0; i < sortedItems.value.length; i++) {
    const item = sortedItems.value[i]
    const aspectRatio = getAspectRatio(item)

    const imageWithRatio: ImageWithAspectRatio = {
      ...item,
      aspectRatio,
      flex: aspectRatio,
      loaded: imageAspectRatios.value.has(item.filename)
    }

    // 計算如果加入這張圖片，當前行的總長寬比
    const newRowAspectRatio = currentRowAspectRatio + aspectRatio

    // 決定是否開始新行
    const shouldStartNewRow =
      currentRow.length >= 3 || // 最多3張圖片
      (currentRow.length >= 1 && newRowAspectRatio > maxRowAspectRatio.value)

    if (shouldStartNewRow && currentRow.length > 0) {
      // 完成當前行
      rows.push({ items: [...currentRow] })
      currentRow = [imageWithRatio]
      currentRowAspectRatio = aspectRatio
    } else {
      // 添加到當前行
      currentRow.push(imageWithRatio)
      currentRowAspectRatio = newRowAspectRatio
    }
  }

  // 處理最後一行
  if (currentRow.length > 0) {
    rows.push({ items: currentRow })
  }

  return rows
})

// 圖片載入完成
const onImageLoad = async (event: Event, rowIndex: number, itemIndex: number) => {
  const img = event.target as HTMLImageElement

  // 獲取真實的長寬比
  if (img.naturalWidth && img.naturalHeight) {
    const realAspectRatio = img.naturalWidth / img.naturalHeight
    const item = imageRows.value[rowIndex]?.items[itemIndex]

    if (item) {
      // 存儲真實長寬比
      imageAspectRatios.value.set(item.filename, realAspectRatio)

      // 如果與預估差異較大，觸發重新計算
      if (Math.abs(item.aspectRatio - realAspectRatio) > 0.1) {
        // 強制重新計算佈局
        layoutKey.value++
      }
    }
  }

  // 標記行已載入
  if (!rowsLoaded.value[rowIndex]) {
    rowsLoaded.value[rowIndex] = true
  }

  // 添加載入動畫
  img.style.opacity = '0'
  img.style.transform = 'scale(0.95)'

  setTimeout(() => {
    img.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
    img.style.opacity = '1'
    img.style.transform = 'scale(1)'
  }, 50)
}

// 強制重新計算佈局（用於篩選器變化時）
const forceRelayout = async () => {
  resetLayout()
  await nextTick()
  await nextTick()
}

// 重置佈局狀態
const resetLayout = () => {
  rowsLoaded.value = new Array(imageRows.value.length).fill(false)
  layoutKey.value++ // 強制重新渲染
}

// 監聽數據變化
watch(() => sortedItems.value, (newItems, oldItems) => {
  if (newItems.length !== oldItems?.length ||
      newItems.some((item, index) => item.filename !== oldItems[index]?.filename)) {
    // 清除舊的長寬比數據
    imageAspectRatios.value.clear()
    forceRelayout()
  }
}, { immediate: false })

watch(() => props.items, () => {
  forceRelayout()
}, { deep: true })

onMounted(() => {
  resetLayout()

  // 初始化行載入狀態
  setTimeout(() => {
    rowsLoaded.value = new Array(imageRows.value.length).fill(false)
    // 逐行顯示動畫
    imageRows.value.forEach((_, index) => {
      setTimeout(() => {
        rowsLoaded.value[index] = true
      }, index * 150)
    })
  }, 100)
})
</script>

<style scoped>
.row-gallery-container {
  width: 100%;
}

.gallery-row {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transform: translateY(0);
}

.gallery-item {
  min-width: 0; /* 允許 flex 項目縮小 */
}

.gallery-item img {
  display: block;
  width: 100%;
  height: auto;
}
</style>