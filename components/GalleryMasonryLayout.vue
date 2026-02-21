<template>
  <div class="row-gallery-container">
    <!-- Desktop Row Layout -->
    <div class="hidden md:block space-y-4">
      <div
        v-for="(row, rowIndex) in imageRows"
        :key="row.key"
        class="gallery-row flex gap-4 relative"
        :class="{ 'justify-center': row.items.length === 1 }"
        :style="{ transitionDelay: `${rowIndex * 80}ms` }"
      >
        <!-- Skeleton overlay -->
        <div
          v-if="!rowsLoaded[row.key]"
          class="absolute inset-0 rounded-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-stone-700 dark:via-stone-800 dark:to-stone-700 animate-pulse pointer-events-none z-10"
        />

        <div
          v-for="(item, itemIndex) in row.items"
          :key="item.filename"
          :class="[
            'gallery-item relative cursor-pointer group rounded-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out overflow-hidden z-20',
            rowsLoaded[row.key] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          ]"
          :style="{
            flex: row.items.length === 1 ? '0 0 auto' : `${item.flex} 1 0`,
            maxWidth: row.items.length === 1 ? getSingleItemMaxWidth(item.aspectRatio) : undefined,
            transitionDelay: `${(rowIndex * row.items.length + itemIndex) * 50}ms`
          }"
          @click="$emit('imageClick', item, sortedItems)"
        >
          <img
            :src="getImagePath(item.filename)"
            :alt="item.title"
            class="w-full h-auto block rounded-sm transition-all duration-500 ease-out"
            :loading="rowIndex < 3 ? 'eager' : 'lazy'"
            @load="(e) => onImageLoad(e, row.key, itemIndex)"
            @error="() => onImageError(row.key, itemIndex)"
          >
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-end justify-start p-4 rounded-sm">
            <div class="text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out delay-100">
              <h3 class="text-lg font-light mb-1 drop-shadow-lg">{{ item.title }}</h3>
              <p class="text-sm opacity-90 drop-shadow-md">{{ item.time }}</p>
              <div v-if="item.color" class="flex items-center gap-2 mt-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-200">
                <div :class="`w-3 h-3 rounded-full bg-${item.color}-500 shadow-lg`"/>
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
          class="cursor-pointer active:scale-95 transition-transform duration-200"
          @click="$emit('imageClick', item, sortedItems)"
        >
          <img
            :src="getImagePath(item.filename)"
            :alt="item.title"
            class="w-full h-auto rounded-sm"
            loading="lazy"
          >
          <div class="mt-2">
            <h4 class="text-sm font-light text-stone-700 dark:text-stone-300 line-clamp-1">{{ item.title }}</h4>
            <p class="text-xs text-stone-400 dark:text-stone-500">{{ item.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, watch } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem } from '~/types/gallery'

const props = defineProps<{
  items: GalleryItem[]
  gap?: number
  maxRowAspectRatio?: number
}>()

// 使用傳入的 items（應該已經按時間排序）
const sortedItems = computed(() => props.items)

defineEmits<{
  imageClick: [item: GalleryItem, items: GalleryItem[]]
}>()

const { getImagePath } = useImagePath()

// 狀態
const rowsLoaded = ref<Record<string, boolean>>({})
const loadedImages = ref<Record<string, boolean>>({})
const maxRowAspectRatio = computed(() => props.maxRowAspectRatio || 6) // 一行的最大寬高比總和

// 圖片數據接口
interface ImageWithAspectRatio extends GalleryItem {
  aspectRatio: number
  flex: number
  loaded: boolean
}

interface ImageRow {
  key: string
  items: ImageWithAspectRatio[]
}

// 存儲實際的圖片長寬比
const imageAspectRatios = ref<Record<string, number>>({})

// 單張圖片獨佔一行時，根據比例限制最大寬度，避免直式照片撐滿整行
const getSingleItemMaxWidth = (aspectRatio: number): string => {
  if (aspectRatio < 0.8) return '40%'   // 直式 → 最多佔 40%
  if (aspectRatio < 1.2) return '55%'   // 方形 → 最多佔 55%
  if (aspectRatio < 1.8) return '70%'   // 一般橫式 → 最多佔 70%
  return '85%'                           // 超寬 → 最多佔 85%
}

// 預設長寬比（當圖片還沒載入時）
const getAspectRatio = (item: GalleryItem) => {
  // 優先使用已載入的真實長寬比
  const storedRatio = imageAspectRatios.value[item.filename]
  if (storedRatio) {
    return storedRatio
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

// 將一組圖片按順序填入行
const buildRowsFromBucket = (images: ImageWithAspectRatio[], maxAR: number): ImageRow[] => {
  const rows: ImageRow[] = []
  let currentRow: ImageWithAspectRatio[] = []
  let currentRowAR = 0

  for (const img of images) {
    const newAR = currentRowAR + img.aspectRatio
    const shouldStartNewRow =
      currentRow.length >= 3 ||
      (currentRow.length >= 1 && newAR > maxAR)

    if (shouldStartNewRow && currentRow.length > 0) {
      rows.push({
        key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
        items: [...currentRow]
      })
      currentRow = [img]
      currentRowAR = img.aspectRatio
    } else {
      currentRow.push(img)
      currentRowAR = newAR
    }
  }

  // 最後一行：如果只剩 1 張，嘗試併入前一行
  if (currentRow.length === 1 && rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    if (lastRow.items.length < 4) {
      lastRow.items.push(currentRow[0])
      lastRow.key = lastRow.items.map(i => i.filename).join('|')
    } else {
      rows.push({
        key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
        items: currentRow
      })
    }
  } else if (currentRow.length > 0) {
    rows.push({
      key: currentRow.map(i => i.filename).join('|') || `row-${rows.length}`,
      items: currentRow
    })
  }

  return rows
}

// 計算圖片行佈局 — 按比例分組，避免直式和橫式混排造成尺寸差異過大
const imageRows = computed(() => {
  if (!sortedItems.value.length) return []

  // 1. 計算所有圖片的比例
  const allImages: ImageWithAspectRatio[] = sortedItems.value.map(item => {
    const aspectRatio = getAspectRatio(item)
    return {
      ...item,
      aspectRatio,
      flex: aspectRatio,
      loaded: !!imageAspectRatios.value[item.filename]
    }
  })

  // 2. 分成直式（AR < 1.0）和橫式（AR >= 1.0）兩組
  const portraits = allImages.filter(img => img.aspectRatio < 1.0)
  const landscapes = allImages.filter(img => img.aspectRatio >= 1.0)

  // 3. 分別建行 — 直式用較低的 maxAR（因為直式圖比較窄，一行可以放更多）
  const landscapeRows = buildRowsFromBucket(landscapes, maxRowAspectRatio.value)
  const portraitRows = buildRowsFromBucket(portraits, maxRowAspectRatio.value)

  // 4. 交錯合併：橫式行和直式行交替出現
  const merged: ImageRow[] = []
  let li = 0, pi = 0
  while (li < landscapeRows.length || pi < portraitRows.length) {
    // 每次先放 2 行橫式，再放 1 行直式，保持視覺節奏
    for (let n = 0; n < 2 && li < landscapeRows.length; n++) {
      merged.push(landscapeRows[li++])
    }
    if (pi < portraitRows.length) {
      merged.push(portraitRows[pi++])
    }
  }

  return merged
})

// 圖片載入完成
// 注意：這裡不再根據實際長寬比重新計算佈局，避免載入過程中整個瀑布流重新排版造成閃爍
const onImageLoad = (event: Event, rowKey: string, itemIndex: number) => {
  const img = event.target as HTMLImageElement
  const row = imageRows.value.find(row => row.key === rowKey)

  if (!row) return

  // 獲取真實的長寬比
  if (img.naturalWidth && img.naturalHeight) {
    const realAspectRatio = img.naturalWidth / img.naturalHeight
    const item = row.items[itemIndex]

    if (item) {
      const previousRatio = imageAspectRatios.value[item.filename]
      if (!previousRatio || Math.abs(previousRatio - realAspectRatio) > 0.05) {
        imageAspectRatios.value = {
          ...imageAspectRatios.value,
          [item.filename]: realAspectRatio
        }
      }

      markImageLoaded(item.filename)
      maybeMarkRowReady(row.key)
    }
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

const onImageError = (rowKey: string, itemIndex: number) => {
  const row = imageRows.value.find(row => row.key === rowKey)
  if (!row) return
  const item = row.items[itemIndex]
  if (item) {
    markImageLoaded(item.filename)
    maybeMarkRowReady(row.key)
  }
}

const markImageLoaded = (filename: string) => {
  if (loadedImages.value[filename]) return
  loadedImages.value = {
    ...loadedImages.value,
    [filename]: true
  }
}

const maybeMarkRowReady = (rowKey: string) => {
  if (rowsLoaded.value[rowKey]) return
  const row = imageRows.value.find(row => row.key === rowKey)
  if (!row) return
  const ready = row.items.every(item => loadedImages.value[item.filename])
  if (ready) {
    rowsLoaded.value = {
      ...rowsLoaded.value,
      [row.key]: true
    }
  }
}

// 強制重新計算佈局（用於篩選器變化時）
const forceRelayout = async () => {
  resetLayout()
  await nextTick()
  await nextTick()
}

// 重置佈局狀態
const resetLayout = () => {
  rowsLoaded.value = {}
  loadedImages.value = {}
}

// 監聽數據變化
watch(() => sortedItems.value, (newItems, oldItems) => {
  if (newItems.length !== oldItems?.length ||
      newItems.some((item, index) => item.filename !== oldItems[index]?.filename)) {
    // 清除舊的長寬比數據
    imageAspectRatios.value = {}
    forceRelayout()
  }
}, { immediate: false })

watch(() => props.items, () => {
  imageAspectRatios.value = {}
  forceRelayout()
}, { deep: true })

onMounted(() => {
  resetLayout()
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